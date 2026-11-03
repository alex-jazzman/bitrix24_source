import { Dom, Loc, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import {
	type PerformerTask,
	type PerformerTaskButton,
} from 'bizproc.task.performer';

/**
 * The decision a homogeneous selection is performed by. The server leaves the item of the panel
 * empty: which decisions the selection offers is known from the checked rows only, so the list fills
 * the container itself. Nothing chosen is not a decision by default - approving and rejecting look
 * alike in a menu, and neither may happen just because a menu had a first item.
 */
export class DecisionControl
{
	#container: ?HTMLElement = null;
	#button: ?Button = null;
	#buttons: Array<PerformerTaskButton> = [];
	#selected: ?PerformerTaskButton = null;

	/** Takes over the container of the panel item. The panel is rebuilt with the grid, and so is this. */
	renderTo(container: ?HTMLElement): void
	{
		this.#dropButton();
		// the offer belongs to the container it was drawn in, and this is another one
		this.#buttons = [];
		this.#selected = null;
		this.#container = Type.isDomNode(container) ? container : null;

		if (this.#container === null)
		{
			return;
		}

		Dom.clean(this.#container);
		Dom.attr(this.#container, {
			role: 'group',
			'aria-label': Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_DECISION_LABEL'),
		});
		Dom.hide(this.#container);
	}

	/**
	 * @param tasks The tasks of the selection the pass would start with. A selection that offers no
	 *   single decision leaves the container empty: the decision is then made inside the pass.
	 */
	update(tasks: Array<PerformerTask>): void
	{
		const buttons = readDecisionButtons(tasks);

		// the same offer is the same control: a selection grown by a row of the same kind of task must
		// not take away the decision the person has already chosen
		if (isSameOffer(buttons, this.#buttons))
		{
			return;
		}

		// another offer is another kind of task, and the previous choice says nothing about it
		this.#buttons = buttons;
		this.#selected = null;

		this.#render();
	}

	/** The task request the pass starts with, or nothing while no decision is chosen. */
	get decision(): ?Object
	{
		return this.#selected === null ? null : { [this.#selected.NAME]: this.#selected.VALUE };
	}

	#render(): void
	{
		if (this.#container === null)
		{
			return;
		}

		this.#dropButton();
		Dom.clean(this.#container);

		if (this.#buttons.length === 0)
		{
			Dom.hide(this.#container);

			return;
		}

		this.#button = new Button({
			text: this.#getText(),
			useAirDesign: true,
			size: ButtonSize.SMALL,
			style: AirButtonStyle.OUTLINE,
			dropdown: true,
			dataset: { testid: 'bizproc-user-processes-decision-selector' },
			systemMenu: { items: this.#getMenuItems() },
		});
		this.#button.renderTo(this.#container);
		// the panel of the grid lives inside the form of the grid, and a button element with no type of
		// its own submits it: the answer of the form rebuilds the grid, which drops the checked rows and
		// the menu of decisions along with them
		Dom.attr(this.#button.getContainer(), 'type', 'button');
		// the menu of the button writes aria-haspopup on it the moment it first opens, so until then
		// nothing tells that the button offers a choice of decisions at all
		Dom.attr(this.#button.getContainer(), 'aria-haspopup', 'menu');
		Dom.show(this.#container);
	}

	#getMenuItems(): Array<Object>
	{
		return this.#buttons.map((button) => ({
			title: button.TEXT,
			dataset: { testid: `bizproc-user-processes-decision-${button.NAME}` },
			onClick: () => this.#choose(button),
		}));
	}

	#choose(button: PerformerTaskButton): void
	{
		this.#selected = button;
		this.#button?.setText(this.#getText());
	}

	#getText(): string
	{
		return this.#selected === null
			? Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_DECISION_PLACEHOLDER')
			: this.#selected.TEXT
		;
	}

	/** The menu of the previous offer owns a popup: dropping the button alone would leave it behind. */
	#dropButton(): void
	{
		this.#button?.setSystemMenu(false);
		this.#button = null;
	}
}

/**
 * A selection one decision is enough for: every task of it goes without a form and they all carry one
 * and the same hash. This is the very condition the batch rule of the mechanics applies, and the panel
 * has to know it up front - to offer the decisions of the task at all.
 */
export function isSingleDecisionSelection(tasks: Array<PerformerTask>): boolean
{
	const hash = tasks[0]?.hash;

	return Type.isStringFilled(hash) && tasks.every((task) => task.isInline === true && task.hash === hash);
}

/** The decisions the selection offers: the buttons of its task, since every task of it is the same. */
function readDecisionButtons(tasks: Array<PerformerTask>): Array<PerformerTaskButton>
{
	if (!isSingleDecisionSelection(tasks))
	{
		return [];
	}

	const buttons = tasks[0].controls?.buttons;

	return Type.isArrayFilled(buttons) ? buttons.filter((button) => isDecisionButton(button)) : [];
}

/** A button with nothing to send or nothing to read is not a decision the person can be offered. */
function isDecisionButton(button: ?Object): boolean
{
	return Type.isStringFilled(button?.NAME) && Type.isStringFilled(button?.TEXT);
}

/**
 * The label is part of the decision, not a look of it: two templates naming the same decisions with
 * different words are different offers, and the menu must not keep the words of the previous one.
 */
function isSameDecision(button: PerformerTaskButton, other: ?PerformerTaskButton): boolean
{
	return button.NAME === other?.NAME
		&& button.VALUE === other?.VALUE
		&& button.TEXT === other?.TEXT
	;
}

/** Whether the selection offers the very same decisions in the very same order. */
function isSameOffer(buttons: Array<PerformerTaskButton>, other: Array<PerformerTaskButton>): boolean
{
	return buttons.length === other.length
		&& buttons.every((button, index) => isSameDecision(button, other[index]));
}
