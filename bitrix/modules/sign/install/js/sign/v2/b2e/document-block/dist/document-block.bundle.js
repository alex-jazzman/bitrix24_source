/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, main_core_events, main_popup, ui_notification, ui_dialogs_messagebox) {
	'use strict';

	const placeholderExtensions = Object.freeze(['docx']);
	const mixedExtensions = Object.freeze(['jpeg', 'jpg', 'png', 'pdf', 'doc', 'docx', 'rtf', 'odt']);
	function getAllowedReplaceExtensions(isPlaceholderDocument) {
		return isPlaceholderDocument ? [...placeholderExtensions] : [...mixedExtensions];
	}

	class ReplaceConfirm {
		#documentId;
		#isPlaceholderDocument;
		#fileInput = null;
		#resolve = null;
		#boundHandleFileChange;
		#boundHandleWindowFocus;
		constructor(config) {
			this.#documentId = config.documentId;
			this.#isPlaceholderDocument = config.isPlaceholderDocument;
			this.#boundHandleFileChange = this.#handleFileChange.bind(this);
			this.#boundHandleWindowFocus = this.#handleWindowFocus.bind(this);
		}
		open() {
			return new Promise(resolve => {
				this.#resolve = resolve;
				this.#openFileDialog();
			});
		}
		#openFileDialog() {
			const accept = getAllowedReplaceExtensions(this.#isPlaceholderDocument).map(extension => `.${extension}`).join(',');
			this.#fileInput = main_core.Tag.render`
			<input type="file" accept="${accept}" style="display: none;" />
		`;
			main_core.Event.bind(this.#fileInput, 'change', this.#boundHandleFileChange);
			main_core.Event.bind(window, 'focus', this.#boundHandleWindowFocus);
			main_core.Dom.append(this.#fileInput, document.body);
			this.#fileInput.click();
		}
		#removeFileInput() {
			main_core.Dom.remove(this.#fileInput);
			main_core.Event.unbind(window, 'focus', this.#boundHandleWindowFocus);
		}
		#handleWindowFocus() {
			setTimeout(() => {
				if (this.#fileInput.files.length === 0) {
					this.#removeFileInput();
					this.#resolve(null);
				}
			}, 300);
		}
		#handleFileChange(event) {
			this.#removeFileInput();
			const files = event.target.files;
			if (files?.length > 0) {
				const fileList = [...files];
				if (!this.#areAllFilesAllowed(fileList)) {
					this.#resolve({
						error: 'invalid-extension'
					});
					return;
				}
				this.#showConfirm(fileList, this.#resolve);
				return;
			}
			this.#resolve(null);
		}
		#areAllFilesAllowed(files) {
			const allowedExtensions = getAllowedReplaceExtensions(this.#isPlaceholderDocument);
			return files.every(file => {
				const name = file.name || '';
				const dotIndex = name.lastIndexOf('.');
				const extension = dotIndex >= 0 ? name.slice(dotIndex + 1).toLowerCase() : '';
				return allowedExtensions.includes(extension);
			});
		}
		#showConfirm(selectedFiles, resolve) {
			const confirmMessageId = this.#isPlaceholderDocument ? 'SIGN_DOCUMENT_BLOCK_REPLACE_CONFIRM_TEXT' : 'SIGN_DOCUMENT_BLOCK_REPLACE_MIXED_DOCUMENT_CONFIRM_TEXT';
			ui_dialogs_messagebox.MessageBox.show({
				message: main_core.Loc.getMessage(confirmMessageId),
				title: main_core.Loc.getMessage('SIGN_DOCUMENT_BLOCK_REPLACE_CONFIRM_TITLE'),
				okCaption: main_core.Loc.getMessage('SIGN_DOCUMENT_BLOCK_REPLACE_CONFIRM_OK'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				useAirDesign: true,
				onOk: messageBox => {
					messageBox.close();
					resolve(selectedFiles);
				},
				onCancel: messageBox => {
					messageBox.close();
					resolve(null);
				},
				popupOptions: {
					id: `sign-b2e-document-replace-confirm-${this.#documentId}`
				}
			});
		}
	}

	var mixedDocumentItemIcon = "/bitrix/js/sign/v2/b2e/document-block/dist/assets/sign-wizard-block-file-icon.svg";

	var placeholderDocumentItemIcon = "/bitrix/js/sign/v2/b2e/document-block/dist/assets/sign-wizard-placeholder-file-icon.svg";

	const DocumentBlockType = Object.freeze({
		placeholder: 'placeholder',
		mixed: 'mixed'
	});
	const loadingClass = '--loading';
	let documentBlockInstanceCounter = 0;
	class DocumentBlock extends main_core_events.EventEmitter {
		#documentData;
		#options;
		#api;
		#isTemplateMode;
		#layout = null;
		#menuId;
		#menuButton = null;
		constructor(config) {
			super();
			this.setEventNamespace('BX.Sign.V2.B2e.DocumentBlock');
			this.#documentData = {
				...config.documentData
			};
			this.#options = config.options || {};
			this.#api = config.api;
			this.#isTemplateMode = config.isTemplateMode ?? false;
			documentBlockInstanceCounter += 1;
			this.#menuId = `document-block-menu-${documentBlockInstanceCounter}`;
		}
		getLayout() {
			if (!this.#layout) {
				this.#layout = this.#render();
			}
			return this.#layout;
		}
		getId() {
			return this.#documentData.id;
		}
		setTitle(newTitle) {
			if (!main_core.Type.isString(newTitle) || this.#documentData.title === newTitle) {
				return;
			}
			this.#documentData.title = newTitle;
			if (!this.#layout) {
				return;
			}
			const titleNode = this.#layout.querySelector('.sign-b2e-document-setup__document-block_title');
			if (titleNode) {
				titleNode.textContent = newTitle;
				titleNode.setAttribute('title', newTitle);
			}
		}
		destroy() {
			if (this.#layout) {
				main_core.Dom.remove(this.#layout);
				this.#layout = null;
			}
			main_popup.MenuManager.getMenuById(this.#menuId)?.destroy();
		}
		#render() {
			const documentId = main_core.Text.encode(this.#documentData.id);
			const menuId = this.#menuId;
			const documentIcon = main_core.Text.encode(this.#getIcon());
			const documentType = main_core.Text.encode(this.#getDocumentType());
			const menuButton = main_core.Tag.render`
			<button
				class="ui-btn ui-btn-round ui-btn-sm ui-btn-light-border sign-b2e-document-setup__menu-btn"
				type="button"
				aria-haspopup="menu"
				aria-expanded="false"
				aria-label="${main_core.Text.encode(main_core.Loc.getMessage('SIGN_DOCUMENT_BLOCK_EDIT_BUTTON'))}"
				data-test-id="sign-document-block__menu-btn"
			>
				<span class="sign-b2e-document-setup__menu-btn-icon"></span>
			</button>
		`;
			this.#menuButton = menuButton;
			main_core.Event.bind(menuButton, 'click', () => {
				this.#showMenu(menuId, menuButton);
			});
			return main_core.Tag.render`
			<div
				class="sign-b2e-document-setup__document-block${this.#options.isLoading ? ` ${loadingClass}` : ''}"
				data-id="document-id-${documentId}"
				data-test-id="sign-document-block__item-${documentType}-${documentId}"
			>
				<span class="sign-b2e-document-setup__document-block_icon-wrap">
					<img
						class="sign-b2e-document-setup__document-block_icon"
						src="${documentIcon}"
						alt=""
						data-test-id="sign-document-block__icon-${documentType}"
					>
					<span class="sign-b2e-document-setup__document-block_loader" aria-hidden="true"></span>
				</span>
				<div class="sign-b2e-document-setup__document-block_inner">
					${this.#createTitleWithEdit()}
					<span class="sign-b2e-document-setup__document-block_loading-info">
						${main_core.Text.encode(main_core.Loc.getMessage('SIGN_DOCUMENT_BLOCK_LOADING_INFO'))}
					</span>
				</div>
				<div class="sign-b2e-document-setup__document-block_btn">
					${menuButton}
				</div>
			</div>
		`;
		}
		setLoading(loading) {
			this.#options.isLoading = loading;
			if (!this.#layout) {
				return;
			}
			if (loading) {
				main_core.Dom.addClass(this.#layout, loadingClass);
			} else {
				main_core.Dom.removeClass(this.#layout, loadingClass);
			}
		}
		#getIcon() {
			return this.#options.isPlaceholderDocument ? placeholderDocumentItemIcon : mixedDocumentItemIcon;
		}
		#getDocumentType() {
			return this.#options.isPlaceholderDocument ? DocumentBlockType.placeholder : DocumentBlockType.mixed;
		}
		#createTitleWithEdit() {
			const title = main_core.Text.encode(this.#documentData.title);
			return main_core.Tag.render`
			<div
				class="sign-b2e-document-setup__document-block_title-wrapper"
				data-test-id="sign-document-block__title-wrapper"
				onclick="${({
			currentTarget
		}) => {
			this.#toggleTitleEditor(currentTarget, true);
		}}"
			>
				<span
					class="sign-b2e-document-setup__document-block_title"
					data-test-id="sign-document-block__title"
					title="${title}"
				>
					${title}
				</span>
				<span
					class="sign-b2e-document-setup__document-block_edit-title-btn"
					data-test-id="sign-document-block__edit-title-btn"
				>
				</span>
			</div>
		`;
		}
		#createTitleEditor() {
			const input = main_core.Tag.render`<input type="text" class="sign-b2e-document-setup__title-editor-input" data-test-id="sign-document-block__title-input" maxlength="255" />`;
			const saveButton = main_core.Tag.render`
			<span
				class="ui-btn ui-btn-sm ui-btn --air sign-b2e-document-setup__title-editor_ok-btn"
				data-test-id="sign-document-block__title-ok-btn"
			>
			</span>
		`;
			input.value = this.#documentData.title ?? '';
			this.#focusInput(input);
			main_core.Event.bind(input, 'keydown', this.#handleTitleInputKeydown.bind(this, input, saveButton));
			main_core.Event.bind(saveButton, 'click', this.#handleTitleSaveButtonClick.bind(this, input, saveButton));
			return main_core.Tag.render`
			<div class="sign-b2e-document-setup__title-editor" data-test-id="sign-document-block__title-editor">
				<div class="sign-b2e-document-setup__title-editor_controls">
					<span class="sign-b2e-document-setup__title-editor-control">
						${input}
					</span>
					${saveButton}
					<span
						class="sign-b2e-document-setup__title-editor_discard-btn"
						data-test-id="sign-document-block__title-discard-btn"
						onclick="${({
			target
		}) => {
			this.#toggleTitleEditor(target, false);
		}}"
					>
					</span>
				</div>
			</div>
		`;
		}
		#toggleTitleEditor(button, shouldShow) {
			const documentBlock = button.closest('.sign-b2e-document-setup__document-block');
			const innerBlock = documentBlock.querySelector('.sign-b2e-document-setup__document-block_inner');
			if (shouldShow) {
				main_core.Dom.clean(innerBlock);
				main_core.Dom.append(this.#createTitleEditor(), innerBlock);
				return;
			}
			main_core.Dom.clean(innerBlock);
			main_core.Dom.append(this.#createTitleWithEdit(), innerBlock);
		}
		#focusInput(input) {
			const observer = new MutationObserver(() => {
				if (input.isConnected) {
					input.focus();
					observer.disconnect();
				}
			});
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
		}
		async #handleTitleInputKeydown(input, saveButton, event) {
			if (event.key !== 'Enter') {
				return;
			}
			event.preventDefault();
			await this.#saveTitle(input, saveButton);
		}
		async #handleTitleSaveButtonClick(input, saveButton) {
			await this.#saveTitle(input, saveButton);
		}
		async #saveTitle(input, saveButton) {
			if (main_core.Dom.hasClass(saveButton, 'ui-btn-wait')) {
				return;
			}
			main_core.Dom.addClass(saveButton, 'ui-btn-wait');
			try {
				await this.#modifyTitle(input.value);
			} finally {
				main_core.Dom.removeClass(saveButton, 'ui-btn-wait');
				this.#toggleTitleEditor(saveButton, false);
			}
		}
		async #modifyTitle(newValue) {
			if (this.#documentData.title === newValue) {
				return;
			}
			try {
				const titleData = await this.#api.modifyTitle(this.#documentData.uid, newValue);
				this.#documentData.title = newValue;
				this.emit('titleChange', {
					uid: this.#documentData.uid,
					title: newValue,
					blankTitle: titleData.blankTitle
				});
			} catch (e) {
				console.error(e);
			}
		}
		#showMenu(menuId, bindElement) {
			let menu = main_popup.MenuManager.getMenuById(menuId);
			if (!menu) {
				menu = main_popup.MenuManager.create({
					id: menuId,
					bindElement,
					items: this.#getMenuItems(menuId, bindElement),
					autoHide: true,
					events: {
						onPopupClose: () => main_core.Dom.attr(bindElement, 'aria-expanded', 'false')
					}
				});
			}
			menu.getPopupWindow().setBindElement(bindElement);
			main_core.Dom.attr(bindElement, 'aria-expanded', menu.getPopupWindow().isShown() ? 'false' : 'true');
			menu.toggle();
		}
		#getMenuItems(menuId, bindElement) {
			const closeMenu = () => main_popup.MenuManager.getMenuById(menuId)?.close();
			const menuButtons = [{
				text: main_core.Loc.getMessage('SIGN_DOCUMENT_BLOCK_EDIT_BUTTON'),
				onclick: (event, item) => {
					this.emit('edit', {
						documentData: this.#documentData,
						bindElement: event?.currentTarget ?? item?.getLayout?.()?.item ?? bindElement,
						closeMenu
					});
				}
			}, {
				text: main_core.Loc.getMessage('SIGN_DOCUMENT_BLOCK_REPLACE_BUTTON'),
				onclick: () => {
					closeMenu();
					this.#openReplaceFileDialog();
				}
			}];
			if (!this.#isTemplateMode) {
				menuButtons.push({
					text: main_core.Loc.getMessage('SIGN_DOCUMENT_BLOCK_DELETE_BUTTON'),
					onclick: () => {
						closeMenu();
						this.emit('delete', {
							id: this.#documentData.id,
							uid: this.#documentData.uid,
							blankId: this.#documentData.blankId
						});
					}
				});
			}
			if (this.#documentData.id) {
				menuButtons.push({
					text: main_core.Loc.getMessage('SIGN_DOCUMENT_BLOCK_DOWNLOAD_BUTTON'),
					onclick: () => {
						closeMenu();
						this.#downloadBlank();
					}
				});
			}
			return menuButtons;
		}
		#downloadBlank() {
			if (!this.#documentData.isBlankDownloadable) {
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('SIGN_DOCUMENT_BLOCK_DOWNLOAD_ERROR')
				});
				return;
			}
			const url = this.#api.getBlankDownloadUrlByDocument(this.#documentData.id);
			const link = document.createElement('a');
			link.href = url;
			link.download = '';
			main_core.Dom.style(link, 'display', 'none');
			main_core.Dom.append(link, document.body);
			link.click();
			main_core.Dom.remove(link);
		}
		async #openReplaceFileDialog() {
			const replaceConfirm = new ReplaceConfirm({
				documentId: this.#documentData.id,
				isPlaceholderDocument: this.#options.isPlaceholderDocument
			});
			const result = await replaceConfirm.open();
			if (!result) {
				return;
			}
			if (!Array.isArray(result)) {
				if (result.error === 'invalid-extension') {
					this.#showReplaceInvalidExtensionPopup();
				}
				return;
			}
			this.emit('replaceConfirmed', {
				documentData: this.#documentData,
				isPlaceholderDocument: this.#options.isPlaceholderDocument,
				files: result
			});
		}
		#showReplaceInvalidExtensionPopup() {
			if (!this.#menuButton || !this.#menuButton.isConnected) {
				return;
			}
			setTimeout(() => {
				if (!this.#menuButton?.isConnected) {
					return;
				}
				const buttonWidth = this.#menuButton.getBoundingClientRect().width;
				const popupWidth = 280;
				const angleLeftOffset = 40;
				const arrowHalfWidth = 15;
				const offsetLeft = Math.round((buttonWidth - popupWidth) / 2 + angleLeftOffset);
				const angleOffset = Math.round(popupWidth / 2 - arrowHalfWidth);
				const messageCode = this.#options.isPlaceholderDocument ? 'SIGN_DOCUMENT_BLOCK_REPLACE_INVALID_EXTENSION_HINT' : 'SIGN_DOCUMENT_BLOCK_REPLACE_INVALID_EXTENSION_MIXED_HINT';
				const popup = new main_popup.Popup({
					id: `sign-b2e-document-replace-invalid-ext-${this.#documentData.id}`,
					bindElement: this.#menuButton,
					content: main_core.Loc.getMessage(messageCode),
					padding: 10,
					offsetLeft,
					angle: {
						position: 'top',
						offset: angleOffset
					},
					darkMode: true,
					width: popupWidth,
					autoHide: true,
					cacheable: false,
					bindOptions: {
						position: 'bottom'
					}
				});
				popup.show();
				setTimeout(() => popup.close(), 7000);
			}, 200);
		}
	}

	exports.DocumentBlock = DocumentBlock;
	exports.getAllowedReplaceExtensions = getAllowedReplaceExtensions;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Event, BX.Main, BX.UI.Notification, BX.UI.Dialogs);
//# sourceMappingURL=document-block.bundle.js.map
