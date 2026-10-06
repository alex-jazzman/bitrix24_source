import 'ui.design-tokens';
import 'ui.icon-set.outline';
import 'ui.icon-set.main';
import 'main.date';

import './style.css';

import { Tag, Text, Loc, Type, Event, Dom, Extension } from 'main.core';
import { BaseField, FieldRegistry, type RenderedControl } from 'bizproc.fields';
import { DatePicker } from 'ui.date-picker';

const NUMERIC_OFFSET: RegExp = /^-?\d+$/;
// A bizproc expression ({=Source:Field}, {{...}}, {{=...}}, = ...) is not a date.
const EXPRESSION_VALUE: RegExp = /^\s*[={]/;
const TIMEZONE_SETTINGS_ID: string = 'bizproc.fields.date';
const ROW_SELECTOR: string = '.bizproc-fields-date-row';
const VALUE_INPUT_SELECTOR: string = '.bizproc-fields-date__input';
const CALENDAR_BUTTON_SELECTOR: string = '.bizproc-fields-date__calendar';
const TIMEZONE_SELECTOR: string = '.bizproc-type-control-date-lc';

class DateField extends BaseField
{
	// Pickers of the current render, keyed by the input they are attached to. Deliberately
	// not a WeakMap: a picker that was shown once stays reachable from PopupManager (its
	// popup is cacheable, so closing does not destroy it), so nothing here is collected on
	// its own - the map owns the pickers it has to dispose of.
	#pickers: Map<HTMLElement, DatePicker> = new Map();

	/**
	 * Destroying a picker closes a calendar left open - it would otherwise hang over a node no
	 * longer in the document - and takes its popup out of the document; merely hiding it would
	 * leave the node behind, and PopupManager would keep holding the picker.
	 */
	protected release(): void
	{
		this.#pickers.forEach((picker) => picker.destroy());
		this.#pickers.clear();
	}

	protected getDefaultPlaceholder(): string
	{
		const mask = Extension.getSettings('main.date').get('formats.FORMAT_DATE');

		return Type.isStringFilled(mask)
			? mask
			: (Loc.getMessage('BIZPROC_FIELDS_DATE_PLACEHOLDER') ?? '');
	}

	/**
	 * The input is never typed into - the date is picked in the calendar - so it carries
	 * `readonly` even when the field is editable. The calendar button belongs inside the
	 * bordered box, the zone select next to it in the row.
	 */
	renderControl(value: string | string[] | null): RenderedControl
	{
		const rawValue = Type.isArray<string>(value) ? (value[0] ?? '') : (value ?? '');
		const {value: dateValue, offset} = this.splitOffset(rawValue);
		const readOnly = this.isReadOnly();

		const {root, control, valueNode} = this.renderTextControl({
			blockClass: 'bizproc-fields-date',
			value: dateValue,
			nonEditable: true,
			rowNodes: [this.#renderTimezone(offset)],
		});

		if (!readOnly)
		{
			const calendarButton: HTMLElement = Tag.render`
				<button
					type="button"
					class="bizproc-fields-date__calendar"
					aria-label="${Text.encode(Loc.getMessage('BIZPROC_FIELDS_DATE_OPEN_CALENDAR') ?? '')}"
					data-testid="${Text.encode(`bizproc-field-calendar-${this.getFieldName()}`)}"
				>
					<div class="ui-icon-set --calendar-2" aria-hidden="true"></div>
				</button>
			`;

			Dom.append(calendarButton, control);
			this.#bindPickerTriggers(root);
		}

		return {root, valueNode};
	}

	/**
	 * Overridden because the value of a date is split across two controls: the input holds
	 * the date the user reads, the select next to it holds the zone, and the stored format
	 * joins them as `<date> [offset]` (backend Value\Date::serialize). Reading only the
	 * input would drop the zone on every round trip - the re-render feeds the field back
	 * from its own value, so the offset would be lost there.
	 */
	getValue(): string | string[]
	{
		const nodes = this.getValueNodes();

		if (this.isMultiple())
		{
			return nodes
				.map((node) => this.#serializeValue(node))
				.filter((item) => item !== '');
		}

		const node = nodes[0];

		return Type.isUndefined(node) ? '' : this.#serializeValue(node);
	}

	/**
	 * Overridden as the counterpart of getValue(): the base would write the whole
	 * `<date> [offset]` string into the input. The date goes into the input, the offset
	 * back into the zone select - by the same rule renderControl() follows, so writing a
	 * value and rendering it produce the same state.
	 */
	protected applyValue(value: string | string[]): void
	{
		const nodes = this.getValueNodes();

		if (this.isMultiple())
		{
			const values = Type.isArray<string>(value) ? value : value.split(',');
			nodes.forEach((node, index) => this.#writeValue(node, values[index] ?? ''));

			return;
		}

		const node = nodes[0];

		if (!Type.isUndefined(node))
		{
			// value[0] rather than the base's join: a single date control shows one date,
			// which is how renderControl() seeds it from an array too.
			this.#writeValue(node, Type.isArray<string>(value) ? (value[0] ?? '') : value);
		}
	}

	/**
	 * Picker triggers listen on the row, not on the input itself: the selection
	 * decorator replaces the value node with a clone (cloneNode drops listeners), so
	 * the live input has to be resolved when the event fires, not when it is rendered.
	 */
	#bindPickerTriggers(row: HTMLElement): void
	{
		Event.bind(row, 'click', (event: MouseEvent) => {
			const trigger = this.#closest(event.target, `${VALUE_INPUT_SELECTOR}, ${CALENDAR_BUTTON_SELECTOR}`);
			if (Type.isNull(trigger))
			{
				return;
			}

			const input = row.querySelector<HTMLInputElement>(VALUE_INPUT_SELECTOR);
			if (!Type.isNull(input))
			{
				this.#openPicker(input);
			}
		});

		Event.bind(row, 'keydown', (event: KeyboardEvent) => {
			if (event.key !== 'Delete' && event.key !== 'Backspace')
			{
				return;
			}

			const input = this.#closest<HTMLInputElement>(event.target, VALUE_INPUT_SELECTOR);
			if (Type.isNull(input))
			{
				return;
			}

			event.preventDefault();
			this.#clearValue(input);
		});
	}

	#closest<T extends HTMLElement = HTMLElement>(target: EventTarget | null, selector: string): T | null
	{
		return Type.isElementNode(target) ? target.closest<T>(selector) : null;
	}

	#openPicker(input: HTMLInputElement): void
	{
		const known = this.#pickers.get(input);

		if (!Type.isUndefined(known))
		{
			known.show();

			return;
		}

		const picker = new DatePicker({
			targetNode: input,
			inputField: input,
			type: 'date',
			selectionMode: 'single',
			popupOptions: {
				targetContainer: input.ownerDocument?.body || document.body,
			},
		});

		// The picker writes the input itself, which fires no native change. Subscribed once, on
		// creation, and to onSelectChange because updateInputFields() runs before the picker
		// emits - so the input already holds the picked date when this reaches a listener.
		picker.subscribe('onSelectChange', () => this.emitChange());

		this.#pickers.set(input, picker);
		picker.show();
	}

	#clearValue(input: HTMLInputElement): void
	{
		input.value = '';
		this.#pickers.get(input)?.deselectAll({ emitEvents: false });
		// Clearing by keyboard empties the value as surely as picking one fills it, and the
		// write above fires no native change of its own.
		this.emitChange();
	}

	#renderTimezone(offset: string | null): HTMLElement | null
	{
		const timezones = this.getTimezones(TIMEZONE_SETTINGS_ID);

		return this.renderTimezoneSelect({
			timezones,
			selected: this.findTimezone(timezones, offset),
			ariaLabel: Loc.getMessage('BIZPROC_FIELDS_DATE_TIMEZONE') ?? '',
		});
	}

	#serializeValue(valueNode: HTMLElement): string
	{
		const value = (valueNode as HTMLInputElement).value ?? '';

		// An expression is stored verbatim, the zone never becomes part of it - the same
		// rule the backend follows in Date::extractValue.
		if (!Type.isStringFilled(value) || EXPRESSION_VALUE.test(value))
		{
			return value;
		}

		const offset = this.#selectedOffset(valueNode);

		return Type.isNull(offset) ? value : `${value} [${offset}]`;
	}

	#writeValue(valueNode: HTMLElement, value: string): void
	{
		const {value: dateValue, offset} = this.splitOffset(value);

		(valueNode as HTMLInputElement).value = dateValue;
		this.#selectZone(valueNode, offset);
	}

	#selectedOffset(valueNode: HTMLElement): string | null
	{
		const select = this.#getTimezoneSelect(valueNode);

		if (Type.isNull(select))
		{
			return null;
		}

		const zone = this.getTimezones(TIMEZONE_SETTINGS_ID).find((item) => String(item.value) === select.value);

		if (Type.isUndefined(zone))
		{
			return null;
		}

		const offset = String(zone.offset);

		// Only a numeric offset round-trips: 'current' becomes one on the server
		// (CTimeZone::GetOffset), so it travels as "no suffix" - which is how the value
		// reads back into the 'current' zone.
		return NUMERIC_OFFSET.test(offset) ? offset : null;
	}

	#selectZone(valueNode: HTMLElement, offset: string | null): void
	{
		const select = this.#getTimezoneSelect(valueNode);

		if (Type.isNull(select))
		{
			return;
		}

		const zone = this.findTimezone(this.getTimezones(TIMEZONE_SETTINGS_ID), offset);

		if (!Type.isUndefined(zone))
		{
			select.value = String(zone.value);
		}
	}

	#getTimezoneSelect(valueNode: HTMLElement): HTMLSelectElement | null
	{
		const row = valueNode.closest(ROW_SELECTOR);

		return Type.isNull(row) ? null : row.querySelector<HTMLSelectElement>(TIMEZONE_SELECTOR);
	}
}

FieldRegistry.register('date', DateField);

export { DateField };
