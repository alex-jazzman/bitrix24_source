import { Filter } from '../service/filter';
import { EntityStorage } from '../entity/entity.storage';
import { Item } from '../item/item';
import { RequestSender } from '../utility/request.sender';

type Params = {
	requestSender: RequestSender,
	entityStorage: EntityStorage,
	filterService: Filter,
	userId: number,
	groupId: number
}

export class PullCounters
{
	constructor(params: Params)
	{
		this.requestSender = params.requestSender;
		this.entityStorage = params.entityStorage;
		this.filterService = params.filterService;
		this.userId = params.userId;
		this.groupId = params.groupId;
	}

	getModuleId(): string
	{
		return 'tasks';
	}

	getMap(): Object
	{
		return {
			comment_add: this.onCommentAdd.bind(this),
			task_view: this.onTaskView.bind(this),
			scrum_read_all: this.onCommentsReadAll.bind(this),
		};
	}

	onCommentAdd(data): void
	{
		const inputTaskId = parseInt(data.taskId, 10);
		const ownerUserId = parseInt(data.ownerId, 10);

		if (ownerUserId === this.userId)
		{
			return;
		}

		this.#updateCurrentState(this.#getItem(inputTaskId));
	}

	onTaskView(data)
	{
		const inputTaskId = parseInt(data.TASK_ID, 10);
		const inputUserId = parseInt(data.USER_ID, 10);

		if (inputUserId !== this.userId)
		{
			return;
		}

		this.#updateCurrentState(this.#getItem(inputTaskId));
	}

	onCommentsReadAll(data)
	{
		const groupId = data.GROUP_ID;

		if (groupId && groupId === this.groupId)
		{
			this.filterService.applyFilter();
		}
	}

	#getItem(inputTaskId: number): ?Item
	{
		let item = this.entityStorage.findItemBySourceId(inputTaskId);
		if (!item)
		{
			item = this.entityStorage.findItemBySourceInFilteredCompletedSprints(inputTaskId);
		}

		return item;
	}

	#updateCurrentState(item: ?Item): void
	{
		if (!item)
		{
			return;
		}

		this.requestSender.getCurrentState({
			taskId: item.getSourceId(),
		}).then((response) => {
			item.updateYourself(Item.buildItem(response.data.itemData));
		}).catch((response) => {
			this.requestSender.showErrorAlert(response);
		});
	}
}
