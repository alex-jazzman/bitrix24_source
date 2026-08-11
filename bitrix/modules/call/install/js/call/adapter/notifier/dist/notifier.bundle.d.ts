/* eslint-disable */
declare namespace BX.Call.Adapter {
	const Notifier: {
		subscribe(...args: unknown[]): any;
		notify(...args: unknown[]): any;
		call: {
			onBackgroundFileSizeError(...args: unknown[]): void;
			onBackgroundUnsupportedError(...args: unknown[]): void;
		};
	};
}
