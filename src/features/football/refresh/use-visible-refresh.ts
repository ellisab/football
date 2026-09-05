"use client";

import { type RefObject, useEffect } from "react";
import { scheduleVisibleRefresh } from "./visible-refresh";

export const useVisibleRefresh = ({
  activeRequest,
  onRefresh,
  onStart = onRefresh,
}: {
  activeRequest: RefObject<AbortController | null>;
  onRefresh: () => void | Promise<void>;
  onStart?: () => void | Promise<void>;
}) => {
  useEffect(() => {
    void onStart();
    const stop = scheduleVisibleRefresh(onRefresh);

    return () => {
      stop();
      activeRequest.current?.abort();
    };
  }, [activeRequest, onRefresh, onStart]);
};
