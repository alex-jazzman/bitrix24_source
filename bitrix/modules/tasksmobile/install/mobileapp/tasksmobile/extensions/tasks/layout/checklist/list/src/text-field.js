/**
 * @module tasks/layout/checklist/list/src/text-field
 */
jn.define('tasks/layout/checklist/list/src/text-field', (require, exports, module) => {
	const { Color } = require('tokens');
	const { inAppUrl } = require('in-app-url');
	const { TextInput } = require('ui-system/typography/text-input');
	const { PlainTextFormatter } = require('bbcode/formatter/plain-text-formatter');
	const { toggleFormatting } = require('bbcode-source-format');

	const FORMATTING_TAG_BY_TYPE = {
		bold: 'b',
		italic: 'i',
		underline: 'u',
		strikethrough: 's',
	};

	const NATIVE_FORMAT_METHOD_BY_TYPE = {
		bold: 'applyBold',
		italic: 'applyItalic',
		underline: 'applyUnderline',
		strikethrough: 'applyStrikethrough',
	};

	class ItemTextField extends LayoutComponent
	{
		#itemText = '';

		/** @param {ItemTextFieldProps} props */
		constructor(props)
		{
			super(props);

			/** @type {Object | null} */
			this.textInputRef = null;
			/** @type {number} */
			this.cursorPosition = 0;
			/** @type {{ start: number, end: number }} */
			this.selectionRange = { start: 0, end: 0 };
			this.#itemText = this.getSourceValue();

			this.#initState(props);
		}

		/** @param {ItemTextFieldProps} props */
		componentWillReceiveProps(props)
		{
			this.#initState(props);
		}

		/**
		 * @private
		 * @param {ItemTextFieldProps} props
		 */
		#initState(props)
		{
			this.state = {
				completed: props.item.getIsComplete(),
			};
		}

		/** @return {Object} */
		render()
		{
			return View(
				{
					style: {
						flex: 1,
						marginTop: 4,
						justifyContent: 'center',
					},
					onClick: this.handleOnClickView,
				},
				this.#renderTextField(),
			);
		}

		/** @return {void} */
		handleOnClickView = () => {
			const { enable, showToastNoRights } = this.props;
			if (!enable)
			{
				showToastNoRights?.();

				return;
			}

			this.focus();
		};

		/**
		 * Native TextInput (`showBBCode: false`) emits the raw BBCode source through onChangeText,
		 * so the value is cached as-is and pushed through the regular save flow — no local parsing.
		 *
		 * @param {string} text
		 * @param {boolean} [shouldSave]
		 * @return {void}
		 */
		handleOnChange = (text, shouldSave = true) => {
			const { onChangeText } = this.props;

			if (text === this.#itemText)
			{
				return;
			}

			this.#itemText = text;

			onChangeText?.(text, this.isFocused(), shouldSave);
		};

		/** @return {void} */
		handleOnSubmit = () => {
			const { onSubmit } = this.props;

			onSubmit?.();
		};

		/** @param {{ styles?: string[] } | undefined} data */
		handleOnSelectionStylesChange = (data = {}) => {
			const { onSelectionStylesChange } = this.props;
			const { styles = [] } = data;

			onSelectionStylesChange?.(styles);
		};

		/** @param {{ selection?: { start: number, end: number } }} data */
		handleOnSelectionChange = (data = {}) => {
			const selection = data.selection ?? data;

			if (!selection || !Number.isInteger(selection.start) || !Number.isInteger(selection.end))
			{
				return;
			}

			this.cursorPosition = selection.start;
			this.selectionRange = { start: selection.start, end: selection.end };
		};

		/**
		 * @param {ChecklistLinkClickParams} params
		 * @return {void}
		 */
		handleOnLinkClick = ({ url }) => {
			inAppUrl.open(url);
		};

		/** @return {void} */
		handleOnFocus = () => {
			const { onFocus, enable } = this.props;
			const title = this.getValue();

			this.cursorPosition = title.length;

			if (onFocus && enable)
			{
				onFocus();
			}
		};

		/** @return {void} */
		handleOnBlur = () => {
			const { onBlur } = this.props;

			onBlur?.();
		};

		/**
		 * @param {Object | null} ref
		 * @return {void}
		 */
		handleOnRef = (ref) => {
			if (!ref)
			{
				return;
			}

			this.textInputRef = ref;

			const { isFocused, item } = this.props;

			if (isFocused && !item.hasItemTitle())
			{
				if (item.getIndex() === 1)
				{
					setTimeout(() => {
						this.focus();
					}, 500);
				}
				else
				{
					this.focus();
				}
			}
		};

		/** @return {void} */
		focus()
		{
			const { enable } = this.props;

			if (!enable)
			{
				return;
			}

			if (this.textInputRef && enable)
			{
				this.textInputRef.focus();
			}
		}

		/** @return {void} */
		blur()
		{
			if (this.textInputRef)
			{
				this.textInputRef.blur({
					hideKeyboard: true,
				});
			}
		}

		/**
		 * @private
		 * @return {boolean}
		 */
		isFocused()
		{
			if (this.textInputRef)
			{
				return this.textInputRef.isFocused();
			}

			return false;
		}

		/** @return {void} */
		clear()
		{
			if (this.textInputRef)
			{
				this.textInputRef.clear();
			}
		}

		/** @return {void} */
		toggleCompleted()
		{
			const { item } = this.props;

			this.setState({
				completed: item.getIsComplete(),
			});
		}

		/**
		 * @private
		 * @return {Object}
		 */
		#renderTextField()
		{
			const { placeholder, header, textSize, enable = true } = this.props;

			return TextInput({
				size: textSize,
				header,
				enable,
				multiline: true,
				showBBCode: false,
				placeholder,
				ref: this.handleOnRef,
				placeholderTextColor: Color.base4.toHex(),
				color: Color.base1,
				style: this.getStyle(),
				forcedValue: this.getValue(),
				onBlur: this.handleOnBlur,
				onFocus: this.handleOnFocus,
				returnKeyType: this.getReturnKeyType(),
				onSubmitEditing: this.handleOnSubmit,
				onChangeText: this.handleOnChange,
				onSelectionChange: this.handleOnSelectionChange,
				selectedStyles: this.handleOnSelectionStylesChange,
				onLinkClick: this.handleOnLinkClick,
			});
		}

		/** @param {'bold' | 'italic' | 'underline' | 'strikethrough'} type */
		applyFormat(type)
		{
			const method = NATIVE_FORMAT_METHOD_BY_TYPE[type];

			if (!method || !this.textInputRef?.[method])
			{
				return;
			}

			// Apply natively for instant visual feedback and native selection/typing state.
			this.textInputRef[method]();

			// The native TextInput exposes no method returning its BBCode source and does not emit
			// onChangeText for formatting-only actions, so the source is rebuilt from the model
			// around the current selection and pushed through the normal save flow.
			this.#applyFormatToSource(type);
		}

		/**
		 * @private
		 * @param {'bold' | 'italic' | 'underline' | 'strikethrough'} type
		 * @return {void}
		 */
		#applyFormatToSource(type)
		{
			const tagName = FORMATTING_TAG_BY_TYPE[type];
			const selection = this.#getSelectionRange();

			if (!tagName || !selection)
			{
				// Without a selection only the native typing style changes; the next typed
				// character arrives through the regular onChangeText flow.
				return;
			}

			const nextSource = toggleFormatting(this.#itemText, selection.start, selection.end, tagName);

			if (nextSource === null || nextSource === this.#itemText)
			{
				return;
			}

			this.handleOnChange(nextSource);
		}

		/**
		 * @private
		 * @return {{ start: number, end: number } | null}
		 */
		#getSelectionRange()
		{
			const range = this.selectionRange;
			if (!range || !Number.isInteger(range.start) || !Number.isInteger(range.end))
			{
				return null;
			}

			const start = Math.min(range.start, range.end);
			const end = Math.max(range.start, range.end);

			if (end <= start)
			{
				return null;
			}

			return { start, end };
		}

		/**
		 * Kept for the save/close/focus-change flow. The model is already kept current by
		 * onChangeText (text edits) and applyFormat (formatting), and the native field cannot
		 * return its BBCode source, so there is nothing extra to pull here.
		 *
		 * @return {boolean}
		 */
		syncTextValue()
		{
			return false;
		}

		/** @return {string | null} */
		getReturnKeyType()
		{
			const { item } = this.props;

			return item.isRoot() ? 'done' : null;
		}

		/**
		 * @return {string}
		 */
		getValue()
		{
			return this.parseTextValue(this.getSourceValue());
		}

		/** @return {string} */
		getSourceValue()
		{
			const { item } = this.props;

			return item.getTitle();
		}

		/**
		 * @param {string} value
		 * @return {string}
		 */
		parseTextValue(value)
		{
			const plainTextFormatter = new PlainTextFormatter({
				diskRenderType: 'link',
				mentionRenderType: 'text',
				tableRenderType: 'placeholder',
				codeRenderType: 'text',
				listRenderType: 'text',
				allowedTags: ['url', 'b', 'i', 'u', 's'],
				normalize: false,
			});

			const plainAst = plainTextFormatter.format({
				source: value,
			});

			return plainAst.toString({ encode: false });
		}

		/** @return {Object} */
		getStyle()
		{
			const { item, style = {} } = this.props;
			const completed = item.getIsComplete();

			return {
				textAlignVertical: 'center',
				opacity: completed ? 0.6 : 1,
				...style,
			};
		}

		/** @return {number} */
		getCursorPosition()
		{
			return this.cursorPosition;
		}

		/** @return {string} */
		getTextValue()
		{
			return this.#itemText;
		}

		/** @return {void} */
		setSelection()
		{
			const titleLength = this.getValue().length;

			if (!titleLength || !this.textInputRef)
			{
				return;
			}

			this.textInputRef.setSelection(titleLength, titleLength);
		}
	}

	module.exports = { ItemTextField };
});
