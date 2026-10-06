/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, main_core_cache, main_core_events, main_date, ui_vue3, ui_vue3_pinia, main_sidepanel, ui_dialogs_messagebox, humanresources_hcmlink_dataMapper, ui_buttons, sign_v2_b2e_hcmLinkEmployeeSelector, sign_v2_b2e_documentTemplateSend, sign_v2_b2e_documentTemplateUserParty, sign_v2_api, sign_v2_b2e_documentTemplateFilling, ui_wizard) {
	'use strict';

	const useDocumentTemplateFillingStore = ui_vue3_pinia.defineStore('sign-b2e-document-template-filling-store', {
		state: () => ({
			documents: [],
			settings: {},
			createdDocuments: [],
			sendProgress: 0,
			configured: false,
			ruRegionFieldsVisible: false
		}),
		actions: {
			setDocuments(documents) {
				this.documents = documents;
			},
			setSettings(settings) {
				this.settings = settings;
			},
			setCreatedDocuments(documents) {
				this.createdDocuments = documents;
			},
			setSendProgress(value) {
				this.sendProgress = value;
			},
			setConfigured(value) {
				this.configured = value;
			},
			setRuRegionFieldsVisible(value) {
				this.ruRegionFieldsVisible = value;
			},
			removeDocument(uid) {
				this.setDocuments(this.documents.filter(doc => doc.uid !== uid));
				const updatedSettings = {
					...this.settings
				};
				delete updatedSettings[uid];
				this.setSettings(updatedSettings);
			}
		}
	});

	class B2ETemplatesSignSettings {
		#cache = new main_core_cache.MemoryCache();
		#documentFilling;
		#documentUserParty;
		#documentSend;
		#templateIds;
		#store;
		#api;
		#sendLayout;
		#wizardLayout;
		#piniaInitStubApp;
		#sliderUrl;
		#bypassSliderCloseCheck = false;
		#container = null;
		#confirmPopup = null;
		#region;
		constructor(templateIds = [], sliderUrl = '', options = null) {
			this.#region = main_core.Extension.getSettings('sign.v2.b2e.sign-settings-templates').get('region');
			this.#templateIds = templateIds;
			this.#store = ui_vue3_pinia.createPinia();
			this.#api = new sign_v2_api.Api();
			this.#piniaInitStubApp = ui_vue3.BitrixVue.createApp({});
			this.#piniaInitStubApp.use(this.#store);
			useDocumentTemplateFillingStore().setRuRegionFieldsVisible(this.#isRuRegionFieldsVisible());
			this.#documentSend = new sign_v2_b2e_documentTemplateSend.DocumentTemplateSend(this.#store);
			this.#documentSend.subscribe('close', () => this.#closeSlider());
			this.#documentFilling = new sign_v2_b2e_documentTemplateFilling.DocumentTemplateFilling({
				store: this.#store
			});

			// the store stays out of the signers step, as before; only the preselect is new
			this.#documentUserParty = new sign_v2_b2e_documentTemplateUserParty.DocumentTemplateUserParty(undefined, options?.preselectedSigners);
			this.#sliderUrl = sliderUrl;
			this.#subscribeSliderCloseEvent();
		}
		#getDocumentFillingStep() {
			const documentFilling = this.#documentFilling;
			return {
				get content() {
					return documentFilling.getLayout();
				},
				title: main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATES_STEP_DOCUMENT_TITLE'),
				beforeCompletion: () => {
					return documentFilling.validate();
				}
			};
		}
		async #createDocumentsAndSaveToStorageIfNotCreated() {
			const store = useDocumentTemplateFillingStore();
			if (store.createdDocuments.length > 0) {
				return;
			}
			const documents = store.documents;
			const templateIds = documents.map(document => document.templateId);
			const {
				items
			} = await this.#api.template.registerDocuments(templateIds, this.#documentUserParty.isRejectExcludedEnabled());
			store.setCreatedDocuments(items);
		}
		async #updateCreatedDocumentsSettings() {
			const store = useDocumentTemplateFillingStore();
			const templateDocuments = store.documents;
			const settings = store.settings;
			const createdDocuments = store.createdDocuments;
			for (const [templateDocumentUid, documentSettings] of Object.entries(settings)) {
				const templateDocument = templateDocuments.find(document => document.uid === templateDocumentUid);
				const templateId = templateDocument?.templateId;
				if (!templateId) {
					throw new Error('templateId not found');
				}
				const templateCreatedDocument = createdDocuments.find(value => value.templateId === templateId);
				if (!templateCreatedDocument) {
					throw new Error('templateCreatedDocument not found');
				}

				// @TODO make mass update
				// eslint-disable-next-line no-await-in-loop
				await this.#updateDocumentSettings(templateCreatedDocument.document, documentSettings);
			}
		}
		async #updateDocumentSettings(document, settings) {
			const uid = document.uid;
			if (this.#isRuRegionFieldsVisible() && settings.registrationNumber.length > 0 && document.externalIdSourceType !== 'hcmlink') {
				await this.#api.changeExternalId(uid, settings.registrationNumber);
			}
			if (this.#isRuRegionFieldsVisible() && document.externalDateCreateSourceType !== 'hcmlink') {
				const formattedDate = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_DATE_FORMAT'), settings.creationDate);
				await this.#api.changeExternalDate(uid, formattedDate);
			}
			const tsFromUserTime = main_date.Timezone.UserTime.toUTCTimestamp(settings.signingDate);
			await this.#api.modifyDateSignUntil(uid, tsFromUserTime);
		}
		#getEmployeeSelectionStep() {
			const userParty = this.#documentUserParty;
			return {
				get content() {
					return userParty.getLayout();
				},
				title: main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATES_STEP_EMPLOYEES_TITLE'),
				beforeCompletion: async () => {
					if (!userParty.validate()) {
						return false;
					}
					try {
						this.#showSendLayout();
						await this.#createDocumentsAndSaveToStorageIfNotCreated();
						await this.#updateCreatedDocumentsSettings();
						await this.#documentUserParty.syncMembers();
						await this.#waitAllIntegrationMapped();
						await this.#waitAllIntegrationEmployeesSelected();
						await this.#configure();
						this.#setConfigured();
						await this.#waitForFillAndStartComplete();
						this.#closeTemplateGridSlider();
						this.#showCompleteNotification();
						return true;
					} catch (e) {
						if (e) {
							console.error(e);
						}
						if (this.#isConfigured()) {
							return true;
						}
						this.#hideSendLayout();
						return false;
					}
				}
			};
		}
		#getStepsMetadata() {
			return {
				documentFillingStep: this.#getDocumentFillingStep(),
				employeeSelectionStep: this.#getEmployeeSelectionStep()
			};
		}
		#getLayout(wizard) {
			this.#wizardLayout = wizard.getLayout();
			this.#sendLayout = this.#documentSend.getLayout();
			main_core.Dom.hide(this.#sendLayout);
			return main_core.Tag.render`
			<div class="sign-settings__scope sign-settings --no-background --b2e --templates">
				<div class="sign-settings__sidebar">
					${this.#createHead()}
					${this.#wizardLayout}
					${this.#sendLayout}
				</div>
			</div>
		`;
		}
		#createHead() {
			return this.#cache.remember('headLayout', () => {
				return main_core.Tag.render`
				<div class="sign-settings__head">
					<div>
						<p class="sign-settings__head_title">
							${main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATES_HEAD_TITLE')}
						</p>
					</div>
				</div>
			`;
			});
		}
		async renderToContainer(container) {
			if (main_core.Type.isNull(container)) {
				return;
			}
			this.#container = container;
			await this.#loadTemplates();
			const wizard = new ui_wizard.Wizard(this.#getStepsMetadata(), {
				back: {
					className: 'ui-btn-light-border'
				},
				next: {
					className: 'ui-btn-success'
				},
				complete: {
					className: 'ui-btn-success',
					title: main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATES_COMPLETE_TITLE'),
					onComplete: () => this.#closeSlider()
				},
				cancel: {
					className: 'ui-btn-light-border',
					onCancel: () => this.#closeSlider()
				},
				swapButtons: true
			});
			main_core.Dom.append(this.#getLayout(wizard), container);
			wizard.moveOnStep(0);
		}
		#showSendLayout() {
			this.#setSendProgress(0);
			main_core.Dom.style(this.#wizardLayout, 'display', 'none');
			main_core.Dom.show(this.#sendLayout);
		}
		#hideSendLayout() {
			main_core.Dom.hide(this.#sendLayout);
			main_core.Dom.style(this.#wizardLayout, 'display', 'block');
		}
		async #configure() {
			const createdDocuments = useDocumentTemplateFillingStore().createdDocuments;
			for (const createdDocument of createdDocuments) {
				// eslint-disable-next-line no-await-in-loop
				await this.#api.configureDocument(createdDocument.document.uid);
			}
		}
		async #waitForFillAndStartComplete() {
			const createdDocuments = useDocumentTemplateFillingStore().createdDocuments;
			const ids = createdDocuments.map(value => value.document.id);
			let completed = false;
			while (!completed) {
				// eslint-disable-next-line no-await-in-loop
				const result = await this.#api.getManyDocumentFillAndStartProgress(ids);
				completed = result.completed;
				this.#setSendProgress(Math.round(result.progress));
				// eslint-disable-next-line no-await-in-loop
				await this.#sleep(1000);
			}
		}
		#sleep(ms) {
			return new Promise(resolve => {
				setTimeout(resolve, ms);
			});
		}
		async #loadTemplates() {
			const templateDocuments = await this.#getDocumentsByTemplateIds(this.#templateIds);
			useDocumentTemplateFillingStore().setDocuments(templateDocuments);
		}
		async #getDocumentsByTemplateIds(templateIds) {
			return this.#api.loadDocumentsByTemplateIds(templateIds);
		}
		#closeTemplateGridSlider() {
			const prevSlider = window.top.BX.SidePanel.Instance.getPreviousSlider();
			if (prevSlider && prevSlider.getUrl().indexOf('templates/folder/?folderId=')) {
				prevSlider.close();
			}
		}
		#showCompleteNotification() {
			const notificationText = this.#templateIds.length > 1 ? main_core.Loc.getMessage('SIGN_SETTINGS_COMPLETE_NOTIFICATION_TEXT_GROUP') : main_core.Loc.getMessage('SIGN_SETTINGS_COMPLETE_NOTIFICATION_TEXT');
			window.top.BX.UI.Notification.Center.notify({
				content: notificationText,
				autoHideDelay: 4000
			});
		}
		async #waitAllIntegrationMapped() {
			// eslint-disable-next-line no-constant-condition
			while (true) {
				// eslint-disable-next-line no-await-in-loop
				const notMapped = await this.#getFirstNotMappedIntegration();
				if (notMapped) {
					// eslint-disable-next-line no-await-in-loop
					await this.#waitIntegrationSync(notMapped);
				} else {
					break;
				}
			}
		}
		async #getFirstNotMappedIntegration() {
			if (!this.#isCreatedDocumentsHasIntegration()) {
				return null;
			}
			const createdDocumentUids = this.#getCreateDocumentsUids();
			const integrations = await this.#api.checkNotMappedMembersHrIntegrationByDocuments(createdDocumentUids);
			return integrations.find(integration => integration.userIds.length > 0);
		}
		#waitIntegrationSync(integration) {
			return new Promise((resolve, reject) => {
				this.#showNotMappedPopup(resolve, reject, integration);
			});
		}
		#setSendProgress(value) {
			useDocumentTemplateFillingStore().setSendProgress(value);
		}
		#closeSlider() {
			const slider = BX.SidePanel.Instance.getTopSlider();
			if (slider && this.#isMasterSlider(slider)) {
				slider.close();
			}
		}
		#isMasterSlider(slider) {
			return /sign-b2e-templates-settings-\d+-(template|folder)/.test(slider.getUrl());
		}
		#setConfigured(value = true) {
			useDocumentTemplateFillingStore().setConfigured(value);
		}
		#showNotMappedPopup(resolve, reject, integration) {
			let shouldPopupCloseReject = true;
			const popup = ui_dialogs_messagebox.MessageBox.create({
				message: this.#getHcmPopupLayout(main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATES_NOT_MAPPED_POPUP_TITLE'), main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATES_NOT_MAPPED_POPUP_DESCRIPTION')),
				buttons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATES_NOT_MAPPED_POPUP_OK'),
					size: ui_buttons.ButtonSize.S,
					color: ui_buttons.ButtonColor.PRIMARY,
					round: true,
					onclick: () => {
						shouldPopupCloseReject = false;
						popup.close();
						humanresources_hcmlink_dataMapper.Mapper.openSlider({
							companyId: integration.integrationId,
							userIds: new Set(integration.allUserIds),
							mode: humanresources_hcmlink_dataMapper.Mapper.MODE_DIRECT
						}, {
							onCloseHandler: () => resolve()
						});
					}
				}), new ui_buttons.Button({
					text: main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATES_NOT_MAPPED_POPUP_CANCEL'),
					size: ui_buttons.ButtonSize.S,
					color: ui_buttons.ButtonColor.LIGHT_BORDER,
					round: true,
					onclick: () => popup.close()
				})],
				modal: false,
				popupOptions: {
					events: {
						onPopupClose: () => {
							if (shouldPopupCloseReject) {
								reject();
							}
						}
					},
					...this.#getHcmPopupOptions()
				}
			});
			popup.show();
		}
		#isConfigured() {
			return useDocumentTemplateFillingStore().configured;
		}
		async #waitAllIntegrationEmployeesSelected() {
			// eslint-disable-next-line no-constant-condition
			while (true) {
				// eslint-disable-next-line no-await-in-loop
				const notSelected = await this.#getFirstNotEmployeesSelectedIntegration();
				if (notSelected) {
					// eslint-disable-next-line no-await-in-loop
					await this.#waitEmployeeSelect(notSelected);
				} else {
					break;
				}
			}
		}
		async #getFirstNotEmployeesSelectedIntegration() {
			if (!this.#isCreatedDocumentsHasIntegration()) {
				return null;
			}
			const createdDocumentUids = this.#getCreateDocumentsUids();
			const integrations = await this.#api.loadBulkMultipleVacancyMemberHrIntegrations(createdDocumentUids);
			return integrations.find(integration => integration.employees.length > 0);
		}
		#isCreatedDocumentsHasIntegration() {
			const store = useDocumentTemplateFillingStore();
			const createdDocuments = store.createdDocuments;
			return createdDocuments.some(value => value.document.hcmLinkCompanyId > 0);
		}
		#getCreateDocumentsUids() {
			const store = useDocumentTemplateFillingStore();
			const createdDocuments = store.createdDocuments;
			return createdDocuments.map(value => value.document.uid);
		}
		#waitEmployeeSelect(integration) {
			return new Promise((resolve, reject) => {
				this.#showNotSelectedEmployeePopup(resolve, reject, integration);
			});
		}
		#showNotSelectedEmployeePopup(resolve, reject, integration) {
			let shouldPopupCloseReject = true;
			const popup = ui_dialogs_messagebox.MessageBox.create({
				message: this.#getHcmPopupLayout(main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATES_EMPLOYEES_NOT_SELECTED_POPUP_TITLE'), main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATES_EMPLOYEES_NOT_SELECTED_POPUP_DESCRIPTION')),
				buttons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATES_EMPLOYEES_NOT_SELECTED_POPUP_OK'),
					size: ui_buttons.ButtonSize.S,
					color: ui_buttons.ButtonColor.PRIMARY,
					round: true,
					onclick: () => {
						shouldPopupCloseReject = false;
						popup.close();
						sign_v2_b2e_hcmLinkEmployeeSelector.HcmLinkVacancyChooser.openSlider({
							api: this.#api,
							documentGroupUids: this.#getCreatedDocumentUidsByHcmLinkId(integration.company.id),
							employees: this.#convertEmployeesToUserMap(integration.employees),
							companyTitle: integration.company.title
						}, {
							onCloseHandler: () => resolve()
						});
					}
				}), new ui_buttons.Button({
					text: main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATES_EMPLOYEES_NOT_SELECTED_POPUP_CANCEL'),
					size: ui_buttons.ButtonSize.S,
					color: ui_buttons.ButtonColor.LIGHT_BORDER,
					round: true,
					onclick: () => popup.close()
				})],
				modal: false,
				popupOptions: {
					events: {
						onPopupClose: () => {
							if (shouldPopupCloseReject) {
								reject();
							}
						}
					},
					...this.#getHcmPopupOptions()
				}
			});
			popup.show();
		}
		#convertEmployeesToUserMap(employees) {
			const employeesMap = new Map();
			employees.forEach(value => {
				employeesMap.set(value.userId, value);
			});
			return employeesMap;
		}
		#getCreatedDocumentUidsByHcmLinkId(companyId) {
			const store = useDocumentTemplateFillingStore();
			const createdDocuments = store.createdDocuments;
			return createdDocuments.filter(value => value.document.hcmLinkCompanyId === companyId).map(value => value.document.uid);
		}
		#getHcmPopupOptions() {
			return {
				targetContainer: this.#container,
				borderRadius: '20px',
				padding: 0,
				contentPadding: 24
			};
		}
		#getHcmPopupLayout(title, description) {
			return main_core.Tag.render`
			<div>
				<div class="sign-settings-templates-hcm-popup-warning"></div>
				<div class="sign-settings-templates-hcm-popup-title">
					${main_core.Text.encode(title)}			
				</div>
				<div class="sign-settings-templates-hcm-popup-description">
					${main_core.Text.encode(description)}			
				</div>
			</div>
		`;
		}
		#subscribeSliderCloseEvent() {
			if (!this.#sliderUrl) {
				return;
			}
			const onClose = event => {
				const [eventDataItem] = event.getData();
				const slider = eventDataItem?.getSlider();
				if (slider.getUrl() !== this.#sliderUrl) {
					return;
				}
				if (this.#isNeedShowCloseConfirm()) {
					eventDataItem.denyAction();
					this.#showCloseConfirm(slider);
					return;
				}
				main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onClose', onClose);
				this.#unmountVueApps();
				this.#closeConfimPopup();
			};
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', onClose);
		}
		#unmountVueApps() {
			this.#documentFilling.unmount();
			this.#documentSend.unmount();
			this.#documentUserParty.unmount();
		}
		#isNeedShowCloseConfirm() {
			if (this.#bypassSliderCloseCheck) {
				return false;
			}
			return this.#getCreateDocumentsUids().length === 0;
		}
		#showCloseConfirm(slider) {
			if (this.#confirmPopup === null) {
				this.#confirmPopup = new ui_dialogs_messagebox.MessageBox({
					message: main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATES_CLOSE_CONFIRM'),
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					okCaption: main_core.Loc.getMessage('SIGN_SETTINGS_TEMPLATES_CLOSE_CONFIRM_OK'),
					onOk: messageBox => {
						messageBox.close();
						this.#bypassSliderCloseCheck = true;
						slider.close();
						this.#bypassSliderCloseCheck = false;
					}
				});
			}
			this.#confirmPopup.show();
		}
		#closeConfimPopup() {
			this.#confirmPopup?.close();
		}
		#isRuRegionFieldsVisible() {
			return this.#region === 'ru';
		}
	}

	exports.B2ETemplatesSignSettings = B2ETemplatesSignSettings;
	exports.useDocumentTemplateFillingStore = useDocumentTemplateFillingStore;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Cache, BX.Event, BX.Main, BX.Vue3, BX.Vue3.Pinia, BX.SidePanel, BX.UI.Dialogs, BX.Humanresources.Hcmlink, BX.UI, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX.Sign.V2, BX.Sign.V2.B2e, BX.Ui);
