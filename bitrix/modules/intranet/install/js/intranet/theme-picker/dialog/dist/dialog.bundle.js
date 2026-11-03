/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
this.BX.Intranet.Bitrix24 = this.BX.Intranet.Bitrix24 || {};
(function (exports, main_core, main_core_events, main_popup, main_loader, ui_a11y, ui_infoHelper, main_core_cache, ui_uploader_core) {
	'use strict';

	const RESTRICTION_ID = 'theme-dialog-checkbox-restriction';
	class CheckboxButton extends main_popup.PopupWindowButton {
		#themePicker;
		#checkbox;
		constructor(themePicker) {
			super({
				id: 'checkbox'
			});
			this.#themePicker = themePicker;
			this.#checkbox = main_core.Tag.render`
			<input
				id="theme-dialog-checkbox-input"
				class="theme-dialog-checkbox-input"
				data-testid="bx-theme-picker-default-for-all"
				type="checkbox"
				name="defaultTheme"
				value="Y"
				onclick="${this.#handleCheckboxClick.bind(this)}"
			>
		`;
			const restricted = !this.#themePicker.canSetDefaultTheme();
			if (restricted) {
				// `aria-disabled` instead of the native one: the click still has to open the tariff banner.
				main_core.Dom.attr(this.#checkbox, {
					'aria-disabled': 'true',
					'aria-describedby': RESTRICTION_ID
				});
			}
			this.buttonNode = main_core.Tag.render`
			<div class="theme-dialog-checkbox-button">
				${this.#checkbox}
				<label for="theme-dialog-checkbox-input" class="theme-dialog-checkbox-label">
					${main_core.Loc.getMessage('BITRIX24_THEME_DEFAULT_THEME_FOR_ALL')}
				</label>
				${restricted ? this.#createRestriction() : ''}
			</div>
		`;
		}
		isChecked() {
			return this.#checkbox.checked;
		}
		check() {
			this.#checkbox.checked = true;
		}
		uncheck() {
			this.#checkbox.checked = false;
		}

		/**
		 * The lock icon says it visually, the description says the same thing to a screen reader.
		 *
		 * `aria-hidden` on the description: the name and description computation follows a hidden node,
		 * so the checkbox keeps its description, while the node itself stops being a text node of the
		 * tree - and the same phrase stops being read a second time on the way through the footer.
		 */
		#createRestriction() {
			const description = new ui_a11y.VisuallyHidden();
			description.id = RESTRICTION_ID;
			description.textContent = main_core.Loc.getMessage('BITRIX24_THEME_DEFAULT_THEME_FOR_ALL_RESTRICTED');
			main_core.Dom.attr(description, 'aria-hidden', 'true');
			return [main_core.Tag.render`<span class="tariff-lock" aria-hidden="true"></span>`, description];
		}
		#handleCheckboxClick() {
			if (this.#themePicker.canSetDefaultTheme()) {
				return;
			}
			ui_infoHelper.InfoHelper.show('limit_office_background_to_all');
			this.uncheck();
		}
	}

	async function blur(file, radius = 7) {
		const {
			image,
			width,
			height
		} = main_core.Type.isFile(file) ? await ui_uploader_core.Helpers.loadImage(file) : {
			image: file,
			width: file.naturalWidth || file.width,
			height: file.naturalHeight || file.height
		};
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		if ('filter' in ctx) {
			const padding = Math.ceil(radius) * 2;
			const tmpCanvas = document.createElement('canvas');
			const tmpContext = tmpCanvas.getContext('2d');
			const w = image.width;
			const h = image.height;
			tmpCanvas.width = w + padding * 2;
			tmpCanvas.height = h + padding * 2;
			tmpContext.drawImage(image, 0, 0, w, 1, padding, 0, w, padding);
			tmpContext.drawImage(image, 0, h - 1, w, 1, padding, h + padding, w, padding);
			tmpContext.drawImage(image, 0, 0, 1, h, 0, padding, padding, h);
			tmpContext.drawImage(image, w - 1, 0, 1, h, w + padding, padding, padding, h);
			tmpContext.drawImage(image, 0, 0, 1, 1, 0, 0, padding, padding);
			tmpContext.drawImage(image, w - 1, 0, 1, 1, w + padding, 0, padding, padding);
			tmpContext.drawImage(image, 0, h - 1, 1, 1, 0, h + padding, padding, padding);
			tmpContext.drawImage(image, w - 1, h - 1, 1, 1, w + padding, h + padding, padding, padding);
			tmpContext.drawImage(image, padding, padding);
			tmpContext.filter = `blur(${radius}px)`;
			tmpContext.drawImage(tmpCanvas, 0, 0, tmpCanvas.width, tmpCanvas.height, 0, 0, tmpCanvas.width, tmpCanvas.height);
			ctx.drawImage(tmpCanvas, padding, padding, w, h, 0, 0, w, h);
		} else {
			console.log('blur manually');
			ctx.drawImage(image, 0, 0);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const blurredImageData = blurManually(imageData, radius);
			ctx.putImageData(blurredImageData, 0, 0);
		}
		const pixel = ctx.getImageData(0, 0, 10, 10);
		const [r, g, b] = pixel.data;
		const hex = `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
		const type = main_core.Browser.isSafari() ? 'image/jpeg' : 'image/webp';
		const extension = main_core.Browser.isSafari() ? 'jpg' : 'webp';
		const blob = await new Promise(resolve => {
			canvas.toBlob(resolve, type);
		});
		const fileName = file.name ? `blurred_${ui_uploader_core.Helpers.getFilenameWithoutExtension(file.name)}.${extension}` : `blurred_${main_core.Text.getRandom()}.${extension}`;
		return {
			file: new File([blob], fileName, {
				type
			}),
			color: hex
		};
	}
	function blurManually(imageData, radius) {
		if (radius < 1) {
			return imageData;
		}
		const data = imageData.data;
		const width = imageData.width;
		const height = imageData.height;
		const intRadius = Math.round(radius);
		const boxes = calculateBoxSizes(intRadius, 3);
		const tempData = new Uint8ClampedArray(data);
		let currentSrc = data;
		let currentDst = tempData;
		for (let i = 0; i < 3; i++) {
			const boxRadius = Math.floor((boxes[i] - 1) / 2);
			blurSymmetric(currentSrc, currentDst, width, height, boxRadius);
			[currentSrc, currentDst] = [currentDst, currentSrc];
		}
		if (currentSrc !== data) {
			data.set(currentSrc);
		}
		return imageData;
	}
	function blurSymmetric(srcData, dstData, width, height, radius) {
		const tempData = new Uint8ClampedArray(srcData.length);
		blurHorizontal(srcData, tempData, width, height, radius);
		blurVertical(tempData, dstData, width, height, radius);
	}
	function calculateBoxSizes(sigma, n) {
		const wIdeal = Math.sqrt(12 * sigma * sigma / n + 1);
		let wl = Math.floor(wIdeal);
		if (wl % 2 === 0) {
			wl--;
		}
		const wu = wl + 2;
		const mIdeal = (12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4);
		const m = Math.round(mIdeal);
		const sizes = [];
		for (let i = 0; i < n; i++) {
			sizes.push(i < m ? wl : wu);
		}
		return sizes;
	}
	function blurHorizontal(srcData, dstData, width, height, radius) {
		if (radius === 0) {
			dstData.set(srcData);
			return;
		}
		const kernelSize = radius * 2 + 1;
		const iarr = 1 / kernelSize;
		for (let y = 0; y < height; y++) {
			const rowStart = y * width * 4;
			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			for (let j = -radius; j <= radius; j++) {
				const x = Math.max(0, Math.min(width - 1, j));
				const offset = rowStart + x * 4;
				r += srcData[offset];
				g += srcData[offset + 1];
				b += srcData[offset + 2];
				a += srcData[offset + 3];
			}
			let dstOffset = rowStart;
			dstData[dstOffset] = Math.round(r * iarr);
			dstData[dstOffset + 1] = Math.round(g * iarr);
			dstData[dstOffset + 2] = Math.round(b * iarr);
			dstData[dstOffset + 3] = Math.round(a * iarr);
			for (let x = 1; x < width; x++) {
				const leftX = Math.max(0, Math.min(width - 1, x - radius - 1));
				const leftOffset = rowStart + leftX * 4;
				r -= srcData[leftOffset];
				g -= srcData[leftOffset + 1];
				b -= srcData[leftOffset + 2];
				a -= srcData[leftOffset + 3];
				const rightX = Math.max(0, Math.min(width - 1, x + radius));
				const rightOffset = rowStart + rightX * 4;
				r += srcData[rightOffset];
				g += srcData[rightOffset + 1];
				b += srcData[rightOffset + 2];
				a += srcData[rightOffset + 3];
				dstOffset = rowStart + x * 4;
				dstData[dstOffset] = Math.round(r * iarr);
				dstData[dstOffset + 1] = Math.round(g * iarr);
				dstData[dstOffset + 2] = Math.round(b * iarr);
				dstData[dstOffset + 3] = Math.round(a * iarr);
			}
		}
	}
	function blurVertical(srcData, dstData, width, height, radius) {
		if (radius === 0) {
			dstData.set(srcData);
			return;
		}
		const kernelSize = radius * 2 + 1;
		const iarr = 1 / kernelSize;
		const widthBytes = width * 4;
		for (let x = 0; x < width; x++) {
			const colStart = x * 4;
			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			for (let j = -radius; j <= radius; j++) {
				const y = Math.max(0, Math.min(height - 1, j));
				const offset = y * widthBytes + colStart;
				r += srcData[offset];
				g += srcData[offset + 1];
				b += srcData[offset + 2];
				a += srcData[offset + 3];
			}
			let dstOffset = colStart;
			dstData[dstOffset] = Math.round(r * iarr);
			dstData[dstOffset + 1] = Math.round(g * iarr);
			dstData[dstOffset + 2] = Math.round(b * iarr);
			dstData[dstOffset + 3] = Math.round(a * iarr);
			for (let y = 1; y < height; y++) {
				const topY = Math.max(0, Math.min(height - 1, y - radius - 1));
				const topOffset = topY * widthBytes + colStart;
				r -= srcData[topOffset];
				g -= srcData[topOffset + 1];
				b -= srcData[topOffset + 2];
				a -= srcData[topOffset + 3];
				const bottomY = Math.max(0, Math.min(height - 1, y + radius));
				const bottomOffset = bottomY * widthBytes + colStart;
				r += srcData[bottomOffset];
				g += srcData[bottomOffset + 1];
				b += srcData[bottomOffset + 2];
				a += srcData[bottomOffset + 3];
				dstOffset = y * widthBytes + colStart;
				dstData[dstOffset] = Math.round(r * iarr);
				dstData[dstOffset + 1] = Math.round(g * iarr);
				dstData[dstOffset + 2] = Math.round(b * iarr);
				dstData[dstOffset + 3] = Math.round(a * iarr);
			}
		}
	}

	const BG_IMAGE_FIELD_ID = 'theme-dialog-field-bg-image';
	const BG_IMAGE_HINT_ID = 'theme-dialog-field-bg-image-hint';
	const BG_IMAGE_UPLOAD_ID = 'theme-dialog-field-bg-image-upload';
	const BG_IMAGE_KEYBOARD_HINT_ID = 'theme-dialog-field-bg-image-keyboard-hint';
	const BG_COLOR_FIELD_ID = 'theme-dialog-field-bg-color-input';
	const TEXT_COLOR_LABEL_ID = 'theme-dialog-field-text-color-label';
	const FORM_ALERT_TEXT_ID = 'theme-dialog-form-alert-content';
	class NewThemeDialog extends main_core_events.EventEmitter {
		#themePicker;
		#listDialog;
		#colorPicker = null;
		#popup = null;
		#previewApplied = false;
		#origAppliedThemeId = null;
		#uploader = null;
		#refs = new main_core_cache.MemoryCache();
		#previewLoader = null;
		#creator = null;
		constructor(themePicker, listDialog) {
			super();
			this.setEventNamespace('BX.Intranet.Bitrix24.ThemePicker.NewThemeDialog');
			this.#themePicker = themePicker;
			this.#listDialog = listDialog;
		}

		/**
		 * The theme list goes inert, which drops the focus out of it, so the focus is moved into
		 * the form by the same operation. The creator button is remembered while it is still alive: the
		 * list dialog rebuilds its footer, and the node the person came from can be gone by the closing.
		 */
		show() {
			this.#creator = this.#themePicker.getDialogPopup().getButton('create-button')?.getContainer() ?? null;
			this.#getPopup().setContent(this.#getContent());
			this.#getPopup().show();
			this.#themePicker.disableThemeListDialog();
			this.#getControl('field-file-browse')?.focus();
		}
		destroy() {
			this.#resetResources();
			this.#getPopup().destroy();
			this.#popup = null;
			this.#refs = null;
		}
		getUploader() {
			this.#uploader ??= new ui_uploader_core.Uploader({
				multiple: false,
				acceptOnlyImages: true,
				allowReplaceSingle: true,
				imagePreviewWidth: 1920,
				imagePreviewHeight: 1080,
				// imagePreviewWidth: 4096,
				// imagePreviewHeight: 2160,
				imagePreviewMimeType: 'image/webp',
				imagePreviewMimeTypeMode: 'force',
				imagePreviewQuality: 0.85,
				imageMinWidth: 300,
				imageMinHeight: 200,
				imageMaxWidth: 10000,
				imageMaxHeight: 10000,
				imageMaxFileSize: 20 * 1024 * 1024,
				events: {
					/**
					 * A drop reaches the uploader alone: the dropzone cancels the default action of the
					 * drop, and that default is what fills the field of the zone natively. The value of
					 * that field is what a screen reader reads off the control, so a dropped file left it
					 * saying that nothing is chosen. It is filled here instead, by assignment: assigning
					 * `files` raises no `change`, so the browse path of the very same field - the uploader
					 * listens to that event on it - does not take the file a second time.
					 */
					[ui_uploader_core.UploaderEvent.BEFORE_DROP]: event => {
						this.#fillBgImageField(event.getData().dragEvent.dataTransfer);
					},
					[ui_uploader_core.UploaderEvent.FILE_LOAD_START]: () => {
						this.#hidePreview();
						this.#previewLoader = new main_loader.Loader({
							size: 40
						});
						this.#previewLoader.show(this.#getControl('field-file-preview'));
					},
					[ui_uploader_core.UploaderEvent.FILE_ERROR]: event => {
						const error = event.getData().error;
						// The upload fails on its own time, so the field is marked but the focus stays where
						// the person left it: the alert tells about the error by itself.
						this.#showError(error.getMessage(), error.getDescription());
						this.#setFieldInvalid(this.#getControl('field-file-browse'), true);
						this.#previewLoader?.destroy();
						this.#previewLoader = null;
					},
					[ui_uploader_core.UploaderEvent.FILE_COMPLETE]: async event => {
						this.#hideError();
						const file = event.getData().file;
						this.#nameBgImageField(file);
						const preview = file.getClientPreview();
						const {
							file: bgImageBlurred,
							color
						} = await blur(preview, 7);
						if (file.isAnimated()) {
							file.setCustomData('bgImageAnimated', true);
						} else {
							const bgImageBlurredUrl = URL.createObjectURL(bgImageBlurred);
							file.setCustomData('bgImageBlurred', bgImageBlurred);
							file.setCustomData('bgImageBlurredUrl', bgImageBlurredUrl);
						}
						this.#previewLoader?.destroy();
						this.#previewLoader = null;
						this.#setBgColor(color);
						this.#setTextColor(this.#chooseTextColor(color));
						this.#showPreview(this.#getBgImageUrl());
						this.#applyThemePreview();
					}
				}
			});
			return this.#uploader;
		}
		#resetResources() {
			if (this.#getBgImageBlurredUrl() !== null) {
				URL.revokeObjectURL(this.#getBgImageBlurredUrl());
			}
			this.#uploader?.destroy();
			this.#uploader = null;
			if (this.#previewApplied) {
				this.#listDialog.applyTheme(this.#origAppliedThemeId);
			}
			this.#removeThemePreview();
			this.#themePicker.enableThemeListDialog();
		}

		/**
		 * The isolation is already off by `#resetResources`, so the list dialog can take the
		 * focus back. Whichever way the dialog was closed, the focus is still inside the popup that is
		 * about to be destroyed, and it goes back to the button the person opened the form with.
		 */
		#returnFocusToListDialog() {
			const creator = this.#creator;
			this.#creator = null;
			const target = creator?.isConnected === true ? creator : this.#getEntryCell();
			this.#themePicker.focusInDialog(target, this.#popup);
		}
		#getEntryCell() {
			const content = this.#listDialog.getContentContainer();
			return content?.querySelector('[role="gridcell"][aria-selected="true"]') ?? content?.querySelector('[role="gridcell"]') ?? null;
		}
		#getBgImage() {
			return this.getUploader().getFiles()[0] || null;
		}
		#getBgImageUrl() {
			return this.#getBgImage()?.getPreviewUrl() || null;
		}
		#isBgImageAnimated() {
			return this.#getBgImage()?.getCustomData('bgImageAnimated') || false;
		}
		#getBgImageBlurred() {
			return this.#getBgImage()?.getCustomData('bgImageBlurred') || null;
		}
		#getBgImageBlurredUrl() {
			return this.#getBgImage()?.getCustomData('bgImageBlurredUrl') || null;
		}
		#getBgColor() {
			const color = this.#getControl('field-bg-color').value;
			return this.#validateBgColor(color) ? color : null;
		}
		#getTextColor() {
			return this.#getControl('field-text-color').value;
		}
		#getControl(name) {
			return this.#getPopup().getContentContainer().querySelector(`.theme-dialog-${name}`);
		}
		#getControls(name) {
			return this.#getPopup().getContentContainer().querySelectorAll(`.theme-dialog-${name}`);
		}
		#getPopup() {
			if (this.#popup) {
				return this.#popup;
			}
			const createButton = new main_popup.PopupWindowButton({
				id: 'theme-dialog-create-button',
				text: main_core.Loc.getMessage('BITRIX24_THEME_DIALOG_CREATE_BUTTON'),
				className: 'popup-window-button-accept',
				events: {
					click: this.#handleCreateButtonClick.bind(this)
				}
			});
			const cancelButton = new main_popup.PopupWindowButtonLink({
				text: main_core.Loc.getMessage('BITRIX24_THEME_DIALOG_CANCEL_BUTTON'),
				className: 'popup-window-button-link theme-dialog-button-link',
				events: {
					click: () => {
						this.#popup.close();
					}
				}
			});
			main_core.Dom.attr(createButton.buttonNode, 'data-testid', 'bx-theme-picker-new-theme-create');
			main_core.Dom.attr(cancelButton.buttonNode, 'data-testid', 'bx-theme-picker-new-theme-cancel');
			this.#popup = new main_popup.Popup({
				width: 500,
				height: 560,
				fixed: true,
				titleBar: main_core.Loc.getMessage('BITRIX24_THEME_CREATE_YOUR_OWN_THEME'),
				closeByEsc: true,
				bindOnResize: false,
				closeIcon: true,
				draggable: true,
				cacheable: false,
				events: {
					onClose: () => {
						this.#resetResources();
					},
					onAfterClose: () => {
						this.#returnFocusToListDialog();
					},
					onDestroy: () => {
						this.emit('onDestroy');
					}
				},
				buttons: [createButton, cancelButton]
			});
			main_core.Dom.attr(this.#popup.getPopupContainer(), 'data-testid', 'bx-theme-picker-new-theme-dialog');
			return this.#popup;
		}
		#getColorPicker() {
			if (this.#colorPicker) {
				return this.#colorPicker;
			}
			const ColorPicker = main_core.Reflection.getClass('BX.ColorPicker');
			if (ColorPicker) {
				this.#colorPicker = new ColorPicker({
					onColorSelected: this.#handleBgColorSelect.bind(this),
					popupOptions: {
						fixed: true
					}
				});
			}
			return this.#colorPicker;
		}
		#handleCreateButtonClick() {
			if (this.#getCreateButton().getContainer().disabled) {
				// double click protection
				return;
			}
			const error = this.#validateForm();
			if (error !== null) {
				this.#reportFieldError(error.field, error.message, error.description);
				return;
			}
			const data = new FormData();
			data.append('bgImage', this.#getBgImage() ? this.#getBgImage().getClientPreview() : '');
			data.append('bgImageBlurred', this.#getBgImageBlurred() || '');
			data.append('bgImageAnimated', this.#isBgImageAnimated());
			data.append('bgColor', this.#getBgColor() || '');
			data.append('textColor', this.#getTextColor() || '');
			data.append('action', 'create');
			data.append('sessid', main_core.Loc.getMessage('bitrix_sessid'));
			data.append('siteId', this.#themePicker.getSiteId());
			data.append('templateId', this.#themePicker.getTemplateId());
			let postSize = 0;
			for (const [key, value] of data.entries()) {
				postSize += key.length;
				postSize += value instanceof Blob ? value.size : value.length;
			}
			if (postSize > this.#themePicker.getMaxUploadSize()) {
				const limit = this.#themePicker.getMaxUploadSize() / 1024 / 1024;
				this.#reportFieldError(this.#getControl('field-file-browse'), main_core.Loc.getMessage('BITRIX24_THEME_FILE_SIZE_EXCEEDED', {
					'#LIMIT#': `${limit.toFixed(0)}Mb`
				}));
				return;
			}
			this.#setBusy(true);
			main_core.ajax({
				url: this.#themePicker.getAjaxHandlerPath(),
				method: 'POST',
				dataType: 'json',
				preparePost: false,
				data,
				onsuccess: response => {
					if (response && response.success && response.theme) {
						this.#listDialog.addItem(response.theme);
						this.#listDialog.preloadTheme(response.theme.id, () => {
							this.#setBusy(false);
							this.#removeThemePreview();
							this.#getPopup().close();
						});
					} else {
						this.#setBusy(false);
						this.#showError(response.error || main_core.Loc.getMessage('BITRIX24_THEME_UNKNOWN_ERROR'));
					}
				},
				onfailure: () => {
					this.#setBusy(false);
					this.#showError(main_core.Loc.getMessage('BITRIX24_THEME_UNKNOWN_ERROR'));
				}
			});
		}
		#getContent() {
			return main_core.Tag.render`
			<form
				name="theme-new-theme-form"
				method="post"
				data-testid="bx-theme-picker-new-theme-form"
				onsubmit="${event => event.preventDefault()}"
			>
				<div class="theme-dialog-form-alert" role="alert" data-testid="bx-theme-picker-form-alert">
					<div class="theme-dialog-form-alert-content" id="${FORM_ALERT_TEXT_ID}"></div>
					<button
						type="button"
						class="theme-dialog-form-alert-remove"
						data-testid="bx-theme-picker-form-alert-close"
						aria-label="${main_core.Loc.getMessage('BITRIX24_THEME_FORM_ALERT_CLOSE_LABEL')}"
						onclick="${this.#hideError.bind(this)}"
					></button>
				</div>
				<div class="theme-dialog-form">
					${this.#createField(main_core.Loc.getMessage('BITRIX24_THEME_THEME_BG_IMAGE'), this.#getBgImageField(), BG_IMAGE_FIELD_ID)}
					${this.#createField(main_core.Loc.getMessage('BITRIX24_THEME_THEME_BG_COLOR'), this.#getBgColorField(), BG_COLOR_FIELD_ID)}
					${this.#createFieldGroup(main_core.Loc.getMessage('BITRIX24_THEME_THEME_TEXT_COLOR'), this.#getTextColorField(), TEXT_COLOR_LABEL_ID)}
				</div>
			</form>
		`;
		}

		/**
		 * The block is a live region rendered from the start, and the class only reveals it: the text
		 * appended below is a change inside a region already in the tree, which is the announcement.
		 * Both lines go in as text - an error message can carry anything, markup included, and it has to
		 * stay readable instead of becoming the markup.
		 */
		#showError(message, description = '') {
			this.#clearInvalidFields();
			main_core.Dom.addClass(this.#getControl('form-alert'), 'theme-dialog-form-alert-show');
			const content = this.#getControl('form-alert-content');
			main_core.Dom.clean(content);
			main_core.Dom.append(main_core.Dom.create('div', {
				text: message
			}), content);
			if (main_core.Type.isStringFilled(description)) {
				main_core.Dom.append(main_core.Dom.create('div', {
					text: description
				}), content);
			}
		}
		#hideError() {
			main_core.Dom.removeClass(this.#getControl('form-alert'), 'theme-dialog-form-alert-show');
			// the region stays in the tree, so the text of an error that no longer holds has to go with it
			main_core.Dom.clean(this.#getControl('form-alert-content'));
			this.#clearInvalidFields();
		}

		// The alert text names the problem, so the field it belongs to points at it with a description
		// and takes the focus.
		#reportFieldError(field, message, description = '') {
			this.#showError(message, description);
			this.#setFieldInvalid(field, true);
			field.focus();
		}

		/**
		 * While the error stands, the alert text is the description of the field. The file field carries
		 * a description of its own, so the reference joins the list instead of replacing it.
		 */
		#setFieldInvalid(field, invalid) {
			main_core.Dom.attr(field, 'aria-invalid', invalid ? 'true' : null);
			const describedBy = (field.getAttribute('aria-describedby') || '').split(' ').filter(id => id !== '' && id !== FORM_ALERT_TEXT_ID);
			if (invalid) {
				describedBy.push(FORM_ALERT_TEXT_ID);
			}
			main_core.Dom.attr(field, 'aria-describedby', describedBy.length > 0 ? describedBy.join(' ') : null);
		}
		#clearInvalidFields() {
			const fields = this.#getPopup().getContentContainer().querySelectorAll('[aria-invalid="true"]');
			[].forEach.call(fields, field => {
				this.#setFieldInvalid(field, false);
			});
		}

		/**
		 * `aria-busy` and a native `disabled` on every control of the form: `pointer-events: none` alone
		 * left the form reachable from the keyboard and the request could be sent twice. The class stays
		 * for the pointer - dropping a file on the zone is not a control, and `disabled` does not stop it.
		 */
		#setBusy(busy) {
			const form = this.#getForm();
			const createButton = this.#getCreateButton();
			main_core.Dom.attr(form, 'aria-busy', busy ? 'true' : null);
			main_core.Dom.toggleClass(form, 'theme-dialog-form-disabled', busy);
			[].forEach.call(form.querySelectorAll('input, button'), control => {
				main_core.Dom.attr(control, 'disabled', busy ? '' : null);
			});
			if (busy) {
				createButton.addClassName('popup-window-button-wait');
				createButton.getContainer().disabled = true;
				return;
			}
			createButton.removeClassName('popup-window-button-wait');
			createButton.getContainer().disabled = false;

			// The clear button keeps the emptiness of the color field in the very same `disabled`, so the
			// release goes through the sync point instead of enabling every control unconditionally.
			this.#setBgColorFilled(this.#isBgColorFilled());

			// Disabling the button under the focus drops the focus to the body.
			if (this.#isFocusLost() && createButton.getContainer().isConnected) {
				createButton.getContainer().focus();
			}
		}
		#isFocusLost() {
			const activeElement = document.activeElement;
			return !main_core.Type.isElementNode(activeElement) || activeElement === document.body || !activeElement.isConnected;
		}
		#getForm() {
			return this.#getPopup().getContentContainer().querySelector('form');
		}
		#getCreateButton() {
			return this.#getPopup().getButton('theme-dialog-create-button');
		}
		#createField(title, field, controlId) {
			return main_core.Tag.render`
			<div class="theme-dialog-field">
				<label class="theme-dialog-field-label" for="${controlId}">${title}</label>
				<div class="theme-dialog-field-value">${field}</div>
			</div>
		`;
		}

		// A label names a single control, so a field built of several controls is named as a group.
		#createFieldGroup(title, field, labelId) {
			return main_core.Tag.render`
			<div class="theme-dialog-field" role="group" aria-labelledby="${labelId}">
				<div class="theme-dialog-field-label" id="${labelId}">${title}</div>
				<div class="theme-dialog-field-value">${field}</div>
			</div>
		`;
		}

		/**
		 * The clear button has to stay the immediate next sibling of the input: the resting look of its
		 * icon is driven by the `.theme-dialog-field-textbox + .theme-dialog-field-textbox-remove` pair.
		 */
		#getBgColorField() {
			return main_core.Tag.render`
			<div class="theme-dialog-field-textbox-wrapper">
				<button
					type="button"
					class="theme-dialog-field-textbox-color"
					data-testid="bx-theme-picker-bg-color-palette"
					aria-haspopup="dialog"
					aria-label="${main_core.Loc.getMessage('BITRIX24_THEME_BG_COLOR_PALETTE_LABEL')}"
					onclick="${this.#handleBgColorClick.bind(this)}"
				></button>
				<input
					type="text"
					placeholder=""
					name="bgColor"
					id="${BG_COLOR_FIELD_ID}"
					data-testid="bx-theme-picker-bg-color"
					maxlength="7"
					class="theme-dialog-field-textbox theme-dialog-field-bg-color"
					oninput="${this.#handleBgColorChange.bind(this)}"
					autocomplete="off"
				>
				<button
					type="button"
					class="theme-dialog-field-textbox-remove"
					data-testid="bx-theme-picker-bg-color-clear"
					aria-label="${main_core.Loc.getMessage('BITRIX24_THEME_BG_COLOR_CLEAR_LABEL')}"
					disabled
					onclick="${this.#handleBgColorClear.bind(this)}"
				></button>
			</div>
		`;
		}

		/**
		 * The zone is a real file field stretched over it. `assignBrowse` takes that very field, so the
		 * uploader creates no detached input of its own and the system dialog opens natively - both by a
		 * click on the zone and from the keyboard. `tabindex` is explicit: Safari with "Press Tab to
		 * highlight each item on a webpage" off walks only the elements that carry one. Drag handlers sit
		 * on the wrapper because the field covers the zone and drag events over it never reach the zone.
		 *
		 * Both visible texts of the zone are `aria-hidden`: they reach a screen reader as the description
		 * of the field, and a text node of their own would sound the same phrase a second time.
		 */
		#getBgImageField() {
			return this.#refs.remember('image-field', () => {
				const browseField = main_core.Tag.render`
				<input
					type="file"
					id="${BG_IMAGE_FIELD_ID}"
					class="theme-dialog-field-file-browse"
					data-testid="bx-theme-picker-bg-image"
					aria-describedby="${BG_IMAGE_UPLOAD_ID} ${BG_IMAGE_KEYBOARD_HINT_ID} ${BG_IMAGE_HINT_ID}"
					tabindex="0"
					onclick="${this.#handleBgImageBrowseClick.bind(this)}"
					oncancel="${this.#handleBgImageBrowseCancel.bind(this)}"
				>
			`;
				const imageField = main_core.Tag.render`
				<div
					class="theme-dialog-field-file"
					data-testid="bx-theme-picker-bg-image-zone"
					ondragenter="${this.#handleBgImageEnter.bind(this)}"
					ondragleave="${this.#handleBgImageLeave.bind(this)}"
					ondragover="${this.#handleBgImageOver.bind(this)}"
				>
					${browseField}
					<div class="theme-dialog-field-button">
						<div class="theme-dialog-field-file-preview"></div>
						<div class="theme-dialog-field-file-text">
							<span class="theme-dialog-field-file-add" id="${BG_IMAGE_UPLOAD_ID}" aria-hidden="true">
								${main_core.Loc.getMessage('BITRIX24_THEME_UPLOAD_BG_IMAGE')}
							</span>
							<span class="theme-dialog-field-file-add-info" id="${BG_IMAGE_HINT_ID}" aria-hidden="true">
								${main_core.Loc.getMessage('BITRIX24_THEME_DRAG_BG_IMAGE')}
							</span>
						</div>
					</div>
					${this.#createBgImageKeyboardHint()}
				</div>
			`;
				this.getUploader().assignBrowse(browseField);
				this.getUploader().assignDropzone(imageField);
				return imageField;
			});
		}

		/**
		 * Nothing on the screen tells that the zone opens the system dialog from the keyboard, so the
		 * hint lives in the description of the field alone. Its place is after the zone: the ring of the
		 * zone is drawn through the `.theme-dialog-field-file-browse:focus-visible + .theme-dialog-field-button`
		 * pair, and a node between the field and the zone would break it.
		 *
		 * `aria-hidden` on the hint: the description of the field is computed through a hidden node, so
		 * the hint keeps being read as part of it, while the node itself stops being a text node of the
		 * tree - and the same phrase stops sounding a second time on the way through the form.
		 */
		#createBgImageKeyboardHint() {
			const hint = new ui_a11y.VisuallyHidden();
			hint.id = BG_IMAGE_KEYBOARD_HINT_ID;
			hint.textContent = main_core.Loc.getMessage('BITRIX24_THEME_BG_IMAGE_KEYBOARD_HINT');
			main_core.Dom.attr(hint, 'aria-hidden', 'true');
			return hint;
		}

		// The field of the error is the one the focus goes to; for an empty form that is the first field
		// of the form.
		#validateForm() {
			const bgImage = this.#getBgImage();
			const bgColor = this.#getControl('field-bg-color').value;
			if (main_core.Type.isStringFilled(bgColor) && !this.#validateBgColor(bgColor)) {
				return {
					field: this.#getControl('field-bg-color'),
					message: main_core.Loc.getMessage('BITRIX24_THEME_WRONG_BG_COLOR')
				};
			}
			if (!bgImage && !main_core.Type.isStringFilled(bgColor)) {
				return {
					field: this.#getControl('field-file-browse'),
					message: main_core.Loc.getMessage('BITRIX24_THEME_EMPTY_FORM_DATA')
				};
			}
			if (bgImage && bgImage.isFailed()) {
				return {
					field: this.#getControl('field-file-browse'),
					message: bgImage.getError().getMessage(),
					description: bgImage.getError().getDescription()
				};
			}
			return null;
		}
		#validateBgColor(color) {
			return main_core.Type.isStringFilled(color) && color.match(/^#([\dA-Fa-f]{6})$/);
		}
		#showPreview(previewUrl) {
			const preview = this.#getControl('field-file-preview');
			main_core.Dom.style(preview, 'background-image', `url("${encodeURI(previewUrl)}")`);
		}
		#hidePreview() {
			const preview = this.#getControl('field-file-preview');
			main_core.Dom.style(preview, 'background-image', null);
		}

		/**
		 * A batch of several files is refused by the uploader as a whole, because the zone takes one,
		 * and then the field has to stay empty too: naming one file of a batch the form did not take
		 * would be a lie of its own, in the other direction.
		 */
		#fillBgImageField(transfer) {
			const files = transfer?.files ?? [];
			if (files.length !== 1) {
				return;
			}
			ui_uploader_core.assignFileToInput(this.#getControl('field-file-browse'), files[0]);
		}

		/**
		 * The uploader empties the field as soon as it has taken the file from it, so a picture chosen
		 * through the system dialog left the control saying that nothing is chosen - and that value is
		 * what a screen reader reads off it. The field is named back by the file the form will really
		 * send; assigning `files` raises no `change`, so the uploader does not take the file a second time.
		 */
		#nameBgImageField(file) {
			const binary = file.getBinary();
			if (binary !== null) {
				ui_uploader_core.assignFileToInput(this.#getControl('field-file-browse'), binary);
			}
		}

		/**
		 * The field is emptied before the system dialog opens: while it still names a picture, choosing
		 * that very picture again raises no `change`, and the uploader never learns about it. A dismissed
		 * dialog puts the name back.
		 */
		#handleBgImageBrowseClick() {
			this.#getControl('field-file-browse').value = '';
		}
		#handleBgImageBrowseCancel() {
			const file = this.#getBgImage();
			if (file !== null) {
				this.#nameBgImageField(file);
			}
		}
		#handleBgImageEnter(event) {
			main_core.Dom.addClass(this.#getControl('field-button'), 'theme-dialog-field-button-hover');
			event.stopPropagation();
			event.preventDefault();
		}
		#handleBgImageLeave(event) {
			main_core.Dom.removeClass(this.#getControl('field-button'), 'theme-dialog-field-button-hover');
			event.stopPropagation();
			event.preventDefault();
		}
		#handleBgImageOver(event) {
			event.stopPropagation();
			event.preventDefault();
		}
		#handleBgColorClick() {
			this.#getColorPicker().open({
				bindElement: this.#getControl('field-bg-color')
			});
		}
		#handleBgColorChange() {
			if (this.#getBgColor()) {
				this.#hideError();
			}
			this.#applyThemePreview();
		}
		#handleBgColorClear() {
			this.#getColorPicker().close();
			this.#getControl('field-bg-color').value = '';
			this.#setBgColorFilled(false);
			main_core.Dom.style(this.#getControl('field-textbox-color'), 'backgroundColor', null);
			this.#applyThemePreview();
		}
		#handleBgColorSelect(color) {
			this.#setBgColor(color);
			this.#hideError();
			this.#applyThemePreview();
		}
		#setBgColor(color) {
			this.#getControl('field-bg-color').value = color;
			this.#setBgColorFilled(true);
			main_core.Dom.style(this.#getControl('field-textbox-color'), 'backgroundColor', color);
		}

		// One point for the emptiness of the color field: the resting look of the clear button is driven
		// by the class, its availability by `disabled`, and split sources would let the two drift apart.
		#setBgColorFilled(filled) {
			main_core.Dom.toggleClass(this.#getControl('field-bg-color'), 'theme-dialog-field-textbox-not-empty', filled);
			this.#getControl('field-textbox-remove').disabled = !filled;
		}
		#isBgColorFilled() {
			return main_core.Dom.hasClass(this.#getControl('field-bg-color'), 'theme-dialog-field-textbox-not-empty');
		}
		#setTextColor(color) {
			const switchers = this.#getControls('field-button-switcher-item');
			[].forEach.call(switchers, switcher => {
				const pressed = switcher.dataset.textColor === color;
				main_core.Dom.toggleClass(switcher, 'theme-dialog-field-button-switcher-item-pressed', pressed);
				main_core.Dom.attr(switcher, 'aria-pressed', pressed ? 'true' : 'false');
			});
			this.#getControl('field-text-color').value = color;
		}

		// Two toggle buttons over one hidden value: the value is what the form posts, `aria-pressed` is
		// what says which of the two is chosen.
		#getTextColorField() {
			return main_core.Tag.render`
			<div class="theme-dialog-field-button-switcher">
				<button
					type="button"
					class="theme-dialog-field-button-switcher-item theme-dialog-field-button-switcher-item-left theme-dialog-field-button-switcher-item-pressed"
					data-text-color="light"
					data-testid="bx-theme-picker-text-color-light"
					aria-pressed="true"
					onclick="${this.#handleSwitcherClick.bind(this)}"
				>
					${main_core.Loc.getMessage('BITRIX24_THEME_THEME_LIGHT_COLOR')}
				</button>
				<button
					type="button"
					class="theme-dialog-field-button-switcher-item theme-dialog-field-button-switcher-item-right"
					data-text-color="dark"
					data-testid="bx-theme-picker-text-color-dark"
					aria-pressed="false"
					onclick="${this.#handleSwitcherClick.bind(this)}"
				>
					${main_core.Loc.getMessage('BITRIX24_THEME_THEME_DARK_COLOR')}
				</button>
				<input
					type="hidden"
					name="textColor"
					value="light"
					class="theme-dialog-field-text-color"
					data-testid="bx-theme-picker-text-color-value"
				>
			</div>
		`;
		}
		#handleSwitcherClick(event) {
			const color = event.currentTarget.dataset.textColor;
			this.#setTextColor(color);
			this.#applyThemePreview();
		}
		#applyThemePreview() {
			if (this.#getBgImage() === null && this.#getBgColor() === null) {
				if (this.#previewApplied) {
					this.#listDialog.applyTheme(this.#origAppliedThemeId);
				}
				return;
			}
			const baseThemes = this.#themePicker.getBaseThemes();
			const baseThemeId = this.#getTextColor();
			if (!baseThemes[baseThemeId] || !main_core.Type.isArray(baseThemes[baseThemeId].css)) {
				return;
			}
			let style = ':root { ';
			if (this.#getBgImageUrl() !== null) {
				style += '--air-theme-bg-size: cover;';
				style += '--air-theme-bg-repeat: no-repeat;';
				style += '--air-theme-bg-position: 0 0;';
				style += '--air-theme-bg-attachment: fixed;';
				style += `--air-theme-bg-image: url("${encodeURI(this.#getBgImageUrl())}");`;
				if (this.#getBgImageBlurredUrl() !== null) {
					style += `--air-theme-bg-image-blurred: url("${encodeURI(this.#getBgImageBlurredUrl())}");`;
				}
			}
			if (this.#getBgColor()) {
				style += `--air-theme-bg-color: ${this.#getBgColor()}; `;
			}
			style += ' }';
			if (!this.#previewApplied) {
				this.#origAppliedThemeId = this.#themePicker.getAppliedThemeId();
			}
			this.#listDialog.removeThemeAssets(this.#themePicker.getAppliedThemeId());
			this.#listDialog.applyThemeAssets({
				id: this.#getPreviewThemeId(),
				css: baseThemes[baseThemeId].css,
				style
			});
			this.#themePicker.setAppliedThemeId(this.#getPreviewThemeId());
			this.#previewApplied = true;
		}
		#removeThemePreview() {
			this.#listDialog.removeThemeAssets(this.#getPreviewThemeId());
			this.#previewApplied = false;
		}
		#getPreviewThemeId() {
			return `${this.#getTextColor()}:custom_live_preview`;
		}
		#chooseTextColor(color) {
			let hexColor = color.replace(/^#/, '');
			if (hexColor.length === 3) {
				hexColor = [...hexColor].map(c => c + c).join('');
			}
			const r = parseInt(hexColor.slice(0, 2), 16);
			const g = parseInt(hexColor.slice(2, 4), 16);
			const b = parseInt(hexColor.slice(4, 6), 16);
			const brightness = (r * 299 + g * 587 + b * 114) / 1000;
			return brightness > 186 ? 'dark' : 'light';
		}
	}

	class ThemePickerDialog {
		#themePicker;
		#newThemeDialog = null;
		#checkboxButton = null;
		#gridFocusZone = null;
		#focusedCell = null;
		constructor(themePicker) {
			this.#themePicker = themePicker;
		}
		show() {
			this.#loadThemes();
		}
		close() {
			this.#destroyGridFocusZone();
			this.#newThemeDialog?.destroy();
			this.#newThemeDialog = null;
			if (!this.#themePicker.needReturnValue()) {
				this.applyTheme(this.#themePicker.getThemeId());
			}
			this.#themePicker.setThemes([]);
		}
		async makeCustomThemeBlurred(theme, options = {}) {
			if (!main_core.Type.isStringFilled(theme.bgImageUrlToBlur)) {
				return Promise.resolve();
			}
			const lsKey = 'custom_themes_errors';
			const localStorage = main_core.Reflection.getClass('BX.localStorage');
			if (localStorage && localStorage.get(lsKey)?.includes(theme.id)) {
				console.log('Skipping blurred image for theme', theme.id);
				return Promise.resolve();
			}
			const saveError = (timeout = 3600) => {
				if (localStorage) {
					const errorCustomThemes = localStorage.get(lsKey) || '';
					localStorage.set(lsKey, `${errorCustomThemes}|${theme.id}`, timeout);
				}
			};
			let bgImageBlurred = null;
			let color = null;
			try {
				const {
					image
				} = await this.#loadImage(theme.bgImageUrlToBlur);
				const result = await blur(image, 7);
				bgImageBlurred = result.file;
				color = result.color;
			} catch (error) {
				saveError();
				return Promise.reject(error);
			}
			const {
				ignoreErrors = false,
				applyTheme = false
			} = options;
			const data = new FormData();
			data.append('action', 'save-blurred-image');
			data.append('themeId', theme.id);
			data.append('bgImageBlurred', bgImageBlurred);
			data.append('bgColor', color);
			data.append('ignoreErrors', ignoreErrors);
			return this.#ajax(data).then(response => {
				if (response && response.success && response.theme) {
					this.#themePicker.updateTheme(response.theme.id, {
						bgImageUrlToBlur: null
					});
					this.#themePicker.updateTheme(response.theme.id, response.theme);
					this.preloadTheme(response.theme.id, () => {
						if (applyTheme) {
							this.removeThemeAssets(this.#themePicker.getAppliedThemeId());
							this.applyThemeAssets(response.theme);
						}
					});
				} else {
					console.log('Error while saving blurred image for theme', theme.id);
					saveError();
				}
			}).catch(error => {
				console.error(error);
				saveError();
			});
		}
		#loadImage(src) {
			return new Promise((resolve, reject) => {
				const image = document.createElement('img');
				let url = src;
				if (url.startsWith('http') && !url.startsWith(window.location.origin)) {
					url = '/bitrix/tools/landing/proxy.php';
					url += `?sessid=${main_core.Loc.getMessage('bitrix_sessid')}&url=${encodeURIComponent(this.#urnEncode(src))}`;
				}
				image.src = url;
				image.onerror = error => {
					reject(error);
				};
				image.onload = () => {
					resolve({
						width: image.naturalWidth,
						height: image.naturalHeight,
						image
					});
				};
			});
		}
		#urnEncode(str) {
			let result = '';
			const parts = str.split(/(:\/\/|:\d+\/|\/|\?|=|&)/);
			for (const [i, part] of parts.entries()) {
				result += i % 2 === 1 ? part : encodeURIComponent(part);
			}
			return result;
		}
		#ajax(data) {
			const formData = main_core.Type.isFormData(data) ? data : new FormData();
			if (main_core.Type.isPlainObject(data)) {
				for (const [key, value] of Object.entries(data)) {
					formData.append(key, value);
				}
			}
			formData.append('sessid', main_core.Loc.getMessage('bitrix_sessid'));
			formData.append('templateId', this.#themePicker.getTemplateId());
			formData.append('siteId', this.#themePicker.getSiteId());
			formData.append('entityType', this.#themePicker.getEntityType());
			formData.append('entityId', this.#themePicker.getEntityId());
			return new Promise((resolve, reject) => {
				main_core.ajax({
					method: 'POST',
					dataType: 'json',
					preparePost: false,
					url: this.#themePicker.getAjaxHandlerPath(),
					data: formData,
					onsuccess: resolve,
					onfailure: reject
				});
			});
		}
		#loadThemes() {
			this.#ajax({
				action: 'getlist'
			}).then(data => {
				if (!data || !data.success || !main_core.Type.isArray(data.themes) || data.themes.length === 0) {
					this.#showFatalError();
					return;
				}
				this.#hideLoader();
				this.#themePicker.setThemes(data.themes);
				this.#themePicker.setBaseThemes(data.baseThemes);
				this.#setButtons();
				this.#renderLayout();
			}).catch(() => {
				this.#showFatalError();
			});
		}
		#setButtons() {
			const buttons = [];
			if (this.#themePicker.isCurrentUserAdmin() && this.#themePicker.getEntityType() === 'USER') {
				buttons.push(this.#getCheckboxButton());
			}
			buttons.push(this.#getSaveButton(), this.#getCancelButton(), this.#getCreateButton());
			this.#themePicker.getDialogPopup().setButtons(buttons);
		}
		#getCheckboxButton() {
			if (!this.#checkboxButton) {
				this.#checkboxButton = new CheckboxButton(this.#themePicker);
			}
			return this.#checkboxButton;
		}
		#showFatalError() {
			this.#hideLoader();
			this.#themePicker.setDialogBusy(false);
			const message = this.#getMessage('BITRIX24_THEME_UNKNOWN_ERROR');
			const error = main_core.Tag.render`
			<div
				class="theme-dialog-error"
				tabindex="-1"
				data-testid="bx-theme-picker-list-error"
			>${main_core.Text.encode(message)}</div>
		`;
			this.#themePicker.getDialogPopup().setContent(error);
			this.#themePicker.getDialogPopup().setButtons([this.#getCancelButton()]);

			// The message is the only content left and the reason the dialog is useless: it takes the
			// focus by the policy of the picker and is announced insistently.
			this.#themePicker.focusInDialog(error);
			ui_a11y.LiveAnnouncer.announce(message, 'assertive');
		}
		#hideLoader() {
			this.#themePicker.hideLoader();
		}
		#getSaveButton() {
			const button = new main_popup.PopupWindowButton({
				id: 'save-button',
				text: main_core.Loc.getMessage('BITRIX24_THEME_DIALOG_SAVE_BUTTON'),
				className: 'popup-window-button-accept',
				events: {
					click: () => {
						this.#handleSaveButtonClick();
					}
				}
			});
			main_core.Dom.attr(button.buttonNode, 'data-testid', 'bx-theme-picker-save');
			return button;
		}
		#handleSaveButtonClick() {
			if (this.#themePicker.needReturnValue()) {
				const eventData = {
					theme: this.#themePicker.getTheme(this.#themePicker.getReturnValue())
				};
				main_core_events.EventEmitter.emit('Intranet.ThemePicker:onSave', new main_core_events.BaseEvent({
					data: [eventData],
					compatData: [eventData]
				}));
			} else if (this.#themePicker.getThemeId() !== this.#themePicker.getAppliedThemeId() || this.#isCheckboxChecked()) {
				this.#saveTheme(this.#themePicker.getAppliedThemeId());
			}
			this.#themePicker.closeDialog();
		}
		#isCheckboxChecked() {
			return this.#checkboxButton ? this.#checkboxButton.isChecked() : false;
		}
		#getCancelButton() {
			const button = new main_popup.PopupWindowButtonLink({
				id: 'cancel-button',
				text: main_core.Loc.getMessage('BITRIX24_THEME_DIALOG_CANCEL_BUTTON'),
				className: 'popup-window-button-link theme-dialog-button-link',
				events: {
					click: () => {
						this.#themePicker.closeDialog();
					}
				}
			});
			main_core.Dom.attr(button.buttonNode, 'data-testid', 'bx-theme-picker-cancel');
			return button;
		}
		#getCreateButton() {
			const button = new main_popup.PopupWindowButtonLink({
				id: 'create-button',
				text: main_core.Loc.getMessage('BITRIX24_THEME_DIALOG_NEW_THEME'),
				className: 'popup-window-button-link theme-dialog-button-link theme-dialog-new-theme-btn',
				events: {
					click: () => {
						this.getNewThemeDialog().show();
					}
				}
			});
			main_core.Dom.attr(button.buttonNode, {
				'data-testid': 'bx-theme-picker-create',
				'aria-haspopup': 'dialog'
			});
			return button;
		}
		#renderLayout() {
			const container = main_core.Tag.render`
			<div class="theme-dialog-content" role="row"></div>
		`;
			this.#themePicker.getThemes().forEach(theme => {
				const item = this.createItem(theme);
				main_core.Dom.append(item, container);
				this.#markGridCell(item, theme);
			});

			// `tabindex="-1"`: the grid is the last place the focus can go when the last theme is removed.
			const grid = main_core.Tag.render`
			<div
				class="theme-dialog-container"
				role="grid"
				data-testid="bx-theme-picker-grid"
				tabindex="-1"
				onkeydown="${this.#handleGridKeyDown.bind(this)}"
				onfocusin="${this.#handleGridFocusIn.bind(this)}"
				onfocusout="${this.#handleGridFocusOut.bind(this)}"
			>${container}</div>
		`;
			main_core.Dom.attr(grid, 'aria-label', this.#getMessage('BITRIX24_THEME_GRID_LABEL'));
			this.#keepSingleTabStop(container);
			this.#themePicker.getDialogPopup().setContent(grid);
			this.#createGridFocusZone(grid);

			// The grid is ready, so the popup stops being busy and takes over the focus.
			this.#themePicker.setDialogBusy(false);
			this.#themePicker.focusInDialog(this.#getEntryCell());
		}
		addItem(theme) {
			const themes = this.#themePicker.getThemes();
			themes.unshift(theme);
			this.#themePicker.setThemes(themes);
			const newItem = this.createItem(theme);
			main_core.Dom.prepend(newItem, this.getContentContainer());
			this.#markGridCell(newItem, theme);
			this.#selectItem(newItem);

			// The new theme is the selected one, so the single Tab stop and the entry point of the grid
			// move on to its cell: the zone resolves both when it activates.
			const grid = this.#getGridContainer();
			if (this.#gridFocusZone && grid) {
				this.#createGridFocusZone(grid);
			}
		}

		/**
		 * The grid owns the cell semantics, the tile itself does not: the site theme field renders its
		 * own container of the same class and fills it with `createItem`, and it must stay without any
		 * of these attributes. Hence the check by the actual parent instead of a selector by class.
		 */
		#markGridCell(item, theme) {
			if (item.parentElement?.getAttribute('role') !== 'row') {
				return;
			}
			const isApplied = this.#themePicker.getAppliedThemeId() === theme.id;
			main_core.Dom.attr(item, {
				role: 'gridcell',
				tabindex: isApplied ? '0' : '-1',
				'aria-selected': isApplied ? 'true' : 'false',
				'data-testid': 'bx-theme-picker-theme-item'
			});
			this.#nameGridCell(item, theme);
		}

		/**
		 * A screen reader reads the contents of a cell right after its name, and the name is the richer
		 * of the two: it carries the kind of the theme as well. So the visible name and the badges of
		 * the kind are hidden - they would only repeat the name inside the cell they name. The strip
		 * around the visible name stays: the remove button lives in it and has to keep being reachable.
		 */
		#nameGridCell(item, theme) {
			main_core.Dom.attr(item, 'aria-label', this.#getItemLabel(theme));
			item.querySelectorAll('.theme-dialog-item-title-text, .theme-dialog-item-default, .theme-dialog-item-new').forEach(duplicate => {
				main_core.Dom.attr(duplicate, 'aria-hidden', 'true');
			});
		}
		#markCellSelected(item, selected) {
			if (this.#isGridCell(item)) {
				main_core.Dom.attr(item, 'aria-selected', selected ? 'true' : 'false');
			}
		}

		/**
		 * The cell role is what separates the grid of the dialog from the tiles of the site theme field:
		 * the field renders the same tiles by the same `createItem` and must stay out of the grid states,
		 * the announcements and the focus management.
		 */
		#isGridCell(node) {
			return node?.getAttribute('role') === 'gridcell';
		}

		// The grid keeps a single Tab stop even when none of its themes is the applied one.
		#keepSingleTabStop(container) {
			const cells = container.querySelectorAll('[role="gridcell"]');
			if (cells.length === 0 || container.querySelector('[role="gridcell"][tabindex="0"]')) {
				return;
			}
			main_core.Dom.attr(cells[0], 'tabindex', '0');
		}

		/**
		 * `inert` on the popup of the list leaves the zone with an empty set: every cell hides behind the
		 * attribute, and the observer of the zone never sees it go - it sits on an ancestor of the grid.
		 * So the set is rebuilt by whoever lifts the isolation, and the arrows have cells to walk again.
		 */
		refreshGrid() {
			this.#gridFocusZone?.refreshElements();
		}
		#createGridFocusZone(grid) {
			this.#destroyGridFocusZone();
			this.#gridFocusZone = new ui_a11y.FocusZone(grid, {
				bindKeys: ui_a11y.FocusKeys.ArrowAll | ui_a11y.FocusKeys.HomeAndEnd,
				focusInStrategy: () => this.#getEntryCell(),
				// Cells only. The roving tabindex of the zone is the single Tab stop of the grid, and the
				// remove button of a cell hides behind the strip with the name as soon as the focus leaves
				// the grid: as a member of the set it would carry that stop away into a node nobody can
				// reach any more. The arrows reach the button through `getNextFocusable` instead.
				focusableElementFilter: element => this.#isGridCell(element),
				getNextFocusable: (direction, from, event) => this.#getNextCell(direction, from, event)
			});
			this.#gridFocusZone.activate();
		}
		#destroyGridFocusZone() {
			this.#gridFocusZone?.deactivate();
			this.#gridFocusZone = null;
			this.#setFocusedCell(null);
		}

		/**
		 * The strip with the name of the theme is revealed by the keyboard focus of the cell, and the
		 * remove button lives inside that strip: the cell itself loses `:focus-visible` the moment the
		 * focus moves on to the button, so the class holds the strip open where the pseudo-class stops.
		 */
		#handleGridFocusIn(event) {
			const cell = event.target.matches(':focus-visible') ? event.target.closest('[role="gridcell"]') : null;
			this.#setFocusedCell(cell);
		}
		#handleGridFocusOut(event) {
			if (!event.currentTarget.contains(event.relatedTarget)) {
				this.#setFocusedCell(null);
			}
		}
		#setFocusedCell(cell) {
			if (this.#focusedCell === cell) {
				return;
			}
			if (this.#focusedCell) {
				main_core.Dom.removeClass(this.#focusedCell, 'theme-dialog-item-focused');
			}
			this.#focusedCell = cell;
			if (cell) {
				main_core.Dom.addClass(cell, 'theme-dialog-item-focused');
			}
		}

		// The selected theme on the first entry into the grid, the last visited element afterwards.
		#getEntryCell() {
			const cells = this.#getVisibleCells();
			return this.#gridFocusZone?.getCurrentFocusedElement() ?? cells.find(cell => cell.getAttribute('aria-selected') === 'true') ?? cells[0] ?? null;
		}

		/**
		 * Vertical moves and row edges; an empty answer leaves the linear walk of the zone
		 * in place, which is what the left and right arrows need.
		 */
		#getNextCell(direction, from, event) {
			const cell = from?.closest('[role="gridcell"]');
			if (!cell) {
				return null;
			}
			const cells = this.#getVisibleCells();
			const rows = this.#groupCellsByOffsetTop(cells);
			const rowIndex = rows.findIndex(row => row.includes(cell));
			if (rowIndex === -1) {
				return null;
			}
			const row = rows[rowIndex];
			if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
				const targetRow = rows[rowIndex + (event.key === 'ArrowDown' ? 1 : -1)];
				if (!targetRow) {
					// Grid edge: the same cell keeps the focus where it is, an empty answer would move it away.
					return cell;
				}
				const colIndex = row.indexOf(cell);
				return targetRow[Math.min(colIndex, targetRow.length - 1)];
			}
			if (event.key === 'Home' || event.key === 'End') {
				const scope = event.ctrlKey || event.metaKey ? cells : row;
				return direction === 'start' ? scope[0] : scope[scope.length - 1];
			}
			return this.#getNextHorizontal(cell, from, cells, event);
		}

		/**
		 * The remove button of a cell is a stop of the horizontal walk, and no member of the managed set
		 * of the zone, so the steps over it are taken here: right from the cell steps into the button,
		 * right from the button steps on to the next cell, left from the button back into its own cell.
		 * An empty answer leaves the step to the linear walk of the zone, which knows the cells alone.
		 */
		#getNextHorizontal(cell, from, cells, event) {
			// Ctrl or Cmd with an arrow walks the whole zone, and the zone does that walk itself.
			if (event.ctrlKey || event.metaKey) {
				return null;
			}
			if (event.key === 'ArrowRight') {
				return from === cell ? this.#getRevealedRemoveButton(cell) : cells[cells.indexOf(cell) + 1] ?? null;
			}
			if (event.key === 'ArrowLeft' && from !== cell) {
				return cell;
			}
			return null;
		}

		// The strip with the name, and the remove button in it, are revealed only by the keyboard focus.
		#getRevealedRemoveButton(cell) {
			return this.#focusedCell === cell ? cell.querySelector('.theme-dialog-item-remove') : null;
		}

		// Rows live in the layout, not in the markup: tiles wrap, so the row of a cell is read from its position.
		#groupCellsByOffsetTop(cells) {
			const rows = [];
			let rowOffsetTop = null;
			cells.forEach(cell => {
				if (cell.offsetTop !== rowOffsetTop) {
					rowOffsetTop = cell.offsetTop;
					rows.push([]);
				}
				rows[rows.length - 1].push(cell);
			});
			return rows;
		}
		#getVisibleCells() {
			const cells = this.getContentContainer()?.querySelectorAll('[role="gridcell"]') ?? [];
			return [...cells].filter(cell => cell.offsetParent !== null);
		}

		/**
		 * The neighbour takes the focus while the cell is still in the document: the next cell,
		 * then the previous one, then the grid itself, so the focus never falls down to the body.
		 */
		#focusCellNeighbour(cell) {
			if (!this.#isGridCell(cell)) {
				return;
			}
			const cells = this.#getVisibleCells();
			const cellIndex = cells.indexOf(cell);
			const neighbour = cellIndex === -1 ? null : cells[cellIndex + 1] ?? cells[cellIndex - 1];
			(neighbour ?? this.#getGridContainer())?.focus();
		}
		#getGridContainer() {
			return this.getContentContainer()?.closest('[role="grid"]');
		}

		/**
		 * Activation only synthesizes a click on the cell: the tile keeps a single action handler, so
		 * unbinding its click disables the keyboard too, as the site theme field expects.
		 */
		#handleGridKeyDown(event) {
			if (event.key !== 'Enter' && event.key !== ' ') {
				return;
			}
			if (event.target.closest('.theme-dialog-item-remove')) {
				return;
			}
			const cell = event.target.closest('[role="gridcell"]');
			if (!cell) {
				return;
			}
			event.preventDefault();
			cell.click();
		}

		/**
		 * Labels of the theme wrap the name one by one, so a theme matching several of them still
		 * reads as a sentence: "Space, default theme, video".
		 */
		#getItemLabel(theme) {
			let label = this.#applyThemeTitle('BITRIX24_THEME_ITEM_LABEL', this.#getThemeTitle(theme));
			if (theme.default === true) {
				label = this.#applyThemeTitle('BITRIX24_THEME_ITEM_LABEL_DEFAULT', label);
			}
			if (theme.new === true) {
				label = this.#applyThemeTitle('BITRIX24_THEME_ITEM_LABEL_NEW', label);
			}
			if (theme.video) {
				label = this.#applyThemeTitle('BITRIX24_THEME_ITEM_LABEL_VIDEO', label);
			}
			return label;
		}

		// Custom themes created before the server started sending a title fall back to a generic name.
		#getThemeTitle(theme) {
			return main_core.Type.isStringFilled(theme.title) ? theme.title : this.#getMessage('BITRIX24_THEME_CUSTOM_THEME_FALLBACK');
		}
		#applyThemeTitle(phraseCode, title) {
			const phrase = this.#getMessage(phraseCode, {
				'#TITLE#': title
			});
			return phrase === '' ? title : phrase;
		}

		// Politely and only about the outcome: applying and removing a theme, never the stream of loaders.
		#announceTheme(phraseCode, theme, cell) {
			if (!theme || !this.#isGridCell(cell)) {
				return;
			}
			ui_a11y.LiveAnnouncer.announce(this.#getMessage(phraseCode, {
				'#TITLE#': this.#getThemeTitle(theme)
			}));
		}
		#getMessage(phraseCode, replacements = null) {
			const phrase = main_core.Loc.getMessage(phraseCode, replacements);
			return main_core.Type.isStringFilled(phrase) ? phrase : '';
		}
		createItem(theme) {
			let className = 'theme-dialog-item';
			if (theme.video) {
				className += ' theme-dialog-item-video';
			}
			if (this.#themePicker.getAppliedThemeId() === theme.id) {
				className += ' theme-dialog-item-selected';
			}
			const title = this.#getThemeTitle(theme);
			const div = main_core.Tag.render`
			<div
				class="${className}"
				data-theme-id="${theme.id}"
				onclick="${this.handleItemClick.bind(this)}"
			>
				<div class="theme-dialog-item-title">
					<span class="theme-dialog-item-title-text">${main_core.Text.encode(title)}</span>
					${theme.removable ? this.#createRemoveButton(theme) : ''}
				</div>
				${theme.default === true ? this.#createDefaultLabel() : ''}
				${theme.new === true ? this.#createNewLabel() : ''}
			</div>
		`;
			if (main_core.Type.isStringFilled(theme.previewImage)) {
				const img = main_core.Tag.render`
				<img
					src="${encodeURI(theme.previewImage)}"
					alt=""
					class="theme-dialog-item-preview-img"
					loading="lazy"
				>
			`;
				main_core.Dom.append(img, div);
			}
			if (main_core.Type.isStringFilled(theme.previewColor)) {
				main_core.Dom.style(div, 'background-color', theme.previewColor);
			}
			return div;
		}

		/**
		 * `tabindex="-1"`: the button is reached inside the cell, not by a Tab stop of its own.
		 *
		 * The name of the button is its `title` and nothing else. A `title` that named an element is not
		 * offered as its description on top of that, while any name beside the `title` leaves the `title`
		 * to be read again right after the name - measured in the tree, and identical strings are not
		 * folded either. So one phrase carries both roles: the tooltip of the mouse and the name.
		 */
		#createRemoveButton(theme) {
			return main_core.Tag.render`
			<button
				type="button"
				class="theme-dialog-item-remove"
				data-theme-id="${theme.id}"
				data-testid="bx-theme-picker-theme-remove"
				tabindex="-1"
				title="${this.#getMessage('BITRIX24_THEME_REMOVE_THEME')}"
				onclick="${this.handleRemoveBtnClick.bind(this)}"
			></button>
		`;
		}
		getNewThemeDialog() {
			if (!this.#newThemeDialog) {
				this.#newThemeDialog = new NewThemeDialog(this.#themePicker, this);
				this.#newThemeDialog.subscribe('onDestroy', () => {
					this.#newThemeDialog = null;
				});
			}
			return this.#newThemeDialog;
		}
		handleItemClick(event) {
			this.#selectItem(this.getItemNode(event));
		}
		handleRemoveBtnClick(event) {
			const item = this.getItemNode(event);
			if (!item) {
				return;
			}
			const themeId = item.dataset.themeId;
			const theme = this.#themePicker.getTheme(themeId);
			this.#themePicker.removeTheme(themeId);
			this.#focusCellNeighbour(item);
			main_core.Dom.remove(item);
			this.#announceTheme('BITRIX24_THEME_ANNOUNCE_REMOVED', theme, item);
			if (this.#themePicker.getAppliedThemeId() === themeId) {
				const firstItem = this.getContentContainer().children[0];
				this.#selectItem(firstItem);
				if (this.#themePicker.getThemeId() === themeId && firstItem && firstItem.dataset.themeId) {
					this.#saveTheme(firstItem.dataset.themeId);
				}
			} else if (this.#themePicker.getThemeId() === themeId) {
				this.#saveTheme(this.#themePicker.getAppliedThemeId());
			}
			void this.#ajax({
				action: 'remove',
				themeId
			});
			event.stopPropagation();
		}
		#saveTheme(themeId) {
			const theme = this.#themePicker.getTheme(themeId);
			const eventData = {
				theme,
				themeId,
				setDefaultTheme: this.#isCheckboxChecked()
			};
			main_core_events.EventEmitter.emit('Intranet.ThemePicker:onSaveTheme', new main_core_events.BaseEvent({
				data: eventData,
				compatData: [eventData]
			}));
			const data = new FormData();
			data.append('action', 'save');
			data.append('themeId', themeId);
			data.append('setDefaultTheme', this.#isCheckboxChecked());
			void this.#ajax(data);
			this.#themePicker.setThemeId(themeId);
		}
		getItemNode(event) {
			if (!event || !event.target) {
				return null;
			}
			const item = event.target.closest('.theme-dialog-item');
			return main_core.Type.isDomNode(item) ? item : null;
		}
		getContentContainer() {
			return this.#themePicker.getDialogPopup().getContentContainer().querySelector('.theme-dialog-content');
		}
		#createDefaultLabel() {
			return main_core.Tag.render`
			<div class="theme-dialog-item-default">
				${main_core.Loc.getMessage('BITRIX24_THEME_DEFAULT_THEME')}
			</div>
		`;
		}
		#createNewLabel() {
			return main_core.Tag.render`
			<div class="theme-dialog-item-new">
				${main_core.Loc.getMessage('BITRIX24_THEME_NEW_THEME')}
			</div>
		`;
		}
		#selectItem(item) {
			if (!main_core.Type.isDomNode(item) || !main_core.Dom.hasClass(item, 'theme-dialog-item')) {
				return;
			}
			const themeId = item.dataset.themeId;
			this.getContentContainer().querySelectorAll('div.theme-dialog-item[data-theme-id]').forEach(currentItem => {
				main_core.Dom.removeClass(currentItem, 'theme-dialog-item-selected');
				this.#markCellSelected(currentItem, false);
			});
			main_core.Dom.addClass(item, 'theme-dialog-item-selected');
			this.#markCellSelected(item, true);
			if (this.#themePicker.needReturnValue()) {
				this.#themePicker.setReturnValue(themeId);
			} else {
				const loader = new main_loader.Loader({
					size: 100
				});
				loader.show(item);
				this.preloadTheme(themeId, async () => {
					const theme = this.#themePicker.getTheme(themeId);
					if (main_core.Type.isStringFilled(theme.bgImageUrlToBlur)) {
						try {
							await this.makeCustomThemeBlurred(theme);
						} catch (ex) {
							console.error(ex);
						}
					}
					if (main_core.Dom.hasClass(item, 'theme-dialog-item-selected'))
						// by this time user could select another theme
						{
							loader.hide();
							if (this.applyTheme(themeId)) {
								this.#announceTheme('BITRIX24_THEME_ANNOUNCE_APPLIED', theme, item);
							}
						}
				});
			}
		}

		/**
		 * Whether the theme became the applied one.
		 *
		 * The answer is what the announcement goes by: a click on the theme that is already applied runs
		 * the whole cycle again and changes nothing, and without the answer it read the same outcome out
		 * a second time.
		 */
		applyTheme(themeId) {
			if (!main_core.Type.isStringFilled(themeId) || themeId === this.#themePicker.getAppliedThemeId()) {
				return false;
			}
			const theme = this.#themePicker.getTheme(themeId);
			if (!theme) {
				return false;
			}
			const eventData = {
				id: themeId,
				theme
			};
			main_core_events.EventEmitter.emit('BX.Intranet.Bitrix24:ThemePicker:onThemeApply', new main_core_events.BaseEvent({
				data: eventData,
				compatData: [eventData]
			}));
			this.applyThemeAssets(theme);
			this.removeThemeAssets(this.#themePicker.getAppliedThemeId());
			this.#themePicker.setAppliedThemeId(themeId);
			this.appliedTheme = theme;
			main_core_events.EventEmitter.emit('BX.Intranet.Bitrix24:ThemePicker:onThemeAfterApply', {
				id: themeId,
				theme
			});
			return true;
		}
		applyThemeAssets(assets) {
			if (!assets || !main_core.Type.isArray(assets.css) || !main_core.Type.isStringFilled(assets.id)) {
				return;
			}
			const head = document.head;
			const themeId = assets.id;
			assets.css.forEach(file => {
				const link = main_core.Tag.render`
				<link type="text/css" rel="stylesheet" href="${file}" data-theme-id="${themeId}">
			`;
				head.appendChild(link);
			});
			if (main_core.Type.isStringFilled(assets.style)) {
				const style = main_core.Tag.render`
				<style type="text/css" data-theme-id="${themeId}">
					${assets.style}
				</style>
			`;
				head.appendChild(style);
			}
			if (assets.video && main_core.Type.isPlainObject(assets.video.sources)) {
				const sources = [];
				for (const type in assets.video.sources) {
					sources.push(main_core.Tag.render`<source type="video/${type}" src="${assets.video.sources[type]}">`);
				}
				const video = main_core.Tag.render`
				<div class="theme-video-container" data-theme-id="${themeId}">
					<video
						class="theme-video"
						poster="${assets.video.poster}"
						autoplay
						loop
						muted
						playsinline
						data-theme-id="${themeId}"
					>
						${sources}
					</video>
				</div>
			`;
				document.body.insertBefore(video, document.body.firstElementChild);
			}
			const appliedBaseThemeId = this.#themePicker.getAppliedThemeId().split(':')[0];
			const baseThemeId = themeId.split(':')[0];
			const contexts = {
				light: '--ui-context-edge-dark',
				dark: '--ui-context-edge-light',
				default: '--ui-context-edge-light'
			};
			if (appliedBaseThemeId !== baseThemeId) {
				main_core.Dom.removeClass(document.body, [`bitrix24-${appliedBaseThemeId}-theme`, contexts[appliedBaseThemeId]]);
				main_core.Dom.addClass(document.body, [`bitrix24-${baseThemeId}-theme`, contexts[baseThemeId]]);
			}
		}
		removeThemeAssets(themeId) {
			const styles = document.head.querySelectorAll(`[data-theme-id="${themeId}"]`);
			for (const style of styles) {
				main_core.Dom.remove(style);
			}
			main_core.Dom.remove(document.querySelector(`body > [data-theme-id="${themeId}"]`));
		}
		preloadTheme(themeId, callback) {
			const fn = main_core.Type.isFunction(callback) ? callback : () => {};
			const theme = this.#themePicker.getTheme(themeId);
			if (!theme) {
				fn();
				return;
			}
			let asyncCount = 2; // preloadImages & preloadCss
			const onload = () => {
				asyncCount--;
				if (asyncCount === 0) {
					fn();
				}
			};
			this.preloadImages(theme.prefetchImages, onload);
			this.#preloadCss(theme.css, onload);
		}
		preloadImages(images, callback) {
			const fn = main_core.Type.isFunction(callback) ? callback : () => {};
			if (!main_core.Type.isArrayFilled(images)) {
				fn();
				return;
			}
			let loaded = 0;
			images.forEach(imageSrc => {
				const image = new Image();
				image.src = encodeURI(imageSrc);
				image.onload = image.onerror = () => {
					loaded++;
					if (loaded === images.length) {
						fn();
					}
				};
			});
		}
		#preloadCss(css, fn) {
			if (!main_core.Type.isArray(css)) {
				if (main_core.Type.isFunction(fn)) {
					fn();
				}
				return;
			}
			const iframe = main_core.Tag.render`<iframe src="javascript:void(0)" style="display: none"></iframe>`;
			document.body.appendChild(iframe);
			const iframeDoc = iframe.contentWindow.document;
			if (!iframeDoc.body) {
				// null in IE
				iframeDoc.write('<body></body>');
			}

			// to avoid a conflict between a theme's preload image and a <body>'s image from preload css files
			iframeDoc.body.style.cssText = 'background: #fff !important';
			BX.load(css, () => {
				main_core.Dom.remove(iframe);
				if (main_core.Type.isFunction(fn)) {
					fn();
				}
			}, iframeDoc);
		}
	}

	exports.ThemePickerDialog = ThemePickerDialog;

})(this.BX.Intranet.Bitrix24.ThemePicker = this.BX.Intranet.Bitrix24.ThemePicker || {}, BX, BX.Event, BX.Main, BX, BX.UI.Accessibility, BX.UI, BX.Cache, BX.UI.Uploader);
//# sourceMappingURL=dialog.bundle.js.map
