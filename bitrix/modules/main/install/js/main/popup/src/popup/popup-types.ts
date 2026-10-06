import { type BaseEvent } from 'main.core.events';
import { type ZIndexComponentOptions } from 'main.core.z-index-manager';
import { type FocusTrapOptions } from 'ui.a11y';
import { type Button as UiButton } from 'ui.buttons';

import { type Button } from '../compatibility/button';
import { type CloseIconSize } from './popup-close-icon-size';

export type PopupOptions = {
	id?: string;
	bindElement?: PopupTarget;
	bindOptions?: PopupTargetOptions;
	offsetTop?: number;
	offsetLeft?: number;
	content?: string | Element | Node;
	closeByEsc?: boolean;
	buttons?: PopupButton[];
	className?: string;
	width?: number;
	height?: number;
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;
	resizable?: boolean;
	padding?: number;
	contentPadding?: number;
	borderRadius?: string;
	contentBorderRadius?: string;
	background?: string;
	cacheable?: boolean;
	contentBackground?: string;
	animation?: PopupAnimationOptions;
	closeIcon?: boolean | Record<string, string | number>;
	closeIconSize?: (typeof CloseIconSize)[keyof typeof CloseIconSize];
	autoHide?: boolean;
	autoHideHandler?: (event: MouseEvent) => boolean;
	zIndexOptions?: ZIndexComponentOptions;
	toFrontOnShow?: boolean;
	events?: { [eventName: string]: (event: BaseEvent) => void };
	titleBar?: PopupTitleBar;
	angle?: boolean | { offset: number; position?: 'top' | 'bottom' | 'left' | 'right' };
	overlay?: boolean | PopupOverlay;
	contentColor?: string;
	draggable?: boolean | PopupDraggable;
	darkMode?: boolean;
	fixed?: boolean;
	designSystemContext?: string;
	compatibleMode?: boolean;
	bindOnResize?: boolean;
	targetContainer?: HTMLElement;
	disableScroll?: boolean;
	isScrollBlock?: boolean;

	focusTrap?: boolean | FocusTrapOptions;
	ariaLabel?: string;
	ariaLabelledBy?: string;
	ariaDescribedBy?: string;
	role?: string;

	// Compatibility
	noAllPaddings?: boolean;
	contentNoPaddings?: boolean;
};

export type PopupLegacyOptions = PopupOptions & Record<string, unknown>;

export type PopupTitleBar = string | Node | { content: string | Node };

export type PopupButton = Button | UiButton;

export type PopupOverlay = {
	backgroundColor?: string;
	opacity?: number;
	blur?: string;
};

export type PopupDraggable = {
	restrict?: boolean;
	element?: HTMLElement;
};

export type PopupTarget = Element | { left: number; top: number } | null | MouseEvent;
export type PopupTargetOptions = {
	forceBindPosition?: boolean;
	forceLeft?: boolean;
	forceTop?: boolean;
	position?: 'top' | 'bottom';
};

export type PopupAnimationOptions =
	string
	| boolean
	| { showClassName?: string; closeClassName?: string; closeAnimationType: string | null | undefined }
;
