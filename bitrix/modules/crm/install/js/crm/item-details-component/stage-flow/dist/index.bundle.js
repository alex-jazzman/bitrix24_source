/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_stageflow) {
	'use strict';

	class Chart extends ui_stageflow.StageFlow.Chart {
		isNewItem = false;
		#isLoadingCallback;
		#showLoadingNotificationCallback;
		constructor(params, /** @see StageFlow.Chart */
		stages, permissionChecker, gettingStageModelCallback, isLoadingCallback, showLoadingNotificationCallback, isNewItem = false) {
			super(params, stages);
			this.permissionChecker = permissionChecker;
			this.getStageModelCallback = gettingStageModelCallback;
			this.isNewItem = isNewItem;
			this.#isLoadingCallback = isLoadingCallback;
			this.#showLoadingNotificationCallback = showLoadingNotificationCallback;
			if (!this.isNewItem) {
				this.#adjustDisableStages();
			}
		}
		onStageMouseHover(stage) {
			this.increaseStageWidthForNameVisibility(stage);
			if (stage.isDisabled()) {
				return;
			}
			super.onStageMouseHover(stage);
		}
		onStageClick(stage) {
			if (this.isLoading()) {
				this.showLoadingNotification();
				return;
			}
			if (!this.#isHasPermissionToMove(stage.getId())) {
				this.permissionChecker.showMissPermissionError();
				return;
			}
			super.onStageClick(stage);
		}
		onFinalStageClick(stage) {
			if (this.isLoading()) {
				this.showLoadingNotification();
				return;
			}
			if (!this.#isHasPermissionToMoveAtLeastOneTerminationStage()) {
				this.permissionChecker.showMissPermissionError();
				return;
			}
			super.onFinalStageClick(stage);
		}
		setCurrentStageId(stageId) {
			super.setCurrentStageId(stageId);
			this.adjust();
			return this;
		}
		getSemanticPopupSuccessButton() {
			const successButton = super.getSemanticPopupSuccessButton();
			if (!this.#isHasPermissionToMoveSuccessStage()) {
				this.#prepareDisableSemanticButton(successButton);
			}
			return successButton;
		}
		getSemanticPopupFailureButton() {
			const failureButton = super.getSemanticPopupFailureButton();
			if (failureButton === null) {
				return null;
			}
			if (!this.#isHasPermissionToMoveAtLeastOneFailureStages()) {
				this.#prepareDisableSemanticButton(failureButton);
			}
			return failureButton;
		}
		getFinalStagePopupFailStage(stage) {
			const finalStage = super.getFinalStagePopupFailStage(stage);
			if (!this.#isHasPermissionToMove(stage.getId())) {
				finalStage.onclick = event => {
					event.preventDefault();
					this.permissionChecker.showMissPermissionError();
				};
				main_core.Dom.addClass(finalStage, '--disabled');
			}
			return finalStage;
		}
		setCheckedStageInFailStagesWrapper(failStageListWrapper) {
			const failStages = [...this.extractFinalStagePopupFailStages(failStageListWrapper)];
			const failStageInputs = failStages.map(radioButtonNode => {
				return radioButtonNode.querySelector('input');
			});
			const firstAvailableFailStage = this.getFirstFailStage();
			if (!firstAvailableFailStage) {
				return;
			}
			const relatedRadioButton = failStageInputs.find(radioButton => {
				const stageId = radioButton?.dataset?.stageId;
				if (stageId) {
					return firstAvailableFailStage.getId() === main_core.Text.toInteger(stageId);
				}
				return false;
			});
			if (relatedRadioButton) {
				relatedRadioButton.checked = true;
			}
		}
		getFirstFailStage() {
			const stages = [...this.stages.values()];
			return stages.find(stage => stage.isFail() && this.#isHasPermissionToMove(stage.getId()));
		}
		getFirstFailStageName() {
			// get first fail stage name without permissions check
			return super.getFirstFailStage()?.getName();
		}
		#prepareDisableSemanticButton(button) {
			button.setDisabled().setProps({
				disabled: null
			}) // necessary in order to show a notification about miss permissions
			.bindEvent('click', this.permissionChecker.showMissPermissionError);
		}
		#getCurrentStage() {
			return this.getStageModelCallback(this.currentStage);
		}
		#getCurrentStatusId() {
			return this.#getCurrentStage()?.getStatusId();
		}
		#getStage(id) {
			return this.getStageModelCallback(id);
		}
		#isHasPermissionToMove(stageFlowId) {
			const compareStage = this.#getStage(stageFlowId);
			if (!compareStage) {
				return false;
			}
			return this.permissionChecker.isHasPermissionToMove(this.#getCurrentStatusId(), compareStage.getStatusId());
		}
		#isHasPermissionToMoveAtLeastOneTerminationStage() {
			return this.permissionChecker.isHasPermissionToMoveAtLeastOneTerminationStage(this.#getCurrentStatusId());
		}
		#isHasPermissionToMoveSuccessStage() {
			return this.permissionChecker.isHasPermissionToMoveSuccessStage(this.#getCurrentStatusId());
		}
		#isHasPermissionToMoveAtLeastOneFailureStages() {
			return this.permissionChecker.isHasPermissionToMoveAtLeastOneFailureStage(this.#getCurrentStatusId());
		}
		#isDisableStageFlow(flowStage) {
			if (this.isLoading()) {
				return true;
			}
			if (flowStage.isFinal()) {
				return false;
			}
			if (flowStage === this.getFinalStage()) {
				return !this.#isHasPermissionToMoveAtLeastOneTerminationStage();
			}
			return !this.#isHasPermissionToMove(flowStage.getId());
		}
		adjust() {
			this.#adjustDisableStages();
			this.#adjustSemanticsSelectorPopupButtons();
		}
		#adjustDisableStages() {
			this.stages.forEach(stage => {
				stage.setDisable(this.#isDisableStageFlow(stage));
			});
		}
		#adjustSemanticsSelectorPopupButtons() {
			const popup = super.getSemanticSelectorPopup();
			popup.setButtons([this.getSemanticPopupSuccessButton(), this.getSemanticPopupFailureButton()]);
		}
		isLoading() {
			return this.#isLoadingCallback();
		}
		showLoadingNotification() {
			return this.#showLoadingNotificationCallback();
		}
	}

	exports.Chart = Chart;

})(this.BX.Crm.ItemDetailsComponent = this.BX.Crm.ItemDetailsComponent || {}, BX, BX.UI);
//# sourceMappingURL=index.bundle.js.map
