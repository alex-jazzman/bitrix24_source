/**
 * @module ui-system/form/inputs/otp
 */
jn.define('ui-system/form/inputs/otp', (require, exports, module) => {
	const { refSubstitution } = require('utils/function');
	const { createTestIdGenerator } = require('utils/test');
	const { PureComponent } = require('layout/pure-component');
	const { OtpCell } = require('ui-system/form/inputs/otp/src/cell');
	const { OtpValue } = require('ui-system/form/inputs/otp/src/value');

	const AVAILABLE_LENGTHS = [4, 6];
	const DEFAULT_LENGTH = 6;
	const NO_CELL = -1;
	// filler plus one digit: the longest text OtpValue.cellText ever puts into a cell field. The limit
	// is the same on every cell at any time on purpose, because the native keeps the limit its field
	// was created with, and a limit that moved with the active cell left the next cell unable to take
	// a character at all
	const CELL_MAX_LENGTH = 2;

	const normalizeLength = (length) => {
		const parsedLength = Number(length);

		return AVAILABLE_LENGTHS.includes(parsedLength) ? parsedLength : DEFAULT_LENGTH;
	};

	/**
	 * @extends {PureComponent<OtpInputProps, OtpInputState>}
	 */
	class OtpInput extends PureComponent
	{
		/**
		 * @param {OtpInputProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'otp-input',
				context: this,
			});

			this.fieldRefs = [];
			this.fieldHandlers = [];
			this.focusedFieldIndex = NO_CELL;
			this.focusRequested = false;
			this.textRevisionCounter = 0;

			this.#initState(props);
		}

		componentDidMount()
		{
			const { innerRef, value, focus } = this.props;

			innerRef?.(this);

			this.#notifyNormalizedValue(value);

			if (focus)
			{
				this.focus();
			}
		}

		componentWillReceiveProps(nextProps)
		{
			const { value, length, focus } = this.props;

			this.focusRequested = Boolean(nextProps.focus) && !focus;

			if (nextProps.value === value && nextProps.length === length)
			{
				return;
			}

			this.#syncValueFromProps(nextProps);
		}

		componentDidUpdate()
		{
			if (!this.#isEditable())
			{
				// the native takes the focus away from a field that stopped being editable, and no event
				// about it is guaranteed
				this.#setFocusedField(NO_CELL);
			}

			if (this.focusRequested)
			{
				this.focusRequested = false;
				this.focus();
			}
		}

		/**
		 * @param {OtpInputProps} props
		 */
		#initState(props)
		{
			this.state = {
				value: OtpValue.normalize(props.value, normalizeLength(props.length)),
				// the counter has to stay monotonic for the whole life of the component: the consumer echoes
				// the value back in the same tick the revision was bumped, so resetting it here costs the
				// whole row a second render pass on every keystroke that bumps it, and makes the text return
				// depend on whether the runtime keeps the two updates in separate passes, as iOS does
				textRevision: this.textRevisionCounter,
				focused: this.#holdsFocus(),
			};
		}

		/**
		 * Rebuilds the value set from the outside and reports what the change means for the consumer.
		 * @param {OtpInputProps} nextProps
		 */
		#syncValueFromProps(nextProps)
		{
			// this.props still holds the previous props here
			const previousValue = this.state.value;
			const previousLength = this.#getLength();

			this.#initState(nextProps);
			this.#notifyNormalizedValue(nextProps.value, nextProps);

			const { value } = this.state;
			const length = normalizeLength(nextProps.length);

			if (value === previousValue && length === previousLength)
			{
				return;
			}

			if (this.#holdsFocus())
			{
				// the active cell has moved along with the value, so the focus has to follow it; an input
				// the user is not in keeps its keyboard down
				this.focusRequested = true;
			}

			// a code written from the outside is reported every time it comes in complete: the early return
			// above guarantees the value or the length has really changed, so this is never an echo
			this.#notifyCompletion(value, length, nextProps);
		}

		render()
		{
			const { style } = this.props;

			return View(
				{
					testId: this.getTestId(),
					style: {
						flexDirection: 'row',
						...style,
					},
				},
				...this.#renderCells(),
				this.#renderTapInterceptor(),
			);
		}

		/**
		 * Takes the tap instead of the cell fields: a tapped field becomes the first responder and its caret
		 * fights the programmatic focus of the active cell.
		 */
		#renderTapInterceptor()
		{
			return View({
				testId: this.getTestId('tap-interceptor'),
				style: {
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					zIndex: 1,
				},
				// there is no active cell while input is not allowed, so focus() leaves the layer inert
				onClick: this.focus,
			});
		}

		#renderCells()
		{
			const activeIndex = this.#getActiveCellIndex();
			const { focused } = this.state;

			return Array.from(
				{ length: this.#getLength() },
				// the accent border belongs to the cell that takes the typing, and only while there is typing
				(cell, index) => this.#renderCell(index, activeIndex, focused ? activeIndex : NO_CELL),
			);
		}

		#renderCell(index, activeIndex, focusedIndex)
		{
			const { error, disabled } = this.props;
			const { value, textRevision } = this.state;
			const length = this.#getLength();
			const { forwardRef, onFocus, onBlur, onChangeText } = this.#getFieldHandlers(index);

			return OtpCell({
				testId: this.getTestId(`cell-${index}`),
				index,
				text: OtpValue.cellText(value, length, index, activeIndex),
				// a bumped revision changes the cell props, so its pure render does not swallow the forced text
				textRevision,
				maxLength: CELL_MAX_LENGTH,
				focused: index === focusedIndex,
				editable: this.#isEditable(),
				error: Boolean(error),
				disabled: Boolean(disabled),
				forwardRef,
				// focus of a cell is only watched: bouncing it back to the active cell is what the tap
				// interceptor replaced
				onFocus,
				onBlur,
				// the handler stays on every cell for the same reason the limit does; which cell the
				// input belongs to is decided inside it
				onChangeText,
			});
		}

		/**
		 * @param {number} index cell whose field reported the text
		 * @param {string} text
		 */
		#handleCellChangeText(index, text)
		{
			if (!this.#isEditable())
			{
				// there is no active cell to take the text, so nothing can be read out of it
				return;
			}

			if (index !== this.#getActiveCellIndex())
			{
				this.#handleInactiveCellText(index, text);

				return;
			}

			const { value } = this.state;
			const length = this.#getLength();
			const nextValue = OtpValue.applyCellText(value, text, length);

			if (nextValue === value)
			{
				this.#resyncCellText(index, text);

				return;
			}

			// the active cell moves along with the value, so focus has to follow it
			this.setState({ value: nextValue }, this.focus);

			this.#notifyValueChange(value, nextValue, length);
		}

		/**
		 * A cell stops being active before the focus leaves its field, so a keystroke of a fast typist
		 * still lands there and has to reach the value.
		 * @param {number} index cell whose field reported the text
		 * @param {string} text
		 */
		#handleInactiveCellText(index, text)
		{
			// the echo of what the component itself wrote into the cell, and the only thing a field can
			// report while the input holds no focus: a keystroke needs the focus to land anywhere
			if (text === this.#getCellText(index) || !this.#holdsFocus())
			{
				return;
			}

			const { value } = this.state;
			const length = this.#getLength();
			const nextValue = OtpValue.applyInactiveCellText(value, text, length, index);

			// the text of this cell can stay the same under the new value, and a cell whose props did not
			// change is not rendered again, so the field takes its text back only through the revision
			this.setState({ value: nextValue, textRevision: this.#bumpTextRevision() }, this.focus);

			if (nextValue !== value)
			{
				this.#notifyValueChange(value, nextValue, length);
			}
		}

		/**
		 * Gives the field its text back when the value stayed the same but the field kept what the user typed.
		 * @param {number} index cell whose field reported the text
		 * @param {string} text
		 */
		#resyncCellText(index, text)
		{
			if (text === this.#getCellText(index))
			{
				return;
			}

			this.setState({ textRevision: this.#bumpTextRevision() });
		}

		/**
		 * @return {number} revision that tells the cell props apart from the ones it already holds
		 */
		#bumpTextRevision()
		{
			this.textRevisionCounter += 1;

			return this.textRevisionCounter;
		}

		/**
		 * @param {number} index
		 * @return {string} text the cell is given for the value the component holds
		 */
		#getCellText(index)
		{
			const { value } = this.state;

			return OtpValue.cellText(value, this.#getLength(), index, this.#getActiveCellIndex());
		}

		/**
		 * Callbacks of a cell field, kept per index: a new function on every render defeats the pure
		 * render of the cell.
		 * @param {number} index
		 */
		#getFieldHandlers(index)
		{
			if (!this.fieldHandlers[index])
			{
				this.fieldHandlers[index] = {
					forwardRef: (ref) => {
						this.fieldRefs[index] = ref;
					},
					onFocus: () => {
						this.#setFocusedField(index);
					},
					onBlur: () => {
						// the blur of the previous field may arrive after the focus of the new one
						if (this.focusedFieldIndex === index)
						{
							this.#setFocusedField(NO_CELL);
						}
					},
					onChangeText: (text) => {
						this.#handleCellChangeText(index, text);
					},
				};
			}

			return this.fieldHandlers[index];
		}

		/**
		 * Single entry for the tracked focus: the index is the truth, the state only makes the fact of
		 * focus visible to the render.
		 * @param {number} index cell whose field holds the focus, NO_CELL when none does
		 */
		#setFocusedField(index)
		{
			const wasHolding = this.#holdsFocus();

			this.focusedFieldIndex = index;

			// a handoff between cells keeps the border where it is: only the fact of focus redraws the row
			if (this.#holdsFocus() !== wasHolding)
			{
				this.setState({ focused: this.#holdsFocus() });
			}
		}

		#holdsFocus()
		{
			return this.focusedFieldIndex !== NO_CELL;
		}

		#getFocusedField()
		{
			return this.fieldRefs[this.focusedFieldIndex];
		}

		#getActiveField()
		{
			return this.fieldRefs[this.#getActiveCellIndex()];
		}

		#getActiveCellIndex()
		{
			if (!this.#isEditable())
			{
				return NO_CELL;
			}

			const { value } = this.state;

			return OtpValue.activeIndex(value, this.#getLength());
		}

		#getLength()
		{
			const { length } = this.props;

			return normalizeLength(length);
		}

		#isEditable()
		{
			const { disabled, readOnly } = this.props;

			return !disabled && !readOnly;
		}

		/**
		 * Reports the value back when normalization changed what the consumer passed in.
		 * @param {string} [incomingValue]
		 * @param {OtpInputProps} [props] set the callback is taken from: the sync from props runs while
		 *   this.props still holds the previous set, and the consumer may have replaced the callback
		 *   in the very same update
		 */
		#notifyNormalizedValue(incomingValue, props = this.props)
		{
			const { value } = this.state;

			if (value === (incomingValue ?? ''))
			{
				return;
			}

			const { onChange } = props;

			onChange?.(value);
		}

		/**
		 * @param {string} previousValue
		 * @param {string} nextValue
		 * @param {number} length
		 */
		#notifyValueChange(previousValue, nextValue, length)
		{
			const { onChange } = this.props;

			onChange?.(nextValue);

			// typing counts as completion only on the transition, otherwise every digit pressed over a
			// complete code would repeat the event
			if (!OtpValue.isComplete(previousValue, length))
			{
				this.#notifyCompletion(nextValue, length);
			}
		}

		/**
		 * @param {string} value
		 * @param {number} length
		 * @param {OtpInputProps} [props] set the callback is taken from, see #notifyNormalizedValue
		 */
		#notifyCompletion(value, length, props = this.props)
		{
			if (!OtpValue.isComplete(value, length))
			{
				return;
			}

			const { onComplete } = props;

			onComplete?.(value);
		}

		focus = () => {
			const field = this.#getActiveField();

			if (field)
			{
				// the interceptor leaves no way for a tap to focus a field, so tracking the focus cannot
				// rely on the native onFocus alone
				this.#setFocusedField(this.#getActiveCellIndex());
				field.focus();
			}
		};

		blur = () => {
			// the focus is not always in the field of the active cell: a cell stops being active before the
			// focus leaves its field, so the active one serves only as a fallback
			const field = this.#getFocusedField() ?? this.#getActiveField();

			// both signs of focus are dropped, and unconditionally: an input asked to give the focus up must
			// not raise the keyboard back on a later value change, nor by a request the running sync from
			// props has already made. The consumer calls blur() right from onComplete
			this.focusRequested = false;
			this.#setFocusedField(NO_CELL);
			field?.blur({ hideKeyboard: true });
		};
	}

	module.exports = {
		/**
		 * @param {OtpInputProps} props
		 * @return {OtpInput}
		 */
		OtpInput: (props) => refSubstitution(OtpInput)(props),
		OtpValue,
	};
});
