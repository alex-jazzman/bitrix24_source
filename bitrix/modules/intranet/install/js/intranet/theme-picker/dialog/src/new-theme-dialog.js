import { Type, ajax as Ajax, Loc, Tag, Dom, Reflection } from 'main.core';
import { MemoryCache, type BaseCache } from 'main.core.cache';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { PopupWindowButton, PopupWindowButtonLink, Popup } from 'main.popup';
import { VisuallyHidden } from 'ui.a11y';
import { Uploader, UploaderEvent, assignFileToInput, type UploaderError, type UploaderFile } from 'ui.uploader.core';
import { Loader } from 'main.loader';

import { ThemePickerDialog } from './theme-picker-dialog';
import { blur } from './blur';

import { type ThemePicker } from 'intranet.theme-picker';

const BG_IMAGE_FIELD_ID = 'theme-dialog-field-bg-image';
const BG_IMAGE_HINT_ID = 'theme-dialog-field-bg-image-hint';
const BG_IMAGE_UPLOAD_ID = 'theme-dialog-field-bg-image-upload';
const BG_IMAGE_KEYBOARD_HINT_ID = 'theme-dialog-field-bg-image-keyboard-hint';
const BG_COLOR_FIELD_ID = 'theme-dialog-field-bg-color-input';
const TEXT_COLOR_LABEL_ID = 'theme-dialog-field-text-color-label';
const FORM_ALERT_TEXT_ID = 'theme-dialog-form-alert-content';

type FormError = {
	field: HTMLElement,
	message: string,
	description?: string,
};

export class NewThemeDialog extends EventEmitter
{
	#themePicker: ThemePicker;
	#listDialog: ThemePickerDialog;
	#colorPicker: Object = null;
	#popup: Popup = null;
	#previewApplied: boolean = false;
	#origAppliedThemeId: string = null;
	#uploader: Uploader | null = null;
	#refs: BaseCache<HTMLElement> = new MemoryCache();
	#previewLoader: Loader | null = null;
	#creator: HTMLElement | null = null;

	constructor(themePicker: ThemePicker, listDialog: ThemePickerDialog)
	{
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
	show(): void
	{
		this.#creator = this.#themePicker.getDialogPopup().getButton('create-button')?.getContainer() ?? null;

		this.#getPopup().setContent(this.#getContent());
		this.#getPopup().show();
		this.#themePicker.disableThemeListDialog();
		this.#getControl('field-file-browse')?.focus();
	}

	destroy(): void
	{
		this.#resetResources();
		this.#getPopup().destroy();
		this.#popup = null;
		this.#refs = null;
	}

	getUploader(): Uploader
	{
		this.#uploader ??= new Uploader({
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
				[UploaderEvent.BEFORE_DROP]: (event: BaseEvent<{ dragEvent: DragEvent }>) => {
					this.#fillBgImageField(event.getData().dragEvent.dataTransfer);
				},
				[UploaderEvent.FILE_LOAD_START]: () => {
					this.#hidePreview();
					this.#previewLoader = new Loader({ size: 40 });
					this.#previewLoader.show(this.#getControl('field-file-preview'));
				},
				[UploaderEvent.FILE_ERROR]: (event: BaseEvent<{ error: UploaderError }>) => {
					const error: UploaderError = event.getData().error;
					// The upload fails on its own time, so the field is marked but the focus stays where
					// the person left it: the alert tells about the error by itself.
					this.#showError(error.getMessage(), error.getDescription());
					this.#setFieldInvalid(this.#getControl('field-file-browse'), true);
					this.#previewLoader?.destroy();
					this.#previewLoader = null;
				},
				[UploaderEvent.FILE_COMPLETE]: async (event: BaseEvent<{ file: UploaderFile }>) => {
					this.#hideError();
					const file: UploaderFile = event.getData().file;
					this.#nameBgImageField(file);
					const preview = file.getClientPreview();
					const { file: bgImageBlurred, color } = await blur(preview, 7);

					if (file.isAnimated())
					{
						file.setCustomData('bgImageAnimated', true);
					}
					else
					{
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
				},
			},
		});

		return this.#uploader;
	}

	#resetResources(): void
	{
		if (this.#getBgImageBlurredUrl() !== null)
		{
			URL.revokeObjectURL(this.#getBgImageBlurredUrl());
		}

		this.#uploader?.destroy();
		this.#uploader = null;

		if (this.#previewApplied)
		{
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
	#returnFocusToListDialog(): void
	{
		const creator = this.#creator;
		this.#creator = null;

		const target = creator?.isConnected === true ? creator : this.#getEntryCell();

		this.#themePicker.focusInDialog(target, this.#popup);
	}

	#getEntryCell(): ?HTMLElement
	{
		const content = this.#listDialog.getContentContainer();

		return content?.querySelector('[role="gridcell"][aria-selected="true"]')
			?? content?.querySelector('[role="gridcell"]')
			?? null
		;
	}

	#getBgImage(): UploaderFile | null
	{
		return this.getUploader().getFiles()[0] || null;
	}

	#getBgImageUrl(): string | null
	{
		return this.#getBgImage()?.getPreviewUrl() || null;
	}

	#isBgImageAnimated(): boolean
	{
		return this.#getBgImage()?.getCustomData('bgImageAnimated') || false;
	}

	#getBgImageBlurred(): File | null
	{
		return this.#getBgImage()?.getCustomData('bgImageBlurred') || null;
	}

	#getBgImageBlurredUrl(): string | null
	{
		return this.#getBgImage()?.getCustomData('bgImageBlurredUrl') || null;
	}

	#getBgColor(): string
	{
		const color = this.#getControl('field-bg-color').value;

		return this.#validateBgColor(color) ? color : null;
	}

	#getTextColor(): string
	{
		return this.#getControl('field-text-color').value;
	}

	#getControl(name: string): HTMLElement
	{
		return this.#getPopup().getContentContainer().querySelector(`.theme-dialog-${name}`);
	}

	#getControls(name: string): NodeList
	{
		return this.#getPopup().getContentContainer().querySelectorAll(`.theme-dialog-${name}`);
	}

	#getPopup(): Popup
	{
		if (this.#popup)
		{
			return this.#popup;
		}

		const createButton = new PopupWindowButton({
			id: 'theme-dialog-create-button',
			text: Loc.getMessage('BITRIX24_THEME_DIALOG_CREATE_BUTTON'),
			className: 'popup-window-button-accept',
			events: {
				click: this.#handleCreateButtonClick.bind(this),
			},
		});

		const cancelButton = new PopupWindowButtonLink({
			text: Loc.getMessage('BITRIX24_THEME_DIALOG_CANCEL_BUTTON'),
			className: 'popup-window-button-link theme-dialog-button-link',
			events: {
				click: () => {
					this.#popup.close();
				},
			},
		});

		Dom.attr(createButton.buttonNode, 'data-testid', 'bx-theme-picker-new-theme-create');
		Dom.attr(cancelButton.buttonNode, 'data-testid', 'bx-theme-picker-new-theme-cancel');

		this.#popup = new Popup({
			width: 500,
			height: 560,
			fixed: true,
			titleBar: Loc.getMessage('BITRIX24_THEME_CREATE_YOUR_OWN_THEME'),
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
				},
			},
			buttons: [createButton, cancelButton],
		});

		Dom.attr(this.#popup.getPopupContainer(), 'data-testid', 'bx-theme-picker-new-theme-dialog');

		return this.#popup;
	}

	#getColorPicker(): ?Object
	{
		if (this.#colorPicker)
		{
			return this.#colorPicker;
		}

		const ColorPicker = Reflection.getClass('BX.ColorPicker');

		if (ColorPicker)
		{
			this.#colorPicker = new ColorPicker({
				onColorSelected: this.#handleBgColorSelect.bind(this),
				popupOptions: {
					fixed: true,
				},
			});
		}

		return this.#colorPicker;
	}

	#handleCreateButtonClick(): void
	{
		if (this.#getCreateButton().getContainer().disabled)
		{
			// double click protection
			return;
		}

		const error = this.#validateForm();
		if (error !== null)
		{
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
		data.append('sessid', Loc.getMessage('bitrix_sessid'));
		data.append('siteId', this.#themePicker.getSiteId());
		data.append('templateId', this.#themePicker.getTemplateId());

		let postSize = 0;
		for (const [key, value] of data.entries())
		{
			postSize += key.length;
			postSize += value instanceof Blob ? value.size : value.length;
		}

		if (postSize > this.#themePicker.getMaxUploadSize())
		{
			const limit = this.#themePicker.getMaxUploadSize() / 1024 / 1024;

			this.#reportFieldError(
				this.#getControl('field-file-browse'),
				Loc.getMessage('BITRIX24_THEME_FILE_SIZE_EXCEEDED', { '#LIMIT#': `${limit.toFixed(0)}Mb` }),
			);

			return;
		}

		this.#setBusy(true);

		Ajax({
			url: this.#themePicker.getAjaxHandlerPath(),
			method: 'POST',
			dataType: 'json',
			preparePost: false,
			data,
			onsuccess: (response) => {
				if (response && response.success && response.theme)
				{
					this.#listDialog.addItem(response.theme);
					this.#listDialog.preloadTheme(response.theme.id, () => {
						this.#setBusy(false);

						this.#removeThemePreview();
						this.#getPopup().close();
					});
				}
				else
				{
					this.#setBusy(false);
					this.#showError(response.error || Loc.getMessage('BITRIX24_THEME_UNKNOWN_ERROR'));
				}
			},
			onfailure: () => {
				this.#setBusy(false);
				this.#showError(Loc.getMessage('BITRIX24_THEME_UNKNOWN_ERROR'));
			},
		});
	}

	#getContent(): HTMLElement
	{
		return Tag.render`
			<form
				name="theme-new-theme-form"
				method="post"
				data-testid="bx-theme-picker-new-theme-form"
				onsubmit="${(event) => event.preventDefault()}"
			>
				<div class="theme-dialog-form-alert" role="alert" data-testid="bx-theme-picker-form-alert">
					<div class="theme-dialog-form-alert-content" id="${FORM_ALERT_TEXT_ID}"></div>
					<button
						type="button"
						class="theme-dialog-form-alert-remove"
						data-testid="bx-theme-picker-form-alert-close"
						aria-label="${Loc.getMessage('BITRIX24_THEME_FORM_ALERT_CLOSE_LABEL')}"
						onclick="${this.#hideError.bind(this)}"
					></button>
				</div>
				<div class="theme-dialog-form">
					${this.#createField(
						Loc.getMessage('BITRIX24_THEME_THEME_BG_IMAGE'),
						this.#getBgImageField(),
						BG_IMAGE_FIELD_ID,
					)}
					${this.#createField(
						Loc.getMessage('BITRIX24_THEME_THEME_BG_COLOR'),
						this.#getBgColorField(),
						BG_COLOR_FIELD_ID,
					)}
					${this.#createFieldGroup(
						Loc.getMessage('BITRIX24_THEME_THEME_TEXT_COLOR'),
						this.#getTextColorField(),
						TEXT_COLOR_LABEL_ID,
					)}
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
	#showError(message: string, description: string = ''): void
	{
		this.#clearInvalidFields();

		Dom.addClass(this.#getControl('form-alert'), 'theme-dialog-form-alert-show');

		const content = this.#getControl('form-alert-content');
		Dom.clean(content);
		Dom.append(Dom.create('div', { text: message }), content);

		if (Type.isStringFilled(description))
		{
			Dom.append(Dom.create('div', { text: description }), content);
		}
	}

	#hideError(): void
	{
		Dom.removeClass(this.#getControl('form-alert'), 'theme-dialog-form-alert-show');
		// the region stays in the tree, so the text of an error that no longer holds has to go with it
		Dom.clean(this.#getControl('form-alert-content'));
		this.#clearInvalidFields();
	}

	// The alert text names the problem, so the field it belongs to points at it with a description
	// and takes the focus.
	#reportFieldError(field: HTMLElement, message: string, description: string = ''): void
	{
		this.#showError(message, description);
		this.#setFieldInvalid(field, true);
		field.focus();
	}

	/**
	 * While the error stands, the alert text is the description of the field. The file field carries
	 * a description of its own, so the reference joins the list instead of replacing it.
	 */
	#setFieldInvalid(field: HTMLElement, invalid: boolean): void
	{
		Dom.attr(field, 'aria-invalid', invalid ? 'true' : null);

		const describedBy = (field.getAttribute('aria-describedby') || '')
			.split(' ')
			.filter((id) => id !== '' && id !== FORM_ALERT_TEXT_ID)
		;

		if (invalid)
		{
			describedBy.push(FORM_ALERT_TEXT_ID);
		}

		Dom.attr(field, 'aria-describedby', describedBy.length > 0 ? describedBy.join(' ') : null);
	}

	#clearInvalidFields(): void
	{
		const fields = this.#getPopup().getContentContainer().querySelectorAll('[aria-invalid="true"]');

		[].forEach.call(fields, (field) => {
			this.#setFieldInvalid(field, false);
		});
	}

	/**
	 * `aria-busy` and a native `disabled` on every control of the form: `pointer-events: none` alone
	 * left the form reachable from the keyboard and the request could be sent twice. The class stays
	 * for the pointer - dropping a file on the zone is not a control, and `disabled` does not stop it.
	 */
	#setBusy(busy: boolean): void
	{
		const form = this.#getForm();
		const createButton = this.#getCreateButton();

		Dom.attr(form, 'aria-busy', busy ? 'true' : null);
		Dom.toggleClass(form, 'theme-dialog-form-disabled', busy);

		[].forEach.call(form.querySelectorAll('input, button'), (control) => {
			Dom.attr(control, 'disabled', busy ? '' : null);
		});

		if (busy)
		{
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
		if (this.#isFocusLost() && createButton.getContainer().isConnected)
		{
			createButton.getContainer().focus();
		}
	}

	#isFocusLost(): boolean
	{
		const activeElement = document.activeElement;

		return !Type.isElementNode(activeElement)
			|| activeElement === document.body
			|| !activeElement.isConnected
		;
	}

	#getForm(): HTMLFormElement
	{
		return this.#getPopup().getContentContainer().querySelector('form');
	}

	#getCreateButton(): PopupWindowButton
	{
		return this.#getPopup().getButton('theme-dialog-create-button');
	}

	#createField(title: string, field: HTMLElement, controlId: string): HTMLElement
	{
		return Tag.render`
			<div class="theme-dialog-field">
				<label class="theme-dialog-field-label" for="${controlId}">${title}</label>
				<div class="theme-dialog-field-value">${field}</div>
			</div>
		`;
	}

	// A label names a single control, so a field built of several controls is named as a group.
	#createFieldGroup(title: string, field: HTMLElement, labelId: string): HTMLElement
	{
		return Tag.render`
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
	#getBgColorField(): HTMLElement
	{
		return Tag.render`
			<div class="theme-dialog-field-textbox-wrapper">
				<button
					type="button"
					class="theme-dialog-field-textbox-color"
					data-testid="bx-theme-picker-bg-color-palette"
					aria-haspopup="dialog"
					aria-label="${Loc.getMessage('BITRIX24_THEME_BG_COLOR_PALETTE_LABEL')}"
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
					aria-label="${Loc.getMessage('BITRIX24_THEME_BG_COLOR_CLEAR_LABEL')}"
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
	#getBgImageField(): HTMLElement
	{
		return this.#refs.remember('image-field', () => {
			const browseField = Tag.render`
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

			const imageField = Tag.render`
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
								${Loc.getMessage('BITRIX24_THEME_UPLOAD_BG_IMAGE')}
							</span>
							<span class="theme-dialog-field-file-add-info" id="${BG_IMAGE_HINT_ID}" aria-hidden="true">
								${Loc.getMessage('BITRIX24_THEME_DRAG_BG_IMAGE')}
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
	#createBgImageKeyboardHint(): HTMLElement
	{
		const hint = new VisuallyHidden();
		hint.id = BG_IMAGE_KEYBOARD_HINT_ID;
		hint.textContent = Loc.getMessage('BITRIX24_THEME_BG_IMAGE_KEYBOARD_HINT');
		Dom.attr(hint, 'aria-hidden', 'true');

		return hint;
	}

	// The field of the error is the one the focus goes to; for an empty form that is the first field
	// of the form.
	#validateForm(): ?FormError
	{
		const bgImage = this.#getBgImage();
		const bgColor = this.#getControl('field-bg-color').value;

		if (Type.isStringFilled(bgColor) && !this.#validateBgColor(bgColor))
		{
			return {
				field: this.#getControl('field-bg-color'),
				message: Loc.getMessage('BITRIX24_THEME_WRONG_BG_COLOR'),
			};
		}

		if (!bgImage && !Type.isStringFilled(bgColor))
		{
			return {
				field: this.#getControl('field-file-browse'),
				message: Loc.getMessage('BITRIX24_THEME_EMPTY_FORM_DATA'),
			};
		}

		if (bgImage && bgImage.isFailed())
		{
			return {
				field: this.#getControl('field-file-browse'),
				message: bgImage.getError().getMessage(),
				description: bgImage.getError().getDescription(),
			};
		}

		return null;
	}

	#validateBgColor(color: string): boolean
	{
		return Type.isStringFilled(color) && color.match(/^#([\dA-Fa-f]{6})$/);
	}

	#showPreview(previewUrl: string): void
	{
		const preview = this.#getControl('field-file-preview');
		Dom.style(preview, 'background-image', `url("${encodeURI(previewUrl)}")`);
	}

	#hidePreview(): void
	{
		const preview = this.#getControl('field-file-preview');
		Dom.style(preview, 'background-image', null);
	}

	/**
	 * A batch of several files is refused by the uploader as a whole, because the zone takes one,
	 * and then the field has to stay empty too: naming one file of a batch the form did not take
	 * would be a lie of its own, in the other direction.
	 */
	#fillBgImageField(transfer: ?DataTransfer): void
	{
		const files = transfer?.files ?? [];
		if (files.length !== 1)
		{
			return;
		}

		assignFileToInput(this.#getControl('field-file-browse'), files[0]);
	}

	/**
	 * The uploader empties the field as soon as it has taken the file from it, so a picture chosen
	 * through the system dialog left the control saying that nothing is chosen - and that value is
	 * what a screen reader reads off it. The field is named back by the file the form will really
	 * send; assigning `files` raises no `change`, so the uploader does not take the file a second time.
	 */
	#nameBgImageField(file: UploaderFile): void
	{
		const binary = file.getBinary();
		if (binary !== null)
		{
			assignFileToInput(this.#getControl('field-file-browse'), binary);
		}
	}

	/**
	 * The field is emptied before the system dialog opens: while it still names a picture, choosing
	 * that very picture again raises no `change`, and the uploader never learns about it. A dismissed
	 * dialog puts the name back.
	 */
	#handleBgImageBrowseClick(): void
	{
		this.#getControl('field-file-browse').value = '';
	}

	#handleBgImageBrowseCancel(): void
	{
		const file = this.#getBgImage();
		if (file !== null)
		{
			this.#nameBgImageField(file);
		}
	}

	#handleBgImageEnter(event: DragEvent): void
	{
		Dom.addClass(this.#getControl('field-button'), 'theme-dialog-field-button-hover');
		event.stopPropagation();
		event.preventDefault();
	}

	#handleBgImageLeave(event: DragEvent): void
	{
		Dom.removeClass(this.#getControl('field-button'), 'theme-dialog-field-button-hover');

		event.stopPropagation();
		event.preventDefault();
	}

	#handleBgImageOver(event: DragEvent): void
	{
		event.stopPropagation();
		event.preventDefault();
	}

	#handleBgColorClick(): void
	{
		this.#getColorPicker().open({
			bindElement: this.#getControl('field-bg-color'),
		});
	}

	#handleBgColorChange(): void
	{
		if (this.#getBgColor())
		{
			this.#hideError();
		}

		this.#applyThemePreview();
	}

	#handleBgColorClear(): void
	{
		this.#getColorPicker().close();

		this.#getControl('field-bg-color').value = '';
		this.#setBgColorFilled(false);
		Dom.style(this.#getControl('field-textbox-color'), 'backgroundColor', null);

		this.#applyThemePreview();
	}

	#handleBgColorSelect(color: string): void
	{
		this.#setBgColor(color);
		this.#hideError();
		this.#applyThemePreview();
	}

	#setBgColor(color: string): void
	{
		this.#getControl('field-bg-color').value = color;
		this.#setBgColorFilled(true);
		Dom.style(this.#getControl('field-textbox-color'), 'backgroundColor', color);
	}

	// One point for the emptiness of the color field: the resting look of the clear button is driven
	// by the class, its availability by `disabled`, and split sources would let the two drift apart.
	#setBgColorFilled(filled: boolean): void
	{
		Dom.toggleClass(this.#getControl('field-bg-color'), 'theme-dialog-field-textbox-not-empty', filled);
		this.#getControl('field-textbox-remove').disabled = !filled;
	}

	#isBgColorFilled(): boolean
	{
		return Dom.hasClass(this.#getControl('field-bg-color'), 'theme-dialog-field-textbox-not-empty');
	}

	#setTextColor(color: 'light' | 'dark'): void
	{
		const switchers = this.#getControls('field-button-switcher-item');

		[].forEach.call(switchers, (switcher) => {
			const pressed = switcher.dataset.textColor === color;

			Dom.toggleClass(switcher, 'theme-dialog-field-button-switcher-item-pressed', pressed);
			Dom.attr(switcher, 'aria-pressed', pressed ? 'true' : 'false');
		});

		this.#getControl('field-text-color').value = color;
	}

	// Two toggle buttons over one hidden value: the value is what the form posts, `aria-pressed` is
	// what says which of the two is chosen.
	#getTextColorField(): HTMLElement
	{
		return Tag.render`
			<div class="theme-dialog-field-button-switcher">
				<button
					type="button"
					class="theme-dialog-field-button-switcher-item theme-dialog-field-button-switcher-item-left theme-dialog-field-button-switcher-item-pressed"
					data-text-color="light"
					data-testid="bx-theme-picker-text-color-light"
					aria-pressed="true"
					onclick="${this.#handleSwitcherClick.bind(this)}"
				>
					${Loc.getMessage('BITRIX24_THEME_THEME_LIGHT_COLOR')}
				</button>
				<button
					type="button"
					class="theme-dialog-field-button-switcher-item theme-dialog-field-button-switcher-item-right"
					data-text-color="dark"
					data-testid="bx-theme-picker-text-color-dark"
					aria-pressed="false"
					onclick="${this.#handleSwitcherClick.bind(this)}"
				>
					${Loc.getMessage('BITRIX24_THEME_THEME_DARK_COLOR')}
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

	#handleSwitcherClick(event: MouseEvent): void
	{
		const color = event.currentTarget.dataset.textColor;
		this.#setTextColor(color);
		this.#applyThemePreview();
	}

	#applyThemePreview(): void
	{
		if (this.#getBgImage() === null && this.#getBgColor() === null)
		{
			if (this.#previewApplied)
			{
				this.#listDialog.applyTheme(this.#origAppliedThemeId);
			}

			return;
		}

		const baseThemes = this.#themePicker.getBaseThemes();
		const baseThemeId = this.#getTextColor();
		if (!baseThemes[baseThemeId] || !Type.isArray(baseThemes[baseThemeId].css))
		{
			return;
		}

		let style = ':root { ';

		if (this.#getBgImageUrl() !== null)
		{
			style += '--air-theme-bg-size: cover;';
			style += '--air-theme-bg-repeat: no-repeat;';
			style += '--air-theme-bg-position: 0 0;';
			style += '--air-theme-bg-attachment: fixed;';
			style += `--air-theme-bg-image: url("${encodeURI(this.#getBgImageUrl())}");`;

			if (this.#getBgImageBlurredUrl() !== null)
			{
				style += `--air-theme-bg-image-blurred: url("${encodeURI(this.#getBgImageBlurredUrl())}");`;
			}
		}

		if (this.#getBgColor())
		{
			style += `--air-theme-bg-color: ${this.#getBgColor()}; `;
		}

		style += ' }';

		if (!this.#previewApplied)
		{
			this.#origAppliedThemeId = this.#themePicker.getAppliedThemeId();
		}

		this.#listDialog.removeThemeAssets(this.#themePicker.getAppliedThemeId());

		this.#listDialog.applyThemeAssets({
			id: this.#getPreviewThemeId(),
			css: baseThemes[baseThemeId].css,
			style,
		});

		this.#themePicker.setAppliedThemeId(this.#getPreviewThemeId());

		this.#previewApplied = true;
	}

	#removeThemePreview(): void
	{
		this.#listDialog.removeThemeAssets(this.#getPreviewThemeId());
		this.#previewApplied = false;
	}

	#getPreviewThemeId(): string
	{
		return `${this.#getTextColor()}:custom_live_preview`;
	}

	#chooseTextColor(color: string): 'light' | 'dark'
	{
		let hexColor = color.replace(/^#/, '');
		if (hexColor.length === 3)
		{
			hexColor = [...hexColor].map((c) => c + c).join('');
		}

		const r = parseInt(hexColor.slice(0, 2), 16);
		const g = parseInt(hexColor.slice(2, 4), 16);
		const b = parseInt(hexColor.slice(4, 6), 16);

		const brightness = (r * 299 + g * 587 + b * 114) / 1000;

		return brightness > 186 ? 'dark' : 'light';
	}
}
