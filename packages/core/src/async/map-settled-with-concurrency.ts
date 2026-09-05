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
    concurrency = 3,
    shouldStop = () => false,
  }: {
    concurrency?: number;
    shouldStop?: (reason: unknown) => boolean;
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
