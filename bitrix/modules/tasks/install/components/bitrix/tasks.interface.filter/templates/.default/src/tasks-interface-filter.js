import { Loc } from 'main.core';
import { Button } from 'ui.buttons';

type Params = {
	filterId: string,
	createNode: HTMLElement,
	showPresetTourGuide: boolean,
	isV2Form: boolean,
	groupId?: number,
	analytics: Object,
};

export class TasksInterfaceFilter
{
	#params: Params;

	constructor(params: Params)
	{
		this.#params = params;

		this.#initAddButton();
		this.#showPresetTourGuide();
	}

	#initAddButton(): void
	{
		if (!this.#params.isV2Form || !this.#params.createNode)
		{
			return;
		}

		const button = new Button({
			className: 'ui-btn-main',
			text: Loc.getMessage('TASKS_BTN_CREATE_TASK'),
			onclick: () => {
				(new BX.Tasks.V2.Application.TaskCard({
					groupId: this.#params.groupId,
					analytics: this.#params.analytics,
				})).showCompactCard();
			},
			props: {
				id: 'tasks-buttonAdd',
			},
		});

		this.#params.createNode.replaceWith(button.render());
	}

	#showPresetTourGuide(): void
	{
		if (!this.#params.showPresetTourGuide)
		{
			return;
		}

		BX.Tasks.Preset.Aha = new BX.Tasks.Preset({
			filterId: this.#params.filterId,
		});
		BX.Tasks.Preset.Aha.payAttention();
	}
}
