import type { CallCapabilities } from 'call.engine.registry';

// Stub: safe defaults until the new call core exposes real capabilities.
// getUserLimit() -> 0 and isWebRTCSupported() -> false make availability checks report
// "call unavailable" instead of crashing while the new-core flag is ON.
export const coreCapabilities: CallCapabilities = {
	getUserLimit: () => 0,
	isWebRTCSupported: () => false,
};
