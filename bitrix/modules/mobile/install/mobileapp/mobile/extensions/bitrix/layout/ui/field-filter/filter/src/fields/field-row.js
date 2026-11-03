/**
 * @module layout/ui/field-filter/filter/src/fields/field-row
 */
jn.define('layout/ui/field-filter/filter/src/fields/field-row', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
	const { createTestIdGenerator } = require('utils/test');
	const { Icon } = require('ui-system/blocks/icon');
	const { Input } = require('ui-system/form/inputs/input');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Ellipsize } = require('utils/enums/style');
	const { SettingSelector, SettingMode } = require('ui-system/blocks/setting-selector');
	const { EntitySelectorFactory } = require('selector/widget/factory');
	const { FieldPicker } = require('layout/ui/field-filter/filter/src/fields/field-picker');
	const { NumberOperatorControl } = require('layout/ui/field-filter/filter/src/fields/controls/number-operator');
	const { DateExtrasControl } = require('layout/ui/field-filter/filter/src/fields/controls/date-extras');
	const {
		AdditionalFilterButton,
		AdditionalFilterValue,
		getAllowedAdditional,
	} = require('layout/ui/field-filter/filter/src/fields/controls/additional-filter');
	const {
		formatFieldValue,
		getAnyText,
		getDatePresetLabel,
	} = require('layout/ui/field-filter/filter/src/model/value-formatter');
	const { ROW_PADDING } = require('layout/ui/field-filter/filter/src/layout/section');
	const { getClearProps } = require('layout/ui/field-filter/filter/src/layout/clearable-input');
	const { getHitOverhang } = require('layout/ui/field-filter/filter/src/layout/icon-action');
	const { getRowStyle, RowDivider } = require('layout/ui/field-filter/filter/src/layout/row-layout');
	const { FIELD_ROW_ICONS_SHOWN } = require('layout/ui/field-filter/icons');
	const {
		FieldType,
		readAdditional,
		stripAdditional,
		withAdditional,
		hasPresetExtras,
	} = require('layout/ui/field-filter/values');

	/**
	 * Fields that are filled in rather than chosen from. A screen of its own would cost two taps and
	 * show nothing the form cannot hold, so the row opens downwards instead, the way the web keeps
	 * such a field inside the form. A number belongs here too: its comparison is a dropdown standing
	 * next to the value, not a screen behind it.
	 * @type {Set<string>}
	 */
	const INLINE_TYPES = new Set([
		FieldType.STRING.getValue(),
		FieldType.FULLTEXT.getValue(),
		FieldType.NUMBER.getValue(),
	]);

	/** Size the chevron of `SettingMode.PARAMETER` is drawn with, kept for the opened row. */
	const CHEVRON_SIZE = 20;

	/**
	 * Height of the button opening the picker of a field: the one the inputs of the other editors
	 * stand at, so an opened row is of one height whatever is filled in below it.
	 */
	const CHOOSER_SIZE = ButtonSize.M;

	/**
	 * How tall the entity selector stands over the sheet of the filter: the same share of the screen
	 * the participant selectors of the project form take.
	 * @type {number}
	 */
	const BACKDROP_HEIGHT_PERCENT = 90;

	/**
	 * The provider of a selector opened from the drawer. `filter: true` is not decoration: a provider
	 * that answers differently inside a filter reads it - the tag provider of tasks names its items by
	 * the tag name there and by the tag id everywhere else, while the filter matches names. Without the
	 * flag the drawer sends ids nothing can be found by.
	 *
	 * What the dialog of the web narrows the entity to comes with the field (`entityOptions`) and is
	 * given to the very same provider: a my-company requisites field searches over my companies alone, a
	 * product row over one catalogue. Without them the picker offered what the web never would, and a
	 * value chosen there answers nothing.
	 *
	 * `filter` is set over them: every dialog opened from here is a filter, whatever the field says.
	 *
	 * @param {string} gridId
	 * @param {string} fieldId
	 * @param {?Object} [entityOptions] restrictions the web dialog puts on the entity of the field
	 * @return {{context: string, options: {filter: boolean}}}
	 */
	const buildSelectorProvider = (gridId, fieldId, entityOptions = null) => ({
		context: `FIELD_FILTER_${gridId}_${fieldId}`,
		options: { ...(Type.isPlainObject(entityOptions) ? entityOptions : {}), filter: true },
	});

	/**
	 * What an opened editor keeps around itself, one and the same for every kind of it: the row above
	 * stands on a padding of its own, so the editor adds none on top and follows the name of the field
	 * at once. Two editors padded apart read as rows of two different forms.
	 * @type {Object}
	 */
	const EDITOR_STYLE = {
		paddingLeft: ROW_PADDING,
		paddingRight: ROW_PADDING,
		paddingBottom: Indent.M.toNumber(),
	};

	/**
	 * Single field of the form: a cell with the name of the field and the current value on its right
	 * that opens a picker (BXML `SettingsCell mode="parameter"`). Locked fields keep the value visible
	 * and say where it is edited instead.
	 *
	 * The rows carry no leading icons of their own (`FIELD_ROW_ICONS_SHOWN`) and start at the edge of
	 * the area. A locked row is the exception: `SettingSelector` puts the lock where an icon would
	 * stand, and that lock is the state of the row and not the picture of the field.
	 *
	 * @extends {PureComponent<FieldRowProps>}
	 */
	class FieldRow extends PureComponent
	{
		/**
		 * @param {FieldRowProps} props
		 */
		constructor(props)
		{
			super(props);

			// the cell of the row is pure, so it has to get the same handler on every render
			this.open = this.open.bind(this);
			this.change = this.change.bind(this);
			this.clearValue = this.clearValue.bind(this);
			this.closeInlineEditor = this.closeInlineEditor.bind(this);
			this.openValuePicker = this.openValuePicker.bind(this);
			this.selectAdditional = this.selectAdditional.bind(this);
			this.clearAdditional = this.clearAdditional.bind(this);

			this.state = { expanded: false };
		}

		change(value)
		{
			const { descriptor, onChange } = this.props;

			// a period counted from a number is chosen with the number still missing: the row opens on
			// the input it has to be typed into, so the choice does not stay a condition that filters
			// nothing
			if (descriptor.type === FieldType.DATE.getValue() && hasPresetExtras(stripAdditional(value)?.preset))
			{
				this.setState({ expanded: true });
			}

			onChange?.(descriptor.id, value);
		}

		/**
		 * An empty value is what the serializer reads as "the field is not in the filter", so dropping
		 * the text is the same change as erasing it by hand.
		 */
		clearValue()
		{
			this.change('');
		}

		/**
		 * Whether the field is edited under its own row instead of on a screen of its own. Besides the
		 * fields that are typed in, that is every field offering the conditions of the "---" menu: the
		 * conditions and the value of the field stand side by side there, the way a sum field keeps them,
		 * and a menu hanging in the row itself would stand apart from the value it replaces.
		 *
		 * @return {boolean}
		 */
		isInline()
		{
			const { descriptor } = this.props;

			return INLINE_TYPES.has(descriptor.type) || this.hasAdditionalMenu() || this.needsValueExtras();
		}

		/**
		 * Whether the value of the field waits for a number to be typed next to it: a period counted
		 * from a number keeps that number in the row, the way the web filter keeps it next to the
		 * period. Such a row opens whether the field offers the "---" conditions or not - there would
		 * be nowhere else to fill the number in.
		 *
		 * @return {boolean}
		 */
		needsValueExtras()
		{
			const { descriptor, value } = this.props;

			if (descriptor.type !== FieldType.DATE.getValue())
			{
				return false;
			}

			return hasPresetExtras(stripAdditional(value)?.preset);
		}

		/**
		 * Whether the editor under the row is the one of a field that is chosen from: a button opening
		 * the picker of the field, as against an input a field is typed into.
		 *
		 * @return {boolean}
		 */
		isChooser()
		{
			const { descriptor } = this.props;

			return !INLINE_TYPES.has(descriptor.type);
		}

		/**
		 * The condition on the presence of a value the field is under, if any. A number keeps it in
		 * the value of its own control, and that control answers for it - see renderNumberEditor.
		 *
		 * @return {?AdditionalFilter}
		 */
		getAdditional()
		{
			return readAdditional(this.props.value);
		}

		/**
		 * Whether the field offers the conditions of the "---" menu at all: the provider declares them
		 * per field.
		 *
		 * @return {boolean}
		 */
		hasAdditionalMenu()
		{
			return getAllowedAdditional(this.props.descriptor).length > 0;
		}

		/**
		 * Choosing the chosen condition gives the field back to its own value, the way the cross on
		 * the web tag gives the control back.
		 *
		 * @param {AdditionalFilter} additional
		 */
		selectAdditional(additional)
		{
			const { value } = this.props;

			this.change(
				this.getAdditional() === additional
					? stripAdditional(value)
					: withAdditional(value, additional),
			);
		}

		clearAdditional()
		{
			this.change(stripAdditional(this.props.value));
		}

		isEditorOpened()
		{
			return this.state.expanded && this.isInline();
		}

		/**
		 * The typed text goes straight into the filter, keystroke by keystroke - the way the editor on
		 * a screen of its own does it. Holding it in the row until the field is left needs the row to be
		 * left: a tap on apply applies the filter without waiting for the input to lose focus, and
		 * the text typed last would never reach the request.
		 */
		toggleInlineEditor()
		{
			this.setState({ expanded: !this.state.expanded });
		}

		closeInlineEditor()
		{
			this.setState({ expanded: false });
		}

		render()
		{
			const { descriptor, isLast } = this.props;
			const getTestId = createTestIdGenerator({ context: this, prefix: `row-${descriptor.id}` });

			return View(
				{ style: { flexDirection: 'column' } },
				this.renderSelector(getTestId),
				this.renderInlineEditor(getTestId),
				isLast ? null : RowDivider({ testId: getTestId('divider'), iconColumn: FIELD_ROW_ICONS_SHOWN }),
			);
		}

		renderSelector(getTestId)
		{
			const { descriptor, icon = null, value } = this.props;
			const locked = Boolean(descriptor.locked);
			const rowStyle = getRowStyle({
				hasIcon: locked || Boolean(icon),
				iconColumn: FIELD_ROW_ICONS_SHOWN,
			});

			return SettingSelector({
				testId: getTestId(),
				title: descriptor.name,
				// the row of the filter is one line high: a name too long for the width is cut,
				// the way the web filter cuts it, and does not grow the row
				numberOfLinesTitle: 1,
				subtitle: locked ? Loc.getMessage('M_FIELD_FILTER_LOCKED_HINT') : null,
				locked,
				icon,
				// an opened row says so by the direction of its chevron, and its value is being
				// typed in below anyway; `PARAMETER` draws the chevron to the right only
				mode: this.isEditorOpened() ? SettingMode.RIGHT_ICON : SettingMode.PARAMETER,
				modeParams: this.isEditorOpened()
					? {
						icon: Icon.CHEVRON_DOWN,
						size: CHEVRON_SIZE,
						color: Color.base4,
					}
					: {
						text: formatFieldValue(descriptor, value),
						// a set value is what tells a filled row from an empty one at a glance
						textColor: Color.accentMainPrimary,
						chevron: !locked,
					},
				divider: false,
				style: rowStyle,
				onClick: this.open,
			});
		}

		/**
		 * The "---" of the field: it stands at the right edge of the editor, opposite the control the
		 * condition takes the place of - where a sum field keeps it.
		 */
		renderAdditionalButton(getTestId)
		{
			const { descriptor } = this.props;

			return AdditionalFilterButton({
				testId: getTestId('additional'),
				descriptor,
				value: this.getAdditional(),
				// the icon answers taps in a box wider than itself; the margins take that width back,
				// so the icon stands where the paddings of the editor alone would have put it
				marginLeft: Indent.M.toNumber() - getHitOverhang(),
				marginRight: -getHitOverhang(),
				onSelect: this.selectAdditional,
			});
		}

		/**
		 * Stands under the row and takes its whole width - from the icon column to the chevron.
		 */
		renderInlineEditor(getTestId)
		{
			if (!this.isEditorOpened())
			{
				return null;
			}

			if (this.props.descriptor.type === FieldType.NUMBER.getValue())
			{
				return this.renderNumberEditor(getTestId);
			}

			return this.isChooser() ? this.renderChooserEditor(getTestId) : this.renderTextEditor(getTestId);
		}

		/**
		 * The editor of a field that is chosen from: the value it holds, on a button that opens the
		 * picker of the field, the numbers that value is counted from next to it, and the "---"
		 * opposite them. The picker stays what it was - the row only stops opening it by itself, so
		 * that the conditions of the field and its value are offered side by side rather than a
		 * screen apart.
		 */
		renderChooserEditor(getTestId)
		{
			const additional = this.getAdditional();

			return View(
				{
					testId: getTestId('editor'),
					style: { ...EDITOR_STYLE, flexDirection: 'row', alignItems: 'center' },
				},
				additional === null ? this.renderChooserButton(getTestId) : AdditionalFilterValue({
					testId: getTestId('additional-value'),
					additional,
					style: { flex: 1 },
					onClear: this.clearAdditional,
				}),
				additional === null ? this.renderValueExtras(getTestId) : null,
				this.renderAdditionalButton(getTestId),
			);
		}

		/**
		 * The numbers the chosen value is counted from: a period alone has them, and only some of its
		 * presets - the control draws nothing for the rest.
		 */
		renderValueExtras(getTestId)
		{
			const { descriptor, value } = this.props;

			if (descriptor.type !== FieldType.DATE.getValue())
			{
				return null;
			}

			return DateExtrasControl({
				testId: getTestId('date-extras'),
				value,
				onChange: this.change,
			});
		}

		/**
		 * What the button says: the value of the field, and the any-value word while it holds none -
		 * the same word the picker gives the row that clears the field, because that is the state the
		 * field is in.
		 *
		 * A period counted from a number is named by the period alone: the number stands in the very
		 * next control, and "Last 30 days" next to a field holding 30 says it twice.
		 */
		renderChooserButton(getTestId)
		{
			const { descriptor, value } = this.props;
			const text = this.needsValueExtras()
				? getDatePresetLabel(stripAdditional(value).preset)
				: formatFieldValue(descriptor, value);

			return Button({
				testId: getTestId('chooser'),
				text: Type.isStringFilled(text) ? text : getAnyText(),
				rightIcon: Icon.CHEVRON_DOWN,
				rounded: false,
				design: ButtonDesign.OUTLINE_ACCENT_2,
				size: CHOOSER_SIZE,
				// the whole row is the button's while it stands alone in it. Next to the number a period
				// is counted from it is as wide as its own name instead - the way the comparison of a
				// number field is - so the number follows it at once and no empty strip stands between
				// them. A name too long for the row is cut, and the number keeps its own room
				stretched: !this.needsValueExtras(),
				ellipsize: Ellipsize.END,
				style: this.needsValueExtras() ? { flexShrink: 1 } : { flex: 1 },
				onClick: this.openValuePicker,
			});
		}

		/**
		 * The comparison and the value of a number, laid out as a row of the form. The control paints
		 * its own box, so it is given the paddings of the row instead of being wrapped into them.
		 */
		renderNumberEditor(getTestId)
		{
			const { descriptor, value } = this.props;

			return new NumberOperatorControl({
				testId: getTestId('editor'),
				descriptor,
				value,
				style: EDITOR_STYLE,
				onChange: this.change,
			});
		}

		/**
		 * Takes the keyboard on opening: the field is opened to be filled in, so there is nothing
		 * else to tap first. Text already typed in is dropped by the cross at the right edge of the
		 * input - clearing the field character by character is the only way out otherwise.
		 *
		 * A field under a condition on the presence of a value has the condition where the input
		 * would be, the way a sum field keeps it: there is nothing to type in while the condition holds.
		 */
		renderTextEditor(getTestId)
		{
			const additional = this.getAdditional();

			return View(
				{
					testId: getTestId('editor'),
					style: { ...EDITOR_STYLE, flexDirection: 'row', alignItems: 'center' },
				},
				additional === null ? this.renderTextInput(getTestId) : AdditionalFilterValue({
					testId: getTestId('additional-value'),
					additional,
					style: { flex: 1 },
					onClear: this.clearAdditional,
				}),
				this.hasAdditionalMenu() ? this.renderAdditionalButton(getTestId) : null,
			);
		}

		renderTextInput(getTestId)
		{
			const { descriptor, value } = this.props;
			const text = Type.isString(value) ? value : '';

			return Input({
				testId: getTestId('input'),
				value: text,
				placeholder: descriptor.name,
				focus: true,
				style: { flex: 1 },
				...getClearProps(text, this.clearValue),
				onChange: this.change,
				onSubmit: this.closeInlineEditor,
			});
		}

		/**
		 * A tap on the row: a field edited under the row opens the editor, a field edited on a screen
		 * of its own opens that screen at once.
		 *
		 * The row knows the generic controls only. A consumer whose field needs an editor of its
		 * own takes the field over through `onOpenField` - the row is left displaying the value.
		 */
		open()
		{
			const { descriptor, value, parentWidget, onOpenField } = this.props;

			if (descriptor.locked)
			{
				return;
			}

			const handled = onOpenField?.({
				descriptor,
				// a field under a condition is opened on what it held before it: the condition is the
				// answer of the "---" menu, and choosing a value of the field is what drops it
				value: stripAdditional(value),
				parentWidget,
				onChange: this.change,
			});

			if (handled === true)
			{
				return;
			}

			if (this.isInline())
			{
				this.toggleInlineEditor();

				return;
			}

			this.openValuePicker();
		}

		/**
		 * The picker of the field: opened by the row itself for a field the form has no editor for,
		 * and by the button of the editor for a field that has one.
		 */
		openValuePicker()
		{
			const { descriptor, parentWidget, loadFieldItems } = this.props;
			const value = stripAdditional(this.props.value);

			if (descriptor.type === FieldType.ENTITY_SELECTOR.getValue())
			{
				this.openSelector(descriptor, Type.isArray(value) ? value : []);

				return;
			}

			void FieldPicker.open({
				descriptor,
				value,
				parentWidget,
				// a field whose reference book the dictionary left on the server reads it when its picker
				// is opened, and this row is the only place that knows the picker is being opened
				loadItems: loadFieldItems ?? null,
				onChange: this.change,
			});
		}

		/**
		 * Which picker serves which entity is the business of the consumer: the entities of
		 * CONTRACT-DTO-01 are its vocabulary, and the row only looks the type up in the map it
		 * was given. An entity with no picker leaves the row unopenable, the same as `locked`.
		 */
		openSelector(descriptor, selectedIds)
		{
			const { entitySelectors } = this.props;
			const selectorType = Type.isPlainObject(entitySelectors)
				? entitySelectors[descriptor.entity]
				: null;

			if (!Type.isStringFilled(selectorType))
			{
				return;
			}

			const { parentWidget } = this.props;
			const selector = this.createSelector(selectorType, descriptor, selectedIds);
			if (!selector)
			{
				return;
			}

			void selector.show({}, parentWidget);
		}

		/**
		 * The provider the picker of this field searches through: the context of the field and the
		 * restrictions its dialog is under.
		 *
		 * @return {{context: string, options: Object}}
		 */
		getSelectorProvider()
		{
			const { gridId, descriptor } = this.props;

			return buildSelectorProvider(gridId, descriptor.id, descriptor.entityOptions ?? null);
		}

		/**
		 * The factory answers with nothing for a picker whose module is not installed on the portal -
		 * the flow selector of tasks among them, required through a `try` of its own there. Such a row
		 * stays unopenable instead of taking the sheet down with it.
		 *
		 * @return {?Object}
		 */
		createSelector(selectorType, descriptor, selectedIds)
		{
			return EntitySelectorFactory.createByType(selectorType, {
				provider: this.getSelectorProvider(),
				initSelectedIds: selectedIds,
				allowMultipleSelection: Boolean(descriptor.multiple),
				events: {
					onClose: (items) => {
						const ids = Type.isArray(items) ? items.map((item) => item.id) : [];
						this.change(ids);
					},
				},
				widgetParams: {
					title: descriptor.name,
					// the selector is a layer of its own over the sheet of the filter, not a page
					// pushed into it: the "select" button of a selector closes the widget it lives
					// in, and inside the stack of the sheet that closed the whole filter with it
					backdrop: {
						mediumPositionPercent: BACKDROP_HEIGHT_PERCENT,
						horizontalSwipeAllowed: false,
					},
				},
			});
		}
	}

	module.exports = { FieldRow, buildSelectorProvider };
});
