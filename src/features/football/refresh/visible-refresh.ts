export const REFRESH_INTERVAL_MS = 45_000;

export const scheduleVisibleRefresh = (refresh: () => void | Promise<void>) => {
  const refreshIfVisible = () => {
    if (document.visibilityState === "visible") void refresh();
  };

  const interval = window.setInterval(refreshIfVisible, REFRESH_INTERVAL_MS);
  document.addEventListener("visibilitychange", refreshIfVisible);

  return () => {
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", refreshIfVisible);
  };
};
