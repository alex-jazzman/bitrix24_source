import { type BaseEvent } from 'main.core.events';

import { type TooltipPosition } from 'ui.system.tooltip';

import { type HintSize, type HintTrigger } from './const';

// The bubble of the hint, in the terms of ui.system.tooltip and no wider: every field here reaches that
// extension as it is written, and what the bubble does with it is described by its contract. The anchor is no
// part of this - it is always the "?" button of the hint.
export type HintTooltipOptions = {
	// What the bubble shows: a text, the markup the html option below turns it into, or a node of the place of
	// use. Required - a tooltip with nothing to show does not exist.
	content: string | HTMLElement;
	// Whether a string content is markup. false, and the string is a text; true, and it is put inside the
	// bubble as it stands - nothing there is looked through or taken out, and the safety of what reaches the
	// page belongs to the place of use. The hint hands the flag over and reads none of it.
	html?: boolean;
	// Ceiling of the width of the bubble, px. Left out, the tooltip keeps the one its own stylesheet writes.
	maxWidth?: number;
	// Preferred physical side of the button the bubble is put on; the tooltip moves it to the opposite one
	// where the preferred side does not fit. The dictionary of the values stays where it belongs - the
	// TooltipPosition of ui.system.tooltip.
	position?: TooltipPosition;
	// One mode of the two, and the keyboard focus comes with either of them: see HintTrigger.
	trigger?: HintTrigger;
	showDelay?: number;
	hideDelay?: number;
};

// Everything the "?" of the hint is built from. The mode is decided by tooltipOptions alone: given - the
// button carries a bubble; null - it carries a callback, and no tooltip is created at all.
export type HintOptions = {
	size?: HintSize;
	// The glyph of the button: true - the filled question mark, false - the outline one.
	filled?: boolean;
	tooltipOptions?: HintTooltipOptions | null;
	// Called on a click of the button in the action mode and read nowhere else: a hint with a bubble answers a
	// click with that bubble.
	onClick?: () => void;
	// The accessible name of the button. The button shows a glyph and no text, so a name it must have; the
	// default is the phrase of the extension.
	ariaLabel?: string;
	// onShow and onHide - the two notifications of the bubble, with an empty payload, carried over from the
	// tooltip. In the action mode there is no bubble and neither of them ever fires.
	events?: { [eventName: string]: (event: BaseEvent) => void };
};
