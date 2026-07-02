/* eslint-disable */
this.BX = this.BX || {};
(function (exports, crm_integration_analytics, crm_itemDetailsComponent_pagetitle, crm_itemDetailsComponent_stageFlow, crm_messagesender, crm_router, crm_stageModel, crm_stage_permissionChecker, main_core, main_core_events, main_loader, ui_dialogs_messagebox, ui_notification) {
	'use strict';

	const BACKGROUND_COLOR = 'd3d7dc';
	class ItemDetailsComponent {
		categoryId = null;
		permissionChecker = null;
		receiversJSONString = '';
		targetUpdateStage = null;
		stageBeforeUpdate = null;
		constructor(params) {
			if (main_core.Type.isPlainObject(params)) {
				this.entityTypeId = main_core.Text.toInteger(params.entityTypeId);
				this.entityTypeName = params.entityTypeName;
				this.id = main_core.Text.toInteger(params.id);
				if (BX.Crm.PartialEditorDialog && params.serviceUrl) {
					this.partialEditorId = 'partial_editor_' + this.entityTypeId + '_' + this.id;
					BX.Crm.PartialEditorDialog.registerEntityEditorUrl(this.entityTypeId, params.serviceUrl);
				}
				if (params.hasOwnProperty('editorContext')) {
					this.editorContext = params.editorContext;
				}
				if (params.hasOwnProperty('categoryId')) {
					this.categoryId = main_core.Text.toInteger(params.categoryId);
					this.categories = params.categories;
				}
				if (main_core.Type.isElementNode(params.errorTextContainer)) {
					this.errorTextContainer = params.errorTextContainer;
				}
				if (main_core.Type.isArray(params.stages)) {
					this.stages = [];
					params.stages.forEach(data => {
						this.stages.push(new crm_stageModel.StageModel(data));
					});
					this.permissionChecker = crm_stage_permissionChecker.PermissionChecker.createFromStageModels(this.stages);
				}
				this.currentStageId = params.currentStageId;
				this.messages = params.messages;
				this.signedParameters = params.signedParameters;
				this.userFieldCreateUrl = params.userFieldCreateUrl;
				this.editorGuid = params.editorGuid;
				this.isStageFlowActive = params.isStageFlowActive;
				this.pullTag = params.pullTag;
				this.bizprocStarterConfig = params.bizprocStarterConfig;
				this.analyticsData = main_core.Type.isPlainObject(params.analytics) ? params.analytics : {};
				this.automationCheckAutomationTourGuideData = main_core.Type.isPlainObject(params.automationCheckAutomationTourGuideData) ? params.automationCheckAutomationTourGuideData : null;
				if (main_core.Type.isString(params.receiversJSONString)) {
					this.receiversJSONString = params.receiversJSONString;
				}
				if (main_core.Type.isStringFilled(params.categorySelectorTarget)) {
					this.categorySelectorTarget = params.categorySelectorTarget;
				}
			}
			this.container = document.querySelector('[data-role="crm-item-detail-container"]');
			this.handleClosePartialEntityEditor = this.handleClosePartialEntityEditor.bind(this);
			this.handleErrorPartialEntityEditor = this.handleErrorPartialEntityEditor.bind(this);
		}
		isNew() {
			return this.id <= 0;
		}
		getLoader() {
			if (!this.loader) {
				this.loader = new main_loader.Loader({
					size: 200,
					offset: {
						left: '-100px',
						top: '-200px'
					}
				});
				this.loader.layout.style.zIndex = 300;
			}
			return this.loader;
		}
		startProgress() {
			this.isProgress = true;
			if (!this.getLoader().isShown() && this.container) {
				this.getLoader().show(this.container);
			}
			this.hideErrors();
		}
		stopProgress() {
			this.isProgress = false;
			this.getLoader().hide();
		}
		startStageUpdateProgress(stage) {
			this.isProgress = true;
			this.targetUpdateStage = stage;
			this.stageflowChart.adjust();
		}
		stopStageUpdateProgress() {
			this.isProgress = false;
			this.targetUpdateStage = null;
			this.stageflowChart.adjust();
		}
		showStageUpdatingNotification() {
			if (this.targetUpdateStage === null || !this.messages.stageLoadingMessage) {
				return;
			}
			const stageName = main_core.Text.encode(this.targetUpdateStage.getName());
			ui_notification.UI.Notification.Center.notify({
				content: this.messages.stageLoadingMessage.replace('#stage#', stageName),
				autoHideDelay: 3000
			});
		}
		isStageUpdating() {
			return this.targetUpdateStage !== null && this.isProgress;
		}
		getStageById(id) {
			let result = null;
			let key = 0;
			while (true) {
				if (!this.stages[key]) {
					break;
				}
				const stage = this.stages[key];
				if (stage.getId() === id) {
					result = stage;
					break;
				}
				key++;
			}
			return result;
		}
		getStageByStatusId(statusId) {
			let result = null;
			let key = 0;
			while (true) {
				if (!this.stages[key]) {
					break;
				}
				const stage = this.stages[key];
				if (stage.getStatusId() === statusId) {
					result = stage;
					break;
				}
				key++;
			}
			return result;
		}
		init() {
			this.initStageFlow();
			this.bindEvents();
			this.initReceiversRepository();
			this.initCategoriesSelector();
			if (!this.isNew()) {
				this.initPull();
				this.initTours();
			}
		}
		initReceiversRepository() {
			crm_messagesender.ReceiverRepository.onDetailsLoad(this.entityTypeId, this.id, this.receiversJSONString);
		}
		initCategoriesSelector() {
			if (!main_core.Type.isArrayFilled(this.categories) || !main_core.Type.isStringFilled(this.categorySelectorTarget)) {
				return;
			}
			const changer = crm_itemDetailsComponent_pagetitle.CategoryChanger.renderToTarget(this.categorySelectorTarget, {
				entityTypeId: this.entityTypeId,
				entityId: this.id,
				categoryId: this.categoryId,
				categories: this.categories,
				editorGuid: this.editorGuid
			});
			if (!changer) {
				return;
			}
			changer.subscribe('onProgressStart', this.startProgress.bind(this));
			changer.subscribe('onProgressStop', this.stopProgress.bind(this));
		}
		initStageFlow() {
			if (!this.stages) {
				return;
			}
			const flowStagesData = this.prepareStageFlowStagesData();
			const stageFlowContainer = document.querySelector('[data-role="stageflow-wrap"]');
			if (!stageFlowContainer) {
				return;
			}
			const chartParams = {
				backgroundColor: BACKGROUND_COLOR,
				currentStage: this.currentStageId,
				isActive: this.isStageFlowActive === true,
				onStageChange: this.onStageChange.bind(this),
				labels: {
					finalStageName: main_core.Loc.getMessage('CRM_ITEM_DETAIL_STAGEFLOW_FINAL_STAGE_NAME'),
					finalStagePopupTitle: main_core.Loc.getMessage('CRM_ITEM_DETAIL_STAGEFLOW_FINAL_STAGE_POPUP'),
					finalStagePopupFail: main_core.Loc.getMessage('CRM_ITEM_DETAIL_STAGEFLOW_FINAL_STAGE_POPUP_FAIL'),
					finalStageSelectorTitle: main_core.Loc.getMessage('CRM_ITEM_DETAIL_STAGEFLOW_FINAL_STAGE_SELECTOR')
				}
			};
			this.stageflowChart = new crm_itemDetailsComponent_stageFlow.Chart(chartParams, flowStagesData, this.permissionChecker, this.getStageById.bind(this), this.isStageUpdating.bind(this), main_core.Runtime.throttle(this.showStageUpdatingNotification.bind(this), 300), this.isNew(), this.entityTypeId);
			main_core.Dom.append(this.stageflowChart.render(), stageFlowContainer);
		}
		prepareStageFlowStagesData() {
			const flowStagesData = [];
			this.stages.forEach(stage => {
				const data = stage.getData();
				let color = stage.getColor().indexOf('#') === 0 ? stage.getColor().substr(1) : stage.getColor();
				if (this.isNew()) {
					color = BACKGROUND_COLOR;
				}
				data.isSuccess = stage.isSuccess();
				data.isFail = stage.isFailure();
				data.color = color;
				flowStagesData.push(data);
			});
			return flowStagesData;
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('BX.Crm.ItemDetailsComponent:onClickDelete', this.handleItemDelete.bind(this));
			if (this.bizprocStarterConfig) {
				main_core_events.EventEmitter.subscribe('BX.Crm.ItemDetailsComponent:onClickBizprocTemplates', this.handleBPTemplatesShow.bind(this));
			}
			if (this.editorGuid && this.userFieldCreateUrl && BX.SidePanel && BX.Crm.EntityEditor) {
				main_core_events.EventEmitter.subscribe('BX.UI.EntityConfigurationManager:onCreateClick', this.handleUserFieldCreationUrlClick.bind(this));
			}
			main_core_events.EventEmitter.subscribe('BX.Crm.ItemDetailsComponent:onClickRecurringExpose', this.handleRecurringExpose.bind(this));
		}
		initPull() {
			const Pull = BX.PULL;
			if (!Pull) {
				console.error('pull is not initialized');
				return;
			}
			if (!this.pullTag) {
				return;
			}
			Pull.subscribe({
				moduleId: 'crm',
				command: this.pullTag,
				callback: params => {
					if (!params?.item?.data) {
						return;
					}
					const columnId = params.item.data.columnId;
					if (this.stageflowChart?.isActive) {
						const currentStage = this.getStageById(this.stageflowChart.currentStage);
						if (currentStage?.statusId !== columnId) {
							const newStage = this.getStageByStatusId(columnId);
							if (newStage) {
								this.updateStage(newStage);
							}
						}
					}
				}
			});
			Pull.extendWatch(this.pullTag);
		}
		getEditor() {
			if (BX.Crm.EntityEditor) {
				if (this.editorGuid) {
					return BX.Crm.EntityEditor.get(this.editorGuid);
				}
				return BX.Crm.EntityEditor.getDefault();
			}
			return null;
		}
		bindPartialEntityEditorEvents() {
			main_core_events.EventEmitter.subscribe('Crm.PartialEditorDialog.Close', this.handleClosePartialEntityEditor);
			main_core_events.EventEmitter.subscribe('Crm.PartialEditorDialog.Error', this.handleErrorPartialEntityEditor);
		}
		unBindPartialEntityEditorEvents() {
			main_core_events.EventEmitter.unsubscribe('Crm.PartialEditorDialog.Close', this.handleClosePartialEntityEditor);
			main_core_events.EventEmitter.unsubscribe('Crm.PartialEditorDialog.Error', this.handleErrorPartialEntityEditor);
		}
		onStageChange(stageFlowStage) {
			if (this.isProgress) {
				return;
			}
			const stage = this.getStageById(stageFlowStage.getId());
			if (!stage) {
				console.error('Wrong stage');
				return;
			}
			this.prepareAnalyticsData(stage);
			this.stageBeforeUpdate = this.getStageById(this.currentStageId);
			this.setStageToFlowChart(stage);
			this.startStageUpdateProgress(stage);
			main_core.ajax.runAction('crm.controller.item.update', {
				analyticsLabel: 'crmItemDetailsMoveItem',
				data: {
					entityTypeId: this.entityTypeId,
					id: this.id,
					fields: {
						stageId: stage.getStatusId()
					}
				}
			}).then(() => {
				this.sendAnalyticsData(crm_integration_analytics.Dictionary.STATUS_SUCCESS);
				this.stopStageUpdateProgress();
				let currentSlider = null;
				if (main_core.Reflection.getClass('BX.SidePanel.Instance.getTopSlider')) {
					currentSlider = BX.SidePanel.Instance.getTopSlider();
				}
				if (currentSlider !== null) {
					if (main_core.Reflection.getClass('BX.Crm.EntityEvent')) {
						let eventParams = null;
						if (currentSlider) {
							eventParams = {
								"sliderUrl": currentSlider.getUrl()
							};
						}
						BX.Crm.EntityEvent.fireUpdate(this.entityTypeId, this.id, '', eventParams);
					}
				}
				this.stageBeforeUpdate = null;
				this.updateStage(stage);
			}).catch(response => {
				this.stopStageUpdateProgress();
				if (this.stageBeforeUpdate !== null) {
					this.setStageToFlowChart(this.stageBeforeUpdate);
					this.stageBeforeUpdate = null;
				}
				if (!this.partialEditorId) {
					this.showErrorsFromResponse(response);
					return;
				}
				const requiredFields = [];
				response.errors.forEach(({
					code,
					customData
				}) => {
					if (code === 'CRM_FIELD_ERROR_REQUIRED' && customData.fieldName) {
						requiredFields.push(customData.fieldName);
					}
				});
				if (requiredFields.length > 0) {
					BX.Crm.PartialEditorDialog.close(this.partialEditorId);
					this.partialEntityEditor = BX.Crm.PartialEditorDialog.create(this.partialEditorId, {
						title: BX.prop.getString(this.messages, "partialEditorTitle", "Please fill in all required fields"),
						entityTypeName: this.entityTypeName,
						entityTypeId: this.entityTypeId,
						entityId: this.id,
						fieldNames: requiredFields,
						helpData: null,
						context: this.editorContext || null,
						isController: true,
						stageId: stage.getStatusId()
					});
					this.bindPartialEntityEditorEvents();
					this.partialEntityEditor.open();
				} else {
					this.sendAnalyticsData(crm_integration_analytics.Dictionary.STATUS_ERROR);
					this.showErrorsFromResponse(response);
				}
			});
		}
		updateStage(stage) {
			const currentStage = this.getStageById(this.stageflowChart.currentStage);
			this.setStageToFlowChart(stage);
			main_core_events.EventEmitter.emit('BX.Crm.ItemDetailsComponent:onStageChange', {
				entityTypeId: this.entityTypeId,
				id: this.id,
				stageId: stage.getStatusId(),
				previousStageId: currentStage ? currentStage.getStatusId() : null
			});
		}
		setStageToFlowChart(stage) {
			this.stageflowChart.setCurrentStageId(stage.getId());
		}
		showError(error) {
			if (main_core.Type.isElementNode(this.errorTextContainer)) {
				this.errorTextContainer.innerText = error;
				this.errorTextContainer.parentElement.style.display = 'block';
			} else {
				console.error(error);
			}
		}
		showErrors(errors) {
			let severalErrorsText = '';
			errors.forEach(message => {
				severalErrorsText = severalErrorsText + message + ' ';
			});
			this.showError(severalErrorsText);
		}
		hideErrors() {
			if (main_core.Type.isElementNode(this.errorTextContainer)) {
				this.errorTextContainer.innerText = '';
				this.errorTextContainer.parentElement.style.display = 'none';
			}
		}
		showErrorsFromResponse({
			errors
		}) {
			this.stopProgress();
			const messages = [];
			errors.forEach(({
				message
			}) => messages.push(message));
			this.showErrors(messages);
		}
		normalizeUrl(url) {
			// Allow redirects only in the current domain
			return url.setHost('');
		}

		// region EventHandlers
		handleItemDelete() {
			if (this.isProgress) {
				return;
			}
			ui_dialogs_messagebox.MessageBox.show({
				title: this.messages.deleteItemTitle,
				message: this.messages.deleteItemMessage,
				modal: true,
				buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_CANCEL,
				onYes: messageBox => {
					this.startProgress();
					main_core.ajax.runAction('crm.controller.item.delete', {
						data: {
							entityTypeId: this.entityTypeId,
							id: this.id,
							analytics: this.analyticsData
						}
					}).then(({
						data
					}) => {
						this.stopProgress();
						let currentSlider = null;
						if (main_core.Reflection.getClass('BX.SidePanel.Instance.getTopSlider')) {
							currentSlider = BX.SidePanel.Instance.getTopSlider();
						}
						if (currentSlider !== null) {
							if (main_core.Reflection.getClass('BX.Crm.EntityEvent')) {
								let eventParams = null;
								if (currentSlider) {
									eventParams = {
										'sliderUrl': currentSlider.getUrl()
									};
								}
								BX.Crm.EntityEvent.fireDelete(this.entityTypeId, this.id, '', eventParams);
							}
							currentSlider.close();
						} else {
							const link = data.redirectUrl;
							if (main_core.Type.isStringFilled(link)) {
								const url = this.normalizeUrl(new main_core.Uri(link));
								location.href = url.toString();
							}
						}
					}).catch(this.showErrorsFromResponse.bind(this));
					messageBox.close();
				}
			});
		}
		handleBPTemplatesShow(event) {
			if (this.bizprocStarterConfig.availabilityLock) {
				// eslint-disable-next-line no-eval
				eval(this.bizprocStarterConfig.availabilityLock);
				return;
			}
			const starter = new BX.Bizproc.Starter(this.bizprocStarterConfig);
			starter.showTemplatesMenu(event.data.button.button);
		}
		handleClosePartialEntityEditor(event) {
			this.unBindPartialEntityEditorEvents();
			this.stopProgress();
			const data = event.getData();
			if (main_core.Type.isArray(data) && data.length === 2) {
				const parameters = data[1];
				if (parameters.isCancelled) {
					this.sendAnalyticsData(crm_integration_analytics.Dictionary.STATUS_ERROR);
					return;
				}
				const stage = this.getStageByStatusId(parameters.stageId);
				if (!stage) {
					this.sendAnalyticsData(crm_integration_analytics.Dictionary.STATUS_ERROR);
					return;
				}
				this.updateStage(stage);
				this.sendAnalyticsData(crm_integration_analytics.Dictionary.STATUS_SUCCESS);
			}
		}
		handleErrorPartialEntityEditor(event) {
			this.unBindPartialEntityEditorEvents();
			this.stopProgress();
			const data = event.getData();
			if (main_core.Type.isArray(data) && data[1] && main_core.Type.isArray(data[1].errors)) {
				this.showErrorsFromResponse({
					errors: data[1].errors
				});
			}
		}
		handleUserFieldCreationUrlClick(event) {
			const data = event.getData();
			if (data.hasOwnProperty('isCanceled')) {
				event.setData({
					...data,
					...{
						isCanceled: true
					}
				});
				BX.SidePanel.Instance.open(this.userFieldCreateUrl, {
					allowChangeHistory: false,
					cacheable: false,
					events: {
						onClose: this.onCreateUserFieldSliderClose.bind(this)
					}
				});
			}
		}
		handleRecurringExpose(event) {
			const availableComponents = ['bitrix:crm.invoice.details', 'bitrix:crm.item.details'];
			const componentName = event.getData().button.getDataSet().componentName;
			if (!availableComponents.includes(componentName)) {
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CRM_ITEM_DETAIL_CREATE_RECURRING_ITEM_NOT_SUPPORTED'),
					autoHideDelay: 6000
				});
				return;
			}
			const data = {
				entityId: this.id,
				entityTypeId: this.entityTypeId
			};
			BX.ajax.runComponentAction(componentName, 'expose', {
				mode: 'class',
				data
			}).then(({
				data: id
			}) => {
				const url = crm_router.Router.Instance.getItemDetailUrl(this.entityTypeId, id);
				BX.Crm.Page.open(url.getPath());
			}, response => {
				const content = main_core.Type.isArrayFilled(response.errors) ? response.errors[0]?.message : main_core.Loc.getMessage('CRM_ITEM_DETAIL_CREATE_RECURRING_ITEM_ERROR');
				ui_notification.UI.Notification.Center.notify({
					content,
					autoHideDelay: 6000
				});
			}).catch(() => {
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CRM_ITEM_DETAIL_CREATE_RECURRING_ITEM_ERROR'),
					autoHideDelay: 6000
				});
			});
		}
		onCreateUserFieldSliderClose(event) {
			const slider = event.getSlider();
			const sliderData = slider.getData();
			const userFieldData = sliderData.get('userFieldData');
			if (userFieldData && main_core.Type.isString(userFieldData)) {
				this.reloadPageIfNotChanged();
			}
		}
		//endregion

		reloadPageIfNotChanged() {
			const editor = this.getEditor();
			if (editor) {
				if (editor.isChanged()) {
					ui_dialogs_messagebox.MessageBox.alert(this.messages.onCreateUserFieldAddMessage);
				} else {
					window.location.reload();
				}
			}
		}
		initTours() {
			if (this.automationCheckAutomationTourGuideData) {
				main_core.Runtime.loadExtension('bizproc.automation.guide').then(exports$1 => {
					const {
						CrmCheckAutomationGuide
					} = exports$1;
					if (CrmCheckAutomationGuide) {
						CrmCheckAutomationGuide.showCheckAutomation(this.entityTypeName, this.categoryId ?? 0, this.automationCheckAutomationTourGuideData['options']);
					}
				});
			}
		}
		prepareAnalyticsData(stage) {
			const stageSemantic = stage.getSemantics();
			if (stageSemantic === 'F') {
				this.analyticsData = crm_integration_analytics.Builder.Entity.CloseEvent.createDefault(this.entityTypeId).setElement(crm_integration_analytics.Dictionary.ELEMENT_LOSE_BUTTON).buildData();
			} else if (stageSemantic === 'S') {
				this.analyticsData = crm_integration_analytics.Builder.Entity.CloseEvent.createDefault(this.entityTypeId).setElement(crm_integration_analytics.Dictionary.ELEMENT_WON_BUTTON).buildData();
			} else {
				this.analyticsData = crm_integration_analytics.Builder.Entity.ChangeStageEvent.createDefault(this.entityTypeId).setElement(crm_integration_analytics.Dictionary.ELEMENT_STAGE_BAR_BUTTON).buildData();
			}
		}
		sendAnalyticsData(status) {
			if (!this.analyticsData) {
				return;
			}
			BX.UI.Analytics.sendData({
				...this.analyticsData,
				status
			});
		}
	}

	exports.ItemDetailsComponent = ItemDetailsComponent;

})(this.BX.Crm = this.BX.Crm || {}, BX.Crm.Integration.Analytics, BX.Crm.ItemDetailsComponent.PageTitle, BX.Crm.ItemDetailsComponent, BX.Crm.MessageSender, BX.Crm, BX.Crm.Models, BX.Crm.Stage, BX, BX.Event, BX, BX.UI.Dialogs, BX);
//# sourceMappingURL=item-details-component.bundle.js.map
