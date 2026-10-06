/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, im_public, rest_client, main_core, call_lib_callManager, call_core, calendar_compacteventformLauncher, calendar_sharing_interface, call_lib_analytics, call_adapter_logger, call_adapter_clipboard, ui_bannerDispatcher, call_component_elements, ui_vue3_components_button) {
	'use strict';

	const VALID_SIZES = ['large', 'medium', 'small'];
	const VALID_ACTION_TYPES = ['start-call', 'join-meeting', 'schedule-meeting', 'call-with-me', 'free-slots'];
	const VALID_ICONS = VALID_ACTION_TYPES;

	// @vue/component
	const SyncPageBlock = {
		name: 'SyncPageBlock',
		props: {
			size: {
				type: String,
				required: true,
				validator: value => VALID_SIZES.includes(value)
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
				type: String
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

	const SYNC_PROMO_ID = 'call:sync-promo-popup:05052026:all';

	// give the banner dispatcher a pause before it shows the next queued banner
	const PROMO_QUEUE_RELEASE_DELAY_MS = 1000;
	class SyncPageService {
		#actionMap;
		#isStarting = false;
		#promoOnDone = null;
		#promoViewedSent = false;
		#promoQueued = false;
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
		#handleJoinMeeting() {
			// the component opens the join popup itself (local UI state); the service only reports analytics
			call_lib_analytics.Analytics.getInstance().sync.onJoinClick();
		}
		#handleScheduleMeeting() {
			call_lib_analytics.Analytics.getInstance().sync.onCreateEventClick();
			if (!calendar_compacteventformLauncher.CompactFormLauncher) {
				call_adapter_logger.Logger.error('SyncPage: CompactFormLauncher is not available');
				return;
			}
			const form = new calendar_compacteventformLauncher.CompactFormLauncher();
			void form.showNewEventForm({
				eventType: '#call_sync#'
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
			try {
				const userSharing = await calendar_sharing_interface.UserSharingController.getUserSharing(userId);
				userSharing.openDialog();
			} catch (error) {
				call_adapter_logger.Logger.warn('SyncPage: failed to open free slots dialog', error);
			}
		}
		async initPromo(showCallback) {
			if (this.#promoQueued) {
				return;
			}
			const isActive = await this.#isPromoActive();
			if (!isActive) {
				return;
			}
			this.#promoQueued = true;
			ui_bannerDispatcher.BannerDispatcher.high.toQueue(onDone => {
				this.#promoOnDone = onDone;
				showCallback();
			});
		}
		closePromo() {
			// the popup emits 'close' twice on button close (component + container unmount):
			// mark the promo as viewed only once per show
			if (!this.#promoViewedSent) {
				this.#promoViewedSent = true;
				void this.#markPromoViewed();
			}
			if (this.#promoOnDone) {
				const onDone = this.#promoOnDone;
				this.#promoOnDone = null;
				setTimeout(onDone, PROMO_QUEUE_RELEASE_DELAY_MS);
			}
		}
		async #isPromoActive() {
			try {
				const response = await main_core.ajax.runAction('im.v2.Promotion.listActive', {
					data: {
						type: 'web'
					}
				});
				const list = response?.data ?? [];
				return list.some(promo => promo?.id === SYNC_PROMO_ID);
			} catch (error) {
				call_adapter_logger.Logger.error('SyncPage: failed to check promo status', error);
				return false;
			}
		}
		#markPromoViewed() {
			return main_core.ajax.runAction('im.v2.Promotion.read', {
				data: {
					id: SYNC_PROMO_ID
				}
			}).catch(error => {
				call_adapter_logger.Logger.error('SyncPage: failed to mark promo as viewed', error);
			});
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

	const POPUP_ID$1 = 'call-join-meeting-popup';
	const POPUP_CONFIG$1 = {
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
			CallPopupContainer: call_component_elements.CallPopupContainer
		},
		emits: ['close', 'join'],
		setup() {
			return {
				popupId: POPUP_ID$1,
				popupConfig: POPUP_CONFIG$1
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

	const ILLUSTRATION_BASE_PATH = '/bitrix/js/call/component/sync-page/src/components/sync-promo-popup';
	const PROMO_FEATURES = [{
		id: 'guest',
		titleCode: 'CALL_SYNC_PROMO_POPUP_FEATURE_GUEST_TITLE',
		descCode: 'CALL_SYNC_PROMO_POPUP_FEATURE_GUEST_DESC'
	}, {
		id: 'schedule',
		titleCode: 'CALL_SYNC_PROMO_POPUP_FEATURE_SCHEDULE_TITLE',
		descCode: 'CALL_SYNC_PROMO_POPUP_FEATURE_SCHEDULE_DESC'
	}, {
		id: 'link',
		titleCode: 'CALL_SYNC_PROMO_POPUP_FEATURE_LINK_TITLE',
		descCode: 'CALL_SYNC_PROMO_POPUP_FEATURE_LINK_DESC'
	}];
	const PROMO_BADGES = [{
		id: 'guest-access',
		locCode: 'CALL_SYNC_PROMO_POPUP_BADGE_GUEST_ACCESS'
	}, {
		id: 'no-registration',
		locCode: 'CALL_SYNC_PROMO_POPUP_BADGE_NO_REGISTRATION'
	}, {
		id: 'meeting-chat',
		locCode: 'CALL_SYNC_PROMO_POPUP_BADGE_MEETING_CHAT'
	}, {
		id: 'cloud-record',
		locCode: 'CALL_SYNC_PROMO_POPUP_BADGE_CLOUD_RECORD'
	}];
	const POPUP_ID = 'call-sync-promo-popup';

	// width is intentionally not set: main.popup forces inline overflow-x on the content
	// container for fixed-width popups, which would clip the mascot panel sticking out
	const POPUP_CONFIG = {
		padding: 0,
		overlay: true,
		autoHide: true,
		closeByEsc: true,
		closeIcon: true,
		focusTrap: true,
		ariaLabelledBy: 'call-sync-promo-popup-title',
		contentBorderRadius: '32px',
		angle: false,
		className: 'call-sync-promo-popup-wrapper'
	};

	// @vue/component
	const SyncPromoPopup = {
		name: 'SyncPromoPopup',
		components: {
			CallPopupContainer: call_component_elements.CallPopupContainer,
			UiButton: ui_vue3_components_button.Button
		},
		emits: ['close'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				features: PROMO_FEATURES,
				badges: PROMO_BADGES,
				illustrationVideoSrc: `${ILLUSTRATION_BASE_PATH}/videos/call-sync-page-promo-illustration.mp4`,
				illustrationPosterSrc: `${ILLUSTRATION_BASE_PATH}/images/call-sync-page-promo-illustration.webp`,
				popupId: POPUP_ID,
				popupConfig: POPUP_CONFIG
			};
		},
		mounted() {
			// WCAG 2.2.2: do not auto-play the looped decorative video for users with reduced motion
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
				this.$refs.illustrationVideo?.pause();
			}
		},
		methods: {
			onClose() {
				this.$emit('close');
			}
		},
		template: /* HTML */`
		<CallPopupContainer :config="popupConfig" :id="popupId" @close="onClose">
			<div class="call-sync-promo-popup --ui-context-content-light" data-testid="sync-promo-popup">
				<div class="call-sync-promo-popup__content">
					<div id="call-sync-promo-popup-title" class="call-sync-promo-popup__title">
						{{ $Bitrix.Loc.getMessage('CALL_SYNC_PROMO_POPUP_TITLE') }}
					</div>
					<div class="call-sync-promo-popup__features">
						<div
							v-for="feature in features"
							:key="feature.id"
							class="call-sync-promo-popup__feature"
						>
							<div class="call-sync-promo-popup__feature-icon" :class="\`--\${feature.id}\`"></div>
							<div class="call-sync-promo-popup__feature-body">
								<div class="call-sync-promo-popup__feature-title">
									{{ $Bitrix.Loc.getMessage(feature.titleCode) }}
								</div>
								<div class="call-sync-promo-popup__feature-desc">
									{{ $Bitrix.Loc.getMessage(feature.descCode) }}
								</div>
							</div>
						</div>
					</div>
					<div class="call-sync-promo-popup__footer">
						<UiButton
							:text="$Bitrix.Loc.getMessage('CALL_SYNC_PROMO_POPUP_BUTTON_OK')"
							:style="AirButtonStyle.FILLED"
							:size="ButtonSize.EXTRA_LARGE"
							:dataset="{ autofocus: '', testid: 'sync-promo-popup-ok-button' }"
							@click="onClose"
						/>
					</div>
				</div>
				<div class="call-sync-promo-popup__illustration" aria-hidden="true">
					<div class="call-sync-promo-popup__illustration-panel">
						<video
							ref="illustrationVideo"
							class="call-sync-promo-popup__illustration-video"
							:src="illustrationVideoSrc"
							:poster="illustrationPosterSrc"
							autoplay
							loop
							muted
							playsinline
						></video>
					</div>
					<div
						v-for="badge in badges"
						:key="badge.id"
						class="call-sync-promo-popup__badge"
						:class="\`--\${badge.id}\`"
					>
						{{ $Bitrix.Loc.getMessage(badge.locCode) }}
					</div>
				</div>
			</div>
		</CallPopupContainer>
	`
	};

	// @vue/component
	const SyncPage = {
		name: 'SyncPage',
		components: {
			SyncPageBlock,
			JoinMeetingPopup,
			SyncPromoPopup
		},
		setup() {
			// non-reactive service instance, assigned in created()
			return {
				syncPageService: null
			};
		},
		data() {
			return {
				showJoinMeetingPopup: false,
				showPromoPopup: false
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
			void this.syncPageService.initPromo(() => {
				this.showPromoPopup = true;
			});
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
			onPromoPopupClose() {
				this.syncPageService.closePromo();
				this.showPromoPopup = false;
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
			<SyncPromoPopup
				v-if="showPromoPopup"
				@close="onPromoPopupClose"
			/>
		</div>
	`
	};

	exports.SyncPage = SyncPage;

})(this.BX.Call.Component = this.BX.Call.Component || {}, BX.Messenger.v2.Lib, BX, BX, BX.Call.Lib, BX.Call, BX.Calendar, BX.Calendar.Sharing, BX.Call.Lib, BX.Call.Adapter, BX.Call.Adapter, BX.UI, BX.Call.Component.Elements, BX.Vue3.Components);
//# sourceMappingURL=sync-page.bundle.js.map
