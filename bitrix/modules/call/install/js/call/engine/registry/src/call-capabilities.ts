// Capability port: what CallAvailability needs from the active engine.
// Legacy engine backs it with call.core Util; CoreCallEngine returns safe defaults.
export interface CallCapabilities
{
	getUserLimit(): number;
	isWebRTCSupported(): boolean;
}
