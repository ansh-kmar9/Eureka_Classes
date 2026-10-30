"use client";

import { useSyncExternalStore } from "react";
import { canListen, canSpeak } from "./speech";

const subscribeNothing = () => () => {};

/**
 * Whether this device can read English aloud. False while rendering on the server,
 * then the real answer on the phone, without causing a hydration mismatch.
 */
export const useCanSpeak = () => useSyncExternalStore(subscribeNothing, canSpeak, () => false);

/** Whether this device can turn speech into text. */
export const useCanListen = () => useSyncExternalStore(subscribeNothing, canListen, () => false);
