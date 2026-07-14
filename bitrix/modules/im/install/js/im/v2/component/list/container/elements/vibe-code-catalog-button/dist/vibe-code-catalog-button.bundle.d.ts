/* eslint-disable */
type State = {
	isActive: boolean;
	counter: number;
};

declare namespace BX.Messenger.v2.Component.List {
	const VibeCodeCatalogButton: BX.Vue3.DefineComponent<{}, {}, State, {
		ICON_NAME: () => "o-vibecode-catalog";
		layoutName(): BX.Messenger.v2.Const.LayoutType;
		shouldShow(): boolean;
		isAvailable(): boolean;
		shouldShowCounter(): boolean;
		isCounterValueOverflowed(): boolean;
		formattedCounterValue(): string;
	}, {
		onClick(event: PointerEvent): void;
		loc(phraseCode: string): string;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {
		BIcon: typeof BX.UI.IconSet.BIcon;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
