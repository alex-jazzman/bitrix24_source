/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports,ui_vue3,pull_client,main_core,ui_vue3_components_button,ui_iconSet_api_core,ui_analytics,ui_vue3_pinia,ui_system_typography_vue) {
	'use strict';

	function useOtpCaptchaFlow(options = {}) {
	  const {
	    mainBlockVisibleKey = 'isMainBlockVisible',
	    captchaBlockVisibleKey = 'isCaptchaBlockVisible',
	    waitingKey = 'isWaiting'
	  } = options;
	  return {
	    showCaptcha() {
	      this[mainBlockVisibleKey] = false;
	      this[captchaBlockVisibleKey] = true;
	    },
	    handleFormSubmit(event) {
	      if (this.captchaCode) {
	        event.preventDefault();
	        this.showCaptcha();
	      } else {
	        this[waitingKey] = true;
	        this.$emit('form-submit');
	      }
	    },
	    handleCodeComplete() {
	      this.$nextTick(() => {
	        if (this.captchaCode) {
	          this.showCaptcha();
	        } else {
	          var _this$$refs;
	          this[waitingKey] = true;
	          this.$emit('form-submit');
	          const formRef = (_this$$refs = this.$refs) == null ? void 0 : _this$$refs.authForm;
	          if (formRef) {
	            formRef.submit();
	          }
	        }
	      });
	    }
	  };
	}

	// @vue/component
	const Captcha = {
	  components: {
	    Headline: ui_system_typography_vue.Headline
	  },
	  props: {
	    captchaCode: {
	      type: String,
	      default: ''
	    }
	  },
	  data() {
	    return {
	      isWaiting: false
	    };
	  },
	  computed: {
	    getCaptchaSrc() {
	      return `/bitrix/tools/captcha.php?captcha_sid=${this.captchaCode}`;
	    }
	  },
	  methods: {
	    onSubmitForm() {
	      this.isWaiting = true;
	    }
	  },
	  template: `
		<div class="intranet-island-otp-captcha__wrapper">
			<Headline size='md' class="intranet-form-add-block__headline --margin">
				{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CAPTCHA_PROMT') }}
			</Headline>
			<div class="intranet-text-captcha_item">
				<input type="hidden" name="captcha_sid" :value="captchaCode" class="login-inp"/>
				<img :src="getCaptchaSrc" width="180" height="40" alt="CAPTCHA"/>
			</div>
			<div class="intranet-text-input intranet-login-enter-form__login">
				<input
					type="text"
					name="captcha_word"
					:placeholder="this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CAPTCHA_PROMT')"
					maxlength="50"
					value=""
					class="ui-ctl-element intranet-text-input__field"
				/>
			</div>
	
			<button
				class="intranet-text-btn ui-btn ui-btn-lg ui-btn-success --wide"
				type="submit"
				@click="onSubmitForm"
			>
				<span class="intranet-text-btn__content-wrapper">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONTINUE_BUTTON') }}
				</span>
				<span class="intranet-text-btn__spinner" v-show="isWaiting"></span>
			</button>
		</div>
	`
	};

	// @vue/component
	const LegacyOtp = {
	  components: {
	    Headline: ui_system_typography_vue.Headline,
	    Captcha
	  },
	  props: {
	    authUrl: {
	      type: String,
	      required: true
	    },
	    authOtpHelpLink: {
	      type: String,
	      default: ''
	    },
	    authLoginUrl: {
	      type: String,
	      default: ''
	    },
	    accountChangeUrl: {
	      type: String,
	      default: ''
	    },
	    rememberOtp: {
	      type: Boolean,
	      default: false
	    },
	    captchaCode: {
	      type: String,
	      default: ''
	    },
	    notShowLinks: {
	      type: Boolean,
	      default: false
	    },
	    isBitrix24: {
	      type: Boolean,
	      default: false
	    },
	    userData: {
	      type: Object,
	      default: null
	    },
	    errorMessage: {
	      type: String,
	      default: null
	    }
	  },
	  data() {
	    return {
	      isWaiting: false,
	      csrfToken: null,
	      isOtpBlockVisible: true,
	      isCaptchaBlockVisible: false
	    };
	  },
	  computed: {
	    photoImage() {
	      var _this$userData;
	      return `url('${(_this$userData = this.userData) == null ? void 0 : _this$userData.photoUrl}')`;
	    }
	  },
	  mounted() {
	    if (this.$refs.modalInput) {
	      this.$refs.modalInput.focus();
	    }
	  },
	  methods: {
	    ...useOtpCaptchaFlow({
	      mainBlockVisibleKey: 'isOtpBlockVisible'
	    }),
	    onSubmitForm() {
	      this.handleFormSubmit(event);
	    }
	  },
	  template: `
		<form ref="authForm" name="form_auth" method="post" target="_top" :action="authUrl">
			<input type="hidden" name="AUTH_FORM" value="Y" />
			<input type="hidden" name="TYPE" value="OTP" />
			<input type="hidden" name="sessid" :value="this.$Bitrix.Loc.getMessage('bitrix_sessid')" />

			<div v-show="isOtpBlockVisible" class="intranet-island-otp-push-legacy-otp__wrapper">
				<a v-if="accountChangeUrl" :href="accountChangeUrl" class="intranet-back-button">
					<i class="ui-icon-set --arrow-left-l intranet-back-button__arrow --legacyotp"></i>
				</a>
				<Headline size='lg' class="intranet-form-title">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_TITLE') }}
				</Headline>
				<div class="intranet-login-enter-form intranet-logging-in__login-form">
					<div v-if="errorMessage" class="intranet-login-error-block" v-html="errorMessage"></div>
					
					<div v-if="userData" class="intranet-account-card">
						<div class="intranet-account-card__user-wrapper">
							<div class="intranet-account-card__user">
								<span class="intranet-account-card__avatar intranet-account-card__avatar--email"
									  :style="userData?.photoUrl ? { backgroundImage: photoImage } : {}"
								></span>
								<div class="intranet-account-card__details-wrapper">
									<div v-if="userData?.fullName" class="intranet-account-card__full-name">{{ userData.fullName }}</div>
									<div class="intranet-account-card__login">{{ userData.login }}</div>
								</div>
							</div>
						</div>
					</div>

					<h4 class="intranet-form-add-block__title --margin">
						{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_PLACEHOLDER') }}
					</h4>
					
					<div class="intranet-login-enter-form__login-wrapper">
						<div class="intranet-text-input intranet-login-enter-form__login">
							<input
								type="text"
								name="USER_OTP"
								class="ui-ctl-element intranet-text-input__field"
								maxlength="50"
								value=""
								autocomplete="off"
								ref="modalInput"
							/>
						</div>
					</div>
					<button
						class="intranet-text-btn intranet-text-btn__reg ui-btn ui-btn-lg ui-btn-success"
						type="submit"
						@click="onSubmitForm($event)"
					>
						<span class="intranet-text-btn__content-wrapper">
							{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONTINUE_BUTTON') }}
						</span>
						<span class="intranet-text-btn__spinner" v-show="isWaiting"></span>
					</button>
					<div v-if="rememberOtp" class="intranet-base-checkbox intranet-password-enter-form__remember-me">
						<input type="checkbox" id="OTP_REMEMBER" name="OTP_REMEMBER" value="Y" class="login-checkbox-user-remember"/>
						<label for="OTP_REMEMBER" class="login-item-checkbox-label">&nbsp;
							{{ this.$Bitrix.Loc.getMessage("INTRANET_AUTH_OTP_REMEMBER_ME") }}
						</label>
					</div>
				</div>
			</div>
			
			<template v-if="captchaCode">
				<captcha
					v-show="isCaptchaBlockVisible"
					:captchaCode="captchaCode"
				></captcha>
			</template>
		</form>
		<Teleport to=".intranet-body__footer-right">
			<button class="intranet-help-widget intranet-page-base__help">
				<i class="ui-icon-set intranet-help-widget__icon"></i>
				<a class="intranet-help-widget__text" :href="authOtpHelpLink">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_HELP') }}
				</a>
			</button>
		</Teleport>

		<Teleport to=".intranet-body__header-right" v-if="!notShowLinks && !isBitrix24">
			<div class="intranet-text-btn intranet-text-btn--auth">
				<a class="intranet-text-btn-link" :href="authLoginUrl" rel="nofollow">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_LINK') }}
				</a>
			</div>
		</Teleport>
	`
	};

	class Ajax {
	  static sendAuthSms() {
	    return main_core.ajax.runAction('intranet.v2.Otp.sendAuthSms', {});
	  }
	  static sendMobilePush(channelTag) {
	    return main_core.ajax.runAction('intranet.v2.Otp.sendMobilePush', {
	      data: {
	        channelTag
	      }
	    });
	  }
	  static sendRequestRecoverAccess(signedUserId) {
	    return main_core.ajax.runAction('intranet.v2.Otp.sendRequestRecoverAccess', {
	      data: {
	        signedUserId
	      }
	    });
	  }
	  static resetOtpSession(signedUserId) {
	    return main_core.ajax.runAction('intranet.v2.Otp.resetOtpSession', {
	      data: {
	        signedUserId
	      }
	    });
	  }
	}

	const usePushOtpStore = ui_vue3_pinia.defineStore('pushOtp', {
	  state: () => ({
	    isPushDisabled: true,
	    cooldownSecondsLeft: 0,
	    cooldownIntervalId: null
	  }),
	  getters: {
	    isCountdownVisible: state => state.isPushDisabled && state.cooldownSecondsLeft > 0
	  },
	  actions: {
	    startCooldown(seconds) {
	      const cooldown = Number(seconds);
	      if (!cooldown || cooldown <= 0) {
	        this.stopCooldown();
	        return;
	      }
	      this.cooldownSecondsLeft = Math.floor(cooldown);
	      this.isPushDisabled = true;
	      this.stopCooldownTimer();
	      this.cooldownIntervalId = setInterval(() => {
	        if (this.cooldownSecondsLeft <= 1) {
	          this.stopCooldown();
	          return;
	        }
	        this.cooldownSecondsLeft -= 1;
	      }, 1000);
	    },
	    stopCooldown() {
	      this.stopCooldownTimer();
	      this.isPushDisabled = false;
	      this.cooldownSecondsLeft = 0;
	    },
	    stopCooldownTimer() {
	      if (this.cooldownIntervalId) {
	        clearInterval(this.cooldownIntervalId);
	        this.cooldownIntervalId = null;
	      }
	    },
	    initCooldown(defaultCooldown) {
	      if (defaultCooldown > 0) {
	        this.startCooldown(defaultCooldown);
	      } else {
	        this.isPushDisabled = false;
	        this.cooldownSecondsLeft = 0;
	      }
	    },
	    getCooldownSeconds(config, defaultCooldown = 5) {
	      const seconds = Number(config == null ? void 0 : config.cooldownSeconds);
	      return Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : defaultCooldown;
	    }
	  }
	});

	// @vue/component

	const PushOtp = {
	  components: {
	    Captcha,
	    Headline: ui_system_typography_vue.Headline
	  },
	  setup() {
	    const store = usePushOtpStore();
	    return {
	      store
	    };
	  },
	  props: {
	    pushOtpConfig: {
	      type: Object,
	      default: null
	    },
	    authUrl: {
	      type: String,
	      required: true
	    },
	    rememberOtp: {
	      type: Boolean,
	      default: false
	    },
	    captchaCode: {
	      type: String,
	      default: ''
	    },
	    userDevice: {
	      type: Object,
	      default: () => ({})
	    },
	    errorMessage: {
	      type: String,
	      default: null
	    },
	    isAlternativeMethodsAvailable: {
	      type: Boolean,
	      default: false
	    }
	  },
	  data() {
	    var _this$userDevice;
	    const userDevice = (_this$userDevice = this.userDevice) != null ? _this$userDevice : {};
	    return {
	      isPushBlockVisible: true,
	      isCaptchaBlockVisible: false,
	      isUserDeviceVisible: Object.keys(userDevice).length > 0,
	      isRememberChecked: localStorage.getItem('OTP_REMEMBER_CHECKED') === 'Y'
	    };
	  },
	  computed: {
	    deviceIconClass() {
	      var _this$userDevice2;
	      return (_this$userDevice2 = this.userDevice) != null && _this$userDevice2.icon ? `intranet-island-otp__device-icon--${this.userDevice.icon}` : '';
	    },
	    isCountdownVisible() {
	      return this.store.isCountdownVisible;
	    },
	    isPushDisabled() {
	      return this.store.isPushDisabled;
	    },
	    cooldownSecondsLeft() {
	      return this.store.cooldownSecondsLeft;
	    }
	  },
	  mounted() {
	    ui_analytics.sendData({
	      tool: 'security',
	      category: 'fa_auth_form',
	      event: 'show'
	    });
	  },
	  methods: {
	    ...useOtpCaptchaFlow({
	      mainBlockVisibleKey: 'isPushBlockVisible'
	    }),
	    repeatPush() {
	      if (this.store.isPushDisabled || !this.pushOtpConfig) {
	        return;
	      }
	      const cooldownSeconds = this.store.getCooldownSeconds(this.pushOtpConfig);
	      Ajax.sendMobilePush(this.pushOtpConfig.channelTag).then(() => {
	        this.store.startCooldown(cooldownSeconds);
	      }).catch(() => {
	        this.store.startCooldown(cooldownSeconds);
	      });
	    },
	    showAlternatives() {
	      if (this.isAlternativeMethodsAvailable) {
	        this.$emit('show-alternatives');
	      } else {
	        this.$emit('show-recover-access');
	      }
	      ui_analytics.sendData({
	        tool: 'security',
	        category: 'fa_auth_form',
	        event: 'other_type_click'
	      });
	    },
	    onRememberChange(event) {
	      this.isRememberChecked = event.target.checked;
	      if (this.isRememberChecked) {
	        localStorage.setItem('OTP_REMEMBER_CHECKED', 'Y');
	      } else {
	        localStorage.removeItem('OTP_REMEMBER_CHECKED');
	      }
	    }
	  },
	  template: `
		<form ref="authForm" name="form_auth" method="post" target="_top" :action="authUrl">
			<input type="hidden" name="AUTH_FORM" value="Y" />
			<input type="hidden" name="TYPE" value="OTP" />
			<input type="hidden" name="USER_OTP" />
			<input type="hidden" name="sessid" :value="this.$Bitrix.Loc.getMessage('bitrix_sessid')"/>

			<div v-show="isPushBlockVisible" class="intranet-island-otp-push__wrapper">
				<Headline size='lg' class="intranet-form-title">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONFIRM_AUTH') }}
				</Headline>
				<div v-if="errorMessage" class="intranet-otp-error-block" v-html="errorMessage"></div>
				<div class="intranet-island-otp-push__main-content">
					<div class="intranet-island-otp-push__description">
						<span>{{ this.$Bitrix.Loc.getMessage("INTRANET_AUTH_OTP_PUSH_SENDED") }}</span>
						<span>{{ this.$Bitrix.Loc.getMessage("INTRANET_AUTH_OTP_CONFIRM_TEXT") }}</span>
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
	`
	};

	// @vue/component
	const AlternativeMethods = {
	  components: {
	    Headline: ui_system_typography_vue.Headline
	  },
	  props: {
	    canLoginBySms: {
	      type: Boolean,
	      default: false
	    },
	    isRecoveryCodesEnabled: {
	      type: Boolean,
	      default: false
	    }
	  },
	  mounted() {
	    this.sendAnalytics('other_type_show');
	  },
	  methods: {
	    showPushOtp() {
	      this.$emit('back-to-push');
	      this.sendAnalytics('choose_auth_type', 'app');
	    },
	    showSms() {
	      this.$emit('show-sms');
	      this.sendAnalytics('choose_auth_type', 'sms');
	    },
	    showRecoveryCodes() {
	      this.$emit('show-recovery-codes');
	      this.sendAnalytics('choose_auth_type', 'code');
	    },
	    showRecoverAccess() {
	      this.$emit('show-recover-access');
	      this.sendAnalytics('choose_auth_type', 'restore_access');
	    },
	    showApplicationOfflineCode() {
	      this.$emit('application-offline-code');
	      this.sendAnalytics('choose_auth_type', 'offline_code');
	    },
	    sendAnalytics(event, type = null) {
	      const options = {
	        tool: 'security',
	        category: 'fa_auth_form',
	        event
	      };
	      if (type) {
	        options.type = type;
	      }
	      ui_analytics.sendData(options);
	    }
	  },
	  template: `
		<div class="intranet-island-otp-push-alternative__wrapper">
			<div @click="showPushOtp" class="intranet-back-button">
				<i class="ui-icon-set --arrow-left-l intranet-back-button__arrow --alternative"></i>
			</div>
			<Headline size='lg' class="intranet-form-title --padding">
				{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_ALTERNATIVE_WAY_TITLE') }}
			</Headline>

			<div class="intranet-island-otp-push-alternative-items__wrapper">
				<div data-testid="bx-intranet-2fa-alternative-methods-sms" v-if="canLoginBySms" class="intranet-island-otp-push-alternative__item" @click="showSms">
					<i class="ui-icon-set --o-sms intranet-island-otp-push-alternative-item__icon"></i>
					<span>{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_SMS') }}</span>
				</div>
				<div data-testid="bx-intranet-2fa-alternative-methods-recovery-codes" v-if="isRecoveryCodesEnabled" class="intranet-island-otp-push-alternative__item" @click="showRecoveryCodes">
					<i class="ui-icon-set --o-key intranet-island-otp-push-alternative-item__icon"></i>
					<span>{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVERY_CODES') }}</span>
				</div>
				<div data-testid="bx-intranet-2fa-alternative-methods-offline-code" class="intranet-island-otp-push-alternative__item" @click="showApplicationOfflineCode">
					<i class="ui-icon-set --o-shield-checked intranet-island-otp-push-alternative-item__icon"></i>
					<span>{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_APPLICATION_OFFLINE_CODE') }}</span>
				</div>
				<span data-testid="bx-intranet-2fa-alternative-methods-recover-access" class="intranet-island-otp-push__link --gray --underline" @click="showRecoverAccess">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_TITLE') }}
				</span>
			</div>
		</div>
	`
	};

	const CLICK_EVENT = 'click';
	const PASTE_EVENT = 'value-paste';
	const CHANGE_EVENT = 'digit-change';

	// @vue/component
	const DigitInput = {
	  props: {
	    digitValue: {
	      type: String,
	      default: '',
	      validator: value => /\d/.test(value) || value === ''
	    },
	    isFocused: {
	      type: Boolean,
	      default: false
	    },
	    error: {
	      type: String,
	      required: true
	    }
	  },
	  emits: [CLICK_EVENT,
	  // Contains pasted value as a payload
	  PASTE_EVENT,
	  // Contains new digit value in form of numeric string as a payload
	  CHANGE_EVENT],
	  computed: {
	    inputExtraClasses() {
	      return {
	        'intranet-digit-input--filled': this.digitValue !== ''
	      };
	    },
	    inputClass() {
	      return `intranet-digit-input${this.error ? ' --error' : ''}`;
	    }
	  },
	  watch: {
	    isFocused(needFocus) {
	      if (needFocus) {
	        this.$el.focus();
	      } else {
	        this.$el.blur();
	      }
	    }
	  },
	  methods: {
	    onClick() {
	      this.$emit(CLICK_EVENT);
	    },
	    deselectInputContent() {
	      this.$el.selectionStart = this.$el.selectionEnd;
	    },
	    onPaste(event) {
	      const pastedValue = (event.clipboardData || window.clipboardData).getData('text');
	      this.$emit(PASTE_EVENT, pastedValue);
	    },
	    onKeyDown(event) {
	      const isShortcutKey = event.ctrlKey || event.altKey || event.metaKey;
	      if (!isShortcutKey) {
	        event.preventDefault();
	      }
	      if (/\d/.test(event.key) || event.key === 'Backspace') {
	        this.$emit(CHANGE_EVENT, event.key === 'Backspace' ? '' : event.key);
	      }
	    }
	  },
	  template: `
		<input
			type="text"
			maxlength="1"
			inputmode="numeric"
			:class="[inputClass, inputExtraClasses]"
			:value="digitValue"
			@click="onClick"
			@keydown="onKeyDown"
			@paste.prevent="onPaste"
		>
	`
	};

	const CODE_CHANGE = 'code-change';
	const CODE_COMPLETE = 'code-complete';

	// @vue/component
	const VerificationCode = {
	  components: {
	    DigitInput,
	    Headline: ui_system_typography_vue.Headline
	  },
	  props: {
	    code: {
	      type: String,
	      required: true
	    },
	    label: {
	      type: String,
	      default: ''
	    },
	    error: {
	      type: String,
	      required: true
	    },
	    // Specifies whether it should be short (4-digit) or long (6-digit) code
	    isPhoneCode: {
	      type: Boolean,
	      default: false
	    },
	    // Enables spacing between digit groups (e.g., "XXX XXX" for 6-digit codes)
	    enableSpacing: {
	      type: Boolean,
	      default: true
	    }
	  },
	  emits: [
	  // Contains changed code in form of numeric string value as a payload
	  CODE_CHANGE,
	  // Emitted when the code is fully filled
	  CODE_COMPLETE],
	  data() {
	    return {
	      codeArray: [],
	      // Indicates what digit input component is currently focused
	      focusIndex: -1
	    };
	  },
	  computed: {
	    codeLength() {
	      return this.isPhoneCode ? 6 : 8;
	    },
	    hasLabel() {
	      return Boolean(this.label);
	    },
	    isCodeComplete() {
	      return this.codeArray.length === this.codeLength && this.codeArray.every(digit => digit !== '');
	    }
	  },
	  watch: {
	    code(newValue) {
	      this.fillCodeArrayFromCode(newValue);
	    }
	  },
	  created() {
	    this.fillCodeArrayFromCode(this.code);
	  },
	  mounted() {
	    this.focusIndex = 0;
	  },
	  methods: {
	    fillCodeArrayFromCode(code) {
	      for (let i = 0; i < this.codeLength; i++) {
	        this.codeArray[i] = code.length > i ? code[i] : '';
	      }
	    },
	    onDigitChange(changedDigitIndex, newValue) {
	      this.updateCodeDigit(changedDigitIndex, newValue);
	      if (newValue === '') {
	        this.focusPreviousDigitInput(changedDigitIndex);
	      } else {
	        this.focusNextDigitInput(changedDigitIndex);
	      }
	      const fullCode = this.codeArray.join('');
	      this.$emit(CODE_CHANGE, fullCode);
	      if (this.isCodeComplete) {
	        this.$emit(CODE_COMPLETE, fullCode);
	      }
	    },
	    updateCodeDigit(changedDigitIndex, newValue) {
	      if (changedDigitIndex >= 0 && changedDigitIndex < this.codeArray.length) {
	        this.codeArray[changedDigitIndex] = newValue;
	      }
	    },
	    focusPreviousDigitInput(changedDigitIndex) {
	      const previousIndex = changedDigitIndex - 1;
	      if (previousIndex >= 0 && this.isNextDigitEmpty(changedDigitIndex)) {
	        this.focusIndex = previousIndex;
	      }
	    },
	    isNextDigitEmpty(currentIndex) {
	      let nextIndex = currentIndex + 1;
	      if (nextIndex >= this.codeLength) {
	        nextIndex = this.codeLength - 1;
	      }
	      return this.codeArray[nextIndex] === '';
	    },
	    focusNextDigitInput(changedDigitIndex) {
	      const nextIndex = changedDigitIndex + 1;
	      if (this.isPreviousDigitEmpty(changedDigitIndex)) {
	        this.focusIndex = this.calculateLastEmptyDigitIndex();
	      } else if (nextIndex < this.codeLength) {
	        this.focusIndex = nextIndex;
	      }
	    },
	    isPreviousDigitEmpty(currentDigitIndex) {
	      let previousIndex = currentDigitIndex - 1;
	      if (previousIndex < 0) {
	        previousIndex = 0;
	      }
	      return this.codeArray[previousIndex] === '';
	    },
	    calculateLastEmptyDigitIndex() {
	      const lastNonEmptyDigitIndex = this.findLastNonEmptyDigitIndex();
	      if (lastNonEmptyDigitIndex < 0) {
	        return 1;
	      }
	      const lastEmptyDigitIndex = lastNonEmptyDigitIndex + 1;
	      return lastEmptyDigitIndex < this.codeLength - 1 ? lastEmptyDigitIndex + 1 : lastEmptyDigitIndex;
	    },
	    findLastNonEmptyDigitIndex() {
	      if (this.codeArray[0] === '') {
	        return -1;
	      }
	      for (let i = 0; i < this.codeLength; i++) {
	        if (this.codeArray[i] === '') {
	          return i > 0 ? i - 1 : 0;
	        }
	      }
	      return this.codeLength - 1;
	    },
	    isShiftedInput(inputIndex) {
	      return this.enableSpacing && this.isPhoneCode && inputIndex === this.codeLength / 2;
	    },
	    onPaste(pastedValue) {
	      if (this.isValidNumericCode(pastedValue)) {
	        this.fillCodeArrayFromCode(pastedValue);
	      } else if (this.isSingleDigit(pastedValue) && this.focusIndex >= 0) {
	        this.codeArray[this.focusIndex] = pastedValue;
	      }
	      const fullCode = this.codeArray.join('');
	      this.$emit(CODE_CHANGE, fullCode);
	      if (this.isCodeComplete) {
	        this.$emit(CODE_COMPLETE, fullCode);
	      }
	    },
	    isValidNumericCode(someCode) {
	      const codeRegExp = new RegExp(`^[0-9]{${this.codeLength}}$`);
	      return codeRegExp.test(someCode);
	    },
	    isSingleDigit(someValue) {
	      return /^\d$/.test(someValue);
	    },
	    onClick(inputIndex) {
	      this.focusIndex = inputIndex;
	    }
	  },
	  template: `
		<div class="intranet-verification-code-wrapper">
			<Headline size='xs' v-if="hasLabel" class="intranet-verification-code__label">
				{{ label }}
			</Headline>
			<div class="intranet-verification-code">
				<digit-input
					v-for="digitPos in codeLength"
					class="intranet-verification-code__digit"
					:class="{ 'intranet-verification-code__digit--shifted': isShiftedInput(digitPos - 1) }"
					:key="digitPos"
					:is-focused="focusIndex === (digitPos - 1)"
					:digit-value="codeArray[digitPos - 1] ?? ''"
					:error="error"
					@value-paste="onPaste"
					@click="onClick(digitPos - 1)"
					@digit-change="onDigitChange(digitPos - 1, $event)"
				></digit-input>
			</div>
			<div v-if="error" :class="['intranet-otp-error-block', label ? '--start' : '']" v-html="error"></div>
		</div>
	`
	};

	// @vue/component
	const Sms = {
	  components: {
	    VerificationCode,
	    Captcha,
	    Headline: ui_system_typography_vue.Headline
	  },
	  props: {
	    authUrl: {
	      type: String,
	      default: ''
	    },
	    captchaCode: {
	      type: String,
	      default: ''
	    },
	    maskedUserAuthPhoneNumber: {
	      type: String,
	      default: ''
	    },
	    errorMessage: {
	      type: String,
	      default: null
	    }
	  },
	  data() {
	    return {
	      isWaiting: false,
	      code: '',
	      isSmsBlockVisible: true,
	      isCaptchaBlockVisible: false,
	      countdown: null,
	      countdownInterval: null
	    };
	  },
	  computed: {
	    phoneMessage() {
	      return this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_SMS_SENDED', {
	        '#NUMBER#': `<strong>${this.maskedUserAuthPhoneNumber}</strong>`
	      });
	    },
	    isResendSmsAvailable() {
	      return this.countdown && this.countdown <= 0;
	    },
	    isCountdownVisible() {
	      return this.countdown && this.countdown > 0;
	    }
	  },
	  mounted() {
	    this.sendSmsCode();
	    this.sendAnalytics('sms_show');
	  },
	  methods: {
	    ...useOtpCaptchaFlow({
	      mainBlockVisibleKey: 'isSmsBlockVisible'
	    }),
	    onSubmitForm(event) {
	      this.handleFormSubmit(event);
	    },
	    async sendSmsCode() {
	      await Ajax.sendAuthSms().then(response => {
	        var _response$data, _response$data2;
	        this.countdown = main_core.Type.isNumber((_response$data = response.data) == null ? void 0 : _response$data.timeLeft) ? (_response$data2 = response.data) == null ? void 0 : _response$data2.timeLeft : 0;
	        this.startCountdownTimer();
	      }, response => {
	        var _response$data3, _response$data4;
	        this.countdown = main_core.Type.isNumber((_response$data3 = response.data) == null ? void 0 : _response$data3.timeLeft) ? (_response$data4 = response.data) == null ? void 0 : _response$data4.timeLeft : 0;
	        this.startCountdownTimer();
	      }).catch(error => console.error(error));
	    },
	    async resendSendSmsCode() {
	      this.sendAnalytics('sms_repeat_click');
	      await this.sendSmsCode();
	    },
	    startCountdownTimer() {
	      clearInterval(this.countdownInterval);
	      this.countdownInterval = setInterval(() => {
	        this.countdown--;
	        if (this.countdown < 0) {
	          clearInterval(this.countdownInterval);
	        }
	      }, 1000);
	    },
	    onCodeChange(code) {
	      this.code = code;
	    },
	    onCodeComplete(code) {
	      this.code = code;
	      this.handleCodeComplete(code);
	    },
	    showAlternativeMethods() {
	      this.$emit('clear-errors');
	      this.$emit('show-alternatives');
	    },
	    sendAnalytics(event) {
	      ui_analytics.sendData({
	        tool: 'security',
	        category: 'fa_auth_form',
	        event
	      });
	    }
	  },
	  template: `
		<form ref="authForm" name="form_auth" method="post" target="_top" :action="authUrl">
			<input type="hidden" name="AUTH_FORM" value="Y"/>
			<input type="hidden" name="TYPE" value="OTP"/>
			<input type="hidden" name="USER_OTP" :value="code"/>
			<input type="hidden" name="CURRENT_STEP" value="sms"/>
			<input type="hidden" name="sessid" :value="this.$Bitrix.Loc.getMessage('bitrix_sessid')"/>

			<div v-show="isSmsBlockVisible" class="intranet-island-otp-push-sms__wrapper">
				<div @click="showAlternativeMethods" class="intranet-back-button">
					<i class="ui-icon-set --arrow-left-l intranet-back-button__arrow --smscode"></i>
				</div>
				<Headline size='lg' class="intranet-form-title --padding">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONFIRM_LOGIN') }}
				</Headline>
				<span class="intranet-island-otp-push-sms__description">
					<div v-html="phoneMessage"></div>
				</span>
				<VerificationCode
					:code="code"
					:isPhoneCode=true
					:error="errorMessage"
					@code-change="onCodeChange"
					@code-complete="onCodeComplete"
				></VerificationCode>

				<div class="intranet-island-otp-push-sms__resend">
					<span v-if="isResendSmsAvailable" class="intranet-island-otp-push__link" @click="resendSendSmsCode">
						{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_SMS_RESEND') }}
					</span>
					<span v-if="isCountdownVisible" class="intranet-island-otp-push-sms__countdown">
						{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_SMS_COUNTDOWN', {'#SEC#': this.countdown}) }}
					</span>
				</div>

				<button
					class="intranet-text-btn intranet-text-btn__reg ui-btn ui-btn-lg ui-btn-success --wide"
					type="submit"
					@click="onSubmitForm($event)"
				>
						<span class="intranet-text-btn__content-wrapper">
							{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONTINUE_BUTTON') }}
						</span>
					<span class="intranet-text-btn__spinner" v-show="isWaiting"></span>
				</button>
			</div>

			<template v-if="captchaCode">
				<captcha
					v-show="isCaptchaBlockVisible"
					:captchaCode="captchaCode"
				></captcha>
			</template>
		</form>
	`
	};

	const CHARACTER_CHANGE = 'char-change';
	const VALUE_PASTE = 'value-paste';

	// @vue/component
	const AlphanumericInput = {
	  props: {
	    charValue: {
	      type: String,
	      default: ''
	    },
	    error: {
	      type: String,
	      default: ''
	    },
	    isFocused: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: [CHARACTER_CHANGE, VALUE_PASTE],
	  data() {
	    return {
	      inputValue: this.charValue
	    };
	  },
	  computed: {
	    inputClass() {
	      return `intranet-char-input${this.error ? ' --error' : ''}`;
	    }
	  },
	  watch: {
	    charValue(newValue) {
	      this.inputValue = newValue;
	    },
	    isFocused(newValue) {
	      if (newValue) {
	        this.$nextTick(() => {
	          var _this$$refs$input, _this$$refs$input2;
	          (_this$$refs$input = this.$refs.input) == null ? void 0 : _this$$refs$input.focus();
	          (_this$$refs$input2 = this.$refs.input) == null ? void 0 : _this$$refs$input2.select();
	        });
	      }
	    }
	  },
	  methods: {
	    onInput(event) {
	      const newValue = event.target.value;
	      const lastChar = newValue.slice(-1);
	      if (this.isValidCharacter(lastChar)) {
	        this.inputValue = lastChar;
	        this.$emit(CHARACTER_CHANGE, this.inputValue);
	      }
	    },
	    onPaste(event) {
	      event.preventDefault();
	      const pastedValue = event.clipboardData.getData('text');
	      this.$emit(VALUE_PASTE, pastedValue);
	    },
	    onKeyDown(event) {
	      if (!this.isAllowedKey(event)) {
	        event.preventDefault();
	        return;
	      }
	      if (event.key === 'Backspace') {
	        this.inputValue = '';
	        this.$emit(CHARACTER_CHANGE, '');
	      }
	    },
	    isValidCharacter(char) {
	      return /^[\dA-Za-z]$/.test(char);
	    },
	    isAllowedKey(event) {
	      const key = event.key;
	      if (key === 'Backspace') {
	        return true;
	      }
	      return this.isValidCharacter(key);
	    },
	    onClick() {
	      this.$emit('click');
	    }
	  },
	  template: `
		<input
		  ref="input"
		  type="text"
		  :class="inputClass"
		  :value="inputValue"
		  maxlength="1"
		  @input="onInput"
		  @paste="onPaste"
		  @keydown="onKeyDown"
		  @click="onClick"
		/>
	`
	};

	const CODE_CHANGE$1 = 'code-change';
	const CODE_COMPLETE$1 = 'code-complete';

	// @vue/component
	const RecoveryCodeInput = {
	  components: {
	    AlphanumericInput
	  },
	  props: {
	    code: {
	      type: String,
	      required: true
	    },
	    codeLength: {
	      type: Number,
	      default: 8
	    },
	    separatorPosition: {
	      type: Number,
	      default: 4
	    },
	    separator: {
	      type: String,
	      default: '-'
	    },
	    error: {
	      type: String,
	      default: ''
	    }
	  },
	  emits: [CODE_CHANGE$1, CODE_COMPLETE$1],
	  data() {
	    return {
	      codeArray: [],
	      focusIndex: -1
	    };
	  },
	  computed: {
	    isCodeComplete() {
	      return this.codeArray.length === this.codeLength && this.codeArray.every(char => char !== '');
	    }
	  },
	  watch: {
	    code(newValue) {
	      this.fillCodeArrayFromCode(newValue);
	    }
	  },
	  created() {
	    this.fillCodeArrayFromCode(this.code);
	  },
	  mounted() {
	    this.focusIndex = 0;
	  },
	  methods: {
	    fillCodeArrayFromCode(code) {
	      const cleanCode = code.replace(this.separator, '');
	      for (let i = 0; i < this.codeLength; i++) {
	        this.codeArray[i] = cleanCode.length > i ? cleanCode[i] : '';
	      }
	    },
	    onCharacterChange(changedIndex, newValue) {
	      this.updateCodeCharacter(changedIndex, newValue);
	      if (newValue === '') {
	        this.focusPreviousInput(changedIndex);
	      } else {
	        this.focusNextInput(changedIndex);
	      }
	      const formattedCode = this.getFormattedCode();
	      this.$emit(CODE_CHANGE$1, formattedCode);
	      if (this.isCodeComplete) {
	        this.$emit(CODE_COMPLETE$1, formattedCode);
	      }
	    },
	    updateCodeCharacter(changedIndex, newValue) {
	      if (changedIndex >= 0 && changedIndex < this.codeArray.length) {
	        this.codeArray[changedIndex] = newValue.toLowerCase();
	      }
	    },
	    focusPreviousInput(changedIndex) {
	      const previousIndex = changedIndex - 1;
	      if (previousIndex >= 0) {
	        this.focusIndex = previousIndex;
	      }
	    },
	    focusNextInput(changedIndex) {
	      const nextIndex = changedIndex + 1;
	      if (nextIndex < this.codeLength) {
	        this.focusIndex = nextIndex;
	      }
	    },
	    getFormattedCode() {
	      const code = this.codeArray.join('');
	      if (code.length > this.separatorPosition) {
	        return code.slice(0, Math.max(0, this.separatorPosition)) + this.separator + code.slice(Math.max(0, this.separatorPosition));
	      }
	      return code;
	    },
	    onPaste(pastedValue) {
	      const cleanValue = pastedValue.replaceAll(/[^\dA-Za-z]/g, '').toLowerCase();
	      if (this.isValidRecoveryCode(cleanValue)) {
	        this.fillCodeArrayFromCode(cleanValue);
	      } else if (this.isSingleCharacter(pastedValue) && this.focusIndex >= 0) {
	        this.codeArray[this.focusIndex] = pastedValue.toLowerCase();
	      }
	      const formattedCode = this.getFormattedCode();
	      this.$emit(CODE_CHANGE$1, formattedCode);
	      if (this.isCodeComplete) {
	        this.$emit(CODE_COMPLETE$1, formattedCode);
	      }
	    },
	    isValidRecoveryCode(someCode) {
	      const codeRegExp = new RegExp(`^[a-zA-Z0-9]{${this.codeLength}}$`);
	      return codeRegExp.test(someCode);
	    },
	    isSingleCharacter(someValue) {
	      return /^[\dA-Za-z]$/.test(someValue);
	    },
	    onClick(inputIndex) {
	      this.focusIndex = inputIndex;
	    }
	  },
	  template: `
		<div class="intranet-verification-code --recovery-codes">
			<alphanumeric-input
				v-for="charPos in codeLength"
				class="intranet-verification-code__char"
				:key="charPos"
				:is-focused="focusIndex === (charPos - 1)"
				:error="error"
				:char-value="codeArray[charPos - 1] ?? ''"
				@value-paste="onPaste"
				@click="onClick(charPos - 1)"
				@char-change="onCharacterChange(charPos - 1, $event)"
			/>
		</div>
	`
	};

	// @vue/component
	const RecoveryCodes = {
	  components: {
	    RecoveryCodeInput,
	    Captcha,
	    Headline: ui_system_typography_vue.Headline
	  },
	  props: {
	    rootNode: {
	      type: HTMLElement,
	      default: null
	    },
	    authUrl: {
	      type: String,
	      required: true
	    },
	    captchaCode: {
	      type: String,
	      default: ''
	    },
	    recoveryCodesHelpLink: {
	      type: String,
	      default: ''
	    },
	    errorMessage: {
	      type: String,
	      default: null
	    }
	  },
	  data() {
	    return {
	      isWaiting: false,
	      recoveryCode: '',
	      isRecoveryCodeBlockVisible: true,
	      isCaptchaBlockVisible: false
	    };
	  },
	  mounted() {
	    BX.UI.Hint.init(this.rootNode);
	    ui_analytics.sendData({
	      tool: 'security',
	      category: 'fa_auth_form',
	      event: 'form_code_show'
	    });
	  },
	  methods: {
	    ...useOtpCaptchaFlow({
	      mainBlockVisibleKey: 'isRecoveryCodeBlockVisible'
	    }),
	    onSubmitForm(event) {
	      this.handleFormSubmit(event);
	    },
	    onRecoveryCodeChange(code) {
	      this.recoveryCode = code;
	    },
	    onRecoveryCodeComplete(code) {
	      this.recoveryCode = code;
	      this.handleCodeComplete(code);
	    },
	    showAlternativeMethods() {
	      this.$emit('clear-errors');
	      this.$emit('show-alternatives');
	    }
	  },
	  template: `
		<form ref="authForm" name="form_auth" method="post" target="_top" :action="authUrl">
			<input type="hidden" name="AUTH_FORM" value="Y" />
			<input type="hidden" name="TYPE" value="OTP"/>
			<input type="hidden" name="USER_OTP" :value="recoveryCode"/>
			<input type="hidden" name="CURRENT_STEP" value="recoveryCodes"/>
			<input type="hidden" name="sessid" :value="this.$Bitrix.Loc.getMessage('bitrix_sessid')"/>

			<div v-show="isRecoveryCodeBlockVisible" class="intranet-island-otp-push-recovery-codes__wrapper">
				<div @click="showAlternativeMethods" class="intranet-back-button">
					<i class="ui-icon-set --arrow-left-l intranet-back-button__arrow --recovery"></i>
				</div>

				<Headline size='lg' class="intranet-form-title --padding">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONFIRM_LOGIN') }}
				</Headline>
				<span class="intranet-island-otp-push-recovery-codes__description">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_INPUT_RECOVERY_CODE') }}
				</span>
				<a class="intranet-island-otp-push__link --underline" :href="recoveryCodesHelpLink" target="_blank">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_MORE') }}
				</a>
				<RecoveryCodeInput 
					:code="recoveryCode"
					:error="errorMessage"
					@code-change="onRecoveryCodeChange"
					@code-complete="onRecoveryCodeComplete"
				></RecoveryCodeInput>
				<div class="intranet-otp-error-block" v-html="errorMessage"></div>

				<button
					class="intranet-text-btn intranet-text-btn__reg ui-btn ui-btn-lg ui-btn-success --wide"
					type="submit"
					@click="onSubmitForm($event)"
				>
						<span class="intranet-text-btn__content-wrapper">
							{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONTINUE_BUTTON') }}
						</span>
					<span class="intranet-text-btn__spinner" v-show="isWaiting"></span>
				</button>
			</div>

			<template v-if="captchaCode">
				<captcha
					v-show="isCaptchaBlockVisible"
					:captchaCode="captchaCode"
				></captcha>
			</template>
		</form>
	`
	};

	const useRecoverAccessStore = ui_vue3_pinia.defineStore('recoverAccess', {
	  state: () => ({
	    isRequesting: false,
	    isRequestSent: false,
	    requestTimestamp: null
	  }),
	  actions: {
	    setRequesting(value) {
	      this.isRequesting = value;
	    },
	    setRequestSent(timestamp = Date.now()) {
	      this.isRequestSent = true;
	      this.requestTimestamp = timestamp;
	    },
	    resetState() {
	      this.isRequesting = false;
	      this.isRequestSent = false;
	      this.requestTimestamp = null;
	    }
	  }
	});

	// @vue/component
	const RecoverAccess = {
	  components: {
	    Headline: ui_system_typography_vue.Headline,
	    UIButton: ui_vue3_components_button.Button
	  },
	  setup() {
	    const store = useRecoverAccessStore();
	    return {
	      store,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonState: ui_vue3_components_button.ButtonState,
	      Outline: ui_iconSet_api_core.Outline
	    };
	  },
	  props: {
	    signedUserId: {
	      type: String,
	      default: ''
	    },
	    isAlternativeMethodsAvailable: {
	      type: Boolean,
	      default: false
	    },
	    canSendRequestRecoverAccess: {
	      type: Boolean,
	      default: true
	    }
	  },
	  computed: {
	    isRequesting() {
	      return this.store.isRequesting;
	    },
	    isRequestSent() {
	      return this.store.isRequestSent;
	    }
	  },
	  mounted() {
	    ui_analytics.sendData({
	      tool: 'security',
	      category: 'fa_auth_form',
	      event: 'restore_access_show'
	    });
	  },
	  methods: {
	    showAlternatives() {
	      if (this.isAlternativeMethodsAvailable) {
	        this.$emit('show-alternatives');
	      } else {
	        this.$emit('back-to-push');
	      }
	    },
	    requestAccess() {
	      this.store.setRequesting(true);
	      Ajax.sendRequestRecoverAccess(this.signedUserId).then(() => {
	        this.store.setRequestSent();
	        this.store.setRequesting(false);
	      }).catch(() => {
	        this.store.setRequesting(false);
	      });
	      ui_analytics.sendData({
	        tool: 'security',
	        category: 'fa_auth_form',
	        event: 'click_admin_restore_access'
	      });
	    },
	    resetSessionAndReload() {
	      this.store.setRequesting(true);
	      ui_analytics.sendData({
	        tool: 'security',
	        category: 'fa_auth_form',
	        event: 'click_reload_after_restore_access'
	      });
	      Ajax.resetOtpSession().then(() => {
	        location.reload();
	      }).catch(() => {
	        location.reload();
	      });
	    }
	  },
	  template: `
		<div class="intranet-island-otp-recover-access__wrapper">
			<div @click="showAlternatives" class="intranet-back-button">
				<i class="ui-icon-set --arrow-left-l intranet-back-button__arrow --alternative"></i>
			</div>
			<template v-if="isRequestSent || !canSendRequestRecoverAccess">
				<div class="intranet-island-otp-recover-access__icon --request-sent"></div>
				<Headline size='lg' class="intranet-form-title">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_REQUEST_SENT_TITLE') }}
				</Headline>
				<div class="intranet-island-otp-recover-access__description --width">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_REQUEST_SENT_DESCRIPTION') }}
				</div>
				<UIButton
					:text="this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_REQUEST_SENT_BUTTON')"
					:size="ButtonSize.EXTRA_LARGE"
					:style="AirButtonStyle.FILLED"
					:leftIcon="Outline.REFRESH"
					:state="isRequesting ? ButtonState.WAITING : ButtonState.ACTIVE"
					:wide="true"
					@click="resetSessionAndReload"
				/>
			</template>
			<template v-else>
				<div class="intranet-island-otp-recover-access__icon --request"></div>
				<Headline size='lg' class="intranet-form-title">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_REQUEST_TITLE') }}
				</Headline>
				<div class="intranet-island-otp-recover-access__description --width">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_REQUEST_DESCRIPTION') }}
				</div>
				<UIButton
					:text="this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_REQUEST_BUTTON')"
					:size="ButtonSize.EXTRA_LARGE"
					:style="AirButtonStyle.FILLED"
					:state="isRequesting ? ButtonState.WAITING : ButtonState.ACTIVE"
					:wide="true"
					@click="requestAccess"
				/>
			</template>
		</div>
	`
	};

	const ApplicationOfflineCode = {
	  components: {
	    Captcha,
	    Headline: ui_system_typography_vue.Headline,
	    VerificationCode
	  },
	  props: {
	    authUrl: {
	      type: String,
	      required: true
	    },
	    errorMessage: {
	      type: String,
	      default: null
	    },
	    captchaCode: {
	      type: String,
	      default: ''
	    }
	  },
	  data() {
	    return {
	      isWaiting: false,
	      isCaptchaBlockVisible: false,
	      isMainBlockVisible: true,
	      code: ''
	    };
	  },
	  methods: {
	    ...useOtpCaptchaFlow({
	      mainBlockVisibleKey: 'isMainBlockVisible'
	    }),
	    onSubmitForm(event) {
	      this.handleFormSubmit(event);
	    },
	    onCodeChange(code) {
	      this.code = code;
	    },
	    onCodeComplete(code) {
	      this.code = code;
	      this.handleCodeComplete(code);
	    },
	    showAlternativeMethods() {
	      this.$emit('clear-errors');
	      this.$emit('show-alternatives');
	    },
	    getStep3Text() {
	      return this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_APPLICATION_OFFLINE_CODE_STEP_3', {
	        '#MORE_ICON#': "<div class='intranet-island-otp-offline-code__icon-more'><i class='ui-icon-set --more-l'></i></div>"
	      });
	    }
	  },
	  template: `
		<form ref="authForm" name="form_auth" method="post" target="_top" :action="authUrl">
			<input type="hidden" name="AUTH_FORM" value="Y" />
			<input type="hidden" name="TYPE" value="OTP" />
			<input type="hidden" name="USER_OTP" :value="code"/>
			<input type="hidden" name="CURRENT_STEP" value="applicationOfflineCode"/>
			<input type="hidden" name="sessid" :value="this.$Bitrix.Loc.getMessage('bitrix_sessid')"/>

			<div v-show="isMainBlockVisible" class="intranet-island-otp-push__wrapper">
				<div @click="showAlternativeMethods" class="intranet-back-button">
					<i class="ui-icon-set --arrow-left-l intranet-back-button__arrow --offline-code"></i>
				</div>
				<Headline size='lg' class="intranet-form-title">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONFIRM_LOGIN') }}
				</Headline>
				<div class="intranet-island-otp-offline-code__main-content">
					<div class="intranet-island-otp-offline-code__description">
						<div class="intranet-island-otp-offline-code__steps">
							<div class="intranet-island-otp-offline-code__step">
								<div class="intranet-island-otp-offline-code-step__number">
									1
								</div>
								<div class="intranet-island-otp-offline-code-step__title">
									{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_APPLICATION_OFFLINE_CODE_STEP_1') }}
								</div>
							</div>
							<div class="intranet-island-otp-offline-code__step">
								<div class="intranet-island-otp-offline-code-step__number">
									2
								</div>
								<div class="intranet-island-otp-offline-code-step__title">
									{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_APPLICATION_OFFLINE_CODE_STEP_2') }}
								</div>
							</div>
							<div class="intranet-island-otp-offline-code__step">
								<div class="intranet-island-otp-offline-code-step__number">
									3
								</div>
								<div v-html="getStep3Text()" class="intranet-island-otp-offline-code-step__title"></div>
							</div>
						</div>
						<VerificationCode
							:code="code"
							:label="this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_APPLICATION_OFFLINE_CODE_INPUT_LABEL')"
							:isPhoneCode=true
							:enableSpacing=false
							:error="errorMessage"
							@code-change="onCodeChange"
							@code-complete="onCodeComplete"
						></VerificationCode>
					</div>
					<div class='intranet-island-otp-push__arrow --offline-code'></div>
					<div class="intranet-island-otp-offline-code__mobile"></div>
					<div class="intranet-island-otp-offline-code__button-wrapper">
						<button
							class="intranet-text-btn intranet-text-btn__reg ui-btn ui-btn-lg ui-btn-success --wide"
							type="submit"
							@click="onSubmitForm($event)"
						>
							<span class="intranet-text-btn__content-wrapper">
								{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CONTINUE_BUTTON') }}
							</span>
							<span class="intranet-text-btn__spinner" v-show="isWaiting"></span>
						</button>
					</div>
				</div>
			</div>

			<template v-if="captchaCode">
				<captcha
					v-show="isCaptchaBlockVisible"
					:captchaCode="captchaCode"
				></captcha>
			</template>
		</form>
	`
	};

	// @vue/component
	const Main = {
	  components: {
	    LegacyOtp,
	    PushOtp,
	    AlternativeMethods,
	    ApplicationOfflineCode,
	    Sms,
	    RecoveryCodes,
	    RecoverAccess,
	    Captcha
	  },
	  props: {
	    signedUserId: {
	      type: String,
	      default: ''
	    },
	    rootNode: {
	      type: HTMLElement,
	      default: null
	    },
	    pushOtpConfig: {
	      type: Object,
	      default: null
	    },
	    authUrl: {
	      type: String,
	      default: ''
	    },
	    authOtpHelpLink: {
	      type: String,
	      default: ''
	    },
	    authLoginUrl: {
	      type: String,
	      default: ''
	    },
	    rememberOtp: {
	      type: Boolean,
	      default: false
	    },
	    captchaCode: {
	      type: String,
	      default: ''
	    },
	    notShowLinks: {
	      type: Boolean,
	      default: false
	    },
	    isBitrix24: {
	      type: Boolean,
	      default: false
	    },
	    canLoginBySms: {
	      type: Boolean,
	      default: false
	    },
	    isRecoveryCodesEnabled: {
	      type: Boolean,
	      default: false
	    },
	    maskedUserAuthPhoneNumber: {
	      type: String,
	      default: ''
	    },
	    userDevice: {
	      type: Object,
	      default: null
	    },
	    userData: {
	      type: Object,
	      default: null
	    },
	    accountChangeUrl: {
	      type: String,
	      default: ''
	    },
	    currentStep: {
	      type: String,
	      default: ''
	    },
	    recoveryCodesHelpLink: {
	      type: String,
	      default: ''
	    },
	    errorMessageText: {
	      type: String,
	      default: null
	    },
	    canSendRequestRecoverAccess: {
	      type: Boolean,
	      default: true
	    }
	  },
	  setup() {
	    const pushOtpStore = usePushOtpStore();
	    return {
	      pushOtpStore
	    };
	  },
	  data() {
	    let currentStep = 'legacy';
	    if (this.pushOtpConfig) {
	      var _this$currentStep;
	      currentStep = (_this$currentStep = this.currentStep) != null ? _this$currentStep : 'push';
	    }
	    return {
	      isWaiting: false,
	      errorMessage: this.errorMessageText,
	      currentAuthStep: currentStep,
	      isAlternativeMethodsAvailable: this.canLoginBySms || this.isRecoveryCodesEnabled,
	      pullClient: null,
	      pendingOtpCode: null
	    };
	  },
	  computed: {
	    currentComponent() {
	      const components = {
	        legacy: 'LegacyOtp',
	        push: 'PushOtp',
	        alternative: 'AlternativeMethods',
	        sms: 'Sms',
	        recoveryCodes: 'RecoveryCodes',
	        recoverAccess: 'RecoverAccess',
	        applicationOfflineCode: 'ApplicationOfflineCode'
	      };
	      return components[this.currentAuthStep] || 'LegacyOtp';
	    }
	  },
	  mounted() {
	    if (this.pushOtpConfig) {
	      const cooldownSeconds = this.pushOtpStore.getCooldownSeconds(this.pushOtpConfig);
	      this.pushOtpStore.initCooldown(cooldownSeconds);
	      this.initPushOtpSubscription();
	    }
	  },
	  beforeUnmount() {
	    this.pushOtpStore.stopCooldown();
	  },
	  methods: {
	    onSubmitForm() {
	      this.isWaiting = true;
	    },
	    onShowAlternatives() {
	      this.currentAuthStep = 'alternative';
	    },
	    onShowSms() {
	      this.currentAuthStep = 'sms';
	    },
	    onShowRecoveryCodes() {
	      this.currentAuthStep = 'recoveryCodes';
	    },
	    onShowRecoverAccess() {
	      this.currentAuthStep = 'recoverAccess';
	    },
	    onApplicationOfflineCode() {
	      this.currentAuthStep = 'applicationOfflineCode';
	    },
	    onBackToPush() {
	      this.currentAuthStep = 'push';
	    },
	    onBackToLegacy() {
	      this.currentAuthStep = 'legacy';
	    },
	    onClearErrors() {
	      this.errorMessage = '';
	    },
	    initPushOtpSubscription() {
	      if (!this.pushOtpConfig) {
	        return;
	      }
	      this.pullClient = new pull_client.PullClient();
	      this.pullClient.subscribe({
	        moduleId: 'security',
	        command: 'pushOtpCode',
	        callback: params => {
	          this.handlePushOtpCode(params);
	        }
	      });
	      try {
	        this.pullClient.start(this.pushOtpConfig.pullConfig);
	      } catch (error) {
	        console.error('Push OTP pull start failed', error);
	      }
	    },
	    handlePushOtpCode(params) {
	      var _this$$refs, _authComponent$$refs$, _authComponent$$refs, _document$forms;
	      const code = params == null ? void 0 : params.code;
	      if (!code) {
	        return;
	      }
	      const authComponent = (_this$$refs = this.$refs) == null ? void 0 : _this$$refs.authComponent;
	      const form = (_authComponent$$refs$ = authComponent == null ? void 0 : (_authComponent$$refs = authComponent.$refs) == null ? void 0 : _authComponent$$refs.authForm) != null ? _authComponent$$refs$ : main_core.Type.isUndefined(document) ? null : (_document$forms = document.forms) == null ? void 0 : _document$forms.form_auth;
	      if (this.applyOtpCode(code, authComponent, form)) {
	        return;
	      }
	      this.pendingOtpCode = code;
	      this.currentAuthStep = 'push';
	      this.$nextTick(() => {
	        var _this$$refs2, _pushComponent$$refs$, _pushComponent$$refs, _document$forms2;
	        const pushComponent = (_this$$refs2 = this.$refs) == null ? void 0 : _this$$refs2.authComponent;
	        const pushForm = (_pushComponent$$refs$ = pushComponent == null ? void 0 : (_pushComponent$$refs = pushComponent.$refs) == null ? void 0 : _pushComponent$$refs.authForm) != null ? _pushComponent$$refs$ : main_core.Type.isUndefined(document) ? null : (_document$forms2 = document.forms) == null ? void 0 : _document$forms2.form_auth;
	        this.applyOtpCode(this.pendingOtpCode, pushComponent, pushForm);
	        this.pendingOtpCode = null;
	      });
	    },
	    applyOtpCode(code, componentRef, formRef) {
	      if (!formRef || !formRef.USER_OTP) {
	        return false;
	      }
	      formRef.USER_OTP.value = code;
	      const hasCaptcha = Boolean(this.captchaCode);
	      if (hasCaptcha && componentRef != null && componentRef.showCaptcha) {
	        componentRef.showCaptcha();
	        return true;
	      }
	      formRef.submit();
	      return true;
	    }
	  },
	  template: `
		<component
		 :is="currentComponent"
		 ref="authComponent"
		 :authUrl="authUrl"
		 :authOtpHelpLink="authOtpHelpLink"
		 :authLoginUrl="authLoginUrl"
		 :rememberOtp="rememberOtp"
		 :captchaCode="captchaCode"
		 :notShowLinks="notShowLinks"
		 :isBitrix24="isBitrix24"
		 :canLoginBySms="canLoginBySms"
		 :isRecoveryCodesEnabled="isRecoveryCodesEnabled"
		 :maskedUserAuthPhoneNumber="maskedUserAuthPhoneNumber"
		 :userDevice="userDevice"
		 :userData="userData"
		 :accountChangeUrl="accountChangeUrl"
		 :pushOtpConfig="pushOtpConfig"
		 :recoveryCodesHelpLink="recoveryCodesHelpLink"
		 :errorMessage="errorMessage"
		 :isAlternativeMethodsAvailable="isAlternativeMethodsAvailable"
		 :signedUserId="signedUserId"
		 :canSendRequestRecoverAccess="canSendRequestRecoverAccess"
		 @form-submit="onSubmitForm"
		 @show-alternatives="onShowAlternatives"
		 @back-to-push="onBackToPush"
		 @back-to-legacy="onBackToLegacy"
		 @show-sms="onShowSms"
		 @show-recovery-codes="onShowRecoveryCodes"
		 @show-recover-access="onShowRecoverAccess"
		 @application-offline-code="onApplicationOfflineCode"
		 @clear-errors="onClearErrors"
		/>
	`
	};

	var _rootNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("rootNode");
	var _application = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("application");
	class OtpAuth {
	  static init(params) {
	    babelHelpers.classPrivateFieldLooseBase(this, _rootNode)[_rootNode] = params.containerNode;
	    if (!main_core.Type.isDomNode(babelHelpers.classPrivateFieldLooseBase(this, _rootNode)[_rootNode])) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = ui_vue3.BitrixVue.createApp(Main, {
	      signedUserId: params.signedUserId,
	      rootNode: babelHelpers.classPrivateFieldLooseBase(this, _rootNode)[_rootNode],
	      pushOtpConfig: params.pushOtpConfig,
	      authUrl: params.authUrl,
	      authOtpHelpLink: params.authOtpHelpLink,
	      authLoginUrl: params.authLoginUrl,
	      rememberOtp: params.rememberOtp,
	      captchaCode: params.captchaCode,
	      notShowLinks: params.notShowLinks,
	      canLoginBySms: params.canLoginBySms,
	      isRecoveryCodesEnabled: params.isRecoveryCodesEnabled,
	      maskedUserAuthPhoneNumber: params.maskedUserAuthPhoneNumber,
	      userDevice: params.userDevice,
	      userData: params.userData,
	      accountChangeUrl: params.accountChangeUrl,
	      currentStep: params.currentStep,
	      recoveryCodesHelpLink: params.recoveryCodesHelpLink,
	      errorMessageText: params.errorMessage,
	      canSendRequestRecoverAccess: params.canSendRequestRecoverAccess
	    });
	    const pinia = ui_vue3_pinia.createPinia();
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application].use(pinia);
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application].mount(babelHelpers.classPrivateFieldLooseBase(this, _rootNode)[_rootNode]);
	  }
	}
	Object.defineProperty(OtpAuth, _rootNode, {
	  writable: true,
	  value: void 0
	});
	Object.defineProperty(OtpAuth, _application, {
	  writable: true,
	  value: void 0
	});

	exports.OtpAuth = OtpAuth;

}((this.BX.Intranet.Login = this.BX.Intranet.Login || {}),BX.Vue3,BX,BX,BX.Vue3.Components,BX.UI.IconSet,BX.UI.Analytics,BX.Vue3.Pinia,BX.UI.System.Typography.Vue));
//# sourceMappingURL=otp.bundle.js.map
