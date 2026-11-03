/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core, main_core_events, ui_vue3, ui_vue3_directives_hint, im_public, im_v2_const, im_v2_lib_localStorage, im_v2_lib_promo, im_v2_lib_feature, call_const, call_core, call_lib_analytics, call_lib_callManager, ui_infoHelper, ui_notification, ui_system_menu, im_v2_application_core, im_v2_lib_menu, im_v2_lib_permission, im_v2_lib_rest, call_legacy_component_elements) {
	'use strict';

	const MenuSectionCode = Object.freeze({
		main: 'main',
		phone: 'phone'
	});
	const EXTENSION_NAME = 'call.widget.call-button';
	const SYNC_CALL_STARTER = 'BX.SyncConnector.startCall';
	class CallMenu extends im_v2_lib_menu.BaseMenu {
		static events = {
			...im_v2_lib_menu.BaseMenu.events,
			onMenuItemClick: 'onMenuItemClick'
		};
		constructor() {
			super();
			this.id = 'bx-im-chat-header-call-menu';
		}
		getMenuOptions() {
			return {
				...super.getMenuOptions(),
				className: this.getMenuClassName(),
				angle: true,
				offsetLeft: 4,
				offsetTop: 5
			};
		}
		getMenuClassName() {
			return 'bx-im-messenger__scope bx-call-chat-header-call-button__scope';
		}
		getMenuItems() {
			return [...this.groupItems([this.#getVideoCallItem(), this.#getAudioCallItem(), this.#getSyncCallItem(), this.#getZoomItem()], MenuSectionCode.main), ...this.groupItems([this.#getPersonalPhoneItem(), this.#getWorkPhoneItem(), this.#getInnerPhoneItem()], MenuSectionCode.phone)];
		}
		getMenuGroups() {
			return [{
				code: MenuSectionCode.main
			}, {
				code: MenuSectionCode.phone
			}];
		}
		#getVideoCallItem() {
			const isAvailable = this.#isCallAvailable(this.context.dialogId);
			return {
				title: main_core.Loc.getMessage('CALL_CONTENT_CHAT_HEADER_VIDEOCALL') ?? '',
				design: isAvailable ? ui_system_menu.MenuItemDesign.Default : ui_system_menu.MenuItemDesign.Disabled,
				onClick: () => {
					if (!isAvailable) {
						return;
					}
					this.#analyticsOnStartCallClick(call_const.CallTypes.video.id);
					call_const.CallTypes.video.start(this.context.dialogId);
					this.emit(CallMenu.events.onMenuItemClick, call_const.CallTypes.video);
					this.menuInstance.close();
				}
			};
		}
		#getAudioCallItem() {
			const isAvailable = this.#isCallAvailable(this.context.dialogId);
			return {
				title: main_core.Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_AUDIO') ?? '',
				design: isAvailable ? ui_system_menu.MenuItemDesign.Default : ui_system_menu.MenuItemDesign.Disabled,
				onClick: () => {
					if (!isAvailable) {
						return;
					}
					this.#analyticsOnStartCallClick(call_const.CallTypes.audio.id);
					call_const.CallTypes.audio.start(this.context.dialogId);
					this.emit(CallMenu.events.onMenuItemClick, call_const.CallTypes.audio);
					this.menuInstance.close();
				}
			};
		}
		#getSyncCallItem() {
			if (!this.#isSyncCallEnabled()) {
				return null;
			}
			const startCall = this.#getSyncCallStarter();
			if (startCall === null) {
				return null;
			}
			const isAvailable = this.#isCallAvailable(this.context.dialogId);
			const target = this.#getSyncCallTarget();
			return {
				title: main_core.Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_SYNC') ?? '',
				design: isAvailable ? ui_system_menu.MenuItemDesign.Default : ui_system_menu.MenuItemDesign.Disabled,
				onClick: () => {
					if (!isAvailable) {
						return;
					}
					void startCall(target).catch(error => {
						if (error?.reasonSentToTab === true) {
							return;
						}
						ui_notification.Center.notify({
							content: main_core.Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_SYNC_START_ERROR') ?? ''
						});
					});
					this.menuInstance.close();
				}
			};
		}
		#isSyncCallEnabled() {
			return main_core.Extension.getSettings(EXTENSION_NAME).get('syncCallEnabled', false) === true;
		}
		#getSyncCallStarter() {
			const starter = main_core.Reflection.getClass(SYNC_CALL_STARTER);
			return main_core.Type.isFunction(starter) ? starter : null;
		}
		#getSyncCallTarget() {
			if (this.#isUser()) {
				return {
					type: 'user',
					userId: this.context.dialogId
				};
			}
			return {
				type: 'chat',
				chatId: this.context.chatId
			};
		}
		#analyticsOnStartCallClick(callType) {
			call_lib_analytics.Analytics.getInstance().onContextMenuStartCallClick({
				context: this.context,
				callType
			});
		}
		#getPersonalPhoneItem() {
			const user = this.#getUser();
			if (!user) {
				return null;
			}
			const {
				phones
			} = user;
			if (!phones.personalMobile) {
				return null;
			}
			const title = main_core.Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_PERSONAL_PHONE') ?? '';
			return {
				title,
				subtitle: phones.personalMobile,
				onClick: () => {
					void im_public.Messenger.startPhoneCall(phones.personalMobile);
					this.menuInstance.close();
				}
			};
		}
		#getWorkPhoneItem() {
			const user = this.#getUser();
			if (!user) {
				return null;
			}
			const {
				phones
			} = user;
			if (!phones.workPhone) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_WORK_PHONE') ?? '',
				subtitle: phones.workPhone,
				onClick: () => {
					void im_public.Messenger.startPhoneCall(phones.workPhone);
					this.menuInstance.close();
				}
			};
		}
		#getInnerPhoneItem() {
			const user = this.#getUser();
			if (!user) {
				return null;
			}
			const {
				phones
			} = user;
			if (!phones.innerPhone) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_INNER_PHONE_MSGVER_1') ?? '',
				subtitle: phones.innerPhone,
				onClick: () => {
					void im_public.Messenger.startPhoneCall(phones.innerPhone);
					this.menuInstance.close();
				}
			};
		}
		#getZoomItem() {
			const isActive = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.zoomActive);
			if (!isActive) {
				return null;
			}
			const isFeatureAvailable = im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.zoomAvailable);
			return {
				title: main_core.Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_ZOOM') ?? '',
				design: isFeatureAvailable ? ui_system_menu.MenuItemDesign.Default : ui_system_menu.MenuItemDesign.Disabled,
				onClick: () => {
					if (!isFeatureAvailable) {
						ui_infoHelper.InfoHelper.show('limit_video_conference_zoom');
						return;
					}
					this.#requestCreateZoomConference(this.context.dialogId);
					this.menuInstance.close();
				}
			};
		}
		#isCallAvailable(dialogId) {
			if (call_lib_callManager.CallManager.getInstance().hasActiveCurrentCall(dialogId)) {
				return true;
			}
			if (call_lib_callManager.CallManager.getInstance().hasActiveAnotherCall(dialogId)) {
				return false;
			}
			const chatCanBeCalled = call_lib_callManager.CallManager.getInstance().chatCanBeCalled(dialogId);
			const chatIsAllowedToCall = im_v2_lib_permission.PermissionManager.getInstance().canPerformActionByRole(im_v2_const.ActionByRole.call, dialogId);
			return chatCanBeCalled && chatIsAllowedToCall;
		}
		#getUser() {
			if (!this.#isUser()) {
				return null;
			}
			return im_v2_application_core.Core.getStore().getters['users/get'](this.context.dialogId);
		}
		#isUser() {
			return this.context.type === im_v2_const.ChatType.user;
		}
		#requestCreateZoomConference(dialogId) {
			im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2CallZoomCreate, {
				data: {
					dialogId
				}
			}).catch(errors => {
				let errorText = main_core.Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_ZOOM_CREATE_ERROR') ?? '';
				const notConnected = errors.some(error => error.code === 'ZOOM_CONNECTED_ERROR');
				if (notConnected) {
					const userProfileUri = `/company/personal/user/${im_v2_application_core.Core.getUserId()}/social_services/`;
					errorText = (main_core.Loc.getMessage('CALL_CONTENT_CHAT_HEADER_CALL_MENU_ZOOM_CONNECT_ERROR') ?? '').replace('#HREF_START#', `<a href=${userProfileUri}>`).replace('#HREF_END#', '</>');
				}
				ui_notification.Center.notify({
					content: errorText
				});
			});
		}
	}

	const CallButtonPromo = ui_vue3.defineComponent({
		name: 'CallButtonPromo',
		components: {
			CallPopupContainer: call_legacy_component_elements.CallPopupContainer
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		data() {
			return {
				isAIConsentAccepted: call_core.CallAI.agreementAccepted
			};
		},
		computed: {
			getId() {
				return 'call-ai-user-list-popup';
			},
			config() {
				return {
					width: 380,
					padding: 0,
					overlay: false,
					autoHide: false,
					closeByEsc: false,
					angle: {
						offset: main_core.Dom.getPosition(this.bindElement).width / 2,
						position: 'top'
					},
					closeIcon: true,
					bindElement: this.bindElement,
					offsetTop: 28
				};
			},
			callButtonPromoText() {
				return this.isAIConsentAccepted ? this.loc('CALL_CHAT_HEADER_BUTTON_PROMO_TEXT_MSGVER_1') : this.loc('CALL_CHAT_HEADER_BUTTON_PROMO_TEXT_WITHOUT_TOS_MSGVER_1');
			}
		},
		methods: {
			loc(phraseCode, replacements = {}) {
				return main_core.Loc.getMessage(phraseCode, replacements) ?? '';
			}
		},
		template: `
		<CallPopupContainer
			:config="config"
			@close="$emit('close')"
			:id="getId"
		>
			<div class='bx-call-chat-header-call-button__promo-container'>
				<div class='bx-call-chat-header-call-button__promo-title'>
					{{ loc('CALL_CHAT_HEADER_BUTTON_PROMO_TITLE_MSGVER_1') }}
				</div>
				<div class='bx-call-chat-header-call-button__promo-text'>
					{{ callButtonPromoText }}
				</div>
			</div>
		</CallPopupContainer>
	`
	});

	const CallButtonTitle = ui_vue3.defineComponent({
		name: 'CallButtonTitle',
		props: {
			text: {
				type: String,
				required: true
			},
			compactMode: {
				type: Boolean,
				default: false
			},
			copilotMode: {
				type: Boolean,
				default: false
			},
			showIcon: {
				type: Boolean,
				default: true
			}
		},
		computed: {
			callButtonIconClasses() {
				return ['bx-call-chat-header-call-button__icon', ...(this.copilotMode ? ['--copilot'] : []), ...(this.compactMode ? ['--compact'] : [])];
			}
		},
		template: `
		<div v-if="showIcon || compactMode" :class="callButtonIconClasses"></div>
		<div v-if="!compactMode" class="bx-call-chat-header-call-button__text">
			{{ text }}
		</div>
	`
	});

	const RING_COUNT = 3;
	const PulseAnimation = ui_vue3.defineComponent({
		name: 'PulseAnimation',
		props: {
			showPulse: {
				type: Boolean,
				default: true
			},
			isConference: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			rings() {
				if (!this.showPulse) {
					return [];
				}
				return Array.from({
					length: RING_COUNT
				});
			}
		},
		template: `
		<div class="bx-call-pulse-animation__container">
			<slot />
			<div v-for="ring in rings" class="bx-call-pulse-animation__ring" :class="{'--conference': isConference}"></div>
		</div>
	`
	});

	const PROMO_SHOW_DELAY_MS = 20000;
	const CallButton = ui_vue3.defineComponent({
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		components: {
			CallButtonTitle,
			CallButtonPromo,
			PulseAnimation
		},
		props: {
			dialog: {
				type: Object,
				required: true
			},
			compactMode: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				lastCallType: '',
				isMenuOpen: false,
				copilotMinUserLimit: call_core.CallAI.recordingMinUsers,
				isCopilotActive: call_core.CallAI.serviceEnabled,
				isMarketSubscriptionActive: call_core.CallAI.marketSubscriptionEnabled,
				isTariffAvailable: call_core.CallAI.tariffAvailable,
				showPromo: false,
				showPromoTimer: null,
				promoId: 'call:copilot-call-button:29102024:all',
				callMenu: null
			};
		},
		computed: {
			dialogId() {
				return this.dialog.dialogId;
			},
			chatId() {
				return this.dialog.chatId;
			},
			userCount() {
				return this.dialog.userCounter;
			},
			isConference() {
				return this.dialog.type === im_v2_const.ChatType.videoconf;
			},
			callButtonText() {
				let locCode = call_const.CallTypes[this.lastCallType].locCode;
				if (this.hasActiveCurrentCall) {
					locCode = 'CALL_CHAT_HEADER_BUTTON_RETURN_TO_CALL_TEXT';
				}
				return this.loc(locCode);
			},
			hasActiveCurrentCall() {
				return call_lib_callManager.CallManager.getInstance().hasActiveCurrentCall(this.dialogId);
			},
			hasActiveAnotherCall() {
				return call_lib_callManager.CallManager.getInstance().hasActiveAnotherCall(this.dialogId);
			},
			isActive() {
				if (this.hasActiveCurrentCall) {
					return true;
				}
				if (this.hasActiveAnotherCall) {
					return false;
				}
				return call_lib_callManager.CallManager.getInstance().chatCanBeCalled(this.dialogId);
			},
			userLimit() {
				return call_lib_callManager.CallManager.getInstance().getCallUserLimit();
			},
			isChatUserLimitExceeded() {
				return call_lib_callManager.CallManager.getInstance().isChatUserLimitExceeded(this.dialogId);
			},
			shouldShowMenu() {
				return this.isActive;
			},
			limitHintText() {
				return this.loc('CALL_LIB_CALL_USER_LIMIT_EXCEEDED_TOOLTIP', {
					'#USER_LIMIT#': String(this.userLimit)
				});
			},
			limitHintId() {
				return `bx-call-chat-header-call-button-limit-hint-${this.chatId}`;
			},
			hintContent() {
				if (!this.isChatUserLimitExceeded) {
					return null;
				}
				return {
					text: this.limitHintText,
					popupOptions: {
						bindOptions: {
							position: 'bottom'
						},
						angle: {
							position: 'top'
						},
						targetContainer: document.body,
						offsetLeft: 63,
						offsetTop: 0
					}
				};
			},
			isCopilotCall() {
				return this.isCopilotActive && this.userCount >= this.copilotMinUserLimit && !this.isConference && this.isTariffAvailable && this.isMarketSubscriptionActive;
			},
			isAirDesignEnabled() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isAirDesignEnabled);
			},
			callButtonContainerClasses() {
				return ['--ui-context-content-light', 'bx-call-chat-header-call-button__scope', 'bx-call-chat-header-call-button__container', ...(this.isAirDesignEnabled ? ['--air'] : []), ...(this.isConference ? ['--conference'] : []), ...(this.isCopilotCall && !this.hasActiveCurrentCall ? ['--copilot'] : []), ...(this.isActive ? [] : ['--disabled']), ...(this.hasActiveCurrentCall ? ['--return'] : [])];
			},
			canShowPromo() {
				return this.isCopilotCall && im_v2_lib_promo.PromoManager.getInstance().needToShow(this.promoId) && !this.hasActiveCurrentCall && this.isActive;
			}
		},
		watch: {
			hasActiveCurrentCall(isActive) {
				if (!isActive) {
					return;
				}
				if (this.isMenuOpen) {
					this.getCallMenu().close();
				}
			}
		},
		created() {
			this.lastCallType = this.getLastCallChoice();
			this.subscribeToMenuEvents();
			main_core_events.EventEmitter.subscribe('BX.Call.View:onShow', this.onShowCallView);
		},
		mounted() {
			this.showPromoTimer = setTimeout(() => {
				this.showPromo = this.canShowPromo;
			}, PROMO_SHOW_DELAY_MS);
		},
		beforeUnmount() {
			this.clearShowPromoTimer();
			this.showPromo = false;
			main_core_events.EventEmitter.unsubscribe('BX.Call.View:onShow', this.onShowCallView);
		},
		methods: {
			startVideoCall() {
				if (!this.isActive) {
					return;
				}
				void im_public.Messenger.startVideoCall(this.dialogId);
			},
			subscribeToMenuEvents() {
				const menu = this.getCallMenu();
				menu.subscribe(CallMenu.events.onMenuItemClick, event => {
					const {
						id: callTypeId
					} = event.getData();
					this.saveLastCallChoice(callTypeId);
				});
				menu.subscribe(CallMenu.events.close, () => {
					this.isMenuOpen = false;
				});
			},
			onShowCallView() {
				this.onClosePromo();
			},
			onButtonClick() {
				if (!this.isActive) {
					return;
				}
				if (this.isCopilotCall) {
					this.onClosePromo();
				}
				call_lib_analytics.Analytics.getInstance().onChatHeaderStartCallClick({
					dialog: this.dialog,
					callType: this.lastCallType
				});
				call_const.CallTypes[this.lastCallType].start(this.dialogId);
			},
			onMenuClick() {
				if (!this.shouldShowMenu) {
					return;
				}
				this.getCallMenu().openMenu(this.dialog, this.$refs.menu);
				this.isMenuOpen = true;
			},
			onStartConferenceClick() {
				if (!this.isActive) {
					return;
				}
				if (this.isCopilotCall) {
					this.onClosePromo();
				}
				call_lib_analytics.Analytics.getInstance().onStartConferenceClick({
					chatId: String(this.chatId)
				});
				void im_public.Messenger.openConference({
					code: this.dialog.public.code
				});
			},
			getLastCallChoice() {
				return im_v2_lib_localStorage.LocalStorageManager.getInstance().get(im_v2_const.LocalStorageKey.lastCallType, call_const.CallTypes.video.id);
			},
			saveLastCallChoice(callTypeId) {
				this.lastCallType = callTypeId;
				im_v2_lib_localStorage.LocalStorageManager.getInstance().set(im_v2_const.LocalStorageKey.lastCallType, callTypeId);
			},
			getCallMenu() {
				if (!this.callMenu) {
					this.callMenu = ui_vue3.markRaw(new CallMenu());
				}
				return this.callMenu;
			},
			loc(phraseCode, replacements = {}) {
				return main_core.Loc.getMessage(phraseCode, replacements) ?? '';
			},
			onClosePromo() {
				this.clearShowPromoTimer();
				this.showPromo = false;
				void im_v2_lib_promo.PromoManager.getInstance().markAsWatched(this.promoId);
			},
			clearShowPromoTimer() {
				clearTimeout(this.showPromoTimer ?? undefined);
				this.showPromoTimer = null;
			}
		},
		template: `
		<PulseAnimation :showPulse="showPromo" :isConference="isConference">
			<div
				v-if="isConference"
				:class="callButtonContainerClasses"
				ref="call-button"
				data-testid="im-call-header-call-btn"
			>
				<button
					type="button"
					tabindex="0"
					class="bx-call-chat-header-call-button__action"
					data-testid="im-call-header-call-btn-conference"
					:aria-label="loc('IM_CONTENT_CHAT_HEADER_START_CONFERENCE')"
					:aria-disabled="isActive ? null : 'true'"
					@click="onStartConferenceClick"
				>
					<CallButtonTitle :compactMode="compactMode" :copilotMode="isCopilotCall" :text="loc('IM_CONTENT_CHAT_HEADER_START_CONFERENCE')" />
				</button>
			</div>
			<div
				v-else
				:class="callButtonContainerClasses"
				ref="call-button"
				data-testid="im-call-header-call-btn"
			>
				<button
					type="button"
					tabindex="0"
					class="bx-call-chat-header-call-button__action"
					data-testid="im-call-header-call-btn-action"
					:aria-label="callButtonText"
					:aria-disabled="isActive ? null : 'true'"
					:aria-describedby="isChatUserLimitExceeded ? limitHintId : null"
					v-hint="hintContent"
					@click="onButtonClick"
					ref="action"
				>
					<CallButtonTitle :showIcon="!hasActiveCurrentCall" :compactMode="compactMode" :copilotMode="isCopilotCall" :text="callButtonText" />
				</button>
				<div v-if="!hasActiveCurrentCall" class="bx-call-chat-header-call-button__separator"></div>
				<button
					v-if="!hasActiveCurrentCall"
					type="button"
					tabindex="0"
					class="bx-call-chat-header-call-button__chevron_button"
					data-testid="im-call-header-call-btn-chevron"
					:aria-label="loc('CALL_CONTENT_CHAT_HEADER_CALL_TYPE_MENU_ARIA')"
					:aria-disabled="isActive ? null : 'true'"
					aria-haspopup="menu"
					:aria-expanded="isMenuOpen"
					@click.stop="onMenuClick"
					ref="menu"
				>
					<span class="bx-call-chat-header-call-button__chevron" aria-hidden="true"></span>
				</button>
				<span
					v-if="isChatUserLimitExceeded"
					:id="limitHintId"
					class="bx-call-chat-header-call-button__sr-only"
				>{{ limitHintText }}</span>
			</div>
			<CallButtonPromo
				v-if="showPromo"
				:bindElement="$refs['call-button']"
				@close="onClosePromo"
			/>
		</PulseAnimation>
	`
	});

	exports.CallButton = CallButton;

})(this.BX.Call.Widget = this.BX.Call.Widget || {}, BX, BX.Event, BX.Vue3, BX.Vue3.Directives, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Call.Const, BX.Call, BX.Call.Lib, BX.Call.Lib, BX.UI, BX.UI.Notification, BX.UI.System, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Call.Legacy.Component.Elements);
//# sourceMappingURL=call-button.bundle.js.map
