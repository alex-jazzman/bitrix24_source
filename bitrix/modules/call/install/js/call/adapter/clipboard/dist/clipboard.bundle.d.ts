/* eslint-disable */
declare namespace BX.Call.Adapter {
	const Clipboard: {
		copy: typeof copy;
		copyFromPromise: typeof copyFromPromise;
	};

	function copy(text: string): Promise<void>;

	function copyFromPromise(textPromise: Promise<string>): Promise<void>;
}
