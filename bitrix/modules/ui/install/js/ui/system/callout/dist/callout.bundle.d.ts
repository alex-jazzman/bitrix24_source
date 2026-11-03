/* eslint-disable */
type CalloutOptions = {
	target?: CalloutTarget;
	positioning?: BX.UI.System.Popover.PopoverPositioning;
	title?: string;
	description?: CalloutContent;
	leftSlot?: CalloutNode;
	buttons?: CalloutButton[];
	footer?: CalloutNode;
	footerLeft?: CalloutNode;
	showClose?: boolean;
	autoFocus?: boolean;
	width?: number;
	ariaLabel?: string;
	mode?: CalloutMode;
	container?: HTMLElement;
	designContext?: BX.UI.System.Popover.PopoverDesignContext;
	closeByClickOutside?: boolean;
	closeByEsc?: boolean;
	events?: Partial<Record<'onShow' | 'onHide' | 'onClose' | 'onDestroy', (event: BX.Event.BaseEvent) => void>>;
};

type CalloutTarget = Exclude<BX.UI.System.Popover.PopoverTarget, null> | 'area';

type CalloutContent = string | CalloutNode;

type CalloutNode = HTMLElement | (() => HTMLElement);

type CalloutButton = {
	text?: string;
	ariaLabel?: string;
	events?: Partial<Record<'click', CalloutButtonHandler>>;
	design?: string;
	iconLeft?: string;
	iconRight?: string;
	loading?: boolean;
	disabled?: boolean;
};

type CalloutButtonHandler = (button: BX.UI.Button, event: MouseEvent) => void;

type CalloutMode = 'interactive' | 'passive';

type CalloutApplyOptions = Partial<Pick<CalloutOptions, 'title' | 'description' | 'leftSlot' | 'footer' | 'footerLeft' | 'buttons' | 'showClose' | 'width' | 'positioning' | 'designContext' | 'closeByClickOutside' | 'closeByEsc' | 'ariaLabel' | 'mode'>> & {
	target?: CalloutTarget | null;
};

declare namespace BX.UI.System.Callout {
	class Callout {
		constructor(options?: CalloutOptions);
		show(): void;
		hide(): void;
		destroy(): void;
		isShown(): boolean;
		adjustPosition(): void;
		getCard(): HTMLElement | null;
		refreshAccessibilityMode(): void;
		applyOptions(partial: CalloutApplyOptions): void;
		setTitle(title?: string): void;
		setDescription(description?: CalloutContent): void;
		setLeftSlot(leftSlot?: CalloutNode): void;
		setFooter(footer?: CalloutNode): void;
		setFooterLeft(footerLeft?: CalloutNode): void;
		setButtons(buttons?: CalloutButton[]): void;
		setShowClose(showClose?: boolean): void;
		setWidth(width?: number): void;
		setTarget(target: CalloutTarget | null): void;
		setPositioning(positioning?: BX.UI.System.Popover.PopoverPositioning): void;
		setDesignContext(designContext?: BX.UI.System.Popover.PopoverDesignContext): void;
		setCloseByClickOutside(closeByClickOutside: boolean): void;
		setCloseByEsc(closeByEsc: boolean): void;
		setAriaLabel(ariaLabel?: string): void;
		setMode(mode: CalloutMode): void;
	}

	const DEFAULT_DESIGN_CONTEXT: BX.UI.System.Popover.PopoverDesignContext;

	const DEFAULT_POSITIONING: Readonly<BX.UI.System.Popover.PopoverPositioning>;

	const DEFAULT_WIDTH: number;

	const MIN_WIDTH: number;
}
