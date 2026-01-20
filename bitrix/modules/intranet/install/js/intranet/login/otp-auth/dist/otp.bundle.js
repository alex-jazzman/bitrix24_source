/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports,ui_vue3,main_core,ui_system_typography_vue,ui_analytics) {
	'use strict';

	// @vue/component
	const LegacyOtp = {
	  components: {
	    Headline: ui_system_typography_vue.Headline
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
	    errorMessage: {
	      type: String,
	      default: null
	    }
	  },
	  data() {
	    return {
	      isWaiting: false,
	      csrfToken: null
	    };
	  },
	  mounted() {
	    if (this.$refs.modalInput) {
	      this.$refs.modalInput.focus();
	    }
	  },
	  methods: {
	    onSubmitForm() {
	      this.isWaiting = true;
	      this.$emit('form-submit');
	    }
	  },
	  template: `
		<form name="form_auth" method="post" target="_top" :action="authUrl">
			<input type="hidden" name="AUTH_FORM" value="Y" />
			<input type="hidden" name="TYPE" value="OTP" />
			<input type="hidden" name="sessid" :value="this.$Bitrix.Loc.getMessage('bitrix_sessid')" />

			<div class="intranet-island-otp-push-legacy-otp__wrapper">
				<Headline size='lg' class="intranet-form-title">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_TITLE') }}
				</Headline>
				<div class="intranet-login-enter-form intranet-logging-in__login-form">
					<div v-if="errorMessage" class="intranet-login-error-block" v-html="errorMessage"></div>
					<div class="intranet-login-enter-form__login-wrapper">
						<div class="intranet-text-input intranet-login-enter-form__login">
							<input
								type="text"
								name="USER_OTP"
								class="ui-ctl-element intranet-text-input__field"
								maxlength="50"
								value=""
								autocomplete="off"
								:placeholder="this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_PLACEHOLDER')"
								ref="modalInput"
							/>
						</div>
	
						<template v-if="captchaCode">
							<Headline size='sm' class="intranet-form-title --vertical-padding">
								{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CAPTCHA_PROMT') }}
							</Headline>
							<div class="intranet-text-captcha_item">
								<input type="hidden" name="captcha_sid" :value="captchaCode" />
								<img :src="'/bitrix/tools/captcha.php?captcha_sid=' + captchaCode" width="180" height="40" alt="CAPTCHA" />
							</div>
							<div class="intranet-text-input intranet-login-enter-form__login">
								<input
									type="text"
									name="captcha_word"
									:placeholder="this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_CAPTCHA_PROMT')"
									maxlength="50"
									value=""
									autocomplete="off"
									class="ui-ctl-element intranet-text-input__field"
								/>
							</div>
						</template>
					</div>
					<button
						class="intranet-text-btn intranet-text-btn__reg ui-btn ui-btn-lg ui-btn-success"
						type="submit"
						@click="onSubmitForm"
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
		</form>
	`
	};

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
	}

	// @vue/component

	const PushOtp = {
	  components: {
	    Captcha,
	    Headline: ui_system_typography_vue.Headline
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
	      default: null
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
	    return {
	      isPushBlockVisible: true,
	      isCaptchaBlockVisible: false,
	      isUserDeviceVisible: Object.keys(this.userDevice).length > 0,
	      isPushDisabled: true,
	      cooldownSecondsLeft: 0,
	      cooldownIntervalId: null
	    };
	  },
	  computed: {
	    deviceIconClass() {
	      return `intranet-island-otp__device-icon--${this.userDevice.icon}`;
	    },
	    isCountdownVisible() {
	      return this.isPushDisabled && this.cooldownSecondsLeft > 0;
	    }
	  },
	  mounted() {
	    if (this.pushOtpConfig) {
	      this.initPushOtp();
	    }
	    const storedCooldownSeconds = this.readCooldownSecondsLeft();
	    if (storedCooldownSeconds > 0) {
	      this.startCooldown(storedCooldownSeconds, false);
	    } else if (this.wasCooldownInitialized()) {
	      this.isPushDisabled = false;
	      this.cooldownSecondsLeft = 0;
	      this.clearCooldownDeadline();
	    } else {
	      const initialCooldown = this.getCooldownSeconds();
	      if (initialCooldown > 0) {
	        this.startCooldown(initialCooldown);
	      } else {
	        this.isPushDisabled = false;
	        this.cooldownSecondsLeft = 0;
	      }
	    }
	    ui_analytics.sendData({
	      tool: 'security',
	      category: 'fa_auth_form',
	      event: 'show'
	    });
	  },
	  beforeUnmount() {
	    this.stopCooldownTimer();
	  },
	  methods: {
	    repeatPush() {
	      if (this.isPushDisabled || !this.pushOtpConfig) {
	        return;
	      }
	      Ajax.sendMobilePush(this.pushOtpConfig.channelTag).then(() => {
	        this.startCooldown(this.getCooldownSeconds());
	      }).catch(() => {
	        this.startCooldown(this.getCooldownSeconds());
	      });
	    },
	    getCooldownSeconds() {
	      var _this$pushOtpConfig;
	      const defaultCooldown = 5;
	      const seconds = Number((_this$pushOtpConfig = this.pushOtpConfig) == null ? void 0 : _this$pushOtpConfig.cooldownSeconds);
	      return Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : defaultCooldown;
	    },
	    startCooldown(seconds, shouldPersist = true) {
	      const cooldown = Number(seconds);
	      if (!cooldown || cooldown <= 0) {
	        this.stopCooldownTimer();
	        this.isPushDisabled = false;
	        this.cooldownSecondsLeft = 0;
	        this.clearCooldownDeadline();
	        return;
	      }
	      this.cooldownSecondsLeft = Math.floor(cooldown);
	      this.isPushDisabled = true;
	      if (shouldPersist) {
	        this.saveCooldownDeadline(this.cooldownSecondsLeft);
	      }
	      this.markCooldownInitialized();
	      this.stopCooldownTimer();
	      this.cooldownIntervalId = setInterval(() => {
	        if (this.cooldownSecondsLeft <= 1) {
	          this.stopCooldownTimer();
	          this.cooldownSecondsLeft = 0;
	          this.isPushDisabled = false;
	          this.clearCooldownDeadline();
	          return;
	        }
	        this.cooldownSecondsLeft -= 1;
	      }, 1000);
	    },
	    stopCooldownTimer() {
	      if (this.cooldownIntervalId) {
	        clearInterval(this.cooldownIntervalId);
	        this.cooldownIntervalId = null;
	      }
	    },
	    getCooldownStorageKey() {
	      var _this$pushOtpConfig$c, _this$pushOtpConfig2;
	      const channelTag = (_this$pushOtpConfig$c = (_this$pushOtpConfig2 = this.pushOtpConfig) == null ? void 0 : _this$pushOtpConfig2.channelTag) != null ? _this$pushOtpConfig$c : 'default';
	      return `intranet:push-otp:cooldown:${channelTag}`;
	    },
	    getCooldownInitKey() {
	      return `${this.getCooldownStorageKey()}:initialized`;
	    },
	    isStorageAvailable() {
	      try {
	        var _window;
	        return Boolean((_window = window) == null ? void 0 : _window.localStorage);
	      } catch {
	        return false;
	      }
	    },
	    markCooldownInitialized() {
	      if (!this.isStorageAvailable()) {
	        return;
	      }
	      try {
	        window.localStorage.setItem(this.getCooldownInitKey(), '1');
	      } catch (error) {
	        console.error(error);
	      }
	    },
	    wasCooldownInitialized() {
	      if (!this.isStorageAvailable()) {
	        return false;
	      }
	      try {
	        return window.localStorage.getItem(this.getCooldownInitKey()) === '1';
	      } catch (error) {
	        console.error(error);
	      }
	      return false;
	    },
	    saveCooldownDeadline(seconds) {
	      if (!this.isStorageAvailable()) {
	        return;
	      }
	      const deadline = Date.now() + Number(seconds) * 1000;
	      try {
	        window.localStorage.setItem(this.getCooldownStorageKey(), String(deadline));
	      } catch (error) {
	        console.error(error);
	      }
	    },
	    readCooldownSecondsLeft() {
	      if (!this.isStorageAvailable()) {
	        return 0;
	      }
	      try {
	        const storedValue = Number(window.localStorage.getItem(this.getCooldownStorageKey()));
	        if (!Number.isFinite(storedValue)) {
	          return 0;
	        }
	        const diffMs = storedValue - Date.now();
	        return diffMs > 0 ? Math.ceil(diffMs / 1000) : 0;
	      } catch (error) {
	        console.error(error);
	      }
	      return 0;
	    },
	    clearCooldownDeadline() {
	      if (!this.isStorageAvailable()) {
	        return;
	      }
	      try {
	        window.localStorage.removeItem(this.getCooldownStorageKey());
	      } catch (error) {
	        console.error(error);
	      }
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
	    showCaptcha() {
	      this.isPushBlockVisible = false;
	      this.isCaptchaBlockVisible = true;
	    },
	    initPushOtp() {
	      const BX = window.BX;
	      if (!BX || !this.pushOtpConfig) {
	        return;
	      }
	      const Pull = new BX.PullClient();
	      Pull.subscribe({
	        moduleId: 'security',
	        command: 'pushOtpCode',
	        callback: params => {
	          if (params.code) {
	            const form = document.forms.form_auth;
	            if (form && form.USER_OTP) {
	              form.USER_OTP.value = params.code;
	              if (this.captchaCode) {
	                this.showCaptcha();
	              } else {
	                form.submit();
	              }
	            }
	          }
	        }
	      });
	      Pull.start(this.pushOtpConfig.pullConfig);
	    }
	  },
	  template: `
		<form name="form_auth" method="post" target="_top" :action="authUrl">
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
							<input type="checkbox" id="OTP_REMEMBER" name="OTP_REMEMBER" value="Y" class="login-checkbox-user-remember"/>
							<label for="OTP_REMEMBER" class="login-item-checkbox-label">
								{{ this.$Bitrix.Loc.getMessage("INTRANET_AUTH_OTP_REMEMBER_ME") }}
							</label>
						</div>
					</div>
					<div class="intranet-island-otp-push__mobile"></div>
				</div>
				<div class="intranet-island-otp-push-links__wrapper">
					<span 
						class="intranet-island-otp-push__link --repeat-push" 
						:class="{ '--disabled': isPushDisabled }"
						@click="repeatPush"
					>
						{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RESEND_PUSH') }}
						<template v-if="isCountdownVisible">
							({{ cooldownSecondsLeft }})
						</template>
					</span>
					<span class="intranet-island-otp-push__link" @click="showAlternatives">
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
				<div v-if="canLoginBySms" class="intranet-island-otp-push-alternative__item" @click="showSms">
					<i class="ui-icon-set --o-sms intranet-island-otp-push-alternative-item__icon"></i>
					<span>{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_SMS') }}</span>
				</div>
				<div v-if="isRecoveryCodesEnabled" class="intranet-island-otp-push-alternative__item" @click="showRecoveryCodes">
					<i class="ui-icon-set --key intranet-island-otp-push-alternative-item__icon"></i>
					<span>{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVERY_CODES') }}</span>
				</div>
				<span class="intranet-island-otp-push__link --gray --underline" @click="showRecoverAccess">
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
			:class="inputClass"
			:class="inputExtraClasses"
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
	    DigitInput
	  },
	  props: {
	    code: {
	      type: String,
	      required: true
	    },
	    error: {
	      type: String,
	      required: true
	    },
	    // Specifies whether it should be short (4-digit) or long (6-digit) code
	    isPhoneCode: {
	      type: Boolean,
	      default: false
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
	      return this.isPhoneCode && inputIndex === this.codeLength / 2;
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
	    onSubmitForm() {
	      if (this.captchaCode) {
	        event.preventDefault();
	        this.showCaptcha();
	      } else {
	        this.isWaiting = true;
	        this.$emit('form-submit');
	      }
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
	      this.$nextTick(() => {
	        if (this.captchaCode) {
	          this.showCaptcha();
	        } else {
	          this.isWaiting = true;
	          this.$emit('form-submit');
	          if (this.$refs.authForm) {
	            this.$refs.authForm.submit();
	          }
	        }
	      });
	    },
	    showPushOtp() {
	      this.$emit('clear-errors');
	      this.$emit('back-to-push');
	    },
	    showCaptcha() {
	      this.isSmsBlockVisible = false;
	      this.isCaptchaBlockVisible = true;
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
				<div @click="showPushOtp" class="intranet-back-button">
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
				<div class="intranet-otp-error-block" v-html="errorMessage"></div>

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
					@click="onSubmitForm"
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
		<div class="intranet-verification-code">
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
	    onSubmitForm(event) {
	      if (this.captchaCode) {
	        event.preventDefault();
	        this.showCaptcha();
	      } else {
	        this.isWaiting = true;
	        this.$emit('form-submit');
	      }
	    },
	    onRecoveryCodeChange(code) {
	      this.recoveryCode = code;
	    },
	    onRecoveryCodeComplete(code) {
	      this.recoveryCode = code;
	      this.$nextTick(() => {
	        if (this.captchaCode) {
	          this.showCaptcha();
	        } else {
	          this.isWaiting = true;
	          this.$emit('form-submit');
	          if (this.$refs.authForm) {
	            this.$refs.authForm.submit();
	          }
	        }
	      });
	    },
	    showPushOtp() {
	      this.$emit('clear-errors');
	      this.$emit('back-to-push');
	    },
	    showCaptcha() {
	      this.isRecoveryCodeBlockVisible = false;
	      this.isCaptchaBlockVisible = true;
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
				<div @click="showPushOtp" class="intranet-back-button">
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

	// @vue/component
	const RecoverAccess = {
	  components: {
	    Headline: ui_system_typography_vue.Headline
	  },
	  props: {
	    isAlternativeMethodsAvailable: {
	      type: Boolean,
	      default: false
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
	    }
	  },
	  template: `
		<div class="intranet-island-otp-recover-access__wrapper">
			<Headline size='lg' class="intranet-form-title">
				{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_TITLE') }}
			</Headline>
			<div class="intranet-island-otp-recover-access__description --width">
				{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_RECOVER_ACCESS_TEXT') }}
			</div>
			<div class="intranet-island-revover-access-links__wrapper">
				<span class="intranet-island-recover-access__link" @click="showAlternatives">
					{{ this.$Bitrix.Loc.getMessage('INTRANET_AUTH_OTP_ALTERNATIVE_WAY') }}
				</span>
			</div>
		</div>
	`
	};

	// @vue/component
	const Main = {
	  components: {
	    LegacyOtp,
	    PushOtp,
	    AlternativeMethods,
	    Sms,
	    RecoveryCodes,
	    RecoverAccess,
	    Captcha
	  },
	  props: {
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
	    }
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
	      isAlternativeMethodsAvailable: this.canLoginBySms || this.isRecoveryCodesEnabled
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
	        recoverAccess: 'RecoverAccess'
	      };
	      return components[this.currentAuthStep] || 'LegacyOtp';
	    }
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
	    onBackToPush() {
	      this.currentAuthStep = 'push';
	    },
	    onBackToLegacy() {
	      this.currentAuthStep = 'legacy';
	    },
	    onClearErrors() {
	      this.errorMessage = '';
	    }
	  },
	  template: `
		<component
		 :is="currentComponent"
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
		 :pushOtpConfig="pushOtpConfig"
		 :recoveryCodesHelpLink="recoveryCodesHelpLink"
		 :errorMessage="errorMessage"
		 :isAlternativeMethodsAvailable="isAlternativeMethodsAvailable"
		 @form-submit="onSubmitForm"
		 @show-alternatives="onShowAlternatives"
		 @back-to-push="onBackToPush"
		 @back-to-legacy="onBackToLegacy"
		 @show-sms="onShowSms"
		 @show-recovery-codes="onShowRecoveryCodes"
		 @show-recover-access="onShowRecoverAccess"
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
	      currentStep: params.currentStep,
	      recoveryCodesHelpLink: params.recoveryCodesHelpLink,
	      errorMessageText: params.errorMessage
	    });
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

}((this.BX.Intranet.Login = this.BX.Intranet.Login || {}),BX.Vue3,BX,BX.UI.System.Typography.Vue,BX.UI.Analytics));
//# sourceMappingURL=otp.bundle.js.map
