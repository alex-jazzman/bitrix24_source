/* eslint-disable */
type SyncActiveCallsMode = 'full' | 'compact';

type SyncActiveCallsMountOptions = {
	mode: SyncActiveCallsMode;
	onCountChange: (count: number) => void;
};

declare namespace BX.Call.Widget {
	/**
	 * The place under the native active calls where the web SDK draws the calls of Sync. Draws nothing while the option
	 * is off or the page has no embed of syncconnector; reports how many calls it shows, so the list can hide its own
	 * container when there are none.
	 */
	const SyncActiveCallsSlot: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		mode: {
			type: BX.Vue3.PropType<SyncActiveCallsMode>;
			required: true;
			validator: (value: string) => boolean;
		};
	}>, {}, {
		count: number;
		listMount: SyncActiveCallsMount | null;
	}, {}, {
		mountList(): void;
		unmountList(): void;
		setCount(count: number): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "countChange"[], "countChange", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		mode: {
			type: BX.Vue3.PropType<SyncActiveCallsMode>;
			required: true;
			validator: (value: string) => boolean;
		};
	}>> & Readonly<{
		onCountChange?: ((...args: any[]) => any) | undefined;
	}>, {}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	/**
	 * Puts the list of active calls of the web SDK into an element through the function syncconnector publishes,
	 * and waits for the page embed while that function is not on the page yet.
	 */
	class SyncActiveCallsMount {
		constructor(host: Element, options: SyncActiveCallsMountOptions);
		start(): void;
		destroy(): void;
	}

	/**
	 * The list of active calls of the web SDK is on for the current user: the option
	 * `call / sync_active_calls_enabled`, read by `Settings::isSyncActiveCallsEnabled()`.
	 */
	function isSyncActiveCallsEnabled(): boolean;
}
