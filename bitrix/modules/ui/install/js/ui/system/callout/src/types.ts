import { type BaseEvent } from 'main.core.events';
import { type Button } from 'ui.buttons';
import { type PopoverDesignContext, type PopoverPositioning, type PopoverTarget } from 'ui.system.popover';

// 'area' is the value that turns the area mode of the popover on: the card stands against a region of the
// screen instead of an anchor. null is no value of the option at all - it reaches setTarget() and
// applyOptions() as the command to drop the anchor, which takes a shown card down with it.
export type CalloutTarget = Exclude<PopoverTarget, null> | 'area';

// A factory is called when the card is built; either form reaches the card as it is given.
export type CalloutNode = HTMLElement | (() => HTMLElement);

// A string goes into the card as text, so markup written in it never reaches the DOM as markup.
export type CalloutContent = string | CalloutNode;

export type CalloutMode = 'interactive' | 'passive';

// button - the ui.buttons instance created for this item, event - the source DOM click. When
// ui.system.button arrives the events reach the button as they are, and its ButtonHandler types the first
// argument wider - as unknown.
export type CalloutButtonHandler = (button: Button, event: MouseEvent) => void;

export type CalloutButton = {
	text?: string;
	// Accessible name of the button. Required for a button without text: its icon is decorative, so an
	// icon-only button reaches assistive technology unnamed.
	ariaLabel?: string;
	// The click is the one event the card subscribes, and the record names it alone - a record of any string,
	// the shape ui.system.button carries, would take names nothing here binds and swallow them in silence.
	// Widening it once more events are subscribed breaks no consumer.
	events?: Partial<Record<'click', CalloutButtonHandler>>;
	// A ButtonDesign value of the ui.system.button extension - 'design-plain' and the rest of that enum. A
	// plain string because the extension is not in this branch yet, so there is no type to import.
	design?: string;
	// Icon of ui.icon-set.
	iconLeft?: string;
	iconRight?: string;
	loading?: boolean;
	disabled?: boolean;
};

export type CalloutOptions = {
	target?: CalloutTarget;
	// Merged over DEFAULT_POSITIONING and passed on to the popover.
	positioning?: PopoverPositioning;
	title?: string;
	description?: CalloutContent;
	leftSlot?: CalloutNode;
	// buttons win over footer, footer wins over footerLeft.
	buttons?: CalloutButton[];
	footer?: CalloutNode;
	footerLeft?: CalloutNode;
	// Unset follows the effective mode: true in interactive, false in passive.
	showClose?: boolean;
	// Constructor-only: one move of the focus onto the card per successful show() cycle. Turn it on when the
	// show answers an action of the user: in the default container the card is announced to no screen reader
	// and Tab off the anchor walks past it, so the focus is what carries the user in.
	autoFocus?: boolean;
	width?: number;
	// Accessible name of the card while title is unset.
	ariaLabel?: string;
	mode?: CalloutMode;
	container?: HTMLElement;
	// The Air context of the card. Unset means the default of the component - content-dark, the context the
	// card is drawn in - and not the absence of a context.
	designContext?: PopoverDesignContext;
	closeByClickOutside?: boolean;
	closeByEsc?: boolean;
	events?: Partial<Record<'onShow' | 'onHide' | 'onClose' | 'onDestroy', (event: BaseEvent) => void>>;
};

// Own-key semantics: a key present means the intention to change, undefined at a present key resets the
// option to its default or clears the container. target is the one key null reaches - the command to drop
// the anchor, which the option type itself does not carry; 'area' is a value of the option like any other and
// moves the card to the area instead of taking it down.
export type CalloutApplyOptions = Partial<Pick<CalloutOptions,
	'title'
	| 'description'
	| 'leftSlot'
	| 'footer'
	| 'footerLeft'
	| 'buttons'
	| 'showClose'
	| 'width'
	| 'positioning'
	| 'designContext'
	| 'closeByClickOutside'
	| 'closeByEsc'
	| 'ariaLabel'
	| 'mode'
>> & { target?: CalloutTarget | null };
