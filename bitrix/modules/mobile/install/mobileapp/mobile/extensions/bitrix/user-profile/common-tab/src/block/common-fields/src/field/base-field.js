/**
 * @module user-profile/common-tab/src/block/common-fields/src/field/base-field
 */
jn.define('user-profile/common-tab/src/block/common-fields/src/field/base-field', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { Text5, Capital } = require('ui-system/typography/text');
	const { Color, Indent } = require('tokens');
	const { Link4 } = require('ui-system/blocks/link');
	const { Loc } = require('loc');

	/**
	 * @typedef {Object} FieldProps
	 * @property {string} testId
	 * @property {bool} isEditMode
	 * @property {bool} isMultiple
	 * @property {string} title
	 * @property {string} value
	 * @property {boolean} isFirst

	 * @class BaseField
	 */
	class BaseField extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.refs = {};
			this.getTestId = createTestIdGenerator({
				prefix: `common-field-${props.testId}`,
				context: this,
			});
			this.initState(props);
		}

		componentWillReceiveProps(newProps)
		{
			this.initState(newProps);
		}

		initState(props)
		{
			this.state = {
				value: props.value ?? null,
			};
		}

		render()
		{
			const { isEditMode, isMultiple } = this.props;
			const { value } = this.state;

			return View(
				{ style: this.getFieldContainerStyle() },
				this.#renderFieldTitle(),
				!isEditMode && !isMultiple && this.renderViewModeFieldValue(value, 0),
				isEditMode && !isMultiple && this.renderEditModeFieldValue(value, 0),
				!isEditMode && isMultiple && this.renderViewModeFieldMultipleValues(),
				isEditMode && isMultiple && this.renderEditModeFieldMultipleValues(),
			);
		}

		getFieldContainerStyle()
		{
			const { isEditMode, isFirst } = this.props;

			return {
				marginTop: isFirst ? 0 : Indent.XL2.toNumber(),
				alignItems: 'flex-start',
				paddingBottom: isEditMode ? Indent.L.toNumber() : 0,
				borderBottomColor: Color.bgSeparatorSecondary.toHex(),
				borderBottomWidth: isEditMode ? 1 : 0,
			};
		}

		#renderFieldTitle()
		{
			const { isEditMode, title } = this.props;

			if (isEditMode)
			{
				return Capital({
					text: title.toUpperCase(),
					color: Color.base4,
					style: this.getFieldTitleStyle(),
				});
			}

			return Text5({
				text: title,
				color: Color.base3,
				style: this.getFieldTitleStyle(),
			});
		}

		getFieldTitleStyle()
		{
			return {
				marginBottom: Indent.S.toNumber(),
			};
		}

		renderViewModeFieldValue(value, idx)
		{
			// This method should be overridden in subclasses to provide specific field value editing
			return null;
		}

		renderEditModeFieldValue(value, idx)
		{
			// This method should be overridden in subclasses to provide specific field value editing
			return null;
		}

		getDefaultValue()
		{
			// This method should be overridden in subclasses to provide specific default value for new entries
			return null;
		}

		renderViewModeFieldMultipleValues()
		{
			const { value } = this.state;
			if (!Array.isArray(value) || value.length === 0)
			{
				return null;
			}

			return View(
				{
					testId: this.getTestId('multiple-values-view-container'),
					style: {
						width: '100%',
					},
				},
				...value.map((item, idx) => this.renderViewModeFieldValue(item, idx)),
			);
		}

		renderEditModeFieldMultipleValues()
		{
			const { id } = this.props;
			const { value = [] } = this.state;

			return View(
				{
					testId: this.getTestId(`${id.toLowerCase()}-multiple-values-edit-container`),
					style: {
						width: '100%',
					},
				},
				...value.map((item, idx) => this.renderEditModeFieldValue(item, idx)),
				this.renderAddNewValueButton(this.addValue),
			);
		}

		renderAddNewValueButton(onAddNewValue)
		{
			const { id } = this.props;

			return Link4({
				testId: this.getTestId(`${id.toLowerCase()}-add-new-value-button`),
				text: Loc.getMessage('M_PROFILE_COMMON_FIELDS_ADD_VALUE_BUTTON_TEXT'),
				size: 4,
				color: Color.link,
				onPress: onAddNewValue,
				style: {
					marginTop: Indent.S.toNumber(),
				},
			});
		}

		onChange = (newValue, idx) => {
			const { onChange, isMultiple } = this.props;
			const { value } = this.state;
			const newValues = isMultiple
				? value.map((item, i) => (i === idx ? newValue : item))
				: newValue;
			this.setState({
				value: newValues,
			}, () => {
				onChange?.(newValues);
			});
		};

		addValue = () => {
			const { onChange } = this.props;
			const { value } = this.state;
			onChange?.([...value, this.getDefaultValue()]);
		};

		bindRef = (ref, idx) => {
			this.refs[idx] = ref;
		};

		onFocus = (idx) => {
			const { onFocus } = this.props;
			onFocus?.(this.refs?.[idx]);
		};
	}

	module.exports = {
		BaseField,
	};
});
