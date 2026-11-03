import type { CallCapabilities } from 'call.engine.registry';

type CoreUtilLimits = {
	getUserLimit(): number,
	isWebRTCSupported(): boolean,
};

// Legacy CallCapabilities backed by call.core Util.
export function createLegacyCapabilities(util: CoreUtilLimits): CallCapabilities
{
	return {
		getUserLimit: () => util.getUserLimit(),
		isWebRTCSupported: () => util.isWebRTCSupported(),
	};
}
