import { type BaseEvent } from 'main.core.events';

import {
	type PopoverAlignment,
	type PopoverDesignContext,
	type PopoverPosition,
	type PopoverStrategy,
	type PopoverStretch,
	type PopoverTracking,
} from './const';

export type PopoverRect = {
	top: number;
	right: number;
	bottom: number;
	left: number;
	width: number;
	height: number;
};

// A point of the viewport the popover is placed against.
export type PopoverPointTarget = { x: number; y: number };

// A virtual anchor: anything that answers getBoundingClientRect(), an instance of a class of the consumer
// included - the shape is the whole requirement, and the runtime asks for nothing the type does not name.
// contextElement is the real element the observers of the cycle can watch; without one nobody is watching,
// and reporting a move is up to the consumer (see adjustPosition() and positioning.tracking).
export type PopoverRectTarget = { getBoundingClientRect: () => PopoverRect; contextElement?: Element };

// null switches the popover to area mode: it is placed against the screen area, not an anchor.
export type PopoverTarget = Element | PopoverPointTarget | PopoverRectTarget | null;

export type PopoverPointerAlignment = 'auto' | PopoverAlignment;

export type PopoverPointerOptions = {
	alignment?: PopoverPointerAlignment;
	// Point on the anchor edge the arrow aims at, regardless of alignment; 'auto' means the anchor centre.
	pointsTo?: PopoverPointerAlignment;
};

// Named after the CSS Anchor Positioning try-tactics. 'flip-position' - the opposite side of the same axis;
// 'flip-axis' - both sides of the perpendicular one, the logical end first (CSS flip-start).
export type PopoverFlipTactic = 'flip-position' | 'flip-axis';

export type PopoverFlipOptions = {
	// The order of the tactics is the order the candidate placements are tried in.
	fallbacks?: PopoverFlipTactic[];
};

export type PopoverOffsetValue = { main?: number; cross?: number };

// A scalar is { main: n, cross: 0 }. main is the physical gap to the anchor (in area mode - inward from the
// side); a negative value is passed on as given and runs the popover onto the anchor. cross is a logical
// translation along the cross axis, its sign mirrors under rtl.
export type PopoverOffset = number | PopoverOffsetValue;

// Applied when the final side lies on the axis perpendicular to the requested one (a flip-axis fallback).
// An unset block keeps the base values in force there; an unset field inherits its base value.
export type PopoverAxisFlipOverrides = {
	// Only the object form: a scalar offset means { main: n, cross: 0 }, which would contradict the
	// inheritance rule of this block.
	offset?: PopoverOffsetValue;
	pointer?: PopoverPointerOptions;
};

// 'clipping-ancestors' - the clipping ancestors of the anchor intersected with the viewport.
export type PopoverBoundary = HTMLElement | 'viewport' | 'clipping-ancestors';

// What happens once the anchor is clipped out of sight. 'hide' is the default: the popover goes away with
// the anchor and comes back with it. 'close' hides the component for good - the way back is the consumer's.
// Either mode drops the focus: a focused element inside the content stops being focusable the moment the
// popover goes, and the focus lands on <body>. Under 'hide' that happens with nobody asking for it, from a
// scroll of the page alone. The popover does not manage the focus, so returning it is up to the consumer.
// Only a target with an element behind it can be clipped out of sight, so neither mode ever comes into play
// for a point target { x, y }, for a virtual anchor without contextElement, or in area mode: there is no
// anchor to be clipped, and anchorHidden stays false for the whole life of such a popover.
export type PopoverWhenAnchorHidden = 'hide' | 'close';

export type PopoverPositioning = {
	// null means the area centre and is only allowed in area mode.
	position?: PopoverPosition | null;
	alignment?: PopoverAlignment;
	offset?: PopoverOffset;

	// Move to another side when the requested one does not fit; true by default and equal to
	// { fallbacks: ['flip-position'] }.
	flip?: boolean | PopoverFlipOptions;
	slide?: boolean;

	stretch?: PopoverStretch;
	constrainSize?: boolean;

	pointer?: boolean | PopoverPointerOptions;

	onAxisFlip?: PopoverAxisFlipOverrides;

	boundary?: PopoverBoundary;
	boundaryPadding?: number;

	whenAnchorHidden?: PopoverWhenAnchorHidden;

	strategy?: PopoverStrategy;

	// How closely the popover follows the target; 'observers' by default. 'animation-frame' also reaches a
	// target the observers never see - a virtual anchor without contextElement or one in continuous motion.
	tracking?: PopoverTracking;
};

// Everything the consumer can learn about the popover after a cycle of the computation. Read through
// getState(); every change of it is reported by onStateChange together with the list of changed fields.
// A cycle that failed is reported by the same event, and it is the one case where the list of changed
// fields may come out empty: a failure of the very first cycle leaves the state exactly as the start of
// that cycle had put it. Such a popover is shown and carries no computed position (shown && !positioned)
// - the failure itself is written to the console by the extension.
export type PopoverState = {
	shown: boolean;
	// Whether a computation has been applied: false on a hidden popover and until the first cycle of the
	// current show is through. Own field because position: null already means the centre of the area - without
	// it there would be no telling "nothing has been computed yet" from "the popover sits in the centre".
	positioned: boolean;
	position: PopoverPosition | null;
	alignment: PopoverAlignment;
	flipped: boolean;
	// Shift along the cross axis applied by slide (the shift middleware); { x: 0, y: 0 } while slide is off.
	slide: { x: number; y: number };
	// The anchor is clipped out of sight. Only an anchor with an element behind it is watched for that, so the
	// field stays false for a point target, for a virtual anchor without contextElement and in area mode.
	anchorHidden: boolean;
	// There is no arrow on the screen: both when the pointer is off by option and when a short side hides it.
	pointerHidden: boolean;
	// Applied size limits of constrainSize; null while constrainSize is off.
	constrained: { maxWidth: number; maxHeight: number } | null;
	// Viewport rect of the popover; null until a computation is applied. It changes on every scroll, so
	// onStateChange arrives on every cycle with changed: ['rect'] - a consumer after structural changes
	// alone (the side, the flip, the size limits) filters those out by changed.
	rect: PopoverRect | null;
};

// What onStateChange carries, reached through getData() of the event. The state is a copy of its own, so
// keeping it aside keeps the values of that cycle; changed lists the fields that moved since the cycle before,
// in the declaration order of PopoverState, and it is the field to sort the reports by - a scroll reports the
// rect on every frame, while the side, the flip and the size limits move far more rarely. Empty on the one
// occasion described at PopoverState: a first cycle that failed.
export type PopoverStateChangePayload = {
	state: PopoverState;
	changed: Array<keyof PopoverState>;
};

// The node behind the content becomes the bubble of the popover itself: the extension wraps it in nothing and
// puts no class on it, so its background, radius, padding and overflow are the CSS of the place of use. Hence
// exactly one element in every form - a string is markup with a single root tag (surrounding whitespace
// aside), a factory returns an element. The type of the value is checked by the constructor, its shape by the
// first show(), where the node is built: a factory has nothing to tell before it is called. A string is
// inserted as markup (main.popup / Tag.render semantics) and reaches the live document as it was given, the
// extension taking nothing out of it: escaping is up to the consumer. Text of a user goes through
// Text.encode() of main.core, rich HTML through CBXSanitizer on the backend.
//
// The accessibility of the bubble goes the same way as its look, and for the same reason: the extension
// puts neither a role nor a name on a node it did not build, so both belong to the consumer.
//
// 1. Role and accessible name. The service root is a plain positioned div and stays roleless on purpose: a
//    role of its own could not be overridden from outside. Choose one by the case at hand and put it on the
//    bubble: role="tooltip" for a hint, role="dialog" with aria-label or aria-labelledby for dialogue
//    content, or no role at all for a purely decorative layer. In BPopover the attributes reach the bubble
//    through the fallthrough of $attrs.
// 2. The link to the anchor. A hint is tied by aria-describedby from the anchor to the id of the bubble; a
//    reference by id works across the whole document, so the mount into body does not break it. A button
//    that opens the popover carries aria-haspopup and aria-expanded, kept in step through onShow and onHide.
// 3. Focusable content. The order of traversal and the focus itself are the consumer's: see the container
//    option for the place in the tab order, and the close options for what happens to the focus on hiding.
// 4. Visible focus inside the bubble. The look of the bubble is the CSS of the place of use, and the
//    :focus-visible of anything interactive inside it is written there as well.
export type PopoverContent = string | HTMLElement | (() => HTMLElement);

// Same forms as in ui.system.typography; in the map form a class applies on a truthy value.
export type PopoverClassName = string | string[] | { [cls: string]: boolean };

export type PopoverOptions = {
	content: PopoverContent;
	target?: PopoverTarget;
	positioning?: PopoverPositioning;
	// Consumer classes on the service root: the address of the applied-state attributes and of everything the
	// root itself owns. The look of the popover has another address - the content node, which is the bubble.
	// A class of this option still reaches the bubble through a selector of the page, so setClassName() and
	// setDesignContext() recompute the position: a corner radius written that way moves the arrow with it.
	className?: PopoverClassName;
	designContext?: PopoverDesignContext;
	// document.body by default. Removing the container does not destroy the popover - the owner calls destroy().
	// The container is also the place of the popover in the reading order and in the tab order. By default the
	// root lands at the end of document.body: Tab from the anchor goes to the next element of the page, not
	// into the popover, and a screen reader reading in sequence meets the content at the very end of the
	// document, away from the anchor. Both are normal for a positioned container and both are the consumer's
	// to solve. Content with focusable elements goes either into a container next to the anchor, where the two
	// orders hold by themselves, or behind FocusTrap of ui.a11y.
	container?: HTMLElement;
	// Both are true by default. Neither of them, and no other way of hiding, moves the focus: once the popover
	// is hidden by hide(), by destroy() or by one of these two handlers, a focused element inside the content
	// stops being focusable and the focus lands on <body>. A consumer who puts interactive content into the
	// popover returns the focus to the initiator themselves.
	closeByClickOutside?: boolean;
	closeByEsc?: boolean;
	// The same four events subscribe() takes: onShow, onHide, onStateChange and onDestroy. Only the third one
	// carries anything, and PopoverStateChangePayload is the shape getData() answers with; the other three are
	// notifications with an empty payload.
	events?: { [eventName: string]: (event: BaseEvent) => void };
};
