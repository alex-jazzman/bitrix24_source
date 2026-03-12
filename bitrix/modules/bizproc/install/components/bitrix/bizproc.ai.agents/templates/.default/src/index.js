import { FeaturePromotersRegistry } from 'ui.info-helper';
import { ButtonManager } from 'ui.buttons';
import { GridManager } from 'bizproc.ai-agents.grid';

import './css/style.css';

export class AiAgentsPage
{
	agentsGridId: string;
	headerAddButtonUniqId: string;
	baseDesignerUri: string;
	startTrigger: string;
	gridManager: GridManager;
	isAiAgentsAvailableByTariff: ?boolean;
	aiAgentsTariffSliderCode: ?string;

	constructor(params)
	{
		this.agentsGridId = params.agentsGridId;
		this.headerAddButtonUniqId = params.headerAddButtonUniqId;
		this.baseDesignerUri = params.baseDesignerUri;
		this.startTrigger = params.startTrigger;
		this.isAiAgentsAvailableByTariff = params?.isAiAgentsAvailableByTariff;
		this.aiAgentsTariffSliderCode = params?.aiAgentsTariffSliderCode;

		this.#initGridManager();
		this.#bindEvents();
	}

	#bindEvents(): void
	{
		this.#bindAddAgentButtonEvent();
	}

	#initGridManager(): void
	{
		this.gridManager = GridManager.getInstance(this.agentsGridId);
	}

	#bindAddAgentButtonEvent(): void
	{
		const addButton = ButtonManager.createByUniqId(this.headerAddButtonUniqId);

		if (!addButton)
		{
			return;
		}

		let closure = this.#getOpenBPEditorClosure();

		if (!this.isAiAgentsAvailableByTariff)
		{
			closure = this.#getShowTariffSliderClosure();
		}

		addButton.bindEvent('click', closure);
	}

	#getOpenBPEditorClosure(): () => void
	{
		return () => {
			const grid = this.gridManager.getGrid();
			grid.tableFade();

			const editUri = `${this.baseDesignerUri}${this.startTrigger}`;
			window.open(editUri, '_blank');

			grid.reload();
			grid.tableUnfade();
		};
	}

	#getShowTariffSliderClosure(): () => void
	{
		return () => {
			const featureCode = this.aiAgentsTariffSliderCode;
			if (!featureCode)
			{
				return;
			}

			FeaturePromotersRegistry.getPromoter({ code: featureCode }).show();
		};
	}
}
