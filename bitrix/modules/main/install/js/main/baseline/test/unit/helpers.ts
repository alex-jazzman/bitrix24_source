export function withUserAgent(ua: string, fn: () => void): void
{
	const original = navigator.userAgent;
	const originalUaData = (navigator as any).userAgentData;
	Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
	Object.defineProperty(navigator, 'userAgentData', { value: undefined, configurable: true });

	try
	{
		fn();
	}
	finally
	{
		Object.defineProperty(navigator, 'userAgent', { value: original, configurable: true });
		Object.defineProperty(navigator, 'userAgentData', { value: originalUaData, configurable: true });
	}
}
