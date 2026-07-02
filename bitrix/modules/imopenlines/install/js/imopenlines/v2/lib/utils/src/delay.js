type DelayHandler = {
	start(callback: () => void): void,
	stop(): void,
};

export const useDelay = (delay: number): DelayHandler => {
	let timeoutId = null;

	return {
		start(callback: Function)
		{
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				callback();
			}, delay);
		},
		stop()
		{
			clearTimeout(timeoutId);
			timeoutId = null;
		},
	};
};
