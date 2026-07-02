/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_sidepanel_layout, main_core_events) {
	'use strict';

	class FileLimit extends main_core_events.EventEmitter {
		static #instance = null;
		#data = {
			limitMb: undefined,
			currentBytes: null,
			canChange: null
		};
		#ui = {
			container: HTMLElement = null,
			limit: {
				block: HTMLElement = null,
				input: HTMLInputElement = null
			},
			percentage: {
				block: HTMLElement = null
			}
		};
		static instance() {
			if (!FileLimit.#instance) {
				FileLimit.#instance = new FileLimit();
			}
			return FileLimit.#instance;
		}
		open() {
			let resolver;
			const promise = new Promise(resolve => {
				resolver = resolve;
			});
			const instance = FileLimit.instance();
			BX.SidePanel.Instance.open("crm.webform:file-limit", {
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
						extensions: ['crm.form.file-limit', 'ui.forms', 'ui.sidepanel-content'],
						title: main_core.Loc.getMessage('CRM_FORM_FILE_LIMIT_JS_TITLE'),
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
											content: main_core.Loc.getMessage('CRM_FORM_FILE_LIMIT_JS_ACCESS_DENIED')
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
		#render() {
			const limitMb = this.#data.limitMb;
			this.#ui.percentage.block = this.#createLimitPercentageBlock();
			this.#ui.limit.input = main_core.Tag.render`
			<input 
					type="number" 
					name="limit"
					value="${limitMb}"
					min="1"
					maxlength="5"
					class="ui-ctl-element"
					onfocus="this.parentElement.classList.remove('ui-ctl-danger')"
				>
		`;
			this.#ui.limit.block = main_core.Tag.render`
			<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
				${this.#ui.limit.input}
			</div>
		`;
			this.#ui.container = main_core.Tag.render`
			<div>
				<div class="ui-slider-section">
					<div class="ui-slider-content-box">
						<div class="ui-slider-heading-4">${main_core.Loc.getMessage('CRM_FORM_FILE_LIMIT_JS_DESCRIPTION_TITLE')}</div>
						<p class="ui-slider-paragraph-2">
							${main_core.Loc.getMessage('CRM_FORM_FILE_LIMIT_JS_DESCRIPTION_TEXT')}
						</p>
						<div class="ui-form-row">
							${this.#ui.percentage.block}
						</div>
					</div>
				</div>
				<div class="ui-slider-section">
					<div class="ui-slider-content-box">
						<div class="ui-slider-heading-4">${main_core.Loc.getMessage('CRM_FORM_FILE_LIMIT_JS_SETTING_TITLE')}</div>
						<p class="ui-slider-paragraph-2">
							${main_core.Loc.getMessage('CRM_FORM_FILE_LIMIT_JS_SETTING_DISABLE_HINT')}
						</p>
					</div>
					<div>
						<div class="ui-form-row">
							<div class="ui-form-label">
								<div class="ui-ctl-label-text">${main_core.Loc.getMessage('CRM_FORM_FILE_LIMIT_JS_LIMIT_SETTING_TITLE')}</div>
							</div>
							<div class="ui-form-content">
								${this.#ui.limit.block}
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
			return this.#ui.container;
		}
		#createLimitPercentageBlock() {
			const percentage = main_core.Type.isInteger(this.#data.limitMb) ? Math.ceil(this.#data.currentBytes / (this.#data.limitMb * 1024 * 1024) * 100) : 0;
			const percentageBlock = main_core.Tag.render`
			<div class="ui-alert"></div>
		`;
			if (main_core.Type.isInteger(this.#data.limitMb)) {
				let colorAlertStyle = 'ui-alert-success';
				if (percentage >= 95) {
					colorAlertStyle = 'ui-alert-danger';
				} else if (percentage >= 85) {
					colorAlertStyle = 'ui-alert-warning';
				}
				BX.addClass(percentageBlock, colorAlertStyle);
				percentageBlock.innerText = this.#getLimitPercentageText(Math.min(percentage, 100));
			} else if (main_core.Type.isNull(this.#data.limitMb)) {
				BX.addClass(percentageBlock, 'ui-alert-default');
				percentageBlock.innerText = main_core.Loc.getMessage('CRM_FORM_FILE_LIMIT_JS_LIMIT_DISABLED');
			} else {
				BX.Hide(percentageBlock);
			}
			return percentageBlock;
		}
		#getLimitPercentageText(percentage) {
			let percentageText = main_core.Loc.getMessage('CRM_FORM_FILE_LIMIT_JS_CURRENT_LIMIT_PERCENTAGE_TEXT').replace('%percentage%', percentage);
			if (percentage >= 85) {
				percentageText = main_core.Loc.getMessage('CRM_FORM_FILE_LIMIT_JS_CURRENT_LIMIT_USERS_MIGHT_TROUBLE').replace('%percentage%', percentage);
			}
			return percentageText;
		}
		canChange() {
			return this.#data.canChange;
		}
		load() {
			return main_core.ajax.runAction('crm.form.getFileLimit', {
				json: {}
			}).then(response => {
				this.#data = response.data;
				return this.#render();
			});
		}
		save() {
			let limitMb = this.#ui.limit.input.value;
			this.#ui?.limit.block.classList.remove('ui-ctl-danger');
			if (main_core.Type.isInteger(limitMb) && limitMb <= 0 || main_core.Type.isStringFilled(limitMb && !main_core.Type.isInteger(limitMb))) {
				this.#ui.limit.block.classList.add('ui-ctl-danger');
				return Promise.reject();
			}
			limitMb = main_core.Type.isStringFilled(limitMb) ? Number(limitMb) : null;
			return main_core.ajax.runAction('crm.form.setFileLimit', {
				json: {
					limitMb
				}
			}).then(response => {
				this.#data = response.data;
				this.emit('onSuccessLimitChanged', {
					limit: this.#data.limitMb
				});
				return this.#data;
			});
		}
		getValue() {
			return this.#data;
		}
	}

	exports.FileLimit = FileLimit;

})(this.BX.Crm.Form = this.BX.Crm.Form || {}, BX, BX.UI.SidePanel, BX.Event);
//# sourceMappingURL=file-limit.bundle.js.map
