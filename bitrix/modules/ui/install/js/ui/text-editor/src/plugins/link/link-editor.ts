import { Dom, Tag, Text, Type, Loc } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { type PopupOptions } from 'main.popup';
import { Outline } from 'ui.icon-set.api.core';

import { getAriaMessage } from '../../helpers/aria-message';
import { renderDialogButton } from '../../helpers/render-dialog-button';
import { sanitizeUrl } from '../../helpers/sanitize-url';
import { BaseDialog } from '../base-dialog';

import './link-editor.css';

const BUTTON_CLASS = 'ui-text-editor-link-form-button';

export type LinkEditorOptions = {
	editMode?: boolean;
	autoLinkMode?: boolean;
	linkUrl?: string;
	targetContainer?: HTMLElement;
	events?: Record<string, (event: BaseEvent) => void>;
};

export class LinkEditor extends BaseDialog
{
	#editMode: boolean | null = null;
	#autoLinkMode: boolean | null = null;
	#linkUrl: string = '';
	// a page can hold several editors, so the label -> input pairing needs an id of its own
	#textBoxId: string = `ui-text-editor-link-url-${Text.getRandom(8)}`;

	constructor(options: LinkEditorOptions)
	{
		super('BX.UI.TextEditor.LinkEditor', options);

		const linkEditorOptions: LinkEditorOptions = Type.isPlainObject(options) ? options : {};

		this.setLinkUrl(linkEditorOptions.linkUrl as string);

		if (Type.isBoolean(linkEditorOptions.editMode))
		{
			this.setEditMode(linkEditorOptions.editMode);
		}
		else
		{
			this.setEditMode(this.#linkUrl === '');
		}

		this.setAutoLinkMode(options.autoLinkMode);

		// onAfterShow runs before the trap activates, and the trap leaves the focus alone once it
		// is already inside — without this the url field would not get it: nothing is tabbable yet
		// while the popup is still animating open
		this.subscribe('onAfterShow', (): void => {
			if (this.#editMode)
			{
				this.getLinkTextBox().focus();
			}
		});
	}

	setAutoLinkMode(autoLinkMode: boolean = true): void
	{
		if (autoLinkMode === this.#autoLinkMode)
		{
			return;
		}

		if (autoLinkMode)
		{
			Dom.addClass(this.getContainer(), '--auto-link-mode');
		}
		else
		{
			Dom.removeClass(this.getContainer(), '--auto-link-mode');
		}

		this.adjustPosition();

		this.#autoLinkMode = autoLinkMode;
	}

	setEditMode(editMode: boolean = true): void
	{
		if (editMode === this.#editMode)
		{
			return;
		}

		if (editMode)
		{
			Dom.addClass(this.getContainer(), '--edit-mode');
		}
		else
		{
			Dom.removeClass(this.getContainer(), '--edit-mode');
		}

		this.adjustPosition();

		this.#editMode = editMode;
	}

	setLinkUrl(url: string): void
	{
		if (Type.isString(url))
		{
			this.#linkUrl = sanitizeUrl(url);

			this.getLinkTextBox().value = this.#linkUrl;
			this.getLinkLabel().textContent = this.#linkUrl;
			this.getLinkLabel().href = this.#linkUrl;
		}
	}

	getLinkUrl(): string
	{
		return this.#linkUrl;
	}

	getPopupOptions(): PopupOptions
	{
		return {
			cacheable: false,
			ariaLabel: getAriaMessage('TEXT_EDITOR_DIALOG_LINK_ARIA') ?? undefined,
			content: this.getContainer(),
		};
	}

	getContainer(): HTMLElement
	{
		return this.getRefs().remember('container', () => {
			return Tag.render`
				<div class="ui-text-editor-link-editor" data-testid="link-editor">
					<div class="ui-text-editor-link-form">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100 ui-text-editor-link-textbox">
							<label class="ui-ctl-tag" for="${this.#textBoxId}">
								${Loc.getMessage('TEXT_EDITOR_LINK_URL')}
							</label>
							${this.getLinkTextBox()}
						</div>
						${renderDialogButton({
							className: BUTTON_CLASS,
							icon: Outline.CHECK_L,
							ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_SAVE_ARIA'),
							testId: 'save-link-btn',
							onClick: this.#handleSaveBtnClick.bind(this),
						})}
						${renderDialogButton({
							className: BUTTON_CLASS,
							icon: Outline.CROSS_L,
							ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_CANCEL_ARIA'),
							testId: 'cancel-link-btn',
							onClick: this.#handleCancelBtnClick.bind(this),
						})}
					</div>
					<div class="ui-text-editor-link-preview">
						${this.getLinkLabel()}
						${renderDialogButton({
							className: BUTTON_CLASS,
							icon: Outline.EDIT_L,
							ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_EDIT_LINK_ARIA'),
							testId: 'edit-link-btn',
							onClick: this.#handleEditBtnClick.bind(this),
						})}
						${renderDialogButton({
							className: `${BUTTON_CLASS} ui-text-editor-link-form-delete-btn`,
							icon: Outline.UNLINK,
							ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_UNLINK_ARIA'),
							testId: 'unlink-btn',
							onClick: this.#handleUnlinkBtnClick.bind(this),
						})}
					</div>
				</div>
			`;
		});
	}

	getLinkTextBox(): HTMLInputElement
	{
		return this.getRefs().remember('link-textbox', () => {
			return Tag.render`
				<input
					type="text"
					id="${this.#textBoxId}"
					class="ui-ctl-element"
					placeholder="https://"
					value="${this.getLinkUrl()}"
					onkeydown="${this.#handleLinkTextBoxKeyDown.bind(this)}"
					data-testid="link-textbox-input"
				>
			`;
		});
	}

	getLinkLabel(): HTMLAnchorElement
	{
		return this.getRefs().remember('link-label', () => {
			return Tag.render`
				<a href="" target="_blank" class="ui-text-editor-link-label" data-testid="link-label"></a>
			`;
		});
	}

	#handleSaveBtnClick(): void
	{
		const url: string = this.getLinkTextBox().value.trim();
		if (url.length > 0)
		{
			this.setLinkUrl(url);
			this.emit('onSave');
		}
		else
		{
			this.getLinkTextBox().focus();
		}
	}

	#handleLinkTextBoxKeyDown(event: KeyboardEvent)
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

	#handleEditBtnClick(): void
	{
		this.setEditMode(true);
		this.getLinkTextBox().focus();
		this.getLinkTextBox().select();
	}

	#handleUnlinkBtnClick(): void
	{
		this.emit('onUnlink');
	}
}
