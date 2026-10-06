/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, main_core_cache, sign_v2_analytics, sign_v2_b2e_startProcess, sign_v2_b2e_submitDocumentInfo, sign_v2_helper, ui_wizard, main_loader, main_core_events) {
	'use strict';

	var noTemplatesStateImage = "/bitrix/js/sign/v2/b2e/sign-settings-employee/dist/assets/no-templates-state-image.svg";

	const emptyStateHelpdeskCode = '23174934';
	class B2EEmployeeSignSettings {
		#cache = new main_core_cache.MemoryCache();
		#containerId;
		#wizard;
		#startProcess;
		#stepsContext = {};
		#analytics;
		constructor(containerId = '', analyticsContext = {}) {
			this.#containerId = containerId;
			const currentSlider = BX.SidePanel.Instance.getTopSlider();
			this.#startProcess = new sign_v2_b2e_startProcess.StartProcess();
			this.#wizard = new ui_wizard.Wizard(this.#getStepsMetadata(this), {
				back: {
					className: 'ui-btn-light-border'
				},
				next: {
					className: 'ui-btn-success'
				},
				complete: {
					className: 'ui-btn-success',
					title: main_core.Loc.getMessage('SIGN_SETTINGS_EMPLOYEE_COMPLETE_TITLE'),
					onComplete: () => currentSlider?.close()
				},
				swapButtons: true
			});
			this.#analytics = new sign_v2_analytics.Analytics({
				contextOptions: analyticsContext
			});
			this.#subscribeOnEvents();
		}
		#createHead() {
			return this.#cache.remember('headLayout', () => {
				const {
					root,
					titleHelp
				} = main_core.Tag.render`
				<div class="sign-settings__head">
					<div>
						<p class="sign-settings__head_title">
							${main_core.Loc.getMessage('SIGN_SETTINGS_EMPLOYEE_TITLE')}
						</p>
						<p class="sign-settings__head_title --sub">
							<span>${main_core.Loc.getMessage('SIGN_SETTINGS_EMPLOYEE_TITLE_SUB')}</span>
							<a ref="titleHelp" class="sign-settings__head_title-help">
								${main_core.Loc.getMessage('SIGN_SETTINGS_EMPLOYEE_TITLE_SUB_HELP')}
							</a>
						</p>
					</div>
				</div>
			`;
				sign_v2_helper.Helpdesk.bindHandler(titleHelp, '23052076');
				return root;
			});
		}
		#getStartProcessStep(signSettings) {
			const startProcess = signSettings.#startProcess;
			return {
				get content() {
					if (main_core.Type.isUndefined(signSettings.#stepsContext.selectedTemplateUid)) {
						signSettings.#wizard.toggleBtnActiveState('next', true);
						if (main_core.Type.isStringFilled(startProcess.getSelectedTemplateUid())) {
							signSettings.#wizard.toggleBtnActiveState('next', false);
						} else {
							startProcess.subscribe(startProcess.events.onProcessTypeSelect, () => signSettings.#wizard.toggleBtnActiveState('next', false));
						}
					}
					const layout = startProcess.getLayout();
					sign_v2_helper.SignSettingsItemCounter.numerate(layout);
					signSettings.#disableNoStepMode();
					return layout;
				},
				title: main_core.Loc.getMessage('SIGN_SETTINGS_EMPLOYEE_START_PROCESS'),
				beforeCompletion: async () => {
					this.#stepsContext.selectedTemplateUid = startProcess.getSelectedTemplateUid();
					this.#stepsContext.templatesList = await startProcess.getTemplates();
					const fieldsResponse = await startProcess.getFields(this.#stepsContext.selectedTemplateUid);
					this.#stepsContext.fields = fieldsResponse.fields;
					this.#stepsContext.showRegistrationNumberField = fieldsResponse.hasRegistrationNumberPlaceholder;
					this.#stepsContext.showCreationDateField = fieldsResponse.hasCreationDatePlaceholder;
				}
			};
		}
		#getSubmitDocumentInfoStep(signSettings) {
			let submitDocumentInfo = null;
			return {
				get content() {
					const currentTemplateSelected = signSettings.#stepsContext.templatesList.find(template => template.uid === signSettings.#stepsContext.selectedTemplateUid);
					const showRegistrationNumberField = signSettings.#stepsContext.showRegistrationNumberField === true;
					const showCreationDateField = signSettings.#stepsContext.showCreationDateField === true;
					submitDocumentInfo = new sign_v2_b2e_submitDocumentInfo.SubmitDocumentInfo({
						template: {
							uid: currentTemplateSelected.uid,
							title: currentTemplateSelected.title
						},
						company: currentTemplateSelected.company,
						fields: signSettings.#stepsContext.fields,
						isOnboarding: false,
						showRegistrationNumberField,
						showCreationDateField
					});
					const layout = submitDocumentInfo.getLayout();
					if (signSettings.#stepsContext.fields.length > 0 || showRegistrationNumberField || showCreationDateField) {
						sign_v2_helper.SignSettingsItemCounter.numerate(layout);
					} else {
						signSettings.#enableNoStepMode();
					}
					return layout;
				},
				title: main_core.Loc.getMessage('SIGN_SETTINGS_EMPLOYEE_SUBMIT_INFO'),
				beforeCompletion: async () => {
					submitDocumentInfo.subscribeOnce(submitDocumentInfo.events.documentSendedSuccessFully, event => {
						const document = event.getData().document;
						this.#analytics.sendWithProviderTypeAndDocId({
							event: 'sent_document_to_sign',
							c_element: 'create_button',
							status: 'success'
						}, document.id, document.providerCode);
					});
					let result = false;
					try {
						result = await submitDocumentInfo.sendForSign();
					} catch (error) {
						console.error(error);
						result = false;
						this.#analytics.send({
							event: 'sent_document_to_sign',
							c_element: 'create_button',
							status: 'error'
						});
					}
					return result;
				}
			};
		}
		#getStepsMetadata(signSettings) {
			return {
				startProcess: this.#getStartProcessStep(signSettings),
				submitDocumentInfo: this.#getSubmitDocumentInfoStep(signSettings)
			};
		}
		#getLayout() {
			return this.#cache.remember('headLayout', () => {
				return main_core.Tag.render`
				<div class="sign-settings__scope sign-settings --b2e --employee">
					<div class="sign-settings__sidebar">
						${this.#createHead()}
						${this.#wizard.getLayout()}
					</div>
				</div>
			`;
			});
		}
		async render() {
			const container = document.getElementById(this.#containerId);
			if (container === null) {
				return;
			}
			this.renderToContainer(container);
		}
		async renderToContainer(container) {
			if (main_core.Type.isNull(container)) {
				return;
			}
			const loader = new main_loader.Loader({
				target: container
			});
			void loader.show();
			const templates = await this.#startProcess.getTemplates();
			if (templates.length === 0) {
				this.#analytics.send({
					event: 'show_empty_state',
					c_element: 'create_button'
				});
				main_core.Dom.append(this.#getZeroTemplatesEmptyState(), container);
				void loader.hide();
				return;
			}
			void loader.hide();
			main_core.Dom.append(this.#getLayout(), container);
			this.#wizard.moveOnStep(0);
			this.#analytics.send({
				event: 'click_create_document',
				c_element: 'create_button'
			});
		}
		#getZeroTemplatesEmptyState() {
			return main_core.Tag.render`
			<div class="sign-settings__scope sign-settings --b2e --employee">
				<div class="sign-settings__sidebar">
					<div class="sign-settings__empty-state">
						<div class="sign-settings__empty-state_icon">
							<img src="${noTemplatesStateImage}" alt="${main_core.Loc.getMessage('SIGN_SETTINGS_EMPTY_STATE_ICON_ALT')}">
						</div>
						<p class="sign-settings__empty-state_title">
							${main_core.Loc.getMessage('SIGN_SETTINGS_EMPTY_STATE_TITLE')}
						</p>
						<p class="sign-settings__empty-state_text">
							${sign_v2_helper.Helpdesk.replaceLink(main_core.Loc.getMessage('SIGN_SETTINGS_EMPTY_STATE_DESCRIPTION'), emptyStateHelpdeskCode, sign_v2_helper.Helpdesk.defaultRedirectValue, ['sign-settings__empty-state_link'])}
						</p>
					</div>
				</div>
			</div>
		`;
		}
		#enableNoStepMode() {
			main_core.Dom.addClass(this.#getLayout(), 'no-step-mode');
		}
		#disableNoStepMode() {
			main_core.Dom.removeClass(this.#getLayout(), 'no-step-mode');
		}
		#subscribeOnEvents() {
			main_core_events.EventEmitter.subscribe('BX.Sign.SignSettingsEmployee:onBeforeTemplateSend', () => {
				this.#wizard.toggleBtnActiveState('back', true);
			});
			main_core_events.EventEmitter.subscribe('BX.Sign.SignSettingsEmployee:onAfterTemplateSend', () => {
				this.#wizard.toggleBtnActiveState('back', false);
			});
		}
		clearCache() {
			this.#startProcess.resetCache();
			this.#stepsContext = {};
		}
	}

	exports.B2EEmployeeSignSettings = B2EEmployeeSignSettings;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Cache, BX.Sign.V2, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX.Sign.V2, BX.Ui, BX, BX.Event);
//# sourceMappingURL=sign-settings-employee.bundle.js.map
