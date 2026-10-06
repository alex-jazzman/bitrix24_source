export function promiseWithResolvers(): Promise<void>
{
	let resolve = null;
	let reject = null; 
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return {
		promise,
		resolve,
		reject,
	};
}