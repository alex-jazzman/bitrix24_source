/**
 * @module layout/ui/field-filter/filter/src/fields/controls/number-operator
 */
jn.define('layout/ui/field-filter/filter/src/fields/controls/number-operator', (require, exports, module) => {
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
	const { ROW_PADDING } = require('layout/ui/field-filter/filter/src/layout/section');
	const { getClearProps } = require('layout/ui/field-filter/filter/src/layout/clearable-input');
	const { getHitOverhang } = require('layout/ui/field-filter/filter/src/layout/icon-action');
	const {
		AdditionalFilterButton,
		AdditionalFilterValue,
		getAllowedAdditional,
	} = require('layout/ui/field-filter/filter/src/fields/controls/additional-filter');
	const { getNumberOperatorLabel } = require('layout/ui/field-filter/filter/src/model/value-formatter');
	const { NumberOperator, AdditionalFilter } = require('layout/ui/field-filter/values');

	// the order of the items is a decision of the control, not of the enum
	const OPERATOR_ORDER = [
		NumberOperator.EXACT.getValue(),
		NumberOperator.RANGE.getValue(),
		NumberOperator.MORE.getValue(),
		NumberOperator.LESS.getValue(),
	];

	/**
	 * Paddings of the control standing on a screen of its own. A consumer that puts it under a row of
	 * the form gives its own instead: that row keeps a padding below its title already, and a second
	 * one on top of it reads as a gap belonging to nothing.
	 * @type {Object}
	 */
	const STANDALONE_STYLE = {
		paddingHorizontal: ROW_PADDING,
		paddingVertical: Indent.L.toNumber(),
	};

	/**
	 * The comparison the field opens on. The web select has no item for "no comparison": a number
	 * field with nothing typed in is simply not in the filter, which is the very answer the
	 * serializer gives for an empty input.
	 * @type {string}
	 */
	const DEFAULT_OPERATOR = NumberOperator.EXACT.getValue();

	/**
	 * The comparison and the value stand side by side, so the two boxes have to be of one height. The
	 * chips are sized 24/32/38 against the inputs 28/36/42 and no pair of them meets, while a button
	 * `M` is 36 - the very height of an input `M`. Neither family lets a consumer set the height by
	 * hand: the body is drawn by the size given, and `style` reaches the box around it only.
	 */
	const CONTROL_SIZE = InputSize.M;
	const SELECTOR_SIZE = ButtonSize.M;

	/**
	 * Room the input keeps around itself: above for the label of a field that has one, below for the
	 * error text. The row centers the boxes against each other, so a comparison without that room
	 * would stand half of their difference above the value. The comparison keeps it as well, and the
	 * two boxes are of one height with their bodies on one line - the indents are the ones the input
	 * takes from the design system, so nothing drifts when those change.
	 * @type {Object}
	 */
	const SELECTOR_BOX_STYLE = {
		paddingTop: Indent.M.toNumber(),
		paddingBottom: Indent.S.toNumber(),
	};

	/**
	 * Number value with a comparison operator, laid out the way the web filter lays it out: the
	 * comparison is a dropdown, the number stands next to it on the same row, and the conditions on
	 * the presence of a value sit behind a "---" button. Those conditions are declared per field by
	 * the provider, so the button appears only for a field that allows them.
	 *
	 * Serializes to `_numsel`/`_from`/`_to`, or to `_isEmpty`/`_hasAnyValue` (ALG-01).
	 *
	 * @extends {PureComponent<NumberOperatorControlProps>}
	 */
	class NumberOperatorControl extends PureComponent
	{
		/**
		 * @param {NumberOperatorControlProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this, prefix: 'number' });
			this.state = this.buildState(props);

			// the inputs and the buttons keep the same handler across renders: a function built in
			// render is a changed prop, and a pure child repaints on every keystroke because of it
			this.select = this.select.bind(this);
			this.clearAdditional = this.clearAdditional.bind(this);
			this.changeFrom = this.changeFrom.bind(this);
			this.changeTo = this.changeTo.bind(this);
			this.clearFrom = this.clearFrom.bind(this);
			this.clearTo = this.clearTo.bind(this);
			this.openOperatorMenu = this.openOperatorMenu.bind(this);

			// the menu of the comparison is anchored to the button that opens it, the way a web
			// dropdown is; the one of the conditions is anchored by the button of its own
			this.bindOperatorRef = (ref) => {
				this.operatorRef = ref;
			};
		}

		componentWillReceiveProps(nextProps)
		{
			this.state = this.buildState(nextProps);
		}

		buildState(props)
		{
			const value = props.value || {};

			return {
				operator: Type.isStringFilled(value.operator) ? value.operator : DEFAULT_OPERATOR,
				from: value.from ?? null,
				to: value.to ?? null,
				additional: AdditionalFilter.isDefined(value.additional) ? value.additional : null,
			};
		}

		emitChange()
		{
			const { operator, from, to, additional } = this.state;
			this.props.onChange?.({ operator, from, to, additional });
		}

		/**
		 * Conditions on the presence of a value the field allows, as declared by its provider.
		 *
		 * @return {AdditionalFilter[]}
		 */
		/**
		 * Comparisons the field offers: the ones of the web control, less the ones its provider takes away
		 * (`exclude` of the web number control). A field that excludes every one of them keeps the default
		 * comparison - a menu of no items opens onto nothing.
		 *
		 * @return {string[]}
		 */
		getOperators()
		{
			const excluded = this.props.descriptor?.excludedNumberOperators;
			if (!Type.isArrayFilled(excluded))
			{
				return OPERATOR_ORDER;
			}

			const offered = OPERATOR_ORDER.filter((operator) => !excluded.includes(operator));

			return offered.length > 0 ? offered : [DEFAULT_OPERATOR];
		}

		getAllowedAdditional()
		{
			return getAllowedAdditional(this.props.descriptor);
		}

		/**
		 * What the dropdown says: the comparison, always. A condition on the presence of a value is
		 * named in the value slot instead, the way the web names it - see renderAdditionalValue.
		 *
		 * @return {string}
		 */
		getSelectedLabel()
		{
			return getNumberOperatorLabel(this.state.operator);
		}

		/**
		 * The number the user has already entered stays: the comparison says how to read it, and
		 * retyping it after every change of the comparison is work the control can spare. The same
		 * holds while a condition on presence is chosen - it only takes the comparison's place on
		 * the wire, so coming back to the number costs one tap.
		 *
		 * @param {string} itemId
		 */
		select(itemId)
		{
			if (AdditionalFilter.isDefined(itemId))
			{
				// the item of the "---" menu is a switch, the way its own checkmark reads it: choosing
				// the chosen condition gives the field back to the comparison, as the cross on the web
				// tag does
				const additional = this.state.additional === itemId ? null : itemId;

				this.setState({ additional }, () => this.emitChange());

				return;
			}

			this.setState({ operator: itemId, additional: null }, () => this.emitChange());
		}

		clearAdditional()
		{
			this.setState({ additional: null }, () => this.emitChange());
		}

		changeFrom(value)
		{
			this.setState({ from: value }, () => this.emitChange());
		}

		changeTo(value)
		{
			this.setState({ to: value }, () => this.emitChange());
		}

		/**
		 * The comparison stays: a number given back is a field waiting for another one, not a field
		 * the user is done with - that one is dropped by the row of the form itself.
		 */
		clearFrom()
		{
			this.changeFrom(null);
		}

		clearTo()
		{
			this.changeTo(null);
		}

		openOperatorMenu()
		{
			const { operator, additional } = this.state;

			this.operatorMenu = new PopupMenu(
				this.getOperators().map((itemOperator) => ({
					id: itemOperator,
					testId: this.getTestId(itemOperator),
					title: getNumberOperatorLabel(itemOperator),
					checked: additional === null && itemOperator === operator,
					onItemSelected: () => this.select(itemOperator),
				})),
			);

			this.operatorMenu.show({ target: this.operatorRef });
		}

		render()
		{
			return View(
				{
					testId: this.getTestId(),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						...(this.props.style ?? STANDALONE_STYLE),
					},
				},
				...this.renderValue(),
				this.renderAdditionalButton(),
			);
		}

		/**
		 * The value slot of the row: the number the field is compared with, or - while a condition on
		 * the presence of a value is chosen - the condition itself. The condition needs no comparison,
		 * so the dropdown steps aside and the field is left with the condition and the "---" button
		 * that set it, exactly as the web leaves it.
		 *
		 * @return {Array}
		 */
		renderValue()
		{
			const { additional } = this.state;

			if (additional !== null)
			{
				return [this.renderAdditionalValue(additional)];
			}

			return [this.renderOperatorSelector(), this.renderInputs()];
		}

		/**
		 * As wide as its wording, the way the web select is: stretching it over a share of the row
		 * would open the row on a strip of empty space next to a short word.
		 *
		 * Blue, like the input next to it: the comparison is a value the user chose, not a disabled
		 * control, and a grey box in a row of blue ones reads as the latter.
		 */
		renderOperatorSelector()
		{
			return View(
				{
					testId: this.getTestId('operator-box'),
					style: SELECTOR_BOX_STYLE,
				},
				this.renderOperatorButton(),
			);
		}

		renderOperatorButton()
		{
			return Button({
				testId: this.getTestId('operator'),
				text: this.getSelectedLabel(),
				rightIcon: Icon.CHEVRON_DOWN,
				rounded: false,
				design: ButtonDesign.OUTLINE_ACCENT_2,
				size: SELECTOR_SIZE,
				ellipsize: Ellipsize.END,
				forwardRef: this.bindOperatorRef,
				onClick: this.openOperatorMenu,
			});
		}

		/**
		 * A number given back is handed to the input as an empty string rather than as nothing: the
		 * native money field keeps the text it shows and a forced value of nothing leaves it standing.
		 *
		 * @param {?number} value
		 * @return {number|string}
		 */
		getInputValue(value)
		{
			return value ?? '';
		}

		renderInputs()
		{
			const { operator, from, to } = this.state;
			const isRange = operator === NumberOperator.RANGE.getValue();

			return View(
				{
					testId: this.getTestId('inputs'),
					style: getValueRowStyle(),
				},
				NumberInput({
					testId: this.getTestId('from'),
					value: this.getInputValue(from),
					size: CONTROL_SIZE,
					style: { flex: 1 },
					placeholder: isRange
						? Loc.getMessage('M_FIELD_FILTER_NUMBER_FROM')
						: Loc.getMessage('M_FIELD_FILTER_NUMBER_VALUE'),
					...getClearProps(from, this.clearFrom),
					onChange: this.changeFrom,
				}),
				isRange
					? NumberInput({
						testId: this.getTestId('to'),
						value: this.getInputValue(to),
						size: CONTROL_SIZE,
						placeholder: Loc.getMessage('M_FIELD_FILTER_NUMBER_TO'),
						style: { flex: 1, marginLeft: Indent.M.toNumber() },
						...getClearProps(to, this.clearTo),
						onChange: this.changeTo,
					})
					: null,
			);
		}

		/**
		 * The chosen condition stands where the number would: the comparison steps aside, and the
		 * number it compares has nowhere to be typed in while the condition holds. The cross gives
		 * both of them back, and so does the item of the "---" menu - both roads out are open.
		 *
		 * @param {AdditionalFilter} additional
		 */
		renderAdditionalValue(additional)
		{
			return View(
				{
					testId: this.getTestId('value'),
					style: getValueRowStyle(false),
				},
				AdditionalFilterValue({
					testId: this.getTestId('additional-value'),
					additional,
					size: CONTROL_SIZE,
					style: { flex: 1 },
					onClear: this.clearAdditional,
				}),
			);
		}

		renderAdditionalButton()
		{
			return AdditionalFilterButton({
				testId: this.getTestId('additional'),
				descriptor: this.props.descriptor,
				value: this.state.additional,
				// the icon answers taps in a box wider than itself; the margins take that width back,
				// so the icon stands where the padding of the row alone would have put it
				marginLeft: Indent.M.toNumber() - getHitOverhang(),
				marginRight: -getHitOverhang(),
				onSelect: this.select,
			});
		}
	}

	/**
	 * The value takes whatever the comparison left of the row and stands apart from it. Without a
	 * comparison next to it - a condition on the presence of a value has none - it takes the row whole.
	 *
	 * @param {boolean} [afterOperator=true]
	 * @return {Object}
	 */
	function getValueRowStyle(afterOperator = true)
	{
		return {
			flex: 1,
			flexDirection: 'row',
			marginLeft: afterOperator ? Indent.M.toNumber() : 0,
		};
	}

	module.exports = { NumberOperatorControl };
});
