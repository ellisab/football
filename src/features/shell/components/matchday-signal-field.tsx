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

fn segmentDistance(point: vec2f, start: vec2f, end: vec2f) -> f32 {
  let line = end - start;
  let amount = clamp(dot(point - start, line) / max(dot(line, line), 0.001), 0.0, 1.0);
  return length(point - (start + amount * line));
}

fn cubicPoint(start: vec2f, controlA: vec2f, controlB: vec2f, end: vec2f, amount: f32) -> vec2f {
  let inverse = 1.0 - amount;
  return inverse * inverse * inverse * start
    + 3.0 * inverse * inverse * amount * controlA
    + 3.0 * inverse * amount * amount * controlB
    + amount * amount * amount * end;
}

fn cubicDistance(point: vec2f, start: vec2f, controlA: vec2f, controlB: vec2f, end: vec2f) -> f32 {
  var minimum = 10000.0;
  var previous = start;
  for (var index = 1; index <= 20; index = index + 1) {
    let amount = f32(index) / 20.0;
    let current = cubicPoint(start, controlA, controlB, end, amount);
    minimum = min(minimum, segmentDistance(point, previous, current));
    previous = current;
  }
  return minimum;
}

fn brandStrokeDistance(point: vec2f) -> f32 {
  let upperStem = segmentDistance(point, vec2f(-16.0, -4.0), vec2f(-16.0, -12.0));
  let upperCurve = cubicDistance(
    point,
    vec2f(-16.0, -12.0),
    vec2f(-16.0, -18.627),
    vec2f(-10.627, -24.0),
    vec2f(-4.0, -24.0)
  );
  let upperArm = segmentDistance(point, vec2f(-4.0, -24.0), vec2f(12.0, -24.0));
  let lowerStem = segmentDistance(point, vec2f(16.0, 4.0), vec2f(16.0, 12.0));
  let lowerCurve = cubicDistance(
    point,
    vec2f(16.0, 12.0),
    vec2f(16.0, 18.627),
    vec2f(10.627, 24.0),
    vec2f(4.0, 24.0)
  );
  let lowerArm = segmentDistance(point, vec2f(4.0, 24.0), vec2f(-12.0, 24.0));
  return min(min(upperStem, upperCurve), min(upperArm, min(lowerStem, min(lowerCurve, lowerArm))));
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
  let interactive = u.state.x;
  let visibility = u.pointer.z * u.state.z;
  let logoScale = mix(0.34, 0.43, touch) * dpr * (1.0 + interactive * 0.04);
  let logoRadius = 30.0 * logoScale;
  let graphite = vec3f(0.145, 0.15, 0.137);
  let silver = vec3f(0.45, 0.46, 0.435);
  let coral = vec3f(0.784, 0.169, 0.227);
  let signalColor = mix(graphite, coral, u.motion.w);

  let logoPoint = q / logoScale;
  let logoAntialias = 1.2 * dpr / logoScale;
  let strokeDistance = brandStrokeDistance(logoPoint);
  let logoStroke = 1.0 - smoothstep(6.0, 6.0 + logoAntialias, strokeDistance);
  let logoDot = 1.0 - smoothstep(5.5, 5.5 + logoAntialias, length(logoPoint));
  let logo = max(logoStroke, logoDot);
  let logoStrokeBloom = 1.0 - smoothstep(6.0, 11.0 + logoAntialias, strokeDistance);
  let logoDotBloom = 1.0 - smoothstep(5.5, 10.0 + logoAntialias, length(logoPoint));
  let logoBloom = max(logoStrokeBloom, logoDotBloom);

  let speed = min(length(u.motion.xy) / (34.0 * dpr), 1.0);
  let trailEnd = u.pointer.xy - u.motion.xy * mix(1.8, 3.2, speed);
  let trailDistance = segmentDistance(fragment.xy, u.pointer.xy, trailEnd);
  let trail = (1.0 - smoothstep(0.75 * dpr, 2.2 * dpr, trailDistance))
    * speed * (1.0 - smoothstep(0.0, 231.25 * dpr, distance));

  let fieldRadius = mix(102.5, 132.5, touch) * dpr;
  let fieldFalloff = pow(max(1.0 - distance / fieldRadius, 0.0), 2.0);
  let displacement = dot(q, normalize(u.motion.xy + vec2f(0.001))) * speed * 0.055;
  let filamentWave = abs(sin((q.y + displacement) / (10.0 * dpr)));
  let filaments = smoothstep(0.925, 1.0, filamentWave) * fieldFalloff * speed;

  let impulseAge = 1.0 - u.pointer.w;
  let impulseRadius = (logoRadius / dpr + 15.0 + impulseAge * mix(97.5, 60.0, touch)) * dpr;
  let impulse = band(distance, impulseRadius, mix(1.35, 2.1, touch) * dpr)
    * u.pointer.w * u.pointer.w;

  let halo = exp(-(distance * distance) / max(2.0 * fieldRadius * fieldRadius, 1.0));
  let alpha = visibility * clamp(
    logo * mix(0.68, 0.9, interactive)
      + logoBloom * 0.045
      + trail * 0.2
      + filaments * 0.07
      + impulse * 0.46
      + halo * 0.012,
    0.0,
    0.92
  );

  let detailAmount = clamp(logo + impulse * 0.7, 0.0, 1.0);
  let color = mix(silver, signalColor, detailAmount);
  return vec4f(color, alpha);
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
    };

    const onPointerUp = (event: PointerEvent) => {
      updatePointer(event);
      impulse = 1;
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
      animationFrame = window.requestAnimationFrame(draw);
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

export function CompactMatchdaySignalField() {
  return <MatchdaySignalField revision="exact-logo-v6" />;
}
