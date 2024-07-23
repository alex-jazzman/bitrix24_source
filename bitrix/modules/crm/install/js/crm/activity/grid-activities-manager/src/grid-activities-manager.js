import { Manager } from './manager';

export class GridActivitiesManager
{
	static #instance: ?GridActivitiesManager = null;

	static showActivityAddingPopup(
		bindElement: HTMLElement,
		gridManagerId: string,
		entityTypeId: number,
		entityId: number,
		currentUser: Object,
		settings: ?any,
		useTodoEditorV2: ?number,
	)
	{
		void GridActivitiesManager
			.getManagerInstance()
			.showAddPopup(bindElement, gridManagerId, entityTypeId, entityId, currentUser, settings, useTodoEditorV2)
		;
	}

	static viewActivity(gridId: string, activityId: number, allowEdit: boolean)
	{
		void GridActivitiesManager.getManagerInstance()
			.viewActivity(gridId, activityId, allowEdit)
		;
	}

	static getManagerInstance(): Manager
	{
		if (!this.#instance)
		{
			this.#instance = new Manager();
		}

		return this.#instance;
	}
}
