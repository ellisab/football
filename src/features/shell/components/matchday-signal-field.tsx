"use client";

import { useEffect, useRef } from "react";

const TOUCH_TAP_TOLERANCE = 10;
const SHADER_REVISION = "soft-glass-v11";

const shader = /* wgsl */ `
struct SignalUniforms {
  display: vec4f,
  pointer: vec4f,
  material: vec4f,
}

@group(0) @binding(0) var<uniform> u: SignalUniforms;

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  var positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0)
  );
  return vec4f(positions[vertexIndex], 0.0, 1.0);
}

fn softCircle(distance: f32, radius: f32, feather: f32) -> f32 {
  return 1.0 - smoothstep(radius - feather, radius + feather, distance);
}

fn softBand(distance: f32, radius: f32, width: f32) -> f32 {
  return 1.0 - smoothstep(width, width + 2.0 * u.display.x, abs(distance - radius));
}

@fragment
fn fragmentMain(@builtin(position) fragment: vec4f) -> @location(0) vec4f {
  let q = fragment.xy - u.pointer.xy;
  let distance = length(q);
  let dpr = u.display.x;
  let touch = u.material.x;
  let live = u.material.y;
  let interactive = u.material.z;
  let pressed = u.material.w;
  let visibility = u.pointer.z;
  let energy = clamp(u.pointer.w, 0.0, 1.0);
  let age = 1.0 - energy;
  let releaseCurve = 1.0 - pow(1.0 - age, 3.0);

  let compactRadius = mix(21.0, 24.0, touch) * dpr;
  let releasedRadius = mix(58.0, 52.0, touch) * dpr;
  let radius = mix(
    mix(compactRadius, releasedRadius, releaseCurve),
    compactRadius * 0.92,
    pressed
  );
  let feather = mix(8.0, 10.0, touch) * dpr;

  let lens = softCircle(distance, radius, feather);
  let interior = softCircle(distance, radius * 0.68, radius * 0.28);
  let rim = softBand(distance, radius, mix(2.8, 3.4, touch) * dpr);
  let upperHighlight = softCircle(
    length(q - vec2f(-0.22 * radius, -0.28 * radius)),
    radius * 0.23,
    radius * 0.2
  );
  let lowerShade = softBand(
    length(q - vec2f(0.08 * radius, 0.12 * radius)),
    radius * 0.82,
    radius * 0.12
  ) * smoothstep(-0.15 * radius, 0.72 * radius, q.y);

  let warmWhite = vec3f(0.995, 0.988, 0.955);
  let graphite = vec3f(0.145, 0.15, 0.137);
  let coral = vec3f(0.784, 0.169, 0.227);
  let accent = mix(graphite, coral, live);
  let accentAmount = rim * mix(0.38, 0.58, live);
  let shadeAmount = lowerShade * mix(0.12, 0.2, interactive);
  let signalColor = mix(
    mix(warmWhite, graphite, shadeAmount),
    accent,
    accentAmount
  );

  let material =
    lens * 0.035 +
    interior * 0.045 +
    upperHighlight * mix(0.16, 0.2, interactive) +
    lowerShade * 0.055 +
    rim * mix(0.22, 0.3, interactive);
  let pressWeight = mix(1.0, 0.68, pressed);
  let fade = pow(energy, 1.15) * pressWeight;

  return vec4f(signalColor, visibility * material * fade);
}
`;

const getInteractiveState = (target: EventTarget | null) => {
  if (!(target instanceof Element)) {
    return { interactive: 0, live: 0 };
  }

  const interactive = target.closest(
    "a, button, input, select, textarea, [role='button']",
  );
  const match = target.closest(".featured-match");
  const live = match?.querySelector("[data-status='live']");

  return {
    interactive: interactive ? 1 : 0,
    live: live ? 1 : 0,
  };
};

export function MatchdaySignalField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gpu = navigator.gpu;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!canvas || !gpu || reducedMotion.matches) return;
    let cancelled = false;
    let animationFrame = 0;
    let touchFadeTimer = 0;
    let context: GPUCanvasContext | null = null;
    let device: GPUDevice | null = null;
    let pipeline: GPURenderPipeline | null = null;
    let bindGroup: GPUBindGroup | null = null;
    let uniformBuffer: GPUBuffer | null = null;
    let pixelRatio = 1;
    let lastFrame = performance.now();
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let targetVisibility = 0;
    let visibility = 0;
    let impulse = 0;
    let touch = 0;
    let interactive = 0;
    let live = 0;
    let pressed = 0;
    let activeTouchPointerId: number | null = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;

    const uniforms = new Float32Array(12);

    const resize = () => {
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        coarsePointer ? 1 : 1.5,
      );
      canvas.width = Math.max(1, Math.floor(window.innerWidth * pixelRatio));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * pixelRatio));
    };

    const draw = (now: number) => {
      if (
        cancelled ||
        !context ||
        !device ||
        !pipeline ||
        !bindGroup ||
        !uniformBuffer
      ) {
        return;
      }
      animationFrame = 0;

      const elapsed = Math.min((now - lastFrame) / 16.667, 2.5);
      lastFrame = now;
      visibility +=
        (targetVisibility - visibility) * Math.min(0.22 * elapsed, 0.65);
      impulse *= 0.86 ** elapsed;

      uniforms.set([
        pixelRatio,
        0,
        0,
        0,
        pointerX * pixelRatio,
        pointerY * pixelRatio,
        visibility,
        impulse,
        touch,
        live,
        interactive,
        pressed,
      ]);
      device.queue.writeBuffer(uniformBuffer, 0, uniforms);

      const encoder = device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
            loadOp: "clear",
            storeOp: "store",
            view: context.getCurrentTexture().createView(),
          },
        ],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(3);
      pass.end();
      device.queue.submit([encoder.finish()]);

      if (impulse > 0.002) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const startAnimation = () => {
      if (animationFrame) return;
      lastFrame = performance.now();
      animationFrame = window.requestAnimationFrame(draw);
    };

    const updatePointer = (event: PointerEvent) => {
      const isTouch = event.pointerType === "touch";
      pointerX = event.clientX;
      pointerY = event.clientY;
      touch = isTouch ? 1 : 0;
      const targetState = getInteractiveState(event.target);
      interactive = targetState.interactive;
      live = targetState.live;

      if (!isTouch) targetVisibility = 1;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (
        event.pointerType === "touch" &&
        event.pointerId === activeTouchPointerId &&
        Math.hypot(event.clientX - touchStartX, event.clientY - touchStartY) >
          TOUCH_TAP_TOLERANCE
      ) {
        touchMoved = true;
      }

      updatePointer(event);
    };

    const onPointerDown = (event: PointerEvent) => {
      window.clearTimeout(touchFadeTimer);
      updatePointer(event);

      if (event.pointerType === "touch") {
        activeTouchPointerId = event.pointerId;
        touchStartX = event.clientX;
        touchStartY = event.clientY;
        touchMoved = false;
        targetVisibility = 0;
        impulse = 0;
        startAnimation();
        return;
      }

      pressed = 1;
      targetVisibility = 1;
      impulse = 1;
      startAnimation();
    };

    const onPointerUp = (event: PointerEvent) => {
      updatePointer(event);
      pressed = 0;

      if (event.pointerType === "touch") {
        if (event.pointerId !== activeTouchPointerId) return;

        const wasTap =
          !touchMoved &&
          Math.hypot(
            event.clientX - touchStartX,
            event.clientY - touchStartY,
          ) <= TOUCH_TAP_TOLERANCE;
        activeTouchPointerId = null;
        touchMoved = false;

        if (!wasTap) {
          targetVisibility = 0;
          interactive = 0;
          live = 0;
          impulse = 0;
          startAnimation();
          return;
        }

        targetVisibility = 1;
      }

      impulse = 1;
      startAnimation();
      if (event.pointerType === "touch") {
        touchFadeTimer = window.setTimeout(() => {
          targetVisibility = 0;
          interactive = 0;
          live = 0;
        }, 180);
      }
    };

    const onPointerCancel = (event: PointerEvent) => {
      if (event.pointerType !== "touch") {
        pressed = 0;
        targetVisibility = 0;
        impulse = 0;
        startAnimation();
        return;
      }

      if (event.pointerId !== activeTouchPointerId) {
        return;
      }

      activeTouchPointerId = null;
      touchMoved = false;
      pressed = 0;
      targetVisibility = 0;
      interactive = 0;
      live = 0;
      impulse = 0;
      startAnimation();
    };

    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null && event.pointerType !== "touch") {
        pressed = 0;
        targetVisibility = 0;
        interactive = 0;
        live = 0;
      }
    };

    const onScroll = () => {
      if (activeTouchPointerId !== null) {
        touchMoved = true;
        targetVisibility = 0;
        impulse = 0;
        startAnimation();
      }
    };

    const initialize = async () => {
      const adapter = await gpu.requestAdapter();
      if (!adapter || cancelled) return;

      const nextDevice = await adapter.requestDevice();
      if (cancelled) return;

      const nextContext = canvas.getContext(
        "webgpu",
      ) as GPUCanvasContext | null;
      if (!nextContext) return;

      const format = gpu.getPreferredCanvasFormat();
      nextContext.configure({
        alphaMode: "premultiplied",
        device: nextDevice,
        format,
      });

      const module = nextDevice.createShaderModule({ code: shader });
      const nextPipeline = await nextDevice.createRenderPipelineAsync({
        fragment: {
          entryPoint: "fragmentMain",
          module,
          targets: [
            {
              blend: {
                alpha: { dstFactor: "one-minus-src-alpha", srcFactor: "one" },
                color: {
                  dstFactor: "one-minus-src-alpha",
                  srcFactor: "src-alpha",
                },
              },
              format,
            },
          ],
        },
        layout: "auto",
        primitive: { topology: "triangle-list" },
        vertex: { entryPoint: "vertexMain", module },
      });
      if (cancelled) return;
      const nextUniformBuffer = nextDevice.createBuffer({
        size: uniforms.byteLength,
        usage: 0x40 | 0x08,
      });
      const nextBindGroup = nextDevice.createBindGroup({
        entries: [{ binding: 0, resource: { buffer: nextUniformBuffer } }],
        layout: nextPipeline.getBindGroupLayout(0),
      });
      context = nextContext;
      device = nextDevice;
      pipeline = nextPipeline;
      uniformBuffer = nextUniformBuffer;
      bindGroup = nextBindGroup;

      resize();
      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      window.addEventListener("pointerup", onPointerUp, { passive: true });
      window.addEventListener("pointercancel", onPointerCancel, {
        passive: true,
      });
      window.addEventListener("pointerout", onPointerOut, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
    };

    initialize().catch(() => {
      canvas.dataset.unavailable = "true";
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(touchFadeTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      className="matchday-signal-field"
      data-shader-revision={SHADER_REVISION}
      ref={canvasRef}
    />
  );
}

export function MatchdayClickEffect() {
  return <MatchdaySignalField />;
}
