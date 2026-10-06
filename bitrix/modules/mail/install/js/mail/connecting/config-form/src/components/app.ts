import { Loc, Runtime, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { defineComponent, markRaw } from 'ui.vue3';
import { MessageBox } from 'ui.dialogs.messagebox';
import { HeadlineSm } from 'ui.system.typography.vue';
import { BIcon, Set as IconSet } from 'ui.icon-set.api.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import { CrmIntegration } from 'mail.connecting.crm-integration';
import { CalendarIntegration } from 'mail.connecting.calendar-integration';
import { MailIntegration } from 'mail.connecting.mail-sync-settings';
import { getMigrationState, type MigrationState } from 'mail.migration-state';

import { ConnectionSettings } from './connection-settings';
import { MicrosoftConnection } from './microsoft-connection';
import { ProviderBadge } from './provider-badge';
import { SmtpSettings } from './smtp-settings';
import { AccessSharing } from './access-sharing';
import { MailboxOwnership } from './mailbox-ownership';
import { ConnectionRequestOwner } from './connection-request-owner';
import { FormActions } from './form-actions';
import {
	Api,
	type AjaxError,
	type BaseMailboxPayload,
	type ConnectByConnectionRequestResult,
	type ConnectMailboxResult,
	type CrmOptionsPayload,
	type MailboxCrmOptionsResponse,
	type MailboxData,
	type CreateMailboxPayload,
	type UpdateMailboxPayload,
} from '../api';
import type {
	FormErrors,
	GeneralErrorItem,
	MailSyncModel,
	OauthCompletionUser,
	ResponsibleQueueItem,
} from '../types';
import { mapMailboxCrmOptionsToStatePatch } from '../utils/crm-options';
import { validateForm } from '../utils/validation';
import { loc } from '../utils/loc';
import { showOauthDeniedGuide, showSyncFailureGuide, type SyncFailureMode } from '../utils/sync-failure-guide';
import { showProviderRestrictionPopup } from '../utils/provider-restriction-popup';
import { useFormState } from '../state';

type SyncFailureGuideInstance = {
	start(): void;
	close?(): void;
};

const SYNC_FAILURE_GUIDE_TARGETS: Record<SyncFailureMode, string> = {
	oauth: '[data-id="mail-config-form-provider-action"]',
	password: '[data-id="mail-config-form-password-field"]',
};

// Scenario id from the server side: see Mail\Helper\OAuth::ERROR_SCENARIO_ADMIN_CONSENT.
const OAUTH_DENIED_ADMIN_CONSENT_SCENARIO = 'admin_consent';

/**
 * Shows the refusal as a notification when the hint has nothing to attach to.
 *
 * Follows the module's existing approach (mail/install/js/mail/draft): the notification
 * center is taken from the top window when it is already there, otherwise the extension is
 * loaded on demand.
 */
async function notifyFallback(text: string): Promise<void>
{
	const topBX = getTopBX();
	let center = topBX?.UI?.Notification?.Center ?? getRootBX().UI?.Notification?.Center ?? null;

	if (!center)
	{
		const loader = topBX?.Runtime ?? getRootBX().Runtime;

		if (loader)
		{
			await loader.loadExtension('ui.notification');
		}
		else
		{
			await Runtime.loadExtension('ui.notification');
		}

		// The extension registers its center on the BX object, so it is read back from there.
		center = getTopBX()?.UI?.Notification?.Center ?? getRootBX().UI?.Notification?.Center ?? null;
	}

	center?.notify({ content: text });
}

// The refusal arrives as markup: the error code sits after a <br>. Speech needs plain
// sentences, and the tags are ours, so they are dropped instead of being parsed.
//
// Sentences are announced one by one because LiveAnnouncer truncates anything longer than
// 160 characters, and the longest scenario is more than twice that: announced as one string,
// it would break off mid-instruction and never reach the error code. A line that already
// ends with punctuation keeps it - otherwise a reader hears "administrator..".
export function toSpokenLines(title: string, text: string): Array<string>
{
	const plainText = text
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<[^>]*>/g, '');

	return [title, ...plainText.split('\n')]
		.flatMap((block) => block.replace(/([.!?])\s+/g, '$1\n').split('\n'))
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => (/[.!?:;]$/.test(line) ? line : `${line}.`));
}

/**
 * Announces the refusal to a screen reader.
 *
 * Neither the hint (ui.tour) nor the notification has a live region, so without this the
 * message exists for the eye only - while the reason for a blocked connection is exactly
 * what a screen reader user needs. The extension is loaded on demand, as with the
 * notification: an announcement is not worth the weight of ui.a11y on every form opening.
 */
async function announceRefusal(title: string, text: string): Promise<void>
{
	const lines = toSpokenLines(title, text);

	if (lines.length === 0)
	{
		return;
	}

	const topBX = getTopBX();
	let announcer = topBX?.UI?.Accessibility?.LiveAnnouncer
		?? getRootBX().UI?.Accessibility?.LiveAnnouncer
		?? null;

	if (!announcer)
	{
		const loader = topBX?.Runtime ?? getRootBX().Runtime;

		if (loader)
		{
			await loader.loadExtension('ui.a11y');
		}
		else
		{
			await Runtime.loadExtension('ui.a11y');
		}

		announcer = getTopBX()?.UI?.Accessibility?.LiveAnnouncer
			?? getRootBX().UI?.Accessibility?.LiveAnnouncer
			?? null;
	}

	// Only the reason interrupts: an assertive announcement cancels whatever is being spoken
	// and jumps the queue, so announcing every line that way would leave the last one alone -
	// the user would hear the error code and never the reason. The rest is queued politely and
	// read out in order after it.
	const [reason, ...rest] = lines;

	announcer?.announce(reason, 'assertive');
	rest.forEach((line) => announcer?.announce(line, 'polite'));
}

// Analytics values are validated on the analytics side, so the provider code goes in
// stripped of anything but plain identifier characters and trimmed to a sane length.
export function sanitizeAnalyticsValue(value: string): string
{
	return value.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 50);
}
import '../css/config-form.css';

type SaveResult = ConnectMailboxResult | ConnectByConnectionRequestResult;

type SliderMessageEvent = {
	getEventId(): string;
	data?: {
		changed?: boolean;
	};
};

type SidePanelSlider = {
	setCacheable(cacheable: boolean): void;
	close(): void;
};

type SidePanelOpenOptions = {
	width?: number;
	cacheable?: boolean;
	allowChangeHistory?: boolean;
	data?: {
		resetFilterOnClose?: boolean;
	};
	events?: {
		onClose: () => void;
	};
};

type SidePanelInstance = {
	open(url: string, options: SidePanelOpenOptions): void;
	getSliderByWindow?(targetWindow: Window): SidePanelSlider | null;
	getTopSlider?(): SidePanelSlider | null;
	postMessage?(sourceWindow: Window, eventId: string, data?: unknown): void;
};

type RootBX = {
	util: {
		add_url_param(url: string, params: Record<string, string | number | boolean>): string;
		popup(url: string, width: number, height: number): Window | null;
	};
	SidePanel?: {
		Instance?: SidePanelInstance;
	};
	UI?: {
		Analytics?: UiAnalytics;
		Notification?: {
			Center?: NotificationCenter;
		};
		Accessibility?: {
			LiveAnnouncer?: LiveAnnouncer;
		};
	};
	Runtime?: {
		loadExtension(name: string): Promise<unknown>;
	};
	addCustomEvent: {
		(eventName: string, handler: (event: SliderMessageEvent) => void): void;
		(target: unknown, eventName: string, handler: () => void): void;
	};
	removeCustomEvent: {
		(eventName: string, handler: (event: SliderMessageEvent) => void): void;
		(target: unknown, eventName: string, handler: () => void): void;
	};
};

type MainMailConfirm = {
	showForm(
		onApply: () => void,
		options: {
			mode: string;
			data: {
				email: string;
			};
		},
	): void;
};

type AnalyticsPayload = {
	tool: string;
	event: string;
	type?: string;
	category: string;
	c_section: string;
	c_element?: string;
	status?: 'success' | 'error';
	p1?: string;
	p2?: string;
	p3?: string;
};

type NotificationCenter = {
	notify(options: { content: string }): void;
};

type LiveAnnouncer = {
	announce(message: string, politeness?: 'polite' | 'assertive'): void;
};

type UiAnalytics = {
	sendData(payload: AnalyticsPayload): void;
};

type TopWindow = Window & {
	BX?: RootBX;
	BXMainMailConfirm?: MainMailConfirm;
};

// Server error code for an address already connected on the portal by someone else:
// see MailboxConnector::EXISTS_ON_PORTAL_ERROR_KEY.
const PORTAL_EMAIL_CONFLICT_ERROR_CODE = 'EXISTS_ON_PORTAL_ERROR';
const MAILBOX_LIST_PATH = '/mail/mailbox-list';
const OAUTH_USER_PROFILE_WAIT_TIMEOUT = 3000;

const providerDisplayNameMap: Record<string, string> = {
	gmail: 'Gmail',
	yandex: 'Яндекс',
	'mail.ru': 'Mail.ru',
	mailru: 'Mail.ru',
	'outlook.com': 'Outlook',
	outlook: 'Outlook',
	office365: 'Office365',
	exchangeOnline: 'Exchange',
	exchange: 'Exchange',
	aol: 'Aol',
	yahoo: 'Yahoo!',
	icloud: 'iCloud',
};

function getRootBX(): RootBX
{
	return BX as unknown as RootBX;
}

function getTopWindow(): TopWindow
{
	return (window.top ?? window) as TopWindow;
}

function getTopBX(): RootBX | undefined
{
	return getTopWindow().BX;
}

function getCurrentSidePanel(): SidePanelInstance | undefined
{
	return getRootBX().SidePanel?.Instance;
}

function getTopSidePanel(): SidePanelInstance | undefined
{
	return getTopBX()?.SidePanel?.Instance;
}

function createEmptyErrors(): FormErrors
{
	return {
		generalItems: [],
	};
}

function normalizeCustomData(value: unknown): unknown
{
	if (value === null || value === undefined || value === '')
	{
		return null;
	}

	// Empty arrays/objects are truthy in JS but render as "[]"/"{}" through Vue templating -
	// treat them as "no details" so the error block doesn't show meaningless brackets.
	if (Array.isArray(value))
	{
		return value.length > 0 ? value : null;
	}

	if (typeof value === 'object')
	{
		return Object.keys(value as Record<string, unknown>).length > 0 ? value : null;
	}

	return value;
}

function createGeneralErrorItem(
	message: string,
	customData: unknown = null,
	occupiedEmail: string = '',
): GeneralErrorItem
{
	return {
		message,
		customData: normalizeCustomData(customData),
		expanded: false,
		occupiedEmail,
	};
}

export function extractOccupiedEmail(error: AjaxError): string
{
	if (error.code !== PORTAL_EMAIL_CONFLICT_ERROR_CODE)
	{
		return '';
	}

	const email = (error.customData as { email?: unknown } | null | undefined)?.email;

	return Type.isStringFilled(email) ? email : '';
}

export function createServerErrorItem(error: AjaxError): GeneralErrorItem
{
	const occupiedEmail = extractOccupiedEmail(error);

	return createGeneralErrorItem(
		error.message || Loc.getMessage('MAIL_CONFIG_FORM_ERROR_GENERAL') || '',
		// The conflict address is already shown through the mailbox list action, so it must not
		// duplicate itself in the raw details block.
		occupiedEmail === '' ? error.customData : null,
		occupiedEmail,
	);
}

function mapOauthUser(user: OauthCompletionUser | null | undefined)
{
	if (!user)
	{
		return null;
	}

	return {
		email: user.email ?? '',
		firstName: user.first_name ?? '',
		lastName: user.last_name ?? '',
		fullName: user.full_name ?? '',
		picture: user.image ?? '',
	};
}

function extractAjaxErrors(error: unknown): AjaxError[]
{
	const candidate = (error as { errors?: unknown })?.errors;
	if (!Array.isArray(candidate))
	{
		return [];
	}

	return candidate.filter((item): item is AjaxError => {
		return typeof item === 'object' && item !== null && 'message' in item;
	});
}

function isConnectionRequestResult(result: SaveResult): result is ConnectByConnectionRequestResult
{
	return 'connectionRequestCompleted' in result;
}

// @vue/component
export const App = defineComponent({
	name: 'mailbox-config-app',

	components: {
		ConnectionSettings,
		MicrosoftConnection,
		ProviderBadge,
		SmtpSettings,
		CrmIntegration,
		CalendarIntegration,
		MailIntegration,
		AccessSharing,
		MailboxOwnership,
		ConnectionRequestOwner,
		FormActions,
		HeadlineSm,
		BIcon,
		UiButton,
	},

	setup()
	{
		return {
			state: useFormState(),
			loc,
			AirButtonStyle,
			ButtonSize,
		};
	},

	data()
	{
		return {
			passwordPlaceholder: '••••••••••••',
			oauthUserProfileWaitTimeout: OAUTH_USER_PROFILE_WAIT_TIMEOUT,
			oauthPending: false,
			warningIconName: IconSet.WARNING,
			boundSlider: null as SidePanelSlider | null,
			onSliderMessage: null as ((event: SliderMessageEvent) => void) | null,
			onSliderClose: null as (() => void) | null,
			syncFailureGuide: null as SyncFailureGuideInstance | null,
			lastMailSyncPeriodValue: '7',
			verifyEmailRequestSeq: 0,
			migrationStateHolder: markRaw({ current: null as MigrationState | null }),
			migrationStateUnsubscribe: null as (() => void) | null,
			// The provider window lives outside reactivity: while it sits on the provider's
			// domain, any property access through a Vue proxy throws a cross-origin SecurityError,
			// which used to break the close-polling and any handler touching this field.
			oauthPopupHolder: markRaw({ current: null as Window | null }),
			oauthPopupWatcher: null as ReturnType<typeof setInterval> | null,
			// Held outside reactivity, as the popup above: a promise has nothing to render and Vue
			// would only wrap it in a proxy.
			oauthUserProfileRequest: markRaw({ current: null as Promise<void> | null }),
		};
	},

	computed: {
		isEditMode(): boolean
		{
			return this.state.mode === 'edit';
		},
		isMicrosoftService(): boolean
		{
			const serviceName = this.state.service?.name;

			return typeof serviceName === 'string'
				&& ['office365', 'exchangeOnline', 'outlook.com'].includes(serviceName);
		},
		showCrm(): boolean
		{
			return this.state.permissions.isCrmAvailable;
		},
		showCalendar(): boolean
		{
			return this.state.permissions.isCalendarAvailable;
		},
		isConnectionRequestMode(): boolean
		{
			return this.state.mode === 'create' && Number(this.state.connectionRequestId) > 0;
		},
		lastCheckText(): string
		{
			if (!this.isEditMode)
			{
				return '';
			}

			const date = this.state.lastMailCheck?.date;
			if (!date)
			{
				return Loc.getMessage('MAIL_CONFIG_FORM_LAST_CHECK_NO_DATA') ?? '';
			}

			return this.formatLastCheck(Number(date));
		},
		mailSyncModel: {
			get(): MailSyncModel
			{
				const messageMaxAge = this.state.mailbox.messageMaxAge;
				// messageMaxAge === 0 is the disabled UI state; a negative value (-1) means "sync from the very
				// beginning", so it must be preserved as the selected period instead of falling back to 7.
				const enabled = messageMaxAge !== 0;

				return {
					sync: {
						enabled,
						periodValue: String(enabled ? messageMaxAge : this.lastMailSyncPeriodValue),
					},
				};
			},
			set(value: MailSyncModel): void
			{
				if (!value?.sync)
				{
					return;
				}

				if (value.sync.enabled)
				{
					const parsed = parseInt(value.sync.periodValue, 10);
					const messageMaxAge = Number.isNaN(parsed) ? 7 : parsed;
					this.lastMailSyncPeriodValue = String(messageMaxAge);
					this.state.mailbox.messageMaxAge = messageMaxAge;
				}
				else
				{
					const parsed = parseInt(value.sync.periodValue, 10);
					if (!Number.isNaN(parsed) && parsed !== 0)
					{
						this.lastMailSyncPeriodValue = String(parsed);
					}

					this.state.mailbox.messageMaxAge = 0;
				}
			},
		},
		isOAuthService(): boolean
		{
			return Boolean(this.state.service?.oauth) || Boolean(this.state.connection.isOAuth);
		},
		isOAuthConnected(): boolean
		{
			return Boolean(this.state.connection.oauthUid);
		},
		providerIconKey(): string
		{
			const name = this.state.service?.name ?? 'other';
			switch (name)
			{
				case 'mail.ru':
				case 'mailru':
					return 'mailru';
				case 'outlook.com':
				case 'outlook':
					return 'outlook';
				case 'exchangeOnline':
				case 'exchange':
					return 'exchange';
				case 'ukr.net':
					return 'ukrnet';
				case 'imap':
					return 'other';
				default:
					return name;
			}
		},
		providerTitle(): string
		{
			const name = this.state.service?.name;
			if (!name || name === 'other' || name === 'imap')
			{
				return Loc.getMessage('MAIL_CONFIG_FORM_PROVIDER_TITLE_IMAP') ?? '';
			}

			const displayName = providerDisplayNameMap[name]
				?? `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

			return Loc.getMessage('MAIL_CONFIG_FORM_PROVIDER_TITLE_PREFIXED', {
				'#NAME#': displayName,
			}) ?? '';
		},
		providerEmail(): string
		{
			if (this.isEditMode || (this.isOAuthService && this.isOAuthConnected))
			{
				return this.state.connection.email || '';
			}

			return '';
		},
		providerAvatar(): string
		{
			if (this.isOAuthService && this.isOAuthConnected)
			{
				return this.state.connection.oauthUser?.picture || '';
			}

			return '';
		},
		generalErrorItems(): GeneralErrorItem[]
		{
			const items = this.state.errors.generalItems;

			return Array.isArray(items) ? items : [];
		},
		canViewMailboxList(): boolean
		{
			return this.state.permissions.canViewMailboxList;
		},
		providerButtonText(): string
		{
			if (this.isEditMode || this.isOAuthConnected)
			{
				return Loc.getMessage('MAIL_CONFIG_FORM_OAUTH_DISCONNECT') ?? '';
			}

			if (!this.isOAuthService)
			{
				return '';
			}

			return Loc.getMessage('MAIL_CONFIG_FORM_OAUTH_CONNECT') ?? '';
		},
	},

	mounted(): void
	{
		this.state.calendarSettings.enabled = true;

		if (this.isEditMode && this.state.mailboxId)
		{
			this.bindMigrationState();
			void this.loadMailboxData();
		}

		this.bindSidePanelListeners();
	},

	beforeUnmount(): void
	{
		EventEmitter.unsubscribe('OnMailOAuthBCompleted', this.onOAuthCompleted);
		EventEmitter.unsubscribe('OnMailOAuthBError', this.onOAuthDenied);
		this.stopOauthPopupWatcher();
		this.oauthPopupHolder.current = null;
		this.unbindSidePanelListeners();
		this.closeSyncFailureGuide();
		this.unbindMigrationState();
	},

	methods: {
		getMailboxMigrationState(mailboxId: number): MigrationState
		{
			return getMigrationState(mailboxId);
		},

		bindMigrationState(): void
		{
			const mailboxId = Number(this.state.mailboxId);
			if (!Number.isInteger(mailboxId) || mailboxId <= 0)
			{
				return;
			}

			this.unbindMigrationState();
			const migrationState = this.getMailboxMigrationState(mailboxId);
			this.migrationStateHolder.current = migrationState;
			this.migrationStateUnsubscribe = migrationState.subscribe(({ active }): void => {
				this.state.migrationActive = active;
			});
			void migrationState.initialize().then((): void => {
				if (
					this.migrationStateHolder.current === migrationState
					&& migrationState.isInitialized()
				)
				{
					this.state.migrationActive = migrationState.isActive();
				}
			});
		},

		unbindMigrationState(): void
		{
			this.migrationStateUnsubscribe?.();
			this.migrationStateUnsubscribe = null;
			this.migrationStateHolder.current = null;
		},

		formatLastCheck(timestamp: number): string
		{
			const diffSeconds = Math.max(0, Math.floor(Date.now() / 1000 - timestamp));

			if (diffSeconds < 60)
			{
				return Loc.getMessagePlural('MAIL_CONFIG_FORM_TIME_AGO_SECONDS', diffSeconds, {
					'#COUNT#': String(diffSeconds),
				}) ?? '';
			}

			if (diffSeconds < 3600)
			{
				const minutes = Math.floor(diffSeconds / 60);

				return Loc.getMessagePlural('MAIL_CONFIG_FORM_TIME_AGO_MINUTES', minutes, {
					'#COUNT#': String(minutes),
				}) ?? '';
			}

			if (diffSeconds < 86400)
			{
				const hours = Math.floor(diffSeconds / 3600);

				return Loc.getMessagePlural('MAIL_CONFIG_FORM_TIME_AGO_HOURS', hours, {
					'#COUNT#': String(hours),
				}) ?? '';
			}

			const days = Math.floor(diffSeconds / 86400);

			return Loc.getMessagePlural('MAIL_CONFIG_FORM_TIME_AGO_DAYS', days, {
				'#COUNT#': String(days),
			}) ?? '';
		},

		async loadMailboxData(): Promise<void>
		{
			const mailboxId = this.state.mailboxId;
			if (!mailboxId)
			{
				return;
			}

			this.state.loading = true;

			try
			{
				const response = await Api.getMailbox(mailboxId);
				this.mapMailboxData(response.data);
			}
			catch (error)
			{
				console.error('Failed to load mailbox data:', error);
			}
			finally
			{
				this.state.loading = false;
			}

			// Deliberately not awaited: the screen is already usable, and this one goes to the
			// OAuth provider, where a revoked token has no bounded answer time. Saving gives it a
			// short bounded window - see submitSave().
			this.oauthUserProfileRequest.current = this.loadOauthUserProfile();
		},

		async loadOauthUserProfile(): Promise<void>
		{
			const mailboxId = this.state.mailboxId;
			const oauthUid = this.state.connection.oauthUid;

			if (!mailboxId || !this.state.connection.isOAuth || !oauthUid)
			{
				return;
			}

			const principalNameBeforeRequest = this.state.connection.userPrincipalName;

			try
			{
				const response = await Api.getOauthUser(mailboxId);
				this.applyOauthUserProfile(response.data, {
					oauthUid,
					principalName: principalNameBeforeRequest,
				});
			}
			catch (error)
			{
				// The form stays complete without the profile: it only carries the picture of the
				// account and a prefilled hint for the SMTP login of Microsoft mailboxes.
				console.error('Failed to load OAuth user profile:', error);
			}
		},

		applyOauthUserProfile(
			profile: OauthCompletionUser | null,
			requested: { oauthUid: string, principalName: string | null },
		): void
		{
			// A disconnect or a fresh OAuth pass replaces the account this answer describes.
			if (this.state.connection.oauthUid !== requested.oauthUid)
			{
				return;
			}

			// The action answers with null when the provider refused - a revoked or expired token, and
			// the same null stands for a mailbox that is gone or out of reach. None of that describes
			// the account, so nothing is written: both fields stay unresolved. An empty user principal
			// name here would be a claim that this mailbox has none.
			if (profile === null)
			{
				return;
			}

			this.state.connection.oauthUser = mapOauthUser(profile);

			// The provider answer is slow, so what the user typed meanwhile wins: an untouched
			// field is the only one this late value is allowed to fill.
			if (this.state.connection.userPrincipalName === requested.principalName)
			{
				this.state.connection.userPrincipalName = profile.userPrincipalName ?? '';
			}
		},

		mapMailboxData(data: MailboxData): void
		{
			const migrationState = this.migrationStateHolder?.current;
			this.state.migrationActive = migrationState?.isInitialized()
				? migrationState.isActive()
				: data.migrationActive === true;
			this.state.connection.email = data.imap.email || '';
			this.state.connection.login = data.imap.login || '';
			this.state.connection.server = data.imap.server || '';
			this.state.connection.port = Number(data.imap.port) || 993;
			this.state.connection.ssl = data.imap.ssl === 'Y';
			this.state.connection.isOAuth = Boolean(data.imap.isOAuth);
			this.state.connection.oauthUid = data.imap.oauthUid || null;
			// The profile of the OAuth account is not part of this payload: reading it goes to the
			// provider and used to hold the whole screen. A stale value is dropped here and the
			// profile is filled in by loadOauthUserProfile() once the form is drawn. Until then the
			// user principal name is unresolved rather than empty - an empty one would be a claim
			// that this mailbox has none, and saving it would switch off the SMTP workaround of
			// Microsoft mailboxes.
			this.state.connection.oauthUser = null;
			this.state.connection.userPrincipalName = null;

			this.state.smtp.enabled = data.smtp.enabled === 'Y';
			this.state.smtp.server = data.smtp.server || '';
			this.state.smtp.port = Number(data.smtp.port) || 587;
			this.state.smtp.ssl = data.smtp.ssl === 'Y';
			this.state.smtp.login = data.smtp.login || '';
			this.state.smtp.useLimit = Boolean(data.smtp.useLimit);
			this.state.smtp.limit = data.smtp.limit || 250;

			this.state.service = {
				...(this.state.service ?? {}),
				name: data.service.name,
				type: data.service.type,
				link: data.service.link,
				smtp: {
					server: data.service.smtpServer ?? this.state.service?.smtp?.server ?? '',
					port: this.state.service?.smtp?.port ?? '',
					login: Boolean(data.service.smtpLoginAsImap),
					password: Boolean(data.service.smtpPasswordAsImap),
				},
			};
			// Prefer raw MAILBOX.LINK over predefined service.LINK so editing doesn't wipe
			// a custom URL configured on the mailbox itself.
			this.state.mailbox.link = data.mailbox?.link ?? data.service.link ?? '';

			this.state.mailbox.name = data.mailboxName || '';
			this.state.mailbox.senderName = data.senderName || '';
			this.state.mailbox.useSenderName = Boolean(data.useSenderName);

			this.state.smtp.uploadOutgoing = data.denyUpload !== true;

			this.state.calendarSettings.enabled = true;
			this.state.calendarSettings.autoAddEvents = data.iCalAccess === 'Y';

			if (data.crmOptions)
			{
				this.mapCrmData(data.crmOptions);
			}

			if (Array.isArray(data.shareAccess))
			{
				this.state.access.sharedWith = data.shareAccess;
			}

			this.state.access.ownerId = data.userId || null;
			this.state.lastMailCheck = data.lastMailCheck || null;
			this.state.providerRestriction = data.providerRestriction ?? null;
			this.state.isDataReady = true;

			// Disable email→login/name/smtp auto-sync after loading existing data:
			// the email watcher runs in a microtask after this method returns and would
			// otherwise overwrite the IMAP login (which is often distinct from the email).
			this.state.fieldSyncFlags.loginManual = true;
			this.state.fieldSyncFlags.nameManual = true;
			this.state.fieldSyncFlags.smtpLoginManual = true;
			this.state.fieldSyncFlags.smtpPasswordManual = true;

			void this.$nextTick(() => {
				this.triggerSyncFailureGuide();
			});
		},

		triggerSyncFailureGuide(): void
		{
			const lastCheck = this.state.lastMailCheck;
			if (!lastCheck || lastCheck.date === null || lastCheck.isSuccess !== false)
			{
				return;
			}

			if (this.syncFailureGuide)
			{
				return;
			}

			const providerCode = this.state.providerRestriction;
			if (providerCode)
			{
				const providerName =
					Loc.getMessage(`MAIL_CONFIG_FORM_PROVIDER_NAME_${providerCode.toUpperCase()}`)
					?? providerCode
				;
				this.sendProviderRestrictionAnalytics(providerCode, 'popup_view');
				showProviderRestrictionPopup(providerName, () => {
					this.sendProviderRestrictionAnalytics(providerCode, 'popup_ok_button');
				});

				return;
			}

			const mode: SyncFailureMode = this.state.connection.isOAuth ? 'oauth' : 'password';
			const guide = showSyncFailureGuide({
				mode,
				targetSelector: SYNC_FAILURE_GUIDE_TARGETS[mode],
			});

			this.syncFailureGuide = guide ? markRaw(guide) : null;
		},

		closeSyncFailureGuide(): void
		{
			this.syncFailureGuide?.close?.();
			this.syncFailureGuide = null;
		},

		mapCrmData(crm: MailboxCrmOptionsResponse): void
		{
			const mappedCrmSettings = mapMailboxCrmOptionsToStatePatch(crm, this.state.crmSettings);

			this.state.crmSettings.enabled = mappedCrmSettings.enabled;
			this.state.crmSettings.sync.enabled = mappedCrmSettings.sync.enabled;
			this.state.crmSettings.sync.periodValue = mappedCrmSettings.sync.periodValue;
			this.state.crmSettings.assignKnownClientEmails = mappedCrmSettings.assignKnownClientEmails;
			this.state.crmSettings.vcf = mappedCrmSettings.vcf;
			this.state.crmSettings.incoming.enabled = mappedCrmSettings.incoming.enabled;
			this.state.crmSettings.incoming.createAction = mappedCrmSettings.incoming.createAction;
			this.state.crmSettings.outgoing.enabled = mappedCrmSettings.outgoing.enabled;
			this.state.crmSettings.outgoing.createAction = mappedCrmSettings.outgoing.createAction;
			this.state.crmSettings.source = mappedCrmSettings.source;
			this.state.crmSettings.leadCreationAddresses = mappedCrmSettings.leadCreationAddresses;
			this.state.crmSettings.responsibleQueue = mappedCrmSettings.responsibleQueue;
		},

		buildCrmOptions(): CrmOptionsPayload
		{
			if (!this.state.crmSettings.enabled)
			{
				return { enabled: 'N' };
			}

			const config: NonNullable<CrmOptionsPayload['config']> = {};

			if (this.state.crmSettings.sync.enabled)
			{
				config.crm_sync_days = parseInt(this.state.crmSettings.sync.periodValue, 10) || 0;
			}

			if (this.state.crmSettings.assignKnownClientEmails)
			{
				config.crm_public = 'Y';
			}

			if (this.state.crmSettings.vcf)
			{
				config.crm_vcf = 'Y';
			}

			if (this.state.crmSettings.incoming.enabled)
			{
				config.crm_new_entity_in = this.state.crmSettings.incoming.createAction;
			}

			if (this.state.crmSettings.outgoing.enabled)
			{
				config.crm_new_entity_out = this.state.crmSettings.outgoing.createAction;
			}

			config.crm_lead_source = this.state.crmSettings.source;

			if (this.state.crmSettings.responsibleQueue.length > 0)
			{
				config.crm_lead_resp = this.state.crmSettings.responsibleQueue.map((item: ResponsibleQueueItem) => Number(item.id));
			}

			if (this.state.crmSettings.leadCreationAddresses.length > 0)
			{
				config.crm_new_lead_for = this.state.crmSettings.leadCreationAddresses;
			}

			return { enabled: 'Y', config };
		},

		buildBasePayload(): BaseMailboxPayload
		{
			const state = this.state;

			const payload: BaseMailboxPayload = {
				email: state.connection.email,
				login: state.connection.login || state.connection.email,
				server: state.connection.server,
				port: String(state.connection.port ?? ''),
				ssl: state.connection.ssl,
				serviceId: state.service?.id ?? null,
				storageOauthUid: state.connection.oauthUid || '',
				useSmtp: state.smtp.enabled,
				serverSmtp: state.smtp.server,
				portSmtp: String(state.smtp.port ?? ''),
				sslSmtp: state.smtp.ssl,
				loginSmtp: state.smtp.login || state.connection.login || state.connection.email,
				useLimitSmtp: state.smtp.useLimit,
				limitSmtp: state.smtp.limit,
				mailboxName: state.mailbox.name || state.connection.email,
				senderName: state.mailbox.senderName,
				useSenderName: state.mailbox.useSenderName,
				iCalAccess: state.calendarSettings.enabled && state.calendarSettings.autoAddEvents,
				crmOptions: this.buildCrmOptions(),
				uploadOutgoing: state.smtp.uploadOutgoing,
				link: state.mailbox.link,
				shareAccess: state.access.sharedWith,
			};

			// An unresolved profile is no reason to state that the mailbox has no user principal
			// name: the field is left out and the stored state keeps applying. A value the user
			// cleared is an empty string and is sent as one.
			if (state.connection.userPrincipalName !== null)
			{
				payload.userPrincipalName = state.connection.userPrincipalName;
			}

			return payload;
		},

		buildCreatePayload(): CreateMailboxPayload
		{
			const state = this.state;

			return {
				...this.buildBasePayload(),
				password: state.connection.password,
				passwordSMTP: state.smtp.password || state.connection.password,
				syncAfterConnection: true,
				messageMaxAge: state.mailbox.messageMaxAge,
				serviceConfig: {
					serviceType: 'imap',
					name: state.service?.name ?? 'other',
				},
			};
		},

		buildUpdatePayload(): UpdateMailboxPayload
		{
			const state = this.state;
			const payload: UpdateMailboxPayload = this.buildBasePayload();

			if (state.migrationActive)
			{
				const connectionFields = [
					'email',
					'userPrincipalName',
					'login',
					'server',
					'port',
					'ssl',
					'serviceId',
					'storageOauthUid',
					'useSmtp',
					'serverSmtp',
					'portSmtp',
					'sslSmtp',
					'loginSmtp',
				] as const;
				connectionFields.forEach((field): void => {
					delete payload[field];
				});
			}
			else if (state.connection.password && state.connection.password !== this.passwordPlaceholder)
			{
				payload.password = state.connection.password;
			}

			if (
				!state.migrationActive
				&& state.smtp.password
				&& state.smtp.password !== this.passwordPlaceholder
			)
			{
				payload.passwordSMTP = state.smtp.password;
			}

			if (state.access.ownerId)
			{
				payload.userIdToConnect = state.access.ownerId;
			}

			return payload;
		},

		async submitSave(): Promise<SaveResult>
		{
			// Drawing the screen no longer waits for the profile of the OAuth account, but saving
			// gives it a bounded window: the user principal name lives at the provider only, and a
			// save started before the answer arrived would otherwise carry no value for a mailbox
			// that has one.
			// Only Microsoft services put that value to use - see resolveSmtpFallbackUserPrincipalName()
			// on the server - so nowhere else does a save wait for an answer it cannot spend.
			if (this.isMicrosoftService && this.oauthUserProfileRequest.current)
			{
				let timeoutId: ReturnType<typeof setTimeout> | null = null;
				try
				{
					await Promise.race([
						this.oauthUserProfileRequest.current,
						new Promise((resolve) => {
							timeoutId = setTimeout(resolve, this.oauthUserProfileWaitTimeout);
						}),
					]);
				}
				finally
				{
					if (timeoutId !== null)
					{
						clearTimeout(timeoutId);
					}
				}
			}

			if (this.state.mode === 'edit')
			{
				const mailboxId = this.state.mailboxId;
				if (!mailboxId)
				{
					throw new Error('Mailbox id is required in edit mode.');
				}

				const payload = this.buildUpdatePayload();
				const response = await Api.updateMailbox(mailboxId, payload);

				return response.data;
			}

			const payload = this.buildCreatePayload();

			if (this.isConnectionRequestMode)
			{
				const response = await Api.connectMailboxByConnectionRequest(
					Number(this.state.connectionRequestId),
					payload,
				);

				return response.data;
			}

			const response = await Api.connectMailbox(payload);

			return response.data;
		},

		async onSave(): Promise<void>
		{
			const errors = validateForm(this.state);
			if (Object.keys(errors).length > 0)
			{
				this.state.errors = {
					...createEmptyErrors(),
					...errors,
				};

				return;
			}

			this.state.loading = true;
			this.state.errors = createEmptyErrors();

			try
			{
				const result = await this.submitSave();
				this.onSaveSuccess(result);
			}
			catch (error)
			{
				this.onSaveError(error);
			}
			finally
			{
				this.state.loading = false;
			}
		},

		/**
		 * Counts the refusals that need the tenant administrator's consent: the number
		 * that shows how many people cannot connect their mailbox until the application is
		 * approved. Reuses the existing connect event, so nothing has to be agreed upon:
		 * the case stays distinguishable by p1, and the provider code lands in p2 because
		 * it is stored nowhere else.
		 */
		sendOauthDeniedAnalytics(errorCode: string): void
		{
			const analytics = getRootBX().UI?.Analytics;
			if (!analytics?.sendData)
			{
				return;
			}

			analytics.sendData({
				tool: 'mail',
				event: this.isEditMode ? 'mailbox_edit' : 'mailbox_connect',
				type: this.state.service?.name ?? '',
				category: 'mail_general_ops',
				c_section: 'menu',
				status: 'error',
				p1: `oauthDenied_${OAUTH_DENIED_ADMIN_CONSENT_SCENARIO}`,
				p2: `errorCode_${sanitizeAnalyticsValue(errorCode)}`,
			});
		},

		sendProviderRestrictionAnalytics(providerCode: string, element: string): void
		{
			const analytics = getRootBX().UI?.Analytics;
			if (!analytics?.sendData)
			{
				return;
			}

			analytics.sendData({
				tool: 'mail',
				event: 'provider_restriction_notice',
				type: providerCode,
				category: 'mail_general_ops',
				c_section: 'mailbox_edit',
				c_element: element,
			});
		},

		sendAnalytics(status: 'success' | 'error'): void
		{
			const analytics = getRootBX().UI?.Analytics;
			if (!analytics?.sendData)
			{
				return;
			}

			const sharedCount = Array.isArray(this.state.access.sharedWith)
				? this.state.access.sharedWith.length
				: 0;
			const isShared = sharedCount > 1;
			const isCrm = Boolean(this.state.crmSettings.enabled);
			const isIcal = Boolean(this.state.calendarSettings.enabled
				&& this.state.calendarSettings.autoAddEvents);

			analytics.sendData({
				tool: 'mail',
				event: this.isEditMode ? 'mailbox_edit' : 'mailbox_connect',
				type: this.state.service?.name ?? '',
				category: 'mail_general_ops',
				c_section: 'menu',
				status,
				p1: `integrationCalendar_${isIcal ? 'true' : 'false'}`,
				p2: `integrationCRM_${isCrm ? 'true' : 'false'}`,
				p3: `shared_${isShared ? 'true' : 'false'}`,
			});
		},

		onSaveSuccess(result: SaveResult): void
		{
			this.sendAnalytics('success');

			const mailboxId = Number(result?.id) || 0;

			if (this.state.mode === 'edit')
			{
				if (mailboxId > 0)
				{
					this.postSliderMessage('mail-mailbox-config-success', {
						id: mailboxId,
						changed: this.state.changedDirs,
					});
				}

				this.closeForm(mailboxId);

				return;
			}

			if (mailboxId <= 0)
			{
				this.closeForm(0);

				return;
			}

			if (isConnectionRequestResult(result) && result.connectionRequestCompleted)
			{
				this.postSliderMessage('mail-mailbox-connection-request-completed', {
					id: mailboxId,
				});
				this.closeForm(mailboxId);

				return;
			}

			this.openDirsSlider(mailboxId);
		},

		onSaveError(error: unknown): void
		{
			if (this.handleSmtpConfirm(error))
			{
				return;
			}

			this.sendAnalytics('error');

			const serverErrors = extractAjaxErrors(error);
			if (serverErrors.length > 0)
			{
				this.state.errors.generalItems = serverErrors.map((item) => createServerErrorItem(item));
			}
			else
			{
				this.state.errors.generalItems = [
					createGeneralErrorItem(Loc.getMessage('MAIL_CONFIG_FORM_ERROR_AJAX') ?? ''),
				];
			}

			void this.$nextTick(() => {
				const el = this.$refs.errorAlert as HTMLElement | undefined;
				el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			});
		},

		handleSmtpConfirm(error: unknown): boolean
		{
			const errors = extractAjaxErrors(error);
			const mainMailConfirm = getTopWindow().BXMainMailConfirm;

			if (
				errors.length !== 1
				|| errors[0].message !== 'MAIL_CLIENT_CONFIG_SMTP_CONFIRM'
				|| !mainMailConfirm
			)
			{
				return false;
			}

			mainMailConfirm.showForm(
				() => { void this.onSave(); },
				{
					mode: 'confirm',
					data: { email: this.state.connection.email },
				},
			);

			return true;
		},

		async onDelete(): Promise<void>
		{
			const mailboxId = this.state.mailboxId;
			if (!mailboxId)
			{
				return;
			}

			this.state.loading = true;
			this.state.errors.generalItems = [];

			try
			{
				await Api.deleteMailbox(mailboxId);
				this.postSliderMessage('mail-mailbox-config-delete', {
					id: mailboxId,
				});
				this.closeForm(0);
			}
			catch (error)
			{
				this.onSaveError(error);
			}
			finally
			{
				this.state.loading = false;
			}
		},

		openMailboxListWithFilter(email: string): void
		{
			const params = new URLSearchParams({
				EMAIL: email,
				apply_filter: 'Y',
			});

			getCurrentSidePanel()?.open(`${MAILBOX_LIST_PATH}?${params.toString()}`, {
				cacheable: false,
				data: {
					resetFilterOnClose: true,
				},
			});
		},

		openDirsSlider(mailboxId: number): void
		{
			const url = getRootBX().util.add_url_param(
				this.state.paths.configDirs || '/mail/config/dirs',
				{
					mailboxId,
					INIT: 'Y',
				},
			);

			getCurrentSidePanel()?.open(url, {
				width: 640,
				cacheable: false,
				allowChangeHistory: false,
				events: {
					onClose: () => {
						this.closeForm(mailboxId);
						this.postSliderMessage('mail-mailbox-config-success', {
							id: mailboxId,
							changed: this.state.changedDirs,
						});
					},
					},
				});
		},

		closeForm(id: number): void
		{
			const slider = getTopSidePanel()?.getSliderByWindow?.(window)
				|| getCurrentSidePanel()?.getTopSlider?.();

			if (slider)
			{
				slider.setCacheable(false);
				slider.close();

				return;
			}

			if (id > 0 && this.state.paths.messageList)
			{
				window.location.href = this.state.paths.messageList
					.replace('#id#', String(id))
					.replace('#start_sync_with_showing_stepper#', 'true');

				return;
			}

			if (this.state.paths.home)
			{
				window.location.href = this.state.paths.home;
			}
		},

		postSliderMessage(eventId: string, data: unknown): void
		{
			getTopSidePanel()?.postMessage?.(window, eventId, data);
		},

		bindSidePanelListeners(): void
		{
			const onSliderMessage = (event: SliderMessageEvent): void => {
				if (event.getEventId() === 'mail-mailbox-config-dirs-success')
				{
					this.state.changedDirs = Boolean(event.data?.changed);
				}
			};
			this.onSliderMessage = onSliderMessage;

			getRootBX().addCustomEvent('SidePanel.Slider:onMessage', onSliderMessage);

			const slider = getTopSidePanel()?.getSliderByWindow?.(window);
			if (slider)
			{
				this.boundSlider = slider;
				const onSliderClose = (): void => {
					this.postSliderMessage('mail-mailbox-config-close', {
						changed: this.state.changedDirs,
					});
				};
				this.onSliderClose = onSliderClose;
				getRootBX().addCustomEvent(slider, 'SidePanel.Slider:onClose', onSliderClose);
			}
		},

		unbindSidePanelListeners(): void
		{
			if (this.onSliderMessage)
			{
				getRootBX().removeCustomEvent('SidePanel.Slider:onMessage', this.onSliderMessage);
				this.onSliderMessage = null;
			}

			if (this.boundSlider && this.onSliderClose)
			{
				getRootBX().removeCustomEvent(this.boundSlider, 'SidePanel.Slider:onClose', this.onSliderClose);
				this.boundSlider = null;
				this.onSliderClose = null;
			}
		},

		onCancel(): void
		{
			this.closeForm(0);
		},

		onProviderButtonClick(): void
		{
			if (this.state.migrationActive)
			{
				return;
			}

			if (this.isEditMode)
			{
				this.confirmDelete();

				return;
			}

			if (this.isOAuthConnected)
			{
				this.disconnectOAuth();

				return;
			}

			if (this.isOAuthService)
			{
				void this.startOAuth();
			}
		},

		confirmDelete(): void
		{
			MessageBox.confirm(
				Loc.getMessage('MAIL_CONFIG_FORM_DELETE_CONFIRM_TITLE') ?? '',
				null,
				(messageBox: { close(): void }) => {
					messageBox.close();
					void this.onDelete();
				},
				Loc.getMessage('MAIL_CONFIG_FORM_DELETE_CONFIRM_OK') ?? '',
				null,
				null,
				true,
			);
		},

		async startOAuth(): Promise<void>
		{
			const serviceName = this.state.service?.name;
			if (!serviceName)
			{
				return;
			}

			try
			{
				const response = await Api.getOauthUrl(serviceName);
				const url = response.data;

				if (url)
				{
					const popup = getRootBX().util.popup(url, 800, 600);
					this.oauthPending = true;
					this.oauthPopupHolder.current = popup;
					EventEmitter.subscribe(
						'OnMailOAuthBCompleted',
						this.onOAuthCompleted as (...args: unknown[]) => void,
						{ compatMode: true },
					);
					EventEmitter.subscribe(
						'OnMailOAuthBError',
						this.onOAuthDenied as (...args: unknown[]) => void,
						{ compatMode: true },
					);

					// The provider window can be dismissed without firing OnMailOAuthBCompleted
					// (user closes the popup, cross-origin redirect drops the listener, etc.).
					// Poll popup.closed so the UI unblocks instead of hanging the OAuth button.
					this.startOauthPopupWatcher();
				}
			}
			catch (error)
			{
				console.error('OAuth URL error:', error);
			}
		},

		startOauthPopupWatcher(): void
		{
			this.stopOauthPopupWatcher();

			this.oauthPopupWatcher = setInterval(() => {
				const popup = this.oauthPopupHolder.current;
				if (!popup || popup.closed)
				{
					this.handleOauthAborted();
				}
			}, 500);
		},

		stopOauthPopupWatcher(): void
		{
			if (this.oauthPopupWatcher !== null)
			{
				clearInterval(this.oauthPopupWatcher);
				this.oauthPopupWatcher = null;
			}
		},

		handleOauthAborted(): void
		{
			if (!this.oauthPending)
			{
				return;
			}

			EventEmitter.unsubscribe('OnMailOAuthBCompleted', this.onOAuthCompleted);
			EventEmitter.unsubscribe('OnMailOAuthBError', this.onOAuthDenied);
			this.oauthPending = false;
			this.oauthPopupHolder.current = null;
			this.stopOauthPopupWatcher();
		},

		/**
		 * The provider refused: the server has already classified the refusal and sent the
		 * wording, so here we only unblock the form and show what came in.
		 *
		 * Runs before the popup closes: otherwise the popup watcher would treat the closed
		 * window as a cancellation and swallow the message.
		 */
		onOAuthDenied(
			_uid: string | null | undefined,
			scenario: string | null | undefined,
			title: string | null | undefined,
			text: string | null | undefined,
			errorCode: string | null | undefined,
		): void
		{
			EventEmitter.unsubscribe('OnMailOAuthBCompleted', this.onOAuthCompleted);
			EventEmitter.unsubscribe('OnMailOAuthBError', this.onOAuthDenied);
			this.stopOauthPopupWatcher();
			this.oauthPopupHolder.current = null;
			this.oauthPending = false;

			if (scenario === OAUTH_DENIED_ADMIN_CONSENT_SCENARIO)
			{
				this.sendOauthDeniedAnalytics(errorCode ?? '');
			}

			if (!text)
			{
				return;
			}

			this.closeSyncFailureGuide();

			announceRefusal(title ?? '', text).catch((error) => {
				console.error('Mail: cannot announce the OAuth refusal', error);
			});

			const guide = showOauthDeniedGuide({
				targetSelector: SYNC_FAILURE_GUIDE_TARGETS.oauth,
				title: title ?? '',
				text,
			});

			if (guide)
			{
				this.syncFailureGuide = markRaw(guide);

				return;
			}

			// No anchor in the DOM: without this fallback the message would disappear.
			// The notification extension is loaded on demand - a rare fallback should not
			// weigh on every opening of the form.
			notifyFallback(text).catch((error) => {
				// Losing the reason silently is the very thing this task fixes, so a failed
				// notification is at least reported to the console.
				console.error('Mail: cannot show the OAuth refusal notification', error);
			});
		},

		onOAuthCompleted(
			uid: string | null | undefined,
			_url: string | null | undefined,
			user: OauthCompletionUser | null | undefined,
		): void
		{
			EventEmitter.unsubscribe('OnMailOAuthBCompleted', this.onOAuthCompleted);
			EventEmitter.unsubscribe('OnMailOAuthBError', this.onOAuthDenied);
			this.stopOauthPopupWatcher();
			this.oauthPopupHolder.current = null;
			this.oauthPending = false;

			if (!uid || !user)
			{
				return;
			}

			this.state.connection.oauthUid = uid;
			this.state.connection.isOAuth = true;
			this.state.connection.oauthUser = mapOauthUser(user);
			this.state.connection.userPrincipalName = user.userPrincipalName || '';
			this.state.connection.oauthEmailNeedsConfirmation = false;
			this.state.connection.oauthEmailCheckStatus = 'idle';

			if (user.email)
			{
				this.state.connection.email = user.email;
			}

			// emailIsIntended === true means we couldn't read the mailbox address from the
			// provider API and fell back to the Bitrix user profile email: this is a *guess*,
			// not a confirmed mailbox. Verify it via IMAP; if it fails, ask the user for the
			// correct address. emailIsIntended === false means the email came straight from
			// the OAuth provider (e.g. Office365 EmailAddress): trust it.
			if (user.emailIsIntended === true && user.email)
			{
				void this.verifyOauthEmail(user.email);
			}
		},

		async verifyOauthEmail(email: string): Promise<void>
		{
			const serviceId = Number(this.state.service?.id);
			const oauthUid = this.state.connection.oauthUid;

			if (!serviceId || !oauthUid || !email)
			{
				return;
			}

			// Drop in-flight blur if user keeps editing while a request is pending: IMAP probes
			// are slow (10-30s) and concurrent ones soft-DoS the mail server.
			if (this.state.connection.oauthEmailCheckStatus === 'checking')
			{
				return;
			}

			// Stale-response guard: every call gets a sequence number. When the response arrives,
			// we only apply it if no newer call has been started since.
			const sequence = ++this.verifyEmailRequestSeq;
			this.state.connection.oauthEmailCheckStatus = 'checking';

			try
			{
				const response = await Api.checkEmailAvailability({ serviceId, email, oauthUid });
				if (sequence !== this.verifyEmailRequestSeq)
				{
					return;
				}

				if (response.data === true)
				{
					this.state.connection.email = email;
					this.state.connection.oauthEmailNeedsConfirmation = false;
					this.state.connection.oauthEmailCheckStatus = 'success';

					return;
				}

				this.state.connection.email = '';
				this.state.connection.oauthEmailNeedsConfirmation = true;
				this.state.connection.oauthEmailCheckStatus = 'error';
			}
			catch
			{
				if (sequence !== this.verifyEmailRequestSeq)
				{
					return;
				}

				// Keep the user-entered email: they may want to retry the same value
				// after a transient network failure. Just flag the issue in UI.
				this.state.connection.oauthEmailNeedsConfirmation = true;
				this.state.connection.oauthEmailCheckStatus = 'error';
			}
		},

		onOauthEmailBlur(): void
		{
			if (!this.state.connection.oauthEmailNeedsConfirmation)
			{
				return;
			}

			if (this.state.connection.oauthEmailCheckStatus === 'checking')
			{
				return;
			}

			const email = this.state.connection.email.trim();
			if (!email)
			{
				this.state.connection.oauthEmailCheckStatus = 'idle';

				return;
			}

			void this.verifyOauthEmail(email);
		},

		disconnectOAuth(): void
		{
			this.state.connection.oauthUid = null;
			this.state.connection.isOAuth = false;
			this.state.connection.oauthUser = null;
			this.state.connection.userPrincipalName = '';
			this.state.connection.oauthEmailNeedsConfirmation = false;
			this.state.connection.oauthEmailCheckStatus = 'idle';
		},
	},

	// language=Vue
	template: `
		<template v-if="state.isDataReady">
			<div class="mail-config-form" data-test-id="mail_config-form__root">
				<div
					v-if="state.migrationActive"
					class="mail-config-form__alert-container --warning"
					data-test-id="mail_config-form__migration-warning"
				>
					<BIcon
						class="mail-config-form__alert-icon"
						:name="warningIconName"
						:size="24"
					/>
					<span class="mail-config-form__alert-message">
						{{ loc('MAIL_CONFIG_FORM_MIGRATION_CREDENTIALS_LOCKED') }}
					</span>
				</div>
				<div
					class="mail-config-form__section"
					data-test-id="mail_config-form__connection-section"
				>
					<div class="mail-config-form__section-header">
						<div class="mail_massconnect__integration-block_icon --mail"></div>
						<div class="mail-config-form__section-title-block" :class="{ '--centered': !isEditMode }">
							<HeadlineSm>
								{{ loc('MAIL_CONFIG_FORM_SELECTED_CLIENT_TITLE') }}
							</HeadlineSm>
							<div
								v-if="isEditMode"
								class="mail-config-form__section-subtitle"
								data-test-id="mail_config-form__last-check"
							>
								{{ lastCheckText }}
							</div>
						</div>
					</div>
					<div class="mail-config-form__section-content">
						<ProviderBadge
							:icon-key="providerIconKey"
							:title="providerTitle"
							:email="providerEmail"
							:avatar="providerAvatar"
							:button-text="providerButtonText"
							:button-disabled="oauthPending || state.migrationActive"
							@button-click="onProviderButtonClick"
						/>
						<ConnectionRequestOwner v-if="isConnectionRequestMode" />
						<ConnectionSettings
							v-if="isEditMode || !isOAuthService || isOAuthConnected"
							:password-placeholder="passwordPlaceholder"
							@oauth-email-blur="onOauthEmailBlur"
						>
							<template #after-fields>
								<MailIntegration
									v-if="!isEditMode"
									:compact="true"
									:sync-period-options="state.settingsOptions.mailSync"
									v-model="mailSyncModel"
								/>
							</template>
						</ConnectionSettings>
						<MicrosoftConnection v-if="isMicrosoftService" />
					</div>
				</div>

				<MailboxOwnership v-if="isEditMode && state.permissions.canChangeOwner" />

				<SmtpSettings
					v-if="state.permissions.isSmtpAvailable"
					:password-placeholder="passwordPlaceholder"
				/>

				<CrmIntegration
					v-if="showCrm"
					v-model="state.crmSettings"
					:can-edit-crm-integration="state.permissions.canEditCrm"
					:sync-period-options="state.settingsOptions.crmSync"
					:entity-options="state.settingsOptions.crmEntity"
					:source-options="state.settingsOptions.crmSource"
					:is-edit-mode="isEditMode"
					:show-vcf-option="true"
				/>

				<CalendarIntegration
					v-if="showCalendar"
					v-model="state.calendarSettings"
					:show-switcher="false"
				/>

				<AccessSharing />

				<div
					v-if="generalErrorItems.length > 0"
					ref="errorAlert"
					class="mail-config-form__alert-container --danger"
					data-test-id="mail_config-form__error"
				>
					<BIcon
						class="mail-config-form__alert-icon"
						:name="warningIconName"
						:size="24"
					/>
					<div class="mail-config-form__alert-body">
						<div
							v-for="(item, index) in generalErrorItems"
							:key="index"
							class="mail-config-form__alert-message"
							:data-test-id="'mail_config-form__error-item_' + index"
						>
							<span>{{ item.message }}</span>
							<UiButton
								v-if="item.occupiedEmail && canViewMailboxList"
								class="mail-config-form__alert-action"
								:text="loc('MAIL_CONFIG_FORM_ERROR_FIND_MAILBOX')"
								:style="AirButtonStyle.PLAIN_ACCENT"
								:size="ButtonSize.EXTRA_SMALL"
								:dataset="{ testId: 'mail_config-form__error-find-mailbox_' + index }"
								@click="openMailboxListWithFilter(item.occupiedEmail)"
							/>
							<template v-if="item.customData">
								<button
									v-if="!item.expanded"
									type="button"
									class="mail-config-form__alert-toggle"
									@click="item.expanded = true"
									:data-test-id="'mail_config-form__error-details-toggle_' + index"
								>{{ loc('MAIL_CONFIG_FORM_ERROR_DETAILS') }}</button>
								<div
									v-else
									class="mail-config-form__alert-details"
									:data-test-id="'mail_config-form__error-details_' + index"
								>{{ item.customData }}</div>
							</template>
						</div>
					</div>
				</div>

				<FormActions
					:is-edit-mode="isEditMode"
					@save="onSave"
					@cancel="onCancel"
				/>
			</div>
		</template>
			<div
				v-else
				class="mail-config-form --loading"
				data-test-id="mail_config-form__loader"
			>
				<div class="mail-config-form__loader"></div>
			</div>
		`,
});
