/* eslint-disable */
type FilterModeItem = typeof BX.Messenger.v2.Component.List.FilterMode[keyof typeof BX.Messenger.v2.Component.List.FilterMode];

type FilterRowState = {
	FilterMode: typeof BX.Messenger.v2.Component.List.FilterMode;
	ChipSize: typeof BX.UI.System.Chip.Vue.ChipSize;
	CounterSize: typeof BX.UI.CounterSize;
	unreadMenu: BX.Messenger.v2.Lib.UnreadFilterMenu | null;
};

declare namespace BX.Messenger.v2.Component.List {
	const FilterMode: {
		readonly all: "all";
		readonly unread: "unread";
	};

	const FilterRow: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		mode: {
			type: BX.Vue3.PropType<FilterModeItem>;
			required: true;
			validator: (value: string) => boolean;
		};
		counter: {
			type: NumberConstructor;
			default: number;
		};
		readAllSection: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Const.RecentTypeItem | null>;
			default: null;
		};
	}>, FilterRowState, {}, {
		hasReadAllMenu(): boolean;
		showCounter(): boolean;
		counterStyle(): string;
		maxCounterValue(): number;
		unreadAriaLabel(): string;
	}, {
		isActive(mode: FilterModeItem): boolean;
		chipDesign(mode: FilterModeItem): string;
		ariaPressed(mode: FilterModeItem): string;
		handleSelect(mode: FilterModeItem): void;
		handleKeydown(event: KeyboardEvent, mode: FilterModeItem): void;
		handleContextMenu(event: MouseEvent): void;
		loc(phraseCode: string, replacements?: Record<string, string>): string;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "changeMode"[], "changeMode", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		mode: {
			type: BX.Vue3.PropType<FilterModeItem>;
			required: true;
			validator: (value: string) => boolean;
		};
		counter: {
			type: NumberConstructor;
			default: number;
		};
		readAllSection: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Const.RecentTypeItem | null>;
			default: null;
		};
	}>> & Readonly<{
		onChangeMode?: ((...args: any[]) => any) | undefined;
	}>, {
		counter: number;
		readAllSection: any;
	}, {}, {
		UiChip: typeof BX.UI.System.Chip.Vue.Chip;
		BCounter: typeof BX.UI.Vue3.Components.Counter;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
