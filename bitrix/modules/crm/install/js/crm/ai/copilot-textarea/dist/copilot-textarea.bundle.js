/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, ai_copilot, crm_ai_nameService, main_core, main_core_events, main_popup) {
	'use strict';

	const PROPERTIES = ['direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing', 'tabSize', 'MozTabSize'];
	// eslint-disable-next-line sonarjs/cognitive-complexity
	function getCaretCoordinates(element, position) {
		// eslint-disable-next-line no-eq-null
		const isFirefox = window.mozInnerScreenX !== null;
		const dummyEl = main_core.Tag.render`<div id='textarea-caret-position-dummy-div'></div>`;
		main_core.Dom.append(dummyEl, document.body);
		const style = dummyEl.style;
		const computed = window.getComputedStyle ? window.getComputedStyle(element) : element.currentStyle;
		const isInput = element.nodeName === 'INPUT';
		style.whiteSpace = 'pre-wrap';
		if (!isInput) {
			style.wordWrap = 'break-word';
		}

		// Position off-screen
		style.position = 'absolute'; // required to return coordinates properly
		style.visibility = 'hidden'; // not 'display: none' because we want rendering

		// Transfer the element's properties to the div
		PROPERTIES.forEach(prop => {
			if (isInput && prop === 'lineHeight') {
				// Special case for <input>s because text is rendered centered and line height may be != height
				if (computed.boxSizing === 'border-box') {
					const height = parseInt(computed.height, 10);
					const outerHeight = parseInt(computed.paddingTop, 10) + parseInt(computed.paddingBottom, 10) + parseInt(computed.borderTopWidth, 10) + parseInt(computed.borderBottomWidth, 10);
					const targetHeight = outerHeight + parseInt(computed.lineHeight, 10);
					if (height > targetHeight) {
						style.lineHeight = `${height - outerHeight}px`;
					} else if (height === targetHeight) {
						style.lineHeight = computed.lineHeight;
					} else {
						style.lineHeight = 0;
					}
				} else {
					style.lineHeight = computed.height;
				}
			} else {
				style[prop] = computed[prop];
			}
		});
		if (isFirefox) {
			if (element.scrollHeight > parseInt(computed.height, 10)) {
				style.overflowY = 'scroll';
			}
		} else {
			style.overflow = 'hidden';
		}
		dummyEl.textContent = element.value.slice(0, Math.max(0, position));
		if (isInput) {
			dummyEl.textContent = dummyEl.textContent.replaceAll(/\s/g, '\u00A0');
		}
		const spanEl = main_core.Tag.render`<span></span>`;
		spanEl.textContent = element.value.slice(Math.max(0, position)) || '.'; // || because a completely empty faux span doesn't render at all
		main_core.Dom.append(spanEl, dummyEl);
		const coordinates = {
			top: spanEl.offsetTop + parseInt(computed.borderTopWidth, 10),
			left: spanEl.offsetLeft + parseInt(computed.borderLeftWidth, 10)
		};
		main_core.Dom.remove(dummyEl);
		return coordinates;
	}

	const COPILOT_BUTTON_WIDTH = 80;
	const COPILOT_BUTTON_HEIGHT = 32;
	const COPILOT_RESULT_TEXT_WRAP_LEFT = '<<<';
	const COPILOT_RESULT_TEXT_WRAP_RIGHT = '>>>';
	const Events = {
		EVENT_VALUE_CHANGE: 'crm:ai:copilot-textarea:value-change'
	};
	class CopilotTextarea {
		#id;
		#copilot;
		#element;
		#isDebugEnabled = false;
		#copilotLoaded = false;
		#copilotBtnPopup = null;
		#currentSelectedText = '';
		constructor(params) {
			this.#assertValidParams(params);
			this.#id = params.id;
			this.#element = params.target;
			this.#copilot = new ai_copilot.Copilot(params.copilotParams); // @see CopilotOptions [ai/install/js/ai/copilot/src/copilot.js]
			this.#isDebugEnabled = params.isDebugEnabled || false;
			this.#bindHandlers();
			this.#copilot.init();
			main_core.Event.bind(this.#element, 'keydown', event => this.#handleKeyDown(event));
			main_core.Event.bind(this.#element, 'select', event => this.#handleSelect(event));
		}
		getId() {
			return this.#id;
		}
		setReadOnly(flag = true) {
			// NOTE: Dom.attr method NOT WORKED, so use setAttribute/removeAttribute
			if (flag) {
				this.#element.setAttribute('readonly', 1);
			} else {
				this.#element.removeAttribute('readonly');
			}
		}
		#showCopilot(params) {
			const coordinates = this.#getElementCoordinates();
			if (!coordinates) {
				return;
			}
			const context = params.context || '';
			const selectedText = params.selectedText || '';
			this.#copilot.setContext(context);
			this.#copilot.setSelectedText(selectedText);
			this.#copilot.show({
				bindElement: coordinates,
				width: this.#element.offsetWidth - 10
			});
			this.#copilot.subscribe('cancel', event => {
				this.#logEventInfo('AI canceled', event);
				this.#cleanWrappedText();
				this.#copilot.adjust({
					hide: false,
					position: this.#getElementCoordinates()
				});
			});
			const handleKeyUpEscape = this.#handleKeyUpEscape.bind(this);
			this.#copilot.subscribe('hide', event => {
				this.#logEventInfo('AI hidden', event);
				main_core.Event.unbind(window, 'keyup', handleKeyUpEscape);
			});
			main_core.Event.bind(window, 'keyup', handleKeyUpEscape);
		}
		#showCopilotButton() {
			const copilotButton = main_core.Tag.render`
			<button class="show-copilot-btn">
				<div class="show-copilot-btn-icon ui-icon-set --copilot-ai"></div>
				${crm_ai_nameService.NameService.copilotName().toUpperCase()}
			</button>
		`;
			main_core.Event.bind(copilotButton, 'click', event => {
				this.#showCopilot({
					context: this.#getTextAreaValue(),
					selectedText: this.#currentSelectedText
				});
				this.#copilotBtnPopup.close();
			});
			const coordinates = this.#getElementCoordinates();
			this.#copilotBtnPopup = new main_popup.Popup({
				id: `copilot_textarea_popup_button_${main_core.Text.getRandom(5)}`,
				content: copilotButton,
				bindElement: {
					top: coordinates.top - COPILOT_BUTTON_HEIGHT / 2,
					left: coordinates.left + (this.#element.offsetWidth / 2 - COPILOT_BUTTON_WIDTH / 2)
				},
				padding: 5,
				borderRadius: '4px'
			});
			main_core.Event.bind(document, 'keyup', event => {
				this.#cleanWrappedText();
				this.#copilotBtnPopup.close();
			});
			main_core.Event.bind(copilotButton, 'click', () => {
				this.#copilotBtnPopup.close();
			});
			setTimeout(() => {
				main_core.Event.bind(window, 'mouseup', event => {
					this.#copilotBtnPopup.close();
				});
			}, 100);
			this.#copilotBtnPopup.show();
		}

		// region Handlers
		#bindHandlers() {
			this.#copilot.subscribe('start-init', event => {
				this.#logEventInfo('AI load start', event);
				this.setReadOnly();
			});
			this.#copilot.subscribe('finish-init', event => {
				this.#logEventInfo('AI loaded', event);
				this.#copilotLoaded = true;
				this.setReadOnly(false);
			});
			this.#copilot.subscribe('aiResult', event => {
				this.#logEventInfo('AI result received', event);
				let newValue = '';
				if (main_core.Type.isStringFilled(this.#currentSelectedText)) {
					const start = this.#element.selectionStart;
					const end = this.#element.selectionEnd;
					const allText = this.#getTextAreaValue();
					newValue = allText.slice(0, Math.max(0, start)) + this.#wrapText(event.data.result) + allText.slice(end, allText.length);
				} else {
					newValue = this.#getTextAreaValue() + this.#wrapText(event.data.result);
				}
				this.#setTextAreaValue(newValue);
				this.#copilot.adjust({
					hide: false,
					position: this.#getElementCoordinates()
				});
			});
			this.#copilot.subscribe('save', event => {
				this.#logEventInfo('AI result saved', event);
				this.#replaceSelectionText(event.data.result);
				this.#cleanWrapChars();
				this.#copilot.hide();
			});
			this.#copilot.subscribe('add_below', event => {
				this.#logEventInfo('AI result text place below', event);
				const currentText = this.#getTextAreaValue();
				this.#setTextAreaValue(`${currentText}\n${event.data.result}`);
				this.#copilot.hide();
			});
		}
		#handleKeyDown(event) {
			const isSpacePressed = event.key === ' ' || event.code === 'Space';
			if (!isSpacePressed || !this.#copilotLoaded || this.#copilot.isShown() || !this.#isCursorAtBeginningOfLine()) {
				return;
			}
			this.#logEventInfo('Space pressed', event);
			this.#showCopilot({
				context: this.#getTextAreaValue(),
				selectedText: ''
			});
			event.preventDefault();
		}
		#handleSelect(event) {
			const target = event.target;
			if (!target) {
				return;
			}
			if (this.#copilotBtnPopup?.isShown()) {
				return;
			}
			this.#currentSelectedText = target.value.slice(target.selectionStart, target.selectionEnd);
			if (main_core.Type.isStringFilled(this.#currentSelectedText)) {
				this.#logEventInfo('Text selected', event);
				setTimeout(() => this.#showCopilotButton(), 100);
			}
		}
		#handleKeyUpEscape(event) {
			if (event.key === 'Escape' && this.#copilot.isShown()) {
				this.#cleanWrapChars();
				this.#copilot.hide();
				this.#element.focus();
			}
		}
		// endregion

		// region Utils
		#assertValidParams(params) {
			if (!main_core.Type.isPlainObject(params)) {
				throw new TypeError('BX.Crm.AI.CopilotTextarea: textarea params must be object');
			}
			if (!main_core.Type.isStringFilled(params.id)) {
				throw new TypeError('BX.Crm.AI.CopilotTextarea: The "id" argument must be filled');
			}
			if (!main_core.Type.isDomNode(params.target)) {
				throw new Error('BX.Crm.AI.CopilotTextarea: The "target" argument must be DOM node');
			}
			if (params.target.tagName.toLowerCase() !== 'textarea') {
				throw new Error('BX.Crm.AI.CopilotTextarea: The "target" argument must be textarea element');
			}
		}
		#isCursorAtBeginningOfLine() {
			const val = this.#getTextAreaValue();
			const element = this.#getElement();
			const currentLineIndex = val.lastIndexOf('\n', element.selectionStart - 1) + 1;
			return !main_core.Type.isStringFilled(val.slice(currentLineIndex, element.selectionStart));
		}
		#getTextAreaValue() {
			return this.#getElement().value;
		}
		#setTextAreaValue(value) {
			if (this.#getElement().value === value) {
				return;
			}
			this.#getElement().value = value;
			main_core.Dom.style(this.#element, 'height', 'auto');
			const currentTextareaHeight = this.#getElement().scrollHeight;
			main_core.Dom.style(this.#element, 'height', `${currentTextareaHeight}px`);
			main_core_events.EventEmitter.emit(this, Events.EVENT_VALUE_CHANGE, {
				id: this.#id,
				value
			});
		}
		#getElementCoordinates(pressToLeft = true) {
			const elementRect = this.#element.getBoundingClientRect();
			if (elementRect.top === 0 && elementRect.right === 0 && elementRect.bottom === 0 && elementRect.left === 0) {
				return null;
			}
			const coordinates = getCaretCoordinates(this.#element, this.#element.selectionEnd);
			return {
				left: pressToLeft ? elementRect.left + window.scrollX + 5 : elementRect.left + window.scrollX + coordinates.left + 2,
				top: elementRect.top + window.scrollY + coordinates.top + 21
			};
		}
		#wrapText(text) {
			return COPILOT_RESULT_TEXT_WRAP_LEFT + text + COPILOT_RESULT_TEXT_WRAP_RIGHT;
		}
		#cleanWrappedText() {
			const re = new RegExp(`${COPILOT_RESULT_TEXT_WRAP_LEFT}(.*)${COPILOT_RESULT_TEXT_WRAP_RIGHT}`, 'gs');
			this.#setTextAreaValue(this.#getTextAreaValue().replaceAll(re, ''));
		}
		#cleanWrapChars() {
			const wrapLeftRe = new RegExp(COPILOT_RESULT_TEXT_WRAP_LEFT, 'gs');
			const wrapRightRe = new RegExp(COPILOT_RESULT_TEXT_WRAP_RIGHT, 'gs');
			this.#setTextAreaValue(this.#getTextAreaValue().replaceAll(wrapLeftRe, '').replaceAll(wrapRightRe, ''));
		}
		#replaceSelectionText(text) {
			if (main_core.Type.isStringFilled(this.#currentSelectedText) && main_core.Type.isStringFilled(text)) {
				this.#setTextAreaValue(this.#getTextAreaValue().replace(this.#currentSelectedText, text));
			}
		}
		#getElement() {
			return BX(this.#element);
		}
		#logEventInfo(name, event) {
			if (this.#isDebugEnabled) {
				// eslint-disable-next-line no-console
				console.debug(name, event);
			}
		}
		// endregion
	}

	exports.CopilotTextarea = CopilotTextarea;
	exports.Events = Events;

})(this.BX.Crm.AI = this.BX.Crm.AI || {}, BX.AI, BX.Crm.AI, BX, BX.Event, BX.Main);
//# sourceMappingURL=copilot-textarea.bundle.js.map
