/**
 * @module ui-system/form/inputs/input
 */
jn.define('ui-system/form/inputs/input', (require, exports, module) => {
	const { isEmpty } = require('utils/object');
	const { Color, Indent, Component } = require('tokens');
	const { Text7 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { TextInput } = require('ui-system/typography/text-input');
	const { PropTypes } = require('utils/validation');
	const { InputMode } = require('ui-system/form/inputs/input/src/mode-enum');
	const { InputSize } = require('ui-system/form/inputs/input/src/size-enum');
	const { InputDesign } = require('ui-system/form/inputs/input/src/design-enum');
	const { PureComponent } = require('layout/pure-component');

	const ALIGN = {
		left: 'flex-start',
		center: 'center',
		right: 'flex-end',
	};

	const ICON_SIZE = 20;

	/**
	 * @typedef {Object} InputProps
	 * @property {string} props.testId
	 * @property {Function} [props.forwardRef]
	 * @property {string} [props.value]
	 * @property {string} [props.placeholder]
	 * @property {string} [props.label]
	 * @property {InputSize} [props.size=InputSize.M]
	 * @property {InputMode} [props.mode=InputMode.STROKE]
	 * @property {InputDesign} [props.design=InputDesign.PRIMARY]
	 * @property {boolean} [props.focus=false]
	 * @property {boolean} [props.disabled=false]
	 * @property {boolean} [props.locked=false]
	 * @property {boolean} [props.edit=false]
	 * @property {boolean} [props.dropdown=false]
	 * @property {boolean} [props.erase=false]
	 * @property {boolean} [props.required=false]
	 * @property {boolean} [props.error=false]
	 * @property {string} [props.errorText]
	 * @property {'left' | 'center' | 'right'} [props.align]
	 * @property {Color} [props.backgroundColor]
	 * @property {Object | Icon} [props.leftContent]
	 * @property {Function} [props.onClickLeftContent]
	 * @property {Object | Icon} [props.rightContent]
	 * @property {Function} [props.onClickRightContent]
	 * @property {Object | Icon} [props.rightStickContent]
	 * @property {Function} [props.onClickRightStickContent]
	 * @property {Function} [props.onFocus]
	 * @property {Function} [props.onChange]
	 * @property {Function} [props.onSubmit]
	 * @property {Function} [props.onBlur]
	 * @property {Function} [props.onErase]
	 * @property {Object} [props.style]
	 *
	 * @class Input
	 * @abstract
	 * @param {...InputProps} props
	 */
	class Input extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.initState(props);
			this.contentFieldRef = null;
			this.currentValue = props.value;

			this.handleOnFocus = this.handleOnFocus.bind(this);
			this.handleOnBlur = this.handleOnBlur.bind(this);
			this.handleOnSubmit = this.handleOnSubmit.bind(this);
			this.handleOnChange = this.handleOnChange.bind(this);
			this.handleOnContentClick = this.handleOnContentClick.bind(this);
			this.handleOnContentLongClick = this.handleOnContentLongClick.bind(this);
		}

		get field()
		{
			const { field } = this.props;

			return field;
		}

		componentWillReceiveProps(props)
		{
			this.initState(props);
		}

		initState(props)
		{
			this.state = {
				error: props.error,
				isFocused: props.focus,
				readOnly: props.readOnly,
			};

			this.currentValue = props.value;
		}

		render()
		{
			const { testId } = this.props;

			return View(
				{
					testId,
					style: this.getContainerStyle(),
				},
				this.renderInput(),
				this.renderLabel(),
				this.renderError(),
			);
		}

		renderInput()
		{
			return View(
				{
					style: this.getInputStyle(),
					onClick: this.handleOnContentClick,
					onLongClick: this.handleOnContentLongClick,
				},
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'row',
							alignItems: 'center',
						},
					},
					this.renderLeftContent(),
					this.renderWrapperContent(),
					this.renderRightContent(),
					this.renderLockIcon(),
					this.renderEditIcon(),
				),
				this.renderRightStick(),
			);
		}

		renderWrapperContent()
		{
			return View(
				{
					style: {
						flex: 1,
					},
				},
				this.renderContent(),
			);
		}

		renderContent()
		{
			return TextInput(this.getFieldProps());
		}

		renderLabel()
		{
			const { label } = this.props;

			if (!this.shouldRenderLabel())
			{
				return null;
			}

			const { typography: Text, minPosition } = this.getSize().getLabel();

			return View(
				{
					style: {
						position: 'absolute',
						top: 0,
						alignSelf: this.getAlign(),
					},
				},
				View(
					{
						style: {
							marginHorizontal: minPosition.toNumber(),
							paddingHorizontal: Indent.XS.toNumber(),
							backgroundColor: this.getBackgroundColor(),
							borderRadius: Component.elementXSCorner.toNumber(),
						},
					},
					Text({
						text: label,
						color: Color.base3,
					}),
				),
			);
		}

		renderError()
		{
			const { errorText } = this.props;

			if (!this.shouldRenderErrorText())
			{
				return null;
			}

			const { minPosition } = this.getSize().getLabel();

			return View(
				{
					style: {
						position: 'absolute',
						bottom: 0,
						alignSelf: this.getAlign(),
					},
				},
				View(
					{
						style: {
							marginHorizontal: minPosition.toNumber(),
							paddingHorizontal: Indent.XS.toNumber(),
							backgroundColor: this.getBackgroundColor(),
							borderRadius: Component.elementXSCorner.toNumber(),
						},
					},
					Text7({
						text: errorText,
						color: this.getErrorColor(),
					}),
				),
			);
		}

		renderRightStick()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
					},
				},
				this.renderRightStickContent(),
				this.renderEraseIcon(),
				this.renderDropdownIcon(),
			);
		}

		renderRightStickContent()
		{
			if (this.isErase())
			{
				return null;
			}

			const { onClickRightStickContent } = this.props;

			return this.renderIconContent({
				content: this.getRightStickContent(),
				iconColor: Color.base2,
				onClick: onClickRightStickContent,
			});
		}

		renderLeftContent()
		{
			const { onClickLeftContent } = this.props;

			return this.renderIconContent({
				content: this.getLeftContent(),
				style: {
					marginRight: Indent.XS2.toNumber(),
				},
				onClick: onClickLeftContent,
			});
		}

		renderRightContent(content)
		{
			const { onClickRightContent } = this.props;

			return this.renderIconContent({
				content: this.getRightContent(),
				style: {
					marginLeft: Indent.XS2.toNumber(),
				},
				onClick: onClickRightContent,
			});
		}

		renderLockIcon()
		{
			if (!this.isLocked() || this.isFocused() || this.isDisabled())
			{
				return null;
			}

			return IconView({
				size: this.getIconSize(),
				icon: Icon.LOCK,
				color: Color.base4,
			});
		}

		renderEditIcon()
		{
			if (!this.isEditable() || this.isFocused() || this.isDisabled())
			{
				return null;
			}

			return IconView({
				size: this.getIconSize(),
				icon: Icon.EDIT,
				color: Color.base3,
			});
		}

		renderEraseIcon()
		{
			if (!this.isErase())
			{
				return null;
			}

			return IconView({
				size: ICON_SIZE,
				icon: Icon.CROSS,
				color: Color.base2,
				onClick: this.handleOnErase,
			});
		}

		renderDropdownIcon()
		{
			if (!this.isDropdown() || this.isErase())
			{
				return null;
			}

			return IconView({
				size: this.getIconSize(),
				icon: Icon.CHEVRON_DOWN_SIZE_M,
				color: Color.base2,
			});
		}

		renderIconContent({ content, style, iconColor, onClick })
		{
			if (!content)
			{
				return null;
			}

			if (content instanceof Icon)
			{
				return View(
					{
						style,
						onClick,
					},
					IconView({
						size: this.getIconSize(),
						icon: content,
						color: iconColor || Color.base3,
					}),
				);
			}

			return View(
				{
					style,
					onClick,
				},
				content,
			);
		}

		getContainerStyle()
		{
			const { style = {} } = this.props;
			const { height: inputHeight } = this.getSize().getInput();
			const paddingTop = this.shouldRenderLabel() ? Indent.M.toNumber() : 0;
			const paddingBottom = this.shouldRenderErrorText() ? Indent.S.toNumber() : 0;
			const height = inputHeight + paddingTop + paddingBottom;

			return {
				height,
				paddingTop,
				paddingBottom,
				position: 'relative',
				width: '100%',
				backgroundColor: this.getBackgroundColor(),
				...this.getBorderStyle(),
				...style,
			};
		}

		getBackgroundColor()
		{
			const { backgroundColor } = this.props;

			return Color.resolve(backgroundColor, Color.bgContentPrimary).toHex();
		}

		getInputStyle()
		{
			const { height, paddingHorizontal } = this.getSize().getInput();
			const style = {
				height,
				flexDirection: 'row',
				alignItems: 'center',
				paddingHorizontal: paddingHorizontal.toNumber(),
				...this.getBorderStyle({ filled: true }),
			};

			if (this.isDisabled())
			{
				const { backgroundColor } = this.getDesignStyle();
				style.backgroundColor = backgroundColor.toHex();
			}

			return style;
		}

		getDesignStyle()
		{
			const { design } = this.props;
			let designEnum = InputDesign.resolve(design, InputDesign.PRIMARY);

			if (this.isDisabled())
			{
				designEnum = designEnum.getDisabled();
			}

			return designEnum.getStyle();
		}

		getFieldStyle()
		{
			return {
				textAlign: this.getAlign(true),
			};
		}

		/**
		 * @returns {InputSize}
		 */
		getSize()
		{
			const { size } = this.props;

			return InputSize.resolve(size, InputSize.M);
		}

		getBorderStyle({ filled } = {})
		{
			if (!this.isStroke())
			{
				return {};
			}

			const { borderRadius } = this.getSize().getContainer();

			const style = {
				borderWidth: 1,
				borderRadius: borderRadius.toNumber(),
			};

			if (filled)
			{
				const { borderColor } = this.getDesignStyle();
				style.borderColor = this.isError()
					? this.getErrorColor().toHex()
					: borderColor?.toHex();
			}

			return style;
		}

		getValue()
		{
			return this.currentValue;
		}

		getPlaceholder()
		{
			const { placeholder } = this.props;

			if (placeholder && !this.isDisabled())
			{
				return placeholder;
			}

			return '';
		}

		getPlaceholderTextColor()
		{
			return Color.base4.toHex();
		}

		getTextSize()
		{
			const { textSize } = this.getSize().getInput();

			return textSize;
		}

		isStroke()
		{
			const { mode } = this.props;

			return InputMode.resolve(mode, InputMode.STROKE).equal(InputMode.STROKE);
		}

		isDisabled()
		{
			const { disabled } = this.props;

			return disabled;
		}

		isLocked()
		{
			const { locked } = this.props;

			return Boolean(locked);
		}

		isEditable()
		{
			const { edit } = this.props;

			return Boolean(edit);
		}

		isFocused()
		{
			const { isFocused } = this.state;

			return isFocused;
		}

		isReadOnly()
		{
			const { readOnly } = this.state;

			return Boolean(readOnly);
		}

		isDropdown()
		{
			const { dropdown } = this.props;

			return Boolean(dropdown);
		}

		/**
		 * @returns {boolean}
		 */
		shouldRenderLabel()
		{
			const { label } = this.props;

			return label && typeof label === 'string';
		}

		/**
		 * @returns {boolean}
		 */
		shouldRenderErrorText()
		{
			const { errorText } = this.props;

			return errorText && typeof errorText === 'string';
		}

		handleOnContentLongClick()
		{
			// LongClick action
		}

		handleOnContentClick()
		{
			this.handleOnFocus();
		}

		handleOnFocus()
		{
			const { onFocus } = this.props;
			const focus = this.focusContentField();
			if (!focus)
			{
				return;
			}

			this.setFocused(true).then(() => {
				if (onFocus)
				{
					onFocus();
				}
			}).catch(console.error);
		}

		handleOnBlur()
		{
			const { onBlur } = this.props;

			this.setFocused(false).then(() => {
				if (onBlur)
				{
					onBlur();
				}
			}).catch(console.error);
		}

		handleOnSubmit(value)
		{
			const { onSubmit } = this.props;

			if (onSubmit)
			{
				onSubmit(value);
			}
		}

		handleOnChange(value)
		{
			const { onChange } = this.props;
			this.currentValue = value;

			if (onChange)
			{
				onChange(value);
			}
		}

		handleOnErase = () => {
			const { onErase } = this.props;

			if (onErase)
			{
				onErase();
			}
		};

		#handleOnForwardRef = (ref) => {
			const { forwardRef } = this.props;

			if (forwardRef)
			{
				forwardRef(ref);
			}
		};

		focusContentField()
		{
			if (typeof this.contentFieldRef?.focus !== 'function')
			{
				return false;
			}

			this.contentFieldRef?.focus();

			return true;
		}

		setFocused(value)
		{
			return new Promise((resolve) => {
				this.setState({
					error: !this.isValid(),
					isFocused: value,
				}, resolve);
			});
		}

		/**
		 * @param {boolean} [textStyle]
		 * @returns {*}
		 */
		getAlign(textStyle)
		{
			const { align } = this.props;

			if (textStyle)
			{
				return ALIGN[align] ? align : 'left';
			}

			return ALIGN[align] || ALIGN.left;
		}

		getFieldProps()
		{
			return {
				ref: (ref) => {
					this.#handleOnForwardRef(ref);
					this.contentFieldRef = ref;
				},
				multiline: false,
				focus: this.isFocused(),
				enable: !this.isReadOnly(),
				size: this.getTextSize(),
				value: this.getValue(),
				onBlur: this.handleOnBlur,
				onFocus: this.handleOnFocus,
				onSubmitEditing: this.handleOnSubmit,
				onChangeText: this.handleOnChange,
				placeholder: this.getPlaceholder(),
				placeholderTextColor: this.getPlaceholderTextColor(),
				style: this.getFieldStyle(),
			};
		}

		getErrorColor()
		{
			return Color.accentMainAlert;
		}

		/**
		 * @abstract
		 * @returns {string}
		 */
		getValidationErrorMessage()
		{
			return '';
		}

		getIconSize()
		{
			return ICON_SIZE;
		}

		getLeftContent()
		{
			const { leftContent } = this.props;

			return leftContent;
		}

		getRightContent()
		{
			const { rightContent } = this.props;

			return rightContent;
		}

		getRightStickContent()
		{
			const { rightStickContent } = this.props;

			return rightStickContent;
		}

		isValid()
		{
			if (this.isRequired())
			{
				return !this.isEmpty();
			}

			return true;
		}

		isRequired()
		{
			const { required } = this.props;

			return Boolean(required);
		}

		isEmpty()
		{
			return isEmpty(this.getValue());
		}

		isError()
		{
			const { error } = this.state;

			return Boolean(error);
		}

		isErase()
		{
			const { erase } = this.props;

			return Boolean(erase) && !this.isEmpty();
		}
	}

	Input.defaultProps = {
		disabled: false,
		locked: false,
		edit: false,
		error: false,
		dropdown: false,
		required: false,
		erase: false,
	};

	Input.propTypes = {
		testId: PropTypes.string.isRequired,
		forwardRef: PropTypes.func,
		value: PropTypes.string,
		placeholder: PropTypes.string,
		label: PropTypes.string,
		size: PropTypes.instanceOf(InputSize),
		design: PropTypes.instanceOf(InputDesign),
		mode: PropTypes.instanceOf(InputMode),
		focus: PropTypes.bool,
		disabled: PropTypes.bool,
		locked: PropTypes.bool,
		edit: PropTypes.bool,
		dropdown: PropTypes.bool,
		required: PropTypes.bool,
		erase: PropTypes.bool,
		error: PropTypes.bool,
		errorText: PropTypes.string,
		align: PropTypes.oneOf(Object.keys(ALIGN)),
		backgroundColor: PropTypes.instanceOf(Color),
		style: PropTypes.object,
		leftContent: PropTypes.oneOfType([PropTypes.object, PropTypes.instanceOf(Icon)]),
		onClickLeftContent: PropTypes.func,
		rightContent: PropTypes.oneOfType([PropTypes.object, PropTypes.instanceOf(Icon)]),
		onClickRightContent: PropTypes.func,
		rightStickContent: PropTypes.oneOfType([PropTypes.object, PropTypes.instanceOf(Icon)]),
		onClickRightStickContent: PropTypes.func,
		onDropdown: PropTypes.func,
		onChange: PropTypes.func,
		onSubmit: PropTypes.func,
		onBlur: PropTypes.func,
		onFocus: PropTypes.func,
		onErase: PropTypes.func,
	};

	module.exports = {
		Icon,
		InputMode,
		InputSize,
		InputDesign,
		Input: (props) => new Input(props),
		InputClass: Input,
	};
});
