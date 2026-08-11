/* eslint-disable */
this.BX = this.BX || {};
this.BX.MessageService = this.BX.MessageService || {};
this.BX.MessageService.Template = this.BX.MessageService.Template || {};
(function (exports, main_core, main_core_events, main_popup, ui_notification, ui_progressbar, ui_buttons) {
	'use strict';

	class MenuPopup extends main_core_events.EventEmitter {
		#menu = null;
		#bindElement = null;
		#isTextItemFirst = false;
		#messages = {};
		constructor({
			bindElement,
			isTextItemFirst,
			messages = {},
			events = {}
		}) {
			super();
			this.setEventNamespace('BX.MessageService.Template.Editor.MenuPopup');
			this.#bindElement = bindElement;
			this.#isTextItemFirst = isTextItemFirst;
			this.#messages = messages;
			this.subscribeFromOptions(events);
		}
		show() {
			this.#getMenuPopup().show();
		}
		destroy() {
			this.unsubscribeAll();
			this.#menu?.destroy();
			this.#menu = null;
			main_core.Runtime.destroy(this);
		}
		#getMenuPopup() {
			if (this.#menu === null) {
				this.#menu = main_popup.MenuManager.create({
					id: 'messageservice-template-editor-placeholder-selector',
					bindElement: this.#bindElement,
					autoHide: true,
					offsetLeft: 20,
					angle: true,
					closeByEsc: false,
					cacheable: false,
					items: this.#getItems()
				});
			}
			return this.#menu;
		}
		#getItems() {
			const editorItem = this.#getEditorItem();
			const textItem = this.#getTextItem();
			if (this.#isTextItemFirst) {
				return [textItem, editorItem];
			}
			return [editorItem, textItem];
		}
		#getEditorItem() {
			const title = this.#messages.selectField ?? main_core.Loc.getMessage('MESSAGESERVICE_TEMPLATE_EDITOR_SELECT_FIELD');
			return {
				html: this.#getItemHtml(title),
				onclick: () => {
					this.emit('onEditorItemClick', {
						bindElement: this.#bindElement
					});
				}
			};
		}
		#getTextItem() {
			const code = this.#isTextItemFirst ? 'MESSAGESERVICE_TEMPLATE_EDITOR_UPDATE_TEXT' : 'MESSAGESERVICE_TEMPLATE_EDITOR_CREATE_TEXT';
			return {
				html: this.#getItemHtml(main_core.Loc.getMessage(code)),
				onclick: () => {
					this.#getMenuPopup().close();
					this.emit('onTextItemClick', {
						bindElement: this.#bindElement
					});
				}
			};
		}
		#getItemHtml(title) {
			return `<span class="messageservice-template-editor-placeholder-selector-menu-item">${main_core.Text.encode(title)}</span>`;
		}
	}

	const PREVIEW_POPUP_CONTENT_STATUS = {
		LOADING: 1,
		SUCCESS: 2,
		FAILED: 3
	};
	class PreviewPopup {
		#popup = null;
		#bindElement = null;
		#previewContentContainer = null;
		#previewLoader = null;
		constructor(bindElement) {
			this.#bindElement = bindElement;
		}
		destroy() {
			this.#getPopup()?.destroy();
		}
		isShown() {
			return this.#getPopup()?.isShown() ?? false;
		}
		show() {
			this.#getPopup()?.show();
		}
		apply(status, data = '') {
			const closeIconElement = this.#getPopup().getPopupContainer().querySelector('.popup-window-close-icon');
			switch (status) {
				case PREVIEW_POPUP_CONTENT_STATUS.LOADING:
					{
						main_core.Dom.addClass(closeIconElement, '--hidden');
						this.#previewContentContainer.innerText = '';
						if (!this.#previewLoader) {
							this.#previewLoader = new ui_progressbar.ProgressBar({
								color: ui_progressbar.ProgressBar.Color.PRIMARY,
								size: 10,
								maxValue: 100,
								value: 30,
								infiniteLoading: true
							});
						}
						this.#getPopup().setHeight(75);
						this.#previewLoader.renderTo(this.#previewContentContainer);
						break;
					}
				case PREVIEW_POPUP_CONTENT_STATUS.SUCCESS:
					{
						this.#getPopup().setHeight(null);
						this.#getPopup().setAutoHide(true);
						this.#previewContentContainer.innerText = data;
						main_core.Dom.removeClass(closeIconElement, '--hidden');
						main_core.Dom.addClass(this.#previewContentContainer, '--loaded');
						break;
					}
				case PREVIEW_POPUP_CONTENT_STATUS.FAILED:
					{
						this.#getPopup().destroy();
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Text.encode(data),
							autoHideDelay: 5000
						});
						break;
					}
				default:
					throw new TypeError(`Unsupported preview popup content status ${status}`);
			}
		}
		#getPopup() {
			if (this.#popup === null) {
				this.#popup = main_popup.PopupWindowManager.create({
					id: 'messageservice-template-editor-preview-popup',
					bindElement: this.#bindElement,
					closeIcon: {
						top: '10px'
					},
					cacheable: false,
					closeByEsc: false,
					autoHide: false,
					angle: {
						position: 'top',
						offset: 70
					},
					content: this.#getContent()
				});
			}
			return this.#popup;
		}
		#getContent() {
			this.#previewContentContainer = main_core.Tag.render`<div class="messageservice-template-editor-preview-popup-content"></div>`;
			return main_core.Tag.render`
			<div class="messageservice-template-editor-preview-popup-wrapper">
				<div class="messageservice-template-editor-preview-popup-title">
					${main_core.Loc.getMessage('MESSAGESERVICE_TEMPLATE_EDITOR_PREVIEW_POPUP_TITLE')}
				</div>
				${this.#previewContentContainer}
			</div>
		`;
		}
	}

	class Previewer extends main_core_events.EventEmitter {
		#bindElement = null;
		#isUsePreviewRequestRunning = false;
		#previewPopup = null;
		constructor(params) {
			super();
			this.setEventNamespace('BX.MessageService.Template.Editor.Previewer');
			this.#bindElement = main_core.Type.isDomNode(params.bindElement) ? params.bindElement : null;
			this.subscribeFromOptions(params.events ?? {});
		}
		preview(template, bindElement) {
			const bindElementToUse = main_core.Type.isDomNode(bindElement) ? bindElement : this.#bindElement;
			if (!main_core.Type.isDomNode(bindElementToUse)) {
				throw new Error('Previewer: bindElement must be a valid DOM element');
			}
			if (this.#previewPopup?.isShown()) {
				return;
			}
			if (this.#isUsePreviewRequestRunning) {
				this.#previewPopup?.show();
				return;
			}
			this.#previewPopup?.destroy();
			this.#previewPopup = new PreviewPopup(bindElementToUse);
			this.#previewPopup.apply(PREVIEW_POPUP_CONTENT_STATUS.LOADING);
			this.#previewPopup.show();
			this.#isUsePreviewRequestRunning = true;
			this.emitAsync('onLoadPreview', {
				template
			}).then(eventResults => {
				const successResult = eventResults.find(candidate => {
					return main_core.Type.isPlainObject(candidate) && candidate.status === 'success' && main_core.Type.isStringFilled(candidate.data?.preview);
				});
				if (successResult) {
					this.#previewPopup?.apply(PREVIEW_POPUP_CONTENT_STATUS.SUCCESS, successResult.data.preview);
					return;
				}
				const errorResult = eventResults.find(candidate => {
					return main_core.Type.isPlainObject(candidate) && candidate.status === 'error' && main_core.Type.isArrayFilled(candidate.errors);
				});
				if (errorResult) {
					this.#previewPopup?.apply(PREVIEW_POPUP_CONTENT_STATUS.FAILED, errorResult.errors[0].message);
					return;
				}
				throw new Error('No valid preview result');
			}).catch(error => {
				console.error('Previewer: onLoadPreview event error', error);
				this.#previewPopup?.apply(PREVIEW_POPUP_CONTENT_STATUS.FAILED, 'Unknown error');
			}).finally(() => {
				this.#isUsePreviewRequestRunning = false;
			});
		}
		isShown() {
			return this.#previewPopup?.isShown() ?? false;
		}
		close() {
			this.#isUsePreviewRequestRunning = false;
			this.#previewPopup?.destroy();
			this.#previewPopup = null;
		}
		destroy() {
			this.unsubscribeAll();
			this.#previewPopup?.destroy();
			this.#previewPopup = null;
			main_core.Runtime.destroy(this);
		}
	}

	function renderLayout(options = {}) {
		const {
			id,
			isReadOnly,
			canUsePreview
		} = options;
		const {
			root,
			header,
			body,
			footer
		} = main_core.Tag.render`
		<div id="${id}" class="messageservice-template-editor messageservice-template-editor-scope">
			<div ref="header" class="messageservice-template-editor-header"></div>
			<div ref="body" class="messageservice-template-editor-body"></div>
			<div ref="footer" class="messageservice-template-editor-footer"></div>
		</div>
	`;
		if (isReadOnly) {
			main_core.Dom.addClass(root, '--read-only');
		}
		let preview = null;
		if (canUsePreview) {
			preview = main_core.Tag.render`
			<div class="messageservice-template-editor-preview-link" href="#" >
				${main_core.Loc.getMessage('MESSAGESERVICE_TEMPLATE_EDITOR_PREVIEW_LINK_TITLE')}
			</div>
		`;
			main_core.Dom.append(preview, root);
		}
		return {
			root,
			header,
			body,
			footer,
			preview
		};
	}

	class TextPopup extends main_core_events.EventEmitter {
		#popup = null;
		#input = null;
		#bindElement = null;
		#value = null;
		constructor({
			bindElement,
			value,
			events = {}
		}) {
			super();
			this.setEventNamespace('BX.MessageService.Template.Editor.TextPopup');
			this.#bindElement = bindElement;
			this.#value = value;
			this.subscribeFromOptions(events);
		}
		destroy() {
			this.unsubscribeAll();
			this.#popup?.destroy();
		}
		show() {
			this.#getPopup().show();
		}
		#getPopup() {
			if (this.#popup === null) {
				this.#popup = main_popup.PopupWindowManager.create('messageservice-template-editor-text-popup', this.#bindElement, {
					autoHide: true,
					content: this.#getContent(),
					closeByEsc: true,
					closeIcon: false,
					buttons: this.#getMenuButtons(),
					cacheable: false,
					events: {
						onShow: () => {
							this.emit('onShow');

							// Give time for input to render before setting focus.
							setTimeout(() => {
								this.#input.focus();
								this.#setCursorToEnd();
							}, 0);
						},
						onClose: this.emit.bind(this, 'onHide')
					}
				});
			}
			return this.#popup;
		}
		#getContent() {
			const {
				root,
				input
			} = main_core.Tag.render`
			<div class="messageservice-template-editor-text-popup-wrapper">
				<input 
					ref="input"
					type="text" 
					value="${main_core.Text.encode(this.#value)}"
					maxlength="255"
					placeholder="${main_core.Loc.getMessage('MESSAGESERVICE_TEMPLATE_EDITOR_SELECT_FIELD_PLACEHOLDER')}
				">
			</div>
		`;
			this.#input = input;
			this.#bindInputEvents();
			return root;
		}
		#bindInputEvents() {
			main_core.Event.bind(this.#input, 'keyup', event => {
				const button = this.#getApplyButtonInstance();
				if (!button) {
					return;
				}
				const {
					value
				} = event.target;
				this.#adjustButtonState(button, value);
			});
		}
		#getMenuButtons() {
			return [this.#getApplyButton(), this.#getCancelButton()];
		}
		#getApplyButton() {
			const button = new ui_buttons.Button({
				id: 'apply-button',
				text: this.#getApplyButtonText(),
				className: 'ui-btn ui-btn-xs ui-btn-primary ui-btn-round',
				onclick: () => {
					this.#onApplyButtonClick();
				}
			});
			const {
				value
			} = this.#input;
			this.#adjustButtonState(button, value);
			return button;
		}
		#adjustButtonState(button, value) {
			button.setState(main_core.Type.isStringFilled(value) && main_core.Type.isStringFilled(value.trim()) ? ui_buttons.ButtonState.ACTIVE : ui_buttons.ButtonState.DISABLED);
		}
		#getApplyButtonText() {
			if (main_core.Type.isStringFilled(this.#value)) {
				return main_core.Loc.getMessage('MESSAGESERVICE_TEMPLATE_EDITOR_TEXT_POPUP_UPDATE');
			}
			return main_core.Loc.getMessage('MESSAGESERVICE_TEMPLATE_EDITOR_TEXT_POPUP_ADD');
		}
		#onApplyButtonClick() {
			const button = this.#getApplyButtonInstance();
			if (button.getState() !== ui_buttons.ButtonState.ACTIVE) {
				return;
			}
			const {
				value
			} = this.#input;
			this.emit('onApply', {
				value: value.trim()
			});
			this.destroy();
		}
		#getApplyButtonInstance() {
			return this.#popup.getButton('apply-button');
		}
		#getCancelButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('MESSAGESERVICE_TEMPLATE_EDITOR_TEXT_POPUP_CANCEL'),
				className: 'ui-btn ui-btn-xs ui-btn-light ui-btn-round',
				onclick: () => {
					this.destroy();
				}
			});
		}
		#setCursorToEnd() {
			const {
				length
			} = this.#input.value;
			this.#input.selectionStart = length;
			this.#input.selectionEnd = length;
		}
	}

	function getPlainText(templateBody, placeholders, filledPlaceholders) {
		let result = templateBody;
		if (main_core.Type.isArrayFilled(filledPlaceholders)) {
			filledPlaceholders.forEach(filledPlaceholder => {
				if (main_core.Type.isStringFilled(filledPlaceholder.FIELD_NAME)) {
					result = result.replace(filledPlaceholder.PLACEHOLDER_ID, `{${filledPlaceholder.FIELD_NAME}}`);
				} else if (main_core.Type.isStringFilled(filledPlaceholder.FIELD_VALUE)) {
					const fieldValue = filledPlaceholder.FIELD_VALUE.replaceAll('{', '&#123;').replaceAll('}', '&#125;');
					result = result.replace(filledPlaceholder.PLACEHOLDER_ID, fieldValue);
				}
			});
		}
		if (main_core.Type.isArrayFilled(placeholders)) {
			placeholders.forEach(placeholder => {
				result = result.replace(placeholder, ' ');
			});
		}
		return result;
	}

	const HEADER_POSITION = 'HEADER';
	const PREVIEW_POSITION = 'PREVIEW';
	const FOOTER_POSITION = 'FOOTER';
	class Editor extends main_core_events.EventEmitter {
		#id;
		#target = null;
		#canUseFieldsDialog = true;
		#canUseFieldValueInput = true;
		#isReadOnly = false;
		#canUsePreview = false;
		#entityType;
		#messages = {};
		#placeholders = [];
		#filledPlaceholders = [];
		#headerContainerEl = null;
		#bodyContainerEl = null;
		#footerContainerEl = null;
		#headerRaw = null;
		#bodyRaw = null;
		#footerRaw = null;
		#popupMenu = null;
		#inputPopup = null;
		#previewer = null;
		constructor(params) {
			super();
			this.setEventNamespace('BX.MessageService.Template.Editor');
			this.#id = params.id || `messageservice-template-editor-${main_core.Text.getRandom()}`;
			this.#target = params.target;
			this.#entityType = params.entityType;
			this.#messages = params.messages ?? {};
			this.#canUseFieldsDialog = Boolean(params.canUseFieldsDialog ?? true);
			this.#canUseFieldValueInput = Boolean(params.canUseFieldValueInput ?? true);
			this.#isReadOnly = Boolean(params.isReadOnly ?? false);
			this.#canUsePreview = Boolean(params.canUsePreview ?? false);
			this.subscribeFromOptions(params.events ?? {});
			this.#createContainer();
		}
		setPlaceholders(placeholders) {
			this.#placeholders = placeholders;
			return this;
		}
		setFilledPlaceholders(filledPlaceholders) {
			this.#filledPlaceholders = filledPlaceholders;
			return this;
		}
		setHeader(input) {
			if (!main_core.Type.isStringFilled(input)) {
				return;
			}
			this.#headerRaw = input;
			main_core.Dom.clean(this.#headerContainerEl);
			main_core.Dom.append(this.#createContainerWithSelectors(input), this.#headerContainerEl);
		}
		setBody(input) {
			if (!main_core.Type.isStringFilled(input)) {
				return;
			}
			this.#bodyRaw = input;
			main_core.Dom.clean(this.#bodyContainerEl);
			main_core.Dom.append(this.#createContainerWithSelectors(input), this.#bodyContainerEl);
		}
		setFooter(input) {
			if (!main_core.Type.isStringFilled(input)) {
				return;
			}
			this.#footerRaw = input;
			main_core.Dom.clean(this.#footerContainerEl);
			main_core.Dom.append(this.#createContainerWithSelectors(input), this.#footerContainerEl);
		}
		getData() {
			if (this.#placeholders === null) {
				return null;
			}
			return {
				header: getPlainText(this.#headerRaw || '', this.#getPlaceholders(HEADER_POSITION), this.#filledPlaceholders),
				body: getPlainText(this.#bodyRaw || '', this.#getPlaceholders(PREVIEW_POSITION), this.#filledPlaceholders),
				footer: getPlainText(this.#footerRaw || '', this.#getPlaceholders(FOOTER_POSITION), this.#filledPlaceholders)
			};
		}
		getRawData() {
			return {
				header: this.#headerRaw,
				body: this.#bodyRaw,
				footer: this.#footerRaw
			};
		}
		destroy() {
			this.#previewer?.destroy();
			this.#previewer = null;
			this.#inputPopup?.destroy();
			this.#inputPopup = null;
			this.#popupMenu?.destroy();
			this.#popupMenu = null;
			this.unsubscribeAll();
			main_core.Runtime.destroy(this);
		}
		#createContainer() {
			if (!this.#target) {
				return;
			}
			const {
				root,
				header,
				body,
				footer,
				preview
			} = renderLayout({
				id: this.#id,
				isReadOnly: this.#isReadOnly,
				canUsePreview: this.#canUsePreview
			});
			this.#headerContainerEl = header;
			this.#bodyContainerEl = body;
			this.#footerContainerEl = footer;
			if (this.#canUsePreview && preview) {
				main_core.Event.bind(preview, 'click', this.#onPreviewTemplate.bind(this));
			}
			main_core.Dom.clean(this.#target);
			main_core.Dom.append(root, this.#target);
		}
		#createContainerWithSelectors(input, position = PREVIEW_POSITION) {
			const placeholders = this.#getPlaceholders(position);
			if (placeholders === null) {
				return null;
			}
			const container = this.#getInputContainer(input, position);
			placeholders.forEach((placeholder, key) => {
				const element = [...container.childNodes].find(node => node.dataset && Number(node.dataset.templatePlaceholder) === key);
				if (!element) {
					return;
				}
				if (this.#isReadOnly) {
					return;
				}
				main_core.Event.bind(element, 'click', event => {
					this.#onPlaceholderClick(event);
				});
			});
			return container;
		}
		#onPlaceholderClick(event) {
			this.#inputPopup?.destroy();
			const placeholderId = this.#getPlaceholderId(event.target);
			const filledPlaceholder = this.#getFilledPlaceholderByElement(event.target, PREVIEW_POSITION);
			const isTextItemFirst = main_core.Type.isStringFilled(filledPlaceholder?.FIELD_VALUE);
			const onShow = this.#animatePillOnDialogShow.bind(this, event.target);
			const onHide = this.#animatePillOnDialogHide.bind(this, event.target);
			const showDialogCallback = () => {
				this.emit('onShowFieldsDialog', {
					placeholderId,
					filledPlaceholder,
					onShow,
					onHide,
					bindElement: event.target
				});
			};
			if (this.#canUseFieldsDialog && this.#canUseFieldValueInput) {
				this.#popupMenu = new MenuPopup({
					bindElement: event.target,
					isTextItemFirst,
					messages: this.#messages,
					events: {
						onEditorItemClick: showDialogCallback,
						onTextItemClick: clickEvent => {
							this.#onShowInputPopup(clickEvent.getData().bindElement, onShow, onHide);
						}
					}
				});
				this.#popupMenu.show();
			} else if (this.#canUseFieldsDialog) {
				showDialogCallback();
			} else if (this.#canUseFieldValueInput) {
				this.#onShowInputPopup(event.target, onShow, onHide);
			}
		}
		#animatePillOnDialogShow(element) {
			const keyframes = [{
				transform: 'rotate(0)'
			}, {
				transform: 'rotate(90deg)'
			}, {
				transform: 'rotate(180deg)'
			}];
			const options = {
				duration: 200,
				pseudoElement: '::after'
			};
			element.animate(keyframes, options);
			main_core.Dom.addClass(element, '--flipped');
		}
		#animatePillOnDialogHide(element) {
			const keyframes = [{
				transform: 'rotate(180deg)'
			}, {
				transform: 'rotate(90deg)'
			}, {
				transform: 'rotate(0)'
			}];
			const options = {
				duration: 200,
				pseudoElement: '::after'
			};
			element.animate(keyframes, options);
			main_core.Dom.removeClass(element, '--flipped');
		}
		#onShowInputPopup(bindElement, onShow, onHide) {
			const filledPlaceholder = this.#getFilledPlaceholderByElement(bindElement);
			const value = main_core.Type.isStringFilled(filledPlaceholder?.FIELD_VALUE) ? filledPlaceholder.FIELD_VALUE : '';
			this.#inputPopup = new TextPopup({
				bindElement,
				value,
				events: {
					onShow,
					onHide,
					onApply: event => {
						this.#onApplyInputPopup(event.getData().value, bindElement);
					}
				}
			});
			this.#inputPopup.show();
		}
		#onApplyInputPopup(value, bindElement) {
			const placeholderId = this.#getPlaceholderIdByElement(bindElement, PREVIEW_POSITION);
			const filledPlaceholder = {
				PLACEHOLDER_ID: placeholderId,
				TITLE: value,
				FIELD_VALUE: value,
				FIELD_ENTITY_TYPE: this.#entityType
			};
			this.updatePlaceholder(filledPlaceholder);
		}
		#onPreviewTemplate(event) {
			this.#previewer ??= new Previewer({
				events: {
					onLoadPreview: async loadEvent => {
						const eventResults = await this.emitAsync('onLoadPreview', loadEvent.getData());
						return eventResults.shift();
					}
				}
			});
			this.#previewer.preview(this.getData().body, event.target);
		}
		#getInputContainer(input, position) {
			const placeholders = this.#getPlaceholders(position);
			if (placeholders === null) {
				return null;
			}
			let safeInput = main_core.Text.encode(input);
			let i = 0;
			placeholders.forEach(placeholder => {
				const filledPlaceholder = this.#getFilledPlaceholderById(placeholder);
				let title = main_core.Loc.getMessage('MESSAGESERVICE_TEMPLATE_EDITOR_EMPTY_PLACEHOLDER_LABEL');
				let spanClass = 'messageservice-template-editor-element-pill';
				if (filledPlaceholder) {
					title = main_core.Text.encode(this.#getFilledPlaceholderTitle(filledPlaceholder));
					spanClass += ' --selected';
				}
				const replaceValue = `<span class="${spanClass}" data-test-role="placeholder" data-template-placeholder="${i++}">${title}</span>`;

				// eslint-disable-next-line no-param-reassign
				safeInput = safeInput.replace(placeholder, replaceValue);
			});
			return main_core.Tag.render`<div>${safeInput}</div>`;
		}
		#getFilledPlaceholderTitle(filledPlaceholder) {
			if (main_core.Type.isStringFilled(filledPlaceholder.PARENT_TITLE) && main_core.Type.isStringFilled(filledPlaceholder.TITLE)) {
				return `${filledPlaceholder.PARENT_TITLE}: ${filledPlaceholder.TITLE}`;
			}
			if (main_core.Type.isStringFilled(filledPlaceholder.TITLE)) {
				return filledPlaceholder.TITLE;
			}
			if (main_core.Type.isStringFilled(filledPlaceholder.FIELD_NAME)) {
				return filledPlaceholder.FIELD_NAME;
			}
			return filledPlaceholder.FIELD_VALUE;
		}
		#getPlaceholders(position) {
			const allPlaceholders = main_core.Type.isPlainObject(this.#placeholders) ? this.#placeholders : {};
			const placeholders = main_core.Type.isArrayFilled(allPlaceholders[position]) ? allPlaceholders[position] : [];
			return main_core.Type.isArrayLike(placeholders) ? placeholders : null;
		}
		#getFilledPlaceholderById(id) {
			return this.#filledPlaceholders.find(placeholder => placeholder.PLACEHOLDER_ID === id);
		}
		#getFilledPlaceholderByElement(element, position = PREVIEW_POSITION) {
			const placeholderId = this.#getPlaceholderIdByElement(element, position);
			return this.#getFilledPlaceholderById(placeholderId);
		}
		#getPlaceholderIdByElement(element, position = PREVIEW_POSITION) {
			const placeholders = this.#getPlaceholders(position);
			return placeholders[element.dataset.templatePlaceholder] ?? null;
		}
		#getPlaceholderIndexById(id, position = PREVIEW_POSITION) {
			const placeholders = this.#getPlaceholders(position);
			return placeholders.indexOf(id);
		}
		updatePlaceholder(filledPlaceholder) {
			const index = this.#getPlaceholderIndexById(filledPlaceholder.PLACEHOLDER_ID);
			if (index < 0) {
				return;
			}
			const element = this.#target.querySelector(`[data-template-placeholder="${index}"]`);
			main_core.Dom.adjust(element, {
				text: main_core.Text.encode(this.#getFilledPlaceholderTitle(filledPlaceholder)),
				props: {
					className: 'messageservice-template-editor-element-pill --selected'
				}
			});
			this.#adjustFilledPlaceholders(filledPlaceholder);
			this.emit('onUpdatePlaceholder', {
				filledPlaceholder
			});
		}
		#getPlaceholderId(element) {
			return this.#getPlaceholderIdByElement(element, PREVIEW_POSITION);
		}
		#adjustFilledPlaceholders(filledPlaceholder) {
			const existingFilledPlaceholder = this.#getFilledPlaceholderById(filledPlaceholder.PLACEHOLDER_ID);
			if (existingFilledPlaceholder) {
				existingFilledPlaceholder.FIELD_NAME = filledPlaceholder.FIELD_NAME ?? null;
				existingFilledPlaceholder.TITLE = filledPlaceholder.TITLE;
				existingFilledPlaceholder.PARENT_TITLE = filledPlaceholder.PARENT_TITLE;
				existingFilledPlaceholder.FIELD_ENTITY_TYPE = filledPlaceholder.FIELD_ENTITY_TYPE;
				existingFilledPlaceholder.FIELD_VALUE = filledPlaceholder.FIELD_VALUE ?? null;
			} else {
				this.#filledPlaceholders.push(main_core.Runtime.clone(filledPlaceholder));
			}
		}
	}

	exports.Editor = Editor;
	exports.Previewer = Previewer;
	exports.getPlainText = getPlainText;

})(this.BX.MessageService.Template.Editor = this.BX.MessageService.Template.Editor || {}, BX, BX.Event, BX.Main, BX.UI.Notification, BX.UI, BX.UI);
//# sourceMappingURL=editor.bundle.js.map
