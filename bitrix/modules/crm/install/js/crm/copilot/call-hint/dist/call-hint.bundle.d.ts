/* eslint-disable */
type ViewMode = typeof BX.Crm.Copilot.ViewMode[keyof typeof BX.Crm.Copilot.ViewMode];

type HintViewData = {
	ViewMode: typeof BX.Crm.Copilot.ViewMode;
	selectedMode: BX.Crm.Copilot.ViewModeValue;
	formatter: BX.UI.BBCode.Formatter.HtmlFormatter;
	navigation: BX.Crm.Copilot.NavigationPanelAdapter | null;
	navigationItemIdPrefix: string;
	renderedPrompt: string | null;
	renderedTarget: HTMLElement | null;
};

type NavigationPanelItem = {
	id: string;
	title: string;
	active: boolean;
	events: {
		click: () => void;
	};
	link: Record<string, string>;
};

type ViewModeValue = typeof BX.Crm.Copilot.ViewMode[keyof typeof BX.Crm.Copilot.ViewMode];

type PreferenceOptionName = typeof BX.Crm.Copilot.PreferenceOptionName[keyof typeof BX.Crm.Copilot.PreferenceOptionName];

type PreferenceOptionNameValue = typeof BX.Crm.Copilot.PreferenceOptionName[keyof typeof BX.Crm.Copilot.PreferenceOptionName];

declare namespace BX.Crm.Copilot {
	const HintView: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		prompt: {
			type: StringConstructor;
			default: string;
		};
		isHintEnabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		hasHint: {
			type: BooleanConstructor;
			default: boolean;
		};
		mode: {
			type: BX.Vue3.PropType<ViewModeValue | null>;
			default: null;
			validator: (mode: unknown) => boolean;
		};
	}>, {}, HintViewData, {
		isHintAvailable(): boolean;
	}, {
		refresh(): void;
		select(mode: ViewModeValue): void;
		getNavigationItems(): NavigationPanelItem[];
		syncNavigation(): void;
		renderHint(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {
		select: (mode: ViewModeValue) => boolean;
	}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		prompt: {
			type: StringConstructor;
			default: string;
		};
		isHintEnabled: {
			type: BooleanConstructor;
			default: boolean;
		};
		hasHint: {
			type: BooleanConstructor;
			default: boolean;
		};
		mode: {
			type: BX.Vue3.PropType<ViewModeValue | null>;
			default: null;
			validator: (mode: unknown) => boolean;
		};
	}>> & Readonly<{
		onSelect?: ((mode: ViewMode) => any) | undefined;
	}>, {
		mode: ViewMode | null;
		prompt: string;
		isHintEnabled: boolean;
		hasHint: boolean;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	const ViewMode: Readonly<{
		readonly Hint: "hint";
		readonly Rules: "rules";
	}>;

	class NavigationPanelAdapter {
		constructor(target: HTMLElement);
		render(items: NavigationPanelItem[], ariaLabel: string): void;
		destroy(): void;
	}

	const ViewModeValue: Readonly<{
		readonly Hint: "hint";
		readonly Rules: "rules";
	}>;

	function isViewMode(mode: unknown): mode is ViewModeValue;

	function resolveViewMode(hasHint: boolean, preferredMode: unknown): ViewModeValue;

	class Preference {
		constructor(optionName: PreferenceOptionName);
		resolve(hasHint: boolean, preferredMode: unknown): ViewModeValue;
		save(mode: ViewModeValue): void;
	}

	const PreferenceOptionName: Readonly<{
		readonly Call: "copilot_call_hint_call";
		readonly Assessment: "copilot_call_hint_assessment";
	}>;

	const PreferenceOptionNameValue: Readonly<{
		readonly Call: "copilot_call_hint_call";
		readonly Assessment: "copilot_call_hint_assessment";
	}>;
}
