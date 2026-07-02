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
		BIcon: {
			props: {
				name: {
					type: StringConstructor;
					required: boolean;
					validator(value: string): boolean;
				};
				color: {
					type: StringConstructor;
					required: boolean;
					default: null;
				};
				size: {
					type: NumberConstructor;
					required: boolean;
					default: null;
				};
				hoverable: {
					type: BooleanConstructor;
					default: boolean;
				};
				hoverableAlt: {
					type: BooleanConstructor;
					default: boolean;
				};
				responsive: {
					type: BooleanConstructor;
					default: boolean;
				};
			};
			computed: {
				className(): string[];
				hoverableClassnameModifier(): string;
				responsiveClassnameModifier(): string;
				inlineSize(): string;
				inlineColor(): string;
				inlineStyle(): string;
			};
			template: string;
		};
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
