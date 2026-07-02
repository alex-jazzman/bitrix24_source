/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_notification, crm_stageModel) {
	'use strict';

	const SEMANTICS_TRANSLATE_RULES = {
		process: null,
		success: 'S',
		failure: 'F',
		apology: 'F'
	};
	class PermissionChecker {
		#stages;
		constructor(stages) {
			this.#stages = stages;
		}
		isHasPermissionToMove(fromStatusId, toStatusId) {
			if (fromStatusId === toStatusId) {
				return true;
			}
			const targetStage = this.#stages.get(toStatusId);
			if (!targetStage) {
				return false;
			}
			if (targetStage.isAllowedMoveToAnyStage()) {
				return true;
			}
			const stage = this.#stages.get(fromStatusId);
			if (!stage) {
				return false;
			}
			return (stage.getStagesToMove()?.includes(toStatusId) ?? false) || stage.isAllowedMoveToAnyStage();
		}
		isHasPermissionToMoveAtLeastOneFailureStage(fromStatusId) {
			return this.getStages().some(stage => {
				return stage.isFailure() && this.isHasPermissionToMove(fromStatusId, stage.getStatusId());
			});
		}
		isHasPermissionToMoveSuccessStage(fromStatusId) {
			return this.getStages().some(stage => {
				return stage.isSuccess() && this.isHasPermissionToMove(fromStatusId, stage.getStatusId());
			});
		}
		isHasPermissionToMoveAtLeastOneTerminationStage(fromStatusId) {
			return this.isHasPermissionToMoveSuccessStage(fromStatusId) || this.isHasPermissionToMoveAtLeastOneFailureStage(fromStatusId);
		}
		showMissPermissionError() {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('CRM_STAGE_MISS_PERMISSION_TO_MOVE_STAGE'),
				autoHideDelay: 2000
			});
		}
		getStages() {
			return [...this.#stages.values()];
		}
		static createFromStageModels(stages) {
			const stagesMap = new Map();
			stages.forEach(stage => {
				stagesMap.set(stage.getStatusId(), stage);
			});
			return new PermissionChecker(stagesMap);
		}
		static createFromStageInfos(stageInfos) {
			const stageModels = [];
			stageInfos.forEach(stageInfo => {
				const stageModelSemantics = SEMANTICS_TRANSLATE_RULES[stageInfo.semantics];
				const stageModelData = {
					...stageInfo
				};
				stageModelData.semantics = stageModelSemantics;
				stageModelData.statusId = stageInfo.id;
				const stageModel = new crm_stageModel.StageModel(stageModelData);
				stageModels.push(stageModel);
			});
			return PermissionChecker.createFromStageModels(stageModels);
		}
	}

	exports.PermissionChecker = PermissionChecker;

})(this.BX.Crm.Stage = this.BX.Crm.Stage || {}, BX, BX, BX.Crm.Models);
//# sourceMappingURL=permission-checker.bundle.js.map
