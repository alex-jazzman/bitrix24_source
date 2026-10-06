/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Grid = this.BX.Mail.Grid || {};
(function (exports, main_core, ui_vue3, ui_dialogs_messagebox, mail_connecting_crmIntegration, mail_connecting_settingsConfig) {
	'use strict';

	function buildCrmOptions(crmSettings, showVcfOption = true) {
		if (!crmSettings.enabled) {
			return {
				enabled: 'N'
			};
		}
		const config = {};
		if (crmSettings.sync.enabled) {
			config.crm_sync_days = parseInt(crmSettings.sync.periodValue, 10) || 0;
		}
		if (crmSettings.assignKnownClientEmails) {
			config.crm_public = 'Y';
		}
		if (showVcfOption && crmSettings.vcf) {
			config.crm_vcf = 'Y';
		}
		if (crmSettings.incoming.enabled) {
			config.crm_new_entity_in = crmSettings.incoming.createAction;
		}
		if (crmSettings.outgoing.enabled) {
			config.crm_new_entity_out = crmSettings.outgoing.createAction;
		}
		config.crm_lead_source = crmSettings.source;
		if (crmSettings.responsibleQueue.length > 0) {
			config.crm_lead_resp = crmSettings.responsibleQueue.map(item => Number(item.id));
		}
		if (crmSettings.leadCreationAddresses.length > 0) {
			config.crm_new_lead_for = crmSettings.leadCreationAddresses;
		}
		return {
			enabled: 'Y',
			config
		};
	}

	function buildMassCrmSettings(mapped) {
		return {
			enabled: true,
			sync: {
				enabled: mapped.crmSyncEnabled,
				periodValue: mapped.crmSyncPeriod
			},
			assignKnownClientEmails: mapped.crmAssignKnownClientEmails,
			vcf: mapped.crmVcf,
			incoming: {
				enabled: mapped.crmIncomingCreate,
				createAction: mapped.crmIncomingEntity
			},
			outgoing: {
				enabled: mapped.crmOutgoingCreate,
				createAction: mapped.crmOutgoingEntity
			},
			source: mapped.crmSource,
			leadCreationAddresses: '',
			responsibleQueue: []
		};
	}

	function getTopSidePanel() {
		const topWindow = window.top ?? window;
		return topWindow.BX?.SidePanel?.Instance;
	}
	class CrmMassConfigForm {
		#containerId;
		#initialData;
		#app = null;
		#crmSettingsRef = null;
		#mailboxIds = [];
		#buttonPanelHandler = null;
		constructor(options = {}) {
			this.#containerId = options.containerId ?? 'mail-mailbox-crm-mass-config-container';
			this.#initialData = options.initialData ?? {
				mailboxIds: [],
				settingsConfig: {}
			};
		}
		start() {
			const container = document.getElementById(this.#containerId);
			if (!container) {
				return;
			}
			const rawConfig = this.#initialData.settingsConfig ?? {};
			const mapped = mail_connecting_settingsConfig.mapSettingsConfigToState(rawConfig);
			this.#mailboxIds = this.#initialData.mailboxIds ?? [];
			const defaultCrmSettings = buildMassCrmSettings(mapped);
			this.#crmSettingsRef = ui_vue3.ref({
				...defaultCrmSettings
			});
			const crmSettingsRef = this.#crmSettingsRef;
			const syncPeriodOptions = mapped.crmSyncOptions;
			const entityOptions = mapped.crmEntityOptions;
			const sourceOptions = mapped.crmSourceOptions;
			const canEditCrmIntegration = rawConfig.canEditCrmIntegration ?? false;
			const CrmMassApp = ui_vue3.defineComponent({
				components: {
					CrmIntegration: mail_connecting_crmIntegration.CrmIntegration
				},
				setup() {
					return {
						crmSettings: crmSettingsRef,
						syncPeriodOptions,
						entityOptions,
						sourceOptions,
						canEditCrmIntegration
					};
				},
				template: `
				<div class="mail-crm-mass-config-form" data-testid="mail-crm-mass-config-form">
					<CrmIntegration
						v-model="crmSettings"
						:syncPeriodOptions="syncPeriodOptions"
						:entityOptions="entityOptions"
						:sourceOptions="sourceOptions"
						:canEditCrmIntegration="canEditCrmIntegration"
						:isEditMode="false"
						:showVcfOption="true"
						:showEnableSwitcher="false"
						data-testid="mail-crm-mass-config-crm-integration"
					/>
				</div>
			`
			});
			this.#app = ui_vue3.BitrixVue.createApp(CrmMassApp);
			this.#app.mount(container);
			document.getElementById('mail-crm-mass-apply')?.setAttribute('data-testid', 'mail-crm-mass-config-save-btn');
			const localBX = window.BX;
			if (localBX?.UI?.ButtonPanel) {
				this.#buttonPanelHandler = button => {
					if (button.TYPE === 'apply' || button.ID === 'mail-crm-mass-apply') {
						this.#handleApply();
					}
				};
				localBX.addCustomEvent?.(localBX.UI.ButtonPanel, 'button-click', this.#buttonPanelHandler);
			}
		}
		#handleApply() {
			if (!this.#crmSettingsRef) {
				return;
			}
			const messageBox = ui_dialogs_messagebox.MessageBox.create({
				message: main_core.Loc.getMessage('MAIL_MAILBOX_CRM_MASS_APPLY_CONFIRM'),
				okCaption: main_core.Loc.getMessage('MAIL_MAILBOX_CRM_MASS_APPLY_CONFIRM_OK'),
				cancelCaption: main_core.Loc.getMessage('MAIL_MAILBOX_CRM_MASS_APPLY_CONFIRM_CANCEL'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				onOk: () => {
					messageBox.close();
					this.#applySettings();
				},
				onCancel: () => {
					messageBox.close();
					this.#resetApplyButtonWait();
				}
			});
			messageBox.show();
			const popup = messageBox.getPopupWindow?.();
			const popupContainer = popup?.getPopupContainer?.();
			if (popupContainer) {
				popupContainer.dataset.testid = 'mail-crm-mass-apply-confirm-dialog';
			}
		}
		#applySettings() {
			if (!this.#crmSettingsRef) {
				return;
			}
			const crmOptions = buildCrmOptions(this.#crmSettingsRef.value, true);
			const topPanel = getTopSidePanel();
			topPanel?.postMessage?.(window, 'mail-mass-crm-config-apply', {
				mailboxIds: this.#mailboxIds,
				crmOptions
			});
			const slider = topPanel?.getSliderByWindow?.(window) ?? topPanel?.getTopSlider?.();
			if (slider) {
				slider.setCacheable(false);
				slider.close();
			}
		}
		#resetApplyButtonWait() {
			const applyBtn = document.getElementById('mail-crm-mass-apply');
			if (applyBtn) {
				main_core.Dom.removeClass(applyBtn, 'ui-btn-wait');
			}
		}
	}

	exports.CrmMassConfigForm = CrmMassConfigForm;

})(this.BX.Mail.Grid.MailboxCrmMass = this.BX.Mail.Grid.MailboxCrmMass || {}, BX, BX.Vue3, BX.UI.Dialogs, BX.Mail.Connecting.CrmIntegration, BX.Mail.Connecting.SettingsConfig);
//# sourceMappingURL=mailbox-crm-mass.bundle.js.map
