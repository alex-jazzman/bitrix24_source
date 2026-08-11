/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, main_popup, ui_confetti, ui_iconSet_api_vue, ui_iconSet_main, ui_iconSet_actions, booking_component_popup, booking_component_button) {
	'use strict';

	// @vue/component
	const BannerAiCallItem = {
		components: {
			Icon: ui_iconSet_api_vue.BIcon
		},
		props: {
			text: {
				type: String,
				required: true
			},
			icon: {
				type: String,
				required: true
			}
		},
		template: `
		<div class="booking-banner__ai-call-popup_item">
			<Icon :name="icon" />
			<span>{{ text }}</span>
		</div>
	`
	};

	// @vue/component
	const BannerAiCall = {
		components: {
			Popup: booking_component_popup.Popup,
			UiButton: booking_component_button.Button,
			Icon: ui_iconSet_api_vue.BIcon,
			BannerAiCallItem
		},
		props: {
			activated: {
				type: Boolean,
				default: false
			}
		},
		emits: ['enable', 'skip', 'close'],
		setup() {
			return {
				IconSet: ui_iconSet_api_vue.Set,
				ButtonSize: booking_component_button.ButtonSize,
				ButtonColor: booking_component_button.ButtonColor,
				AirButtonStyle: booking_component_button.AirButtonStyle,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				isEnableWaiting: false,
				isClosing: false
			};
		},
		computed: {
			popupId() {
				return 'booking-banner__ai-call-popup';
			},
			config() {
				return {
					width: 810,
					padding: 0,
					autoHide: false,
					overlay: true,
					animation: 'fading-slide',
					borderRadius: '32px'
				};
			},
			videoSrc() {
				return '/bitrix/js/booking/component/banner-ai-call/videos/banner.webm';
			},
			title() {
				return this.loc('BOOKING_BANNER_AI_CALL_TITLE');
			},
			intro() {
				return this.loc('BOOKING_BANNER_AI_CALL_SUBTITLE');
			},
			listItems() {
				return {
					item1: {
						text: this.loc('BOOKING_BANNER_AI_CALL_ITEM_1'),
						icon: ui_iconSet_api_vue.Outline.MOBILE
					},
					item2: {
						text: this.loc('BOOKING_BANNER_AI_CALL_ITEM_2'),
						icon: ui_iconSet_api_vue.Outline.NOTIFICATION
					},
					item3: {
						text: this.loc('BOOKING_BANNER_AI_CALL_ITEM_3'),
						icon: ui_iconSet_api_vue.Outline.RUNNING_MAN
					},
					item4: {
						text: this.loc('BOOKING_BANNER_AI_CALL_ITEM_4'),
						icon: ui_iconSet_api_vue.Outline.TIMER
					}
				};
			},
			description() {
				return this.loc('BOOKING_BANNER_AI_CALL_DESCRIPTION');
			},
			enableBtnText() {
				return this.loc('BOOKING_BANNER_AI_CALL_BUTTON_ENABLE');
			},
			dismissBtnText() {
				return this.loc('BOOKING_BANNER_AI_CALL_BUTTON_DISMISS');
			},
			successText() {
				return this.loc('BOOKING_BANNER_AI_CALL_SUCCESS');
			}
		},
		methods: {
			enable() {
				if (this.activated || this.isEnableWaiting) {
					return;
				}
				this.fireConfetti(this.$refs.enableButton.$el);
				this.isEnableWaiting = true;
				this.$emit('enable');
			},
			fireConfetti(buttonEl) {
				const rect = buttonEl.getBoundingClientRect();
				void ui_confetti.Confetti.fire({
					particleCount: 400,
					spread: 100,
					origin: {
						x: (rect.left + rect.width / 2) / window.innerWidth,
						y: (rect.top + rect.height / 2) / window.innerHeight
					},
					zIndex: main_popup.PopupManager.getMaxZIndex() + 1
				});
			},
			close() {
				if (this.isEnableWaiting && !this.activated) {
					return;
				}
				if (this.isClosing) {
					return;
				}
				this.isClosing = true;
				this.$emit('close');
			},
			skip() {
				if (this.isEnableWaiting && !this.activated) {
					return;
				}
				if (this.isClosing) {
					return;
				}
				this.isClosing = true;
				this.$emit('skip');
			}
		},
		template: `
		<Popup
			:id="popupId"
			:config="config"
			@close="close"
		>
			<div class="booking-banner__ai-call-popup">
				<div class="booking-banner__ai-call-popup_title">
					{{ title }}
				</div>
				<div class="booking-banner__ai-call-popup_body">
					<div class="booking-banner__ai-call-popup_info">
						<div class="booking-banner__ai-call-popup_subtitle">
							{{ intro }}
						</div>
						<div class="booking-banner__ai-call-popup_items">
							<BannerAiCallItem
								v-for="(item, key) of listItems"
								:key="key"
								:text="item.text"
								:icon="item.icon"
							/>
						</div>
						<div class="booking-banner__ai-call-popup_description">
							<Icon
								class="booking-banner__ai-call-popup_description-icon"
								:name="Outline.INFO_CIRCLE"
							/>
							<span>{{ description }}</span>
						</div>
					</div>
					<div class="booking-banner__ai-call-popup_video-container">
						<video
							class="booking-banner__ai-call-popup_video"
							:src="videoSrc"
							muted
							autoplay
							loop
						></video>
					</div>
				</div>
				<div v-if="!activated" class="booking-banner__ai-call-popup_buttons">
					<UiButton
						ref="enableButton"
						class="booking-banner__ai-call-popup_button --enable"
						:text="enableBtnText"
						:size="ButtonSize.EXTRA_LARGE"
						:color="ButtonColor.PRIMARY"
						:waiting="isEnableWaiting"
						useAirDesign
						round
						noCaps
						@click="enable"
					/>
					<UiButton
						class="booking-banner__ai-call-popup_button --dismiss"
						:text="dismissBtnText"
						:size="ButtonSize.EXTRA_LARGE"
						:color="ButtonColor.PRIMARY"
						:buttonClass="['--air', AirButtonStyle.OUTLINE]"
						useAirDesign
						round
						noCaps
						@click="skip"
					/>
				</div>
				<div v-else class="booking-banner__ai-call-popup_success">
					<Icon
						class="booking-banner__ai-call-popup_success-icon"
						:name="Outline.CHECK_M"
					/>
					<span class="booking-banner__ai-call-popup_success-text">
						{{ successText }}
					</span>
				</div>
				<Icon
					class="booking-banner__ai-call-popup_cross"
					:name="IconSet.CROSS_40"
					@click="close"
				/>
			</div>
		</Popup>
	`
	};

	exports.BannerAiCall = BannerAiCall;

})(this.BX.Booking.Component = this.BX.Booking.Component || {}, BX.Main, BX.UI, BX.UI.IconSet, window, window, BX.Booking.Component, BX.Booking.Component);
//# sourceMappingURL=banner-ai-call.bundle.js.map
