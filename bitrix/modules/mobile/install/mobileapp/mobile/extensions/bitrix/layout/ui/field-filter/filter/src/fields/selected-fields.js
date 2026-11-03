/**
 * @module layout/ui/field-filter/filter/src/fields/selected-fields
 */
jn.define('layout/ui/field-filter/filter/src/fields/selected-fields', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { Indent } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
	const { createTestIdGenerator } = require('utils/test');
	const { resolveFieldRowIcon } = require('layout/ui/field-filter/icons');
	const {
		ChipButton,
		ChipButtonDesign,
		ChipButtonMode,
		ChipButtonSize,
	} = require('ui-system/blocks/chips/chip-button');
	const { FieldRow } = require('layout/ui/field-filter/filter/src/fields/field-row');
	const { FilterSection, ROW_PADDING } = require('layout/ui/field-filter/filter/src/layout/section');
	const {
		getVisibleFields,
		isDefaultFieldSet,
	} = require('layout/ui/field-filter/filter/src/fields/field-set');

	/** Size the actions are drawn in: the chip of a list, one step below the chips of a toolbar. */
	const ACTION_SIZE = ChipButtonSize.M;

	/**
	 * Fields of the filter as the drawer shows them: one flat list of the fields the user keeps on the
	 * form, and under it the two actions the web filter has in the same place - add field and reset
	 * fields.
	 *
	 * The groups of the entities are not here: they belong to the field selector, where the set of
	 * fields is composed. This screen shows the filter itself, so a field of it is one tap away and
	 * no group has to be opened first.
	 *
	 * @extends {PureComponent<SelectedFieldsProps>}
	 */
	class SelectedFields extends PureComponent
	{
		/**
		 * @param {SelectedFieldsProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this, prefix: 'selected-fields' });

			// the rows and the actions are pure, so they keep the same handlers across renders
			this.addFields = this.addFields.bind(this);
			this.resetFields = this.resetFields.bind(this);
		}

		/**
		 * @return {FieldDescriptor[]}
		 */
		getDescriptors()
		{
			const { descriptors } = this.props;

			return Type.isArray(descriptors) ? descriptors : [];
		}

		/**
		 * @return {string[]}
		 */
		getRows()
		{
			const { rows } = this.props;

			return Type.isArray(rows) ? rows : [];
		}

		/**
		 * The fields on the form: the set of the filter plus whatever carries a value outside it.
		 *
		 * @return {FieldDescriptor[]}
		 */
		getFields()
		{
			const { values } = this.props;

			return getVisibleFields(this.getDescriptors(), this.getRows(), values);
		}

		/**
		 * @return {string[]} the set the reset gives back; empty leaves it to the fields of the provider
		 */
		getDefaultRows()
		{
			const { defaultRows } = this.props;

			return Type.isArray(defaultRows) ? defaultRows : [];
		}

		/**
		 * @return {boolean}
		 */
		canResetFields()
		{
			return !isDefaultFieldSet(this.getDescriptors(), this.getRows(), this.getDefaultRows());
		}

		addFields()
		{
			this.props.onAddFields?.();
		}

		/**
		 * The action is drawn disabled while the set is the default one, and a disabled button of the
		 * design system answers no taps; the guard keeps that promise for a caller of its own.
		 */
		resetFields()
		{
			if (!this.canResetFields())
			{
				return;
			}

			this.props.onResetFields?.();
		}

		render()
		{
			const { isFirst } = this.props;

			return FilterSection(
				{
					testId: this.getTestId(),
					// the fields are a section of the sheet like the two above them and say so: the same
					// wording the builder of a saved filter puts over the very same form
					title: Loc.getMessage('M_FIELD_FILTER_FIELDS_TITLE'),
					isFirst,
					divider: false,
				},
				...this.renderRows(),
				this.renderActions(),
			);
		}

		/**
		 * @return {Array}
		 */
		renderRows()
		{
			const {
				testId,
				values,
				gridId,
				fieldIcons,
				entitySelectors,
				parentWidget,
				loadFieldItems,
				onChange,
				onOpenField,
			} = this.props;
			const fields = this.getFields();

			return fields.map((descriptor, index) => new FieldRow({
				testId,
				descriptor,
				icon: resolveFieldRowIcon(fieldIcons, descriptor.id),
				gridId,
				entitySelectors,
				parentWidget,
				loadFieldItems,
				// the actions stand under the list, so the last row keeps no hairline of its own
				isLast: index === fields.length - 1,
				value: Type.isPlainObject(values) ? values[descriptor.id] : undefined,
				onChange,
				onOpenField,
			}));
		}

		/**
		 * Both actions of the web filter, in its own order and wording. They are chips without a fill
		 * rather than rows: a row with a chevron promises a screen behind it, and reset fields opens none.
		 *
		 * The pair stands in the middle of its row: it belongs to the whole list above it, not to the
		 * column its names are read in, and hung on the left edge it leaves the sheet lopsided.
		 */
		renderActions()
		{
			return View(
				{
					testId: this.getTestId('actions'),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						paddingLeft: ROW_PADDING,
						paddingRight: ROW_PADDING,
						paddingBottom: Indent.XS.toNumber(),
					},
				},
				ChipButton({
					testId: this.getTestId('add'),
					text: Loc.getMessage('M_FIELD_FILTER_ADD_FIELD'),
					design: ChipButtonDesign.PRIMARY,
					mode: ChipButtonMode.OUTLINE,
					size: ACTION_SIZE,
					// the action that leads somewhere keeps its whole wording; the one next to it gives
					// its letters up first, so a narrow screen cuts the answer and not the question
					style: { flexShrink: 0, marginRight: Indent.XS.toNumber() },
					onClick: this.addFields,
				}),
				ChipButton({
					testId: this.getTestId('reset'),
					text: Loc.getMessage('M_FIELD_FILTER_RESET_FIELDS'),
					design: ChipButtonDesign.GREY,
					mode: ChipButtonMode.OUTLINE,
					size: ACTION_SIZE,
					disabled: !this.canResetFields(),
					style: { flexShrink: 1 },
					onClick: this.resetFields,
				}),
			);
		}
	}

	module.exports = { SelectedFields };
});
