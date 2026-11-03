/**
 * @module layout/ui/field-filter/filter/src/fields/field-picker
 */
jn.define('layout/ui/field-filter/filter/src/fields/field-picker', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { openFilterSheet } = require('layout/ui/field-filter/filter/src/layout/sheet');
	const { Color, Indent } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
	const { createTestIdGenerator } = require('utils/test');
	const { Area } = require('ui-system/layout/area');
	const { Box } = require('ui-system/layout/box');
	const { FilterFooter } = require('layout/ui/field-filter/filter/src/layout/footer');
	const { Input } = require('ui-system/form/inputs/input');
	const { ButtonSize } = require('ui-system/form/buttons/button');
	const {
		DatePeriodControl,
		hasPresetDetails,
	} = require('layout/ui/field-filter/filter/src/fields/controls/date-period');
	const { NumberOperatorControl } = require('layout/ui/field-filter/filter/src/fields/controls/number-operator');
	const { ListSelectControl } = require('layout/ui/field-filter/filter/src/fields/controls/list-select');
	const { FieldType } = require('layout/ui/field-filter/values');
	const { getBooleanItems } = require('layout/ui/field-filter/filter/src/model/value-formatter');
	const {
		ROW_HEIGHT,
		ROW_DIVIDER_HEIGHT,
		ROW_ICON_SIZE,
	} = require('layout/ui/field-filter/filter/src/layout/row-layout');
	const { getClearProps } = require('layout/ui/field-filter/filter/src/layout/clearable-input');
	const { SpinnerLoader } = require('layout/ui/loaders/spinner');
	const { Text4 } = require('ui-system/typography/text');

	/**
	 * Value picker of a single field, opened from its row in the drawer (BXML V9-V11).
	 * A choice that leaves nothing to fill in closes the picker at once - a value of a list, a period
	 * counted from today; controls that are filled in (a range, a number, text) are closed by apply.
	 *
	 * @extends {PureComponent<FieldPickerProps, FieldPickerState>}
	 */
	class FieldPicker extends PureComponent
	{
		/**
		 * @param {FieldPickerProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: `field-filter-picker-${props.descriptor.id}` });
			// the values of a field the dictionary left on the server are read by this screen and by
			// nobody else: `items` stays null until the answer arrives, and the failure is a state of its
			// own - an empty list would read as a portal that has no such values
			this.state = { value: props.value, items: null, itemsFailed: false };

			// a handler built in render is a new prop on every render: the pure children below would
			// then repaint on every keystroke, so the picker hands them the same function every time
			this.change = this.change.bind(this);
			this.clear = this.clear.bind(this);
			this.close = this.close.bind(this);
		}

		getDescriptor()
		{
			return this.props.descriptor;
		}

		isListMode()
		{
			const { type } = this.getDescriptor();

			return type === FieldType.LIST.getValue() || type === FieldType.BOOLEAN.getValue();
		}

		/**
		 * A boolean is never multiple: its value is Y or N, and an array would break the
		 * serialization of the field. The descriptor comes from the server, so the guard stays.
		 *
		 * @return {boolean}
		 */
		isMultiple()
		{
			const { type, multiple } = this.getDescriptor();

			return type !== FieldType.BOOLEAN.getValue() && Boolean(multiple);
		}

		isDateMode()
		{
			return this.getDescriptor().type === FieldType.DATE.getValue();
		}

		/**
		 * Values the picker offers: the ones the dictionary carried, or the ones this screen has read
		 * for a field whose reference book was left on the server (DeferredItems).
		 *
		 * @return {FieldItem[]}
		 */
		getItems()
		{
			const { items } = this.getDescriptor();

			return items ?? this.state.items ?? [];
		}

		/**
		 * Whether the values of the field are still to be read. False for a field that came with its
		 * own, and false once the answer has arrived - successful or not.
		 *
		 * @return {boolean}
		 */
		areItemsPending()
		{
			return this.getDescriptor().itemsDeferred === true
				&& !Type.isArray(this.getDescriptor().items)
				&& this.state.items === null
				&& !this.state.itemsFailed;
		}

		/**
		 * @return {boolean}
		 */
		haveItemsFailed()
		{
			return this.state.itemsFailed === true;
		}

		componentDidMount()
		{
			void this.loadDeferredItems();
		}

		/**
		 * Reads the values of the field the dictionary left on the server. Asked for once: a field whose
		 * values are already here - read on an earlier opening and kept next to the list - arrives with
		 * them in the descriptor.
		 *
		 * @return {Promise<void>}
		 */
		async loadDeferredItems()
		{
			if (!this.areItemsPending())
			{
				return;
			}

			const items = await this.props.loadItems?.(this.getDescriptor().id) ?? null;

			// there is nothing to choose from and nobody to ask again on this screen, so it says so: an
			// empty list here is indistinguishable from a portal that has no such values
			this.setState(items === null ? { itemsFailed: true } : { items });
		}

		/**
		 * A choice that leaves nothing to fill in is the final one, so the picker closes right after it
		 * and the value is in the filter at once. A period is a choice as much as a value of a list:
		 * only the one that keeps boundaries or the years switcher under it holds the screen open, and apply
		 * stands there for it alone.
		 *
		 * @param {FieldValue} [value] the value the picker is about to hold; the current one by default
		 * @return {boolean}
		 */
		closesOnChange(value = this.state.value)
		{
			if (this.isListMode())
			{
				return !this.isMultiple();
			}

			if (this.isDateMode())
			{
				return !hasPresetDetails(this.getDescriptor(), value?.preset);
			}

			return false;
		}

		change(value)
		{
			this.setState({ value });
			this.props.onChange?.(value);

			if (this.closesOnChange(value))
			{
				this.close();
			}
		}

		/**
		 * An empty value is what the serializer reads as "the field is out of the filter": the cross of
		 * the input says the same as erasing the text by hand.
		 */
		clear()
		{
			this.change('');
		}

		close()
		{
			this.props.close?.();
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					withScroll: true,
					backgroundColor: Color.bgPrimary,
					footer: this.closesOnChange() ? null : this.renderFooter(),
				},
				this.renderContent(),
			);
		}

		/**
		 * A field whose value is a choice draws it as one list of rows across the whole sheet - a
		 * list of values, a period of a date, a comparison of a number alike. Only a field that is
		 * typed in gets a card of its own, because an input is not a choice.
		 *
		 * @return {boolean}
		 */
		isRowsMode()
		{
			const { type } = this.getDescriptor();

			return this.isListMode()
				|| type === FieldType.DATE.getValue()
				|| type === FieldType.NUMBER.getValue();
		}

		renderContent()
		{
			if (this.areItemsPending())
			{
				return this.renderItemsLoader();
			}

			if (this.haveItemsFailed())
			{
				return this.renderItemsFailure();
			}

			if (this.isListMode())
			{
				return this.renderList();
			}

			if (this.isRowsMode())
			{
				return this.renderControl();
			}

			return Area(
				{
					testId: this.getTestId('area'),
					isFirst: true,
				},
				this.renderControl(),
			);
		}

		/**
		 * While the values are on their way. A screen of its own and not an empty list: the choice of a
		 * field is what the user came here for, and a list that fills in a moment later reads as a list
		 * that was empty.
		 */
		renderItemsLoader()
		{
			return View(
				{
					testId: this.getTestId('loading'),
					style: {
						alignItems: 'center',
						justifyContent: 'center',
						paddingTop: Indent.XL4.toNumber(),
						paddingBottom: Indent.XL4.toNumber(),
					},
				},
				SpinnerLoader({ size: ROW_ICON_SIZE }),
			);
		}

		/**
		 * The values could not be read - no network, or a list the server no longer has this field in.
		 * Closing and opening the field asks again.
		 */
		renderItemsFailure()
		{
			return View(
				{
					testId: this.getTestId('items-failed'),
					style: {
						alignItems: 'center',
						paddingTop: Indent.XL4.toNumber(),
						paddingBottom: Indent.XL4.toNumber(),
						paddingLeft: Indent.XL.toNumber(),
						paddingRight: Indent.XL.toNumber(),
					},
				},
				Text4({
					testId: this.getTestId('items-failed-text'),
					text: Loc.getMessage('M_FIELD_FILTER_ITEMS_FAILED'),
					color: Color.base3,
				}),
			);
		}

		renderList()
		{
			const descriptor = this.getDescriptor();
			const isBoolean = descriptor.type === FieldType.BOOLEAN.getValue();

			return new ListSelectControl({
				testId: this.getTestId(),
				items: isBoolean ? getBooleanItems() : this.getItems(),
				value: this.state.value,
				multiple: this.isMultiple(),
				onChange: this.change,
			});
		}

		renderControl()
		{
			const descriptor = this.getDescriptor();
			const testId = this.getTestId();

			switch (descriptor.type)
			{
				case FieldType.NUMBER.getValue():
					return new NumberOperatorControl({
						testId,
						descriptor,
						value: this.state.value,
						onChange: this.change,
					});

				case FieldType.DATE.getValue():
					return new DatePeriodControl({
						testId,
						descriptor,
						value: this.state.value,
						onChange: this.change,
					});

				default:
				{
					const text = Type.isString(this.state.value) ? this.state.value : '';

					return Input({
						testId: this.getTestId('input'),
						value: text,
						placeholder: descriptor.name,
						...getClearProps(text, this.clear),
						onChange: this.change,
					});
				}
			}
		}

		renderFooter()
		{
			return FilterFooter({
				testId: this.getTestId('footer'),
				buttonTestId: this.getTestId('apply'),
				text: Loc.getMessage('M_FIELD_FILTER_APPLY'),
				onClick: this.close,
			});
		}

		/**
		 * Height of what the picker is about to draw, for a sheet opened to its content. Known for
		 * every choice list: a row per value plus the row that clears the field, hairlines between
		 * them, and the footer with apply when the choice does not close the screen itself.
		 *
		 * A dictionary the server sent empty is a height all the same, and the smallest one there is:
		 * the list then draws the row that clears the field and nothing else - a field of a portal
		 * where the values simply do not exist yet (an external source of CRM with no external sales
		 * registered is one). Counting it as unknown left the sheet at its default position, and one
		 * row that clears it stood over an empty screen.
		 *
		 * A field whose reference book the dictionary left on the server is a height as well: the
		 * number of its values travels with it (DeferredItems::COUNT), and the list draws exactly
		 * that many rows once they arrive.
		 *
		 * A period and a number keep the default position of the sheet: those change their own
		 * height while they are being filled in - a range adds a second input, a date adds pickers.
		 *
		 * @param {FieldDescriptor} descriptor
		 * @return {?number} null when the height is not known before the screen is drawn
		 */
		static getContentHeight(descriptor)
		{
			const isBoolean = descriptor.type === FieldType.BOOLEAN.getValue();
			const isList = descriptor.type === FieldType.LIST.getValue();

			if (!isBoolean && !isList)
			{
				return null;
			}

			const values = isBoolean ? getBooleanItems().length : getListValuesCount(descriptor);

			if (values === null)
			{
				return null;
			}

			// the row that clears the field stands above the values, and every row but the last one
			// is followed by a hairline
			const rows = values + 1;
			// a boolean is never multiple, so only a list can ask for the footer
			const withFooter = isList && Boolean(descriptor.multiple);

			return rows * ROW_HEIGHT
				+ (rows - 1) * ROW_DIVIDER_HEIGHT
				+ getSingleRowAir(rows)
				+ (withFooter ? getFooterHeight() : 0);
		}

		/**
		 * @param {FieldPickerOptions} options
		 * @return {Promise}
		 */
		static open(options)
		{
			const { descriptor, value, parentWidget = null, onChange, loadItems = null } = options;

			return openFilterSheet({
				title: descriptor.name,
				parentWidget,
				contentHeight: FieldPicker.getContentHeight(descriptor),
				component: ({ close }) => new FieldPicker({ descriptor, value, onChange, close, loadItems }),
			});
		}
	}

	/**
	 * What the footer with apply takes: the button and the padding `dialog-footer` keeps around
	 * it. The safe area the footer stands above is not counted here - the sheet reserves it under its
	 * content on its own, and counting it twice is what left the empty strip above the button.
	 *
	 * @return {number}
	 */
	function getFooterHeight()
	{
		return ButtonSize.L.getHeight() + 2 * Indent.XL.toNumber();
	}

	/**
	 * How many values the list of the picker is about to draw: the ones the descriptor carries, or the
	 * number the dictionary sent along with a field whose values it kept on the server.
	 *
	 * Null when neither is known - a story with a dictionary of its own, or a server older than the
	 * number. The sheet then keeps its default position instead of being pinned to a guess: counting
	 * such a field as an empty one pinned it to a single row and then filled it with two dozen values.
	 *
	 * @param {FieldDescriptor} descriptor
	 * @return {?number}
	 */
	function getListValuesCount(descriptor)
	{
		if (Type.isArray(descriptor.items))
		{
			return descriptor.items.length;
		}

		if (descriptor.itemsDeferred === true)
		{
			return Type.isNumber(descriptor.itemsCount) ? descriptor.itemsCount : null;
		}

		// a dictionary with no values at all: the list draws the row that clears the field alone
		return 0;
	}

	/**
	 * Air under a list of one row. A sheet pinned to a single row stands as a strip at the bottom of the
	 * screen, and a strip that tight reads as a sheet caught mid-opening; a row of air below gives it the
	 * room a list of two rows has anyway.
	 *
	 * @param {number} rows
	 * @return {number}
	 */
	function getSingleRowAir(rows)
	{
		return rows === 1 ? ROW_HEIGHT : 0;
	}

	module.exports = { FieldPicker };
});
