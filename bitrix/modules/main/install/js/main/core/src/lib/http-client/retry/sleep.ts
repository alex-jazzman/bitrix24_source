import Type from '../../type';

function getAbortReason(signal: AbortSignal): unknown
{
	return signal.reason ?? new DOMException('The operation was aborted.', 'AbortError');
}

/**
 * A pause interruptible by an abort signal: it resolves when the time is up and
 * rejects with the abort reason as soon as the signal fires.
 *
 * Both the timer and the abort listener are released on either outcome —
 * otherwise a long-living caller signal accumulates a listener per request, the
 * very defect `combineSignals` of the transport guards against.
 */
export function sleep(delay: number, signal: AbortSignal | null = null): Promise<void>
{
	if (!Type.isNil(signal) && signal.aborted)
	{
		return Promise.reject(getAbortReason(signal));
	}

	return new Promise((resolve, reject) => {
		let timer: number = 0;
		const onAbort = (): void => {
			window.clearTimeout(timer);
			reject(getAbortReason(signal as AbortSignal));
		};

		timer = window.setTimeout(() => {
			signal?.removeEventListener('abort', onAbort);
			resolve();
		}, delay);

		signal?.addEventListener('abort', onAbort, { once: true });
	});
}
