export const MAX_NEXT_GROUP_LOOKAHEAD = 8;
const GROUP_REQUEST_CONCURRENCY = 3;

export const getStatusCode = (error: unknown) => {
  const reason = error as { status?: number } | undefined;
  return reason?.status;
};

export const getRetryAfterMs = (error: unknown) => {
  const reason = error as { retryAfterMs?: number } | undefined;
  return typeof reason?.retryAfterMs === "number" &&
    Number.isFinite(reason.retryAfterMs) &&
    reason.retryAfterMs >= 0
    ? reason.retryAfterMs
    : undefined;
};

export type BoundedSettledResult<Input, Output> =
  | {
      input: Input;
      status: "fulfilled";
      value: Output;
    }
  | {
      input: Input;
      reason: unknown;
      status: "rejected";
    };

export const mapSettledWithConcurrency = async <Input, Output>(
  inputs: readonly Input[],
  mapper: (input: Input) => Promise<Output>,
  {
    concurrency = GROUP_REQUEST_CONCURRENCY,
    shouldStop = () => false,
    shouldStopValue = () => false,
  }: {
    concurrency?: number;
    shouldStop?: (reason: unknown) => boolean;
    shouldStopValue?: (value: Output) => boolean;
  } = {},
): Promise<Array<BoundedSettledResult<Input, Output>>> => {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError("Concurrency must be a positive integer");
  }

  const results: Array<BoundedSettledResult<Input, Output> | undefined> =
    new Array(inputs.length);
  let nextIndex = 0;
  let stopped = false;

  const worker = async () => {
    while (!stopped) {
      const index = nextIndex;
      nextIndex += 1;

      if (index >= inputs.length) return;

      const input = inputs[index] as Input;

      try {
        const value = await mapper(input);
        results[index] = {
          input,
          status: "fulfilled",
          value,
        };

        if (shouldStopValue(value)) {
          stopped = true;
        }
      } catch (reason) {
        results[index] = {
          input,
          reason,
          status: "rejected",
        };

        if (shouldStop(reason)) {
          stopped = true;
        }
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, inputs.length) }, worker),
  );

  return results.filter(
    (result): result is BoundedSettledResult<Input, Output> =>
      result !== undefined,
  );
};
