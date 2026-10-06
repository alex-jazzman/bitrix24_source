import 'ui.design-tokens';
import 'ui.icon-set.outline';
import 'ui.icon-set.main';
import 'main.date';

import './style.css';

import { Tag, Text, Loc, Type, Event, Dom, Extension } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { BaseField, FieldRegistry, type RenderedControl } from 'bizproc.fields';
import { DatePicker } from 'ui.date-picker';

const NUMERIC_OFFSET: RegExp = /^-?\d+$/;
// A bizproc expression ({=Source:Field}, {{...}}, {{=...}}, = ...) is not a date.
const EXPRESSION_VALUE: RegExp = /^\s*[={]/;
const TIMEZONE_SETTINGS_ID: string = 'bizproc.fields.datetime';
// A zero offset is server time here, and the zone that says so explicitly - the one with an
// empty value - must win over a zone that merely shares the offset.
const ZONE_MATCH = { preferEmptyZoneAtZeroOffset: true };
const ROW_SELECTOR: string = '.bizproc-fields-datetime-row';
const VALUE_INPUT_SELECTOR: string = '.bizproc-fields-datetime__input';
const CALENDAR_BUTTON_SELECTOR: string = '.bizproc-fields-datetime__calendar';
const TIMEZONE_SELECTOR: string = '.bizproc-type-control-date-lc';
// Where the stored datetime waits while the control shows it truncated to the minute.
const FULL_VALUE_ATTR: string = 'data-full-value';

class DatetimeField extends BaseField
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
		const mask = Extension.getSettings('main.date').get('formats.FORMAT_DATETIME');

		return Type.isStringFilled(mask)
			? mask.replace(/:ss/gi, '')
			: (Loc.getMessage('BIZPROC_FIELDS_DATETIME_PLACEHOLDER') ?? '');
	}

	/**
	 * The input is never typed into - the moment is picked in the calendar - so it carries
	 * `readonly` even when the field is editable. The calendar button belongs inside the
	 * bordered box, the zone select next to it in the row.
	 */
	renderControl(value: string | string[] | null): RenderedControl
	{
		const rawValue = Type.isArray<string>(value) ? (value[0] ?? '') : (value ?? '');
		const {value: datetimeValue, offset} = this.splitOffset(rawValue);
		const readOnly = this.isReadOnly();

		const {root, control, valueNode} = this.renderTextControl({
			blockClass: 'bizproc-fields-datetime',
			value: this.#stripSeconds(datetimeValue),
			nonEditable: true,
			rowNodes: [this.#renderTimezone(offset)],
		});

		this.#rememberFullValue(valueNode, datetimeValue);

		if (!readOnly)
		{
			const calendarButton: HTMLElement = Tag.render`
				<button
					type="button"
					class="bizproc-fields-datetime__calendar"
					aria-label="${Text.encode(Loc.getMessage('BIZPROC_FIELDS_DATETIME_OPEN_CALENDAR') ?? '')}"
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
	 * Overridden because the value of a datetime is split across two controls: the input
	 * holds the date the user reads, the select next to it holds the zone, and the stored
	 * format joins them as `<datetime> [offset]` (backend Value\DateTime::serialize).
	 * Reading only the input would drop the zone on every round trip - the re-render feeds
	 * the field back from its own value, so the offset would be lost there.
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
	 * `<datetime> [offset]` string into the input. The datetime goes into the input, the
	 * offset back into the zone select - by the same rules renderControl() follows, so
	 * writing a value and rendering it produce the same state.
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
			// value[0] rather than the base's join: a single datetime control shows one
			// datetime, which is how renderControl() seeds it from an array too.
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
			enableTime: true,
			cutZeroTime: false,
			selectionMode: 'single',
			popupOptions: {
				targetContainer: input.ownerDocument?.body || document.body,
			},
		});

		// The picker writes the input itself, which fires no native change. Subscribed once, on
		// creation, and to onSelectChange because updateInputFields() runs before the picker
		// emits - so the input already holds the picked moment when this reaches a listener.
		picker.subscribe('onSelectChange', () => this.emitChange());

		this.#pickers.set(input, picker);
		picker.show();
	}

	#clearValue(input: HTMLInputElement): void
	{
		input.value = '';
		// The stored moment goes with the cleared display: nothing is left to restore seconds from.
		this.#rememberFullValue(input, '');
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
			selected: this.findTimezone(timezones, offset, ZONE_MATCH),
			ariaLabel: Loc.getMessage('BIZPROC_FIELDS_DATETIME_TIMEZONE') ?? '',
		});
	}

	/** Time is shown to the minute: the seconds of the culture mask are dropped for display. */
	#stripSeconds(value: string): string
	{
		if (!Type.isStringFilled(value) || !/\d{1,2}:\d{2}/.test(value))
		{
			return value;
		}

		const settings = Extension.getSettings('main.date');
		const formatDatetime = settings.get('formats.FORMAT_DATETIME');
		if (!Type.isStringFilled(formatDatetime))
		{
			return value;
		}

		const parsed = DateTimeFormat.parse(value, false, settings.get('formats.FORMAT_DATE'), formatDatetime);
		if (!Type.isDate(parsed))
		{
			return value;
		}

		return DateTimeFormat.format(DateTimeFormat.convertBitrixFormat(formatDatetime.replace(/:ss/gi, '')), parsed);
	}

	#serializeValue(valueNode: HTMLElement): string
	{
		const value = this.#restoreSeconds(valueNode, (valueNode as HTMLInputElement).value ?? '');

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
		const {value: datetimeValue, offset} = this.splitOffset(value);

		(valueNode as HTMLInputElement).value = this.#stripSeconds(datetimeValue);
		this.#rememberFullValue(valueNode, datetimeValue);
		this.#selectZone(valueNode, offset);
	}

	/**
	 * Keeps the stored datetime next to the control that shows it without seconds. Held as an
	 * attribute rather than in a map keyed by the node: the selection decorator replaces the
	 * value node with a clone, and cloneNode copies attributes but would lose a map entry.
	 * Nothing is kept when the value has no seconds to lose.
	 */
	#rememberFullValue(valueNode: HTMLElement, value: string): void
	{
		const keep = Type.isStringFilled(value) && this.#stripSeconds(value) !== value;

		Dom.attr(valueNode, FULL_VALUE_ATTR, keep ? value : null);
	}

	/**
	 * What to store for the moment the control shows. Time is displayed to the minute, so a value
	 * nobody touched would otherwise be saved shorn of the seconds it arrived with: the stored
	 * string comes back whenever it still describes what is on screen. A moment picked anew is
	 * written to the input alone, so its display stops matching and the stored one is dropped.
	 */
	#restoreSeconds(valueNode: HTMLElement, displayed: string): string
	{
		const stored = Dom.attr(valueNode, FULL_VALUE_ATTR);

		if (!Type.isStringFilled(stored) || this.#stripSeconds(stored) !== displayed)
		{
			return displayed;
		}

		return stored;
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

		const zone = this.findTimezone(this.getTimezones(TIMEZONE_SETTINGS_ID), offset, ZONE_MATCH);

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

FieldRegistry.register('datetime', DatetimeField);

export { DatetimeField };
