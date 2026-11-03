import { Dom, Runtime, Text, Type } from 'main.core';
import { StageFlow } from 'ui.stageflow';
import type { Button } from 'ui.buttons';
import type { PermissionChecker as StagePermissionChecker } from 'crm.stage.permission-checker';
import type { StageModel } from 'crm.stage-model';

import './css/chart.css';

export class Chart extends StageFlow.Chart
{
	permissionChecker: StagePermissionChecker;
	getStageModelCallback: (id: number) => ?StageModel;
	isNewItem: boolean = false;
	stageDescriptionTooltip: ?Object = null;

	#isLoadingCallback: () => boolean;
	#showLoadingNotificationCallback: () => void;
	#openFinalTransitionCallback: ?() => void = null;
	#stageDescriptionTooltipPromise: ?Promise = null;
	#stageDescriptionTooltipRequestId: number = 0;

	constructor(
		params: Object, /** @see StageFlow.Chart */
		stages: Array,
		permissionChecker: StagePermissionChecker,
		gettingStageModelCallback: (id: number) => StageModel,
		isLoadingCallback: () => boolean,
		showLoadingNotificationCallback: () => void,
		openFinalTransitionCallback: ?() => void = null,
		isNewItem: boolean = false,
	)
	{
		super(params, stages);

		this.permissionChecker = permissionChecker;
		this.getStageModelCallback = gettingStageModelCallback;
		this.isNewItem = isNewItem;

		this.#isLoadingCallback = isLoadingCallback;
		this.#showLoadingNotificationCallback = showLoadingNotificationCallback;
		this.#openFinalTransitionCallback = openFinalTransitionCallback;

		if (!this.isNewItem)
		{
			this.#adjustDisableStages();
		}
	}

	render(): Element
	{
		const container = super.render();
		this.stages.forEach((stage: Stage) => this.#bindStageKeyboardEvents(stage));

		return container;
	}

	#bindStageKeyboardEvents(stage: Stage): void
	{
		if (!Type.isElementNode(stage.node) || stage.node.dataset.crmStageKeyboardInitialized === 'Y')
		{
			return;
		}

		stage.node.dataset.crmStageKeyboardInitialized = 'Y';
		stage.node.dataset.testid = `crm-item-details-stage-${stage.getId()}`;
		stage.node.addEventListener('focusin', () => this.onStageFocusIn(stage));
		stage.node.addEventListener('focusout', () => this.onStageFocusOut(stage));
		stage.node.addEventListener('keydown', (event) => this.onStageKeyDown(event, stage));

		if (this.isActive)
		{
			stage.node.setAttribute('role', 'button');
			stage.node.setAttribute('tabindex', '0');
		}
		else if (Type.isStringFilled(this.#getStageDescription(stage)))
		{
			stage.node.setAttribute('tabindex', '0');
		}
	}

	onStageFocusIn(stage: Stage): void
	{
		this.showStageDescriptionTooltip(stage);
	}

	onStageFocusOut(stage: Stage): void
	{
		this.hideStageDescriptionTooltip();
	}

	onStageKeyDown(event: KeyboardEvent, stage: Stage): void
	{
		if (!this.isActive || !['Enter', ' '].includes(event.key))
		{
			return;
		}

		event.preventDefault();
		this.onStageClick(stage);
	}

	onStageMouseHover(stage: Stage): void
	{
		this.showStageDescriptionTooltip(stage);
		this.increaseStageWidthForNameVisibility(stage);
		if (stage.isDisabled())
		{
			return;
		}

		super.onStageMouseHover(stage);
	}

	onStageMouseLeave(stage: Stage): void
	{
		this.hideStageDescriptionTooltip();
		super.onStageMouseLeave(stage);
	}

	onStageClick(stage: Stage): void
	{
		this.closeStageDescriptionTooltip();

		if (this.isLoading())
		{
			this.showLoadingNotification();

			return;
		}

		if (!this.#isHasPermissionToMove(stage.getId()))
		{
			this.permissionChecker.showMissPermissionError();

			return;
		}

		super.onStageClick(stage);
	}

	onFinalStageClick(stage: Stage): void
	{
		this.closeStageDescriptionTooltip();

		if (this.isLoading())
		{
			this.showLoadingNotification();

			return;
		}

		if (!this.#isHasPermissionToMoveAtLeastOneTerminationStage())
		{
			this.permissionChecker.showMissPermissionError();

			return;
		}

		if (Type.isFunction(this.#openFinalTransitionCallback))
		{
			this.onStageMouseLeave(stage);
			this.#openFinalTransitionCallback();

			return;
		}

		super.onFinalStageClick(stage);
	}

	setCurrentStageId(stageId: number): Chart
	{
		super.setCurrentStageId(stageId);

		this.adjust();

		return this;
	}

	restoreCurrentStageView(): void
	{
		super.setCurrentStageId(this.currentStage);
	}

	getSemanticPopupSuccessButton(): Button
	{
		const successButton = super.getSemanticPopupSuccessButton();
		if (!this.#isHasPermissionToMoveSuccessStage())
		{
			this.#prepareDisableSemanticButton(successButton);
		}

		return successButton;
	}

	getSemanticPopupFailureButton(): ?Button
	{
		const failureButton = super.getSemanticPopupFailureButton();
		if (failureButton === null)
		{
			return null;
		}

		if (!this.#isHasPermissionToMoveAtLeastOneFailureStages())
		{
			this.#prepareDisableSemanticButton(failureButton);
		}

		return failureButton;
	}

	getFinalStagePopupFailStage(stage: Stage): HTMLElement
	{
		const finalStage = super.getFinalStagePopupFailStage(stage);

		if (!this.#isHasPermissionToMove(stage.getId()))
		{
			finalStage.onclick = (event: MouseEvent) => {
				event.preventDefault();
				this.permissionChecker.showMissPermissionError();
			};

			Dom.addClass(finalStage, '--disabled');
		}

		return finalStage;
	}

	setCheckedStageInFailStagesWrapper(failStageListWrapper: HTMLElement): void
	{
		const failStages = [...this.extractFinalStagePopupFailStages(failStageListWrapper)];
		const failStageInputs = failStages.map((radioButtonNode) => {
			return radioButtonNode.querySelector('input');
		});

		const firstAvailableFailStage = this.getFirstFailStage();
		if (!firstAvailableFailStage)
		{
			return;
		}

		const relatedRadioButton = failStageInputs.find((radioButton: HTMLInputElement) => {
			const stageId = radioButton?.dataset?.stageId;
			if (stageId)
			{
				return firstAvailableFailStage.getId() === Text.toInteger(stageId);
			}

			return false;
		});

		if (relatedRadioButton)
		{
			relatedRadioButton.checked = true;
		}
	}

	getFirstFailStage(): ?Stage
	{
		const stages = [...this.stages.values()];

		return stages.find((stage: Stage) => stage.isFail() && this.#isHasPermissionToMove(stage.getId()));
	}

	getFirstFailStageName(): ?string
	{
		// get first fail stage name without permissions check
		return super.getFirstFailStage()?.getName();
	}

	#prepareDisableSemanticButton(button: Button): void
	{
		button
			.setDisabled()
			.setProps({ disabled: null }) // necessary in order to show a notification about miss permissions
			.bindEvent('click', this.permissionChecker.showMissPermissionError)
		;
	}

	#getCurrentStage(): ?StageModel
	{
		return this.getStageModelCallback(this.currentStage);
	}

	#getCurrentStatusId(): ?string
	{
		return this.#getCurrentStage()?.getStatusId();
	}

	#getStage(id: number): ?StageModel
	{
		return this.getStageModelCallback(id);
	}

	#getStageDescription(stage: Stage): string
	{
		const descriptionStage = stage === this.getFinalStage()
			? this.getSuccessStage()
			: stage
		;

		return descriptionStage
			? this.#getStage(descriptionStage.getId())?.getDescription() ?? ''
			: ''
		;
	}

	showStageDescriptionTooltip(stage: Stage): void
	{
		if (!Type.isElementNode(stage.node))
		{
			this.closeStageDescriptionTooltip();

			return;
		}
		const options = {
			bindElement: stage.node,
			name: stage.getName(),
			description: this.#getStageDescription(stage),
			showName: false,
		};
		if (!Type.isStringFilled(options.description))
		{
			this.closeStageDescriptionTooltip();

			return;
		}

		const requestId = ++this.#stageDescriptionTooltipRequestId;

		this.#loadStageDescriptionTooltip().then((tooltip) => {
			if (tooltip && requestId === this.#stageDescriptionTooltipRequestId)
			{
				tooltip.show(options);
			}
		});
	}

	hideStageDescriptionTooltip(): void
	{
		this.#stageDescriptionTooltipRequestId++;
		this.stageDescriptionTooltip?.hide();
	}

	closeStageDescriptionTooltip(): void
	{
		this.#stageDescriptionTooltipRequestId++;
		this.stageDescriptionTooltip?.hideImmediately();
	}

	#loadStageDescriptionTooltip(): Promise
	{
		if (this.stageDescriptionTooltip)
		{
			return Promise.resolve(this.stageDescriptionTooltip);
		}

		this.#stageDescriptionTooltipPromise ??= Runtime.loadExtension('crm.stage.description-tooltip')
			.then((exports) => {
				if (!Type.isFunction(exports?.StageDescriptionTooltip))
				{
					return null;
				}

				this.stageDescriptionTooltip = new exports.StageDescriptionTooltip();

				return this.stageDescriptionTooltip;
			})
			.catch(() => {
				this.#stageDescriptionTooltipPromise = null;

				return null;
			})
		;

		return this.#stageDescriptionTooltipPromise;
	}

	#isHasPermissionToMove(stageFlowId: number): boolean
	{
		const compareStage = this.#getStage(stageFlowId);
		if (!compareStage)
		{
			return false;
		}

		return this.permissionChecker.isHasPermissionToMove(this.#getCurrentStatusId(), compareStage.getStatusId());
	}

	#isHasPermissionToMoveAtLeastOneTerminationStage(): boolean
	{
		return this.permissionChecker.isHasPermissionToMoveAtLeastOneTerminationStage(this.#getCurrentStatusId());
	}

	#isHasPermissionToMoveSuccessStage(): boolean
	{
		return this.permissionChecker.isHasPermissionToMoveSuccessStage(this.#getCurrentStatusId());
	}

	#isHasPermissionToMoveAtLeastOneFailureStages(): boolean
	{
		return this.permissionChecker.isHasPermissionToMoveAtLeastOneFailureStage(this.#getCurrentStatusId());
	}

	#isDisableStageFlow(flowStage: Stage): boolean
	{
		if (this.isLoading())
		{
			return true;
		}

		if (flowStage.isFinal())
		{
			return false;
		}

		if (flowStage === this.getFinalStage())
		{
			return !this.#isHasPermissionToMoveAtLeastOneTerminationStage();
		}

		return !this.#isHasPermissionToMove(flowStage.getId());
	}

	adjust(): void
	{
		this.#adjustDisableStages();
		this.#adjustSemanticsSelectorPopupButtons();
	}

	#adjustDisableStages(): void
	{
		this.stages.forEach((stage: Stage) => {
			stage.setDisable(this.#isDisableStageFlow(stage));
		});
	}

	#adjustSemanticsSelectorPopupButtons(): void
	{
		const popup = super.getSemanticSelectorPopup();
		popup.setButtons([
			this.getSemanticPopupSuccessButton(),
			this.getSemanticPopupFailureButton(),
		]);
	}

	isLoading(): boolean
	{
		return this.#isLoadingCallback();
	}

	showLoadingNotification(): void
	{
		return this.#showLoadingNotificationCallback();
	}
}
