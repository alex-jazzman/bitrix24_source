/**
 * @module ui-system/form/inputs/input
 */
jn.define('ui-system/form/inputs/input', (require, exports, module) => {
	const { Type } = require('type');
	const { isEmpty, isEqual } = require('utils/object');
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

	let mounted = false;

	/**
	 * @typedef {Object} InputProps
	 * @property {string} testId
	 * @property {Function} [forwardRef]
	 * @property {string} [value]
	 * @property {string} [placeholder]
	 * @property {string} [label]
	 * @property {InputSize} [size=InputSize.M]
	 * @property {InputMode} [mode=InputMode.STROKE]
	 * @property {InputDesign} [design=InputDesign.PRIMARY]
	 * @property {boolean} [focus=false]
	 * @property {boolean} [disabled=false]
	 * @property {boolean} [multiline=false]
	 * @property {boolean} [locked=false]
	 * @property {boolean} [edit=false]
	 * @property {boolean} [dropdown=false]
	 * @property {boolean} [erase=false]
	 * @property {boolean} [required=false]
	 * @property {boolean} [error=false]
	 * @property {string} [errorText]
	 * @property {'left' | 'center' | 'right'} [align]
	 * @property {Color} [backgroundColor]
	 * @property {Object | Icon} [leftContent]
	 * @property {Function} [onClickLeftContent]
	 * @property {Object | Icon} [rightContent]
	 * @property {Function} [onClickRightContent]
	 * @property {Object | Icon} [rightStickContent]
	 * @property {Function} [onClickRightStickContent]
	 * @property {Function} [onFocus]
	 * @property {Function} [onChange]
	 * @property {Function} [onSubmit]
	 * @property {Function} [onBlur]
	 * @property {Function} [onErase]
	 * @property {Object} [style]

	 * @class Input
	 * @abstract
	 * @param {InputProps} props
	 */
	class Input extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.currentValue = null;
			this.contentFieldRef = null;

			this.initProperties();
			this.initState(props);

			this.handleOnFocus = this.handleOnFocus.bind(this);
			this.handleOnBlur = this.handleOnBlur.bind(this);
			this.handleOnSubmit = this.handleOnSubmit.bind(this);
			this.handleOnChange = this.handleOnChange.bind(this);
			this.handleOnChangeText = this.handleOnChangeText.bind(this);
			this.handleOnContentClick = this.handleOnContentClick.bind(this);
			this.handleOnContentLongClick = this.handleOnContentLongClick.bind(this);
			this.handleOnClickLeftContent = this.handleOnClickLeftContent.bind(this);
		}

		get field()
		{
			const { field } = this.props;

			return field;
		}

		componentDidMount()
		{
			mounted = true;
		}

		componentWillUnmount()
		{
			mounted = false;
		}

		componentWillReceiveProps(nextProps)
		{
			this.initState(nextProps);
		}

		shouldComponentUpdate(nextProps, nextState)
		{
			const nextStateToCompare = Array.isArray(nextState) ? nextState[0] : nextState;

			let prevPropsToCompare = this.props;
			let nextPropsToCompare = nextProps;

			if (this.currentValue !== null)
			{
				const currentValue = this.currentValue;

				this.currentValue = null;

				if (!isEqual(currentValue, nextProps.value))
				{
					this.logComponentDifference({ value: currentValue }, { value: nextProps.value }, null, null);

					return true;
				}

				const { value: prevValue, ...prevPropsWithoutValue } = this.props;
				const { value: nextValue, ...nextPropsWithoutValue } = nextProps;

				prevPropsToCompare = prevPropsWithoutValue;
				nextPropsToCompare = nextPropsWithoutValue;
			}

			const hasChanged = !isEqual(prevPropsToCompare, nextPropsToCompare) || !isEqual(
				this.state,
				nextStateToCompare,
			);

			if (hasChanged)
			{
				this.logComponentDifference(prevPropsToCompare, nextPropsToCompare, this.state, nextStateToCompare);

				return true;
			}

			return false;
		}

		initState(props)
		{
			this.state = this.getStateObject(props);
		}

		initProperties()
		{}

		getStateObject(props)
		{
			const state = {
				...this.state,
				error: props.error,
				readOnly: props.readOnly,
			};

			if (!this.isMounted())
			{
				state.isFocused = false;

				if (Type.isBoolean(props.focus))
				{
					state.isFocused = props.focus;
				}
			}

			return state;
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
						numberOfLines: 1,
						ellipsize: 'middle',
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
			return this.renderIconContent({
				content: this.getLeftContent(),
				style: {
					marginRight: Indent.XS2.toNumber(),
				},
				onClick: this.handleOnClickLeftContent,
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
			if (!this.isLocked() || this.#isFocused() || this.isDisabled())
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
			if (!this.isEditable() || this.#isFocused() || this.isDisabled())
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
			const height = inputHeight + paddingTop + paddingBottom + (this.isIOS() ? 0 : 1);

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

		getRef()
		{
			return this.contentFieldRef;
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
				const { borderColor, borderColorFocused } = this.getDesignStyle();

				if (this.isError())
				{
					style.borderColor = this.getErrorColor().toHex();
				}
				else if (this.#isFocused() && borderColorFocused)
				{
					style.borderColor = borderColorFocused.toHex();
				}
				else
				{
					style.borderColor = borderColor?.toHex();
				}
			}

			return style;
		}

		getValue()
		{
			if (this.currentValue !== null)
			{
				return this.currentValue;
			}

			const { value } = this.props;

			return value;
		}

		getCurrentValue()
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

		#isFocused()
		{
			const { isFocused } = this.state;

			return Boolean(isFocused);
		}

		isEnable()
		{
			return !this.isReadOnly() && !this.isDisabled();
		}

		isMultiline()
		{
			const { multiline } = this.props;

			return Boolean(multiline);
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

		handleOnClickLeftContent()
		{
			const { onClickLeftContent } = this.props;

			if (onClickLeftContent)
			{
				onClickLeftContent();
			}
		}

		handleOnContentClick()
		{
			this.handleOnFocus();
		}

		handleOnFocus()
		{
			const { onFocus } = this.props;

			if (this.#isFocused())
			{
				return;
			}

			void this.setFocused(true, onFocus);
		}

		handleOnBlur()
		{
			const { onBlur } = this.props;

			if (!this.#isFocused())
			{
				return;
			}

			void this.setFocused(false, onBlur);
		}

		handleOnSubmit(value)
		{
			const { onSubmit } = this.props;

			if (onSubmit)
			{
				onSubmit(value);
			}
		}

		handleOnChangeText(value)
		{
			this.setCurrentValue(value);
			this.handleOnChange(value);
		}

		handleOnChange(value)
		{
			const { onChange } = this.props;

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

		setFocused(value, callback)
		{
			if (!this.isEnable())
			{
				return Promise.resolve();
			}

			return new Promise(() => {
				this.setState({
					error: !this.isValid(),
					isFocused: value,
				}, () => {
					if (Type.isFunction(callback))
					{
						callback();
					}
				});
			});
		}

		setCurrentValue(value)
		{
			this.currentValue = value;
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
				multiline: this.isMultiline(),
				focus: this.#isFocused(),
				enable: this.isEnable(),
				size: this.getTextSize(),
				value: this.getValue(),
				onBlur: this.handleOnBlur,
				onFocus: this.handleOnFocus,
				onSubmitEditing: this.handleOnSubmit,
				onChangeText: this.handleOnChangeText,
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

		isIOS()
		{
			return Application.getPlatform() === 'ios';
		}

		isMounted()
		{
			return mounted;
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
		multiline: false,
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
		multiline: PropTypes.bool,
		locked: PropTypes.bool,
		edit: PropTypes.bool,
		dropdown: PropTypes.bool,
		required: PropTypes.bool,
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
		/**
		 * @param {InputProps} props
		 * @returns {Input}
		 */
		Input: (props) => new Input(props),
		Icon,
		InputMode,
		InputSize,
		InputDesign,
		InputClass: Input,
	};
});
