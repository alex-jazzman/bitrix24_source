(function() {
	const namespace = BX.namespace('BX.Bizproc.Automation');

	if (namespace.AiAgentsPage)
	{
		return;
	}

	class AiAgentsPage
	{
		static agentsGridId;
		static headerAddButtonUniqId;
		static baseDesignerUri;
		static startTrigger;
		static gridManager;

		constructor(params)
		{
			this.agentsGridId = params.agentsGridId;
			this.headerAddButtonUniqId = params.headerAddButtonUniqId;
			this.baseDesignerUri = params.baseDesignerUri;
			this.startTrigger = params.startTrigger;

			this.#bindEvents();
			this.#initGridManager();
		}

		#bindEvents()
		{
			this.#bindAddAgentButtonEvent();
		}

		#initGridManager()
		{
			this.gridManager = BX.Bizproc.Ai.Agents.GridManager.getInstance(this.agentsGridId);
		}

		#bindAddAgentButtonEvent()
		{
			const addButton = BX.UI.ButtonManager.createByUniqId('BIZPROC_AI_AGENTS_HEADER_ADD_BUTTON');
			if (addButton)
			{
				addButton.bindEvent('click', async () => {
					const grid = this.gridManager.getGrid();

					grid.tableFade();

					const editUri = `${this.baseDesignerUri}${this.startTrigger}`;

					window.open(editUri, '_blank');

					grid.reload();
					grid.tableUnfade();
				});
			}
		}
	}

	namespace.AiAgentsPage = AiAgentsPage;
})();
