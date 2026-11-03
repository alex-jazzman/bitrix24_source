import { Dom, Event, Loc, Tag, Text, Type } from 'main.core';
import { Popup } from 'main.popup';
import {
	AirButtonStyle,
	Button,
	ButtonIcon,
	ButtonSize,
	type ButtonOptions,
	CancelButton,
	SaveButton,
} from 'ui.buttons';
import { MessageBox } from 'ui.dialogs.messagebox';
import { Hint } from 'ui.hint';
import { Icon, IconHoverMode, Outline } from 'ui.icon-set.api.core';
import { Center } from 'ui.notification';
import 'ui.a11y';
import { Headline } from 'ui.system.typography';
import { Input, InputDesign, InputSize } from 'ui.system.input';
import 'ui.icon-set.outline';
import { getStageTextColor } from 'crm.stage.color';

import { ColorPalette } from './color-palette';
import { TextFormatToolbar } from './text-format-toolbar';
import { calculateStageEditorPopupPosition } from '../lib/stage-editor-popup-position';
import {
	StageEditorModel,
	type StageEditorChangedField,
	type StageEditorStageData,
} from '../model/stage-editor-model';

type StageEditorPopupOptions = {
	model: StageEditorModel,
	mode: 'create' | 'edit',
	anchor: HTMLElement,
	canEdit: boolean,
	canDelete: boolean,
	deleteBlockReasons: string[],
	descriptionPlaceholder: string,
	onChange: (field: StageEditorChangedField) => void,
	onSave: () => Promise<StageEditorStageData>,
	onDelete: () => Promise<void>,
	onCancel: () => void,
	onClose: () => void,
};

type PositionablePopup = {
	angle: {
		element: HTMLElement,
		defaultOffset: number,
	} | null,
	bindElement: HTMLElement | null,
	offsetLeft: number,
};

export function notifyStageEditorError(error: unknown, fallbackMessage: string): void
{
	let message = fallbackMessage;
	if (Type.isStringFilled(error))
	{
		message = error;
	}
	else if (error instanceof Error && Type.isStringFilled(error.message))
	{
		message = error.message;
	}
	else
	{
		const typedError = error as { message?: string };
		if (Type.isPlainObject(error) && Type.isStringFilled(typedError.message))
		{
			message = typedError.message;
		}
	}

	Center.notify({
		content: Text.encode(message),
	});
}

export class StageEditorPopup
{
	#options: StageEditorPopupOptions;
	#popup: Popup | null = null;
	#container: HTMLElement | null = null;
	#nameInput: HTMLInputElement | null = null;
	#nameBadge: HTMLElement | null = null;
	#nameErrorNode: HTMLElement | null = null;
	#nameErrorId = `crm-stage-editor-name-error-${Text.getRandom()}`;
	#descriptionLabelId = `crm-stage-editor-description-label-${Text.getRandom()}`;
	#paletteId = `crm-stage-editor-palette-${Text.getRandom()}`;
	#deleteBlockedReasonId = `crm-stage-editor-delete-blocked-${Text.getRandom()}`;
	#descriptionContainer: HTMLElement | null = null;
	#descriptionAddButton: Button | null = null;
	#palette: ColorPalette;
	#paletteContainer: HTMLElement | null = null;
	#textEditor: Input | null = null;
	#textFormatToolbar: TextFormatToolbar | null = null;
	#saveButton: SaveButton | null = null;
	#cancelButton: CancelButton | null = null;
	#deleteButton: Button | null = null;
	#styleButton: Button | null = null;
	#closeButton: HTMLElement | null = null;
	#closedByAction = false;
	#isSubmitting = false;
	#resizeObserver: ResizeObserver | null = null;

	constructor(options: StageEditorPopupOptions)
	{
		this.#options = options;
		this.#palette = new ColorPalette({
			selectedColor: this.#options.model.getColor(),
			onSelect: this.#handleColorSelect,
		});
	}

	open(): void
	{
		this.#getPopup().show();
		this.#nameInput?.focus();
	}

	close(): void
	{
		if (this.#isSubmitting)
		{
			return;
		}

		this.#getPopup().close();
	}

	#getPopup(): Popup
	{
		if (this.#popup)
		{
			return this.#popup;
		}

		this.#popup = new Popup({
			bindElement: this.#options.anchor,
			content: this.#render(),
			className: 'crm-stage-editor-popup',
			closeByEsc: false,
			autoHide: false,
			cacheable: false,
			focusTrap: true,
			closeIcon: false,
			padding: 0,
			angle: {
				position: 'top',
				offset: 42,
			},
			events: {
				// Popup events pass Popup directly despite the declared BaseEvent type.
				onPopupShow: (popup) => this.#handlePopupShow(popup as unknown as Popup),
				onPopupClose: this.#handlePopupClose,
				onPopupDestroy: this.#handlePopupDestroy,
			},
		});

		return this.#popup;
	}

	#handlePopupShow(popup: Popup): void
	{
		this.#adjustPopupPosition(popup);
		this.#observeAnchorResize(popup);
	}

	#adjustPopupPosition(popup: Popup): void
	{
		const positionablePopup = popup as unknown as PositionablePopup;
		const angle = positionablePopup.angle;
		const position = calculateStageEditorPopupPosition({
			anchorWidth: Type.isElementNode(positionablePopup.bindElement)
				? positionablePopup.bindElement.offsetWidth
				: null,
			popupWidth: popup.getPopupContainer().offsetWidth,
			angleWidth: angle?.element.offsetWidth ?? null,
			angleLeftOffset: Popup.getOption('angleLeftOffset'),
		});
		if (!position || !angle)
		{
			return;
		}

		positionablePopup.offsetLeft = position.offsetLeft;
		angle.defaultOffset = position.angleOffset;
		popup.adjustPosition({ forceBindPosition: true });
	}

	#observeAnchorResize(popup: Popup): void
	{
		this.#disconnectResizeObserver();
		const { bindElement } = popup as unknown as PositionablePopup;

		if (!Type.isFunction(window.ResizeObserver) || !Type.isElementNode(bindElement))
		{
			return;
		}

		this.#resizeObserver = new window.ResizeObserver(() => {
			if (popup.isShown())
			{
				this.#adjustPopupPosition(popup);
			}
		});
		this.#resizeObserver.observe(bindElement);
	}

	#disconnectResizeObserver(): void
	{
		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
	}

	#render(): HTMLElement
	{
		if (this.#container)
		{
			return this.#container;
		}

		const container = Tag.render`
			<div
				class="crm-stage-editor"
				role="dialog"
				aria-label="${this.#getMessage('CRM_STAGE_EDITOR_TITLE')}"
				data-testid="crm-stage-editor-dialog"
			>
				${this.#renderHeader()}
				${this.#renderName()}
				${this.#renderPalette()}
				${this.#renderDescription()}
				${this.#renderFooter()}
			</div>
		`;
		this.#container = container;

		this.#syncColor();

		return container;
	}

	#renderHeader(): HTMLElement
	{
		this.#styleButton = new Button({
			text: this.#getMessage('CRM_STAGE_EDITOR_STYLE'),
			icon: Outline.PALETTE,
			collapsedIcon: ButtonIcon.SETTING,
			size: ButtonSize.SMALL,
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE_NO_ACCENT,
			disabled: !this.#options.canEdit,
			props: {
				'aria-controls': this.#paletteId,
				'aria-expanded': 'false',
			},
			onclick: () => {
				this.#togglePalette();

				return {};
			},
		});
		const styleButton = this.#styleButton.getContainer();
		Dom.addClass(styleButton, 'crm-stage-editor__style-button');
		styleButton.dataset.testid = 'crm-stage-editor-style';

		const closeIcon = new Icon({
			icon: Outline.CROSS_L,
			size: 18,
			hoverMode: IconHoverMode.DEFAULT,
		});

		const closeButton = Tag.render`
			<button
				class="crm-stage-editor__close"
				type="button"
				aria-label="${Text.encode(this.#getMessage('CRM_STAGE_EDITOR_CANCEL'))}"
				data-testid="crm-stage-editor-close"
			>${closeIcon.render()}</button>
		`;
		Event.bind(closeButton, 'click', this.#handleCancelClick);
		this.#closeButton = closeButton;

		return Tag.render`
			<div class="crm-stage-editor__header">
				${Headline.render(this.#getMessage('CRM_STAGE_EDITOR_TITLE'), {
					size: 'sm',
					wrap: 'truncate',
					className: 'crm-stage-editor__title',
				})}
				<div class="crm-stage-editor__header-actions">
					${this.#styleButton.render()}
					${this.#closeButton}
				</div>
			</div>
		`;
	}

	#renderName(): HTMLElement
	{
		// Naked input inherits its visual container from the stage badge.
		const nameInputControl = new Input({
			value: this.#options.model.getName(),
			size: InputSize.Md,
			design: InputDesign.Naked,
			ariaLabel: this.#getMessage('CRM_STAGE_EDITOR_NAME_LABEL'),
		});
		const nameInputWrapper = nameInputControl.render();
		Dom.addClass(nameInputWrapper, 'crm-stage-editor__name-input');

		const nameInput = nameInputWrapper.querySelector<HTMLInputElement>('input');
		this.#nameInput = nameInput;
		if (nameInput)
		{
			nameInput.dataset.testid = 'crm-stage-editor-name-input';
			nameInput.setAttribute('aria-describedby', this.#nameErrorId);
			nameInput.disabled = !this.#options.canEdit;
		}

		this.#nameBadge = Tag.render`
			<div class="crm-stage-editor__name-badge">${nameInputWrapper}</div>
		`;
		this.#nameErrorNode = Tag.render`
			<div id="${this.#nameErrorId}" class="crm-stage-editor__name-error" role="alert">
				${Text.encode(this.#getMessage('CRM_STAGE_EDITOR_NAME_REQUIRED'))}
			</div>
		`;
		this.#syncNameValidation();

		if (nameInput)
		{
			Event.bind(nameInput, 'input', this.#handleNameInput);
			Event.bind(nameInput, 'keydown', this.#handleNameKeyDown);
		}

		return Tag.render`
			<div class="crm-stage-editor__field crm-stage-editor__field--name">
				${this.#nameBadge}
				${this.#nameErrorNode}
			</div>
		`;
	}

	#renderPalette(): HTMLElement
	{
		const paletteContainer = Tag.render`
			<div id="${this.#paletteId}" class="crm-stage-editor__palette --hidden">${this.#palette.render()}</div>
		`;
		this.#paletteContainer = paletteContainer;

		return paletteContainer;
	}

	#renderDescription(): HTMLElement
	{
		const descriptionContainer = Tag.render`
			<div class="crm-stage-editor__description"></div>
		`;
		this.#descriptionContainer = descriptionContainer;

		if (this.#options.model.getDescription().trim() === '')
		{
			const descriptionAddButton = new Button({
				text: this.#getMessage('CRM_STAGE_EDITOR_DESCRIPTION_ADD'),
				icon: Outline.PLUS_L,
				collapsedIcon: ButtonIcon.ADD,
				size: ButtonSize.SMALL,
				useAirDesign: true,
				style: AirButtonStyle.PLAIN_NO_ACCENT,
				disabled: !this.#options.canEdit,
				onclick: () => {
					this.#showTextEditor();

					return {};
				},
			});
			Dom.addClass(descriptionAddButton.getContainer(), 'crm-stage-editor__description-add');
			descriptionAddButton.getContainer().dataset.testid = 'crm-stage-editor-description-add';
			this.#descriptionAddButton = descriptionAddButton;
			Dom.append(descriptionAddButton.render(), descriptionContainer);
		}
		else
		{
			this.#showTextEditor();
		}

		return descriptionContainer;
	}

	#renderFooter(): HTMLElement
	{
		this.#saveButton = new SaveButton({
			text: this.#getMessage('CRM_STAGE_EDITOR_SAVE'),
			size: ButtonSize.MEDIUM,
			collapsedIcon: ButtonIcon.DONE,
			useAirDesign: true,
			style: AirButtonStyle.FILLED,
			onclick: () => {
				this.#handleSaveClick();

				return {};
			},
			disabled: !this.#options.canEdit || !this.#options.model.isNameValid(this.#getDefaultStageName()),
		});
		this.#saveButton.getContainer().dataset.testid = 'crm-stage-editor-save';

		this.#cancelButton = new CancelButton({
			text: this.#getMessage('CRM_STAGE_EDITOR_CANCEL'),
			size: ButtonSize.MEDIUM,
			collapsedIcon: ButtonIcon.CANCEL,
			useAirDesign: true,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			onclick: () => {
				this.#handleCancelClick();

				return {};
			},
		});
		this.#cancelButton.getContainer().dataset.testid = 'crm-stage-editor-cancel';

		// An icon-only AIR button is always collapsed and shows its Outline icon as is. collapsedIcon is left out:
		// a legacy value would draw a second icon, and an Outline value there renders an unmasked square.
		// The option is optional at runtime but required by the ui.buttons typings, hence the assertion below.
		this.#deleteButton = new Button({
			icon: Outline.TRASHCAN,
			size: ButtonSize.SMALL,
			useAirDesign: true,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			onclick: () => {
				this.#handleDeleteClick();

				return {};
			},
			disabled: false,
			props: {
				'aria-label': this.#getMessage('CRM_STAGE_EDITOR_DELETE'),
				'aria-disabled': this.#options.canDelete ? 'false' : 'true',
			},
		} as unknown as ButtonOptions);
		this.#deleteButton.getContainer().dataset.testid = 'crm-stage-editor-delete';

		const deleteNode = this.#deleteButton.render();
		Dom.addClass(deleteNode, 'crm-stage-editor__delete');
		if (!this.#options.canDelete)
		{
			const reason = this.#getDeleteBlockedReason();
			deleteNode.dataset.hint = reason;
			deleteNode.dataset.hintNoIcon = 'y';
			deleteNode.setAttribute('aria-describedby', this.#deleteBlockedReasonId);
			Hint.initNode(deleteNode);
		}

		const deleteBlockedReason = this.#options.canDelete
			? null
			: Tag.render`
				<visually-hidden id="${this.#deleteBlockedReasonId}">
					${Text.encode(this.#getDeleteBlockedReason())}
				</visually-hidden>
			`
		;

		return Tag.render`
			<div class="crm-stage-editor__footer">
				<div class="crm-stage-editor__footer-right">
					${this.#saveButton.render()}
					${this.#cancelButton.render()}
				</div>
				<div class="crm-stage-editor__footer-left">${deleteNode}${deleteBlockedReason}</div>
			</div>
		`;
	}

	#showTextEditor = (): void => {
		if (this.#textEditor || !this.#descriptionContainer)
		{
			return;
		}

		Dom.clean(this.#descriptionContainer);

		const textEditorContainer = Tag.render`
			<div class="crm-stage-editor__text-editor"></div>
		`;
		Dom.append(textEditorContainer, this.#descriptionContainer);

		this.#textEditor = new Input({
			value: '',
			label: this.#getMessage('CRM_STAGE_EDITOR_DESCRIPTION_LABEL'),
			rowsQuantity: 3,
			resize: 'vertical',
			design: InputDesign.LightGrey,
			placeholder: this.#options.descriptionPlaceholder,
			readonly: !this.#options.canEdit,
			active: this.#options.mode === 'create' && this.#options.model.getName().trim() !== '',
			onInput: this.#handleDescriptionChange,
		});
		const textEditor = this.#textEditor.render();
		Dom.append(textEditor, textEditorContainer);
		this.#textEditor.setValue(this.#options.model.getDescription());
		const textarea = textEditor.querySelector<HTMLTextAreaElement>('textarea');
		if (textarea)
		{
			textarea.dataset.testid = 'crm-stage-editor-description-input';
			const label = textEditor.querySelector<HTMLElement>('.ui-system-input-label');
			if (label)
			{
				label.id = this.#descriptionLabelId;
				textarea.setAttribute('aria-labelledby', this.#descriptionLabelId);
			}
		}

		if (this.#options.canEdit && textarea)
		{
			this.#textFormatToolbar = new TextFormatToolbar({ textarea });
		}
	};

	#handleNameInput = (): void => {
		this.#options.model.setName(this.#nameInput?.value ?? '');
		this.#syncNameValidation();
		this.#notifyChange('name');
	};

	#syncNameValidation(): void
	{
		const isValid = this.#options.model.isNameValid(this.#getDefaultStageName());
		if (this.#nameBadge)
		{
			Dom.toggleClass(this.#nameBadge, '--invalid', !isValid);
		}

		if (this.#nameErrorNode)
		{
			Dom.toggleClass(this.#nameErrorNode, '--visible', !isValid);
		}
		this.#nameInput?.setAttribute('aria-invalid', isValid ? 'false' : 'true');
		this.#saveButton?.setDisabled(this.#isSubmitting || !this.#options.canEdit || !isValid);
	}

	#handleNameKeyDown = (event: KeyboardEvent): void => {
		if ((event.metaKey || event.ctrlKey) && event.key === 'Enter')
		{
			event.preventDefault();
			void this.#save();
		}
	};

	#handleDescriptionChange = (): void => {
		this.#syncDescription();
		this.#notifyChange('description');
	};

	#syncDescription(): void
	{
		if (this.#textEditor)
		{
			this.#options.model.setDescription(this.#textEditor.getValue());
		}
	}

	#handleColorSelect = (color: string): void => {
		this.#options.model.setColor(color);
		this.#syncColor();
		this.#notifyChange('color');
	};

	#togglePalette = (): void => {
		if (!this.#paletteContainer)
		{
			return;
		}

		Dom.toggleClass(this.#paletteContainer, '--hidden');
		this.#styleButton?.getContainer().setAttribute(
			'aria-expanded',
			Dom.hasClass(this.#paletteContainer, '--hidden') ? 'false' : 'true',
		);
	};

	#syncColor(): void
	{
		if (!this.#nameBadge)
		{
			return;
		}

		const color = this.#options.model.getColor();
		Dom.style(this.#nameBadge, {
			backgroundColor: `#${color}`,
			color: getStageTextColor(color),
		});
		this.#palette.setSelectedColor(color);
	}

	#notifyChange(field: StageEditorChangedField): void
	{
		if (this.#options.canEdit)
		{
			this.#options.onChange(field);
		}
	}

	#getDefaultStageName(): string
	{
		return this.#getMessage('CRM_STAGE_EDITOR_NEW_STAGE');
	}

	#handleSaveClick = (): void => {
		void this.#save();
	};

	async #save(): Promise<void>
	{
		if (this.#isSubmitting || !this.#options.canEdit)
		{
			return;
		}

		const defaultStageName = this.#getDefaultStageName();
		if (!this.#options.model.isNameValid(defaultStageName))
		{
			this.#syncNameValidation();
			this.#nameInput?.focus();

			return;
		}

		this.#options.model.normalizeName(defaultStageName);
		if (this.#nameInput)
		{
			this.#nameInput.value = this.#options.model.getName();
		}
		this.#syncNameValidation();

		this.#setSubmitting(true);

		try
		{
			this.#syncDescription();
			await this.#options.onSave();
			this.#setSubmitting(false);
			this.#closedByAction = true;
			this.close();
		}
		catch (error)
		{
			this.#showError(error);
		}
		finally
		{
			this.#setSubmitting(false);
		}
	}

	#handleDeleteClick = (): void => {
		if (!this.#options.canDelete || this.#isSubmitting)
		{
			return;
		}

		const messageBox = MessageBox.confirm(
			this.#getMessage('CRM_STAGE_EDITOR_DELETE_CONFIRM_TEXT'),
			this.#getMessage('CRM_STAGE_EDITOR_DELETE_CONFIRM_TITLE'),
			() => this.#delete(),
			this.#getMessage('CRM_STAGE_EDITOR_DELETE_CONFIRM_YES'),
			() => true,
			this.#getMessage('CRM_STAGE_EDITOR_CANCEL'),
			true,
		);
		messageBox.getPopupWindow().getPopupContainer().dataset.testid = 'crm-stage-editor-delete-confirm';
		messageBox.getOkButton().getContainer().dataset.testid = 'crm-stage-editor-delete-confirm-submit';
		messageBox.getCancelButton().getContainer().dataset.testid = 'crm-stage-editor-delete-confirm-cancel';
	};

	async #delete(): Promise<boolean>
	{
		this.#setSubmitting(true);

		try
		{
			await this.#options.onDelete();
			this.#setSubmitting(false);
			this.#closedByAction = true;
			this.close();

			return true;
		}
		catch (error)
		{
			this.#showError(error);

			return false;
		}
		finally
		{
			this.#setSubmitting(false);
		}
	}

	#handleCancelClick = (): void => {
		if (this.#isSubmitting)
		{
			return;
		}

		this.#closedByAction = true;
		this.#options.onCancel();
		this.close();
	};

	#handlePopupClose = (): void => {
		this.#disconnectResizeObserver();

		try
		{
			if (!this.#closedByAction)
			{
				this.#options.onCancel();
			}
		}
		finally
		{
			this.#destroyTextEditor();
			this.#options.onClose();
		}
	};

	#handlePopupDestroy = (): void => {
		this.#disconnectResizeObserver();
		try
		{
			this.#destroyTextEditor();
		}
		finally
		{
			this.#options.onClose();
		}
	};

	#destroyTextEditor(): void
	{
		this.#textFormatToolbar?.destroy();
		this.#textFormatToolbar = null;
		this.#textEditor?.destroy();
		this.#textEditor = null;
	}

	#setSubmitting(isSubmitting: boolean): void
	{
		this.#isSubmitting = isSubmitting;
		this.#saveButton?.setDisabled(
			isSubmitting
			|| !this.#options.canEdit
			|| !this.#options.model.isNameValid(this.#getDefaultStageName()),
		);
		this.#cancelButton?.setDisabled(isSubmitting);
		this.#closeButton?.toggleAttribute('disabled', isSubmitting);
		this.#closeButton?.setAttribute('aria-disabled', isSubmitting ? 'true' : 'false');
		this.#deleteButton?.setDisabled(isSubmitting);
		this.#deleteButton?.getContainer().setAttribute(
			'aria-disabled',
			isSubmitting || !this.#options.canDelete ? 'true' : 'false',
		);
		this.#styleButton?.setDisabled(isSubmitting || !this.#options.canEdit);
		this.#descriptionAddButton?.setDisabled(isSubmitting || !this.#options.canEdit);
	}

	#showError(error: unknown): void
	{
		notifyStageEditorError(error, this.#getMessage('CRM_STAGE_EDITOR_ERROR'));
	}

	#getDeleteBlockedReason(): string
	{
		const reasons = this.#options.deleteBlockReasons.filter((reason) => Type.isStringFilled(reason));

		return reasons.length > 0 ? reasons.join('\n') : this.#getMessage('CRM_STAGE_EDITOR_DELETE_BLOCKED');
	}

	#getMessage(code: string): string
	{
		return Loc.getMessage(code) ?? '';
	}
}
