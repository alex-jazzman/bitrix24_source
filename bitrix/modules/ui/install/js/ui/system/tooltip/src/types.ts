import { type BaseEvent } from 'main.core.events';

import { type TooltipPosition, type TooltipTrigger } from './const';

export type TooltipOptions = {
	// The element the tooltip belongs to: the anchor of the position and the owner of the aria-describedby
	// link. Required, and null is no way to take it back - that is what destroy() is for.
	//
	// One element carries no more than one tooltip. An element marked up for the tooltip and given one of
	// these as well ends up with two bubbles, two identifiers in aria-describedby and its description read
	// out twice; nothing checks that, and the place of use answers for it.
	target: Element;
	// What the bubble shows, in either of its two forms. Required: a tooltip without it has nothing to
	// show. setOptions() replaces one form with the other in both directions.
	//
	// A string is a text and no markup unless the html option below says so: it goes into textContent as it
	// is, is parsed as nothing and encoded on top of nothing. Mind the difference from ui.system.popover,
	// where the option of this very name takes a string as markup - here it is deliberately the other way
	// round, because the text of a tooltip is most often data of somebody else.
	//
	// A node is put inside the bubble, in the place the text would have taken; the bubble itself belongs to
	// the extension. Focusable content - a link, a button, a field - is allowed and needs a thought about
	// the trigger: a bubble raised by the cursor lives as long as the cursor stands on it or on the target,
	// so the keyboard never reaches what is inside. Give such a tooltip the click trigger, which keeps the
	// bubble on the screen by itself; a whole interactive layer is another pattern still, built on
	// ui.system.popover directly.
	content: string | HTMLElement;
	// Whether a string content is markup. false - the string is a text, which is what a hint carries almost
	// always; true - the very same string is put inside the bubble as the markup it is written in, parsed
	// and no more: nothing is looked through, taken out or encoded, and the safety of what reaches the page
	// belongs to the place of use. The element form of the content is none of this option's business - a
	// node is put inside the bubble either way.
	//
	// The option lives on this contract and on the directive of the Vue surface alone: a tooltip raised
	// from the markup of the page (data-ui-tooltip) shows a text and nothing else.
	html?: boolean;
	// Ceiling of the width of the bubble, px. The default is the one the stylesheet of the extension
	// writes, and a value equal to it reaches the node as little as an unset option does.
	maxWidth?: number;
	position?: TooltipPosition;
	// Gap to the target on top of the protrusion of the pointer, px. Allowed range is 0...12: together with
	// the protrusion this is the distance the cursor crosses within the bridge window of the trigger layer,
	// and a value outside the range is brought to the nearest bound with a warning in the console.
	offset?: number;
	// Shift of the tooltip along the side, px; the sign mirrors under rtl. The whole figure moves: the
	// pointer travels with the tooltip and keeps its place on its side.
	crossOffset?: number;
	trigger?: TooltipTrigger | TooltipTrigger[];
	showDelay?: number;
	// Delay of the hiding, ms. A hiding caused by the cursor leaving waits out the bridge window of the
	// trigger layer whatever the value is; a hiding caused by the focus leaving is not affected.
	hideDelay?: number;
	// onShow, onHide and onDestroy - all three are notifications with an empty payload. The state of the
	// positioning primitive is not passed on: it stays an internal detail of the extension.
	events?: { [eventName: string]: (event: BaseEvent) => void };
};
