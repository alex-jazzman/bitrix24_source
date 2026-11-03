/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
(function (exports, main_core, main_core_events, main_sidepanel, ui_iconSet_api_vue, ui_iconSet_outline, ui_iconSet_smallOutline, ui_system_alert_vue, ui_system_alert, ui_system_typography_vue, ui_vue3_components_button, ui_vue3, mail_client_scheduledMessage, ui_system_chip_vue) {
	'use strict';

	const ContactChips = ui_vue3.defineComponent({
		name: 'MailScheduledViewContactChips',
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		props: {
			items: {
				type: Array,
				default: () => []
			}
		},
		setup() {
			return {
				chipDesign: ui_system_chip_vue.ChipDesign.Tinted,
				chipSize: ui_system_chip_vue.ChipSize.Md
			};
		},
		methods: {
			imageOf(chip) {
				return chip.avatar ? {
					src: chip.avatar,
					alt: ''
				} : null;
			}
		},
		template: `
		<div class="mail-scheduled-view-chips">
			<Chip
				v-for="item in items"
				:key="item.testId"
				:design="chipDesign"
				:size="chipSize"
				:text="item.text"
				:image="imageOf(item)"
				rounded
				tabindex="-1"
				:data-testid="item.testId"
			/>
		</div>
	`
	});

	const MessageField = ui_vue3.defineComponent({
		name: 'MailScheduledViewMessageField',
		components: {
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			label: {
				type: String,
				required: true
			}
		},
		template: `
		<div class="mail-scheduled-view-field">
			<TextSm tag="dt" class-name="mail-scheduled-view-field__label">{{ label }}</TextSm>
			<dd class="mail-scheduled-view-field__value"><slot/></dd>
		</div>
	`
	});

	const TitleId = 'mail-scheduled-view-title';
	const BodyContentSecurityPolicy = "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'";
	const BodyStyle = 'body{margin:0;font:15px/1.5 Arial,sans-serif;color:#333;overflow-wrap:anywhere}';
	const FallbackTimezoneId = 'UTC';
	const CancelErrorPhrase = Object.freeze({
		[mail_client_scheduledMessage.ScheduledMessageErrorCode.AlreadySending]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_ALREADY_SENDING',
		[mail_client_scheduledMessage.ScheduledMessageErrorCode.AlreadySent]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_ALREADY_SENT',
		[mail_client_scheduledMessage.ScheduledMessageErrorCode.AlreadyCancelled]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_ALREADY_CANCELLED',
		[mail_client_scheduledMessage.ScheduledMessageErrorCode.RevisionConflict]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_REVISION_CONFLICT',
		[mail_client_scheduledMessage.ScheduledMessageErrorCode.AccessDenied]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_ACCESS_DENIED',
		[mail_client_scheduledMessage.ScheduledMessageErrorCode.NotFound]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_NOT_FOUND',
		[mail_client_scheduledMessage.ScheduledMessageErrorCode.DraftUnavailable]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_DRAFT_UNAVAILABLE',
		[mail_client_scheduledMessage.ScheduledMessageErrorCode.DraftSaveFailed]: 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR_DRAFT_SAVE_FAILED'
	});
	const CancelErrorFallbackPhrase = 'MAIL_SCHEDULED_VIEW_CANCEL_ERROR';
	const SliderMessage = Object.freeze({
		Cancelled: 'Mail.Client.ScheduledMessageCancelled',
		Saved: 'Mail.Client.ScheduledMessageSaved'
	});
	const SliderMessageEvent = 'SidePanel.Slider:onMessage';
	function scheduledAtText(message) {
		for (const timezoneId of [message.authorTimezoneId, FallbackTimezoneId]) {
			try {
				return mail_client_scheduledMessage.formatRelativeScheduledDateTime(message.scheduledAt, timezoneId);
			} catch {
				continue;
			}
		}
		return '';
	}
	function errorCodeOf(error) {
		const code = error?.code;
		return main_core.Type.isString(code) ? code : '';
	}
	function cancelErrorText(error) {
		return main_core.Loc.getMessage(CancelErrorPhrase[errorCodeOf(error)] ?? CancelErrorFallbackPhrase) ?? '';
	}
	function chipsOf(contacts, testIdPrefix, text) {
		return contacts.map((contact, index) => ({
			testId: `${testIdPrefix}-${index}`,
			text: text(contact),
			avatar: contact.avatar ?? null
		}));
	}
	const ScheduledView = ui_vue3.defineComponent({
		name: 'MailScheduledView',
		components: {
			Alert: ui_system_alert_vue.Alert,
			BIcon: ui_iconSet_api_vue.BIcon,
			ContactChips,
			HeadlineLg: ui_system_typography_vue.HeadlineLg,
			MessageField,
			TextMd: ui_system_typography_vue.TextMd,
			TextSm: ui_system_typography_vue.TextSm,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			state: {
				type: Object,
				required: true
			}
		},
		setup() {
			return {
				AlertDesign: ui_system_alert.AlertDesign,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				titleId: TitleId,
				titleIcon: ui_iconSet_api_vue.Outline.MAIL_SEND,
				scheduleIcon: ui_iconSet_api_vue.SmallOutline.CLOCK,
				cancelIcon: ui_iconSet_api_vue.Outline.UNDO,
				editIcon: ui_iconSet_api_vue.Outline.EDIT_M
			};
		},
		computed: {
			message() {
				return this.state.message;
			},
			canCancel() {
				return Boolean(this.message?.permissions.canManage && this.message.actions.includes('cancel'));
			},
			canEdit() {
				return Boolean(this.message?.permissions.canManage && this.message.actions.includes('update'));
			},
			scheduledAt() {
				return this.message ? scheduledAtText(this.message) : '';
			},
			errorReason() {
				return this.message?.status === 'error' ? this.message.errorReason ?? '' : '';
			},
			senderChips() {
				return this.message ? chipsOf([this.message.sender], 'mail-scheduled-view-chip-from', senderText) : [];
			},
			toChips() {
				return chipsOf(this.message?.recipients.to ?? [], 'mail-scheduled-view-chip-to', recipientText);
			},
			ccChips() {
				return chipsOf(this.message?.recipients.cc ?? [], 'mail-scheduled-view-chip-cc', recipientText);
			},
			hasCc() {
				return this.ccChips.length > 0;
			},
			bodyDocument() {
				return '<!DOCTYPE html><html lang=""><head>' + `<meta http-equiv="Content-Security-Policy" content="${BodyContentSecurityPolicy}">` + `<style>${BodyStyle}</style>` + `</head><body>${this.message?.body ?? ''}</body></html>`;
			}
		},
		methods: {
			loc(code, replacements = {}) {
				return main_core.Loc.getMessage(code, replacements) ?? '';
			}
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
	`
	});
	class ScheduledViewApplication {
		#options;
		constructor(options) {
			this.#options = options;
		}
		start() {
			const container = document.getElementById(this.#options.containerId);
			if (!container) {
				return;
			}
			const state = ui_vue3.reactive({
				loading: true,
				pending: false,
				error: false,
				actionError: '',
				message: null,
				edit: () => {
					if (this.#options.navigate) {
						this.#options.navigate(this.#options.editPath);
						return;
					}
					openEditSidePanel(this.#options.editPath, this.#options.editWidth);
				},
				cancel: async () => {
					if (!state.message || state.pending) {
						return;
					}
					const {
						id,
						revision
					} = state.message;
					state.pending = true;
					state.actionError = '';
					try {
						await (this.#options.api ?? mail_client_scheduledMessage.scheduledMessageApi).cancel({
							id,
							revision
						});
						this.#finishCancel(id);
					} catch (error) {
						state.actionError = cancelErrorText(error);
						if (errorCodeOf(error) === mail_client_scheduledMessage.ScheduledMessageErrorCode.RevisionConflict) {
							state.message = await this.#read().catch(() => state.message);
						}
					} finally {
						state.pending = false;
					}
				}
			});
			const load = () => {
				state.loading = true;
				return this.#read().then(message => {
					state.message = message;
					state.error = false;
					state.actionError = '';
				}).catch(() => {
					state.error = true;
				}).finally(() => {
					state.loading = false;
				});
			};
			ui_vue3.BitrixVue.createApp(ScheduledView, {
				state
			}).mount(container);
			void load();
			main_core_events.EventEmitter.subscribe(SliderMessageEvent, event => {
				const sliderEvent = event.getData()[0];
				if (sliderEvent.getEventId() === SliderMessage.Saved) {
					void load();
				}
			});
		}
		#finishCancel(messageId) {
			(this.#options.notifyCancelled ?? notifyCancelledToOpener)(messageId);
			(this.#options.closeCard ?? closeOwnSlider)();
		}
		#read() {
			return (this.#options.api ?? mail_client_scheduledMessage.scheduledMessageApi).get({
				id: this.#options.messageId
			}).then(message => {
				if (message.mailboxId !== this.#options.mailboxId) {
					throw new Error('Scheduled message mailbox mismatch.');
				}
				return message;
			});
		}
	}
	function senderText(contact) {
		return main_core.Type.isStringFilled(contact.name) ? `${contact.name} (${contact.email})` : contact.email;
	}
	function recipientText(contact) {
		return main_core.Type.isStringFilled(contact.name) ? contact.name : contact.email;
	}
	function notifyCancelledToOpener(messageId) {
		main_sidepanel.SidePanel.Instance.postMessage(window, SliderMessage.Cancelled, {
			id: messageId
		});
	}
	function closeOwnSlider() {
		main_sidepanel.SidePanel.Instance.getSliderByWindow(window)?.close();
	}
	function openEditSidePanel(path, width) {
		main_sidepanel.SidePanel.Instance.open(path, {
			width,
			cacheable: false
		});
	}

	exports.ScheduledView = ScheduledView;
	exports.ScheduledViewApplication = ScheduledViewApplication;

})(this.BX.Mail.Client = this.BX.Mail.Client || {}, BX, BX.Event, BX.SidePanel, BX.UI.IconSet, window, window, BX.UI.System.Alert.Vue, BX.UI.System.Alert, BX.UI.System.Typography.Vue, BX.Vue3.Components, BX.Vue3, BX.Mail.Client.ScheduledMessage, BX.UI.System.Chip.Vue);
//# sourceMappingURL=scheduled-view.bundle.js.map
