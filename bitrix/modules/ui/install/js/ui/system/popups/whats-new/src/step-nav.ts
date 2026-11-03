import { Dom, Event, Loc, Tag } from 'main.core';
import { AirButtonStyle, Button, ButtonIcon, ButtonSize } from 'ui.buttons';
// The glyphs of the icons of the buttons live in a stylesheet of their own, and the button brings none of
// them: an arrow without it is a button with an empty face.
import 'ui.buttons.icons';
import { Text } from 'ui.system.typography';

import './step-nav.css';

const BLOCK_CLASS = 'ui-system-whats-new-step-nav';
const ACTIVE_CLASS = '--active';

// The two ways along the row of steps.
const PREVIOUS = -1;
const NEXT = 1;

/*
 * How many steps the mockup still draws one by one. A longer row would not fit beside the arrows and the
 * buttons of the card, so from the fourth step on the indicator draws no step at all and says the position in
 * a compact counter instead.
 */
const STEP_DOTS_MAX = 3;

// Size of the number of a step and of the counter in the scale of ui.system.typography: the smallest step the
// card uses, the one a description of a list item is drawn in.
const NUMBER_SIZE = 'xs';

export type StepNavOptions = {
	stepCount: number;
	// Current step, counted from zero. The indicator never moves it on its own: it only reports what the user
	// asked for, and the three requests below are all it ever reports.
	currentStep: number;
	onPrev: () => void;
	onNext: () => void;
	onDot: (step: number) => void;
};

/**
 * The step indicator of the wizard mode: an arrow to either side and, between them, the steps of the row one
 * by one - or a counter of the position, once there are more steps than the row can hold.
 *
 * Internal element of the announcement dialog and not a part of its public interface: it lives in its own
 * source and its own stylesheet so that lifting it into a design system component of its own stays a move
 * of two files.
 */
export class StepNav
{
	#stepCount: number;
	#currentStep: number;
	#onPrev: () => void;
	#onNext: () => void;
	#onDot: (step: number) => void;

	#container: HTMLElement | null = null;
	#stepNodes: HTMLElement[] = [];
	#counterNode: HTMLElement | null = null;
	#prevArrow: HTMLElement | null = null;
	#nextArrow: HTMLElement | null = null;
	// The presses of the arrows are taken by hand: the option of the button that takes them is typed to give
	// something back, and a step of the wizard gives nothing back. The carousel of the card does the same.
	#arrowPresses: Array<{ node: HTMLElement; handler: () => void }> = [];

	constructor(options: StepNavOptions)
	{
		this.#stepCount = options.stepCount;
		this.#currentStep = options.currentStep;
		this.#onPrev = options.onPrev;
		this.#onNext = options.onNext;
		this.#onDot = options.onDot;
	}

	// The indicator is built once and handed over as the same node afterwards, the way a button of ui.buttons
	// does it: the controls survive a rebuild of the window content together with the focus standing on one
	// of them.
	render(): HTMLElement
	{
		this.#container ??= this.#renderContainer();

		return this.#container;
	}

	// Moves the mark of the position between the controls already drawn. Changing the step is the main move of
	// the wizard, and it is worth a class, an attribute and a line of text - not a rebuild of the whole row.
	setCurrentStep(currentStep: number): void
	{
		this.#currentStep = currentStep;

		this.#stepNodes.forEach((node, step) => this.#markStep(node, step === currentStep));
		this.#markArrows();

		if (this.#counterNode)
		{
			this.#counterNode.textContent = this.#getCounterText();
		}
	}

	// The indicator holds the nodes of its controls and lets go of them here, so that a card nobody shows any
	// more keeps none of ours alive.
	destroy(): void
	{
		this.#arrowPresses.forEach(({ node, handler }) => Event.unbind(node, 'click', handler));
		this.#arrowPresses = [];
		this.#container = null;
		this.#stepNodes = [];
		this.#counterNode = null;
		this.#prevArrow = null;
		this.#nextArrow = null;
	}

	#renderContainer(): HTMLElement
	{
		const container: HTMLElement = Tag.render`
			<div
				class="${BLOCK_CLASS}"
				role="group"
				aria-label="${Loc.getMessage('UI_SYSTEM_WHATS_NEW_STEPS_ARIA') ?? ''}"
				data-testid="announce-dialog-steps"
			>
				${this.#renderArrow(PREVIOUS)}
				${this.#renderSteps()}
				${this.#renderArrow(NEXT)}
			</div>
		`;

		// The state of the arrows is put on by the same code that moves it later, so a drawn indicator and a
		// changed one never differ.
		this.#markArrows();

		return container;
	}

	/*
	 * The arrow is a plain button of the design system: the box, the states, the off look and the focus ring
	 * come from there, and the chevron is the very glyph such a button draws in its collapsed mode. The
	 * indicator stands in the context of a dark edge, so the plain style comes light without a token of ours.
	 *
	 * A step with nowhere to go turns the arrow off natively: the design system paints both `[disabled]` and
	 * its own class, and the native one keeps the control out of the tab order as well.
	 */
	#renderArrow(step: number): HTMLElement
	{
		const isPrevious: boolean = step === PREVIOUS;
		const label: string = Loc.getMessage(
			isPrevious ? 'UI_SYSTEM_WHATS_NEW_STEP_PREV_ARIA' : 'UI_SYSTEM_WHATS_NEW_STEP_NEXT_ARIA',
		) ?? '';

		const node: HTMLElement = new Button({
			useAirDesign: true,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			size: ButtonSize.SMALL,
			// The button carries no text, so it is a collapsed one and the icon of that mode is its own.
			collapsedIcon: isPrevious ? ButtonIcon.CHEVRON_LEFT_S : ButtonIcon.CHEVRON_RIGHT_S,
			props: { type: 'button', 'aria-label': label },
			dataset: { testid: `announce-dialog-step-${isPrevious ? 'prev' : 'next'}` },
		}).render();

		const handler = (): void => (isPrevious ? this.#onPrev() : this.#onNext());

		Event.bind(node, 'click', handler);
		this.#arrowPresses.push({ node, handler });

		if (isPrevious)
		{
			this.#prevArrow = node;
		}
		else
		{
			this.#nextArrow = node;
		}

		return node;
	}

	/*
	 * What stands between the arrows: the steps of the row while they fit, and the counter once they do not.
	 * The two never stand together - a row of steps carries the position by itself, and the counter is what is
	 * left of it where there is no row.
	 */
	#renderSteps(): HTMLElement
	{
		const content: HTMLElement | HTMLElement[] = this.#stepCount > STEP_DOTS_MAX
			? this.#renderCounter()
			: this.#renderStepButtons();

		return Tag.render`
			<div class="${BLOCK_CLASS}__steps" data-testid="announce-dialog-step-row">${content}</div>
		`;
	}

	#renderStepButtons(): HTMLElement[]
	{
		this.#stepNodes = Array.from({ length: this.#stepCount }, (unused, step) => this.#renderStep(step));

		return this.#stepNodes;
	}

	/*
	 * Every step is a control of its own: it takes focus, answers the keyboard and names itself to assistive
	 * technology, and the current one is marked as the position of the wizard. The step the wizard stands on
	 * shows its own number and every other one a dot; both stand in the button, so moving the position moves a
	 * class and never rebuilds the row.
	 */
	#renderStep(step: number): HTMLElement
	{
		const label: string = Loc.getMessage('UI_SYSTEM_WHATS_NEW_STEP_ARIA', {
			'#NUMBER#': String(step + 1),
			'#TOTAL#': String(this.#stepCount),
		}) ?? '';

		const number: HTMLElement = Text.render(String(step + 1), {
			size: NUMBER_SIZE,
			className: `${BLOCK_CLASS}__step-number`,
		});

		const node: HTMLElement = Tag.render`
			<button
				type="button"
				class="${BLOCK_CLASS}__step"
				aria-label="${label}"
				data-testid="announce-dialog-step-${step}"
				onclick="${() => this.#onDot(step)}"
			>
				<span class="${BLOCK_CLASS}__step-mark"></span>${number}
			</button>
		`;

		// The mark is put on by the same code that moves it later, so a drawn row and a changed one never
		// differ.
		this.#markStep(node, step === this.#currentStep);

		return node;
	}

	/*
	 * The counter of the position, drawn where the steps themselves are not. Nothing else names the position
	 * there - the named steps are gone with the row - so the line is announced to assistive technology as it
	 * changes, and politely: a wizard the user walks is no place to interrupt them.
	 */
	#renderCounter(): HTMLElement
	{
		const node: HTMLElement = Text.render(this.#getCounterText(), {
			size: NUMBER_SIZE,
			className: `${BLOCK_CLASS}__counter`,
		});

		node.setAttribute('aria-live', 'polite');
		node.dataset.testid = 'announce-dialog-step-counter';

		this.#counterNode = node;

		return node;
	}

	#getCounterText(): string
	{
		return Loc.getMessage('UI_SYSTEM_WHATS_NEW_STEP_COUNTER', {
			'#NUMBER#': String(this.#currentStep + 1),
			'#TOTAL#': String(this.#stepCount),
		}) ?? '';
	}

	// The row of steps has a first and a last one, unlike the ring of a gallery: an arrow with nowhere to go is
	// turned off natively, which both leaves the keyboard walk on its own and keeps the press from happening.
	// The off state is put on by the attribute and not by the property: the button of the design system hands
	// its node over as an element, and the attribute reflects into the property all the same - so the control
	// stays natively off, out of the tab order and out of reach of a press.
	#markArrows(): void
	{
		this.#markArrow(this.#prevArrow, this.#currentStep <= 0);
		this.#markArrow(this.#nextArrow, this.#currentStep >= this.#stepCount - 1);
	}

	#markArrow(node: HTMLElement | null, isOff: boolean): void
	{
		if (node)
		{
			Dom.attr(node, 'disabled', isOff ? true : null);
		}
	}

	#markStep(node: HTMLElement, isCurrent: boolean): void
	{
		if (isCurrent)
		{
			Dom.addClass(node, ACTIVE_CLASS);
		}
		else
		{
			Dom.removeClass(node, ACTIVE_CLASS);
		}

		node.setAttribute('aria-current', isCurrent ? 'step' : 'false');
	}
}
