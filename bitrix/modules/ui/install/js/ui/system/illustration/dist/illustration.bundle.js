/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
this.BX.UI.System = this.BX.UI.System || {};
(function (exports, main_core) {
	'use strict';

	const IllustrationName = Object.freeze({
		ACCOUNT_CREATE: 'account-create',
		ACHIEVEMENT_USER: 'achievement-user',
		ANALYTICS_ISSUE: 'analytics-issue',
		ANNOUNCEMENT: 'announcement',
		APPS_DISABLED: 'apps-disabled',
		AUTOMATION__ALERT: 'automation--alert',
		AUTOMATION__WARNING: 'automation--warning',
		BILLING_PERIOD: 'billing-period',
		CAMERA_RECORDING: 'camera-recording',
		CAMERA_VERIFIED: 'camera-verified',
		CATALOG__ALERT: 'catalog--alert',
		CATALOG__WARNING: 'catalog--warning',
		CATALOG: 'catalog',
		CHAT_CONVERSATION: 'chat-conversation',
		CHAT_INTERNAL: 'chat-internal',
		CHAT_SETTINGS: 'chat-settings',
		CLOUD__ALERT: 'cloud--alert',
		CLOUD__WARNING: 'cloud--warning',
		CLOUD: 'cloud',
		COLLAB_CHAT: 'collab-chat',
		COLLAB_TEAM_CHAT: 'collab-team-chat',
		COLLAB_TEAM: 'collab-team',
		COLLAB: 'collab',
		COMPANY_FEED: 'company-feed',
		COMPANY_TEAM: 'company-team',
		CONNECTION_ERROR: 'connection-error',
		CONTACTS__ALERT: 'contacts--alert',
		CONTACTS__WARNING: 'contacts--warning',
		CONTACTS: 'contacts',
		COPILOT_AI__ALERT: 'copilot-ai--alert',
		COPILOT_AI__SUCCESS: 'copilot-ai--success',
		COPILOT_AI__WARNING: 'copilot-ai--warning',
		COPILOT_AI: 'copilot-ai',
		COPILOT: 'copilot',
		CREATE_NEW: 'create-new',
		CRM__ALERT: 'crm--alert',
		CRM__WARNING: 'crm--warning',
		CRM_WITH_SHOP: 'crm-with-shop',
		DEVICE_SECURITY__WARNING: 'device-security--warning',
		DOCUMENT__ALERT: 'document--alert',
		DOCUMENT__WARNING: 'document--warning',
		DOCUMENT_UNSIGNED: 'document-unsigned',
		DOCUMENT: 'document',
		DOCUMENTS_STACK: 'documents-stack',
		DOWNLOAD_COMPLETE: 'download-complete',
		DOWNLOAD_OPTIONS: 'download-options',
		DOWNLOAD: 'download',
		ECOMMERCE__ALERT: 'ecommerce--alert',
		ECOMMERCE__WARNING: 'ecommerce--warning',
		EMAIL__ALERT: 'email--alert',
		EMAIL__WARNING: 'email--warning',
		EMAIL_SCHEDULED: 'email-scheduled',
		EMPTY_ACCOUNT: 'empty-account',
		EMPTY_SEARCH_APPS: 'empty-search-apps',
		EMPTY_SEARCH_FLOWS: 'empty-search-flows',
		EMPTY_SEARCH_PEOPLE: 'empty-search-people',
		EMPTY_SEARCH: 'empty-search',
		EMPTY_STATE_WIDE: 'empty-state-wide',
		FEEDBACK_LOVE: 'feedback-love',
		FEEDBACK_POSITIVE: 'feedback-positive',
		FLOW_COMPLETE: 'flow-complete',
		FOLDER_CREATE: 'folder-create',
		FOLDER_EDIT: 'folder-edit',
		FOLDER_LINKED: 'folder-linked',
		FOLDER_SETTINGS: 'folder-settings',
		FOLDER_SHARED: 'folder-shared',
		FOLDER_WITH_CHAT: 'folder-with-chat',
		FOLDER_WITH_FILE: 'folder-with-file',
		FOLDER: 'folder',
		FORM__SUCCESS: 'form--success',
		GLOBAL__ALERT: 'global--alert',
		GLOBAL__WARNING: 'global--warning',
		GLOBAL: 'global',
		GROUP__ALERT: 'group--alert',
		GROUP__WARNING: 'group--warning',
		GROUP_CHAT: 'group-chat',
		GROUP_INVITE: 'group-invite',
		GROUP_VERIFIED: 'group-verified',
		HELP_RESOLVED: 'help-resolved',
		HELP: 'help',
		INVITE: 'invite',
		KEY_WITH_PASSWORD: 'key-with-password',
		LEARNING__ALERT: 'learning--alert',
		LEARNING__WARNING: 'learning--warning',
		LEARNING: 'learning',
		LINK: 'link',
		LOCATION__SUCCESS: 'location--success',
		LOCATION: 'location',
		LOCK__WARNING: 'lock--warning',
		LOCK_WITH_FACEID: 'lock-with-faceid',
		LOCK_WITH_FINGERPRINT: 'lock-with-fingerprint',
		LOCK_WITH_KEY: 'lock-with-key',
		LOCK_WITH_LINK: 'lock-with-link',
		LOCK: 'lock',
		MAIL_AND_CLOCK: 'mail-and-clock',
		MARKETPLACE_INSTALL: 'marketplace-install',
		MARKETPLACE_ISSUE_ALT: 'marketplace-issue-alt',
		MARKETPLACE_ISSUE: 'marketplace-issue',
		MESSAGE_TO_GROUP: 'message-to-group',
		MESSAGE_UNREAD: 'message-unread',
		MOBILE_APP_SEARCH: 'mobile-app-search',
		MOBILE_APP_VERIFIED: 'mobile-app-verified',
		MOBILE_APP: 'mobile-app',
		MOBILE_WITH_CHECK_AND_MESSAGE: 'mobile-with-check-and-message',
		NO_BITRIX_ACCOUNT: 'no-bitrix-account',
		NO_RESULTS: 'no-results',
		NOTIFICATION_CONFIRMED: 'notification-confirmed',
		NOTIFICATION_FILTER: 'notification-filter',
		NOTIFICATION_SETTINGS: 'notification-settings',
		OPEN_CHANNELS__ALERT: 'open-channels--alert',
		OPEN_CHANNELS__WARNING: 'open-channels--warning',
		OPEN_CHANNELS: 'open-channels',
		PAYMENT_DELIVERY: 'payment-delivery',
		PERSON_AND_RED_LOCK: 'person-and-red-lock',
		PERSON_LOCK: 'person-lock',
		PHONE_CALL: 'phone-call',
		PIPELINE_CREATE: 'pipeline-create',
		PIPELINE_EXPORT: 'pipeline-export',
		PREMIUM__ALERT: 'premium--alert',
		PREMIUM__WARNING: 'premium--warning',
		PREMIUM_PROMO: 'premium-promo',
		PREMIUM: 'premium',
		PRINT: 'print',
		REACTION_ADD: 'reaction-add',
		REFRESH_ISSUE: 'refresh-issue',
		REFRESH_WITH_LINK: 'refresh-with-link',
		REFRESH: 'refresh',
		SCREEN_RESIZE: 'screen-resize',
		SEARCH_ANALYTICS: 'search-analytics',
		SEARCH_FILE: 'search-file',
		SEARCH_RESTRICTED: 'search-restricted',
		SEARCH: 'search',
		SECURITY_ALERT: 'security-alert',
		SECURITY_HELP: 'security-help',
		SECURITY_SETTINGS: 'security-settings',
		SECURITY_UNKNOWN__WARNING: 'security-unknown--warning',
		SECURITY_VERIFIED: 'security-verified',
		SECURITY_WARNING: 'security-warning',
		SERVER_BLOCKED__WARNING: 'server-blocked--warning',
		SERVER_PROTECTION: 'server-protection',
		SETTINGS_CONFIRMED: 'settings-confirmed',
		SETTINGS_OPTIONS: 'settings-options',
		SIGNATURE_ATTENTION: 'signature-attention',
		STORAGE__ALERT: 'storage--alert',
		STORAGE__WARNING: 'storage--warning',
		SUCCESS: 'success',
		TABLE_AND_PLUS: 'table-and-plus',
		TASK__SUCCESS: 'task--success',
		TASK_ISSUE: 'task-issue',
		TASK_LOCKED: 'task-locked',
		TEAM_SECURITY__ALERT: 'team-security--alert',
		TEAM_SECURITY__WARNING: 'team-security--warning',
		TEAM_SECURITY: 'team-security',
		TIME_TRACKING__SUCCESS: 'time-tracking--success',
		TIMELINE_COMPLETE: 'timeline-complete',
		TIMELINE: 'timeline',
		TWO_FILES_AND_CHECK: 'two-files-and-check',
		TWO_FILES_AND_LINK: 'two-files-and-link',
		UPGRADE_BOOST: 'upgrade-boost',
		UPLOAD_COMPLETE: 'upload-complete',
		UPLOAD_OPTIONS: 'upload-options',
		USER_INVITE: 'user-invite',
		USER_LOCKED__ALERT: 'user-locked--alert',
		USER_LOCKED: 'user-locked',
		USER_SCHEDULE: 'user-schedule',
		USER_WITH_GROUP: 'user-with-group',
		USER: 'user',
		USERS_CHANNEL: 'users-channel',
		USERS_SHARED: 'users-shared',
		VIDEO_CALL: 'video-call',
		VIDEO_MESSAGE: 'video-message',
		WARNING_GENERIC: 'warning-generic',
		WEBSITE__ALERT: 'website--alert',
		WEBSITE__WARNING: 'website--warning',
		WEBSITE: 'website',
		HELPER_1C: 'helper-1c',
		HELPER_CALENDAR: 'helper-calendar',
		HELPER_CHAT: 'helper-chat',
		HELPER_COLLAB: 'helper-collab',
		HELPER_COMPANY: 'helper-company',
		HELPER_COMPASS: 'helper-compass',
		HELPER_COPILOT: 'helper-copilot',
		HELPER_CREATE_FILE: 'helper-create-file',
		HELPER_CRM: 'helper-crm',
		HELPER_DOCUMENT_SIGN: 'helper-document-sign',
		HELPER_GRAPH: 'helper-graph',
		HELPER_GROUP: 'helper-group',
		HELPER_HANDSHAKE: 'helper-handshake',
		HELPER_HOME: 'helper-home',
		HELPER_LOCK: 'helper-lock',
		MASCOT_ROCKER: 'mascot-rocker',
		MASCOT_RUNNING_RIGHT: 'mascot-running-right',
		MASCOT_SITTING_LAPTOP_FRONT: 'mascot-sitting-laptop-front',
		MASCOT_SITTING_LAPTOP_LEFT: 'mascot-sitting-laptop-left',
		MASCOT_SITTING_POINTING_PHONE: 'mascot-sitting-pointing-phone',
		MASCOT_SITTING_POINTING: 'mascot-sitting-pointing',
		MASCOT_SITTING_WAVING: 'mascot-sitting-waving',
		MASCOT_STANDING_ANGRY: 'mascot-standing-angry',
		MASCOT_STANDING_HANDS_ON_HIPS: 'mascot-standing-hands-on-hips',
		MASCOT_STANDING_POINTING_LEFT: 'mascot-standing-pointing-left',
		MASCOT_STANDING_POINTING_RIGHT: 'mascot-standing-pointing-right',
		MASCOT_STANDING_PUZZLED: 'mascot-standing-puzzled',
		MASCOT_STANDING_WITH_PHONE: 'mascot-standing-with-phone',
		MASCOT_VACATION: 'mascot-vacation'
	});
	const IllustrationCatalog = Object.freeze([{
		id: 'main',
		title: 'Основная библиотека',
		names: ['account-create', 'achievement-user', 'analytics-issue', 'announcement', 'apps-disabled', 'automation--alert', 'automation--warning', 'billing-period', 'camera-recording', 'camera-verified', 'catalog--alert', 'catalog--warning', 'catalog', 'chat-conversation', 'chat-internal', 'chat-settings', 'cloud--alert', 'cloud--warning', 'cloud', 'collab-chat', 'collab-team-chat', 'collab-team', 'collab', 'company-feed', 'company-team', 'connection-error', 'contacts--alert', 'contacts--warning', 'contacts', 'copilot-ai--alert', 'copilot-ai--success', 'copilot-ai--warning', 'copilot-ai', 'copilot', 'create-new', 'crm--alert', 'crm--warning', 'crm-with-shop', 'device-security--warning', 'document--alert', 'document--warning', 'document-unsigned', 'document', 'documents-stack', 'download-complete', 'download-options', 'download', 'ecommerce--alert', 'ecommerce--warning', 'email--alert', 'email--warning', 'email-scheduled', 'empty-account', 'empty-search-apps', 'empty-search-flows', 'empty-search-people', 'empty-search', 'empty-state-wide', 'feedback-love', 'feedback-positive', 'flow-complete', 'folder-create', 'folder-edit', 'folder-linked', 'folder-settings', 'folder-shared', 'folder-with-chat', 'folder-with-file', 'folder', 'form--success', 'global--alert', 'global--warning', 'global', 'group--alert', 'group--warning', 'group-chat', 'group-invite', 'group-verified', 'help-resolved', 'help', 'invite', 'key-with-password', 'learning--alert', 'learning--warning', 'learning', 'link', 'location--success', 'location', 'lock--warning', 'lock-with-faceid', 'lock-with-fingerprint', 'lock-with-key', 'lock-with-link', 'lock', 'mail-and-clock', 'marketplace-install', 'marketplace-issue-alt', 'marketplace-issue', 'message-to-group', 'message-unread', 'mobile-app-search', 'mobile-app-verified', 'mobile-app', 'mobile-with-check-and-message', 'no-bitrix-account', 'no-results', 'notification-confirmed', 'notification-filter', 'notification-settings', 'open-channels--alert', 'open-channels--warning', 'open-channels', 'payment-delivery', 'person-and-red-lock', 'person-lock', 'phone-call', 'pipeline-create', 'pipeline-export', 'premium--alert', 'premium--warning', 'premium-promo', 'premium', 'print', 'reaction-add', 'refresh-issue', 'refresh-with-link', 'refresh', 'screen-resize', 'search-analytics', 'search-file', 'search-restricted', 'search', 'security-alert', 'security-help', 'security-settings', 'security-unknown--warning', 'security-verified', 'security-warning', 'server-blocked--warning', 'server-protection', 'settings-confirmed', 'settings-options', 'signature-attention', 'storage--alert', 'storage--warning', 'success', 'table-and-plus', 'task--success', 'task-issue', 'task-locked', 'team-security--alert', 'team-security--warning', 'team-security', 'time-tracking--success', 'timeline-complete', 'timeline', 'two-files-and-check', 'two-files-and-link', 'upgrade-boost', 'upload-complete', 'upload-options', 'user-invite', 'user-locked--alert', 'user-locked', 'user-schedule', 'user-with-group', 'user', 'users-channel', 'users-shared', 'video-call', 'video-message', 'warning-generic', 'website--alert', 'website--warning', 'website']
	}, {
		id: 'helper',
		title: 'Helper — мелкий калибр основной библиотеки',
		names: ['helper-1c', 'helper-calendar', 'helper-chat', 'helper-collab', 'helper-company', 'helper-compass', 'helper-copilot', 'helper-create-file', 'helper-crm', 'helper-document-sign', 'helper-graph', 'helper-group', 'helper-handshake', 'helper-home', 'helper-lock']
	}, {
		id: 'mascot',
		title: 'Зефир — маскот',
		names: ['mascot-rocker', 'mascot-running-right', 'mascot-sitting-laptop-front', 'mascot-sitting-laptop-left', 'mascot-sitting-pointing-phone', 'mascot-sitting-pointing', 'mascot-sitting-waving', 'mascot-standing-angry', 'mascot-standing-hands-on-hips', 'mascot-standing-pointing-left', 'mascot-standing-pointing-right', 'mascot-standing-puzzled', 'mascot-standing-with-phone', 'mascot-vacation']
	}]);

	const Illustration$1 = {
		name: 'UiIllustration',
		props: {
			name: {
				type: String,
				required: true,
				validator: value => Object.values(IllustrationName).includes(value)
			},
			size: {
				type: Number,
				default: 80
			},
			ariaLabel: {
				type: String,
				default: ''
			}
		},
		template: `
		<div
			class="ui-illustration"
			:class="'--' + name"
			:style="{ '--ui-illustration-size': size + 'px' }"
			:role="ariaLabel === '' ? undefined : 'img'"
			:aria-label="ariaLabel === '' ? undefined : ariaLabel"
			:aria-hidden="ariaLabel === '' ? 'true' : undefined"
		></div>
	`
	};

	var vue = Object.freeze({
		__proto__: null,
		Illustration: Illustration$1,
		IllustrationCatalog: IllustrationCatalog,
		IllustrationName: IllustrationName
	});

	const DEFAULT_SIZE = 80;
	class Illustration {
		#name;
		#size;
		#ariaLabel;
		#wrapper = null;
		constructor(options) {
			this.#name = this.#validateName(options.name);
			this.#size = options.size ?? DEFAULT_SIZE;
			this.#ariaLabel = options.ariaLabel ?? '';
		}
		render() {
			if (this.#wrapper) {
				return this.#wrapper;
			}
			const wrapper = main_core.Tag.render`
			<div class="ui-illustration --${this.#name}"></div>
		`;
			this.#wrapper = wrapper;
			this.#applySize();
			this.#applyAria();
			return wrapper;
		}
		renderTo(node) {
			main_core.Dom.append(this.render(), node);
		}
		setName(name) {
			const validated = this.#validateName(name);
			if (this.#wrapper) {
				main_core.Dom.removeClass(this.#wrapper, `--${this.#name}`);
				main_core.Dom.addClass(this.#wrapper, `--${validated}`);
			}
			this.#name = validated;
		}
		getName() {
			return this.#name;
		}
		setSize(size) {
			this.#size = size;
			this.#applySize();
		}
		getSize() {
			return this.#size;
		}
		destroy() {
			if (this.#wrapper) {
				main_core.Dom.remove(this.#wrapper);
			}
			this.#wrapper = null;
		}
		#validateName(name) {
			if (!Object.values(IllustrationName).includes(name)) {
				console.error(`ui.system.illustration: unknown illustration name "${name}"`);
			}
			return name;
		}
		#applySize() {
			if (this.#wrapper) {
				main_core.Dom.style(this.#wrapper, '--ui-illustration-size', `${this.#size}px`);
			}
		}
		#applyAria() {
			if (!this.#wrapper) {
				return;
			}
			if (this.#ariaLabel === '') {
				this.#wrapper.setAttribute('aria-hidden', 'true');
			} else {
				this.#wrapper.setAttribute('role', 'img');
				this.#wrapper.setAttribute('aria-label', this.#ariaLabel);
			}
		}
	}

	exports.Illustration = Illustration;
	exports.IllustrationCatalog = IllustrationCatalog;
	exports.IllustrationName = IllustrationName;
	exports.Vue = vue;

})(this.BX.UI.System.Illustration = this.BX.UI.System.Illustration || {}, BX);
//# sourceMappingURL=illustration.bundle.js.map
