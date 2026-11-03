/* eslint-disable */
type AirPopupData = {
	dialog: BX.UI.System.Dialog | null;
	contentContainer: HTMLElement | null;
	sizeObserver: ResizeObserver | null;
};

type AirDialogOptions = Omit<BX.UI.System.DialogOptions, 'events'> & {
	width?: number;
	events?: Partial<BX.UI.System.DialogEvents>;
};

declare namespace BX.Messenger.v2.Component.Elements {
	const MessengerAirPopup: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		id: {
			type: StringConstructor;
			required: true;
		};
		testId: {
			type: StringConstructor;
			default: string;
		};
		title: {
			type: StringConstructor;
			default: string;
		};
		width: {
			type: NumberConstructor;
			default: number;
		};
		className: {
			type: StringConstructor;
			default: string;
		};
		hasOverlay: {
			type: BooleanConstructor;
			default: boolean;
		};
		hasHorizontalPadding: {
			type: BooleanConstructor;
			default: boolean;
		};
		hasVerticalPadding: {
			type: BooleanConstructor;
			default: boolean;
		};
		closeByEsc: {
			type: BooleanConstructor;
			default: boolean;
		};
		closeByClickOutside: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, AirPopupData, {
		contentSelector(): string;
		testAnchor(): string;
	}, {
		createContentContainer(): HTMLElement;
		getDialogOptions(content: HTMLElement): AirDialogOptions;
		pinPopupToViewport(): void;
		observePopupSize(): void;
		adjustPopupPosition(): void;
		getPopup(): BX.Main.Popup | null;
		onDialogHide(): void;
		updateTitle(): void;
		getTitleNode(): Element | null;
		setAccessibleNames(): void;
		nameCloseButton(): void;
		nameDialog(): void;
		markTestAnchors(): void;
		getCloseButtonNode(): HTMLButtonElement | null;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "close"[], "close", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		id: {
			type: StringConstructor;
			required: true;
		};
		testId: {
			type: StringConstructor;
			default: string;
		};
		title: {
			type: StringConstructor;
			default: string;
		};
		width: {
			type: NumberConstructor;
			default: number;
		};
		className: {
			type: StringConstructor;
			default: string;
		};
		hasOverlay: {
			type: BooleanConstructor;
			default: boolean;
		};
		hasHorizontalPadding: {
			type: BooleanConstructor;
			default: boolean;
		};
		hasVerticalPadding: {
			type: BooleanConstructor;
			default: boolean;
		};
		closeByEsc: {
			type: BooleanConstructor;
			default: boolean;
		};
		closeByClickOutside: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{
		onClose?: ((...args: any[]) => any) | undefined;
	}>, {
		title: string;
		width: number;
		className: string;
		closeByEsc: boolean;
		hasOverlay: boolean;
		hasVerticalPadding: boolean;
		hasHorizontalPadding: boolean;
		closeByClickOutside: boolean;
		testId: string;
	}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
}
