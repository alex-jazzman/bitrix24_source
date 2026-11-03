/**
 * @module layout/ui/field-filter/filter/src/fields/controls/date-period
 */
jn.define('layout/ui/field-filter/filter/src/fields/controls/date-period', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
	const { createTestIdGenerator } = require('utils/test');
	const { useCallback } = require('utils/function');
	const { Text4 } = require('ui-system/typography/text');
	const { Switcher } = require('ui-system/blocks/switcher');
	const { DateTimeInput, DatePickerType } = require('ui-system/form/inputs/datetime');
	const { DateBoundaryPreset, getPresetExtras, toExtraNumber } = require('layout/ui/field-filter/values');
	const { SelectableRow } = require('layout/ui/field-filter/filter/src/layout/selectable-row');
	const { ROW_PADDING } = require('layout/ui/field-filter/filter/src/layout/section');
	const { getClearProps } = require('layout/ui/field-filter/filter/src/layout/clearable-input');
	const { getDefaultDateExtras } = require('layout/ui/field-filter/filter/src/fields/controls/date-extras');
	const { toSeconds, toMilliseconds } = require('layout/ui/field-filter/filter/src/fields/controls/date-units');
	const {
		getAnyText,
		getDatePresetLabel,
		getDatePresetIds,
		getYearsSwitcherLabel,
	} = require('layout/ui/field-filter/filter/src/model/value-formatter');

	/**
	 * Date period with presets (DateType) plus a custom range built from two date pickers. Every
	 * period is a row of one list, the way a list field offers its values: the picker is a screen
	 * of its own, so a menu behind a single button would hide the choice behind two taps.
	 *
	 * Serializes to `_datesel` (+ `_from`/`_to` for RANGE/EXACT) per ALG-01.
	 *
	 * @extends {PureComponent<DatePeriodControlProps>}
	 */
	class DatePeriodControl extends PureComponent
	{
		/**
		 * @param {DatePeriodControlProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this, prefix: 'date' });
			this.state = this.buildState(props);
		}

		componentWillReceiveProps(nextProps)
		{
			this.state = this.buildState(nextProps);
		}

		buildState(props)
		{
			const value = props.value || {};

			return {
				preset: Type.isStringFilled(value.preset) ? value.preset : null,
				from: value.from ?? null,
				to: value.to ?? null,
				allowYear: Boolean(value.allowYear),
				// a period already counted from a number keeps it: the field is opened on what it holds
				extras: readExtras(value),
			};
		}

		/**
		 * Periods the field offers: the vocabulary of the portal (FilterDictionary) less the ones the
		 * provider of this field takes away. The list is not carried by the descriptor - the same two
		 * dozen periods in every date field of a list is one list sent over and over.
		 *
		 * @return {string[]}
		 */
		getPresets()
		{
			const { descriptor } = this.props;
			const excluded = Type.isArrayFilled(descriptor?.excludedDatePresets)
				? new Set(descriptor.excludedDatePresets)
				: null;

			const presets = getDatePresetIds();

			return excluded === null ? presets : presets.filter((preset) => !excluded.has(preset));
		}

		isBoundaryPreset(preset)
		{
			return DateBoundaryPreset.isDefined(preset);
		}

		withTime()
		{
			return Boolean(this.props.descriptor?.withTime);
		}

		/**
		 * Mirrors the web control: the switcher belongs to presets that carry no explicit boundaries.
		 *
		 * @return {boolean}
		 */
		hasYearsSwitcher()
		{
			const { descriptor } = this.props;
			const { preset } = this.state;

			return Boolean(descriptor?.allowYearsSwitcher)
				&& Type.isStringFilled(preset)
				&& !this.isBoundaryPreset(preset);
		}

		getPresetLabel(preset)
		{
			if (!Type.isStringFilled(preset))
			{
				return getAnyText();
			}

			const message = getDatePresetLabel(preset);

			return Type.isStringFilled(message) ? message : preset;
		}

		/**
		 * Rows of the list, the first of which is "any date": an unset field has to be reachable
		 * by a choice and not only by clearing what is chosen.
		 *
		 * @return {{ id: ?string, title: string, selected: boolean }[]}
		 */
		getPresetRows()
		{
			const { preset } = this.state;

			return [null, ...this.getPresets()].map((rowPreset) => ({
				id: rowPreset,
				title: this.getPresetLabel(rowPreset),
				selected: rowPreset === null
					? !Type.isStringFilled(preset)
					: rowPreset === preset,
			}));
		}

		/**
		 * The boundaries belong to the period, so they go with it: a range left over from the
		 * previous choice would keep filtering under a period that has no boundaries of its own. So do
		 * the numbers a period is counted from - a period that has its own opens on them.
		 *
		 * @param {?string} preset
		 */
		selectPreset(preset)
		{
			this.setState(
				{ preset, from: null, to: null, extras: getDefaultDateExtras(preset) },
				() => this.emitChange(),
			);
		}

		/**
		 * The boundaries and the switcher keep the same handler across renders: a function built in
		 * render is a changed prop, and a pure child repaints because of it alone. Hence the fields
		 * rather than the methods.
		 */
		changeFrom = (value) => {
			this.setState({ from: toMilliseconds(value) }, () => this.emitChange());
		};

		changeTo = (value) => {
			this.setState({ to: toMilliseconds(value) }, () => this.emitChange());
		};

		/**
		 * A boundary picked from the calendar has no other way back: the input opens the calendar
		 * again and a calendar has no empty date to choose.
		 */
		clearFrom = () => {
			this.changeFrom(null);
		};

		clearTo = () => {
			this.changeTo(null);
		};

		changeAllowYear = (checked) => {
			this.setState({ allowYear: Boolean(checked) }, () => this.emitChange());
		};

		emitChange()
		{
			const { preset, from, to, allowYear, extras } = this.state;
			this.props.onChange?.({ preset, from, to, allowYear, ...extras });
		}

		render()
		{
			const rows = this.getPresetRows();

			return View(
				{
					testId: this.getTestId(),
					style: { flexDirection: 'column' },
				},
				...rows.map((row, index) => View(
					{ style: { flexDirection: 'column' } },
					SelectableRow({
						testId: this.getTestId(row.id ?? 'any'),
						title: row.title,
						selected: row.selected,
						divider: index !== rows.length - 1,
						onClick: useCallback(() => this.selectPreset(row.id), [row.id]),
					}),
					// what the chosen period still needs stays with the row it belongs to
					row.selected ? this.renderPresetDetails() : null,
				)),
			);
		}

		/**
		 * Boundaries and the years switcher of the chosen period, in the padding of the rows.
		 */
		renderPresetDetails()
		{
			const { preset } = this.state;
			const withBoundaries = this.isBoundaryPreset(preset);
			const withSwitcher = this.hasYearsSwitcher();

			if (!withBoundaries && !withSwitcher)
			{
				return null;
			}

			return View(
				{
					testId: this.getTestId('details'),
					style: {
						flexDirection: 'column',
						paddingHorizontal: ROW_PADDING,
						paddingBottom: Indent.L.toNumber(),
					},
				},
				withBoundaries ? this.renderRangeInputs() : null,
				withSwitcher ? this.renderYearsSwitcher() : null,
			);
		}

		renderYearsSwitcher()
		{
			const { allowYear } = this.state;

			return View(
				{
					testId: this.getTestId('allow-year'),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginTop: Indent.M.toNumber(),
					},
				},
				Text4({
					testId: this.getTestId('allow-year-label'),
					text: getYearsSwitcherLabel(),
					color: Color.base2,
				}),
				Switcher({
					testId: this.getTestId('allow-year-switcher'),
					checked: allowYear,
					onClick: this.changeAllowYear,
				}),
			);
		}

		renderRangeInputs()
		{
			const { preset, from, to } = this.state;
			const withTime = this.withTime();
			const datePickerType = withTime ? DatePickerType.DATETIME : DatePickerType.DATE;

			return View(
				{
					testId: this.getTestId('range'),
					style: {
						flexDirection: 'row',
						marginTop: Indent.M.toNumber(),
					},
				},
				DateTimeInput({
					testId: this.getTestId('from'),
					value: toSeconds(from),
					enableTime: withTime,
					datePickerType,
					placeholder: Loc.getMessage('M_FIELD_FILTER_DATE_FROM'),
					...getClearProps(from, this.clearFrom),
					onChange: this.changeFrom,
				}),
				// a period of one date has one input: the server closes its day itself and reads no
				// second boundary, so a date typed into one would draw a filled row over nothing
				...(DateBoundaryPreset.hasUpperBoundary(preset)
					? [DateTimeInput({
						testId: this.getTestId('to'),
						value: toSeconds(to),
						enableTime: withTime,
						datePickerType,
						placeholder: Loc.getMessage('M_FIELD_FILTER_DATE_TO'),
						style: { marginLeft: Indent.M.toNumber() },
						...getClearProps(to, this.clearTo),
						onChange: this.changeTo,
					})]
					: []),
			);
		}
	}

	/**
	 * The numbers the value carries for its period, kept apart from the rest of it: the control holds
	 * the period, and the numbers are filled in outside it - in the row of the field.
	 *
	 * @param {DateValue} value
	 * @return {Object}
	 */
	function readExtras(value)
	{
		const extras = {};

		getPresetExtras(value.preset).forEach((extra) => {
			const number = toExtraNumber(value[extra]);

			if (number !== null)
			{
				extras[extra] = number;
			}
		});

		return extras;
	}

	/**
	 * Whether the chosen period leaves anything to fill in on the screen of the picker: the boundaries
	 * of a range, or the years switcher. A period that leaves nothing is a finished choice, and the
	 * picker closes on it - see FieldPicker.closesOnChange. The numbers a period is counted from are
	 * not among those: they are filled in next to the period, in the row of the field.
	 *
	 * @param {FieldDescriptor} descriptor
	 * @param {?string} preset
	 * @return {boolean}
	 */
	function hasPresetDetails(descriptor, preset)
	{
		if (!Type.isStringFilled(preset))
		{
			return false;
		}

		if (DateBoundaryPreset.isDefined(preset))
		{
			return true;
		}

		return Boolean(descriptor?.allowYearsSwitcher);
	}

	module.exports = { DatePeriodControl, hasPresetDetails };
});
