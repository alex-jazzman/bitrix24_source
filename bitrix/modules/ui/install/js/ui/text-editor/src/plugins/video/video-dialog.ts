import { Tag, Text, Type, Dom, Loc } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { type PopupOptions } from 'main.popup';
import { Outline } from 'ui.icon-set.api.core';

import { getAriaMessage } from '../../helpers/aria-message';
import { renderDialogButton } from '../../helpers/render-dialog-button';
import { sanitizeUrl } from '../../helpers/sanitize-url';
import { BaseDialog } from '../base-dialog';

import './video-dialog.css';

const BUTTON_CLASS = 'ui-text-editor-video-dialog-button';

export type VideoDialogOptions = {
	targetContainer?: HTMLElement;
	events?: Record<string, (event: BaseEvent) => void>;
};

export class VideoDialog extends BaseDialog
{
	#videoUrl: string = '';
	// a page can hold several editors, so every id-based pairing carries a suffix of its own
	#textBoxId: string = `ui-text-editor-video-url-${Text.getRandom(8)}`;
	#statusId: string = `ui-text-editor-video-status-${Text.getRandom(8)}`;

	constructor(options: VideoDialogOptions)
	{
		super('BX.UI.TextEditor.VideoDialog', options);

		// onAfterShow runs before the trap activates, and the trap leaves the focus alone once it
		// is already inside — without this the url field would not get it: nothing is tabbable yet
		// while the popup is still animating open
		this.subscribe('onAfterShow', (): void => {
			this.getUrlTextBox().focus();
		});
	}

	setVideoUrl(url: string): void
	{
		if (Type.isString(url))
		{
			this.#videoUrl = sanitizeUrl(url);
		}
	}

	getVideoUrl(): string
	{
		return this.#videoUrl;
	}

	getPopupOptions(): PopupOptions
	{
		return {
			cacheable: false,
			ariaLabel: getAriaMessage('TEXT_EDITOR_DIALOG_VIDEO_ARIA') ?? undefined,
			content: this.getContainer(),
		};
	}

	getContainer(): HTMLElement
	{
		return this.getRefs().remember('container', () => {
			return Tag.render`
				<div class="ui-text-editor-video-dialog">
					<div class="ui-text-editor-video-dialog-form">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100 ui-text-editor-video-dialog-textbox">
							<label class="ui-ctl-tag" for="${this.#textBoxId}">
								${Loc.getMessage('TEXT_EDITOR_VIDEO_INSERT_TITLE')}
							</label>
							${this.getUrlTextBox()}
						</div>
						${renderDialogButton({
							className: BUTTON_CLASS,
							icon: Outline.CHECK_L,
							ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_SAVE_ARIA'),
							testId: 'video-dialog-save-btn',
							onClick: this.#handleSaveBtnClick.bind(this),
						})}
						${renderDialogButton({
							className: BUTTON_CLASS,
							icon: Outline.CROSS_L,
							ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_CANCEL_ARIA'),
							testId: 'video-dialog-cancel-btn',
							onClick: this.#handleCancelBtnClick.bind(this),
						})}
					</div>
					${this.getStatusContainer()}
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
					placeholder="https://"
					value="${this.getVideoUrl()}"
					aria-describedby="${this.#statusId}"
					onkeydown="${this.#handleTextBoxKeyDown.bind(this)}"
					oninput="${this.#handleTextBoxInput.bind(this)}"
					data-testid="video-dialog-textbox"
				>
			`;
		});
	}

	/**
	 * One node serves as both the hint and the error text, so it is a live region — the change has
	 * to be announced — and the aria-describedby target of the url field at the same time.
	 */
	getStatusContainer(): HTMLElement
	{
		return this.getRefs().remember('status', () => {
			return Tag.render`
				<div
					class="ui-text-editor-video-dialog-status"
					id="${this.#statusId}"
					role="status"
				>${Loc.getMessage('TEXT_EDITOR_VIDEO_INSERT_HINT')}</div>
			`;
		});
	}

	showError(error: string)
	{
		Dom.addClass(this.getStatusContainer(), '--error');
		Dom.addClass(this.getUrlTextBox().parentNode, 'ui-ctl-warning');
		Dom.attr(this.getUrlTextBox(), 'aria-invalid', 'true');

		if (Type.isStringFilled(error))
		{
			this.getStatusContainer().textContent = error;
		}
	}

	clearError()
	{
		Dom.removeClass(this.getStatusContainer(), '--error');
		Dom.removeClass(this.getUrlTextBox().parentNode, 'ui-ctl-warning');
		Dom.attr(this.getUrlTextBox(), 'aria-invalid', null);
		this.getStatusContainer().textContent = Loc.getMessage('TEXT_EDITOR_VIDEO_INSERT_HINT') as string;
	}

	#handleSaveBtnClick(): void
	{
		const url: string = this.getUrlTextBox().value.trim();
		if (url.length > 0)
		{
			this.setVideoUrl(url);
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

	#handleTextBoxInput(event: KeyboardEvent)
	{
		this.emit('onInput');
	}

	#handleCancelBtnClick(): void
	{
		this.emit('onCancel');
	}
}
