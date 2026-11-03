/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, im_public, rest_client, main_core, main_core_events, call_lib_callManager, call_core, calendar_compacteventformLauncher, calendar_sharing_interface, call_lib_analytics, call_adapter_logger, call_adapter_clipboard, call_legacy_component_elements, call_lib_syncTabBannerLauncher) {
	'use strict';

	const VALID_SIZES = new Set(['large', 'medium', 'small']);
	const VALID_ACTION_TYPES = ['start-call', 'join-meeting', 'schedule-meeting', 'call-with-me', 'free-slots'];
	const VALID_ICONS = VALID_ACTION_TYPES;

	// @vue/component
	const SyncPageBlock = {
		name: 'SyncPageBlock',
		props: {
			size: {
				type: String,
				required: true,
				validator: value => VALID_SIZES.has(value)
			},
			// block identifier emitted on click and routed in the service actionMap (required for every size)
			actionType: {
				type: String,
				required: true,
				validator: value => VALID_ACTION_TYPES.includes(value)
			},
			// visual icon, rendered only for medium/small sizes (large uses an illustration instead)
			icon: {
				type: String,
				default: '',
				validator: value => value === '' || VALID_ICONS.includes(value)
			},
			title: {
				type: String,
				required: true
			},
			description: {
				type: String,
				required: true
			},
			badge: {
				type: String,
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			},
			ctaLabel: {
				type: String,
				default: ''
			}
		},
		emits: ['click'],
		computed: {
			tabIndex() {
				return this.disabled ? -1 : 0;
			}
		},
		methods: {
			onClick() {
				if (this.disabled) {
					return;
				}
				this.$emit('click', this.actionType);
			}
		},
		template: /* HTML */`
		<div
			class="call-sync-page-block"
			:class="['--' + size, { '--disabled': disabled }]"
			role="button"
			:tabindex="tabIndex"
			:aria-disabled="disabled ? 'true' : null"
			:aria-label="title"
			:data-testid="'call-sync-page-block-' + actionType"
			@click="onClick"
			@keydown.enter="onClick"
			@keydown.space.prevent="onClick"
		>
			<div v-if="badge" class="call-sync-page-block__badge">{{ badge }}</div>
			<div v-if="size === 'large'" class="call-sync-page-block__content --large">
				<div class="call-sync-page-block__content-left">
					<div class="call-sync-page-block__illustration"></div>
				</div>
				<div class="call-sync-page-block__content-right">
					<div class="call-sync-page-block__title">{{ title }}</div>
					<div class="call-sync-page-block__description">{{ description }}</div>
					<div v-if="ctaLabel" class="call-sync-page-block__cta">{{ ctaLabel }}</div>
				</div>
			</div>
			<div v-else-if="size === 'medium'" class="call-sync-page-block__content --medium">
				<div class="call-sync-page-block__icon" :class="['--' + size, '--' + icon]"></div>
				<div class="call-sync-page-block__title">{{ title }}</div>
				<div class="call-sync-page-block__description">{{ description }}</div>
			</div>
			<div v-else class="call-sync-page-block__content --small">
				<div class="call-sync-page-block__icon" :class="['--' + size, '--' + icon]"></div>
				<div class="call-sync-page-block__title">{{ title }}</div>
			</div>
		</div>
	`
	};

	// CompactEventForm sets this namespace and emits 'onClose' when it is really closed
	const COMPACT_FORM_CLOSE_EVENT = 'BX.Calendar.CompactEventForm:onClose';
	class SyncPageService {
		#actionMap;
		#isStarting = false;
		#isOpeningMeetingForm = false;
		#isOpeningFreeSlots = false;
		#meetingFormLauncher = null;
		#meetingFormCloseSubscribed = false;
		constructor() {
			this.#actionMap = {
				'start-call': () => this.#handleStartCall(),
				'join-meeting': () => this.#handleJoinMeeting(),
				'schedule-meeting': () => this.#handleScheduleMeeting(),
				'free-slots': () => this.#handleFreeSlots()
			};
		}
		handleBlockAction(blockType) {
			// blockType comes from the page's own controlled action types, so an unknown value
			// cannot reach production — silent no-op, no log noise
			this.#actionMap[blockType]?.();
		}
		async #handleStartCall() {
			call_lib_analytics.Analytics.getInstance().sync.onStartCallClick();
			if (this.#isStarting) {
				return;
			}
			this.#isStarting = true;
			try {
				const restClient = new rest_client.RestClient();
				// Fire the request once; the same response promise feeds both the clipboard copy
				// and the call flow, so the chat is created only once.
				const responsePromise = restClient.callMethod('call.Call.createChatForCall', {});

				// Start copying synchronously, before any await: Safari only allows a clipboard
				// write while the click's user activation is alive, and that activation is lost
				// after the first awaited network round-trip. The guest link is handed over as a
				// promise so the write begins now and resolves once the response arrives.
				const copyResultPromise = this.#copyGuestLink(responsePromise.then(response => response.data().guestLink));
				const response = await responsePromise;
				const {
					dialogId,
					token: callToken
				} = response.data();
				if (!main_core.Type.isStringFilled(dialogId) || !/^chat\d+$/.test(dialogId)) {
					this.#notifyStartCallError();
					return;
				}
				await im_public.Messenger.openChat(dialogId);
				const callManager = call_lib_callManager.CallManager.getInstance();
				callManager.setNextCallOptions({
					invitePeriod: call_core.Util.getSyncCallInvitePeriod(),
					callToken
				});
				callManager.startCall(dialogId, true);

				// Report the copy result only after the call actually starts, so a copy failure
				// is not masked by an early "link copied" toast.
				this.#notifyGuestLinkCopyResult(await copyResultPromise);
			} catch (error) {
				call_adapter_logger.Logger.error('SyncPage: failed to start call', error);
				this.#notifyStartCallError();
			} finally {
				this.#isStarting = false;
			}
		}
		async #copyGuestLink(guestLinkPromise) {
			let hadLink = false;
			try {
				await call_adapter_clipboard.Clipboard.copyFromPromise(guestLinkPromise.then(guestLink => {
					hadLink = main_core.Type.isStringFilled(guestLink);
					if (!hadLink) {
						call_adapter_logger.Logger.warn('SyncPage: guest link is empty, skipping copy');
						throw new Error('SyncPage: guest link is empty');
					}
					return guestLink;
				}));
				return 'copied';
			} catch {
				// An empty link or a failed create-chat request is not a clipboard failure:
				// stay silent (the start-call error is surfaced by the caller). Only a genuine
				// clipboard rejection with a real link is reported as a copy error.
				return hadLink ? 'failed' : 'empty';
			}
		}
		#notifyGuestLinkCopyResult(result) {
			if (result === 'copied') {
				this.#notifyGuestLinkCopied();
				return;
			}
			if (result === 'failed') {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CALL_SYNC_PAGE_GUEST_LINK_COPY_ERROR'),
					autoHideDelay: 5000
				});
			}
		}
		#notifyGuestLinkCopied() {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('CALL_SYNC_PAGE_GUEST_LINK_COPIED'),
				autoHideDelay: 5000,
				useAirDesign: true
			});
		}
		#notifyStartCallError() {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('CALL_SYNC_PAGE_START_CALL_ERROR'),
				autoHideDelay: 5000
			});
		}
		#notifyScheduleMeetingError() {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('CALL_SYNC_PAGE_SCHEDULE_MEETING_ERROR'),
				autoHideDelay: 5000
			});
		}
		#notifyFreeSlotsError() {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('CALL_SYNC_PAGE_FREE_SLOTS_ERROR'),
				autoHideDelay: 5000
			});
		}
		#handleJoinMeeting() {
			// the component opens the join popup itself (local UI state); the service only reports analytics
			call_lib_analytics.Analytics.getInstance().sync.onJoinClick();
		}
		async #handleScheduleMeeting() {
			call_lib_analytics.Analytics.getInstance().sync.onCreateEventClick();
			if (!calendar_compacteventformLauncher.CompactFormLauncher) {
				call_adapter_logger.Logger.error('SyncPage: CompactFormLauncher is not available');
				return;
			}

			// the guard is held until the form is actually closed, not just until it opens:
			// re-showing the reused launcher would destroy the open form's unsaved input,
			// bypassing its own "discard changes?" confirmation
			if (this.#isOpeningMeetingForm) {
				return;
			}
			this.#isOpeningMeetingForm = true;
			this.#subscribeMeetingFormClose();
			try {
				// a single launcher reuses its own form, so a repeated show replaces the popup
				// instead of stacking an independent one
				this.#meetingFormLauncher ??= new calendar_compacteventformLauncher.CompactFormLauncher();
				await this.#meetingFormLauncher.showNewEventForm({
					eventType: '#call_sync#'
				});

				// the form stays open now; the guard is released by the form's close event
			} catch (error) {
				call_adapter_logger.Logger.error('SyncPage: failed to open schedule meeting form', error);
				this.#notifyScheduleMeetingError();
				// the form never opened, so no close event will arrive to release the guard
				this.#isOpeningMeetingForm = false;
			}
		}
		#subscribeMeetingFormClose() {
			if (this.#meetingFormCloseSubscribed) {
				return;
			}
			this.#meetingFormCloseSubscribed = true;
			main_core_events.EventEmitter.subscribe(COMPACT_FORM_CLOSE_EVENT, () => {
				this.#isOpeningMeetingForm = false;
			});
		}
		async #handleFreeSlots() {
			call_lib_analytics.Analytics.getInstance().sync.onOpenSlotsClick();
			if (!calendar_sharing_interface.UserSharingController) {
				call_adapter_logger.Logger.error('SyncPage: UserSharingController is not available');
				return;
			}
			const userId = Number(main_core.Loc.getMessage('USER_ID'));
			if (!Number.isInteger(userId) || userId <= 0) {
				call_adapter_logger.Logger.warn('SyncPage: USER_ID is not a valid positive integer', userId);
				return;
			}
			if (this.#isOpeningFreeSlots) {
				return;
			}
			this.#isOpeningFreeSlots = true;
			try {
				const userSharing = await calendar_sharing_interface.UserSharingController.getUserSharing(userId);
				userSharing.openDialog();
			} catch (error) {
				call_adapter_logger.Logger.warn('SyncPage: failed to open free slots dialog', error);
				this.#notifyFreeSlotsError();
			} finally {
				this.#isOpeningFreeSlots = false;
			}
		}
	}

	// Guest call link formats (see Bitrix\Im\V2\SharingLink\GuestChatLink):
	// deeplink https://{b24.to|bitrix24.net}/gi/{portalId}-{code} or fallback {publicDomain}/guest/{code}
	const GUEST_LINK_DEEPLINK_HOSTS = new Set(['b24.to', 'bitrix24.net']);
	const GUEST_LINK_DEEPLINK_PATH = '/gi/';
	const GUEST_LINK_FALLBACK_PATH = '/guest/';

	/**
	 * Validates that a value is a guest call link and not an arbitrary external URL.
	 * Used both to gate the join button (UX) and right before window.open (security guard).
	 *
	 * @param {string} value
	 * @returns {boolean}
	 */
	const isGuestCallLink = value => {
		try {
			const url = new URL(value);
			if (url.protocol !== 'http:' && url.protocol !== 'https:') {
				return false;
			}
			if (GUEST_LINK_DEEPLINK_HOSTS.has(url.hostname) && url.pathname.startsWith(GUEST_LINK_DEEPLINK_PATH)) {
				return true;
			}

			// Fallback links live on the current portal's public domain ({publicDomain}/guest/{code});
			// restrict the host to the current origin so an arbitrary external /guest/ URL cannot be opened
			return url.hostname === window.location.hostname && url.pathname.startsWith(GUEST_LINK_FALLBACK_PATH);
		} catch (error) {
			return false;
		}
	};

	const POPUP_ID = 'call-join-meeting-popup';
	const POPUP_CONFIG = {
		width: 420,
		padding: 0,
		overlay: true,
		autoHide: true,
		closeByEsc: true,
		closeIcon: true,
		contentBorderRadius: '18px',
		angle: false
	};

	// @vue/component
	const JoinMeetingPopup = {
		name: 'JoinMeetingPopup',
		components: {
			CallPopupContainer: call_legacy_component_elements.CallPopupContainer
		},
		emits: ['close', 'join'],
		setup() {
			return {
				popupId: POPUP_ID,
				popupConfig: POPUP_CONFIG
			};
		},
		data() {
			return {
				meetingInput: ''
			};
		},
		computed: {
			isJoinDisabled() {
				return !isGuestCallLink(this.meetingInput);
			}
		},
		methods: {
			onJoinClick() {
				if (this.isJoinDisabled) {
					return;
				}
				this.$emit('join', this.meetingInput);
			},
			onClose() {
				this.$emit('close');
			}
		},
		template: /* HTML */`
		<CallPopupContainer :config="popupConfig" :id="popupId" @close="onClose">
			<div class="call-sync-page__join-popup_container">
				<div class="call-sync-page__join-popup_title">
					{{ $Bitrix.Loc.getMessage('CALL_SYNC_PAGE_JOIN_POPUP_TITLE') }}
				</div>
				<input
					class="call-sync-page__join-popup_input"
					v-model.trim="meetingInput"
					:aria-label="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_JOIN_POPUP_INPUT_PLACEHOLDER')"
					:placeholder="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_JOIN_POPUP_INPUT_PLACEHOLDER')"
					@keydown.enter="onJoinClick"
				/>
				<button
					type="button"
					class="call-sync-page__join-popup_button"
					:class="{'--disabled': isJoinDisabled}"
					:disabled="isJoinDisabled"
					@click="onJoinClick"
				>
					{{ $Bitrix.Loc.getMessage('CALL_SYNC_PAGE_JOIN_POPUP_BUTTON') }}
				</button>
			</div>
		</CallPopupContainer>
	`
	};

	// @vue/component
	const SyncPage = {
		name: 'SyncPage',
		components: {
			SyncPageBlock,
			JoinMeetingPopup
		},
		setup() {
			// non-reactive service instance, assigned in created()
			return {
				syncPageService: null
			};
		},
		data() {
			return {
				showJoinMeetingPopup: false
			};
		},
		computed: {
			scheduleMeetingDesc() {
				return this.$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_SCHEDULE_MEETING_DESC', {
					'#BR#': '\n'
				});
			},
			joinMeetingDesc() {
				return this.$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_JOIN_MEETING_DESC', {
					'#BR#': '\n'
				});
			}
		},
		created() {
			this.syncPageService = new SyncPageService();
		},
		mounted() {
			call_lib_analytics.Analytics.getInstance().sync.onOpenSection();
			// The page has no messenger, so the launcher gets no lifecycle event here and has to be
			// started by hand. The promo stays one per user: the view mark lives on the server and
			// knows nothing about surfaces, so a banner already seen in chats will not come up again.
			call_lib_syncTabBannerLauncher.SyncTabBannerLauncher.startOnSyncPage();
		},
		beforeUnmount() {
			call_lib_syncTabBannerLauncher.SyncTabBannerLauncher.cancel();
		},
		methods: {
			onBlockClick(blockType) {
				// opening the join popup is local UI state, so the component owns it;
				// the service only routes analytics and side-effect actions
				if (blockType === 'join-meeting') {
					this.showJoinMeetingPopup = true;
				}
				this.syncPageService.handleBlockAction(blockType);
			},
			onJoinMeetingPopupClose() {
				this.showJoinMeetingPopup = false;
			},
			onJoinMeeting(meetingInput) {
				// security guard at the sink: never open an arbitrary URL even if the emitter changes
				if (!isGuestCallLink(meetingInput)) {
					return;
				}
				call_lib_analytics.Analytics.getInstance().sync.onJoinCall();
				this.showJoinMeetingPopup = false;
				window.open(meetingInput, '_blank', 'noopener,noreferrer');
			}
		},
		template: /* HTML */`
		<div class="call-sync-page">
			<div class="call-sync-page__container">
				<div class="call-sync-page__row">
					<SyncPageBlock
						size="large"
						action-type="start-call"
						:title="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_START_CALL_TITLE')"
						:description="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_START_CALL_DESC')"
						:cta-label="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_START_CALL_BUTTON')"
						@click="onBlockClick"
					/>
				</div>
				<div class="call-sync-page__row">
					<SyncPageBlock
						size="medium"
						action-type="schedule-meeting"
						icon="schedule-meeting"
						:title="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_SCHEDULE_MEETING_TITLE')"
						:description="scheduleMeetingDesc"
						@click="onBlockClick"
					/>
					<SyncPageBlock
						size="medium"
						action-type="join-meeting"
						icon="join-meeting"
						:title="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_JOIN_MEETING_TITLE')"
						:description="joinMeetingDesc"
						@click="onBlockClick"
					/>
				</div>
				<div class="call-sync-page__row">
					<SyncPageBlock
						size="small"
						action-type="free-slots"
						icon="free-slots"
						:title="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_FREE_SLOTS_TITLE')"
						:description="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_FREE_SLOTS_DESC')"
						@click="onBlockClick"
					/>
					<SyncPageBlock
						size="small"
						action-type="call-with-me"
						icon="call-with-me"
						:title="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_CALL_WITH_ME_TITLE')"
						:description="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_CALL_WITH_ME_DESC')"
						:badge="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_BADGE_SOON')"
						:disabled="true"
						@click="onBlockClick"
					/>
				</div>
			</div>
			<JoinMeetingPopup
				v-if="showJoinMeetingPopup"
				@close="onJoinMeetingPopupClose"
				@join="onJoinMeeting"
			/>
		</div>
	`
	};

	exports.SyncPage = SyncPage;

})(this.BX.Call.Component = this.BX.Call.Component || {}, BX.Messenger.v2.Lib, BX, BX, BX.Event, BX.Call.Lib, BX.Call, BX.Calendar, BX.Calendar.Sharing, BX.Call.Lib, BX.Call.Adapter, BX.Call.Adapter, BX.Call.Legacy.Component.Elements, BX.Call.Lib);
//# sourceMappingURL=sync-page.bundle.js.map
