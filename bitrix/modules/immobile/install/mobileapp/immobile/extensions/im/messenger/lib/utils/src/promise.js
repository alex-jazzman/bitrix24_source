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

	/**
	 * @template T
	 * @param {Promise<T>} promise
	 * @param {number} ms
	 * @return {Promise<T>}
	 */
	function withTimeout(promise, ms)
	{
		let timeoutId = null;

		const timeoutPromise = new Promise((_, reject) => {
			timeoutId = setTimeout(() => {
				reject(new Error(`Promise timed out after ${ms}ms`));
			}, ms);
		});

		return Promise.race([promise, timeoutPromise])
			.finally(() => clearTimeout(timeoutId));
	}

	module.exports = {
		createPromiseWithResolvers,
		delay,
		delayWithCancel,
		withTimeout,
	};
});
