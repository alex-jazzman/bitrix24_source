import {EventEmitter} from 'main.core.events';

const eventEmitter = EventEmitter ?? BX.Event.EventEmitter;
if (!EventEmitter)
{
	BX.EventEmitter = eventEmitter;
}

export type UpdateParams = {
	id: number,
	groupId: number,
	sourceId: number,
	sprintId?: number,
	tmpId?: string
}

export type StructuralParams = {
	id?: number,
	groupId: number,
	sprintId?: number,
	entityIds?: number[],
}

export class PullItem extends eventEmitter
{
	constructor()
	{
		super();

		this.setEventNamespace('BX.Tasks.Scrum.KanbanManager.PullItem');
	}

	getModuleId(): string
	{
		return 'tasks';
	}

	getMap(): Object
	{
		return {
				itemAdded: this.onStructureChanged.bind(this),
				itemRemoved: this.onStructureChanged.bind(this),
				itemMoved: this.onStructureChanged.bind(this),
				itemPlacementChanged: this.onStructureChanged.bind(this),
				itemUpdated: this.onItemUpdated.bind(this),
		};
	}

	onStructureChanged(params: StructuralParams): void
	{
		this.emit('structureChanged', params);
	}

	onItemUpdated(params: UpdateParams)
	{
		this.emit('itemUpdated', params);
	}
}
