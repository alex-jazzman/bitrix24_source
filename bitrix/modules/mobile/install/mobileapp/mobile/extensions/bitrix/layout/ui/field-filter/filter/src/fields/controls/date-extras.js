/**
 * @module layout/ui/field-filter/filter/src/fields/controls/date-extras
 */
jn.define('layout/ui/field-filter/filter/src/fields/controls/date-extras', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { Indent } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
	const { createTestIdGenerator } = require('utils/test');
	const { Icon } = require('ui-system/blocks/icon');
	const { InputSize } = require('ui-system/form/inputs/input');
	const { NumberInput } = require('ui-system/form/inputs/number');
	const { PopupMenu } = require('ui-system/popups/popup-menu');
	const { Ellipsize } = require('utils/enums/style');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { getClearProps } = require('layout/ui/field-filter/filter/src/layout/clearable-input');
	const {
		getMonthName,
		getDatePresetLabel,
	} = require('layout/ui/field-filter/filter/src/model/value-formatter');
	const { CountedDatePreset, DateExtra, getPresetExtras, toExtraNumber } = require('layout/ui/field-filter/values');

	/**
	 * Items the menus of a month and of a quarter offer: their ordinals, counted the way the web filter counts
	 * them (a month is 1-12, a quarter 1-4). Their names are not the business of this control - those come from
	 * the vocabulary of the portal through `getMonthName` and `getQuarterName` - so what is left here is the
	 * count, and it is counted rather than written out.
	 */
	const MONTHS_IN_YEAR = 12;
	const MONTHS_IN_QUARTER = 3;
	const ordinals = (count) => Array.from({ length: count }, (item, index) => index + 1);
	const MONTHS = ordinals(MONTHS_IN_YEAR);
	const QUARTERS = ordinals(MONTHS_IN_YEAR / MONTHS_IN_QUARTER);

	/**
	 * The numbers stand next to the period, so the boxes have to be of one height: a button `M` is 36,
	 * the very height of an input `M`. Same pair the comparison of a number stands in.
	 */
	const CONTROL_SIZE = InputSize.M;
	const SELECTOR_SIZE = ButtonSize.M;

	/**
	 * The numbers that are chosen from a menu rather than typed in. Those are as wide as their own
	 * wording; a number that is typed in takes the room the period leaves in the row instead.
	 * @type {Set<string>}
	 */
	const CHOSEN_EXTRAS = new Set([DateExtra.MONTH, DateExtra.QUARTER]);

	/**
	 * The numbers a chosen period is counted from, as the web filter shows them: next to the period
	 * itself, in the row of the field. Draws nothing for a period counted from today alone, so a
	 * consumer may hand it every date field it has.
	 *
	 * @extends {PureComponent<DateExtrasControlProps>}
	 */
	class DateExtrasControl extends PureComponent
	{
		/**
		 * @param {DateExtrasControlProps} props
		 */
		constructor(props)
		{
			super(props);

			// the row of the field names the box these numbers stand in, so nothing is added on top of that
			// name: a doubled `date-extras-date-extras` is what an e2e would have to address the number by
			this.getTestId = createTestIdGenerator({ context: this });

			// the inputs and the buttons keep the same handler across renders: a function built in
			// render is a changed prop, and a pure child repaints on every keystroke because of it
			this.changeDays = this.changeDays.bind(this);
			this.changeYear = this.changeYear.bind(this);
			this.clearDays = this.clearDays.bind(this);
			this.clearYear = this.clearYear.bind(this);
			this.openMonthMenu = this.openMonthMenu.bind(this);
			this.openQuarterMenu = this.openQuarterMenu.bind(this);

			// a menu is anchored to the button that opens it, the way a web dropdown is
			this.bindMonthRef = (ref) => {
				this.monthRef = ref;
			};

			this.bindQuarterRef = (ref) => {
				this.quarterRef = ref;
			};
		}

		/**
		 * @return {DateValue}
		 */
		getValue()
		{
			return Type.isPlainObject(this.props.value) ? this.props.value : {};
		}

		getExtras()
		{
			return getPresetExtras(this.getValue().preset);
		}

		getNumber(extra)
		{
			return toExtraNumber(this.getValue()[extra]);
		}

		/**
		 * The rest of the period stays as it is: the numbers say how far it reaches, not which period
		 * it is.
		 *
		 * @param {string} extra
		 * @param {?number} number
		 */
		change(extra, number)
		{
			this.props.onChange?.({ ...this.getValue(), [extra]: number });
		}

		changeDays(value)
		{
			this.change(DateExtra.DAYS, toExtraNumber(value));
		}

		changeYear(value)
		{
			this.change(DateExtra.YEAR, toExtraNumber(value));
		}

		/**
		 * A period left without its number narrows nothing, and the field steps out of the filter until
		 * the number is typed again - the same answer an emptied input of a number field gives.
		 */
		clearDays()
		{
			this.change(DateExtra.DAYS, null);
		}

		clearYear()
		{
			this.change(DateExtra.YEAR, null);
		}

		/**
		 * A period counted from today leaves the row an empty box rather than nothing at all: a control
		 * that answers the first render of a row with nothing is never drawn again, and the numbers of
		 * a period chosen later would have nowhere to appear. The box is of no width, so an empty one
		 * takes no room in the row.
		 */
		render()
		{
			const extras = this.getExtras();

			return View(
				{
					testId: this.getTestId(),
					// the numbers take whatever the period leaves of the row - a number filled in up to
					// the period, the way the number field is filled in up to its comparison. The period
					// is the one that gives way when the row is too narrow for both: a number squeezed to
					// nothing is a period that cannot be counted at all, while its name is readable cut
					// short. A period counted from today has no number and takes no room at all.
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						...getRowShare(extras),
					},
				},
				...extras.map((extra) => View(
					{
						// every number stands apart from what it follows: the period, or the number before
						// it. The box is a row of its own and the control inside fills it - the pair the
						// number field stands in, see NumberOperatorControl.renderInputs
						style: {
							marginLeft: Indent.M.toNumber(),
							flexDirection: 'row',
							...getExtraStyle(extra),
						},
					},
					this.renderExtra(extra),
				)),
			);
		}

		renderExtra(extra)
		{
			switch (extra)
			{
				case DateExtra.MONTH:
					return this.renderMonth();

				case DateExtra.QUARTER:
					return this.renderQuarter();

				case DateExtra.YEAR:
					return this.renderYear();

				default:
					return this.renderDays();
			}
		}

		renderDays()
		{
			const days = this.getNumber(DateExtra.DAYS);

			return NumberInput({
				testId: this.getTestId(DateExtra.DAYS),
				value: days ?? '',
				size: CONTROL_SIZE,
				style: { flex: 1 },
				placeholder: Loc.getMessage('M_FIELD_FILTER_DATE_DAYS_PLACEHOLDER'),
				...getClearProps(days, this.clearDays),
				onChange: this.changeDays,
			});
		}

		renderYear()
		{
			const year = this.getNumber(DateExtra.YEAR);

			return NumberInput({
				testId: this.getTestId(DateExtra.YEAR),
				value: year ?? '',
				size: CONTROL_SIZE,
				style: { flex: 1 },
				placeholder: Loc.getMessage('M_FIELD_FILTER_DATE_YEAR_PLACEHOLDER'),
				...getClearProps(year, this.clearYear),
				onChange: this.changeYear,
			});
		}

		renderMonth()
		{
			const month = this.getNumber(DateExtra.MONTH);

			return Button({
				testId: this.getTestId(DateExtra.MONTH),
				// a number not yet chosen is named by the period it belongs to, and that name comes from the
				// vocabulary of the portal - the same one the picker of periods reads
				text: month === null ? getDatePresetLabel(CountedDatePreset.MONTH) : getMonthName(month),
				rightIcon: Icon.CHEVRON_DOWN,
				rounded: false,
				design: ButtonDesign.OUTLINE_ACCENT_2,
				size: SELECTOR_SIZE,
				ellipsize: Ellipsize.END,
				forwardRef: this.bindMonthRef,
				onClick: this.openMonthMenu,
			});
		}

		renderQuarter()
		{
			const quarter = this.getNumber(DateExtra.QUARTER);

			return Button({
				testId: this.getTestId(DateExtra.QUARTER),
				text: quarter === null
					? getDatePresetLabel(CountedDatePreset.QUARTER)
					: getQuarterName(quarter),
				rightIcon: Icon.CHEVRON_DOWN,
				rounded: false,
				design: ButtonDesign.OUTLINE_ACCENT_2,
				size: SELECTOR_SIZE,
				ellipsize: Ellipsize.END,
				forwardRef: this.bindQuarterRef,
				onClick: this.openQuarterMenu,
			});
		}

		openMonthMenu()
		{
			const month = this.getNumber(DateExtra.MONTH);

			this.monthMenu = new PopupMenu(MONTHS.map((item) => ({
				id: String(item),
				testId: this.getTestId(`month-${item}`),
				title: getMonthName(item),
				checked: item === month,
				onItemSelected: () => this.change(DateExtra.MONTH, item),
			})));

			this.monthMenu.show({ target: this.monthRef });
		}

		openQuarterMenu()
		{
			const quarter = this.getNumber(DateExtra.QUARTER);

			this.quarterMenu = new PopupMenu(QUARTERS.map((item) => ({
				id: String(item),
				testId: this.getTestId(`quarter-${item}`),
				title: getQuarterName(item),
				checked: item === quarter,
				onItemSelected: () => this.change(DateExtra.QUARTER, item),
			})));

			this.quarterMenu.show({ target: this.quarterRef });
		}
	}

	/**
	 * A month and a quarter are chosen, so their box is as wide as the word inside it and no wider: room
	 * left over in the box stands as a gap before the next number, and the numbers of one period would
	 * be indented unevenly. A number that is typed in fills what the row has left instead, so it is the
	 * last number of a period that reaches the edge.
	 *
	 * @param {string} extra
	 * @return {Object}
	 */
	function getExtraStyle(extra)
	{
		return CHOSEN_EXTRAS.has(extra) ? { flexShrink: 0 } : { flex: 1 };
	}

	/**
	 * What the numbers take of the row of the field. A period counted from a number leaves them
	 * everything it does not need for its own name, the way the comparison of a number field leaves the
	 * row to the number: they are filled in, and the room to type in is theirs.
	 *
	 * A period counted from today has no number to draw, and its box is written out as one of no width
	 * rather than left to the content: a control that answers the first render of a row with nothing is
	 * never drawn again, and the numbers of a period chosen later would have nowhere to appear.
	 *
	 * @param {string[]} extras
	 * @return {Object}
	 */
	function getRowShare(extras)
	{
		return extras.length === 0 ? { width: 0, flexShrink: 0 } : { flex: 1 };
	}

	/**
	 * @param {number} quarter 1-4, as the web filter counts them
	 * @return {string}
	 */
	function getQuarterName(quarter)
	{
		return Loc.getMessage('M_FIELD_FILTER_DATE_QUARTER_ITEM', { '#QUARTER#': String(quarter) });
	}

	/**
	 * What a period counted from a number opens on. The web filter offers the current month, quarter
	 * and year the moment such a period is chosen, and a period already counted needs no confirming.
	 * The number of days is the very thing being chosen there, so it is left for the user to type.
	 *
	 * @param {?string} preset
	 * @return {Object} empty for a period counted from today alone
	 */
	function getDefaultDateExtras(preset)
	{
		const today = new Date();
		const defaults = {};

		getPresetExtras(preset).forEach((extra) => {
			if (extra === DateExtra.MONTH)
			{
				defaults.month = today.getMonth() + 1;
			}

			if (extra === DateExtra.QUARTER)
			{
				defaults.quarter = Math.floor(today.getMonth() / MONTHS_IN_QUARTER) + 1;
			}

			if (extra === DateExtra.YEAR)
			{
				defaults.year = today.getFullYear();
			}
		});

		return defaults;
	}

	module.exports = {
		DateExtrasControl: (props) => new DateExtrasControl(props),
		getDefaultDateExtras,
		getQuarterName,
	};
});
