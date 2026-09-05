import assert from "node:assert/strict";
import test from "node:test";
import { REFRESH_INTERVAL_MS, scheduleVisibleRefresh } from "./visible-refresh";

test("visible refresh polls every 45 seconds, pauses when hidden, and removes its timer and listener", () => {
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const document = Object.assign(new EventTarget(), {
    visibilityState: "visible",
  });
  const timers = new Map<number, () => void>();
  let intervalMs = 0;
  let calls = 0;
  let stop: (() => void) | undefined;

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: document,
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      setInterval(callback: () => void, delay: number) {
        intervalMs = delay;
        timers.set(1, callback);
        return 1;
      },
      clearInterval(id: number) {
        timers.delete(id);
      },
    },
  });

  try {
    stop = scheduleVisibleRefresh(() => {
      calls += 1;
    });
    assert.equal(intervalMs, 45_000);
    assert.equal(intervalMs, REFRESH_INTERVAL_MS);
    timers.get(1)?.();
    assert.equal(calls, 1);

    document.visibilityState = "hidden";
    timers.get(1)?.();
    document.dispatchEvent(new Event("visibilitychange"));
    assert.equal(calls, 1);

    document.visibilityState = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    assert.equal(calls, 2);

    stop();
    assert.equal(timers.size, 0);
    document.dispatchEvent(new Event("visibilitychange"));
    assert.equal(calls, 2);
  } finally {
    stop?.();
    if (originalDocument)
      Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
