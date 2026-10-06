import { Event, Loc, Text } from 'main.core';
import { PopupManager, type PopupOptions } from 'main.popup';

import { largeAttachmentApi } from './api';
import { findOrphanedLinks } from './orphan-detection';
import { type InsertedLink } from './link-inserter';
import {
	type FormAdapterUnsubscribe,
	type LargeAttachmentFormAdapter,
} from './type/form-adapter';
import { MainMailFormAdapter } from './adapter/main-mail-form-adapter';

export type PostSendPopupParams = {
	formAdapter?: Pick<LargeAttachmentFormAdapter, 'subscribeSubmit' | 'subscribeSendSuccess'>,
	formId?: string,
	getInserted: () => InsertedLink[],
	// Server-read of the "don't ask again" preference (fed by the component, as aha-guide's showAha).
	suppressed?: boolean,
	// User-option name to persist "don't ask again" under; passed from PHP to avoid drift (as ahaOptionName).
	optionName?: string,
	showPrompt?: PostSendPrompt,
	createPopup?: PopupFactory,
};

export type PostSendPrompt = (
	orphaned: InsertedLink[],
	onDelete: () => void,
) => void;

type ManagedPopup = {
	show(): void,
	close(): void,
};

type PopupFactory = (options: PopupOptions) => ManagedPopup;

type RootPopupManager = {
	create(options: PopupOptions): ManagedPopup,
};

type UserOptions = {
	save(category: string, name: string, valueName: string | null, value: string): void,
};

type RootWindow = Window & {
	BX?: {
		Main?: {
			PopupManager?: RootPopupManager,
		},
		userOptions?: UserOptions,
	},
};

// Must match Bitrix\Mail\Helper\Config\Guide::USER_OPTION_CATEGORY, same category the aha mark uses.
const USER_OPTION_CATEGORY = 'mail.guide';

const POPUP_ID = 'mail-large-attachment-post-send';
const POPUP_WIDTH = 420;

type UserOptionsGlobal = {
	userOptions?: UserOptions,
};

const loc = (key: string): string => Loc.getMessage(key) ?? '';

function getRootWindow(): RootWindow
{
	try
	{
		const rootWindow = window.top ?? window;
		void rootWindow.document.body;

		return rootWindow as RootWindow;
	}
	catch
	{
		return window as RootWindow;
	}
}

function makeButton(
	document: Document,
	text: string,
	className: string,
	testId: string,
	onClick: () => void,
): HTMLButtonElement
{
	const button = document.createElement('button');
	button.type = 'button';
	button.className = className;
	button.dataset.testid = testId;
	button.textContent = text;
	Event.bind(button, 'click', onClick);

	return button;
}

export class PostSendPopup
{
	#formAdapter: Pick<LargeAttachmentFormAdapter, 'subscribeSubmit' | 'subscribeSendSuccess'>;
	#getInserted: () => InsertedLink[];
	#optionName: string;
	#suppressed: boolean;
	#createPopup: PopupFactory;
	#showPrompt: PostSendPrompt | null;
	#capturedBody: string = '';
	#capturedLinks: InsertedLink[] = [];
	#handledTokens: Set<string> = new Set();
	#destroyed: boolean = false;
	#unsubscribes: FormAdapterUnsubscribe[] = [];

	constructor(params: PostSendPopupParams)
	{
		this.#formAdapter = params.formAdapter ?? new MainMailFormAdapter({
			formId: params.formId ?? '',
			uploaderControlId: '',
		});
		this.#getInserted = params.getInserted;
		this.#suppressed = params.suppressed ?? false;
		this.#optionName = params.optionName ?? '';
		this.#createPopup = params.createPopup ?? this.#createRootPopup;
		this.#showPrompt = params.showPrompt ?? null;
	}

	start(): void
	{
		if (this.#destroyed || this.#unsubscribes.length > 0)
		{
			return;
		}

		this.#unsubscribes = [
			this.#formAdapter.subscribeSubmit(this.#handleSubmit),
			this.#formAdapter.subscribeSendSuccess(this.#handleAjaxSuccess),
		];
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#unsubscribes.forEach((unsubscribe: FormAdapterUnsubscribe): void => {
			unsubscribe();
		});
		this.#unsubscribes = [];
	}

	#handleSubmit = (body: string): void => {
		if (this.#destroyed)
		{
			return;
		}

		this.#capturedBody = body;
		this.#capturedLinks = this.#getInserted().map((link: InsertedLink): InsertedLink => ({
			...link,
			fileIds: [...link.fileIds],
		}));
	};

	#handleAjaxSuccess = (): void => {
		if (this.#destroyed)
		{
			return;
		}

		this.#processOrphans();
	};

	#processOrphans(): void
	{
		const orphaned = findOrphanedLinks(this.#capturedBody, this.#capturedLinks)
			.filter((link: InsertedLink): boolean => (
				link.token.length > 0
				&& !this.#handledTokens.has(link.token)
			));

		if (orphaned.length === 0)
		{
			return;
		}

		orphaned.forEach((link: InsertedLink): void => {
			this.#handledTokens.add(link.token);
		});

		if (this.#suppressed)
		{
			return;
		}

		this.#showPopup(orphaned);
	}

	#showPopup(orphaned: InsertedLink[]): void
	{
		if (this.#showPrompt)
		{
			this.#showPrompt(
				orphaned.map((link: InsertedLink): InsertedLink => ({
					...link,
					fileIds: [...link.fileIds],
				})),
				(): void => {
					this.#deleteOrphans(orphaned);
				},
			);

			return;
		}

		const rootDocument = getRootWindow().document;
		const content = rootDocument.createElement('div');
		content.className = 'mail-large-attachment-post-send';
		content.dataset.testid = 'mail-large-attachment-post-send-popup';

		const textNode = rootDocument.createElement('div');
		textNode.className = 'mail-large-attachment-post-send__text';
		textNode.textContent = loc('MAIL_LARGE_ATTACHMENT_POST_SEND_TEXT');

		const toggle = rootDocument.createElement('label');
		toggle.className = 'mail-large-attachment-post-send__toggle';
		const checkbox = rootDocument.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.className = 'mail-large-attachment-post-send__checkbox';
		checkbox.dataset.testid = 'mail-large-attachment-post-send-checkbox';
		const toggleText = rootDocument.createElement('span');
		toggleText.className = 'mail-large-attachment-post-send__toggle-text';
		toggleText.textContent = loc('MAIL_LARGE_ATTACHMENT_POST_SEND_DONT_ASK');
		toggle.append(checkbox, toggleText);

		const buttonBar = rootDocument.createElement('div');
		buttonBar.className = 'mail-large-attachment-post-send__buttons';
		content.append(textNode, toggle, buttonBar);

		let popup: ManagedPopup | null = null;

		const deleteButton = makeButton(
			rootDocument,
			loc('MAIL_LARGE_ATTACHMENT_POST_SEND_DELETE'),
			'ui-btn ui-btn-sm ui-btn-primary',
			'mail-large-attachment-post-send-delete-button',
			(): void => {
				this.#applySuppression(checkbox.checked);
				this.#deleteOrphans(orphaned);
				popup?.close();
			},
		);

		const keepButton = makeButton(
			rootDocument,
			loc('MAIL_LARGE_ATTACHMENT_POST_SEND_KEEP'),
			'ui-btn ui-btn-sm ui-btn-link',
			'mail-large-attachment-post-send-keep-button',
			(): void => {
				this.#applySuppression(checkbox.checked);
				popup?.close();
			},
		);

		buttonBar.append(deleteButton, keepButton);

		popup = this.#createPopup({
			id: `${POPUP_ID}-${Text.getRandom()}`,
			titleBar: loc('MAIL_LARGE_ATTACHMENT_POST_SEND_TITLE'),
			content,
			targetContainer: rootDocument.body,
			width: POPUP_WIDTH,
			overlay: true,
			closeIcon: true,
			closeByEsc: true,
			cacheable: false,
		});

		popup.show();
	}

	// The email has already been sent. Closing or keeping leaves the uploaded files untouched.
	#deleteOrphans(links: InsertedLink[]): void
	{
		links.forEach((link: InsertedLink): void => {
			largeAttachmentApi.deleteUploaded({ token: link.token }).catch((): void => {});
		});
	}

	#applySuppression(checked: boolean): void
	{
		if (!checked)
		{
			return;
		}

		this.#suppressed = true;
		this.#saveOption();
	}

	#saveOption(): void
	{
		if (this.#optionName.length === 0)
		{
			return;
		}

		const rootUserOptions = getRootWindow().BX?.userOptions;
		const localUserOptions = (BX as unknown as UserOptionsGlobal).userOptions;
		(rootUserOptions ?? localUserOptions)?.save(USER_OPTION_CATEGORY, this.#optionName, null, 'Y');
	}

	#createRootPopup = (options: PopupOptions): ManagedPopup => {
		const rootWindow = getRootWindow();
		const rootPopupManager = rootWindow.BX?.Main?.PopupManager;
		if (rootPopupManager)
		{
			return rootPopupManager.create(options);
		}

		return PopupManager.create(options);
	};
}
