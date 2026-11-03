export const SLIDER_EVENT_CLOSE = 'SidePanel.Slider:onCloseComplete';

export type ClosablePopup = {
	setAutoHide: (enabled: boolean) => void,
	setClosingByEsc: (enabled: boolean) => void,
};

export type SliderEventEmitter = {
	subscribe: (eventName: string, handler: () => void) => void,
	unsubscribe: (eventName: string, handler: () => void) => void,
};

type PopupClosingLockOptions = {
	eventEmitter: SliderEventEmitter | null,
	getPopup: () => ClosablePopup | null | undefined,
	isLoading: () => boolean,
};

export type PopupClosingLock = {
	apply: () => void,
	stop: () => void,
};

export function createPopupClosingLock({
	eventEmitter,
	getPopup,
	isLoading,
}: PopupClosingLockOptions): PopupClosingLock
{
	let stopped = false;

	const apply = (): void => {
		const closingEnabled = !isLoading();
		const popup = getPopup();

		popup?.setAutoHide(closingEnabled);
		popup?.setClosingByEsc(closingEnabled);
	};

	const handleSliderCloseComplete = (): void => {
		if (!isLoading())
		{
			return;
		}

		void Promise.resolve().then(() => {
			if (!stopped && isLoading())
			{
				apply();
			}
		});
	};

	eventEmitter?.subscribe(SLIDER_EVENT_CLOSE, handleSliderCloseComplete);
	apply();

	return {
		apply,
		stop: () => {
			if (stopped)
			{
				return;
			}

			stopped = true;
			eventEmitter?.unsubscribe(SLIDER_EVENT_CLOSE, handleSliderCloseComplete);
		},
	};
}
