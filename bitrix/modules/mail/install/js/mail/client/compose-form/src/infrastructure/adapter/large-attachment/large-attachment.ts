import { Dom, Loc, Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { PopupManager, type Popup } from 'main.popup';
import { BannerDispatcher } from 'ui.banner-dispatcher';
import { FeaturePromotersRegistry } from 'ui.info-helper';
import { AlertDesign } from 'ui.system.alert';
import { Alert } from 'ui.system.alert.vue';
import { BitrixVue, defineComponent, inject, type App as VueApp, type InjectionKey } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import {
	type AttachmentChangeType,
	type FormAttachment,
	type LargeAttachmentFormAdapter,
	type LargeAttachmentSendContract,
	type LargeAttachmentSubmitState,
	type DraftLargeAttachment,
} from 'mail.client.large-attachment';

import { AttachmentAnchorTestId, NoticesTestId, Phrase } from '../../../const';
import {
	ComposeFormEvent,
	type ComposeFormEventPayload,
	type ComposeFormSubmitPayload,
} from '../../../const/event';
import { loc } from '../../../lib/loc/loc';
import {
	type BodyPosition,
	type ComposeEditorAdapter,
	type EditorAttachment,
} from '../editor/types';

/**
 * The wording belongs to the core of the large attachments, whose extension comes with the form, so the form
 * writes none of its own.
 */
const CorePhrase = Object.freeze({
	IndicatorLabel: 'MAIL_LARGE_ATTACHMENT_INDICATOR_LABEL',
	AhaText: 'MAIL_LARGE_ATTACHMENT_AHA_TEXT',
	UploadError: 'MAIL_LARGE_ATTACHMENT_UPLOAD_ERROR',
	NoSpaceText: 'MAIL_LARGE_ATTACHMENT_NO_SPACE_TEXT',
	Retry: 'MAIL_LARGE_ATTACHMENT_RETRY',
});

/** Kept verbatim: the tests of the large attachments point at these very values. */
const IndicatorTestId = 'mail-large-attachment-indicator';
const RetryTestId = 'mail-large-attachment-retry-button';
const AhaTestId = 'mail-large-attachment-aha-guide';

/** Mark of the inline error block, in the naming of this form. */
const ErrorTestId = 'mail-compose-large-attachment-error';

/** Events of the Disk uploader integration, the same source the core reads. */
const UploaderEvent = Object.freeze({
	ItemAdd: 'BX.Disk.Uploader.Integration:Item:onAdd',
	ItemComplete: 'BX.Disk.Uploader.Integration:Item:onComplete',
	ItemRemove: 'BX.Disk.Uploader.Integration:Item:onRemove',
});

/** Prefix of the hidden contract fields, owned by this adapter alone. */
const ContractField = 'data[__largeAttachments]';

/** Code the slider of the tariff limit is opened by. */
const LimitSliderCode = 'limit_v2_mail_large_attachment_disk_upload';

/** Must match `Guide::USER_OPTION_CATEGORY`: the server reads the mark of the shown hint. */
const UserOptionCategory = 'mail.guide';

const AhaPopupId = 'mail-compose-form-large-attachment-aha';
const AhaPopupWidth = 320;
const AhaAutoDismissDelay = 12000;

const noop = (): void => {};

/** The core keeps `FormAdapterUnsubscribe` out of its public surface, so the shape is named here. */
type Unsubscribe = () => void;

const coreLoc = (phraseCode: string): string => Loc.getMessage(phraseCode) ?? '';

type UserOptionsGlobal = {
	userOptions?: {
		save(category: string, name: string, valueName: string | null, value: string): void,
	},
};

/** Only the call the send gate makes is declared. */
type LargeAttachmentCore = {
	prepareSubmit(): LargeAttachmentSubmitState,
	getDraftState(): DraftLargeAttachment[],
};

export type LargeAttachmentSendGate = {
	prepareSend(): boolean,
};

/**
 * The adapter is built after the application is mounted, as it reads the body and the files through the adapter
 * of the editor, so the form is given a way to ask for the gate and asks at the moment of the send.
 */
export type LargeAttachmentGateResolver = () => LargeAttachmentSendGate | null;

export const largeAttachmentGateKey: InjectionKey<LargeAttachmentGateResolver> = Symbol(
	'mail-compose-form-large-attachment-gate',
);

const resolveNoGate: LargeAttachmentGateResolver = (): null => null;

/** With the large attachments switched off no adapter is provided, and the default lets the send through. */
export function useLargeAttachmentGate(): LargeAttachmentGateResolver
{
	return inject(largeAttachmentGateKey, resolveNoGate);
}

/** Shape of the banner queue of the portal, as the dispatcher hands it over. */
export type HintQueue = (show: (onDone: Function) => Popup) => void;

export type LargeAttachmentAdapterParams = {
	/**
	 * Identifier of the server `<form>`: the core keeps its instances by it, and the hidden contract fields go
	 * into that very form.
	 */
	formId: string,
	/** Container of the application: the notices and the anchor of the hint are looked for inside it. */
	containerId: string,
	/** The body and the files are read through this adapter alone. */
	editor: ComposeEditorAdapter,
	showAha: boolean,
	ahaOptionName: string,
	/** For the tests: the form itself leaves the banner queue of the portal. */
	hintQueue?: HintQueue,
};

type NoticeProps = {
	design: string,
	text: string,
	testId: string,
	liveRole: string,
	actionText?: string,
	hasCloseButton?: boolean,
	onAction?: () => void,
	onClose?: () => void,
};

type MountedNotice = {
	app: VueApp,
	host: HTMLElement,
};

/**
 * One component draws both the indicator of the set and the inline error block: they differ by the design of
 * the alert, by the way they are announced and by the action they offer.
 */
// @vue/component
const LargeAttachmentNotice = defineComponent({
	name: 'MailComposeLargeAttachmentNotice',

	components: {
		Alert,
		UiButton,
	},

	props: {
		design: {
			type: String,
			required: true,
		},
		text: {
			type: String,
			required: true,
		},
		testId: {
			type: String,
			required: true,
		},
		/** The way a notice is announced differs per kind of it, so the role comes from the caller. */
		liveRole: {
			type: String,
			required: true,
		},
		/** An action is offered by an error alone, and only when the core has something to repeat. */
		actionText: {
			type: String,
			default: '',
		},
		hasCloseButton: {
			type: Boolean,
			default: false,
		},
	},

	emits: ['action', 'close'],

	setup()
	{
		return {
			retryTestId: RetryTestId,
			actionStyle: AirButtonStyle.PLAIN,
			actionSize: ButtonSize.SMALL,
		};
	},

	template: `
		<div
			class="mail-compose-large-attachment-notice"
			:data-testid="testId"
			:role="liveRole"
		>
			<Alert :design="design" :hasCloseButton="hasCloseButton" @closeButtonClick="$emit('close')">
				{{ text }}
				<span v-if="actionText !== ''" class="mail-compose-large-attachment-notice__action">
					<UiButton
						:text="actionText"
						:style="actionStyle"
						:size="actionSize"
						:dataset="{ testid: retryTestId }"
						@click="$emit('action')"
					/>
				</span>
			</Alert>
		</div>
	`,
});

/**
 * The markup comes from the core, which encodes the address and the title of the set itself. It is parsed and
 * not written as text: the core cuts this very markup out of the body when the set changes, so the node has to
 * serialise back exactly as it came.
 */
function parseInsertedNode(html: string): HTMLElement | null
{
	const parsed = new DOMParser().parseFromString(html, 'text/html').body.firstElementChild;

	return parsed instanceof HTMLElement ? document.importNode(parsed, true) : null;
}

/**
 * The body and the files are reached through the adapter of the editor alone, and the events of the send come
 * from the form itself rather than from the runtime of the old form.
 */
export class LargeAttachmentAdapter implements LargeAttachmentFormAdapter
{
	readonly formId: string;

	#containerId: string;
	#editor: ComposeEditorAdapter;
	#core: LargeAttachmentCore | null = null;
	#showAhaHint: boolean;
	#ahaOptionName: string;
	#hintQueue: HintQueue;
	#ahaPopup: Popup | null = null;
	#ahaTimer: number | null = null;
	#isAhaShown: boolean = false;
	#indicator: MountedNotice | null = null;
	#error: MountedNotice | null = null;
	#teardown: Set<Unsubscribe> = new Set();
	#isDestroyed: boolean = false;

	constructor(params: LargeAttachmentAdapterParams)
	{
		this.formId = params.formId;
		this.#containerId = params.containerId;
		this.#editor = params.editor;
		this.#showAhaHint = params.showAha;
		this.#ahaOptionName = params.ahaOptionName;
		this.#hintQueue = params.hintQueue ?? ((show: (onDone: Function) => Popup): void => {
			BannerDispatcher.normal.toQueue(show);
		});
	}

	/**
	 * The core is built over the adapter, so it arrives after the constructor; without a core the send gate has
	 * nobody to ask and lets the message go.
	 */
	setCore(core: LargeAttachmentCore | null): void
	{
		this.#core = core;
	}

	/**
	 * The core restores the links the user deleted from the body before it answers. An unfinished conversion
	 * holds the send back, and so does a set that could not be restored: the server refuses such a message with
	 * `MAIL_LA_LINK_MISSING` while the files stay on Disk.
	 */
	prepareSend(): boolean
	{
		const state: LargeAttachmentSubmitState = this.#core?.prepareSubmit() ?? 'ready';
		if (state === 'pending')
		{
			this.#showError(loc(Phrase.LargeAttachmentUploading));

			return false;
		}

		if (state === 'error')
		{
			this.#showError(loc(Phrase.LargeAttachmentLinkLost));

			return false;
		}

		return true;
	}

	getDraftState(): DraftLargeAttachment[]
	{
		return this.#core?.getDraftState() ?? [];
	}

	/** A file still being uploaded to Disk carries no object identifier yet. */
	getFiles(): FormAttachment[]
	{
		return this.#editor.getFiles().map((file: EditorAttachment): FormAttachment => ({
			id: file.id,
			size: file.size,
		}));
	}

	getBody(): string
	{
		return this.#editor.getBody();
	}

	/**
	 * The link goes in where the caret stands, and at the end of the body when the caret is out of reach. The
	 * core hands the address over as plain text as well, for a body that takes no markup; here the node goes in.
	 */
	insertBody(text: string, html: string): boolean
	{
		const node = parseInsertedNode(html);
		if (!node)
		{
			return false;
		}

		const positions: BodyPosition[] = [{ at: 'caret' }, { at: 'end' }];

		const inserted = positions.some((position: BodyPosition): boolean => this.#editor.insertNode(node, position));
		if (inserted)
		{
			this.#notifyChanged();
		}

		return inserted;
	}

	setBody(html: string): boolean
	{
		const changed = this.#editor.setBody(html);
		if (changed)
		{
			this.#notifyChanged();
		}

		return changed;
	}

	/**
	 * The whole set of the fields is rewritten every time: they belong to this adapter alone, and the server
	 * reads the contracts by their order in the form. A form that is not on the page is a refusal and not a
	 * silent loss: the core deletes the uploaded set from Disk on it.
	 */
	serializeSendContracts(contracts: LargeAttachmentSendContract[]): boolean
	{
		const form = document.getElementById(this.formId);
		if (!(form instanceof HTMLFormElement))
		{
			return false;
		}

		form.querySelectorAll<HTMLInputElement>(`input[name^="${ContractField}"]`).forEach(
			(input: HTMLInputElement): void => {
				Dom.remove(input);
			},
		);

		contracts.forEach((contract: LargeAttachmentSendContract, index: number): void => {
			Dom.append(renderContractField(`${ContractField}[${index}][token]`, contract.token), form);

			contract.fileIds.forEach((fileId: number): void => {
				Dom.append(
					renderContractField(`${ContractField}[${index}][fileIds][]`, String(fileId)),
					form,
				);
			});
		});

		return true;
	}

	/**
	 * The label speaks of the whole set rather than of a file of it, so a set that is already announced is left
	 * alone and an empty one takes the indicator away.
	 */
	syncIndicator(fileIds: number[]): void
	{
		if (fileIds.length === 0)
		{
			this.#indicator = unmountNotice(this.#indicator);

			return;
		}

		if (this.#indicator || this.#isDestroyed)
		{
			return;
		}

		this.#indicator = this.#mountNotice({
			design: AlertDesign.tinted,
			text: coreLoc(CorePhrase.IndicatorLabel),
			testId: IndicatorTestId,
			liveRole: 'status',
		});
	}

	showUploadError(onRetry?: () => void): void
	{
		this.#showError(coreLoc(CorePhrase.UploadError), onRetry);
	}

	/** The text of the core names the way out on its own, so the notice needs no title of its own. */
	showNoSpaceError(onRetry?: () => void): void
	{
		this.#showError(coreLoc(CorePhrase.NoSpaceText), onRetry);
	}

	showTariffUnavailable(): void
	{
		FeaturePromotersRegistry.getPromoter({ code: LimitSliderCode }).show();
	}

	/**
	 * The hint points at the list of the attachments: the node the old form bound it to is absent in this
	 * layout. The mark of the show is written the moment the hint appears, so a user meets it once, and a hint
	 * with nothing to point at is not shown and leaves no mark.
	 */
	showAha(): void
	{
		const anchor = this.#resolveAhaAnchor();
		if (this.#isDestroyed || this.#isAhaShown || !this.#showAhaHint || !anchor)
		{
			return;
		}

		this.#isAhaShown = true;
		this.#hintQueue((onDone: Function): Popup => {
			this.#ahaPopup = this.#createAhaPopup(anchor, onDone);
			this.#ahaPopup.show();
			this.#saveShownMark();
			this.#ahaTimer = window.setTimeout((): void => {
				this.#ahaPopup?.close();
			}, AhaAutoDismissDelay);

			return this.#ahaPopup;
		});
	}

	subscribeFileChange(handler: (type: AttachmentChangeType) => void): Unsubscribe
	{
		const unsubscribes = [
			this.#subscribeGlobal(UploaderEvent.ItemAdd, (): void => handler('add')),
			this.#subscribeGlobal(UploaderEvent.ItemComplete, (): void => handler('complete')),
			this.#subscribeGlobal(UploaderEvent.ItemRemove, (): void => handler('remove')),
		];

		return (): void => {
			unsubscribes.forEach((unsubscribe: Unsubscribe): void => {
				unsubscribe();
			});
		};
	}

	subscribeSubmit(handler: (body: string) => void): Unsubscribe
	{
		return this.#subscribeFormEvent<ComposeFormSubmitPayload>(
			ComposeFormEvent.Submit,
			(payload: ComposeFormSubmitPayload): void => {
				handler(payload.body);
			},
		);
	}

	subscribeSendSuccess(handler: () => void): Unsubscribe
	{
		return this.#subscribeFormEvent(ComposeFormEvent.SendSuccess, handler);
	}

	subscribeSendError(handler: () => void): Unsubscribe
	{
		return this.#subscribeFormEvent(ComposeFormEvent.SendError, handler);
	}

	subscribeDestroy(handler: () => void): Unsubscribe
	{
		return this.#subscribeFormEvent(ComposeFormEvent.Destroy, handler);
	}

	destroy(): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		this.#isDestroyed = true;
		this.#teardown.forEach((unsubscribe: Unsubscribe): void => {
			unsubscribe();
		});
		this.#teardown.clear();
		this.#closeAha();
		this.#error = unmountNotice(this.#error);
		this.#indicator = unmountNotice(this.#indicator);
		this.#core = null;
	}

	#notifyChanged(): void
	{
		EventEmitter.emit(ComposeFormEvent.Changed, { formId: this.formId, reason: 'user' });
	}

	/** One error at a time: a second message under the first would leave the user guessing which still holds. */
	#showError(text: string, onRetry?: () => void): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		this.#error = unmountNotice(this.#error);
		this.#error = this.#mountNotice({
			design: AlertDesign.tintedAlert,
			text,
			testId: ErrorTestId,
			liveRole: 'alert',
			hasCloseButton: true,
			actionText: onRetry ? coreLoc(CorePhrase.Retry) : '',
			onAction: (): void => {
				this.#hideError();
				onRetry?.();
			},
			onClose: (): void => {
				this.#hideError();
			},
		});
	}

	#hideError(): void
	{
		this.#error = unmountNotice(this.#error);
	}

	#mountNotice(props: NoticeProps): MountedNotice | null
	{
		const container = this.#resolveNoticeContainer();
		if (!container)
		{
			return null;
		}

		const host = Dom.create('div', { props: { className: 'mail-compose-form__notice' } });
		Dom.append(host, container);

		const app = BitrixVue.createApp(LargeAttachmentNotice, props);
		app.mount(host);

		return { app, host };
	}

	/**
	 * The notices are drawn by the adapter and not by a component, so they have a place of their own in the
	 * layout and are looked for inside the container of this form alone.
	 */
	#resolveNoticeContainer(): HTMLElement | null
	{
		return this.#resolveFormNode(NoticesTestId);
	}

	#resolveAhaAnchor(): HTMLElement | null
	{
		return this.#resolveFormNode(AttachmentAnchorTestId);
	}

	#resolveFormNode(testId: string): HTMLElement | null
	{
		return document
			.getElementById(this.#containerId)
			?.querySelector<HTMLElement>(`[data-testid="${testId}"]`) ?? null;
	}

	/** No call to action of its own: the hint closes by its cross, by a click aside or by itself. */
	#createAhaPopup(anchor: HTMLElement, onDone: Function): Popup
	{
		const content = Dom.create('div', {
			props: { className: 'mail-compose-large-attachment-aha' },
			attrs: { 'data-testid': AhaTestId },
			text: coreLoc(CorePhrase.AhaText),
		});

		return PopupManager.create({
			id: AhaPopupId,
			bindElement: anchor,
			content,
			width: AhaPopupWidth,
			closeIcon: true,
			autoHide: true,
			closeByEsc: true,
			// The hint is offered once, so the popup is not kept in the cache of the manager.
			cacheable: false,
			angle: { offset: 40, position: 'top' },
			events: {
				onClose: (): void => {
					onDone();
				},
			},
		});
	}

	#closeAha(): void
	{
		if (this.#ahaTimer !== null)
		{
			window.clearTimeout(this.#ahaTimer);
			this.#ahaTimer = null;
		}

		this.#ahaPopup?.close();
		this.#ahaPopup = null;
	}

	#saveShownMark(): void
	{
		if (!Type.isStringFilled(this.#ahaOptionName))
		{
			return;
		}

		(BX as unknown as UserOptionsGlobal).userOptions?.save(
			UserOptionCategory,
			this.#ahaOptionName,
			null,
			'Y',
		);
	}

	/**
	 * The identifier of the form in the payload is the filter: two compose panels may stand at once, and this
	 * adapter answers for the files of its own form.
	 */
	#subscribeFormEvent<Payload extends ComposeFormEventPayload = ComposeFormEventPayload>(
		eventName: string,
		handler: (payload: Payload) => void,
	): Unsubscribe
	{
		return this.#subscribeGlobal(eventName, (event: BaseEvent<Payload>): void => {
			const payload = event.getData();
			if (payload?.formId === this.formId)
			{
				handler(payload);
			}
		});
	}

	#subscribeGlobal(eventName: string, listener: (event: BaseEvent) => void): Unsubscribe
	{
		if (this.#isDestroyed)
		{
			return noop;
		}

		EventEmitter.subscribe(eventName, listener);

		return this.#track((): void => {
			EventEmitter.unsubscribe(eventName, listener);
		});
	}

	#track(unsubscribe: Unsubscribe): Unsubscribe
	{
		this.#teardown.add(unsubscribe);

		return (): void => {
			this.#teardown.delete(unsubscribe);
			unsubscribe();
		};
	}
}

/** The value is set as a property and not as markup, so a token of the server is never read as HTML. */
function renderContractField(name: string, value: string): HTMLElement
{
	return Dom.create('input', { props: { type: 'hidden', name, value } });
}

function unmountNotice(notice: MountedNotice | null): null
{
	if (notice)
	{
		notice.app.unmount();
		Dom.remove(notice.host);
	}

	return null;
}
