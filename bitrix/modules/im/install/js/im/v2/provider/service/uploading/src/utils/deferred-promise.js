export function createDeferredPromise(): { promise: Promise<any>, resolve: () => void, reject: () => void }
{
	let resolve;
	let reject;
	const promise = new Promise((resolveRef, rejectRef) => {
		resolve = resolveRef;
		reject = rejectRef;
	});

	// An entry armed for the next run is often never taken, and refusing it on the way out must not
	// turn into an unhandled rejection: a real waiter still gets the refusal from its own await.
	promise.catch(() => {});

	return {
		promise,
		resolve,
		reject,
	};
}
