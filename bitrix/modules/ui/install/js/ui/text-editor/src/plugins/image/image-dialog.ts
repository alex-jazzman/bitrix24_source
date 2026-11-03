import { Tag, Text, Type, Loc } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { type PopupOptions } from 'main.popup';
import { Outline } from 'ui.icon-set.api.core';

import { getAriaMessage } from '../../helpers/aria-message';
import { renderDialogButton } from '../../helpers/render-dialog-button';
import { sanitizeUrl } from '../../helpers/sanitize-url';
import { BaseDialog } from '../base-dialog';

import './image-dialog.css';

const BUTTON_CLASS = 'ui-text-editor-image-dialog-button';

export type ImageDialogOptions = {
	targetContainer?: HTMLElement;
	events?: Record<string, (event: BaseEvent) => void>;
};

export class ImageDialog extends BaseDialog
{
	#imageUrl: string = '';
	#imageAlt: string = '';
	// a page can hold several editors, so the label -> input pairing needs an id of its own
	#textBoxId: string = `ui-text-editor-image-url-${Text.getRandom(8)}`;
	#altBoxId: string = `ui-text-editor-image-alt-${Text.getRandom(8)}`;
	#altHintId: string = `ui-text-editor-image-alt-hint-${Text.getRandom(8)}`;

	constructor(options: ImageDialogOptions)
	{
		super('BX.UI.TextEditor.ImageDialog', options);

		// onAfterShow runs before the trap activates, and the trap leaves the focus alone once it
		// is already inside — without this the url field would not get it: nothing is tabbable yet
		// while the popup is still animating open
		this.subscribe('onAfterShow', (): void => {
			this.getUrlTextBox().focus();
		});
	}

	setImageUrl(url: string): void
	{
		if (Type.isString(url))
		{
			this.#imageUrl = sanitizeUrl(url);
		}
	}

	getImageUrl(): string
	{
		return this.#imageUrl;
	}

	setImageAlt(alt: string): void
	{
		if (Type.isString(alt))
		{
			this.#imageAlt = alt.trim();
		}
	}

	getImageAlt(): string
	{
		return this.#imageAlt;
	}

	getPopupOptions(): PopupOptions
	{
		return {
			cacheable: false,
			ariaLabel: getAriaMessage('TEXT_EDITOR_DIALOG_IMAGE_ARIA') ?? undefined,
			content: this.getContainer(),
		};
	}

	getContainer(): HTMLElement
	{
		return this.getRefs().remember('container', () => {
			// the buttons sit in a column of their own so that the tab order stays
			// url -> description -> save -> cancel while both fields stack on the left
			return Tag.render`
				<div class="ui-text-editor-image-dialog">
					<div class="ui-text-editor-image-dialog-form">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100">
							<label class="ui-ctl-tag" for="${this.#textBoxId}">
								${Loc.getMessage('TEXT_EDITOR_IMAGE_URL')}
							</label>
							${this.getUrlTextBox()}
						</div>
						<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100">
							<label class="ui-ctl-tag" for="${this.#altBoxId}">
								${Loc.getMessage('TEXT_EDITOR_IMAGE_ALT')}
							</label>
							${this.getAltTextBox()}
						</div>
						${this.getAltHint()}
					</div>
					<div class="ui-text-editor-image-dialog-actions">
						${renderDialogButton({
							className: BUTTON_CLASS,
							icon: Outline.CHECK_L,
							ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_SAVE_ARIA'),
							testId: 'image-dialog-save-btn',
							onClick: this.#handleSaveBtnClick.bind(this),
						})}
						${renderDialogButton({
							className: BUTTON_CLASS,
							icon: Outline.CROSS_L,
							ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_CANCEL_ARIA'),
							testId: 'image-dialog-cancel-btn',
							onClick: this.#handleCancelBtnClick.bind(this),
						})}
					</div>
				</div>
			`;
		});
	}

	getUrlTextBox(): HTMLInputElement
	{
		return this.getRefs().remember('url-textbox', () => {
			return Tag.render`
				<input
					type="text"
					id="${this.#textBoxId}"
					class="ui-ctl-element"
					placeholder="https://example.com/image.jpeg"
					value="${this.getImageUrl()}"
					onkeydown="${this.#handleTextBoxKeyDown.bind(this)}"
					data-testid="image-dialog-textbox"
				>
			`;
		});
	}

	getAltTextBox(): HTMLInputElement
	{
		return this.getRefs().remember('alt-textbox', () => {
			return Tag.render`
				<input
					type="text"
					id="${this.#altBoxId}"
					class="ui-ctl-element"
					value="${Text.encode(this.getImageAlt())}"
					aria-describedby="${this.#altHintId}"
					onkeydown="${this.#handleTextBoxKeyDown.bind(this)}"
					data-testid="image-dialog-alt-textbox"
				>
			`;
		});
	}

	getAltHint(): HTMLElement
	{
		return this.getRefs().remember('alt-hint', () => {
			return Tag.render`
				<div
					class="ui-text-editor-image-dialog-hint"
					id="${this.#altHintId}"
				>${Loc.getMessage('TEXT_EDITOR_IMAGE_ALT_HINT')}</div>
			`;
		});
	}

	#handleSaveBtnClick(): void
	{
		const url: string = this.getUrlTextBox().value.trim();
		if (url.length > 0)
		{
			this.setImageUrl(url);
			this.setImageAlt(this.getAltTextBox().value);
			this.emit('onSave');
		}
		else
		{
			this.getUrlTextBox().focus();
		}
	}

	#handleTextBoxKeyDown(event: KeyboardEvent)
	{
		if (event.key === 'Enter')
		{
			event.preventDefault();
			this.#handleSaveBtnClick();
		}
	}

	#handleCancelBtnClick(): void
	{
		this.emit('onCancel');
	}
}
