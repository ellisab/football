export const MAX_NEXT_GROUP_LOOKAHEAD = 8;

export const getStatusCode = (error: unknown) => {
  const reason = error as { status?: number } | undefined;
  return reason?.status;
};
