import { Dom, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { nextTick } from 'ui.vue3';
import { type DraftLargeAttachment } from 'mail.client.large-attachment';

import { BodyNodePrefix } from '../../const';
import { ComposeFormEvent } from '../../const/event';
import { type ComposeEditorAdapter } from '../../infrastructure/adapter/editor/types';
import { getSelectedSender } from '../../model/compose/compose';
import { type ComposeState, type RecipientItemDto } from '../../model/compose/types';

type DraftRecipient = {
	name: string,
	email: string,
	entityType?: string,
	entityId?: number,
	avatar?: string,
};

const DraftBodyNodeClass = Object.freeze({
	Signature: 'mail-compose-draft-signature',
	Quote: 'mail-compose-draft-quote',
} as const);
const DraftSignatureSelectionClassPrefix = 'mail-compose-draft-signature-selection-';

const AddressBookEntity = 'address_book';
const AddressBookAvatar = '/bitrix/images/mail/entity_provider_icons/addressbook.svg';

type ComposeSnapshot = {
	clientId: string,
	sender: { name: string, email: string } | null,
	to: DraftRecipient[],
	cc: DraftRecipient[],
	bcc: DraftRecipient[],
	subject: string,
	body: string,
	bodyFormat: 'html',
	mode: 'new' | 'reply' | 'forward',
	parentMessageId: number | null,
	attachments: Array<{ source: 'draft' | 'disk' | 'upload', id: string }>,
	largeAttachments?: DraftLargeAttachment[],
};

type DraftAttachmentView = {
	id: number,
	name: string,
	size: number,
	contentType: string | null,
};

export type DraftIntegrationParams = {
	formId: string,
	state: ComposeState,
	editor: ComposeEditorAdapter,
	getLargeAttachments?: () => DraftLargeAttachment[] | null,
	onLoadingChange?: (loading: boolean) => void,
};

const LegacyChangedEvent = 'MailForm:compose:changed';
const LegacyDestroyEvent = 'MailForm:destroy';
const LegacyBeforeCloseEvent = 'MailForm:beforeClose';
const LegacyBeforeSubmitEvent = 'MailForm:beforeSubmit';
const LegacySubmitSuccessEvent = 'MailForm:submit:ajaxSuccess';

export const DraftBridgeEvent = Object.freeze({
	BeforeClose: 'BX.Mail.Client.ComposeForm:beforeClose',
	BeforeSubmit: 'BX.Mail.Client.ComposeForm:beforeSubmit',
	SubmitAjaxSuccess: 'BX.Mail.Client.ComposeForm:submitAjaxSuccess',
});

export class DraftComposeAdapter
{
	#params: DraftIntegrationParams;
	#restored = false;
	#active = true;
	#subscriptions: Map<() => void, { eventName: string, listener: (event: BaseEvent) => void }> = new Map();
	#ready: Promise<void>;
	#resolveReady: () => void = (): void => {};
	#unsubscribeReady: () => void = (): void => {};
	#attachmentSources: Map<string, ComposeSnapshot['attachments'][number]> = new Map();
	#largeAttachments: DraftLargeAttachment[] = [];
	#draftLoadingHeld = false;
	#draftEnabled: boolean;
	#draftLoadingEnabled: boolean;
	#restoredSignatureId: number | null | undefined;

	constructor(params: DraftIntegrationParams)
	{
		this.#params = params;
		this.#draftEnabled = Type.isStringFilled(params.state.draft.clientId);
		this.#draftLoadingEnabled = this.#draftEnabled && params.state.draft.id > 0;
		this.#ready = new Promise((resolve): void => {
			this.#resolveReady = resolve;
			this.#unsubscribeReady = params.editor.subscribeReady(resolve);
		});
	}

	get restored(): boolean
	{
		return this.#restored;
	}

	get largeAttachments(): DraftLargeAttachment[]
	{
		return this.#largeAttachments;
	}

	getComposeSnapshot(): ComposeSnapshot
	{
		const { editor, state } = this.#params;
		const sender = getSelectedSender(state);
		const liveLargeAttachments = this.#params.getLargeAttachments?.();

		return {
			clientId: state.draft.clientId,
			sender: sender ? { name: sender.name, email: sender.email } : null,
			to: state.recipients.to.map((item): DraftRecipient => toDraftRecipient(item)),
			cc: state.recipients.cc.map((item): DraftRecipient => toDraftRecipient(item)),
			bcc: state.recipients.bcc.map((item): DraftRecipient => toDraftRecipient(item)),
			subject: state.subject,
			body: this.#getMarkedDraftBody(),
			bodyFormat: 'html',
			mode: state.scenario === 'replyAll' ? 'reply' : state.scenario,
			parentMessageId: state.parentMessageId,
			attachments: editor.getFiles().map((file) => this.#attachmentSources.get(file.fileId) ?? {
				source: file.id === null ? 'upload' : 'disk',
				id: file.id === null ? file.fileId : String(file.id),
			}),
			largeAttachments: liveLargeAttachments ?? this.#largeAttachments,
		};
	}

	waitForDraftReady(): Promise<void>
	{
		return this.#ready;
	}

	async applyComposeSnapshot(snapshot: ComposeSnapshot, attachments: DraftAttachmentView[] = []): Promise<void>
	{
		await this.#ready;
		if (!this.#active)
		{
			return;
		}

		const selectedSender = resolveSender(this.#params.state, snapshot.sender);
		if (snapshot.sender && !selectedSender)
		{
			throw new Error('Draft sender is unavailable.');
		}

		if (!(await this.#params.editor.replaceFiles(attachments)))
		{
			throw new Error('Draft attachments cannot be restored.');
		}

		const state = this.#params.state;
		state.selectedSender = selectedSender;
		state.recipients.to = snapshot.to.map((recipient) => toRecipientItem(recipient));
		state.recipients.cc = snapshot.cc.map((recipient) => toRecipientItem(recipient));
		state.recipients.bcc = snapshot.bcc.map((recipient) => toRecipientItem(recipient));
		state.bccExpanded = state.recipients.bcc.length > 0;
		state.subject = snapshot.subject;
		state.scenario = snapshot.mode;
		state.parentMessageId = snapshot.parentMessageId;
		state.attachments.folded = false;
		this.#largeAttachments = snapshot.largeAttachments ?? [];

		// A sender change rewrites the signature node on the next Vue tick. Let it finish before the saved body
		// wins, otherwise the default signature can replace text edited in the draft.
		await nextTick();
		if (!this.#active)
		{
			return;
		}

		if (!this.#params.editor.setBody(this.#adoptDraftBodyNodes(snapshot.body)))
		{
			throw new Error('Draft body cannot be restored.');
		}

		if (this.#params.editor.getBodyNode(this.#params.editor.bodyNodes.quote))
		{
			state.body.quoteFolded = false;
		}

		const signatureNode = this.#params.editor.getBodyNode(this.#params.editor.bodyNodes.signature);
		if (!signatureNode)
		{
			state.selectedSignatureId = null;
		}
		else if (!Type.isUndefined(this.#restoredSignatureId))
		{
			state.selectedSignatureId = this.#restoredSignatureId;
		}

		this.syncDraftAttachmentSources(snapshot.attachments, attachments);
		this.#restored = true;
	}

	#adoptDraftBodyNodes(html: string): string
	{
		const template = document.createElement('template');
		template.innerHTML = html;
		this.#restoredSignatureId = undefined;

		const signatureNode = this.#adoptDraftBodyNode(
			template.content,
			BodyNodePrefix.Signature,
			this.#params.editor.bodyNodes.signature,
			DraftBodyNodeClass.Signature,
		);
		if (signatureNode)
		{
			const selectionClass = [...signatureNode.classList]
				.find((className: string): boolean => className.startsWith(DraftSignatureSelectionClassPrefix));
			if (selectionClass)
			{
				const value = selectionClass.slice(DraftSignatureSelectionClassPrefix.length);
				const signatureId = Number(value);
				if (value === 'none')
				{
					this.#restoredSignatureId = null;
				}
				else if (Number.isInteger(signatureId) && signatureId > 0)
				{
					this.#restoredSignatureId = signatureId;
				}
				Dom.removeClass(signatureNode, selectionClass);
				if ((signatureNode.getAttribute('class') ?? '').trim() === '')
				{
					signatureNode.removeAttribute('class');
				}
			}
		}
		this.#adoptDraftBodyNode(
			template.content,
			BodyNodePrefix.Quote,
			this.#params.editor.bodyNodes.quote,
			DraftBodyNodeClass.Quote,
		);

		return template.innerHTML;
	}

	#adoptDraftBodyNode(body: DocumentFragment, prefix: string, currentId: string, markerClass: string): Element | null
	{
		const nodes = [...body.children].filter((node: Element): boolean => (
			Dom.hasClass(node, markerClass)
			|| node.id === prefix
			|| node.id.startsWith(`${prefix}-`)
		));
		const [node, ...duplicates] = nodes;
		if (node)
		{
			node.id = currentId;
			Dom.removeClass(node, markerClass);
			if ((node.getAttribute('class') ?? '').trim() === '')
			{
				node.removeAttribute('class');
			}
		}
		duplicates.forEach((duplicate: Element): void => duplicate.remove());

		return node ?? null;
	}

	#getMarkedDraftBody(): string
	{
		const markedNodes = [
			[this.#params.editor.bodyNodes.signature, DraftBodyNodeClass.Signature],
			[this.#params.editor.bodyNodes.quote, DraftBodyNodeClass.Quote],
		].map(([nodeId, markerClass]): [HTMLElement | null, string] => {
			const node = this.#params.editor.getBodyNode(nodeId);
			if (node)
			{
				Dom.addClass(node, markerClass);
			}

			return [node, markerClass];
		});
		const signatureNode = this.#params.editor.getBodyNode(this.#params.editor.bodyNodes.signature);
		const signatureSelectionClass = `${DraftSignatureSelectionClassPrefix}${this.#params.state.selectedSignatureId ?? 'none'}`;
		if (signatureNode)
		{
			Dom.addClass(signatureNode, signatureSelectionClass);
		}

		try
		{
			return this.#params.editor.getBody();
		}
		finally
		{
			if (signatureNode)
			{
				Dom.removeClass(signatureNode, signatureSelectionClass);
			}
			markedNodes.forEach(([node, markerClass]): void => {
				if (node)
				{
					Dom.removeClass(node, markerClass);
				}
			});
		}
	}

	syncDraftAttachmentSources(
		canonicalSources: ComposeSnapshot['attachments'],
		attachments: DraftAttachmentView[],
		submittedSources: ComposeSnapshot['attachments'] = [],
	): void
	{
		const files = this.#params.editor.getFiles();
		const currentSources = files.map((file) => this.#attachmentSources.get(file.fileId) ?? {
			source: file.id === null ? 'upload' as const : 'disk' as const,
			id: file.id === null ? file.fileId : String(file.id),
		});
		const previousSources = new Map(this.#attachmentSources);
		this.#attachmentSources.clear();

		if (submittedSources.length > 0)
		{
			files.forEach((file, fileIndex: number): void => {
				const source = currentSources[fileIndex];
				const submittedIndex = submittedSources.findIndex((submittedSource) => (
					submittedSource.source === source.source && submittedSource.id === source.id
				));
				const canonicalSource = canonicalSources[submittedIndex];
				if (canonicalSource)
				{
					this.#attachmentSources.set(file.fileId, canonicalSource);
				}
				else
				{
					const previousSource = previousSources.get(file.fileId);
					if (previousSource)
					{
						this.#attachmentSources.set(file.fileId, previousSource);
					}
				}
			});

			return;
		}

		attachments.forEach((attachment: DraftAttachmentView, index: number): void => {
			const source = canonicalSources[index];
			if (source)
			{
				this.#attachmentSources.set(`n${attachment.id}`, source);
			}
		});
	}

	setDraftLoading(loading: boolean): void
	{
		if (!this.#draftLoadingEnabled)
		{
			return;
		}

		if (!loading && this.#draftLoadingHeld)
		{
			return;
		}

		this.#applyDraftLoading(loading);
	}

	holdDraftLoading(): void
	{
		if (!this.#draftLoadingEnabled)
		{
			return;
		}

		this.#draftLoadingHeld = true;
		this.#applyDraftLoading(true);
	}

	releaseDraftLoading(): void
	{
		if (!this.#draftLoadingEnabled)
		{
			return;
		}

		this.#draftLoadingHeld = false;
		this.#applyDraftLoading(false);
	}

	#applyDraftLoading(loading: boolean): void
	{
		this.#params.state.draft.isLoading = loading;
		this.#params.onLoadingChange?.(loading);
	}

	setDraftRestoreFailed(failed: boolean): void
	{
		this.#params.state.draft.restoreFailed = failed;
	}

	showError(message: string): void
	{
		this.#params.state.errors = [{ message, code: null }];
	}

	getDraftLifecycleToken(): number
	{
		return this.#active ? 0 : 1;
	}

	isDraftLifecycleActive(token: number): boolean
	{
		return this.#active && token === 0;
	}

	subscribe(eventName: string, handler: (...data: never[]) => void): void
	{
		const composeEvent = resolveComposeEvent(eventName);
		if (!composeEvent)
		{
			return;
		}

		const listener = (event: BaseEvent): void => {
			if ((event.getData() as { formId?: string } | undefined)?.formId === this.#params.formId)
			{
				handler((event.getData() as { data?: never } | undefined)?.data as never);
			}
		};
		this.#subscriptions.set(handler, { eventName: composeEvent, listener });
		EventEmitter.subscribe(composeEvent, listener);
	}

	unsubscribe(eventName: string, handler: () => void): void
	{
		const subscription = this.#subscriptions.get(handler);
		if (subscription)
		{
			EventEmitter.unsubscribe(subscription.eventName, subscription.listener);
			this.#subscriptions.delete(handler);
		}
	}

	destroy(): void
	{
		this.#active = false;
		this.#unsubscribeReady();
		this.#resolveReady();
		this.#subscriptions.forEach(({ eventName, listener }): void => {
			EventEmitter.unsubscribe(eventName, listener);
		});
		this.#subscriptions.clear();
	}
}

function resolveComposeEvent(eventName: string): string | null
{
	if (eventName === LegacyChangedEvent)
	{
		return ComposeFormEvent.Changed;
	}

	if (eventName === LegacyDestroyEvent)
	{
		return ComposeFormEvent.Destroy;
	}

	if (eventName === LegacyBeforeCloseEvent)
	{
		return DraftBridgeEvent.BeforeClose;
	}

	if (eventName === LegacyBeforeSubmitEvent)
	{
		return DraftBridgeEvent.BeforeSubmit;
	}

	if (eventName === LegacySubmitSuccessEvent)
	{
		return DraftBridgeEvent.SubmitAjaxSuccess;
	}

	return null;
}

function toDraftRecipient(item: RecipientItemDto): DraftRecipient
{
	const customData = item.customData as Record<string, unknown> | undefined;
	const entityId = Number(customData?.entityId ?? item.id);
	const title = item.title as string | { text?: string } | undefined;
	const name = customData?.name ?? customData?.title ?? (Type.isString(title) ? title : title?.text);

	return {
		name: String(name ?? ''),
		email: String(customData?.email ?? item.id),
		entityType: item.entityId,
		...(entityId > 0 ? { entityId } : {}),
		...(item.entityId !== AddressBookEntity && Type.isStringFilled(item.avatar) ? { avatar: item.avatar } : {}),
	};
}

function toRecipientItem(recipient: DraftRecipient): RecipientItemDto
{
	const title = recipient.name || recipient.email;

	return {
		id: recipient.email,
		entityId: recipient.entityType ?? AddressBookEntity,
		title,
		...(recipient.avatar ? { avatar: recipient.avatar } : {}),
		...(!recipient.avatar && (recipient.entityType === AddressBookEntity || !recipient.entityType)
			? { avatar: AddressBookAvatar }
			: {}),
		customData: {
			name: title,
			email: recipient.email,
			entityType: recipient.entityType ?? AddressBookEntity,
			entityId: recipient.entityId,
		},
	};
}

function resolveSender(
	state: ComposeState,
	sender: ComposeSnapshot['sender'],
): string | null
{
	if (!sender)
	{
		return null;
	}

	const email = sender.email.trim().toLowerCase();

	return state.senders.find((item) => item.email.trim().toLowerCase() === email)?.formated ?? null;
}
