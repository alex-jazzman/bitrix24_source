/* eslint-disable */
type State = {
	isActive: boolean;
	counter: number;
};

declare namespace BX.Messenger.v2.Component.List {
	/**
	 * Cross-module event contract consumed by the vibecodeconnector.im-button-binder
	 * extension (feature vibecodeconnector.catalog). The event names below and the
	 * `data-bx-vibe-code-catalog-events` DOM marker are mirrored on the vibecodeconnector
	 * side -- rename them in lockstep or the integration breaks silently.
	 *
	 * @emits 'im:vibe-code-catalog:request' {open: boolean, node: ?HTMLElement} -- handled by the binder to open/close the catalog
	 * @listens 'im:vibe-code-catalog:state-changed' {active: boolean} -- emitted by the binder to sync the pressed state
	 * @see vibecodeconnector/install/js/vibecodeconnector/im-button-binder/src/binder.js
	 */
	const VibeCodeCatalogButton: BX.Vue3.DefineComponent<{}, {}, State, {
		ICON_NAME: () => "o-vibecode-catalog";
		layoutName(): BX.Messenger.v2.Const.LayoutType;
		shouldShow(): boolean;
		isAvailable(): boolean;
		shouldShowCounter(): boolean;
		isCounterValueOverflowed(): boolean;
		formattedCounterValue(): string;
	}, {
		onClick(): void;
		onStateChanged(event: BX.Event.BaseEvent): void;
		loc(phraseCode: string): string;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
		BIcon: typeof BX.UI.IconSet.BIcon;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
