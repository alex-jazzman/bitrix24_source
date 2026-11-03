import {Type} from 'main.core';
import {BaseEvent} from 'main.core.events';

import {EntityStorage} from '../entity/entity.storage';

import {Item, ItemParams} from '../item/item';
import {ItemMover, ItemsSortInfo} from '../item/item.mover';

import {EntityCounters} from '../counters/entity.counters';

import {RequestSender} from '../utility/request.sender';
import {TagSearcher} from '../utility/tag.searcher';

import {Entity} from '../entity/entity';

type Params = {
	requestSender: RequestSender,
	entityStorage: EntityStorage,
	entityCounters: EntityCounters,
	tagSearcher: TagSearcher,
	itemMover: ItemMover,
	currentUserId: number,
	groupId: number,
	requestPlacementResync: (force?: boolean) => void,
}

type PushParams = {
	id: number,
	groupId: number,
	tmpId?: string
}

export class PullItem
{
	constructor(params: Params)
	{
		this.requestSender = params.requestSender;
		this.entityStorage = params.entityStorage;
		this.entityCounters = params.entityCounters;
		this.tagSearcher = params.tagSearcher;
		this.itemMover = params.itemMover;
		this.currentUserId = params.currentUserId;
		this.groupId = params.groupId;
		this.requestPlacementResync = params.requestPlacementResync;

		this.listToAddAfterUpdate = new Set();

		this.listIdsToSkipAdding = new Set();
		this.listIdsToSkipUpdating = new Set();
		this.listIdsToSkipRemoving = new Set();
		this.listIdsToSkipSorting = new Set();
		this.pendingHierarchyRequests = new Map();
		this.pendingParentDataRequests = new Map();

		this.itemMover.subscribe('calculateSort', this.onCalculateSort.bind(this));
	}

	getModuleId(): string
	{
		return 'tasks';
	}

	getMap(): Object
	{
		return {
			itemAdded: this.onItemAdded.bind(this),
			itemUpdated: this.onItemUpdated.bind(this),
			itemRemoved: this.onItemRemoved.bind(this),
			itemPlacementChanged: this.onPlacementChanged.bind(this),
			itemSortUpdated: this.onItemSortUpdated.bind(this),
			comment_add: this.onCommentAdd.bind(this)
		};
	}

	onPlacementChanged(params: PushParams): void
	{
		if (this.groupId === params.groupId)
		{
			this.requestPlacementResync();
		}
	}

	onItemAdded(params: PushParams)
	{
		if (this.groupId !== params.groupId)
		{
			return;
		}

		this.invalidatePendingHierarchyRequest(params.id);
		const parentRequest = this.beginParentDataRequest(params.id);
		this.setDelayedAdd(params.id);

		this.externalAdd(params.id)
			.finally(() => this.cleanDelayedAdd(params.id))
			.then(() => {
				if (!this.isCurrentParentDataRequest(params.id, parentRequest))
				{
					return;
				}

				return this.requestSender.getItemData({
					itemIds: [params.id]
				})
					.then((response) => {
						if (!this.isCurrentParentDataRequest(params.id, parentRequest))
						{
							return;
						}

						const itemData = response.data
							.find((itemData: ItemParams) => itemData.id === params.id)
						;
						const item = Item.buildItem(itemData);
						this.addItemToEntity(item);
					})
					.catch((response) => {})
				;
			})
			.catch(() => {})
			.finally(() => this.finishParentDataRequest(params.id, parentRequest))
		;
	}

	onItemUpdated(params: PushParams)
	{
		if (this.groupId !== params.groupId)
		{
			return;
		}

		this.invalidatePendingHierarchyRequest(params.id);
		const parentRequest = this.beginParentDataRequest(params.id);
		this.requestSender.getItemData({
			itemIds: [params.id]
		})
			.then((response) => {
				if (!this.isCurrentParentDataRequest(params.id, parentRequest))
				{
					return;
				}

				const itemData = response.data
					.find((itemData: ItemParams) => itemData.id === params.id)
				;
				const item = Item.buildItem(itemData);

				if (this.isDelayedAdd(item.getId()))
				{
					this.cleanDelayedAdd(item.getId());

					if (this.needSkipAdd(params.tmpId))
					{
						this.cleanSkipAdd(params.tmpId);

						return;
					}

					this.addItemToEntity(item);

					return;
				}

				if (this.needSkipUpdate(item))
				{
					this.cleanSkipUpdate(item);
					this.reconcileVisibleSubTasks(item);

					return;
				}

				this.updateItem(item);
			})
			.catch((response) => {})
			.finally(() => this.finishParentDataRequest(params.id, parentRequest))
		;
	}

	onItemRemoved(params: PushParams)
	{
		if (this.groupId !== params.groupId)
		{
			return;
		}

		this.invalidatePendingHierarchyRequest(params.id);
		if (this.needSkipRemove(params.id))
		{
			this.cleanSkipRemove(params.id);

			return;
		}

		const item = this.entityStorage.findItemByItemId(params.id);
		const wasParentTask = item?.isParentTask() ?? false;
		if (item)
		{
			const entity = this.entityStorage.findEntityByItemId(item.getId());
			entity.removeItem(item);
			item.removeYourself();

			this.updateEntityCounters(entity);
		}
		this.requestPlacementResync(wasParentTask);
	}

	onItemSortUpdated(itemsSortInfo: ItemsSortInfo)
	{
		const itemsInfoToSort = new Map();

		Object.entries(itemsSortInfo).forEach(([itemId, info]) => {
			if (!this.needSkipSort(info.tmpId))
			{
				itemsInfoToSort.set(parseInt(itemId, 10), info);
			}
			this.cleanSkipRemove(info.tmpId);
		});

		if (itemsInfoToSort.size === 0)
		{
			return;
		}

		this.pendingSortHierarchyBatches = this.pendingSortHierarchyBatches || new Set();
		const parentRequests = new Map();
		itemsInfoToSort.forEach((info, itemId) => {
			this.invalidatePendingHierarchyRequest(itemId);
			parentRequests.set(itemId, this.beginParentDataRequest(itemId));
		});
		const batch = { invalidatedItemIds: new Set() };
		this.pendingSortHierarchyBatches.add(batch);

		this.requestSender.getItemData({
			itemIds: [...itemsInfoToSort.keys()]
		})
			.then((response) => {
				const itemsToSort = new Map();
				const freshItems = new Map();
				const newItems = new Set();
				response.data
					.forEach((itemData: ItemParams) => {
						if (
							batch.invalidatedItemIds.has(String(itemData.id))
							|| !this.isCurrentParentDataRequest(itemData.id, parentRequests.get(itemData.id))
						)
						{
							return;
						}
						const freshItem = Item.buildItem(itemData);
						let item = this.entityStorage.findItemByItemId(itemData.id);
						if (!item)
						{
							item = freshItem;
							newItems.add(item.getId());
						}
						itemsToSort.set(item.getId(), item);
						freshItems.set(item.getId(), freshItem);
					})
				;
				itemsToSort.forEach((item: Item) => {
					const itemInfoToSort = itemsInfoToSort.get(item.getId());
					if (item.isParentTask() && item.isShownSubTasks())
					{
						item.hideSubTasks();
					}
					item.setSort(itemInfoToSort.sort);

					const sourceEntity = this.entityStorage.findEntityByEntityId(item.getEntityId());
					if (sourceEntity)
					{
						const targetEntityId = (
							Type.isUndefined(itemInfoToSort.entityId)
								? item.getEntityId()
								: itemInfoToSort.entityId
						);
						let targetEntity = this.entityStorage.findEntityByEntityId(targetEntityId);
						if (!targetEntity || sourceEntity.getId() === targetEntity.getId())
						{
							targetEntity = sourceEntity;
						}
						this.itemMover.moveToPosition(sourceEntity, targetEntity, item);
					}

					const freshItem = freshItems.get(item.getId());
					if (item !== freshItem && freshItem.getSubTasksInfo())
					{
						item.setSubTasksInfo(freshItem.getSubTasksInfo());
						item.setParentTask(freshItem.isParentTask() ? 'Y' : 'N');
					}
				});

				return this.reconcileVisibleSubTasksBatch([...freshItems.values()], batch);
			})
			.catch((response) => {})
			.finally(() => {
				this.pendingSortHierarchyBatches.delete(batch);
				parentRequests.forEach((request, itemId) => this.finishParentDataRequest(itemId, request));
			})
		;
	}

	onCommentAdd(params)
	{
		const participants = Type.isArray(params.participants) ? params.participants : [];

		if (participants.includes(this.currentUserId.toString()))
		{
			const xmlId = params.entityXmlId.split('_');
			if (xmlId)
			{
				const entityType = xmlId[0];
				const taskId = xmlId[1];
				const item = this.entityStorage.findItemBySourceId(taskId);
				if (entityType === 'TASK' && item)
				{
					this.requestSender.getCurrentState({
						taskId: item.getSourceId()
					}).then((response) => {
						const tmpItem = Item.buildItem(response.data.itemData);
						this.updateItem(tmpItem, item);
					}).catch((response) => {
						this.requestSender.showErrorAlert(response);
					});
				}
			}
		}
	}

	addItemToEntity(item: Item)
	{
		if (item.isSubTask())
		{
			const parentItem = this.entityStorage.findItemBySourceId(item.getParentTaskId());

			if (parentItem && !parentItem.isDecompositionMode())
			{
				parentItem.hideSubTasks();
				parentItem.cleanSubTasks();
			}

			return;
		}

		this.requestSender.hasTaskInFilter({
			taskId: item.getSourceId()
		}).then((response) => {
			if (!response.data.has)
			{
				return;
			}

			const entity = this.entityStorage.findEntityByEntityId(item.getEntityId());
			if (!entity)
			{
				return;
			}

			const existingItem = this.entityStorage.findItemBySourceId(item.getSourceId());
			if (existingItem)
			{
				this.updateItem(item, existingItem);

				return;
			}

			this.itemMover.moveToPosition(entity, entity, item);
			this.reconcileVisibleSubTasks(item);
		}).catch((response) => {
			this.requestSender.showErrorAlert(response);
		});
	}

	updateItem(tmpItem: Item, item?: Item)
	{
		if (!item)
		{
			item = this.entityStorage.findItemByItemId(tmpItem.getId());
		}

		if (item)
		{
			const isParentChangeAction = tmpItem.isSubTask() !== item.isSubTask();
			if (isParentChangeAction)
			{
				if (tmpItem.isSubTask())
				{
					const entity = this.entityStorage.findEntityByItemId(item.getId());
					entity.removeItem(item);
					item.removeYourself();
				}

				return;
			}

			const targetEntityId = tmpItem.getEntityId();
			const sourceEntityId = item.getEntityId();
			const targetEntity = this.entityStorage.findEntityByEntityId(targetEntityId);
			const sourceEntity = this.entityStorage.findEntityByEntityId(sourceEntityId);

			if (tmpItem.getEntityId() !== item.getEntityId())
			{
				if (targetEntity && sourceEntity)
				{
					this.itemMover.moveToPosition(sourceEntity, targetEntity, item);
				}
			}
			else
			{
				this.updateEntityCounters(targetEntity);
			}

			item.updateYourself(tmpItem);
			if (tmpItem.getSubTasksInfo())
			{
				item.setSubTasksInfo(tmpItem.getSubTasksInfo());
			}
			this.reconcileVisibleSubTasks(tmpItem);
		}
		else
		{
			if (tmpItem.isSubTask())
			{
				const targetEntityId = tmpItem.getEntityId();
				const targetEntity = this.entityStorage.findEntityByEntityId(targetEntityId);

				this.updateEntityCounters(targetEntity);
			}
			else
			{
				this.addItemToEntity(tmpItem);
			}
		}
	}

	beginParentDataRequest(itemId: number)
	{
		const request = {};
		this.pendingParentDataRequests.set(String(itemId), request);

		return request;
	}

	isCurrentParentDataRequest(itemId: number, request): boolean
	{
		return this.pendingParentDataRequests.get(String(itemId)) === request;
	}

	finishParentDataRequest(itemId: number, request)
	{
		if (this.isCurrentParentDataRequest(itemId, request))
		{
			this.pendingParentDataRequests.delete(String(itemId));
		}
	}

	invalidatePendingHierarchyRequest(itemId: number)
	{
		this.pendingParentDataRequests.delete(String(itemId));

		if (this.pendingSortHierarchyBatches)
		{
			this.pendingSortHierarchyBatches.forEach((batch) => {
				batch.invalidatedItemIds.add(String(itemId));
			});
		}

		this.pendingHierarchyRequests.forEach((request, parentItemId) => {
			if (String(parentItemId) === String(itemId))
			{
				request.invalidated = true;
				request.nextParentItem = null;
			}
			else if (request.itemIds.some((id) => String(id) === String(itemId)))
			{
				request.invalidated = true;
			}
		});
	}

	reconcileVisibleSubTasks(parentItem: Item)
	{
		const parentItemId = parentItem.getId();
		const pendingRequest = this.pendingHierarchyRequests.get(parentItemId);
		if (pendingRequest)
		{
			pendingRequest.invalidated = true;
			pendingRequest.nextParentItem = parentItem;

			return;
		}

		const visibleParent = this.entityStorage.findItemByItemId(parentItemId);
		if (!visibleParent || visibleParent.getSourceId() !== parentItem.getSourceId())
		{
			return;
		}
		const parentEntity = this.entityStorage.findEntityByItemId(parentItemId);
		if (!parentEntity || parentEntity.isCompleted())
		{
			return;
		}

		const subTasksInfo = parentItem.getSubTasksInfo();
		if (!subTasksInfo)
		{
			return;
		}
		const childSourceIds = Object.keys(subTasksInfo);
		if (childSourceIds.length === 0)
		{
			return;
		}

		const itemIds = this.entityStorage.findRootItemIdsBySourceIds(
			new Set(childSourceIds)
		);

		if (itemIds.length === 0)
		{
			return;
		}

		const request = {
			itemIds,
			invalidated: false,
			nextParentItem: parentItem,
		};
		this.pendingHierarchyRequests.set(parentItemId, request);

		this.requestSender.getItemData({ itemIds })
			.then((response) => {
				if (request.invalidated)
				{
					return;
				}

				const currentParent = this.entityStorage.findItemByItemId(parentItemId);
				if (!currentParent || currentParent.getSourceId() !== parentItem.getSourceId())
				{
					return;
				}
				const currentParentEntity = this.entityStorage.findEntityByItemId(parentItemId);
				if (!currentParentEntity || currentParentEntity.isCompleted())
				{
					return;
				}
				const currentSubTasksInfo = currentParent.getSubTasksInfo() || {};
				const removals = new Map();

				response.data.forEach((itemData: ItemParams) => {
					this.collectReconciledChild(removals, parentItem, currentSubTasksInfo, itemData);
				});
				this.removeReconciledChildren(removals);
			})
			.catch((response) => {})
			.finally(() => {
				if (this.pendingHierarchyRequests.get(parentItemId) !== request)
				{
					return;
				}

				this.pendingHierarchyRequests.delete(parentItemId);
				if (request.invalidated && request.nextParentItem)
				{
					this.reconcileVisibleSubTasks(request.nextParentItem);
				}
			})
		;
	}

	reconcileVisibleSubTasksBatch(parentItems: Array<Item>, batch): Promise
	{
		const parentsById = new Map();
		const parentIdsByChildSourceId = new Map();
		parentItems.forEach((parentItem: Item) => {
			if (batch.invalidatedItemIds.has(String(parentItem.getId())))
			{
				return;
			}

			const subTasksInfo = parentItem.getSubTasksInfo();
			if (!subTasksInfo)
			{
				return;
			}
			Object.keys(subTasksInfo).forEach((childSourceId) => {
				if (!parentIdsByChildSourceId.has(childSourceId))
				{
					parentIdsByChildSourceId.set(childSourceId, new Set());
				}
				parentIdsByChildSourceId.get(childSourceId).add(parentItem.getId());
			});
			parentsById.set(parentItem.getId(), parentItem);
		});

		if (parentIdsByChildSourceId.size === 0)
		{
			return Promise.resolve();
		}

		const visibleParents = new Map();
		const visibleRoots = new Map();
		const visit = (item, entity) => {
			const parentItem = parentsById.get(item.getId());
			if (parentItem && item.getSourceId() === parentItem.getSourceId())
			{
				visibleParents.set(parentItem.getId(), { parentItem, item, entity });
			}

			const parentIds = parentIdsByChildSourceId.get(String(item.getSourceId()));
			if (parentIds && !item.isSubTask())
			{
				visibleRoots.set(String(item.getId()), { item, entity, parentIds });
			}
		};

		const backlog = this.entityStorage.backlog;
		backlog.getItems().forEach((item) => visit(item, backlog));
		this.entityStorage.sprints.forEach((sprint) => {
			if (!sprint.isCompleted())
			{
				sprint.getItems().forEach((item) => visit(item, sprint));
			}
		});

		const rootsToRefresh = new Map();
		visibleRoots.forEach((root, id) => {
			if ([...root.parentIds].some((parentId) => visibleParents.has(parentId)))
			{
				rootsToRefresh.set(id, root);
			}
		});
		if (rootsToRefresh.size === 0)
		{
			return Promise.resolve();
		}

		const itemIds = [...rootsToRefresh.values()].map(({ item }) => item.getId());
		return this.requestSender.getItemData({ itemIds }).then((response) => {
			const currentParentsByTaskId = new Map();
			visibleParents.forEach((parent, parentId) => {
				if (
					batch.invalidatedItemIds.has(String(parentId))
					|| parent.entity.isCompleted()
					|| !this.isEntityRegistered(parent.entity)
					|| parent.entity.getItems().get(parentId) !== parent.item
				)
				{
					return;
				}
				currentParentsByTaskId.set(String(parent.parentItem.getSourceId()), {
					...parent,
					subTasksInfo: parent.item.getSubTasksInfo() || {},
				});
			});

			const removals = new Map();
			response.data.forEach((itemData: ItemParams) => {
				const root = rootsToRefresh.get(String(itemData.id));
				if (
					!root
					|| batch.invalidatedItemIds.has(String(itemData.id))
					|| root.entity.isCompleted()
					|| !this.isEntityRegistered(root.entity)
					|| root.entity.getItems().get(root.item.getId()) !== root.item
				)
				{
					return;
				}
				const parent = currentParentsByTaskId.get(String(itemData.parentTaskId));
				if (parent && root.parentIds.has(parent.parentItem.getId()))
				{
					this.collectReconciledChild(
						removals,
						parent.parentItem,
						parent.subTasksInfo,
						itemData,
						root.item,
						root.entity
					);
				}
			});
			this.removeReconciledChildren(removals);
		});
	}

	isEntityRegistered(entity: Entity): boolean
	{
		return entity === this.entityStorage.backlog
			|| this.entityStorage.sprints.get(entity.getId()) === entity
		;
	}

	collectReconciledChild(
		removals: Map<Entity, Set<Item>>,
		parentItem: Item,
		subTasksInfo,
		itemData: ItemParams,
		rootItem?: Item,
		rootEntity?: Entity
	)
	{
		if (itemData.isSubTask !== 'Y' || itemData.parentTaskId !== parentItem.getSourceId())
		{
			return;
		}

		const item = rootItem || this.entityStorage.findItemByItemId(itemData.id);
		if (
			!item
			|| item.isSubTask()
			|| !Object.prototype.hasOwnProperty.call(subTasksInfo, item.getSourceId())
		)
		{
			return;
		}

		const entity = rootEntity || this.entityStorage.findEntityByItemId(item.getId());
		if (!entity || entity.isCompleted())
		{
			return;
		}

		if (!removals.has(entity))
		{
			removals.set(entity, new Set());
		}
		removals.get(entity).add(item);
	}

	removeReconciledChildren(removals: Map<Entity, Set<Item>>)
	{
		removals.forEach((items, entity) => {
			const itemsToRemove = [...items];
			const activeElement = document.activeElement;
			const focusedItem = itemsToRemove.find((item) => {
				const node = item.getNode ? item.getNode() : null;

				return node && node.contains(activeElement);
			});
			let focusTarget = null;
			if (focusedItem)
			{
				const focusedNode = focusedItem.getNode();
				const remainingNodes = [...entity.getItems().values()]
					.filter((item) => !items.has(item) && !item.isSubTask())
					.map((item) => item.getNode ? item.getNode() : null)
					.filter((node) => node && node.isConnected)
				;
				focusTarget = remainingNodes.find((node) => (
					focusedNode.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING
				)) ?? remainingNodes.at(-1) ?? entity.getListItemsNode();
			}

			if (entity.removeItems(itemsToRemove, true) > 0)
			{
				if (focusTarget && !activeElement.isConnected && document.activeElement === document.body)
				{
					if (!focusTarget.hasAttribute('tabindex'))
					{
						focusTarget.setAttribute('tabindex', '-1');
						focusTarget.addEventListener('blur', () => focusTarget.removeAttribute('tabindex'), { once: true });
					}
					focusTarget.focus({ preventScroll: true });
				}
				this.updateEntityCounters(entity);
			}
		});
	}

	updateEntityCounters(sourceEntity: Entity, endEntity?: Entity)
	{
		const entities = new Map();

		entities.set(sourceEntity.getId(), sourceEntity);
		if (endEntity)
		{
			entities.set(endEntity.getId(), endEntity);
		}

		this.entityCounters.updateCounters(entities);
	}

	onCalculateSort(baseEvent: BaseEvent)
	{
		const listSortInfo = baseEvent.getData();

		Object.entries(listSortInfo).forEach(([itemId, info]) => {
			if (Object.prototype.hasOwnProperty.call(info, 'tmpId'))
			{
				this.addTmpIdToSkipSorting(info.tmpId);
			}
		});
	}

	addTmpIdToSkipAdding(tmpId: string)
	{
		this.listIdsToSkipAdding.add(tmpId);
	}

	addIdToSkipUpdating(itemId: string)
	{
		this.listIdsToSkipUpdating.add(itemId);
	}

	addIdToSkipRemoving(itemId: number)
	{
		this.listIdsToSkipRemoving.add(itemId);
	}

	addTmpIdToSkipSorting(tmpId: string)
	{
		this.listIdsToSkipSorting.add(tmpId);
	}

	externalAdd(itemId: number): Promise
	{
		return new Promise((resolve, reject) => {
			setTimeout(() => (this.isDelayedAdd(itemId) ? resolve() : reject()), 3000);
		});
	}

	isDelayedAdd(itemId: number): boolean
	{
		return this.listToAddAfterUpdate.has(itemId);
	}

	setDelayedAdd(itemId: number)
	{
		this.listToAddAfterUpdate.add(itemId);
	}

	cleanDelayedAdd(itemId: number)
	{
		this.listToAddAfterUpdate.delete(itemId);
	}

	needSkipAdd(tmpId: string): boolean
	{
		return this.listIdsToSkipAdding.has(tmpId);
	}

	cleanSkipAdd(tmpId: string)
	{
		this.listIdsToSkipAdding.delete(tmpId);
	}

	needSkipUpdate(item: Item): boolean
	{
		return this.listIdsToSkipUpdating.has(item.getId());
	}

	cleanSkipUpdate(item: Item)
	{
		this.listIdsToSkipUpdating.delete(item.getId());
	}

	needSkipRemove(itemId: number): boolean
	{
		return this.listIdsToSkipRemoving.has(itemId);
	}

	cleanSkipRemove(itemId: number)
	{
		this.listIdsToSkipRemoving.delete(itemId);
	}

	needSkipSort(tmpId: string): boolean
	{
		return this.listIdsToSkipSorting.has(tmpId);
	}

	cleanSkipSort(tmpId: string)
	{
		this.listIdsToSkipSorting.delete(tmpId);
	}
}
