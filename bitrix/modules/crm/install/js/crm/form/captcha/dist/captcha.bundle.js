/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_sidepanel_layout) {
	'use strict';

	const YANDEX_CAPTCHA_SERVICE = 'yandex';
	const GOOGLE_CAPTCHA_SERVICE = 'google';
	class Captcha {
		static open(type = GOOGLE_CAPTCHA_SERVICE) {
			let resolver = null;
			const promise = new Promise(resolve => {
				resolver = resolve;
			});
			const instance = new Captcha(type);
			BX.SidePanel.Instance.open('crm.webform:captcha', {
				width: 700,
				cacheable: false,
				events: {
					onCloseComplete: () => {
						resolver({
							...instance.getValue()
						});
					}
				},
				contentCallback: () => {
					return ui_sidepanel_layout.Layout.createContent({
						extensions: ['crm.form.captcha', 'ui.forms', 'ui.sidepanel-content'],
						title: main_core.Loc.getMessage('CRM_FORM_CAPTCHA_JS_TITLE'),
						design: {
							section: false
						},
						content() {
							return instance.load();
						},
						buttons({
							SaveButton,
							closeButton
						}) {
							return [new SaveButton({
								onclick: btn => {
									if (!instance.canChange()) {
										btn.setDisabled(true);
										BX.UI.Notification.Center.notify({
											content: main_core.Loc.getMessage('CRM_FORM_CAPTCHA_JS_ACCESS_DENIED')
										});
										return;
									}
									btn.setWaiting(true);
									instance.save().then(() => {
										btn.setWaiting(false);
										BX.SidePanel.Instance.close();
									}).catch(() => {
										btn.setWaiting(false);
									});
								}
							}), closeButton];
						}
					});
				}
			});
			return promise;
		}
		constructor(type = GOOGLE_CAPTCHA_SERVICE) {
			this.#type = type;
		}
		#data = {
			key: null,
			secret: null,
			canChange: false,
			hasDefaults: false
		};
		#type;
		#container;
		#render() {
			const key = main_core.Tag.safe`${this.#data.key}`;
			const secret = main_core.Tag.safe`${this.#data.secret}`;
			this.#container = main_core.Tag.render`
			<div>
				<div class="ui-slider-section" ${this.#data.hasDefaults ? '' : 'hidden'}>
					<div class="ui-slider-content-box">
						<div class="ui-slider-heading-4">${main_core.Loc.getMessage('CRM_FORM_CAPTCHA_JS_STD_TITLE')}</div>
						<div class="ui-alert ui-alert-success">
							<span class="ui-alert-message">${main_core.Loc.getMessage('CRM_FORM_CAPTCHA_JS_STD_TEXT')}</span>
						</div>
					</div>
				</div>
				<div class="ui-slider-section">
					<div class="ui-slider-content-box">
						<div class="ui-slider-heading-4">
							${this.#type === YANDEX_CAPTCHA_SERVICE ? main_core.Loc.getMessage('CRM_FORM_CAPTCHA_JS_YANDEX_CUSTOM_TITLE') : main_core.Loc.getMessage('CRM_FORM_CAPTCHA_JS_CUSTOM_TITLE_MSGVER_1')}
						</div>
						<p class="ui-slider-paragraph-2">
							${main_core.Loc.getMessage('CRM_FORM_CAPTCHA_JS_CUSTOM_TEXT')}
							<br>
							<a href="${this.#type === YANDEX_CAPTCHA_SERVICE ? 'https://yandex.cloud/ru/docs/smartcaptcha/operations/get-keys' : 'https://www.google.com/recaptcha/about/'}" target="_blank">${main_core.Loc.getMessage('CRM_FORM_CAPTCHA_JS_CUSTOM_HOWTO')}</a>
						</p>
					</div>
					
					<div>
						<div class="ui-form-row">
							<div class="ui-form-label">
								<div class="ui-ctl-label-text">Key</div>
							</div>
							<div class="ui-form-content">
								<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
									<input 
										type="text" 
										name="key"
										value="${key}"
										class="ui-ctl-element"
										onfocus="this.parentElement.classList.remove('ui-ctl-danger')"
									>
								</div>
							</div>
						</div>
						<div class="ui-form-row" style="margin: 20px 0 0;">
							<div class="ui-form-label">
								<div class="ui-ctl-label-text">Secret</div>
							</div>
							<div class="ui-form-content">
								<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
									<input 
										type="text" 
										name="secret"
										value="${secret}"
										class="ui-ctl-element"
										onfocus="this.parentElement.classList.remove('ui-ctl-danger')"
									>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
			return this.#container;
		}
		hasKeys() {
			const data = this.#data;
			return data.hasDefaults || data.key && data.secret;
		}
		canChange() {
			return this.#data.canChange;
		}
		load() {
			return main_core.ajax.runAction('crm.form.getCaptcha', {
				json: {
					type: this.#type
				}
			}).then(response => {
				this.#data = response.data;
				return this.#render();
			});
		}
		save() {
			const keyNode = this.#container.querySelector('input[name="key"]');
			const secretNode = this.#container.querySelector('input[name="secret"]');
			const key = keyNode.value || '';
			const secret = secretNode.value || '';
			keyNode.parentElement.classList.remove('ui-ctl-danger');
			secretNode.parentElement.classList.remove('ui-ctl-danger');
			if (main_core.Type.isStringFilled(key) !== main_core.Type.isStringFilled(secret)) {
				if (!key) {
					keyNode.parentElement.classList.add('ui-ctl-danger');
				}
				if (!secret) {
					secretNode.parentElement.classList.add('ui-ctl-danger');
				}
				return Promise.reject();
			}
			return main_core.ajax.runAction('crm.form.setCaptcha', {
				json: {
					key,
					secret,
					type: this.#type
				}
			}).then(response => {
				this.#data = response.data;
				return this.#data;
			});
		}
		getValue() {
			return this.#data;
		}
	}

	exports.Captcha = Captcha;

})(this.BX.Crm.Form = this.BX.Crm.Form || {}, BX, BX.UI.SidePanel);
//# sourceMappingURL=captcha.bundle.js.map
