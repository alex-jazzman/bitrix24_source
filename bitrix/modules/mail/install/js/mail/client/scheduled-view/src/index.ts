import { Loc, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { type MessageEvent, SidePanel } from 'main.sidepanel';
import { BIcon, Outline, SmallOutline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import 'ui.icon-set.small-outline';
import { Alert } from 'ui.system.alert.vue';
import { AlertDesign } from 'ui.system.alert';
import { HeadlineLg, TextMd, TextSm } from 'ui.system.typography.vue';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { BitrixVue, defineComponent, reactive, type PropType } from 'ui.vue3';
import {
	formatRelativeScheduledDateTime,
	ScheduledMessageErrorCode,
	scheduledMessageApi,
	type ScheduledMessageApi,
	type ScheduledMessageDto,
	type ScheduledMessageRecipient,
	type ScheduledMessageSender,
} from 'mail.client.scheduled-message';

import { ContactChips, type ContactChip } from './component/contact-chips/contact-chips';
import { MessageField } from './component/message-field/message-field';

import './scheduled-view.css';

type Options = {
	containerId: string,
	messageId: number,
	mailboxId: number,
	editPath: string,
	editWidth?: number,
	draftsPath: string,
	api?: ScheduledMessageApi,
	navigate?: (path: string) => void,
	/** Seams of the slider the card is opened in: the tests of the screen stand in for the portal here. */
	notifyCancelled?: (messageId: number) => void,
	closeCard?: () => void,
};

type ScheduledViewState = {
	loading: boolean,
	pending: boolean,
	error: boolean,
	/** Reason of a refused action, already localized: the letter itself stays on the screen beside it. */
	actionError: string,
	message: ScheduledMessageDto | null,
	edit: () => void,
	cancel: () => void,
};

type ScheduledViewContact = ScheduledMessageSender | ScheduledMessageRecipient;

/** The screen is the only one on its page, so the heading keeps a fixed id and names the region by it. */
const TitleId = 'mail-scheduled-view-title';

const BodyContentSecurityPolicy = "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'";

const BodyStyle = 'body{margin:0;font:15px/1.5 Arial,sans-serif;color:#333;overflow-wrap:anywhere}';

/** Read for a letter whose author timezone this browser does not know; the grid of the list falls back the same way. */
const FallbackTimezoneId = 'UTC';

/**
 * The server names the reason a cancellation was refused with a code, and its own message is a technical one:
 * the text the user reads is chosen here, by the same codes the list of the letters names the same reasons by,
 * and worded the same way — the refusals of the draft gateway included, as the cancellation goes through it.
 */
const CancelErrorPhrase: Readonly<Record<string, string>> = Object.freeze({
	[ScheduledMessageErrorCode.AlreadySending]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_ALREADY_SENDING',
	[ScheduledMessageErrorCode.AlreadySent]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_ALREADY_SENT',
	[ScheduledMessageErrorCode.AlreadyCancelled]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_ALREADY_CANCELLED',
	[ScheduledMessageErrorCode.RevisionConflict]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_REVISION_CONFLICT',
	[ScheduledMessageErrorCode.AccessDenied]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_ACCESS_DENIED',
	[ScheduledMessageErrorCode.NotFound]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_NOT_FOUND',
	[ScheduledMessageErrorCode.DraftUnavailable]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_DRAFT_UNAVAILABLE',
	[ScheduledMessageErrorCode.DraftSaveFailed]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_DRAFT_SAVE_FAILED',
});

/** Answer to a code the screen does not know: a new one of the server must not reach the user as it is. */
const CancelErrorFallbackPhrase = 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR';

/**
 * Messages of the panels of one letter. `Cancelled` is posted by this card down to the page it was opened
 * from; the identifier must not be renamed, `mail.client.message.list/templates/.default/src/js/list.es6.js`
 * matches it as a literal and drops the row of the letter on it. `Saved` belongs to `mail.client.compose-form`
 * (`SliderMessage.ScheduledMessageSaved`) and is read here.
 */
const SliderMessage = Object.freeze({
	Cancelled: 'Mail.Client.ScheduledMessageCancelled',
	Saved: 'Mail.Client.ScheduledMessageSaved',
} as const);

/** Event the panels of the page carry their messages by. */
const SliderMessageEvent = 'SidePanel.Slider:onMessage';

/**
 * The date is read inside a computed property, and a message saved before the portal held the author
 * timezone to a known one could carry anything. An unreadable date leaves the banner without it — the card
 * of the letter opens all the same.
 */
function scheduledAtText(message: ScheduledMessageDto): string
{
	for (const timezoneId of [message.authorTimezoneId, FallbackTimezoneId])
	{
		try
		{
			return formatRelativeScheduledDateTime(message.scheduledAt, timezoneId);
		}
		catch
		{
			continue;
		}
	}

	return '';
}

function errorCodeOf(error: unknown): string
{
	const code = (error as { code?: unknown } | null)?.code;

	return Type.isString(code) ? code : '';
}

function cancelErrorText(error: unknown): string
{
	return Loc.getMessage(CancelErrorPhrase[errorCodeOf(error)] ?? CancelErrorFallbackPhrase) ?? '';
}

function chipsOf(
	contacts: ScheduledViewContact[],
	testIdPrefix: string,
	text: (contact: ScheduledViewContact) => string,
): ContactChip[]
{
	return contacts.map((contact: ScheduledViewContact, index: number): ContactChip => ({
		testId: `${testIdPrefix}-${index}`,
		text: text(contact),
		avatar: contact.avatar ?? null,
	}));
}

// @vue/component
export const ScheduledView = defineComponent({
	name: 'MailScheduledView',
	components: { Alert, BIcon, ContactChips, HeadlineLg, MessageField, TextMd, TextSm, UiButton } as {
		Alert: typeof Alert,
		BIcon: typeof BIcon,
		ContactChips: typeof ContactChips,
		HeadlineLg: typeof HeadlineLg,
		MessageField: typeof MessageField,
		TextMd: typeof TextMd,
		TextSm: typeof TextSm,
		UiButton: typeof UiButton,
	},
	props: {
		state: {
			type: Object as PropType<ScheduledViewState>,
			required: true,
		},
	},
	setup()
	{
		return {
			AlertDesign,
			AirButtonStyle,
			ButtonSize,
			titleId: TitleId,
			titleIcon: Outline.MAIL_SEND,
			scheduleIcon: SmallOutline.CLOCK,
			// a cancellation keeps the letter as a draft, so it is drawn as a return, the way the list draws it
			cancelIcon: Outline.UNDO,
			editIcon: Outline.EDIT_M,
		};
	},
	computed: {
		message(): ScheduledMessageDto | null
		{
			return this.state.message;
		},
		canCancel(): boolean
		{
			return Boolean(this.message?.permissions.canManage && this.message.actions.includes('cancel'));
		},
		canEdit(): boolean
		{
			return Boolean(this.message?.permissions.canManage && this.message.actions.includes('update'));
		},
		scheduledAt(): string
		{
			return this.message ? scheduledAtText(this.message) : '';
		},
		errorReason(): string
		{
			return this.message?.status === 'error' ? (this.message.errorReason ?? '') : '';
		},
		senderChips(): ContactChip[]
		{
			return this.message
				? chipsOf([this.message.sender], 'mail-scheduled-view-chip-from', senderText)
				: [];
		},
		toChips(): ContactChip[]
		{
			return chipsOf(this.message?.recipients.to ?? [], 'mail-scheduled-view-chip-to', recipientText);
		},
		ccChips(): ContactChip[]
		{
			return chipsOf(this.message?.recipients.cc ?? [], 'mail-scheduled-view-chip-cc', recipientText);
		},
		/**
		 * The row of a letter without a copy stays in place by the mockup, but a label with no value is
		 * nothing to read out, so an empty row is kept out of the accessibility tree.
		 */
		hasCc(): boolean
		{
			return this.ccChips.length > 0;
		},
		/**
		 * The letter is written by someone else and the message carries no language of its own, so the
		 * embedded document declares the language as unknown: lending it the language of the interface would
		 * make the reader pronounce a foreign letter as a Russian one.
		 */
		bodyDocument(): string
		{
			return '<!DOCTYPE html><html lang=""><head>'
				+ `<meta http-equiv="Content-Security-Policy" content="${BodyContentSecurityPolicy}">`
				+ `<style>${BodyStyle}</style>`
				+ `</head><body>${this.message?.body ?? ''}</body></html>`;
		},
	},
	methods: {
		loc(code: string, replacements: Record<string, string> = {}): string
		{
			return Loc.getMessage(code, replacements) ?? '';
		},
	},
	template: `
		<section class="mail-scheduled-view" data-testid="mail-scheduled-view" :aria-busy="state.loading" :aria-labelledby="titleId">
			<header class="mail-scheduled-view__header">
				<div class="mail-scheduled-view__title">
					<BIcon class="mail-scheduled-view__title-icon" :name="titleIcon" :size="24"/>
					<HeadlineLg tag="h1" :id="titleId">{{ loc('MAIL_SCHEDULED_VIEW_TITLE') }}</HeadlineLg>
				</div>
				<div v-if="message" class="mail-scheduled-view__schedule" data-testid="mail-scheduled-view-banner">
					<BIcon :name="scheduleIcon" :size="20"/>
					<TextSm class-name="mail-scheduled-view__schedule-text">{{ loc('MAIL_SCHEDULED_VIEW_SCHEDULED_AT', { '#DATE#': scheduledAt }) }}</TextSm>
				</div>
				<Alert v-if="errorReason" role="alert" :design="AlertDesign.tintedAlert" data-testid="mail-scheduled-view-send-error">{{ errorReason }}</Alert>
			</header>
			<Alert v-if="state.error" role="alert" :design="AlertDesign.tintedAlert">{{ loc('MAIL_SCHEDULED_VIEW_LOAD_ERROR') }}</Alert>
			<div v-else-if="message" class="mail-scheduled-view__content">
				<dl class="mail-scheduled-view__fields">
					<MessageField :label="loc('MAIL_SCHEDULED_VIEW_FROM')" data-testid="mail-scheduled-view-field-from">
						<ContactChips :items="senderChips" data-testid="mail-scheduled-view-chips-from"/>
					</MessageField>
					<MessageField :label="loc('MAIL_SCHEDULED_VIEW_TO')" data-testid="mail-scheduled-view-field-to">
						<ContactChips :items="toChips" data-testid="mail-scheduled-view-chips-to"/>
					</MessageField>
					<MessageField :label="loc('MAIL_SCHEDULED_VIEW_CC')" data-testid="mail-scheduled-view-field-cc" :aria-hidden="hasCc ? null : 'true'">
						<ContactChips :items="ccChips" data-testid="mail-scheduled-view-chips-cc"/>
					</MessageField>
					<MessageField :label="loc('MAIL_SCHEDULED_VIEW_SUBJECT')" data-testid="mail-scheduled-view-field-subject">
						<TextMd>{{ message.subject }}</TextMd>
					</MessageField>
				</dl>
				<iframe class="mail-scheduled-view__body" data-testid="mail-scheduled-view-body" :title="loc('MAIL_SCHEDULED_VIEW_BODY')" :srcdoc="bodyDocument" sandbox></iframe>
			</div>
			<div v-if="state.actionError" class="mail-scheduled-view__action-error" data-testid="mail-scheduled-view-action-error" role="alert">
				<Alert :design="AlertDesign.tintedAlert">{{ state.actionError }}</Alert>
			</div>
			<footer v-if="message" class="mail-scheduled-view__footer">
				<span v-if="canCancel" data-testid="mail-scheduled-view-cancel">
					<UiButton :text="loc('MAIL_SCHEDULED_VIEW_CANCEL')" :left-icon="cancelIcon" :style="AirButtonStyle.FILLED_ALERT" :size="ButtonSize.MEDIUM" :loading="state.pending" :disabled="state.pending" @click="state.cancel"/>
				</span>
				<span v-if="canEdit" data-testid="mail-scheduled-view-edit">
					<UiButton :text="loc('MAIL_SCHEDULED_VIEW_EDIT')" :left-icon="editIcon" :style="AirButtonStyle.PLAIN" :size="ButtonSize.MEDIUM" :disabled="state.pending" @click="state.edit"/>
				</span>
				<TextSm v-if="!message.permissions.canManage">{{ loc('MAIL_SCHEDULED_VIEW_READ_ONLY') }}</TextSm>
			</footer>
		</section>
	`,
});

export class ScheduledViewApplication
{
	#options: Options;

	constructor(options: Options)
	{
		this.#options = options;
	}

	start(): void
	{
		const container = document.getElementById(this.#options.containerId);
		if (!container)
		{
			return;
		}

		const state = reactive({
			loading: true,
			pending: false,
			error: false,
			actionError: '',
			message: null as ScheduledMessageDto | null,
			edit: (): void => {
				if (this.#options.navigate)
				{
					this.#options.navigate(this.#options.editPath);

					return;
				}

				openEditSidePanel(this.#options.editPath, this.#options.editWidth);
			},
			cancel: async (): Promise<void> => {
				if (!state.message || state.pending)
				{
					return;
				}
				const { id, revision } = state.message;
				state.pending = true;
				state.actionError = '';
				try
				{
					await (this.#options.api ?? scheduledMessageApi).cancel({ id, revision });
					this.#finishCancel(id);
				}
				catch (error)
				{
					// the letter is where it was, so the card keeps it and names why the send was not called off
					state.actionError = cancelErrorText(error);
					if (errorCodeOf(error) === ScheduledMessageErrorCode.RevisionConflict)
					{
						// the revision in hand is stale, and only a reread makes the next try answerable
						state.message = await this.#read()
							.catch((): ScheduledMessageDto | null => state.message);
					}
				}
				finally
				{
					state.pending = false;
				}
			},
		});

		// fills the card with the letter, on open and after a change made in a panel above it
		const load = (): Promise<void> => {
			state.loading = true;

			return this.#read()
				.then((message: ScheduledMessageDto): void => {
					state.message = message;
					state.error = false;
					// a refusal named a state the letter has just left, so it is the reason of nothing now
					state.actionError = '';
				})
				.catch((): void => {
					state.error = true;
				})
				.finally((): void => {
					state.loading = false;
				});
		};

		BitrixVue.createApp(ScheduledView, { state }).mount(container);
		void load();

		// The form of the letter is opened from this card and stands above it, so a change made there would
		// leave the card showing the letter as it used to be. The word of the form is read here and the letter
		// is taken anew — with it the actions the letter still allows, so one that has meanwhile left for the
		// send loses its buttons here exactly as it does when a card of it is opened.
		EventEmitter.subscribe(SliderMessageEvent, (event: BaseEvent): void => {
			const sliderEvent: MessageEvent = event.getData()[0];
			if (sliderEvent.getEventId() === SliderMessage.Saved)
			{
				void load();
			}
		});
	}

	/**
	 * The letter is no longer waiting to be sent: the list it was opened from is told so and the card goes
	 * away with the slider it lives in. The message is posted before the card closes — one sent from a dying
	 * frame reaches nobody.
	 */
	#finishCancel(messageId: number): void
	{
		(this.#options.notifyCancelled ?? notifyCancelledToOpener)(messageId);
		(this.#options.closeCard ?? closeOwnSlider)();
	}

	/** The screen holds a single letter, and it must be the one of the mailbox the page was opened for. */
	#read(): Promise<ScheduledMessageDto>
	{
		return (this.#options.api ?? scheduledMessageApi).get({ id: this.#options.messageId })
			.then((message: ScheduledMessageDto): ScheduledMessageDto => {
				if (message.mailboxId !== this.#options.mailboxId)
				{
					throw new Error('Scheduled message mailbox mismatch.');
				}

				return message;
			});
	}
}

/** The sender chip names the address beside the name, so the reader sees which mailbox sends the letter. */
function senderText(contact: ScheduledViewContact): string
{
	return Type.isStringFilled(contact.name) ? `${contact.name} (${contact.email})` : contact.email;
}

function recipientText(contact: ScheduledViewContact): string
{
	return Type.isStringFilled(contact.name) ? contact.name : contact.email;
}

function notifyCancelledToOpener(messageId: number): void
{
	SidePanel.Instance.postMessage(window, SliderMessage.Cancelled, { id: messageId });
}

/** The own slider of the card and no other: the one on top may belong to someone else by then. */
function closeOwnSlider(): void
{
	SidePanel.Instance.getSliderByWindow(window)?.close();
}

/**
 * The width of every window of one letter comes from the server, so none is named here: a width the page did
 * not send leaves the slider on its own default instead of on a copy of the server value gone stale.
 */
function openEditSidePanel(path: string, width?: number): void
{
	SidePanel.Instance.open(path, { width, cacheable: false });
}
