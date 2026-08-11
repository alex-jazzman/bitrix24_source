import { PopupManager, type PopupOptions } from 'main.popup';
import { Confetti } from 'ui.confetti';
import { BIcon as Icon, Set as IconSet, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.main';
import 'ui.icon-set.actions';

import { Popup } from 'booking.component.popup';
import { AirButtonStyle, Button as UiButton, ButtonColor, ButtonSize } from 'booking.component.button';
import { BannerAiCallItem } from './banner-ai-call-item.js';
import './banner-ai-call.css';

// @vue/component
export const BannerAiCall = {
	components: {
		Popup,
		UiButton,
		Icon,
		BannerAiCallItem,
	},
	props: {
		activated: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['enable', 'skip', 'close'],
	setup(): Object
	{
		return {
			IconSet,
			ButtonSize,
			ButtonColor,
			AirButtonStyle,
			Outline,
		};
	},
	data(): Object
	{
		return {
			isEnableWaiting: false,
			isClosing: false,
		};
	},
	computed: {
		popupId(): string
		{
			return 'booking-banner__ai-call-popup';
		},
		config(): PopupOptions
		{
			return {
				width: 810,
				padding: 0,
				autoHide: false,
				overlay: true,
				animation: 'fading-slide',
				borderRadius: '32px',
			};
		},
		videoSrc(): string
		{
			return '/bitrix/js/booking/component/banner-ai-call/videos/banner.webm';
		},
		title(): string
		{
			return this.loc('BOOKING_BANNER_AI_CALL_TITLE');
		},
		intro(): string
		{
			return this.loc('BOOKING_BANNER_AI_CALL_SUBTITLE');
		},
		listItems(): { [key: string]: { text: string, icon: string } }
		{
			return {
				item1: {
					text: this.loc('BOOKING_BANNER_AI_CALL_ITEM_1'),
					icon: Outline.MOBILE,
				},
				item2: {
					text: this.loc('BOOKING_BANNER_AI_CALL_ITEM_2'),
					icon: Outline.NOTIFICATION,
				},
				item3: {
					text: this.loc('BOOKING_BANNER_AI_CALL_ITEM_3'),
					icon: Outline.RUNNING_MAN,
				},
				item4: {
					text: this.loc('BOOKING_BANNER_AI_CALL_ITEM_4'),
					icon: Outline.TIMER,
				},
			};
		},
		description(): string
		{
			return this.loc('BOOKING_BANNER_AI_CALL_DESCRIPTION');
		},
		enableBtnText(): string
		{
			return this.loc('BOOKING_BANNER_AI_CALL_BUTTON_ENABLE');
		},
		dismissBtnText(): string
		{
			return this.loc('BOOKING_BANNER_AI_CALL_BUTTON_DISMISS');
		},
		successText(): string
		{
			return this.loc('BOOKING_BANNER_AI_CALL_SUCCESS');
		},
	},
	methods: {
		enable(): void
		{
			if (this.activated || this.isEnableWaiting)
			{
				return;
			}

			this.fireConfetti(this.$refs.enableButton.$el);

			this.isEnableWaiting = true;
			this.$emit('enable');
		},
		fireConfetti(buttonEl: HTMLElement): void
		{
			const rect = buttonEl.getBoundingClientRect();

			void Confetti.fire({
				particleCount: 400,
				spread: 100,
				origin: {
					x: (rect.left + rect.width / 2) / window.innerWidth,
					y: (rect.top + rect.height / 2) / window.innerHeight,
				},
				zIndex: PopupManager.getMaxZIndex() + 1,
			});
		},
		close(): void
		{
			if (this.isEnableWaiting && !this.activated)
			{
				return;
			}

			if (this.isClosing)
			{
				return;
			}

			this.isClosing = true;
			this.$emit('close');
		},
		skip(): void
		{
			if (this.isEnableWaiting && !this.activated)
			{
				return;
			}

			if (this.isClosing)
			{
				return;
			}

			this.isClosing = true;
			this.$emit('skip');
		},
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
	`,
};
