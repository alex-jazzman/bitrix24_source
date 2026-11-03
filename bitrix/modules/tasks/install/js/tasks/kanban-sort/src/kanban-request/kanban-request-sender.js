import { KanbanAjaxComponent } from '../kanban-component/kanban-ajax-component';
import { OrderType } from '../order-type/order-type';

type SortState = {
	newTaskOrder: string;
	sortField: ?string;
	sortDirection: ?string;
}

type OrderRequest = {
	order: string;
	field?: string;
	direction?: string;
}

export class KanbanRequestSender
{
	#ajaxComponent: KanbanAjaxComponent;
	#requestId: number = 0;
	// a sender serves a single order change, so the last request sent is counted for the whole class
	static #lastRequestId: number = 0;

	constructor()
	{
		this.#init();
	}

	setOrder(order: string = ''): Promise<?SortState>
	{
		return this.#send({ order });
	}

	setFieldOrder(field: string, direction: string): Promise<?SortState>
	{
		return this.#send({ order: OrderType.FIELD, field, direction });
	}

	#send(order: OrderRequest): Promise<?SortState>
	{
		KanbanRequestSender.#lastRequestId++;
		this.#requestId = KanbanRequestSender.#lastRequestId;

		return BX.ajax.runComponentAction('bitrix:tasks.kanban', 'setNewTaskOrder', {
			mode: 'class',
			data: {
				...order,
				params: this.#ajaxComponent.getParams(),
			},
		}).then(
			(response) => {
				// the board follows the order chosen last, so an answer overtaken by a newer request changes nothing
				if (this.#isOutdated())
				{
					return null;
				}

				const data = response.data;
				// the event is global, so the kanban of another view needs the parameters to tell it is not the one
				BX.onCustomEvent(this, 'onTaskSortChanged', [data, this.#ajaxComponent.getParams()]);

				return data;
			},
		);
	}

	#isOutdated(): boolean
	{
		return this.#requestId !== KanbanRequestSender.#lastRequestId;
	}

	#init()
	{
		this.#ajaxComponent = BX.Tasks.KanbanAjaxComponent.Parameters;
	}
}