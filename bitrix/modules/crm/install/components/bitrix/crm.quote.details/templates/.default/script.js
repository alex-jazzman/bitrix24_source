/* eslint-disable */
(function (crm_conversion, crm_integration_analytics, crm_itemDetailsComponent, main_core, main_core_events, main_popup, ui_buttons) {
	'use strict';

	const printWindowWidth = 900;
	const printWindowHeight = 600;
	const namespace = main_core.Reflection.namespace('BX.Crm');
	class QuoteDetailsComponent extends crm_itemDetailsComponent.ItemDetailsComponent {
		constructor(params) {
			super(params);
			if (main_core.Type.isPlainObject(params)) {
				this.activityEditorId = params.activityEditorId;
				if (main_core.Type.isPlainObject(params.emailSettings)) {
					this.emailSettings = params.emailSettings;
				}
				if (main_core.Type.isArray(params.printTemplates)) {
					this.printTemplates = params.printTemplates;
					this.isMultipleTemplates = Boolean(this.printTemplates.length > 1);
				}
				if (main_core.Type.isPlainObject(params.conversion)) {
					this.conversionSettings = params.conversion;
				}
			}
		}
		init() {
			super.init();
			if (this.conversionSettings) {
				this.initConversionApi();
			}
		}
		initConversionApi() {
			const converter = crm_conversion.Conversion.Manager.Instance.initializeConverter(this.entityTypeId, this.conversionSettings.converter);
			const schemeSelector = new crm_conversion.Conversion.SchemeSelector(converter, this.conversionSettings.schemeSelector);
			if (this.conversionSettings.lockScript) {
				schemeSelector.subscribe('onSchemeSelected', this.conversionSettings.lockScript);
				schemeSelector.subscribe('onContainerClick', this.conversionSettings.lockScript);
				main_core_events.EventEmitter.subscribe('CrmCreateDealFromQuote', this.conversionSettings.lockScript);
				main_core_events.EventEmitter.subscribe('CrmCreateInvoiceFromQuote', this.conversionSettings.lockScript);
			} else {
				schemeSelector.enableAutoConversion();
				const convertByEvent = dstEntityTypeId => {
					const schemeItem = converter.getConfig().getScheme().getItemForSingleEntityTypeId(dstEntityTypeId);
					if (!schemeItem) {
						console.error('SchemeItem with single entityTypeId ' + dstEntityTypeId + ' is not found');
						return;
					}
					converter.getConfig().updateFromSchemeItem(schemeItem);
					converter.setAnalyticsElement(crm_integration_analytics.Dictionary.ELEMENT_CREATE_LINKED_ENTITY_BUTTON);
					converter.convert(this.id);
				};
				main_core_events.EventEmitter.subscribe('CrmCreateDealFromQuote', () => {
					convertByEvent(BX.CrmEntityType.enumeration.deal);
				});
				main_core_events.EventEmitter.subscribe('CrmCreateInvoiceFromQuote', () => {
					convertByEvent(BX.CrmEntityType.enumeration.invoice);
				});
				main_core_events.EventEmitter.subscribe('BX.Crm.ItemListComponent:onAddNewItemButtonClick', event => {
					const dstEntityTypeId = Number(event.getData().entityTypeId);
					if (dstEntityTypeId > 0) {
						convertByEvent(dstEntityTypeId);
					}
				});
			}
		}
		bindEvents() {
			super.bindEvents();
			main_core_events.EventEmitter.subscribe('BX.Crm.ItemDetailsComponent:onClickPrint', this.handlePrintOrPdf.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Crm.ItemDetailsComponent:onClickPdf', this.handlePrintOrPdf.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Crm.ItemDetailsComponent:onClickEmail', this.handleEmail.bind(this));
		}
		handlePrintOrPdf(event) {
			if (!this.validatePrintTemplates()) {
				return;
			}
			const link = this.normalizeUrl(new main_core.Uri(event.getData().link));
			const openInNewWindow = Boolean(event.getData().openInNewWindow);
			if (this.isMultipleTemplates) {
				this.openTemplateSelectDialog().then(templateId => {
					this.openPrintWindow(link, templateId, openInNewWindow);
				}).catch(() => {});
			} else {
				const selectedPrintTemplate = this.getSinglePrintTemplate();
				this.openPrintWindow(link, selectedPrintTemplate.id, openInNewWindow);
			}
		}
		validatePrintTemplates() {
			if (!main_core.Type.isArray(this.printTemplates) || this.printTemplates.length <= 0) {
				this.showError(this.messages.errorNoPrintTemplates);
				return false;
			}
			return true;
		}
		getSinglePrintTemplate() {
			return this.printTemplates[this.printTemplates.length - 1];
		}
		openTemplateSelectDialog() {
			return new Promise((resolve, reject) => {
				const templateSelectDialogContent = main_core.Tag.render`
				<div class="ui-form ui-form-line">
					<div class="ui-form-row">
						<div class="ui-form-label">
							<div class="ui-ctl-label-text">${this.messages.template}</div>
						</div>
						<div class="ui-form-content">
							<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
								<div class="ui-ctl-after ui-ctl-icon-angle"></div>
								<select class="ui-ctl-element">
								</select>
							</div>
						</div>
					</div>
				</div>
			`;
				const select = templateSelectDialogContent.querySelector('select');
				this.printTemplates.forEach(({
					id,
					name
				}) => {
					select.appendChild(main_core.Tag.render` <option value="${main_core.Text.encode(id)}">${main_core.Text.encode(name)}</option> `);
				});
				const popup = new main_popup.Popup({
					titleBar: this.messages.selectTemplate,
					content: templateSelectDialogContent,
					closeByEsc: true,
					closeIcon: true,
					buttons: [new ui_buttons.Button({
						text: this.messages.print,
						onclick: (button, event) => {
							const selectedTemplateId = select.value;
							popup.destroy();
							resolve(Number(selectedTemplateId));
						}
					})],
					events: {
						onClose: () => {
							reject('Template select dialog was closed');
						}
					}
				});
				popup.show();
			});
		}
		openPrintWindow(link, templateId, openInNewWindow) {
			link.setQueryParam('PAY_SYSTEM_ID', templateId);
			if (openInNewWindow) {
				jsUtils.OpenWindow(link.toString(), printWindowWidth, printWindowHeight);
			} else {
				jsUtils.Redirect([], link.toString());
			}
		}
		handleEmail() {
			if (!this.validatePrintTemplates()) {
				return;
			}
			if (!this.emailSettings) {
				this.showError(this.messages.errorNoEmailSettings);
				return;
			}
			if (this.isMultipleTemplates) {
				this.openTemplateSelectDialog().then(templateId => {
					this.sendViaEmail(templateId);
				}).catch(() => {});
			} else {
				const selectedPrintTemplate = this.getSinglePrintTemplate();
				this.sendViaEmail(selectedPrintTemplate.id);
			}
		}
		sendViaEmail(templateId) {
			this.emailSettings.ownerPSID = templateId;
			if (!top.BX.SidePanel.Instance) {
				this.modifyEmailSettings(this.emailSettings).then(emailSettings => {
					this.getActivityEditor().addEmail(emailSettings);
				}).catch(this.showErrorsFromResponse.bind(this));
				return;
			}
			this.getActivityEditor().addEmail(this.emailSettings);
		}
		modifyEmailSettings(emailSettings) {
			return main_core.ajax.runComponentAction('bitrix:crm.quote.details', 'createEmailAttachment', {
				mode: 'class',
				signedParameters: this.signedParameters,
				analyticsLabel: 'crmQuoteDetailsSendViaEmail',
				data: {
					entityTypeId: this.entityTypeId,
					id: this.id,
					paymentSystemId: emailSettings.ownerPSID
				}
			}).then(response => {
				const data = response.data;
				emailSettings.storageTypeID = data['STORAGE_TYPE_ID'];
				if (emailSettings.storageTypeID === BX.CrmActivityStorageType.webdav) {
					emailSettings.webdavelements = [data];
				} else if (emailSettings.storageTypeID === BX.CrmActivityStorageType.disk) {
					emailSettings.diskfiles = [Number(data.ID)];
				} else if (emailSettings.storageTypeID === BX.CrmActivityStorageType.file) {
					emailSettings.files = [data];
				}
				return emailSettings;
			});
		}
		getActivityEditor() {
			return BX.CrmActivityEditor.items[this.activityEditorId];
		}
	}
	namespace.QuoteDetailsComponent = QuoteDetailsComponent;

})(BX.Crm, BX.Crm.Integration.Analytics, BX.Crm, BX, BX.Event, BX.Main, BX.UI);
//# sourceMappingURL=script.js.map
