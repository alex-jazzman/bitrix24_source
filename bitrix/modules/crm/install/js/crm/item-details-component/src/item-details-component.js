import { type CategoryModelData } from 'crm.category-model';
import { Builder, Dictionary } from 'crm.integration.analytics';
import { CategoryChanger } from 'crm.item-details-component.pagetitle';
import { Chart as ItemDetailsChart } from 'crm.item-details-component.stage-flow';
import { ReceiverRepository } from 'crm.messagesender';
import { Router } from 'crm.router';
import type { StageModelData } from 'crm.stage-model';
import { StageModel } from 'crm.stage-model';
import { PermissionChecker as StagePermissionChecker } from 'crm.stage.permission-checker';
import { ajax as Ajax, Dom, Loc, Reflection, Runtime, Text, Type, Uri } from 'main.core';
import { EventEmitter } from 'main.core.events';
import type { BaseEvent } from 'main.core.events';
import { Loader } from 'main.loader';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { UI } from 'ui.notification';
import './item-details-component.css';

export type ItemDetailsComponentParams = {
	entityTypeId: number,
	entityTypeName: string,
	entityTypeCaption: string,
	serviceUrl: string,
	id: number,
	categoryId?: number,
	categories?: CategoryModelData[],
	errorTextContainer: HTMLElement,
	stages: StageModelData[],
	currentStageId: number,
	messages: Object,
	signedParameters: ?string,
	userFieldCreateUrl: ?string,
	editorGuid: ?string,
	isStageFlowActive: ?boolean,
	pullTag: ?string,
	bizprocStarterConfig: ?Object,
	automationCheckAutomationTourGuideData: ?Object,
	receiversJSONString: string,
	categorySelectorTarget: ?string,
	analytics: ?Object,
};

const BACKGROUND_COLOR = 'd3d7dc';
const FINAL_STAGE_FIXED_ENTITY_TYPE_NAMES = new Set(['QUOTE', 'SMART_INVOICE']);

class StageTransitionCancelledError extends Error
{
	code: string = 'CRM_STAGE_TRANSITION_CANCELLED';

	constructor()
	{
		super('Stage transition was cancelled');
		this.name = 'StageTransitionCancelledError';
	}
}

export class ItemDetailsComponent
{
	entityTypeId: number;
	entityTypeName: string;
	entityTypeCaption: string;
	id: number;
	categoryId: ?number = null;
	categories: ?CategoryModelData[];
	errorTextContainer: HTMLElement;
	stages: StageModel[];
	permissionChecker: ?StagePermissionChecker = null;
	stageflowChart: ItemDetailsChart;
	currentStageId: number;
	isProgress: boolean;
	container: HTMLElement;
	messages: {[code: string]: string};
	signedParameters: ?string;
	partialEntityEditor: ?BX.Crm.PartialEditorDialog;
	partialEditorId: ?string;
	editorContext: Object;
	userFieldCreateUrl: ?string;
	editorGuid: ?string;
	isStageFlowActive: ?boolean;
	pullTag: ?string;
	bizprocStarterConfig: ?Object;
	automationCheckAutomationTourGuideData: ?Object;
	receiversJSONString: string = '';
	targetUpdateStage: ?StageModel = null;
	stageBeforeUpdate: ?StageModel = null;
	stageUpdateResolve: ?(stage: StageModel) => void = null;
	stageUpdateReject: ?(error: mixed) => void = null;
	categorySelectorTarget: ?string;
	analyticsData: ?Object;
	isFinalTransitionOpen: boolean = false;
	finalTransition: ?Object = null;
	finalTransitionExtensionPromise: ?Promise = null;

	constructor(params: ItemDetailsComponentParams): void
	{
		if(Type.isPlainObject(params))
		{
			this.entityTypeId = Text.toInteger(params.entityTypeId);
			this.entityTypeName = params.entityTypeName;
			this.entityTypeCaption = params.entityTypeCaption;
			this.id = Text.toInteger(params.id);
			if (BX.Crm.PartialEditorDialog && params.serviceUrl)
			{
				this.partialEditorId = 'partial_editor_' + this.entityTypeId + '_' + this.id;
				BX.Crm.PartialEditorDialog.registerEntityEditorUrl(this.entityTypeId, params.serviceUrl);
			}
			if (params.hasOwnProperty('editorContext'))
			{
				this.editorContext = params.editorContext;
			}
			if (params.hasOwnProperty('categoryId'))
			{
				this.categoryId = Text.toInteger(params.categoryId);
				this.categories = params.categories;
			}
			if (Type.isElementNode(params.errorTextContainer))
			{
				this.errorTextContainer = params.errorTextContainer;
			}

			if (Type.isArray(params.stages))
			{
				this.stages = [];
				params.stages.forEach((data) => {
					this.stages.push(new StageModel(data));
				});

				this.permissionChecker = StagePermissionChecker.createFromStageModels(this.stages);
			}

			this.currentStageId = params.currentStageId;
			this.messages = params.messages;
			this.signedParameters = params.signedParameters;
			this.userFieldCreateUrl = params.userFieldCreateUrl;
			this.editorGuid = params.editorGuid;
			this.isStageFlowActive = params.isStageFlowActive;
			this.pullTag = params.pullTag;
			this.bizprocStarterConfig = params.bizprocStarterConfig;
			this.analyticsData = Type.isPlainObject(params.analytics) ? params.analytics : {};
			this.automationCheckAutomationTourGuideData =
				Type.isPlainObject(params.automationCheckAutomationTourGuideData)
					? params.automationCheckAutomationTourGuideData
					: null
			;
			if (Type.isString(params.receiversJSONString))
			{
				this.receiversJSONString = params.receiversJSONString;
			}
			if (Type.isStringFilled(params.categorySelectorTarget))
			{
				this.categorySelectorTarget = params.categorySelectorTarget;
			}
		}

		this.container = document.querySelector('[data-role="crm-item-detail-container"]');
		this.handleClosePartialEntityEditor = this.handleClosePartialEntityEditor.bind(this);
		this.handleErrorPartialEntityEditor = this.handleErrorPartialEntityEditor.bind(this);
	}

	isNew(): boolean
	{
		return this.id <= 0;
	}

	getLoader()
	{
		if(!this.loader)
		{
			this.loader = new Loader({
				size: 200,
				offset: {
					left: '-100px',
					top: '-200px',
				}
			});
			this.loader.layout.style.zIndex = 300;
		}

		return this.loader;
	}

	startProgress()
	{
		this.isProgress = true;
		if(!this.getLoader().isShown() && this.container)
		{
			this.getLoader().show(this.container);
		}
		this.hideErrors();
	}

	stopProgress()
	{
		this.isProgress = false;
		this.getLoader().hide();
	}

	startStageUpdateProgress(stage: StageModel): void
	{
		this.isProgress = true;
		this.targetUpdateStage = stage;

		this.stageflowChart.adjust();
	}

	stopStageUpdateProgress(): void
	{
		this.isProgress = false;
		this.targetUpdateStage = null;

		this.stageflowChart.adjust();
	}

	showStageUpdatingNotification(): void
	{
		if (this.targetUpdateStage === null || !this.messages.stageLoadingMessage)
		{
			return;
		}

		const stageName = Text.encode(this.targetUpdateStage.getName());
		UI.Notification.Center.notify({
			content: this.messages.stageLoadingMessage.replace('#stage#', stageName),
			autoHideDelay: 3000,
		});
	}

	isStageUpdating(): boolean
	{
		return this.targetUpdateStage !== null && this.isProgress;
	}

	getStageById(id: number): ?StageModel
	{
		let result = null;
		let key = 0;
		while(true)
		{
			if(!this.stages[key])
			{
				break;
			}
			const stage = this.stages[key];
			if(stage.getId() === id)
			{
				result = stage;
				break;
			}
			key++;
		}

		return result;
	}

	getStageByStatusId(statusId: string): ?StageModel
	{
		let result = null;
		let key = 0;
		while(true)
		{
			if(!this.stages[key])
			{
				break;
			}
			const stage = this.stages[key];
			if(stage.getStatusId() === statusId)
			{
				result = stage;
				break;
			}
			key++;
		}

		return result;
	}

	init(): void
	{
		this.initStageFlow();
		this.bindEvents();
		this.initReceiversRepository();
		this.initCategoriesSelector();

		if (!this.isNew())
		{
			this.initPull();
			this.initTours();
		}
	}

	initReceiversRepository(): void
	{
		ReceiverRepository.onDetailsLoad(this.entityTypeId, this.id, this.receiversJSONString);
	}

	initCategoriesSelector(): void
	{
		if (!Type.isArrayFilled(this.categories) || !Type.isStringFilled(this.categorySelectorTarget))
		{
			return;
		}

		const changer = CategoryChanger.renderToTarget(
			this.categorySelectorTarget,
			{
				entityTypeId: this.entityTypeId,
				entityId: this.id,
				categoryId: this.categoryId,
				categories: this.categories,
				editorGuid: this.editorGuid,
			},
		);
		if (!changer)
		{
			return;
		}

		changer.subscribe('onProgressStart', this.startProgress.bind(this));
		changer.subscribe('onProgressStop', this.stopProgress.bind(this));
	}

	initStageFlow()
	{
		if (!this.stages)
		{
			return;
		}

		const stageFlowContainer = document.querySelector('[data-role="stageflow-wrap"]');
		if (!stageFlowContainer)
		{
			return;
		}

		if (!this.stageflowChart)
		{
			this.initLoadedStageFlow(ItemDetailsChart, stageFlowContainer);
		}
	}

	initLoadedStageFlow(StageFlowChart, stageFlowContainer: HTMLElement): void
	{
		const flowStagesData = this.prepareStageFlowStagesData();
		const chartParams = {
			backgroundColor: BACKGROUND_COLOR,
			currentStage: this.currentStageId,
			isActive: this.isStageFlowActive === true,
			onStageChange: this.onStageChange.bind(this),
			labels: {
				finalStageName: this.getFinalStageName(),
				finalStagePopupTitle: Loc.getMessage('CRM_ITEM_DETAIL_STAGEFLOW_FINAL_STAGE_POPUP'),
				finalStagePopupFail: Loc.getMessage('CRM_ITEM_DETAIL_STAGEFLOW_FINAL_STAGE_POPUP_FAIL'),
				finalStageSelectorTitle: Loc.getMessage('CRM_ITEM_DETAIL_STAGEFLOW_FINAL_STAGE_SELECTOR'),
			},
		};

		this.stageflowChart = new StageFlowChart(
			chartParams,
			flowStagesData,
			this.permissionChecker,
			this.getStageById.bind(this),
			this.isStageUpdating.bind(this),
			Runtime.throttle(this.showStageUpdatingNotification.bind(this), 300),
			this.openFinalTransition.bind(this),
			this.isNew(),
			this.entityTypeId
		);

		Dom.append(this.stageflowChart.render(), stageFlowContainer);
	}

	prepareStageFlowStagesData(): Array
	{
		const flowStagesData = [];
		this.stages.forEach((stage: StageModel) => {
			const data = stage.getData();
			let color = (stage.getColor().indexOf('#') === 0) ? stage.getColor().substr(1) : stage.getColor();
			if (this.isNew())
			{
				color = BACKGROUND_COLOR;
			}
			data.isSuccess = stage.isSuccess();
			data.isFail = stage.isFailure();
			data.color = color;
			flowStagesData.push(data);
		});

		return flowStagesData;
	}

	bindEvents(): void
	{
		EventEmitter.subscribe('BX.Crm.ItemDetailsComponent:onClickDelete', this.handleItemDelete.bind(this));
		if (this.bizprocStarterConfig)
		{
			EventEmitter.subscribe(
				'BX.Crm.ItemDetailsComponent:onClickBizprocTemplates',
				this.handleBPTemplatesShow.bind(this),
			);
		}
		if (this.editorGuid && this.userFieldCreateUrl && BX.SidePanel && BX.Crm.EntityEditor)
		{
			EventEmitter.subscribe(
				'BX.UI.EntityConfigurationManager:onCreateClick',
				this.handleUserFieldCreationUrlClick.bind(this)
			);
		}
		EventEmitter.subscribe(
			'BX.Crm.ItemDetailsComponent:onClickRecurringExpose',
			this.handleRecurringExpose.bind(this),
		);
	}

	getFinalStageName(): string
	{
		const entityTypeName = Type.isStringFilled(this.entityTypeName)
			? this.entityTypeName.toUpperCase()
			: ''
		;
		let suffix = '';
		if (FINAL_STAGE_FIXED_ENTITY_TYPE_NAMES.has(entityTypeName))
		{
			suffix = entityTypeName;
		}
		else if (entityTypeName.startsWith('DYNAMIC_'))
		{
			suffix = 'DYNAMIC';
		}

		if (suffix !== '')
		{
			const message = Loc.getMessage(`CRM_ITEM_DETAIL_STAGEFLOW_FINAL_STAGE_NAME_${suffix}`);
			if (Type.isStringFilled(message))
			{
				return message;
			}
		}

		return Loc.getMessage('CRM_ITEM_DETAIL_STAGEFLOW_FINAL_STAGE_NAME') ?? '';
	}

	initPull()
	{
		const Pull = BX.PULL;
		if (!Pull)
		{
			console.error('pull is not initialized');

			return;
		}

		if (!this.pullTag)
		{
			return;
		}

		Pull.subscribe({
			moduleId: 'crm',
			command: this.pullTag,
			callback: (params) => {
				if (!params?.item?.data)
				{
					return;
				}

				const columnId = params.item.data.columnId;
				if (this.stageflowChart?.isActive || (!this.stageflowChart && this.isStageFlowActive === true))
				{
					const currentStageId = this.stageflowChart?.currentStage ?? this.currentStageId;
					const currentStage = this.getStageById(currentStageId);
					if (currentStage?.statusId !== columnId)
					{
						const newStage = this.getStageByStatusId(columnId);
						if (newStage)
						{
							if (this.stageflowChart)
							{
								this.updateStage(newStage);
							}
							else
							{
								this.currentStageId = newStage.getId();
							}
						}
					}
				}
			},
		});
		Pull.extendWatch(this.pullTag);
	}

	getEditor(): ?BX.Crm.EntityEditor
	{
		if (BX.Crm.EntityEditor)
		{
			if (this.editorGuid)
			{
				return BX.Crm.EntityEditor.get(this.editorGuid);
			}

			return BX.Crm.EntityEditor.getDefault();
		}

		return null;
	}

	getCurrentCategoryId(): ?number
	{
		const editor = this.getEditor();
		if (!editor || !Type.isFunction(editor.getModel))
		{
			return this.categoryId;
		}

		const model = editor.getModel();
		if (!model || !Type.isFunction(model.getField))
		{
			return this.categoryId;
		}

		return this.resolveCategoryId(model.getField('CATEGORY_ID', this.categoryId));
	}

	resolveCategoryId(value: mixed): ?number
	{
		if (
			Type.isNil(value)
			|| (Type.isString(value) && !Type.isStringFilled(value))
			|| (!Type.isNumber(value) && !Type.isString(value))
		)
		{
			return null;
		}

		const categoryId = parseInt(value, 10);

		return Number.isNaN(categoryId) ? null : categoryId;
	}

	bindPartialEntityEditorEvents()
	{
		EventEmitter.subscribe('Crm.PartialEditorDialog.Close', this.handleClosePartialEntityEditor);
		EventEmitter.subscribe('Crm.PartialEditorDialog.Error', this.handleErrorPartialEntityEditor);
	}

	unBindPartialEntityEditorEvents()
	{
		EventEmitter.unsubscribe('Crm.PartialEditorDialog.Close', this.handleClosePartialEntityEditor);
		EventEmitter.unsubscribe('Crm.PartialEditorDialog.Error', this.handleErrorPartialEntityEditor);
	}

	onStageChange(stageFlowStage)
	{
		if(this.isProgress)
		{
			return;
		}
		const stage = this.getStageById(stageFlowStage.getId());
		if(!stage)
		{
			console.error('Wrong stage');
			return;
		}

		void this.moveToStage(stage).catch(() => {});
	}

	moveToStage(stage: StageModel, options: { optimistic?: boolean } = {}): Promise<StageModel>
	{
		const isOptimistic = options.optimistic !== false;

		this.prepareAnalyticsData(stage);

		this.stageBeforeUpdate = this.getCurrentStage();
		if (isOptimistic)
		{
			this.setStageToFlowChart(stage);
		}

		this.startStageUpdateProgress(stage);

		return Ajax.runAction('crm.controller.item.update', {
			analyticsLabel: 'crmItemDetailsMoveItem',
			data: {
				entityTypeId: this.entityTypeId,
				id: this.id,
				fields: {
					stageId: stage.getStatusId()
				}
			}
		}).then( () => {
			this.sendAnalyticsData(Dictionary.STATUS_SUCCESS);

			this.stopStageUpdateProgress();

			let currentSlider: ?BX.SidePanel.Slider = null;
			if (Reflection.getClass('BX.SidePanel.Instance.getTopSlider'))
			{
				currentSlider = BX.SidePanel.Instance.getTopSlider();
			}
			if (currentSlider !== null)
			{
				if (Reflection.getClass('BX.Crm.EntityEvent'))
				{
					let eventParams = null;
					if(currentSlider)
					{
						eventParams = { "sliderUrl": currentSlider.getUrl() };
					}
					BX.Crm.EntityEvent.fireUpdate(this.entityTypeId, this.id, '', eventParams);
				}
			}

			this.stageBeforeUpdate = null;
			this.updateStage(stage);
			return stage;
		}).catch((response) => {
			this.stopStageUpdateProgress();

			if (!this.partialEditorId)
			{
				this.restoreStageBeforeUpdate();
				this.showErrorsFromResponse(response);
				throw response;
			}

			const requiredFields = this.getRequiredFieldsFromResponse(response);

			if(requiredFields.length > 0)
			{
				return this.openPartialEntityEditor(stage, requiredFields);
			}
			else
			{
				this.restoreStageBeforeUpdate();
				this.sendAnalyticsData(Dictionary.STATUS_ERROR);
				this.showErrorsFromResponse(response);
				throw response;
			}
		})
	}

	openFinalTransition(): void
	{
		if (this.isProgress || this.isFinalTransitionOpen)
		{
			return;
		}

		if (!this.getCurrentStage() || !this.stages.some((stage: StageModel) => stage.isSuccess()))
		{
			return;
		}
		this.isFinalTransitionOpen = true;

		this.loadFinalTransitionExtension().then((FinalTransition) => {
			if (!FinalTransition)
			{
				this.isFinalTransitionOpen = false;

				return;
			}

			this.openLoadedFinalTransition(FinalTransition);
		});
	}

	loadFinalTransitionExtension(): Promise
	{
		this.finalTransitionExtensionPromise ??= Runtime.loadExtension('crm.stage.final-transition')
			.then((exports) => {
				return Type.isFunction(exports?.FinalTransition?.open) ? exports.FinalTransition : null;
			})
			.catch(() => {
				this.finalTransitionExtensionPromise = null;

				return null;
			})
		;

		return this.finalTransitionExtensionPromise;
	}

	openLoadedFinalTransition(FinalTransition: Object): void
	{
		const currentStage = this.getCurrentStage();
		const successStage = this.stages.find((stage: StageModel) => stage.isSuccess());

		if (!this.isFinalTransitionOpen || !currentStage || !successStage)
		{
			this.isFinalTransitionOpen = false;

			return;
		}

		this.finalTransition = FinalTransition.open({
			currentStage: currentStage.getData(),
			successStage: successStage.getData(),
			failureStages: this.getFailureStagesData(),
			entityTitle: this.getEntityTitle(),
			entityTextContext: {
				entityTypeId: this.entityTypeId,
				entityTypeName: this.entityTypeName,
				entityTypeCaption: this.entityTypeCaption,
			},
			onMoveToStage: (statusId: string) => {
				return this.moveToStageByStatusId(statusId).then((stage) => {
					this.isFinalTransitionOpen = false;
					this.finalTransition = null;

					return stage;
				});
			},
			isMoveCancelled: (error: mixed) => error instanceof StageTransitionCancelledError,
			canMoveToStage: (statusId: string) => {
				return this.permissionChecker?.isHasPermissionToMove(
					currentStage.getStatusId(),
					statusId,
				) ?? false;
			},
			onMovePermissionDenied: () => {
				this.permissionChecker?.showMissPermissionError();
			},
			onUndo: (previousStatusId: string, targetStatusId: string) => {
				if (
					this.isProgress
					|| this.getCurrentStage()?.getStatusId() !== targetStatusId
				)
				{
					return Promise.reject(new StageTransitionCancelledError());
				}

				return this.moveToStageByStatusId(previousStatusId);
			},
			onClose: () => {
				this.isFinalTransitionOpen = false;
				this.finalTransition = null;
				this.stageflowChart.restoreCurrentStageView();
			},
			analytics: this.analyticsData ?? {},
		})
		;
	}

	moveToStageByStatusId(statusId: string): Promise<StageModelData>
	{
		const stage = this.getStageByStatusId(statusId);
		if (!stage)
		{
			return Promise.reject(new Error('Wrong stage'));
		}

		return this.moveToStage(stage, { optimistic: false }).then((updatedStage: StageModel) => {
			return updatedStage.getData();
		});
	}

	getFailureStagesData(): StageModelData[]
	{
		return this.stages
			.filter((stage: StageModel) => stage.isFailure())
			.map((stage: StageModel) => stage.getData())
		;
	}

	getCurrentStage(): ?StageModel
	{
		return this.getStageById(this.stageflowChart?.currentStage ?? this.currentStageId);
	}

	getEntityTitle(): string
	{
		const model = this.getEditor()?.getModel?.();
		const title = model?.getField?.('TITLE', '');

		return Type.isStringFilled(title) ? title : '';
	}

	getRequiredFieldsFromResponse(response): string[]
	{
		const requiredFields = [];
		const errors = Type.isArray(response?.errors) ? response.errors : [];

		errors.forEach(({ code, customData }) => {
			if (code === 'CRM_FIELD_ERROR_REQUIRED' && Type.isStringFilled(customData?.fieldName))
			{
				requiredFields.push(customData.fieldName);
			}
		});

		return requiredFields;
	}

	openPartialEntityEditor(stage: StageModel, requiredFields: string[]): Promise<StageModel>
	{
		if (!this.partialEditorId)
		{
			return Promise.reject(new Error('Partial editor is not configured'));
		}

		this.finalTransition?.close();
		this.finalTransition = null;

		BX.Crm.PartialEditorDialog.close(this.partialEditorId);

		this.partialEntityEditor = BX.Crm.PartialEditorDialog.create(
			this.partialEditorId,
			{
				title: BX.prop.getString(this.messages, "partialEditorTitle", "Please fill in all required fields"),
				entityTypeName: this.entityTypeName,
				entityTypeId: this.entityTypeId,
				entityId: this.id,
				fieldNames: requiredFields,
				helpData: null,
				context: this.editorContext || null,
				isController: true,
				stageId: stage.getStatusId(),
			}
		);

		const stageUpdatePromise: Promise<StageModel> = new Promise((resolve, reject) => {
			this.stageUpdateResolve = resolve;
			this.stageUpdateReject = reject;
		});

		this.bindPartialEntityEditorEvents();
		this.partialEntityEditor.open();

		return stageUpdatePromise;
	}

	resolveStageUpdate(stage: StageModel): void
	{
		this.stageUpdateResolve?.(stage);
		this.clearStageUpdatePromise();
	}

	rejectStageUpdate(error: mixed): void
	{
		this.stageUpdateReject?.(error);
		this.clearStageUpdatePromise();
	}

	clearStageUpdatePromise(): void
	{
		this.stageUpdateResolve = null;
		this.stageUpdateReject = null;
	}

	restoreStageBeforeUpdate(): void
	{
		if (this.stageBeforeUpdate === null)
		{
			return;
		}

		this.setStageToFlowChart(this.stageBeforeUpdate);
		this.currentStageId = this.stageBeforeUpdate.getId();
		this.stageBeforeUpdate = null;
	}

	updateStage(stage: StageModel)
	{
		const finalTransitionToast = UI.Notification.Center.getBalloonById('crm-stage-final-transition-toast');
		const toastTargetStatusId = finalTransitionToast?.getData().finalTransitionTargetStatusId;
		if (toastTargetStatusId !== stage.getStatusId())
		{
			finalTransitionToast?.close();
		}

		const currentStage = this.getStageById(this.stageflowChart.currentStage);
		this.setStageToFlowChart(stage);
		this.currentStageId = stage.getId();
		EventEmitter.emit(
			'BX.Crm.ItemDetailsComponent:onStageChange',
			{
				entityTypeId: this.entityTypeId,
				id: this.id,
				stageId: stage.getStatusId(),
				previousStageId: currentStage ? currentStage.getStatusId() : null,
			},
		);
	}

	setStageToFlowChart(stage: StageModel): void
	{
		this.stageflowChart.setCurrentStageId(stage.getId());
	}

	showError(error: string): void
	{
		if (Type.isElementNode(this.errorTextContainer))
		{
			this.errorTextContainer.innerText = error;
			this.errorTextContainer.parentElement.style.display = 'block';
		}
		else
		{
			console.error(error);
		}
	}

	showErrors(errors: string[]): void
	{
		let severalErrorsText = '';
		errors.forEach((message) => {
			severalErrorsText = severalErrorsText + message + ' ';
		});

		this.showError(severalErrorsText);
	}

	hideErrors(): void
	{
		if (Type.isElementNode(this.errorTextContainer))
		{
			this.errorTextContainer.innerText = '';
			this.errorTextContainer.parentElement.style.display = 'none';
		}
	}

	showErrorsFromResponse({errors}): void
	{
		this.stopProgress();
		const messages = [];
		errors.forEach(({message}) => messages.push(message));
		this.showErrors(messages);
	}

	normalizeUrl(url: Uri): Uri
	{
		// Allow redirects only in the current domain
		return url.setHost('');
	}

	// region EventHandlers
	handleItemDelete(): void
	{
		if (this.isProgress)
		{
			return;
		}
		MessageBox.show({
			title: this.messages.deleteItemTitle,
			message: this.messages.deleteItemMessage,
			modal: true,
			buttons: MessageBoxButtons.YES_CANCEL,
			onYes: (messageBox) => {
				this.startProgress();
				Ajax.runAction(
					'crm.controller.item.delete',
					{
						data:
							{
								entityTypeId: this.entityTypeId,
								id: this.id,
								analytics: this.analyticsData,
							},
					},
				).then(({ data }) => {
					this.stopProgress();

					let currentSlider: ?BX.SidePanel.Slider = null;
					if (Reflection.getClass('BX.SidePanel.Instance.getTopSlider'))
					{
						currentSlider = BX.SidePanel.Instance.getTopSlider();
					}

					if (currentSlider !== null)
					{
						if (Reflection.getClass('BX.Crm.EntityEvent'))
						{
							let eventParams = null;
							if (currentSlider)
							{
								eventParams = { 'sliderUrl': currentSlider.getUrl() };
							}
							BX.Crm.EntityEvent.fireDelete(this.entityTypeId, this.id, '', eventParams);
						}
						currentSlider.close();
					}
					else
					{
						const link = data.redirectUrl;
						if (Type.isStringFilled(link))
						{
							const url = this.normalizeUrl(new Uri(link));
							location.href = url.toString();
						}
					}
				}).catch(this.showErrorsFromResponse.bind(this));

				messageBox.close();
			},
		});
	}

	handleBPTemplatesShow(event)
	{
		if (this.bizprocStarterConfig.availabilityLock)
		{
			// eslint-disable-next-line no-eval
			eval(this.bizprocStarterConfig.availabilityLock);

			return;
		}

		const starter = new BX.Bizproc.Starter({
			...this.bizprocStarterConfig,
			categoryId: this.getCurrentCategoryId(),
		});
		starter.showTemplatesMenu(event.data.button.button);
	}

	handleClosePartialEntityEditor(event: BaseEvent)
	{
		const data = event.getData();
		if (!Type.isArray(data) || data[0] !== this.partialEntityEditor)
		{
			return;
		}

		this.unBindPartialEntityEditorEvents();
		this.stopProgress();

		if (data.length === 2)
		{
			const parameters = data[1];

			if (parameters.isCancelled)
			{
				this.restoreStageBeforeUpdate();
				this.sendAnalyticsData(Dictionary.STATUS_ERROR);
				this.rejectStageUpdate(new StageTransitionCancelledError());

				return;
			}

			const stage = this.getStageByStatusId(parameters.stageId);
			if (!stage)
			{
				this.restoreStageBeforeUpdate();
				this.sendAnalyticsData(Dictionary.STATUS_ERROR);
				this.rejectStageUpdate(parameters);

				return;
			}
			this.updateStage(stage);
			this.stageBeforeUpdate = null;
			this.sendAnalyticsData(Dictionary.STATUS_SUCCESS);
			this.resolveStageUpdate(stage);

			return;
		}

		this.restoreStageBeforeUpdate();
		this.rejectStageUpdate(data);
	}

	handleErrorPartialEntityEditor(event: BaseEvent)
	{
		const data = event.getData();
		if (!Type.isArray(data) || data[0] !== this.partialEntityEditor)
		{
			return;
		}

		this.unBindPartialEntityEditorEvents();

		this.stopProgress();

		if (data[1] && Type.isArray(data[1].errors))
		{
			this.restoreStageBeforeUpdate();
			this.showErrorsFromResponse({ errors: data[1].errors });
			this.rejectStageUpdate(data[1]);

			return;
		}

		this.restoreStageBeforeUpdate();
		this.rejectStageUpdate(data);
	}

	handleUserFieldCreationUrlClick(event: BaseEvent)
	{
		const data = event.getData();
		if (data.hasOwnProperty('isCanceled'))
		{
			event.setData({ ...data, ...{isCanceled: true}});
			BX.SidePanel.Instance.open(this.userFieldCreateUrl, {
				allowChangeHistory: false,
				cacheable: false,
				events: {
					onClose: this.onCreateUserFieldSliderClose.bind(this)
				}
			});
		}
	}

	handleRecurringExpose(event: BaseEvent): void
	{
		const availableComponents = [
			'bitrix:crm.invoice.details',
			'bitrix:crm.item.details',
		];
		const componentName = event.getData().button.getDataSet().componentName;

		if (!availableComponents.includes(componentName))
		{
			UI.Notification.Center.notify({
				content: Loc.getMessage('CRM_ITEM_DETAIL_CREATE_RECURRING_ITEM_NOT_SUPPORTED'),
				autoHideDelay: 6000,
			});

			return;
		}

		const data = {
			entityId: this.id,
			entityTypeId: this.entityTypeId,
		};

		BX.ajax.runComponentAction(
			componentName,
			'expose',
			{
				mode: 'class',
				data,
			},
		).then(
			({ data: id }) => {
				const url = Router.Instance.getItemDetailUrl(this.entityTypeId, id);
				BX.Crm.Page.open(url.getPath());
			},
			(response) => {
				const content = Type.isArrayFilled(response.errors)
					? response.errors[0]?.message
					: Loc.getMessage('CRM_ITEM_DETAIL_CREATE_RECURRING_ITEM_ERROR')
				;

				UI.Notification.Center.notify({
					content,
					autoHideDelay: 6000,
				});
			},
		).catch(() => {
			UI.Notification.Center.notify({
				content: Loc.getMessage('CRM_ITEM_DETAIL_CREATE_RECURRING_ITEM_ERROR'),
				autoHideDelay: 6000,
			});
		});
	}

	onCreateUserFieldSliderClose(event: BX.SidePanel.Event)
	{
		const slider = event.getSlider();
		const sliderData = slider.getData();
		const userFieldData = sliderData.get('userFieldData');
		if (userFieldData && Type.isString(userFieldData))
		{
			this.reloadPageIfNotChanged();
		}
	}
	//endregion

	reloadPageIfNotChanged()
	{
		const editor = this.getEditor();
		if (editor)
		{
			if(editor.isChanged())
			{
				MessageBox.alert(this.messages.onCreateUserFieldAddMessage);
			}
			else
			{
				window.location.reload();
			}
		}
	}

	initTours()
	{
		if (this.automationCheckAutomationTourGuideData)
		{
			Runtime.loadExtension('bizproc.automation.guide')
				.then((exports) => {
					const {CrmCheckAutomationGuide} = exports;
					if (CrmCheckAutomationGuide)
					{
						CrmCheckAutomationGuide.showCheckAutomation(
							this.entityTypeName,
							this.categoryId ?? 0,
							this.automationCheckAutomationTourGuideData['options']
						);
					}
				})
			;
		}
	}

	prepareAnalyticsData(stage: StageModelData)
	{
		const stageSemantic = stage.getSemantics();

		if (stageSemantic === 'F')
		{
			this.analyticsData = Builder.Entity.CloseEvent.createDefault(
				this.entityTypeId,
			)
				.setElement(Dictionary.ELEMENT_LOSE_BUTTON)
				.buildData();
		}
		else if (stageSemantic === 'S')
		{
			this.analyticsData = Builder.Entity.CloseEvent.createDefault(
				this.entityTypeId,
			)
				.setElement(Dictionary.ELEMENT_WON_BUTTON)
				.buildData();
		}
		else
		{
			this.analyticsData = Builder.Entity.ChangeStageEvent.createDefault(
				this.entityTypeId,
			)
				.setElement(Dictionary.ELEMENT_STAGE_BAR_BUTTON)
				.buildData();
		}
	}

	sendAnalyticsData(status)
	{
		if (!this.analyticsData)
		{
			return;
		}

		BX.UI.Analytics.sendData({
			...this.analyticsData,
			status,
		});
	}
}
