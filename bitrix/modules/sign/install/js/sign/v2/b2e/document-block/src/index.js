import { Dom, Event, Loc, Tag, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { MenuManager, Popup } from 'main.popup';
import { UI } from 'ui.notification';
import { type Api } from 'sign.v2.api';

import { ReplaceConfirm } from './components/replace-confirm';

export { getAllowedReplaceExtensions } from './allowed-extensions';

import mixedDocumentItemIcon from './images/sign-wizard-block-file-icon.svg';
import placeholderDocumentItemIcon from './images/sign-wizard-placeholder-file-icon.svg';

import './style.css';

const DocumentBlockType = Object.freeze({
	placeholder: 'placeholder',
	mixed: 'mixed',
});

const loadingClass = '--loading';

export type DocumentBlockOptions = {
	isPlaceholderDocument?: boolean,
	isLoading?: boolean,
};

export type DocumentBlockConfig = {
	documentData: Object,
	options?: DocumentBlockOptions,
	api: Api,
	isTemplateMode: boolean,
};

let documentBlockInstanceCounter = 0;

export class DocumentBlock extends EventEmitter
{
	#documentData: Object;
	#options: DocumentBlockOptions;
	#api: Api;
	#isTemplateMode: boolean;
	#layout: HTMLElement | null = null;
	#menuId: string;
	#menuButton: HTMLElement | null = null;

	constructor(config: DocumentBlockConfig)
	{
		super();
		this.setEventNamespace('BX.Sign.V2.B2e.DocumentBlock');

		this.#documentData = { ...config.documentData };
		this.#options = config.options || {};
		this.#api = config.api;
		this.#isTemplateMode = config.isTemplateMode ?? false;

		documentBlockInstanceCounter += 1;
		this.#menuId = `document-block-menu-${documentBlockInstanceCounter}`;
	}

	getLayout(): HTMLElement
	{
		if (!this.#layout)
		{
			this.#layout = this.#render();
		}

		return this.#layout;
	}

	getId(): string | number
	{
		return this.#documentData.id;
	}

	setTitle(newTitle: string): void
	{
		if (!Type.isString(newTitle) || this.#documentData.title === newTitle)
		{
			return;
		}

		this.#documentData.title = newTitle;

		if (!this.#layout)
		{
			return;
		}

		const titleNode = this.#layout.querySelector('.sign-b2e-document-setup__document-block_title');
		if (titleNode)
		{
			titleNode.textContent = newTitle;
			titleNode.setAttribute('title', newTitle);
		}
	}

	destroy(): void
	{
		if (this.#layout)
		{
			Dom.remove(this.#layout);
			this.#layout = null;
		}
		MenuManager.getMenuById(this.#menuId)?.destroy();
	}

	#render(): HTMLElement
	{
		const documentId = Text.encode(this.#documentData.id);
		const menuId = this.#menuId;
		const documentIcon = Text.encode(this.#getIcon());
		const documentType = Text.encode(this.#getDocumentType());
		const menuButton = Tag.render`
			<button class="ui-btn ui-btn-round ui-btn-sm ui-btn-light-border sign-b2e-document-setup__menu-btn" type="button" data-test-id="sign-document-block__menu-btn">
				<span class="sign-b2e-document-setup__menu-btn-icon"></span>
			</button>
		`;
		this.#menuButton = menuButton;

		Event.bind(menuButton, 'click', () => {
			this.#showMenu(menuId, menuButton);
		});

		return Tag.render`
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
						${Text.encode(Loc.getMessage('SIGN_DOCUMENT_BLOCK_LOADING_INFO'))}
					</span>
				</div>
				<div class="sign-b2e-document-setup__document-block_btn">
					${menuButton}
				</div>
			</div>
		`;
	}

	setLoading(loading: boolean): void
	{
		this.#options.isLoading = loading;
		if (!this.#layout)
		{
			return;
		}

		if (loading)
		{
			Dom.addClass(this.#layout, loadingClass);
		}
		else
		{
			Dom.removeClass(this.#layout, loadingClass);
		}
	}

	#getIcon(): string
	{
		return this.#options.isPlaceholderDocument
			? placeholderDocumentItemIcon
			: mixedDocumentItemIcon
		;
	}

	#getDocumentType(): string
	{
		return this.#options.isPlaceholderDocument
			? DocumentBlockType.placeholder
			: DocumentBlockType.mixed
		;
	}

	#createTitleWithEdit(): HTMLElement
	{
		const title = Text.encode(this.#documentData.title);

		return Tag.render`
			<div
				class="sign-b2e-document-setup__document-block_title-wrapper"
				data-test-id="sign-document-block__title-wrapper"
				onclick="${({ currentTarget }) => {
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

	#createTitleEditor(): HTMLElement
	{
		const input = Tag.render`<input type="text" class="sign-b2e-document-setup__title-editor-input" data-test-id="sign-document-block__title-input" maxlength="255" />`;
		const saveButton = Tag.render`
			<span
				class="ui-btn ui-btn-sm ui-btn --air sign-b2e-document-setup__title-editor_ok-btn"
				data-test-id="sign-document-block__title-ok-btn"
			>
			</span>
		`;

		input.value = this.#documentData.title ?? '';
		this.#focusInput(input);
		Event.bind(input, 'keydown', this.#handleTitleInputKeydown.bind(this, input, saveButton));
		Event.bind(saveButton, 'click', this.#handleTitleSaveButtonClick.bind(this, input, saveButton));

		return Tag.render`
			<div class="sign-b2e-document-setup__title-editor" data-test-id="sign-document-block__title-editor">
				<div class="sign-b2e-document-setup__title-editor_controls">
					<span class="sign-b2e-document-setup__title-editor-control">
						${input}
					</span>
					${saveButton}
					<span
						class="sign-b2e-document-setup__title-editor_discard-btn"
						data-test-id="sign-document-block__title-discard-btn"
						onclick="${({ target }) => {
							this.#toggleTitleEditor(target, false);
						}}"
					>
					</span>
				</div>
			</div>
		`;
	}

	#toggleTitleEditor(button: HTMLElement, shouldShow: boolean): void
	{
		const documentBlock = button.closest('.sign-b2e-document-setup__document-block');
		const innerBlock = documentBlock.querySelector('.sign-b2e-document-setup__document-block_inner');

		if (shouldShow)
		{
			Dom.clean(innerBlock);
			Dom.append(this.#createTitleEditor(), innerBlock);

			return;
		}

		Dom.clean(innerBlock);
		Dom.append(this.#createTitleWithEdit(), innerBlock);
	}

	#focusInput(input: HTMLElement): void
	{
		const observer = new MutationObserver(() => {
			if (input.isConnected)
			{
				input.focus();
				observer.disconnect();
			}
		});
		observer.observe(document.body, { childList: true, subtree: true });
	}

	async #handleTitleInputKeydown(
		input: HTMLInputElement,
		saveButton: HTMLElement,
		event: KeyboardEvent,
	): Promise<void>
	{
		if (event.key !== 'Enter')
		{
			return;
		}

		event.preventDefault();
		await this.#saveTitle(input, saveButton);
	}

	async #handleTitleSaveButtonClick(
		input: HTMLInputElement,
		saveButton: HTMLElement,
	): Promise<void>
	{
		await this.#saveTitle(input, saveButton);
	}

	async #saveTitle(input: HTMLInputElement, saveButton: HTMLElement): Promise<void>
	{
		if (Dom.hasClass(saveButton, 'ui-btn-wait'))
		{
			return;
		}

		Dom.addClass(saveButton, 'ui-btn-wait');
		try
		{
			await this.#modifyTitle(input.value);
		}
		finally
		{
			Dom.removeClass(saveButton, 'ui-btn-wait');
			this.#toggleTitleEditor(saveButton, false);
		}
	}

	async #modifyTitle(newValue: string): Promise<void>
	{
		if (this.#documentData.title === newValue)
		{
			return;
		}

		try
		{
			const titleData = await this.#api.modifyTitle(this.#documentData.uid, newValue);
			this.#documentData.title = newValue;
			this.emit('titleChange', {
				uid: this.#documentData.uid,
				title: newValue,
				blankTitle: titleData.blankTitle,
			});
		}
		catch (e)
		{
			console.error(e);
		}
	}

	#showMenu(menuId: string, bindElement: HTMLElement): void
	{
		let menu = MenuManager.getMenuById(menuId);
		if (!menu)
		{
			menu = MenuManager.create({
				id: menuId,
				bindElement,
				items: this.#getMenuItems(menuId, bindElement),
				autoHide: true,
			});
		}

		menu.getPopupWindow().setBindElement(bindElement);

		menu.toggle();
	}

	#getMenuItems(menuId: string, bindElement: HTMLElement): Array<Object>
	{
		const closeMenu = () => MenuManager.getMenuById(menuId)?.close();

		const menuButtons = [
			{
				text: Loc.getMessage('SIGN_DOCUMENT_BLOCK_EDIT_BUTTON'),
				onclick: (event, item) => {
					this.emit('edit', {
						documentData: this.#documentData,
						bindElement: event?.currentTarget ?? item?.getLayout?.()?.item ?? bindElement,
						closeMenu,
					});
				},
			},
			{
				text: Loc.getMessage('SIGN_DOCUMENT_BLOCK_REPLACE_BUTTON'),
				onclick: () => {
					closeMenu();
					this.#openReplaceFileDialog();
				},
			},
		];

		if (!this.#isTemplateMode)
		{
			menuButtons.push({
				text: Loc.getMessage('SIGN_DOCUMENT_BLOCK_DELETE_BUTTON'),
				onclick: () => {
					closeMenu();
					this.emit('delete', {
						id: this.#documentData.id,
						uid: this.#documentData.uid,
						blankId: this.#documentData.blankId,
					});
				},
			});
		}

		if (this.#documentData.id)
		{
			menuButtons.push({
				text: Loc.getMessage('SIGN_DOCUMENT_BLOCK_DOWNLOAD_BUTTON'),
				onclick: () => {
					closeMenu();
					this.#downloadBlank();
				},
			});
		}

		return menuButtons;
	}

	#downloadBlank(): void
	{
		if (!this.#documentData.isBlankDownloadable)
		{
			UI.Notification.Center.notify({
				content: Loc.getMessage('SIGN_DOCUMENT_BLOCK_DOWNLOAD_ERROR'),
			});

			return;
		}

		const url = this.#api.getBlankDownloadUrlByDocument(this.#documentData.id);
		const link = document.createElement('a');
		link.href = url;
		link.download = '';
		Dom.style(link, 'display', 'none');
		Dom.append(link, document.body);
		link.click();
		Dom.remove(link);
	}

	async #openReplaceFileDialog(): Promise<void>
	{
		const replaceConfirm = new ReplaceConfirm({
			documentId: this.#documentData.id,
			isPlaceholderDocument: this.#options.isPlaceholderDocument,
		});

		const result = await replaceConfirm.open();
		if (!result)
		{
			return;
		}

		if (!Array.isArray(result))
		{
			if (result.error === 'invalid-extension')
			{
				this.#showReplaceInvalidExtensionPopup();
			}

			return;
		}

		this.emit('replaceConfirmed', {
			documentData: this.#documentData,
			isPlaceholderDocument: this.#options.isPlaceholderDocument,
			files: result,
		});
	}

	#showReplaceInvalidExtensionPopup(): void
	{
		if (!this.#menuButton || !this.#menuButton.isConnected)
		{
			return;
		}

		setTimeout(() => {
			if (!this.#menuButton?.isConnected)
			{
				return;
			}

			const buttonWidth = this.#menuButton.getBoundingClientRect().width;
			const popupWidth = 280;
			const angleLeftOffset = 40;
			const arrowHalfWidth = 15;
			const offsetLeft = Math.round((buttonWidth - popupWidth) / 2 + angleLeftOffset);
			const angleOffset = Math.round(popupWidth / 2 - arrowHalfWidth);

			const messageCode = this.#options.isPlaceholderDocument
				? 'SIGN_DOCUMENT_BLOCK_REPLACE_INVALID_EXTENSION_HINT'
				: 'SIGN_DOCUMENT_BLOCK_REPLACE_INVALID_EXTENSION_MIXED_HINT'
			;
			const popup = new Popup({
				id: `sign-b2e-document-replace-invalid-ext-${this.#documentData.id}`,
				bindElement: this.#menuButton,
				content: Loc.getMessage(messageCode),
				padding: 10,
				offsetLeft,
				angle: {
					position: 'top',
					offset: angleOffset,
				},
				darkMode: true,
				width: popupWidth,
				autoHide: true,
				cacheable: false,
				bindOptions: {
					position: 'bottom',
				},
			});
			popup.show();
			setTimeout(() => popup.close(), 7000);
		}, 200);
	}
}
