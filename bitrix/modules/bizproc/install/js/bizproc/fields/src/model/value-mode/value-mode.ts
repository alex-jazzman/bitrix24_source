import {Dom, Event, Tag, Text, Type} from 'main.core';
import {ValueMode} from '../../const/const';
import {type ValueModeValue} from '../../const/type';

const TAB_CLASS = 'bizproc-fields-value-mode__tab';
const ACTIVE_MODIFIER = '--active';

/** How far a key moves the selection along the tabs, the list being walked round. */
const KEY_STEPS: Record<string, number> = {
	ArrowLeft: -1,
	ArrowUp: -1,
	ArrowRight: 1,
	ArrowDown: 1,
};

/**
 * What a type calls the two ways it can be filled: its own control, and the expression standing
 * in for a value.
 */
export type ValueModeLabels = {
	value: string,
	expression: string,
};

export type ValueModeSwitcherParams = {
	labels: ValueModeLabels,
	activeMode: ValueModeValue,
	groupLabel: string,
	fieldName: string,
	readOnly: boolean,
	onSelect: (mode: ValueModeValue) => void,
};

/**
 * The rendered switcher: `node` is the row the core puts above the control, `setActiveMode`
 * moves the selection without announcing it - what a programmatic change of the mode uses.
 */
export type ValueModeSwitcher = {
	node: HTMLElement,
	setActiveMode: (mode: ValueModeValue) => void,
};

/**
 * The row of two tabs above the control, in the order the mockup gives them: the control of the
 * type first, the expression behind it.
 *
 * A radio group rather than a tab list: both carriers stay on screen whichever mode is on - the
 * inactive one only fades - so there is no panel being shown and hidden, while "one of two ways
 * to fill this field" is what a radio group states. Built here because `ui` carries no segmented
 * control of its own yet; the semantics live in this one function, so replacing it with a
 * component of the design system stays an edit of this file.
 *
 * The tabs of a read-only field stay on screen and keep announcing which carrier fills it - a field
 * opened on a saved expression has to show that it is filled that way - but they take no pick: the
 * mode moves the value from one carrier to the other, and a field nobody may edit must not lose the
 * value it holds. Announced through `aria-disabled` with the selection simply not bound, the way the
 * read-only toggle of bool is: `disabled` would take the row out of the tab order and leave the
 * active mode unreadable to a keyboard user.
 */
export function buildValueModeSwitcher(params: ValueModeSwitcherParams): ValueModeSwitcher
{
	const modes: ValueModeValue[] = [ValueMode.Value, ValueMode.Expression];
	const tabs: HTMLElement[] = [];
	let activeMode: ValueModeValue = params.activeMode;

	const setActiveMode = (mode: ValueModeValue): void =>
	{
		activeMode = mode;

		tabs.forEach((tab, index) =>
		{
			const isActive = modes[index] === activeMode;

			Dom.attr(tab, 'aria-checked', isActive ? 'true' : 'false');
			// Roving tabindex: the group is one stop in the tab order, the arrow keys walk inside it.
			Dom.attr(tab, 'tabindex', isActive ? '0' : '-1');

			if (isActive)
			{
				Dom.addClass(tab, ACTIVE_MODIFIER);
			}
			else
			{
				Dom.removeClass(tab, ACTIVE_MODIFIER);
			}
		});
	};

	const selectMode = (mode: ValueModeValue): void =>
	{
		if (mode === activeMode)
		{
			return;
		}

		setActiveMode(mode);
		params.onSelect(mode);
	};

	const node: HTMLElement = Tag.render`
		<div
			class="bizproc-fields-value-mode"
			role="radiogroup"
			aria-label="${Text.encode(params.groupLabel)}"
			data-testid="${Text.encode(`bizproc-field-mode-switcher-${params.fieldName}`)}"
		></div>
	`;

	modes.forEach((mode) =>
	{
		const label = mode === ValueMode.Value ? params.labels.value : params.labels.expression;
		const tab: HTMLElement = Tag.render`
			<button
				type="button"
				class="${TAB_CLASS}"
				role="radio"
				aria-checked="false"
				tabindex="-1"
				data-testid="${Text.encode(`bizproc-field-mode-${mode}-${params.fieldName}`)}"
			>${Text.encode(label)}</button>
		`;

		if (params.readOnly)
		{
			Dom.attr(tab, 'aria-disabled', 'true');
		}
		else
		{
			Event.bind(tab, 'click', () =>
			{
				selectMode(mode);
			});
		}

		tabs.push(tab);
		Dom.append(tab, node);
	});

	if (!params.readOnly)
	{
		Event.bind(node, 'keydown', (event: KeyboardEvent) =>
		{
			const step = KEY_STEPS[event.key];

			if (Type.isUndefined(step))
			{
				return;
			}

			// An arrow inside a radio group moves the selection, not just the focus, and the page must
			// not scroll while it does.
			event.preventDefault();

			const nextIndex = (modes.indexOf(activeMode) + step + modes.length) % modes.length;

			selectMode(modes[nextIndex]);
			tabs[nextIndex].focus();
		});
	}

	setActiveMode(activeMode);

	return {node, setActiveMode};
}
