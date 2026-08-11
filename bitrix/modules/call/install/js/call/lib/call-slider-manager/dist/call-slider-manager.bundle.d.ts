/* eslint-disable */
interface CallSliderManagerCallbacks {
	hasCurrentCall: () => boolean;
	leaveCurrentCall: () => void;
}

declare namespace BX.Call.Lib {
	class CallSliderManager {
		constructor(callbacks: CallSliderManagerCallbacks);
		setTopSliderId(): void;
		clearSliderId(): void;
	}
}
