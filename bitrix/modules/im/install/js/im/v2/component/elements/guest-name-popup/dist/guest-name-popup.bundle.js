/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core_events, im_v2_component_elements_popup, im_v2_const, im_v2_lib_notifier, im_v2_lib_guest, im_v2_lib_logger, im_v2_lib_rest, im_v2_lib_user, main_core, ui_system_input_vue, ui_vue3_components_button, ui_vue3_components_richLoc, im_v2_component_elements_avatar, im_v2_component_elements_chatTitle) {
	'use strict';

	class GuestService {
		setName(name) {
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2GuestSetName, {
				data: {
					name
				}
			}).then(response => {
				void new im_v2_lib_user.UserManager().setUsersToModel(response.user);
				im_v2_lib_guest.GuestManager.getInstance().setGuestNamePopupState(false);
			}).catch(([error]) => {
				im_v2_lib_logger.Logger.error('GuestService: setName error', error);
				throw error;
			});
		}
	}

	// @vue/component
	const GuestNameContent = {
		name: 'GuestNameContent',
		components: {
			UiButton: ui_vue3_components_button.Button,
			ChatAvatar: im_v2_component_elements_avatar.ChatAvatar,
			ChatTitle: im_v2_component_elements_chatTitle.ChatTitle,
			BInput: ui_system_input_vue.BInput,
			RichLoc: ui_vue3_components_richLoc.RichLoc
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			isLoading: {
				type: Boolean,
				default: false
			}
		},
		emits: ['submit', 'close'],
		data() {
			return {
				name: ''
			};
		},
		computed: {
			ButtonColor: () => ui_vue3_components_button.ButtonColor,
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			AvatarSize: () => im_v2_component_elements_avatar.AvatarSize,
			InputDesign: () => ui_system_input_vue.InputDesign,
			chat() {
				return this.$store.getters['chats/get'](this.dialogId, true);
			},
			isSubmitDisabled() {
				return !main_core.Type.isStringFilled(this.name) || this.isLoading;
			},
			termsOfServiceUrl() {
				return im_v2_lib_guest.GuestManager.getInstance().getTermsOfServiceUrl();
			}
		},
		mounted() {
			// Temporary workaround until BInput's "active" prop is fixed
			void this.$nextTick(() => {
				const root = this.$refs.input?.$el;
				const nativeInput = root?.querySelector('input');
				nativeInput?.focus();
			});
		},
		methods: {
			onSubmit() {
				if (this.isSubmitDisabled) {
					return;
				}
				this.$emit('submit', this.name);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-guest-name-modal__container">
			<div class="bx-im-guest-name-modal__avatar-section">
				<ChatAvatar
					:avatarDialogId="dialogId"
					:size="AvatarSize.XXXL"
					:withTooltip="false"
				/>
			</div>
			<div class="bx-im-guest-name-modal__title">
				{{ loc('IM_ELEMENTS_GUEST_NAME_MODAL_TITLE') }}
			</div>
			<div class="bx-im-guest-name-modal__subtitle">
				<ChatTitle :dialogId="dialogId" />
			</div>
			<div class="bx-im-guest-name-modal__input-section">
				<BInput
					v-model.trim="name"
					ref="input"
					:design="InputDesign.LightGrey"
					:active="true"
					:placeholder="loc('IM_ELEMENTS_GUEST_NAME_MODAL_NAME_PLACEHOLDER')"
					@enter="onSubmit"
					@keydown.enter="onSubmit"
				/>
				<div class="bx-im-guest-name-modal__buttons">
					<UiButton
						:size="ButtonSize.LARGE"
						:color="ButtonColor.Primary"
						:disabled="isSubmitDisabled"
						:text="loc('IM_ELEMENTS_GUEST_NAME_MODAL_CONTINUE')"
						@click="onSubmit"
					/>
					<UiButton
						:size="ButtonSize.EXTRA_LARGE"
						:style="AirButtonStyle.PLAIN_ACCENT"
						:text="loc('IM_ELEMENTS_GUEST_NAME_MODAL_SKIP')"
						@click="$emit('close')"
					/>
				</div>
			</div>
			<div class="bx-im-guest-name-modal__terms-of-service">
				<RichLoc
					:text="loc('IM_ELEMENTS_GUEST_NAME_MODAL_TOS')"
					placeholder="[url]"
				>
					<template #url="{ text }">
						<a 
							:href="termsOfServiceUrl"
							class="bx-im-guest-name-modal__terms-of-service-link"
							target="_blank"
						>
							{{ text }}
						</a>
					</template>
				</RichLoc>
			</div>
		</div>
	`
	};

	const POPUP_ID = 'im-guest-invite-modal';

	// @vue/component
	const GuestNamePopup = {
		name: 'GuestNamePopup',
		components: {
			MessengerPopup: im_v2_component_elements_popup.MessengerPopup,
			GuestNameContent
		},
		props: {
			dialogId: {
				type: String,
				default: ''
			}
		},
		emits: ['close'],
		data() {
			return {
				isSubmitting: false
			};
		},
		computed: {
			POPUP_ID: () => POPUP_ID,
			config() {
				return {
					closeIcon: false,
					targetContainer: document.body,
					fixed: true,
					draggable: false,
					padding: 0,
					autoHide: false,
					contentPadding: 0,
					overlay: {
						opacity: 50
					}
				};
			}
		},
		beforeUnmount() {
			main_core_events.EventEmitter.emit(im_v2_const.EventType.guest.onAfterGuestNamePopupClose, {
				dialogId: this.dialogId
			});
		},
		methods: {
			async onSubmit(name) {
				if (this.isSubmitting) {
					return;
				}
				this.isSubmitting = true;
				try {
					await new GuestService().setName(name);
					this.$emit('close');
				} catch {
					im_v2_lib_notifier.Notifier.onDefaultError();
				} finally {
					this.isSubmitting = false;
				}
			}
		},
		template: `
		<MessengerPopup
			:id="POPUP_ID"
			:config="config"
			@close="$emit('close')"
		>
			<GuestNameContent
				:dialogId="dialogId"
				:isLoading="isSubmitting"
				@submit="onSubmit"
				@close="$emit('close')"
			/>
		</MessengerPopup>
	`
	};

	exports.GuestNamePopup = GuestNamePopup;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX.Event, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX, BX.UI.System.Input.Vue, BX.Vue3.Components, BX.UI.Vue3.Components, BX.Messenger.v2.Component.Elements, BX.Messenger.v2.Component.Elements);
//# sourceMappingURL=guest-name-popup.bundle.js.map
