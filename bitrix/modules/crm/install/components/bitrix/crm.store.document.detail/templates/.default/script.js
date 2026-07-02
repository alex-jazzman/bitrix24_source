/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Store = this.BX.Crm.Store || {};
(function (exports, ui_designTokens, main_core, catalog_entityCard, main_core_events, main_popup, ui_buttons, ui_label, spotlight, catalog_storeEnableWizard, catalog_toolAvailabilityManager) {
	'use strict';

	class DocumentOnboardingManager {
		#onboardingData;
		#documentGuid;
		#productListController = null;
		constructor(params) {
			this.#onboardingData = params.onboardingData;
			this.#documentGuid = params.documentGuid;
			if (params.productListController) {
				this.#productListController = params.productListController;
			}
		}
		processOnboarding() {
			const chain = this.#onboardingData.chain;
			const step = this.#onboardingData.chainStep;
			if (chain === 1 && step === 1) {
				const rowId = this.#getFirstProductRow();
				if (rowId) {
					this.#hintProductListField(rowId);
				}
			}
		}
		#hintProductListField(rowId = '') {
			const buttonsContainer = document.querySelector(`#${this.#documentGuid}_TABS_MENU`);
			const spotlight = new BX.SpotLight({
				id: 'arrow_spotlight',
				targetElement: document.querySelector('[data-tab-id=tab_products]'),
				autoSave: true,
				targetVertex: "middle-center",
				zIndex: 200
			});
			spotlight.show();
			spotlight.container.style.pointerEvents = "none";
			const productListTabListener = event => {
				spotlight.close();
				const [productListEditor] = event.data;
				const buttonsPanelListener = () => {
					const activeHint = productListEditor.getActiveHint();
					if (activeHint !== null) {
						activeHint.close();
						main_core.Event.unbind(buttonsContainer, 'click', buttonsPanelListener);
					}
				};
				main_core.Event.bind(buttonsContainer, 'click', buttonsPanelListener);
				const tabChangeListener = event => {
					if (event?.data?.tabId === 'tab_products') {
						return;
					}
					productListEditor.getActiveHint()?.close();
				};
				productListEditor.showFieldTourHint('AMOUNT', {
					title: main_core.Loc.getMessage('CRM_STORE_DOCUMENT_WAREHOUSE_PRODUCT_AMOUNT_GUIDE_TITLE_2'),
					text: main_core.Loc.getMessage('CRM_STORE_DOCUMENT_WAREHOUSE_PRODUCT_AMOUNT_GUIDE_TEXT')
				}, () => {
					main_core.userOptions.save('crm', 'warehouse-onboarding', 'secondChainStage', 2);
					main_core.userOptions.save('crm', 'warehouse-onboarding', 'chainStage', 2);
					main_core.Event.unbind(buttonsContainer, 'click', buttonsPanelListener);
					main_core_events.EventEmitter.unsubscribe('onDemandRecalculateWrapper', productListTabListener);
					main_core_events.EventEmitter.unsubscribe('BX.Catalog.EntityCard.TabManager:onOpenTab', tabChangeListener);
				}, [], rowId);
				main_core_events.EventEmitter.subscribe('BX.Catalog.EntityCard.TabManager:onOpenTab', tabChangeListener);
			};
			main_core_events.EventEmitter.subscribe('onDemandRecalculateWrapper', productListTabListener);
		}
		#getFirstProductRow() {
			const productList = this.#getProductList();
			for (const product of productList) {
				if (!product.getModel().isService()) {
					return product.getId();
				}
			}
			return '';
		}
		#getProductList() {
			if (this.#productListController && this.#productListController.productList) {
				if (this.#productListController.productList.products instanceof Array) {
					return this.#productListController.productList.products;
				}
			}
			return [];
		}
	}

	class Document extends catalog_entityCard.BaseCard {
		static #instance;
		static saveAndDeductAction = 'saveAndDeduct';
		static deductAction = 'deduct';
		static cancelDeductAction = 'cancelDeduct';
		static HELP_COST_CALCULATION_MODE_ARTICLE_ID = 17858278;
		#documentOnboardingManager = null;
		constructor(id, settings) {
			super(id, settings);
			this.isDocumentDeducted = settings.documentStatus === 'Y';
			this.isDeductLocked = settings.isDeductLocked;
			this.masterSliderUrl = settings.masterSliderUrl;
			this.inventoryManagementSource = settings.inventoryManagementSource;
			this.permissions = settings.permissions;
			this.isInventoryManagementDisabled = settings.isInventoryManagementDisabled;
			this.inventoryManagementFeatureCode = settings.inventoryManagementFeatureCode;
			this.lockedCancellation = settings.isProductBatchMethodSelected;
			this.isOnecMode = settings.isOnecMode;
			this.insidePageTitleConfig = settings.insidePageTitleConfig || {};
			if (main_core.Type.isPlainObject(this.insidePageTitleConfig)) {
				this.appendInsidePageTitle(this.insidePageTitleConfig);
			}
			this.addCopyLinkPopup();
			main_core_events.EventEmitter.subscribe('BX.Crm.EntityEditor:onFailedValidation', event => {
				main_core_events.EventEmitter.emit('BX.Catalog.EntityCard.TabManager:onOpenTab', {
					tabId: 'main'
				});
			});
			main_core_events.EventEmitter.subscribe('onProductsCheckFailed', event => {
				main_core_events.EventEmitter.emit('BX.Catalog.EntityCard.TabManager:onOpenTab', {
					tabId: 'tab_products'
				});
			});
			main_core_events.EventEmitter.subscribe('BX.Crm.EntityEditor:onSave', event => {
				const eventEditor = event.data[0];
				if (eventEditor && eventEditor._ajaxForm) {
					if (this.isInventoryManagementDisabled) {
						event.data[1].cancel = true;
						eventEditor._toolPanel?.setLocked(false);
						return;
					}
					let action = eventEditor._ajaxForm?._actionName === 'SAVE' ? 'save' : eventEditor._ajaxForm?._config.data.ACTION;
					if (action === Document.saveAndDeductAction) {
						const controllersErrorCollection = this.getControllersIssues(eventEditor.getControllers());
						if (controllersErrorCollection.length > 0) {
							event.data[1].cancel = true;
							eventEditor._toolPanel?.setLocked(false);
							eventEditor._toolPanel?.addError(controllersErrorCollection[0]);
							return;
						}
					}
					if (action === 'SAVE') {
						// for consistency in analytics tags
						action = 'save';
					}
					const urlParams = {
						isNewDocument: this.entityId <= 0 ? 'Y' : 'N',
						inventoryManagementSource: this.inventoryManagementSource
					};
					if (action) {
						urlParams.action = action;
					}
					eventEditor._ajaxForm.addUrlParams(urlParams);
				}
			});
			main_core_events.EventEmitter.subscribe('BX.Catalog.EntityCard.TabManager:onSelectItem', event => {
				const tabId = event.data.tabId;
				if (tabId === 'tab_products' && !this.isTabAnalyticsSent) {
					this.sendAnalyticsData({
						tab: 'products',
						isNewDocument: this.entityId <= 0 ? 'Y' : 'N',
						documentType: 'W',
						inventoryManagementSource: this.inventoryManagementSource
					});
					this.isTabAnalyticsSent = true;
				}
			});
			this.#subscribeToProductRowSummaryEvents();
			Document.#instance = this;
			BX.UI.SidePanel.Wrapper.setParam('closeAfterSave', true);
			this.showNotificationOnClose = false;
		}
		appendInsidePageTitle(config) {
			const toolbar = BX.UI?.ToolbarManager?.getDefaultToolbar();
			const titleContainer = toolbar?.titleContainer.querySelector('.ui-toolbar-title-item-box');
			if (!titleContainer) {
				return;
			}
			let pageLink = null;
			if (config.enablePageLink) {
				pageLink = main_core.Tag.render`
				<span id="${this.settings.copyLinkButtonId}" class="page-link-btn"></span>
			`;
			}
			if (pageLink) {
				const buttonContainer = main_core.Tag.render`
				<span id="pagetitle_btn_wrapper" class="pagetitile-button-container"></span>
			`;
				main_core.Dom.append(pageLink, buttonContainer);
				main_core.Dom.append(buttonContainer, titleContainer);
			}
			if (config.enableStatusLabel) {
				const labelOptions = {
					text: config.statusLabel.text,
					color: config.statusLabel.color,
					size: ui_label.LabelSize.LG,
					link: '',
					fill: true,
					customClass: 'document-status-label'
				};
				const label = new ui_label.Label(labelOptions);
				main_core.Dom.append(label.render(), titleContainer);
			}
		}
		#subscribeToProductRowSummaryEvents() {
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorProductRowSummary:onDetailProductListLinkClick', () => {
				main_core_events.EventEmitter.emit('BX.Catalog.EntityCard.TabManager:onOpenTab', {
					tabId: 'tab_products'
				});
			});
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorProductRowSummary:onAddNewRowInProductList', () => {
				main_core_events.EventEmitter.emit('BX.Catalog.EntityCard.TabManager:onOpenTab', {
					tabId: 'tab_products'
				});
				setTimeout(() => {
					main_core_events.EventEmitter.emit('onFocusToProductList');
				}, 500);
			});
		}
		focusOnTab(tabId) {
			main_core_events.EventEmitter.emit('BX.Catalog.EntityCard.TabManager:onOpenTab', {
				tabId: tabId
			});
		}
		getControllersIssues(controllers) {
			const validateErrorCollection = [];
			if (Array.isArray(controllers)) {
				controllers.forEach(controller => {
					if (controller instanceof BX.Crm.EntityStoreDocumentProductListController) {
						validateErrorCollection.push(...controller.getErrorCollection());
					}
				});
			}
			return validateErrorCollection;
		}
		static getInstance() {
			return Document.#instance;
		}
		openMasterSlider() {
			const card = this;
			new catalog_storeEnableWizard.EnableWizardOpener().open(this.masterSliderUrl, {
				urlParams: {
					analyticsContextSection: catalog_storeEnableWizard.AnalyticsContextList.DOCUMENT_CARD
				},
				data: {
					openGridOnDone: false
				},
				events: {
					onCloseComplete: function (event) {
						const slider = event.getSlider();
						if (!slider) {
							return;
						}
						if (slider.getData().get('isInventoryManagementEnabled')) {
							card.isDeductLocked = false;
							BX.SidePanel.Instance.getOpenSliders().forEach(slider => {
								if (slider.getWindow()?.BX.Catalog?.DocumentGridManager) {
									slider.allowChangeHistory = false;
									slider.getWindow().location.reload();
								}
							});
						}
					}
				}
			});
		}

		/**
		 * adds the "deduct" and "save and deduct" buttons to the tool panel
		 * using entity-editor's api to preserve the logic
		 */
		adjustToolPanel() {
			const editor = this.getEditorInstance();
			if (!editor) {
				return;
			}
			const savePanel = editor._toolPanel;
			const saveButton = editor._toolPanel._editButton;
			this.defaultSaveActionName = editor._ajaxForm._config.data.ACTION;
			this.defaultOnSuccessCallback = editor._ajaxForm._config.onsuccess;
			saveButton.onclick = event => {
				if (this.isInventoryManagementDisabled) {
					this.showPlanRestrictedSlider();
					return;
				}
				this.showNotificationOnClose = false;
				editor._ajaxForm._config.data.ACTION = this.defaultSaveActionName;
				editor._ajaxForm._config.onsuccess = this.defaultOnSuccessCallback;
				savePanel.onSaveButtonClick(event);
			};
			if (this.permissions.conduct && !this.isDocumentDeducted) {
				const deductAndSaveButton = main_core.Tag.render`<button class="ui-btn ui-btn-light-border">${main_core.Loc.getMessage('CRM_STORE_DOCUMENT_DETAIL_SAVE_AND_DEDUCT_BUTTON')}</button>`;
				deductAndSaveButton.onclick = event => {
					if (this.isInventoryManagementDisabled) {
						this.showPlanRestrictedSlider();
						return;
					}
					if (this.isDeductLocked) {
						this.openMasterSlider();
						return;
					}
					editor._ajaxForm._config.data.ACTION = Document.saveAndDeductAction;
					editor._ajaxForm._config.onsuccess = result => {
						this.showNotificationOnClose = true;
						const error = BX.prop.getString(result, 'ERROR', '');
						if (!error) {
							this.setViewModeButtons(editor);
						}
						editor.onSaveSuccess(result);
					};
					savePanel.onSaveButtonClick(event);
				};
				saveButton.after(deductAndSaveButton);
				this.deductAndSaveButton = deductAndSaveButton;
				const deductButton = new ui_buttons.Button({
					text: main_core.Loc.getMessage('CRM_STORE_DOCUMENT_DETAIL_DEDUCT_BUTTON'),
					color: ui_buttons.ButtonColor.LIGHT_BORDER,
					onclick: (button, event) => {
						if (savePanel.isLocked()) {
							return;
						}
						if (this.isInventoryManagementDisabled) {
							this.showPlanRestrictedSlider();
							return;
						}
						if (this.isDeductLocked) {
							this.openMasterSlider();
							return;
						}
						button.setState(ui_buttons.ButtonState.CLOCKING);
						savePanel.setLocked(true);
						const actionName = Document.deductAction;
						const controllers = editor.getControllers();
						const errorCollection = [];
						controllers.forEach(controller => {
							if (controller instanceof BX.Crm.EntityStoreDocumentProductListController && !controller.validateProductList()) {
								errorCollection.push(...controller.getErrorCollection());
							}
						});
						if (errorCollection.length > 0) {
							savePanel.clearErrors();
							savePanel.addError(errorCollection[0]);
							savePanel.setLocked(false);
							button.setActive(true);
							return;
						}
						let formData = {};
						if (window.EntityEditorDocumentOrderShipmentController) {
							formData = window.EntityEditorDocumentOrderShipmentController.demandFormData();
						}
						const deductDocumentAjaxForm = editor.createAjaxForm({
							actionName: actionName,
							enableRequiredUserFieldCheck: false,
							formData: formData
						}, {
							onSuccess: result => {
								if (!this.isDocumentDeducted) {
									this.showNotificationOnClose = true;
								}
								button.setState(ui_buttons.ButtonState.ACTIVE);
								editor.onSaveSuccess(result);
							},
							onFailure: result => {
								button.setState(ui_buttons.ButtonState.ACTIVE);
								editor.onSaveFailure(result);
							}
						});
						deductDocumentAjaxForm.addUrlParams({
							action: actionName,
							documentType: 'W'
						});
						deductDocumentAjaxForm.submit();
					}
				}).render();
				saveButton.after(deductButton);
				this.deductButton = deductButton;
			} else if (this.permissions.cancel && !this.isDisabledCancellation()) {
				const deductButton = new ui_buttons.Button({
					text: main_core.Loc.getMessage('CRM_STORE_DOCUMENT_DETAIL_CANCEL_DEDUCT_BUTTON'),
					color: ui_buttons.ButtonColor.LIGHT_BORDER,
					onclick: (button, event) => {
						if (savePanel.isLocked()) {
							return;
						}
						if (this.isInventoryManagementDisabled) {
							this.showPlanRestrictedSlider();
							return;
						}
						if (this.isDeductLocked) {
							this.openMasterSlider();
							return;
						}
						if (this.isLockedCancellation()) {
							this.showCancellationInfo();
							return;
						}
						button.setState(ui_buttons.ButtonState.CLOCKING);
						savePanel.setLocked(true);
						const actionName = Document.cancelDeductAction;
						let formData = {};
						if (window.EntityEditorDocumentOrderShipmentController) {
							formData = window.EntityEditorDocumentOrderShipmentController.demandFormData();
						}
						const deductDocumentAjaxForm = editor.createAjaxForm({
							actionName: actionName,
							enableRequiredUserFieldCheck: false,
							formData: formData
						}, {
							onSuccess: result => {
								if (!this.isDocumentDeducted) {
									this.showNotificationOnClose = true;
								}
								button.setState(ui_buttons.ButtonState.ACTIVE);
								editor.onSaveSuccess(result);
							},
							onFailure: result => {
								button.setState(ui_buttons.ButtonState.ACTIVE);
								editor.onSaveFailure(result);
							}
						});
						deductDocumentAjaxForm.addUrlParams({
							action: actionName,
							documentType: 'W',
							inventoryManagementSource: this.inventoryManagementSource
						});
						deductDocumentAjaxForm.submit();
					}
				}).render();
				saveButton.after(deductButton);
				this.deductButton = deductButton;
			}
			main_core_events.EventEmitter.subscribe('BX.Crm.EntityEditor:onControlModeChange', event => {
				const eventEditor = event.data[0];
				const control = event.data[1].control;
				if (control.getMode() === BX.Crm.EntityEditorMode.edit) {
					this.setEditModeButtons(eventEditor);
				} else {
					this.setViewModeButtons(eventEditor);
				}
			});
			main_core_events.EventEmitter.subscribe('BX.Crm.EntityEditor:onControlChange', event => {
				const eventEditor = event.data[0];
				this.setEditModeButtons(eventEditor);
			});
			main_core_events.EventEmitter.subscribe('BX.Crm.EntityEditor:onControllerChange', event => {
				const eventEditor = event.data[0];
				this.setEditModeButtons(eventEditor);
			});
			main_core_events.EventEmitter.subscribe('BX.Crm.EntityEditor:onSwitchToViewMode', event => {
				const eventEditor = event.data[0];
				this.setViewModeButtons(eventEditor);
			});
			main_core_events.EventEmitter.subscribe('BX.Crm.EntityEditor:onNothingChanged', event => {
				const eventEditor = event.data[0];
				this.setViewModeButtons(eventEditor);
			});
			main_core_events.EventEmitter.subscribe('onEntityCreate', event => {
				const editor = event?.data[0]?.sender;
				if (editor) {
					editor._toolPanel.disableSaveButton();
					editor.hideToolPanel();
				}
			});
			main_core_events.EventEmitter.subscribe('beforeCrmEntityRedirect', event => {
				const editor = event?.data[0]?.sender;
				if (editor) {
					editor._toolPanel.disableSaveButton();
					editor.hideToolPanel();
					if (this.showNotificationOnClose) {
						let url = event.data[0].redirectUrl;
						if (!url) {
							return;
						}
						url = BX.Uri.removeParam(url, 'closeOnSave');
						window.top.BX.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('CRM_STORE_DOCUMENT_SAVE_AND_CONDUCT_NOTIFICATION'),
							actions: [{
								title: main_core.Loc.getMessage('CRM_STORE_DOCUMENT_OPEN_DOCUMENT'),
								href: url,
								events: {
									click: function (event, balloon, action) {
										balloon.close();
									}
								}
							}]
						});
					}
				}
			});
			if (editor.isNew()) {
				this.setEditModeButtons(editor);
			} else {
				this.setViewModeButtons(editor);
			}
		}
		showPlanRestrictedSlider() {
			if (this.isOnecMode) {
				catalog_toolAvailabilityManager.OneCPlanRestrictionSlider.show();
			} else if (this.inventoryManagementFeatureCode) {
				top.BX.UI.InfoHelper.show(this.inventoryManagementFeatureCode);
			}
		}
		isLockedCancellation() {
			return this.lockedCancellation;
		}
		isDisabledCancellation() {
			return this.isOnecMode;
		}
		showCancellationInfo() {
			const popup = new main_popup.Popup(null, null, {
				events: {
					onPopupClose: () => {
						popup.destroy();
					}
				},
				content: this.getCancellationPopupContent(),
				overlay: true,
				buttons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('CRM_STORE_DOCUMENT_WAREHOUSE_PRODUCT_CANCELLATION_POPUP_YES'),
					color: ui_buttons.Button.Color.PRIMARY,
					onclick: () => {
						this.lockedCancellation = false;
						if (this.deductButton) {
							this.deductButton.click();
						}
						popup.close();
					}
				}), new BX.UI.Button({
					text: main_core.Loc.getMessage('CRM_STORE_DOCUMENT_WAREHOUSE_PRODUCT_CANCELLATION_POPUP_NO'),
					color: BX.UI.Button.Color.LINK,
					onclick: () => {
						popup.close();
					}
				})]
			});
			popup.show();
		}
		getCancellationPopupContent() {
			const moreLink = main_core.Tag.render`<a href="#" class="ui-form-link">${main_core.Loc.getMessage('CRM_STORE_DOCUMENT_WAREHOUSE_PRODUCT_CANCELLATION_POPUP_LINK')}</a>`;
			main_core.Event.bind(moreLink, 'click', () => {
				if (top.BX.Helper) {
					top.BX.Helper.show(`redirect=detail&code=${Document.HELP_COST_CALCULATION_MODE_ARTICLE_ID}`);
				}
			});
			const descriptionHtml = main_core.Tag.render`
			<div>${main_core.Loc.getMessage('CRM_STORE_DOCUMENT_WAREHOUSE_PRODUCT_CANCELLATION_POPUP_HINT').replace('#HELP_LINK#', '<help-link></help-link>')}</div>
		`;
			main_core.Dom.replace(descriptionHtml.querySelector('help-link'), moreLink);
			return main_core.Tag.render`
			<div>
				<h3>${main_core.Loc.getMessage('CRM_STORE_DOCUMENT_WAREHOUSE_PRODUCT_CANCELLATION_POPUP_TITLE')}</h3>
				<div>${main_core.Text.encode(main_core.Loc.getMessage('CRM_STORE_DOCUMENT_WAREHOUSE_PRODUCT_CANCELLATION_POPUP_QUESTION'))}
				<br>${descriptionHtml}<div>
			</div>
		`;
		}
		setViewModeButtons(editor) {
			if (editor._toolPanel && editor._toolPanel.hasOwnProperty('_cancelButton')) {
				BX.hide(editor._toolPanel._cancelButton);
			}
			if (editor._toolPanel && editor._toolPanel.hasOwnProperty('_editButton')) {
				BX.hide(editor._toolPanel._editButton);
			}
			if (this.deductAndSaveButton) {
				BX.hide(this.deductAndSaveButton);
			}
			if (this.deductButton) {
				BX.show(this.deductButton);
			}
		}
		setEditModeButtons(editor) {
			if (editor._toolPanel && editor._toolPanel.hasOwnProperty('_cancelButton')) {
				BX.show(editor._toolPanel._cancelButton);
			}
			if (editor._toolPanel && editor._toolPanel.hasOwnProperty('_editButton')) {
				BX.show(editor._toolPanel._editButton);
			}
			if (this.deductAndSaveButton && !this.isDocumentDeducted) {
				BX.show(this.deductAndSaveButton);
			}
			if (this.deductButton && !this.isDocumentDeducted) {
				BX.hide(this.deductButton);
			}
		}
		getEditorInstance() {
			if (main_core.Reflection.getClass('BX.Crm.EntityEditor')) {
				return BX.Crm.EntityEditor.getDefault();
			}
			return null;
		}
		addCopyLinkPopup() {
			const copyLinkButton = document.getElementById(this.settings.copyLinkButtonId);
			if (!copyLinkButton) {
				return;
			}
			copyLinkButton.onclick = () => {
				this.copyDocumentLinkToClipboard();
			};
		}
		copyDocumentLinkToClipboard() {
			const url = BX.util.remove_url_param(window.location.href, ['IFRAME', 'IFRAME_TYPE']);
			if (!BX.clipboard.copy(url)) {
				return;
			}
			var popup = new BX.PopupWindow('catalog_copy_document_url_to_clipboard', document.getElementById(this.settings.copyLinkButtonId), {
				content: main_core.Loc.getMessage('CRM_STORE_DOCUMENT_DETAIL_LINK_COPIED'),
				darkMode: true,
				autoHide: true,
				zIndex: 1000,
				angle: true,
				bindOptions: {
					position: 'top'
				}
			});
			popup.show();
			setTimeout(() => {
				popup.close();
			}, 1500);
		}
		sendAnalyticsData(data) {
			BX.ajax.runComponentAction('bitrix:crm.store.document.detail', 'sendAnalytics', {
				mode: 'class',
				analyticsLabel: data
			});
		}
		enableOnboardingChain(onboardingData) {
			if (this.#documentOnboardingManager === null) {
				this.#documentOnboardingManager = new DocumentOnboardingManager({
					onboardingData: onboardingData,
					documentGuid: this.id,
					productListController: this.getProductListController()
				});
				this.#documentOnboardingManager.processOnboarding();
			}
		}
		getProductListController() {
			const editor = this.getEditorInstance();
			const controllers = editor.getControllers();
			for (const controller of controllers) {
				if (controller instanceof BX.Crm.EntityStoreDocumentProductListController) {
					return controller;
				}
			}
			return null;
		}
	}

	exports.Document = Document;

})(this.BX.Crm.Store.DocumentCard = this.BX.Crm.Store.DocumentCard || {}, BX, BX, BX.Catalog.EntityCard, BX.Event, BX.Main, BX.UI, BX.UI, BX, BX.Catalog.Store, BX.Catalog);
//# sourceMappingURL=script.js.map
