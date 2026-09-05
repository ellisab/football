import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate } from "node:timers/promises";
import { mapSettledWithConcurrency } from "../src/async";

test("bounded mapping caps active work and retains input order across rejection and out-of-order completion", async () => {
  const gates = Array.from({ length: 4 }, () =>
    Promise.withResolvers<number>(),
  );
  const started: number[] = [];
  const failure = new Error("failed");
  const pending = mapSettledWithConcurrency(
    [0, 1, 2, 3],
    (input) => {
      started.push(input);
      return gates[input]!.promise;
    },
    { concurrency: 2 },
  );
  assert.deepEqual(started, [0, 1]);
  gates[1]!.reject(failure);
  await setImmediate();
  assert.deepEqual(started, [0, 1, 2]);
  gates[2]!.resolve(20);
  await setImmediate();
  assert.deepEqual(started, [0, 1, 2, 3]);
  gates[3]!.resolve(30);
  gates[0]!.resolve(0);
  assert.deepEqual(await pending, [
    { input: 0, status: "fulfilled", value: 0 },
    { input: 1, status: "rejected", reason: failure },
    { input: 2, status: "fulfilled", value: 20 },
    { input: 3, status: "fulfilled", value: 30 },
  ]);
});

test("stop-on-error finishes in-flight work without starting queued requests", async () => {
  const gate = Promise.withResolvers<number>();
  const rateLimit = Object.assign(new Error("Rate limited"), { status: 429 });
  const started: number[] = [];
  const pending = mapSettledWithConcurrency(
    [0, 1, 2, 3],
    (input) => {
      started.push(input);
      if (input === 1) throw rateLimit;
      return gate.promise;
    },
    { concurrency: 2, shouldStop: (reason) => reason === rateLimit },
  );
  await setImmediate();
  gate.resolve(10);
  assert.deepEqual(await pending, [
    { input: 0, status: "fulfilled", value: 10 },
    { input: 1, status: "rejected", reason: rateLimit },
  ]);
  assert.deepEqual(started, [0, 1]);
});
