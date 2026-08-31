"use client";

import { useEffect, useRef } from "react";

const shader = /* wgsl */ `
struct SignalUniforms {
  viewport: vec4f,
  pointer: vec4f,
  motion: vec4f,
  state: vec4f,
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

fn band(distance: f32, radius: f32, width: f32) -> f32 {
  return 1.0 - smoothstep(width, width + 1.35 * u.viewport.z, abs(distance - radius));
}

@fragment
fn fragmentMain(@builtin(position) fragment: vec4f) -> @location(0) vec4f {
  let q = fragment.xy - u.pointer.xy;
  let distance = length(q);
  let dpr = u.viewport.z;
  let touch = u.motion.z;
  let visibility = u.pointer.z * u.state.z;
  let clickOrigin = mix(10.2, 12.9, touch) * dpr;
  let graphite = vec3f(0.145, 0.15, 0.137);
  let coral = vec3f(0.784, 0.169, 0.227);
  let signalColor = mix(graphite, coral, u.motion.w);

  let impulseAge = 1.0 - u.pointer.w;
  let impulseRadius = (clickOrigin / dpr + 15.0 + impulseAge * mix(97.5, 60.0, touch)) * dpr;
  let impulse = band(distance, impulseRadius, mix(1.35, 2.1, touch) * dpr)
    * u.pointer.w * u.pointer.w;

  return vec4f(signalColor, visibility * impulse * 0.68);
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

export function MatchdaySignalField({ revision }: { revision: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gpu = navigator.gpu;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!canvas || !gpu || reducedMotion.matches) return;
    canvas.dataset.shaderRevision = revision;

    let cancelled = false;
    let animationFrame = 0;
    let touchFadeTimer = 0;
    let scrollTimer = 0;
    let context: GPUCanvasContext | null = null;
    let device: GPUDevice | null = null;
    let pipeline: GPURenderPipeline | null = null;
    let bindGroup: GPUBindGroup | null = null;
    let uniformBuffer: GPUBuffer | null = null;
    let pixelRatio = 1;
    let lastFrame = performance.now();
    let lastPointerX = window.innerWidth / 2;
    let lastPointerY = window.innerHeight / 2;
    let targetX = lastPointerX;
    let targetY = lastPointerY;
    let renderedX = targetX;
    let renderedY = targetY;
    let velocityX = 0;
    let velocityY = 0;
    let targetVisibility = 0;
    let visibility = 0;
    let impulse = 0;
    let touch = 0;
    let interactive = 0;
    let live = 0;
    let scrollAttenuation = 1;

    const uniforms = new Float32Array(16);

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
      renderedX += (targetX - renderedX) * Math.min(0.3 * elapsed, 0.72);
      renderedY += (targetY - renderedY) * Math.min(0.3 * elapsed, 0.72);
      velocityX *= 0.76 ** elapsed;
      velocityY *= 0.76 ** elapsed;
      visibility +=
        (targetVisibility - visibility) * Math.min(0.22 * elapsed, 0.65);
      impulse *= 0.9 ** elapsed;
      scrollAttenuation +=
        (1 - scrollAttenuation) * Math.min(0.12 * elapsed, 0.4);

      uniforms.set([
        canvas.width,
        canvas.height,
        pixelRatio,
        now / 1000,
        renderedX * pixelRatio,
        renderedY * pixelRatio,
        visibility,
        impulse,
        velocityX * pixelRatio,
        velocityY * pixelRatio,
        touch,
        live,
        interactive,
        0,
        scrollAttenuation,
        0,
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
      const verticalOffset = isTouch ? 24 : 0;
      targetX = event.clientX;
      targetY = Math.max(0, event.clientY - verticalOffset);
      velocityX += event.clientX - lastPointerX;
      velocityY += event.clientY - lastPointerY;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      touch = isTouch ? 1 : 0;
      const targetState = getInteractiveState(event.target);
      interactive = targetState.interactive;
      live = targetState.live;

      if (!isTouch) targetVisibility = 1;
    };

    const onPointerDown = (event: PointerEvent) => {
      window.clearTimeout(touchFadeTimer);
      updatePointer(event);
      targetVisibility = 1;
      impulse = 1;
      startAnimation();
    };

    const onPointerUp = (event: PointerEvent) => {
      updatePointer(event);
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

    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null && event.pointerType !== "touch") {
        targetVisibility = 0;
        interactive = 0;
        live = 0;
      }
    };

    const onScroll = () => {
      scrollAttenuation = 0.18;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        scrollAttenuation = 1;
      }, 110);
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
      window.addEventListener("pointermove", updatePointer, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      window.addEventListener("pointerup", onPointerUp, { passive: true });
      window.addEventListener("pointercancel", onPointerUp, { passive: true });
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
      window.clearTimeout(scrollTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("scroll", onScroll);
    };
  }, [revision]);

  return (
    <canvas
      className="matchday-signal-field"
      data-shader-revision={revision}
      ref={canvasRef}
    />
  );
}

export function MatchdayClickEffect() {
  return <MatchdaySignalField revision="click-only-v8" />;
}
