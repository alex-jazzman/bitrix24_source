/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Ai = this.BX.Bizproc.Ai || {};
(function (exports, ui_infoHelper, ui_buttons, bizproc_aiAgents_grid) {
	'use strict';

	class AiAgentsPage {
		constructor(params) {
			this.agentsGridId = params.agentsGridId;
			this.headerAddButtonUniqId = params.headerAddButtonUniqId;
			this.baseDesignerUri = params.baseDesignerUri;
			this.startTrigger = params.startTrigger;
			this.isAiAgentsAvailableByTariff = params?.isAiAgentsAvailableByTariff;
			this.aiAgentsTariffSliderCode = params?.aiAgentsTariffSliderCode;
			this.#initGridManager(params?.isExistingRunsWarningSpent === true);
			this.#bindEvents();
		}
		#bindEvents() {
			this.#bindAddAgentButtonEvent();
		}
		#initGridManager(isExistingRunsWarningSpent) {
			this.gridManager = bizproc_aiAgents_grid.GridManager.getInstance(this.agentsGridId);
			if (isExistingRunsWarningSpent) {
				this.gridManager.markExistingRunsWarningSpent();
			}
		}
		#bindAddAgentButtonEvent() {
			const addButton = ui_buttons.ButtonManager.createByUniqId(this.headerAddButtonUniqId);
			if (!addButton) {
				return;
			}
			let closure = this.#getOpenBPEditorClosure();
			if (!this.isAiAgentsAvailableByTariff) {
				closure = this.#getShowTariffSliderClosure();
			}
			addButton.bindEvent('click', closure);
		}
		#getOpenBPEditorClosure() {
			return () => {
				const grid = this.gridManager.getGrid();
				grid.tableFade();
				const editUri = `${this.baseDesignerUri}${this.startTrigger}`;
				window.open(editUri, '_blank');
				grid.reload();
				grid.tableUnfade();
			};
		}
		#getShowTariffSliderClosure() {
			return () => {
				const featureCode = this.aiAgentsTariffSliderCode;
				if (!featureCode) {
					return;
				}
				ui_infoHelper.FeaturePromotersRegistry.getPromoter({
					code: featureCode
				}).show();
			};
		}
	}

	exports.AiAgentsPage = AiAgentsPage;

})(this.BX.Bizproc.Ai.Agents = this.BX.Bizproc.Ai.Agents || {}, BX.UI, BX.UI, BX.Bizproc.Ai.Agents);
//# sourceMappingURL=script.js.map
