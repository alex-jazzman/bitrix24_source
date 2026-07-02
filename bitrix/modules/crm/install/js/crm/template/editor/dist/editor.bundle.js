/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_entitySelector, main_core, main_core_events, main_popup, ui_designTokens, ui_entitySelector, ui_notification, ui_progressbar, crm_common, ui_buttons) {
	'use strict';

	class MenuPopup {
		#menu = null;
		#bindElement = null;
		#isTextItemFirst = false;
		#onEditorItemClick = () => {};
		#onTextItemClick = () => {};
		constructor({
			bindElement,
			isTextItemFirst,
			onEditorItemClick,
			onTextItemClick
		}) {
			this.#bindElement = bindElement;
			this.#isTextItemFirst = isTextItemFirst;
			this.#onEditorItemClick = onEditorItemClick;
			this.#onTextItemClick = onTextItemClick;
		}
		show() {
			this.#getMenuPopup().show();
		}
		destroy() {
			this.#menu?.destroy();
			this.#menu = null;
			main_core.Runtime.destroy(this);
		}
		#getMenuPopup() {
			if (this.#menu === null) {
				this.#menu = main_popup.MenuManager.create({
					id: 'crm-template-editor-placeholder-selector',
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
			return {
				html: this.#getItemTitle('CRM_TEMPLATE_EDITOR_SELECT_FIELD'),
				onclick: () => {
					this.#onEditorItemClick(this.#bindElement);
				}
			};
		}
		#getTextItem() {
			const code = this.#isTextItemFirst ? 'CRM_TEMPLATE_EDITOR_UPDATE_TEXT' : 'CRM_TEMPLATE_EDITOR_CREATE_TEXT';
			return {
				html: this.#getItemTitle(code),
				onclick: () => {
					this.#getMenuPopup().close();
					this.#onTextItemClick(this.#bindElement);
				}
			};
		}
		#getItemTitle(code) {
			const placeholder = '<span class="crm-template-editor-placeholder-selector-menu-item">#ITEM_TEXT#</span>';
			return placeholder.replace('#ITEM_TEXT#', main_core.Text.encode(main_core.Loc.getMessage(code)));
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
		#entityTypeId = null;
		#entityId = null;
		constructor(bindElement, entityTypeId, entityId) {
			this.#bindElement = bindElement;
			this.#entityTypeId = entityTypeId;
			this.#entityId = entityId;
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
					id: `crm-template-editor-preview-popup-${this.#entityTypeId}-${this.#entityId}`,
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
			this.#previewContentContainer = main_core.Tag.render`<div class="crm-template-editor-preview-popup-content"></div>`;
			return main_core.Tag.render`
			<div class="crm-template-editor-preview-popup-wrapper">
				<div class="crm-template-editor-preview-popup-title">
					${main_core.Loc.getMessage('CRM_TEMPLATE_EDITOR_PREVIEW_POPUP_TITLE')}
				</div>
				${this.#previewContentContainer}
			</div>
		`;
		}
	}

	class Previewer {
		#entityTypeId = null;
		#entityId = null;
		#categoryId = null;
		#bindElement = null;
		#isDisplayFormat = false;
		#isUsePreviewRequestRunning = false;
		#previewCache = new Map();
		#previewPopup = null;
		#unsubscribe = null;
		constructor(params) {
			this.#entityTypeId = main_core.Text.toInteger(params.entityTypeId);
			if (!BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				throw new Error('Previewer: entityTypeId must be a valid entity type ID');
			}
			this.#entityId = main_core.Text.toInteger(params.entityId);
			if (params.entityId <= 0) {
				throw new Error('Previewer: entityId must be greater than 0');
			}
			this.#categoryId = main_core.Type.isNil(params.categoryId) ? null : main_core.Text.toInteger(params.categoryId);
			if (!main_core.Type.isNil(this.#categoryId) && this.#categoryId < 0) {
				throw new Error('Previewer: categoryId must be a non-negative integer');
			}
			this.#bindElement = main_core.Type.isDomNode(params.bindElement) ? params.bindElement : null;
			this.#isDisplayFormat = main_core.Type.isBoolean(params.isDisplayFormat) ? params.isDisplayFormat : this.#isDisplayFormat;
			this.#unsubscribe = BX.Crm.EntityEvent.subscribeToItem(this.#entityTypeId, this.#entityId, () => {
				this.#previewCache.clear();
			});
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
			const cachedPreview = this.#previewCache.get(template);
			if (cachedPreview) {
				this.#previewPopup = new PreviewPopup(bindElementToUse, this.#entityTypeId, this.#entityId);
				this.#previewPopup.apply(PREVIEW_POPUP_CONTENT_STATUS.SUCCESS, cachedPreview);
				this.#previewPopup.show();
				return;
			}
			this.#previewPopup = new PreviewPopup(bindElementToUse, this.#entityTypeId, this.#entityId);
			this.#previewPopup.apply(PREVIEW_POPUP_CONTENT_STATUS.LOADING);
			this.#previewPopup.show();
			this.#isUsePreviewRequestRunning = true;
			main_core.ajax.runAction('crm.activity.smsplaceholder.preview', {
				data: {
					entityTypeId: this.#entityTypeId,
					entityId: this.#entityId,
					message: template,
					entityCategoryId: this.#categoryId,
					isDisplayFormat: this.#isDisplayFormat
				}
			}).then(response => {
				this.#previewPopup?.apply(PREVIEW_POPUP_CONTENT_STATUS.SUCCESS, response.data.preview);
				this.#isUsePreviewRequestRunning = false;
				this.#previewCache.set(template, response.data.preview);
			}).catch(response => {
				this.#previewPopup?.apply(PREVIEW_POPUP_CONTENT_STATUS.FAILED, response.errors[0].message ?? 'Unknown error');
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
			this.#previewPopup?.destroy();
			this.#previewPopup = null;
			this.#unsubscribe?.();
			this.#previewCache = null;
			main_core.Runtime.destroy(this);
		}
	}

	class TextPopup {
		#popup = null;
		#input = null;
		#bindElement = null;
		#value = null;
		#onApply = () => {};
		constructor({
			bindElement,
			value,
			onApply
		}) {
			this.#bindElement = bindElement;
			this.#value = value;
			this.#onApply = onApply;
		}
		destroy() {
			this.#popup?.destroy();
		}
		show() {
			this.#getPopup().show();
		}
		#getPopup() {
			if (this.#popup === null) {
				this.#popup = main_popup.PopupWindowManager.create('crm-template-editor-text-popup', this.#bindElement, {
					autoHide: true,
					content: this.#getContent(),
					closeByEsc: true,
					closeIcon: false,
					buttons: this.#getMenuButtons(),
					cacheable: false
				});
				this.#popup.subscribe('onShow', () => {
					// Give time for input to render before setting focus.
					setTimeout(() => {
						this.#input.focus();
						this.#setCursorToEnd();
					}, 0);
				});
			}
			return this.#popup;
		}
		#getContent() {
			const content = main_core.Tag.render`<div class="crm-template-editor-text-popup-wrapper"></div>`;
			this.#input = main_core.Tag.render`
			<input 
				type="text" 
				value="${main_core.Text.encode(this.#value)}"
				maxlength="255"
				placeholder="${main_core.Loc.getMessage('CRM_TEMPLATE_EDITOR_SELECT_FIELD_PLACEHOLDER')}
			">
		`;
			main_core.Dom.append(this.#input, content);
			this.#bindInputEvents();
			return content;
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
				return main_core.Loc.getMessage('CRM_TEMPLATE_EDITOR_TEXT_POPUP_UPDATE');
			}
			return main_core.Loc.getMessage('CRM_TEMPLATE_EDITOR_TEXT_POPUP_ADD');
		}
		#onApplyButtonClick() {
			const button = this.#getApplyButtonInstance();
			if (button.getState() !== ui_buttons.ButtonState.ACTIVE) {
				return;
			}
			this.destroy();
			const {
				value
			} = this.#input;
			this.#bindElement.textContent = main_core.Text.encode(value);
			this.#onApply(value.trim());
		}
		#getApplyButtonInstance() {
			return this.#popup.getButton('apply-button');
		}
		#getCancelButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_TEMPLATE_EDITOR_TEXT_POPUP_CANCEL'),
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

	const UPDATE_ACTION = 'update';
	const DELETE_ACTION = 'delete';
	const HEADER_POSITION = 'HEADER';
	const PREVIEW_POSITION = 'PREVIEW';
	const FOOTER_POSITION = 'FOOTER';
	class Editor {
		#id;
		#target = null;
		#entityTypeId = null;
		#entityId = null;
		#categoryId = null;
		#canUseFieldsDialog = true;
		#canUseFieldValueInput = true;
		#isReadOnly = false;
		#previewer = null;
		placeholders = [];
		filledPlaceholders = [];
		onSelect = () => {};

		// @todo replace this variables with a generic container
		#headerContainerEl = null;
		#bodyContainerEl = null;
		#footerContainerEl = null;
		#placeHoldersDialogDefaultOptions = null;
		#headerRaw = null;
		#bodyRaw = null;
		#footerRaw = null;
		#popupMenu = null;
		#inputPopup = null;
		#dialogsCache = new WeakMap();
		constructor(params) {
			this.#assertValidParams(params);
			this.#id = params.id || `crm-template-editor-${main_core.Text.getRandom()}`;
			this.#target = params.target;
			this.#entityTypeId = params.entityTypeId;
			this.#entityId = params.entityId;
			this.#categoryId = main_core.Type.isNumber(params.categoryId) ? params.categoryId : null;
			this.onSelect = params.onSelect;
			this.#canUseFieldsDialog = Boolean(params.canUseFieldsDialog ?? true);
			this.#canUseFieldValueInput = Boolean(params.canUseFieldValueInput ?? true);
			this.#isReadOnly = Boolean(params.isReadOnly ?? false);
			const canUsePreview = Boolean(params.canUsePreview ?? false);
			if (canUsePreview && this.#entityId > 0) {
				this.#previewer = new Previewer({
					entityTypeId: this.#entityTypeId,
					entityId: this.#entityId,
					categoryId: this.#categoryId
				});
			}
			this.onPlaceholderClick = this.onPlaceholderClick.bind(this);
			this.onShowInputPopup = this.onShowInputPopup.bind(this);
			this.#placeHoldersDialogDefaultOptions = {
				multiple: false,
				showAvatars: false,
				dropdownMode: true,
				compactView: true,
				enableSearch: true,
				tagSelectorOptions: {
					textBoxWidth: '100%'
				}
			};
			if (!this.#isReadOnly && this.#canUsePlaceholderProvider(params.usePlaceholderProvider)) {
				this.#placeHoldersDialogDefaultOptions.entities = [{
					id: 'placeholder',
					options: {
						entityTypeId: this.#entityTypeId,
						entityId: this.#entityId,
						categoryId: this.#categoryId ?? null
					}
				}];
			}
			if (main_core.Type.isPlainObject(params.dialogOptions)) {
				this.#placeHoldersDialogDefaultOptions = {
					...this.#placeHoldersDialogDefaultOptions,
					...params.dialogOptions
				};
			}
			this.#createContainer();
		}
		setPlaceholders(placeholders) {
			this.placeholders = placeholders;
			return this;
		}
		setFilledPlaceholders(filledPlaceholders) {
			this.filledPlaceholders = filledPlaceholders;
			return this;
		}

		// region Public methods
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
			if (this.placeholders === null) {
				return null;
			}
			return {
				header: this.#getPlainText(HEADER_POSITION),
				body: this.#getPlainText(PREVIEW_POSITION),
				footer: this.#getPlainText(FOOTER_POSITION)
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
			main_core.Runtime.destroy(this);
		}
		// endregion

		#createContainer() {
			if (!this.#target) {
				return;
			}
			const containerEl = main_core.Tag.render`
			<div id="${this.#id}" class="crm-template-editor crm-template-editor__scope"></div>
		`;
			if (this.#isReadOnly) {
				main_core.Dom.addClass(containerEl, '--read-only');
			}
			this.#headerContainerEl = main_core.Tag.render`<div class="crm-template-editor-header"></div>`;
			main_core.Dom.append(this.#headerContainerEl, containerEl);
			this.#bodyContainerEl = main_core.Tag.render`<div class="crm-template-editor-body"></div>`;
			main_core.Dom.append(this.#bodyContainerEl, containerEl);
			this.#footerContainerEl = main_core.Tag.render`<div class="crm-template-editor-footer"></div>`;
			main_core.Dom.append(this.#footerContainerEl, containerEl);
			if (this.#previewer) {
				const previewLink = main_core.Tag.render`
				<div class="crm-template-editor-preview-link" href="#">
					${main_core.Loc.getMessage('CRM_TEMPLATE_EDITOR_PREVIEW_LINK_TITLE')}
				</div>
			`;
				main_core.Event.bind(previewLink, 'click', this.#onPreviewTemplate.bind(this));
				main_core.Dom.append(previewLink, containerEl);
			}
			main_core.Dom.clean(this.#target);
			main_core.Dom.append(containerEl, this.#target);
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
				const dialogOptions = main_core.Runtime.clone(this.#placeHoldersDialogDefaultOptions);
				this.#prepareDlgOptions(dialogOptions, element, position);
				main_core.Event.bind(element, 'click', event => {
					this.onPlaceholderClick({
						dialogOptions,
						event
					});
				});
			});
			return container;
		}
		onPlaceholderClick({
			dialogOptions,
			event
		}) {
			this.#inputPopup?.destroy();
			const filledPlaceholder = this.#getFilledPlaceholderByElement(event.target, PREVIEW_POSITION);
			const isTextItemFirst = main_core.Type.isStringFilled(filledPlaceholder?.FIELD_VALUE);
			if (this.#canUseFieldsDialog && this.#canUseFieldValueInput) {
				this.#popupMenu = new MenuPopup({
					bindElement: event.target,
					isTextItemFirst,
					onEditorItemClick: () => {
						this.onShowDialogPopup(filledPlaceholder, dialogOptions);
					},
					onTextItemClick: element => {
						this.onShowInputPopup(element);
					}
				});
				this.#popupMenu.show();
			} else if (this.#canUseFieldsDialog) {
				this.onShowDialogPopup(filledPlaceholder, dialogOptions);
			} else if (this.#canUseFieldValueInput) {
				this.onShowInputPopup(event.target);
			}
		}
		onShowDialogPopup(filledPlaceholder, dialogOptions) {
			const dialog = this.#getDialog(dialogOptions);
			if (main_core.Type.isStringFilled(filledPlaceholder?.FIELD_VALUE)) {
				dialog.getPreselectedItems().forEach(preselectedItem => {
					const item = dialog.getItem(preselectedItem);
					if (item) {
						item.deselect();
					}
				});
			}
			dialog.show();
		}

		/**
		 * Dialog with preselected items makes backend request on construction.
		 * Create dialog only when user clicks, and then cache it.
		 */
		#getDialog(dialogOptions) {
			if (this.#dialogsCache.has(dialogOptions)) {
				return this.#dialogsCache.get(dialogOptions);
			}
			const dialog = new crm_entitySelector.Dialog(dialogOptions);
			this.#dialogsCache.set(dialogOptions, dialog);
			return dialog;
		}
		onShowInputPopup(bindElement) {
			const filledPlaceholder = this.#getFilledPlaceholderByElement(bindElement);
			const value = main_core.Type.isStringFilled(filledPlaceholder?.FIELD_VALUE) ? filledPlaceholder.FIELD_VALUE : '';
			this.#inputPopup = new TextPopup({
				bindElement,
				value,
				onApply: newValue => {
					this.#onApplyInputPopup(newValue, bindElement);
				}
			});
			this.#inputPopup.show();
		}
		#onApplyInputPopup(value, bindElement) {
			const placeholderId = this.#getPlaceholderIdByElement(bindElement, PREVIEW_POSITION);
			const params = {
				id: placeholderId,
				parentTitle: null,
				text: value,
				title: value,
				entityType: BX.CrmEntityType.resolveName(this.#entityTypeId).toLowerCase()
			};

			// eslint-disable-next-line no-param-reassign
			bindElement.textContent = value;
			main_core.Dom.addClass(bindElement, '--selected');
			this.#adjustFilledPlaceholders(params);
			this.onSelect(params);
		}
		#onPreviewTemplate(event) {
			const currentTemplate = this.placeholders === null ? this.getRawData().body : this.getData().body; // TODO: implement header and footer processing

			this.#previewer.preview(currentTemplate, event.target);
			main_core_events.EventEmitter.emit('BX.Crm.Template.Editor:shown');
		}
		#getInputContainer(input, position) {
			const placeholders = this.#getPlaceholders(position);
			if (placeholders === null) {
				return null;
			}
			let i = 0;
			placeholders.forEach(placeholder => {
				const filledPlaceholder = this.#getFilledPlaceholderById(placeholder);
				let title = main_core.Loc.getMessage('CRM_TEMPLATE_EDITOR_EMPTY_PLACEHOLDER_LABEL');
				let spanClass = 'crm-template-editor-element-pill';
				if (filledPlaceholder) {
					if (main_core.Type.isStringFilled(filledPlaceholder.PARENT_TITLE) && main_core.Type.isStringFilled(filledPlaceholder.TITLE)) {
						title = `${filledPlaceholder.PARENT_TITLE}: ${filledPlaceholder.TITLE}`;
					} else if (main_core.Type.isStringFilled(filledPlaceholder.TITLE)) {
						title = filledPlaceholder.TITLE;
					} else if (main_core.Type.isStringFilled(filledPlaceholder.FIELD_NAME)) {
						title = filledPlaceholder.FIELD_NAME;
					} else {
						title = filledPlaceholder.FIELD_VALUE;
					}
					title = main_core.Text.encode(title);
					spanClass += ' --selected';
				}
				const replaceValue = `<span class="${spanClass}" data-test-role="placeholder" data-template-placeholder="${i++}">${title}</span>`;

				// eslint-disable-next-line no-param-reassign
				input = input.replace(placeholder, replaceValue);
			});
			return main_core.Tag.render`<div>${input}</div>`;
		}
		#getPlaceholders(position) {
			const allPlaceholders = main_core.Type.isPlainObject(this.placeholders) ? this.placeholders : {};
			const placeholders = main_core.Type.isArrayFilled(allPlaceholders[position]) ? allPlaceholders[position] : [];
			return main_core.Type.isArrayLike(placeholders) ? placeholders : null;
		}
		#prepareDlgOptions(dlgOptions, element, position) {
			const placeholders = this.#getPlaceholders(position);
			const placeholderId = placeholders[element.dataset.templatePlaceholder] ?? null;
			if (placeholderId) {
				const filledPlaceholder = this.#getFilledPlaceholderById(placeholderId);
				if (filledPlaceholder) {
					// eslint-disable-next-line no-param-reassign
					dlgOptions.preselectedItems = [[filledPlaceholder.FIELD_ENTITY_TYPE, filledPlaceholder.FIELD_NAME]];
				}
			}

			// eslint-disable-next-line no-param-reassign
			dlgOptions.events = {
				onShow: () => {
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
				},
				onHide: () => {
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
				},
				'Item:onSelect': event => {
					main_core.Dom.addClass(element, '--selected');
					const item = event.getData().item;
					const parentTitle = item.supertitle.text;
					const title = item.title.text;

					// eslint-disable-next-line no-param-reassign
					element.textContent = `${parentTitle}: ${title}`;
					const value = item.id;
					const entityType = item.entityId;
					const params = {
						id: placeholderId,
						value,
						parentTitle,
						title,
						entityType
					};
					this.#adjustFilledPlaceholders(params);
					this.onSelect(params);
				}
			};

			// eslint-disable-next-line no-param-reassign
			dlgOptions.targetNode = element;
		}
		#adjustFilledPlaceholders({
			id,
			value,
			text,
			parentTitle,
			title
		}, action = UPDATE_ACTION) {
			if (action === DELETE_ACTION) {
				this.#deleteFromFilledPlaceholders(id, value);
				return;
			}
			this.#updateForFilledPlaceholders({
				id,
				value,
				text,
				parentTitle,
				title
			});
		}
		#deleteFromFilledPlaceholders(id, value) {
			this.filledPlaceholders = this.filledPlaceholders.filter(filledPlaceholder => {
				return filledPlaceholder.PLACEHOLDER_ID !== id || filledPlaceholder.FIELD_NAME !== value;
			});
		}
		#updateForFilledPlaceholders({
			id,
			value,
			text,
			parentTitle,
			title
		}) {
			const filledPlaceholder = this.#getFilledPlaceholderById(id);
			if (filledPlaceholder) {
				filledPlaceholder.FIELD_NAME = value ?? null;
				filledPlaceholder.FIELD_VALUE = text ?? null;
				filledPlaceholder.PARENT_TITLE = parentTitle;
				filledPlaceholder.TITLE = title;
			} else {
				this.filledPlaceholders.push({
					PLACEHOLDER_ID: id,
					FIELD_NAME: value,
					FIELD_VALUE: text,
					PARENT_TITLE: parentTitle,
					TITLE: title
				});
			}
		}
		#getFilledPlaceholderByElement(element, position = PREVIEW_POSITION) {
			const placeholderId = this.#getPlaceholderIdByElement(element, position);
			return this.#getFilledPlaceholderById(placeholderId);
		}
		#getPlaceholderIdByElement(element, position = PREVIEW_POSITION) {
			const placeholders = this.#getPlaceholders(position);
			return placeholders[element.dataset.templatePlaceholder] ?? null;
		}
		#getFilledPlaceholderById(placeholderId) {
			return this.filledPlaceholders.find(filledPlaceholderItem => filledPlaceholderItem.PLACEHOLDER_ID === placeholderId);
		}
		#getPlainText(position) {
			const text = this.#getRawTextByPosition(position);
			if (text === null) {
				return null;
			}
			return getPlainText(text, this.placeholders[position], this.filledPlaceholders);
		}
		#getRawTextByPosition(position) {
			if (position === HEADER_POSITION) {
				return this.#headerRaw;
			}
			if (position === PREVIEW_POSITION) {
				return this.#bodyRaw;
			}
			if (position === FOOTER_POSITION) {
				return this.#footerRaw;
			}
			return null;
		}
		#assertValidParams(params) {
			if (!main_core.Type.isPlainObject(params)) {
				throw new TypeError('BX.Crm.Template.Editor: The "params" argument must be object');
			}
			if (!main_core.Type.isDomNode(params.target)) {
				throw new Error('BX.Crm.Template.Editor: The "target" argument must be DOM node');
			}
			const isReadOnly = Boolean(params.isReadOnly ?? false);
			if (!isReadOnly && this.#canUsePlaceholderProvider(params.usePlaceholderProvider) && !BX.CrmEntityType.isDefined(params.entityTypeId)) {
				throw new TypeError('BX.Crm.Template.Editor: The "entityTypeId" argument is not correct');
			}
			if (!isReadOnly && !main_core.Type.isFunction(params.onSelect)) {
				throw new TypeError('BX.Crm.Template.Editor: The "onSelect" argument is not correct');
			}
		}
		#canUsePlaceholderProvider(value) {
			return main_core.Type.isNil(value) || value === true;
		}
	}

	exports.Editor = Editor;
	exports.Previewer = Previewer;
	exports.getPlainText = getPlainText;

})(this.BX.Crm.Template = this.BX.Crm.Template || {}, BX.Crm.EntitySelectorEx, BX, BX.Event, BX.Main, BX, BX.UI.EntitySelector, BX, BX.UI, BX, BX.UI);
//# sourceMappingURL=editor.bundle.js.map
