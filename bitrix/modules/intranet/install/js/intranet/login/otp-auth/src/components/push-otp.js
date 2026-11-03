import { Event } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { Headline, Text2Xs, TextSm } from 'ui.system.typography.vue';
import { BitrixVue } from 'ui.vue3';

import { Ajax } from '../api/ajax';
import { sendOtpAnalytics } from '../analytics';
import { useOtpCaptchaFlow } from '../composables/use-otp-captcha-flow';
import { usePushOtpStore } from '../store/push-otp-store';
import { Captcha } from './captcha';

const failureDetailsPopupId = 'intranet-push-otp-failure-details';
const failureDetailsPopupContainerId = `${failureDetailsPopupId}-popup`;
const failureDetailsCloseDelay = 200;
const failureDetailsPopupMaxWidth = 400;
const failureDetailsPopupViewportOffset = 32;

// @vue/component
export const PushOtp = {
	name: 'PushOtp',
	components: {
		BIcon,
		Captcha,
		Headline,
		Popup: BitrixVue.defineAsyncComponent('ui.vue3.components.popup', 'Popup'),
		Text2Xs,
		TextSm,
	},
	props: {
		pushOtpConfig: {
			type: Object,
			default: null,
		},
		authUrl: {
			type: String,
			required: true,
		},
		rememberOtp: {
			type: Boolean,
			default: false,
		},
		captchaCode: {
			type: String,
			default: '',
		},
		userDevice: {
			type: Object,
			default: () => ({}),
		},
		errorMessage: {
			type: String,
			default: null,
		},
		showPushOtpFailureDetails: {
			type: Boolean,
			default: false,
		},
		isAlternativeMethodsAvailable: {
			type: Boolean,
			default: false,
		},
	},
	setup()
	{
		const store = usePushOtpStore();

		return {
			Outline,
			store,
		};
	},
	data()
	{
		const userDevice = this.userDevice ?? {};

		return {
			isPushBlockVisible: true,
			isCaptchaBlockVisible: false,
			isUserDeviceVisible: (Object.keys(userDevice).length > 0),
			isRememberChecked: localStorage.getItem('OTP_REMEMBER_CHECKED') === 'Y',
			isFailureDetailsShown: false,
			isFailureDetailsPinned: false,
			isFailureDetailsButtonHovered: false,
			isFailureDetailsPopupHovered: false,
			isFailureDetailsButtonFocused: false,
			failureDetailsCloseTimer: null,
			failureDetailsViewportWidth: window.innerWidth,
		};
	},
	computed: {
		failureDetailsPopupId()
		{
			return failureDetailsPopupId;
		},
		failureDetailsPopupOptions()
		{
			return {
				id: failureDetailsPopupContainerId,
				bindElement: this.$refs.failureDetailsAnchor,
				bindOptions: {
					position: 'top',
					forceBindPosition: true,
				},
				width: this.failureDetailsPopupWidth,
				padding: 0,
				autoHide: true,
				autoHideHandler: ({ target }) => this.shouldAutoHideFailureDetails(target),
				closeByEsc: true,
				closeIcon: false,
				angle: true,
				offsetTop: 6,
				targetContainer: document.body,
				borderRadius: 'var(--ui-border-radius-3xl)',
				className: 'intranet-push-otp-failure-details-popup',
			};
		},
		failureDetailsPopupWidth()
		{
			return Math.min(
				failureDetailsPopupMaxWidth,
				Math.max(0, this.failureDetailsViewportWidth - failureDetailsPopupViewportOffset),
			);
		},
		deviceIconClass()
		{
			return this.userDevice?.icon
				? `intranet-island-otp__device-icon--${this.userDevice.icon}`
				: '';
		},
		isCountdownVisible()
		{
			return this.store.isCountdownVisible;
		},
		isPushDisabled()
		{
			return this.store.isPushDisabled;
		},
		cooldownSecondsLeft()
		{
			return this.store.cooldownSecondsLeft;
		},
	},
	mounted()
	{
		Event.bind(window, 'resize', this.onFailureDetailsViewportResize);
		sendOtpAnalytics({
			event: 'show',
		});
	},
	beforeUnmount()
	{
		Event.unbind(window, 'resize', this.onFailureDetailsViewportResize);
		this.clearFailureDetailsCloseTimer();
	},
	methods: {
		...useOtpCaptchaFlow({
			mainBlockVisibleKey: 'isPushBlockVisible',
		}),
		repeatPush()
		{
			if (this.store.isPushDisabled || !this.pushOtpConfig)
			{
				return;
			}

			const cooldownSeconds = this.store.getCooldownSeconds(this.pushOtpConfig);
			Ajax.sendMobilePush(this.pushOtpConfig.channelTag)
				.then(() => {
					this.store.startCooldown(cooldownSeconds);
				})
				.catch(() => {
					this.store.startCooldown(cooldownSeconds);
				});
		},
		showAlternatives()
		{
			if (this.isAlternativeMethodsAvailable)
			{
				this.$emit('show-alternatives');
			}
			else
			{
				this.$emit('show-recover-access');
			}
			sendOtpAnalytics({
				event: 'other_type_click',
			});
		},
		onRememberChange(event)
		{
			this.isRememberChecked = event.target.checked;
			if (this.isRememberChecked)
			{
				localStorage.setItem('OTP_REMEMBER_CHECKED', 'Y');
			}
			else
			{
				localStorage.removeItem('OTP_REMEMBER_CHECKED');
			}
		},
		showFailureDetails()
		{
			this.clearFailureDetailsCloseTimer();
			this.isFailureDetailsShown = true;
		},
		onFailureDetailsButtonMouseEnter()
		{
			this.isFailureDetailsButtonHovered = true;
			this.showFailureDetails();
		},
		onFailureDetailsButtonMouseLeave()
		{
			this.isFailureDetailsButtonHovered = false;
			this.scheduleFailureDetailsClose();
		},
		onFailureDetailsButtonFocus()
		{
			this.isFailureDetailsButtonFocused = true;
			this.showFailureDetails();
		},
		onFailureDetailsButtonBlur()
		{
			this.isFailureDetailsButtonFocused = false;
			this.scheduleFailureDetailsClose();
		},
		onFailureDetailsButtonClick()
		{
			this.isFailureDetailsPinned = !this.isFailureDetailsShown || !this.isFailureDetailsPinned;
			this.isFailureDetailsShown = this.isFailureDetailsPinned;
			this.clearFailureDetailsCloseTimer();
		},
		onFailureDetailsPopupMouseEnter()
		{
			this.isFailureDetailsPopupHovered = true;
			this.clearFailureDetailsCloseTimer();
		},
		onFailureDetailsPopupMouseLeave()
		{
			this.isFailureDetailsPopupHovered = false;
			this.scheduleFailureDetailsClose();
		},
		onFailureDetailsPopupClose()
		{
			this.isFailureDetailsShown = false;
			this.isFailureDetailsPinned = false;
		},
		onFailureDetailsViewportResize()
		{
			this.failureDetailsViewportWidth = window.innerWidth;
			this.$nextTick(() => {
				const popup = this.$refs.failureDetailsPopup;
				popup?.getPopupInstance().setWidth(this.failureDetailsPopupWidth);
				popup?.adjustPosition();
			});
		},
		shouldAutoHideFailureDetails(target)
		{
			const button = this.$refs.failureDetailsButton;
			const isButtonTarget = target === button || button?.contains(target);
			const isPopupTarget = Boolean(target?.closest?.(
				`#${failureDetailsPopupContainerId}, #${failureDetailsPopupId}`,
			));

			return !isButtonTarget && !isPopupTarget;
		},
		scheduleFailureDetailsClose()
		{
			this.clearFailureDetailsCloseTimer();
			this.failureDetailsCloseTimer = setTimeout(() => {
				if (
					!this.isFailureDetailsPinned
					&& !this.isFailureDetailsButtonHovered
					&& !this.isFailureDetailsPopupHovered
					&& !this.isFailureDetailsButtonFocused
				)
				{
					this.isFailureDetailsShown = false;
				}
			}, failureDetailsCloseDelay);
		},
		clearFailureDetailsCloseTimer()
		{
			if (this.failureDetailsCloseTimer !== null)
			{
				clearTimeout(this.failureDetailsCloseTimer);
				this.failureDetailsCloseTimer = null;
			}
		},
	},
	template: `
		<form ref="authForm" name="form_auth" method="post" target="_top" :action="authUrl">
			<input type="hidden" name="AUTH_FORM" value="Y" />
			<input type="hidden" name="TYPE" value="OTP" />
			<input type="hidden" name="OTP_AUTHENTICATION_METHOD" value="push" />
			<input type="hidden" name="USER_OTP" />
			<input type="hidden" name="sessid" :value="this.$Bitrix.Loc.getMessage('bitrix_sessid')"/>

			<div v-show="isPushBlockVisible" class="intranet-island-otp-push__wrapper">
				<Headline size='lg' class="intranet-form-title">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONFIRM_AUTH') }}
				</Headline>
				<div v-if="!showPushOtpFailureDetails && errorMessage" class="intranet-otp-error-block" v-html="errorMessage"></div>
				<div class="intranet-island-otp-push__main-content">
					<div class="intranet-island-otp-push__description">
						<span class="intranet-island-otp-push__description_text">
							<span>{{ this.$Bitrix.Loc.getMessage("INTRANET_AUTH_OTP_PUSH_SENDED") }}&nbsp;</span>
							<span>{{ this.$Bitrix.Loc.getMessage("INTRANET_AUTH_OTP_CONFIRM_TEXT") }}</span>
						</span>
						<div class="intranet-island-otp-push__arrow"
							 :class="{ '--low': !isUserDeviceVisible }"
						>
						</div>
						<div v-if="isUserDeviceVisible" class="intranet-island-otp__device-row">
							<div class="intranet-island-otp__device-icon"
								 :class="deviceIconClass"
							></div>
							{{ this.userDevice.model }}
						</div>
						<div v-if="rememberOtp" class="intranet-base-checkbox intranet-password-enter-form__remember-me">
							<input type="checkbox" id="OTP_REMEMBER" name="OTP_REMEMBER" value="Y" class="login-checkbox-user-remember"
								:checked="isRememberChecked"
								@change="onRememberChange"
							/>
							<label for="OTP_REMEMBER" class="login-item-checkbox-label">
								{{ this.$Bitrix.Loc.getMessage("INTRANET_AUTH_OTP_REMEMBER_ME") }}
							</label>
						</div>
					</div>
					<div class="intranet-island-otp-push__mobile"></div>
				</div>
				<div
					v-if="showPushOtpFailureDetails && errorMessage"
					data-testid="intranet-push-otp-failure"
					class="intranet-push-otp-failure"
				>
					<BIcon
						class="intranet-push-otp-failure__icon"
						:name="Outline.ALERT_ACCENT"
						:size="24"
						color="var(--ui-color-design-tinted-alert-content-icon)"
					/>
					<div class="intranet-push-otp-failure__content">
						<Text2Xs>{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_PUSH_FAILURE_MESSAGE') }}</Text2Xs>
						<button
							ref="failureDetailsButton"
							type="button"
							data-testid="intranet-push-otp-failure-details-button"
							class="intranet-push-otp-failure__details-button"
							:aria-expanded="isFailureDetailsShown"
							:aria-controls="failureDetailsPopupId"
							:aria-describedby="isFailureDetailsShown ? failureDetailsPopupId : null"
							@mouseenter="onFailureDetailsButtonMouseEnter"
							@mouseleave="onFailureDetailsButtonMouseLeave"
							@focus="onFailureDetailsButtonFocus"
							@blur="onFailureDetailsButtonBlur"
							@click="onFailureDetailsButtonClick"
						>
							<Text2Xs class="intranet-push-otp-failure__details-label">
								{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_MORE') }}
							</Text2Xs>
							<span
								ref="failureDetailsAnchor"
								aria-hidden="true"
								class="intranet-push-otp-failure__details-anchor"
							></span>
						</button>
					</div>
				</div>
				<Popup
					v-if="isFailureDetailsShown"
					ref="failureDetailsPopup"
					:options="failureDetailsPopupOptions"
					@close="onFailureDetailsPopupClose"
				>
					<div
						:id="failureDetailsPopupId"
						data-testid="intranet-push-otp-failure-details"
						class="intranet-push-otp-failure-details"
						role="tooltip"
						@mouseenter="onFailureDetailsPopupMouseEnter"
						@mouseleave="onFailureDetailsPopupMouseLeave"
					>
						<TextSm tag="div" accent class="intranet-push-otp-failure-details__title">
							{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_PUSH_FAILURE_REASONS_TITLE') }}
						</TextSm>
						<ul class="intranet-push-otp-failure-details__list">
							<li class="intranet-push-otp-failure-details__item">
								<div class="intranet-push-otp-failure-details__icon-container">
									<BIcon
										:name="Outline.BROWSER"
										:size="24"
										color="var(--ui-color-accent-main-primary)"
										class="intranet-push-otp-failure-details__icon"
										aria-hidden="true"
									/>
								</div>
								<TextSm>{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_PUSH_FAILURE_REASON_MULTIPLE_SESSIONS') }}</TextSm>
							</li>
							<li class="intranet-push-otp-failure-details__item">
								<div class="intranet-push-otp-failure-details__icon-container">
									<BIcon
										:name="Outline.CLOCK"
										:size="24"
										color="var(--ui-color-accent-main-primary)"
										class="intranet-push-otp-failure-details__icon"
										aria-hidden="true"
									/>
								</div>
								<TextSm>{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_PUSH_FAILURE_REASON_DELAY') }}</TextSm>
							</li>
							<li class="intranet-push-otp-failure-details__item">
								<div class="intranet-push-otp-failure-details__icon-container">
									<BIcon
										:name="Outline.REFRESH"
										:size="24"
										color="var(--ui-color-accent-main-primary)"
										class="intranet-push-otp-failure-details__icon"
										aria-hidden="true"
									/>
								</div>
								<TextSm>{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_PUSH_FAILURE_REASON_STALE_PAGE') }}</TextSm>
							</li>
						</ul>
					</div>
				</Popup>
				<div class="intranet-island-otp-push-links__wrapper">
					<span 
						data-testid="bx-intranet-2fa-main-push-resend-push-link"
						class="intranet-island-otp-push__link --repeat-push" 
						:class="{ '--disabled': isPushDisabled }"
						@click="repeatPush"
					>
						{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RESEND_PUSH') }}
						<template v-if="isCountdownVisible">
							({{ cooldownSecondsLeft }})
						</template>
					</span>
					<span data-testid="bx-intranet-2fa-main-alternative-way" class="intranet-island-otp-push__link" @click="showAlternatives">
						{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_ALTERNATIVE_WAY') }}
					</span>
				</div>
			</div>

			<template v-if="captchaCode">
				<captcha
					v-show="isCaptchaBlockVisible"
					:captchaCode="captchaCode"
				></captcha>
			</template>
		</form>
	`,
};
