import { Dom, Event, Loc, Tag, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { Icon, Main, Outline } from 'ui.icon-set.api.core';

// The glyph sets are stylesheets and no import the build can see: the icon class writes the name of the glyph
// onto the node, and the drawing of it comes with these two.
import 'ui.icon-set.main';
import 'ui.icon-set.outline';

// A custom property is no import either: the stylesheet of the extension takes the colour of the glyph and
// the ring of the focus out of the air set.
import 'ui.design-tokens.air';

import { Tooltip, TooltipTrigger, type TooltipOptions } from 'ui.system.tooltip';

import { DEFAULT_SIZE, DEFAULT_TRIGGER, HintSize, HintTrigger } from './const';
import { type HintOptions, type HintTooltipOptions } from './types';

import './hint.css';

const EVENT_NAMESPACE = 'BX.UI.System.Hint';

// Block class of the button, and the whole public CSS surface of the extension: the look of the bubble is
// none of its business and belongs to ui.system.tooltip.
const BLOCK_CLASS = 'ui-system-hint';

// The accessible name of the button where the place of use names none.
const ARIA_LABEL_PHRASE = 'UI_SYSTEM_HINT_BUTTON_LABEL_ARIA';

// The one place a mode of the hint becomes a set of modes of the tooltip. The focus stands in both: the
// button is in the tab order, and a bubble the cursor raises has to be reachable by the keyboard as well.
const TOOLTIP_TRIGGER: Readonly<Record<HintTrigger, TooltipTrigger[]>> = Object.freeze({
	[HintTrigger.Hover]: [TooltipTrigger.Hover, TooltipTrigger.Focus],
	[HintTrigger.Click]: [TooltipTrigger.Click, TooltipTrigger.Focus],
});

// Options after normalisation: every field of the contract is in place, and the mode is told by
// tooltipOptions alone.
type NormalizedOptions = {
	size: HintSize;
	filled: boolean;
	tooltipOptions: HintTooltipOptions | null;
	onClick: (() => void) | null;
	ariaLabel: string;
};

const isSize = (value: unknown): value is HintSize => {
	return (Object.values(HintSize) as unknown[]).includes(value);
};

const isTrigger = (value: unknown): value is HintTrigger => {
	return (Object.values(HintTrigger) as unknown[]).includes(value);
};

// An invalid value counts as an unset one and leaves the default in force: the normalisation of the whole
// family, and the compiler already stands against everything but a JS consumer.
const normalizeOptions = (raw: HintOptions): NormalizedOptions => {
	const tooltipOptions = Type.isPlainObject(raw.tooltipOptions) ? raw.tooltipOptions : null;
	const onClick = Type.isFunction(raw.onClick) ? raw.onClick : null;

	// Dropped in silence, the callback would read as applied and be nowhere: a click of the hint mode belongs
	// to the bubble, and there is nothing left for the place of use to be called on.
	if (tooltipOptions !== null && onClick !== null)
	{
		console.warn(
			`${EVENT_NAMESPACE}: the "onClick" option is read in the action mode alone - a hint given `
			+ '"tooltipOptions" answers a click with its bubble.',
		);
	}

	return {
		size: isSize(raw.size) ? raw.size : DEFAULT_SIZE,
		filled: raw.filled === true,
		tooltipOptions,
		onClick,
		ariaLabel: Type.isStringFilled(raw.ariaLabel)
			? raw.ariaLabel
			: (Loc.getMessage(ARIA_LABEL_PHRASE) ?? ''),
	};
};

// The "?" of the help: a native button and, where the place of use asked for one, a Tooltip anchored to it.
// Everything the bubble is made of - the triggers and their delays, the bridge to the cursor, the ARIA link,
// the escape key and the placing - comes from ui.system.tooltip; what is left here is the button, the two
// modes and the way the options of the one turn into the options of the other.
//
// The owner calls destroy(): taking the node of the button off the page does not tear the hint down.
export class Hint extends EventEmitter
{
	#options: NormalizedOptions;

	// Built in the constructor and the same node from then on: the tooltip anchors to it, and an anchor built
	// later would leave the first gesture without one.
	#container: HTMLElement;

	// Null in the action mode, where no bubble exists at all, and after destroy().
	#tooltip: Tooltip | null = null;

	#destroyed: boolean = false;

	constructor(options: HintOptions = {})
	{
		super();
		this.setEventNamespace(EVENT_NAMESPACE);

		this.#options = normalizeOptions(options);
		this.#container = this.#renderButton();

		// Before the tooltip and not after: a button already under the cursor is shown from inside the
		// constructor of the tooltip, and a subscription taken afterwards would miss that very first show.
		if (options.events)
		{
			this.subscribeFromOptions(options.events);
		}

		// The one point the two modes are told apart.
		const tooltipOptions = this.#options.tooltipOptions;
		if (tooltipOptions === null)
		{
			Event.bind(this.#container, 'click', this.#handleClick);
		}
		else
		{
			this.#tooltip = this.#createTooltip(tooltipOptions);
		}
	}

	// The node of the button: the place of use puts it where it belongs. Built once, so every call answers
	// with the very same node - getContainer() is the name that reads right once it is in place.
	render(): HTMLElement
	{
		return this.#container;
	}

	getContainer(): HTMLElement
	{
		return this.#container;
	}

	// Takes the bubble, the subscriptions and the button off the page. The hint is dead from here on and a
	// second call does nothing.
	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;

		// The tooltip owns the mounted bubble and the subscriptions on the button: dropping the node alone
		// would leave both behind.
		this.#tooltip?.destroy();
		this.#tooltip = null;

		Event.unbind(this.#container, 'click', this.#handleClick);
		Dom.remove(this.#container);

		this.unsubscribeAll();
	}

	// A native button and not a marked-up element: the tab order, the space and enter keys and the announced
	// role come with it. The glyph inside carries no name of its own - the button is named by aria-label.
	#renderButton(): HTMLElement
	{
		const options = this.#options;
		const modifiers = `--${options.size}${options.filled ? ' --filled' : ''}`;

		const button: HTMLElement = Tag.render`
			<button type="button" class="${BLOCK_CLASS} ${modifiers}">
				${this.#renderIcon()}
			</button>
		`;

		// Written onto the node and not into the template: the label is a text of the place of use, and there
		// it would be markup.
		Dom.attr(button, 'aria-label', options.ariaLabel);

		return button;
	}

	// The size of the glyph is none of the icon class's business: the stylesheet of the extension writes it
	// through the custom property the icon reads, so the pixel scale of the modifiers stands in one place.
	#renderIcon(): HTMLElement
	{
		return new Icon({ icon: this.#options.filled ? Main.HELP : Outline.QUESTION }).render();
	}

	// The options of the hint turned into the options of the tooltip: everything of the bubble is handed over
	// as it stands, the trigger through the map above, and the button goes along as the anchor.
	#createTooltip(options: HintTooltipOptions): Tooltip
	{
		const tooltipOptions: TooltipOptions = {
			target: this.#container,
			content: options.content,
			html: options.html,
			maxWidth: options.maxWidth,
			position: options.position,
			trigger: TOOLTIP_TRIGGER[isTrigger(options.trigger) ? options.trigger : DEFAULT_TRIGGER],
			showDelay: options.showDelay,
			hideDelay: options.hideDelay,
			events: {
				onShow: this.#handleTooltipShow,
				onHide: this.#handleTooltipHide,
			},
		};

		return new Tooltip(tooltipOptions);
	}

	#handleClick = (): void => {
		this.#options.onClick?.();
	};

	// The notifications of the bubble carried over under the namespace of the hint: the tooltip underneath is
	// an implementation detail, and its own events would hand the instance of it to the place of use.
	#handleTooltipShow = (): void => {
		this.emit('onShow', {});
	};

	#handleTooltipHide = (): void => {
		this.emit('onHide', {});
	};
}
