/**
 * @module im/messenger/lib/utils/promise
 */
jn.define('im/messenger/lib/utils/promise', (require, exports, module) => {

	/**
	 * @return {{resolve: function, reject: function, promise: Promise}}
	 */
	function createPromiseWithResolvers()
	{
		let resolvePromise = () => {};

		let rejectPromise = () => {};
		const promise = new Promise((resolve, reject) => {
			resolvePromise = resolve;
			rejectPromise = reject;
		});

		return {
			promise,
			resolve: resolvePromise,
			reject: rejectPromise,
		};
	}

	/**
	 * Returns a promise that resolves after the specified delay in ms.
	 * @param {number} ms
	 * @return {Promise<void>}
	 */
	function delay(ms)
	{
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	/**
	 * Returns an object with a promise that resolves after ms, and a cancel() method to prevent resolution.
	 * @param {number} ms
	 * @return {{promise: Promise<void>, cancel: function}}
	 */
	function delayWithCancel(ms)
	{
		let timeoutId = null;
		let canceled = false;

		const promise = new Promise((resolve) => {
			timeoutId = setTimeout(() => {
				if (!canceled)
				{
					resolve();
				}
			}, ms);
		});

		const cancel = () => {
			canceled = true;
			clearTimeout(timeoutId);
		};

		return { promise, cancel };
	}

	module.exports = {
		createPromiseWithResolvers,
		delay,
		delayWithCancel,
	};
});
