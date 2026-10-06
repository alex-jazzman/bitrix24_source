import { Dom, Event, Loc, Tag } from 'main.core';
import { Dialog } from 'ui.system.dialog';
import { Input, InputSize } from 'ui.system.input';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';

import { renderIcon } from '../utils/icons.js';
import { readImageSize } from '../utils/image-size.js';

export const TITLE_MIN_LENGTH = 2;
export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

export const ICON_ACTION_KEEP = 'keep';
export const ICON_ACTION_REPLACE = 'replace';
export const ICON_ACTION_DELETE = 'delete';

export const ICON_MAX_BYTES = 5 * 1024 * 1024;
export const ICON_MAX_PIXELS = 4_000_000;
const ICON_ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', 'image/x-ms-bmp']);
const ICON_ACCEPT_ATTRIBUTE = 'image/png,image/jpeg,image/gif,image/webp,image/bmp';
const ICON_PREVIEW_SIZE = 45;

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/;
// eslint-disable-next-line no-control-regex
const DESCRIPTION_CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const DESCRIPTION_ROWS = 4;

type CatalogIconAction = 'keep' | 'replace' | 'delete';

type CatalogRenamePayload = {
	title: string,
	description: string,
	titleChanged: boolean,
	descriptionChanged: boolean,
	iconAction: CatalogIconAction,
	iconFile: File | null,
};

type CatalogRenameValidationError = {
	field: 'title' | 'description',
	message: string,
};

type CatalogRenameDialogOptions = {
	title: string,
	description?: string | null,
	isDescriptionDefault?: boolean,
	iconUrl?: string | null,
	color?: string | null,
	onSubmit: (payload: CatalogRenamePayload) => Promise<void> | void,
};

export function validateRenameInput(
	title: string,
	description: string,
	initial: { title?: string, description?: string } = {},
): CatalogRenameValidationError | null
{
	const trimmedTitle = String(title ?? '').trim();
	const trimmedDescription = String(description ?? '').trim();
	const titleChanged = initial.title === undefined || trimmedTitle !== String(initial.title ?? '').trim();
	const descriptionChanged = initial.description === undefined
		|| trimmedDescription !== String(initial.description ?? '').trim();

	const titleLength = Array.from(trimmedTitle).length;

	if (titleChanged && titleLength < TITLE_MIN_LENGTH)
	{
		return {
			field: 'title',
			message: Loc.getMessagePlural('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_TITLE_MIN', TITLE_MIN_LENGTH, {
				'#MIN#': String(TITLE_MIN_LENGTH),
			}),
		};
	}

	if (titleChanged && titleLength > TITLE_MAX_LENGTH)
	{
		return {
			field: 'title',
			message: Loc.getMessagePlural('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_TITLE_MAX', TITLE_MAX_LENGTH, {
				'#MAX#': String(TITLE_MAX_LENGTH),
			}),
		};
	}

	if (titleChanged && CONTROL_CHARS_REGEX.test(trimmedTitle))
	{
		return { field: 'title', message: Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_TITLE_CONTROL') };
	}

	if (!descriptionChanged)
	{
		return null;
	}

	if (Array.from(String(description ?? '')).length > DESCRIPTION_MAX_LENGTH)
	{
		return {
			field: 'description',
			message: Loc.getMessagePlural('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_DESCRIPTION_MAX', DESCRIPTION_MAX_LENGTH, {
				'#MAX#': String(DESCRIPTION_MAX_LENGTH),
			}),
		};
	}

	if (DESCRIPTION_CONTROL_CHARS_REGEX.test(String(description ?? '')))
	{
		return { field: 'description', message: Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_DESCRIPTION_CONTROL') };
	}

	return null;
}

export function validateIconFile(file: File): string | null
{
	if (file.size > ICON_MAX_BYTES)
	{
		return Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_ICON_SIZE');
	}

	const type = String(file.type ?? '');

	if (type !== '' && type !== 'application/octet-stream' && !ICON_ALLOWED_TYPES.has(type))
	{
		return Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_ICON_FORMAT');
	}

	return null;
}

export class CatalogRenameDialog
{
	#titleInput: Input;
	#descriptionInput: Input;
	#initialTitle: string;
	#initialDescription: string;
	#onSubmit: (payload: CatalogRenamePayload) => Promise<void> | void;
	#dialog: Dialog | null = null;
	#saveButton: Button | null = null;
	#cancelButton: Button | null = null;
	#errorNode: HTMLElement | null = null;
	#submitting: boolean = false;

	#iconUrl: string | null;
	#iconColor: string | null;
	#iconAction: CatalogIconAction = ICON_ACTION_KEEP;
	#iconFile: File | null = null;
	#iconError: string = '';
	#iconPreviewUrl: string | null = null;
	#iconPreviewNode: HTMLElement | null = null;
	#iconErrorNode: HTMLElement | null = null;
	#iconFileInput: HTMLInputElement | null = null;
	#iconDeleteButton: Button | null = null;
	#iconPickGeneration: number = 0;
	#iconPending: boolean = false;

	constructor(options: CatalogRenameDialogOptions)
	{
		this.#onSubmit = options.onSubmit;
		this.#iconUrl = options.iconUrl ?? null;
		this.#iconColor = options.color ?? null;

		this.#initialTitle = options.title ?? '';

		this.#titleInput = new Input({
			value: options.title ?? '',
			label: Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_TITLE_LABEL'),
			placeholder: Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_TITLE_PLACEHOLDER'),
			size: InputSize.Md,
			stretched: true,
			required: true,
			active: true,
			dataTestId: 'vibecode-catalog-rename-title',
		});

		const descriptionValue = options.isDescriptionDefault === true
			? ''
			: (options.description ?? '');

		this.#initialDescription = descriptionValue;

		this.#descriptionInput = new Input({
			value: '',
			label: Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_DESCRIPTION_LABEL'),
			placeholder: Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_DESCRIPTION_PLACEHOLDER'),
			size: InputSize.Md,
			stretched: true,
			rowsQuantity: DESCRIPTION_ROWS,
			resize: 'vertical',
			dataTestId: 'vibecode-catalog-rename-description',
		});

		this.#descriptionInput.render();
		this.#descriptionInput.setValue(descriptionValue);
	}

	show(): void
	{
		if (this.#dialog === null)
		{
			this.#saveButton = new Button({
				text: Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_SAVE'),
				useAirDesign: true,
				style: AirButtonStyle.FILLED,
				size: ButtonSize.MEDIUM,
				onclick: () => this.submit(),
			});
			this.#cancelButton = new Button({
				text: Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_CANCEL'),
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE,
				size: ButtonSize.MEDIUM,
				onclick: () => this.hide(),
			});

			this.#dialog = new Dialog({
				title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_DIALOG_TITLE'),
				content: this.#renderContent(),
				hasOverlay: true,
				closeByEsc: true,
				closeByClickOutside: true,
				leftButtons: [this.#cancelButton],
				rightButtons: [this.#saveButton],
				events: {
					onAfterShow: () => this.#titleInput.focus(),
					onAfterHide: () => this.#onHidden(),
				},
			});
		}

		this.#dialog.show();
	}

	hide(): void
	{
		this.#iconPickGeneration++;
		this.#iconPending = false;
		this.#dialog?.hide();
	}

	#onHidden(): void
	{
		this.#iconPickGeneration++;
		this.#iconPending = false;
		this.#releaseIconPreview();
	}

	getPayload(): CatalogRenamePayload
	{
		const title = this.#titleInput.getValue().trim();
		const description = this.#descriptionInput.getValue();

		return {
			title,
			description,
			titleChanged: title !== this.#initialTitle.trim(),
			descriptionChanged: description.trim() !== this.#initialDescription.trim(),
			iconAction: this.#iconAction,
			iconFile: this.#iconAction === ICON_ACTION_REPLACE ? this.#iconFile : null,
		};
	}

	getFieldError(field: 'title' | 'description'): string
	{
		return field === 'description'
			? this.#descriptionInput.getError()
			: this.#titleInput.getError();
	}

	getIconError(): string
	{
		return this.#iconError;
	}

	isIconDeletable(): boolean
	{
		if (this.#iconAction === ICON_ACTION_REPLACE)
		{
			return this.#iconFile !== null;
		}

		return this.#iconAction === ICON_ACTION_KEEP && this.#iconUrl !== null;
	}

	async selectIconFile(file: File): Promise<void>
	{
		const generation = ++this.#iconPickGeneration;

		this.#iconPending = false;

		const error = validateIconFile(file);

		if (error !== null)
		{
			this.#setIconError(error);
			this.#syncIconControls();

			return;
		}

		this.#iconPending = true;
		this.#syncIconControls();

		let size = null;

		try
		{
			size = await readImageSize(file);
		}
		catch
		{
			if (generation !== this.#iconPickGeneration)
			{
				return;
			}

			this.#iconPending = false;
			this.#setIconError(Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_ICON_READ'));
			this.#syncIconControls();

			return;
		}

		if (generation !== this.#iconPickGeneration)
		{
			return;
		}

		this.#iconPending = false;

		if (size !== null && size.width * size.height > ICON_MAX_PIXELS)
		{
			this.#setIconError(Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_ICON_PIXELS'));
			this.#syncIconControls();

			return;
		}

		this.#setIconError('');
		this.#iconAction = ICON_ACTION_REPLACE;
		this.#iconFile = file;
		this.#showIconPreview(URL.createObjectURL(file));
		this.#syncIconControls();
	}

	deleteIcon(): void
	{
		this.#iconPickGeneration++;
		this.#iconPending = false;
		this.#setIconError('');
		this.#iconAction = ICON_ACTION_DELETE;
		this.#iconFile = null;
		this.#releaseIconPreview();
		this.#renderIconPreview();
		this.#syncIconControls();
	}

	submit(): void
	{
		if (this.#submitting || this.#iconPending)
		{
			return;
		}

		this.#setIconError('');

		const payload = this.getPayload();

		if (!this.#validate(payload))
		{
			return;
		}

		this.#clearServerError();
		this.#setSubmitting(true);

		Promise.resolve(this.#onSubmit(payload))
			.then(() => {
				this.hide();
			})
			.catch((error) => {
				this.#setSubmitting(false);
				this.#showServerError(error?.message);
			});
	}

	#validate(payload: CatalogRenamePayload): boolean
	{
		this.#titleInput.setError('');
		this.#descriptionInput.setError('');

		const error = validateRenameInput(payload.title, payload.description, {
			title: this.#initialTitle,
			description: this.#initialDescription,
		});

		if (error === null)
		{
			return true;
		}

		if (error.field === 'description')
		{
			this.#descriptionInput.setError(error.message);
		}
		else
		{
			this.#titleInput.setError(error.message);
		}

		return false;
	}

	#renderContent(): HTMLElement
	{
		this.#errorNode = Tag.render`
			<div
				class="vibecode-catalog__rename-error ui-text --xs"
				data-testid="vibecode-catalog-rename-error"
				role="alert"
				aria-live="polite"
				hidden
			></div>
		`;

		return Tag.render`
			<div class="vibecode-catalog__rename-form" data-testid="vibecode-catalog-rename-form">
				${this.#renderIconBlock()}
				${this.#titleInput.render()}
				${this.#descriptionInput.render()}
				${this.#errorNode}
			</div>
		`;
	}

	#renderIconBlock(): HTMLElement
	{
		const uploadButton = new Button({
			text: Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ICON_UPLOAD'),
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			size: ButtonSize.SMALL,
			onclick: () => {
				this.#setIconError('');
				this.#iconFileInput?.click();
			},
		});
		this.#iconDeleteButton = new Button({
			text: Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ICON_DELETE'),
			useAirDesign: true,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			size: ButtonSize.SMALL,
			onclick: () => this.deleteIcon(),
		});

		this.#iconFileInput = Tag.render`
			<input
				class="vibecode-catalog__rename-icon-input"
				type="file"
				accept="${ICON_ACCEPT_ATTRIBUTE}"
				tabindex="-1"
				aria-hidden="true"
				data-testid="vibecode-catalog-rename-icon-input"
			/>
		`;
		Event.bind(this.#iconFileInput, 'change', () => {
			const file = this.#iconFileInput?.files?.[0] ?? null;

			if (file !== null)
			{
				this.selectIconFile(file);
			}

			this.#iconFileInput.value = '';
		});

		this.#iconPreviewNode = Tag.render`
			<span
				class="vibecode-catalog__rename-icon-preview"
				style="${this.#iconColor === null ? '' : `--vibecode-catalog-item-icon-background: ${this.#iconColor};`}"
				data-testid="vibecode-catalog-rename-icon-preview"
			></span>
		`;
		this.#renderIconPreview();

		this.#iconErrorNode = Tag.render`
			<div
				class="vibecode-catalog__rename-icon-error ui-text --xs"
				data-testid="vibecode-catalog-rename-icon-error"
				role="alert"
				aria-live="polite"
				hidden
			></div>
		`;

		const block = Tag.render`
			<div class="vibecode-catalog__rename-icon" data-testid="vibecode-catalog-rename-icon">
				<div class="vibecode-catalog__rename-icon-label ui-text --xs">
					${Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ICON_LABEL')}
				</div>
				<div class="vibecode-catalog__rename-icon-row">
					${this.#iconPreviewNode}
					<div class="vibecode-catalog__rename-icon-buttons">
						${uploadButton.render()}
						${this.#iconDeleteButton.render()}
					</div>
					${this.#iconFileInput}
				</div>
				${this.#iconErrorNode}
			</div>
		`;

		this.#syncIconControls();

		return block;
	}

	#renderIconPreview(): void
	{
		if (!this.#iconPreviewNode)
		{
			return;
		}

		const source = this.#iconPreviewUrl ?? (this.#iconAction === ICON_ACTION_DELETE ? null : this.#iconUrl);
		const content = source === null
			? renderIcon('apps', ICON_PREVIEW_SIZE)
			: Tag.render`
				<img
					class="vibecode-catalog__rename-icon-img"
					src="${source}"
					alt="${Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ICON_ALT')}"
				/>
			`;

		Dom.clean(this.#iconPreviewNode);
		Dom.append(content, this.#iconPreviewNode);
	}

	#showIconPreview(objectUrl: string): void
	{
		this.#releaseIconPreview();
		this.#iconPreviewUrl = objectUrl;
		this.#renderIconPreview();
	}

	#releaseIconPreview(): void
	{
		if (this.#iconPreviewUrl === null)
		{
			return;
		}

		URL.revokeObjectURL(this.#iconPreviewUrl);
		this.#iconPreviewUrl = null;
	}

	#syncIconControls(): void
	{
		this.#iconDeleteButton?.setDisabled(this.#iconPending || !this.isIconDeletable());
		this.#saveButton?.setDisabled(this.#submitting || this.#iconPending);
	}

	#setIconError(message: string): void
	{
		this.#iconError = message;

		if (!this.#iconErrorNode)
		{
			return;
		}

		this.#iconErrorNode.textContent = message;

		if (message === '')
		{
			this.#iconErrorNode.setAttribute('hidden', '');
		}
		else
		{
			this.#iconErrorNode.removeAttribute('hidden');
		}
	}

	#setSubmitting(submitting: boolean): void
	{
		this.#submitting = submitting;

		this.#saveButton?.setWaiting(submitting);
		this.#saveButton?.setDisabled(submitting);
		this.#cancelButton?.setDisabled(submitting);
	}

	#showServerError(message: ?string): void
	{
		if (!this.#errorNode)
		{
			return;
		}

		this.#errorNode.textContent = message ?? Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_GENERIC');
		this.#errorNode.removeAttribute('hidden');
	}

	#clearServerError(): void
	{
		if (!this.#errorNode)
		{
			return;
		}

		this.#errorNode.textContent = '';
		this.#errorNode.setAttribute('hidden', '');
	}
}
