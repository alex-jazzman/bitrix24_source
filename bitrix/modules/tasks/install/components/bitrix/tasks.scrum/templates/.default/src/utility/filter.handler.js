import {Type, Dom} from 'main.core';
import {Loader} from 'main.loader';
import {BaseEvent} from 'main.core.events';

import {Filter} from '../service/filter';

import {PlanBuilder} from '../view/plan/plan.builder';

import {Entity} from '../entity/entity';
import {EntityStorage} from '../entity/entity.storage';
import {EntityCounters} from '../counters/entity.counters';
import {Sprint, SprintParams} from '../entity/sprint/sprint';

import {RequestSender} from './request.sender';

import {Item, ItemParams} from '../item/item';

const PLACEMENT_RESYNC_DELAY = 150;

type Params = {
	filter: Filter,
	requestSender: RequestSender,
	entityStorage: EntityStorage,
	entityCounters?: EntityCounters,
	planBuilder: PlanBuilder,
	pageSize: number
}

type ApplyFilterResponse = {
	data: {
		isExactSearchApplied: 'Y' | 'N',
		completedSprints: Array<SprintParams>,
		items: Array<ItemParams>
	}
}

export class FilterHandler
{
	constructor(params: Params)
	{
		this.filter = params.filter;
		this.requestSender = params.requestSender;
		this.entityStorage = params.entityStorage;
		this.entityCounters = params.entityCounters ?? new EntityCounters({
			requestSender: this.requestSender,
			entityStorage: this.entityStorage
		});
		this.planBuilder = params.planBuilder;
		this.pageSize = params.pageSize;
		this.requestGeneration = 0;
		this.pendingRequestGeneration = null;
		this.resyncTimer = null;
		this.refreshCountersPending = false;

		this.filter.subscribe('applyFilter', this.onApplyFilter.bind(this));
	}

	requestResync(force: boolean = true): void
	{
		if (!force && this.pendingRequestGeneration !== this.requestGeneration)
		{
			return;
		}

		this.refreshCountersPending = true;
		this.requestGeneration += 1;
		if (this.resyncTimer !== null)
		{
			return;
		}

		this.resyncTimer = setTimeout(() => {
			this.resyncTimer = null;
			this.onApplyFilter(null, true);
		}, PLACEMENT_RESYNC_DELAY);
	}

	onApplyFilter(baseEvent: ?BaseEvent, refreshCounters: boolean = false)
	{
		if (refreshCounters)
		{
			this.refreshCountersPending = true;
		}

		if (this.resyncTimer !== null)
		{
			clearTimeout(this.resyncTimer);
			this.resyncTimer = null;
		}
		const requestGeneration = ++this.requestGeneration;
		this.pendingRequestGeneration = requestGeneration;

		this.fadeOutAll();

		const containerPosition = Dom.getPosition(this.planBuilder.getScrumContainer());

		const loader = new Loader({
			target: this.planBuilder.getScrumContainer(),
			offset: {
				top: `${containerPosition.top / 2}px`
			}
		});

		loader.show();

		this.requestSender.applyFilter({
			pageSize: this.pageSize
		}).then((response: ApplyFilterResponse) => {
			if (this.pendingRequestGeneration === requestGeneration)
			{
				this.pendingRequestGeneration = null;
			}

			if (requestGeneration !== this.requestGeneration)
			{
				loader.hide();

				return;
			}

			const filteredItemsData = response.data.items;

			this.entityStorage.getAllItems().forEach((item: Item) => {
				const entity = this.entityStorage.findEntityByItemId(item.getId());
				entity.removeItem(item);
				if (item.isShownSubTasks())
				{
					item.hideSubTasks();
				}
				item.removeYourself();
			});

			const completedSprints = new Map();

			filteredItemsData.forEach((itemParams: ItemParams) => {
				const item = Item.buildItem(itemParams);
				const entity = this.entityStorage.findEntityByEntityId(item.getEntityId());
				if (response.data.completedSprints.length)
				{
					response.data.completedSprints
						.forEach((sprintParams: SprintParams) => {
							if (item.getEntityId() === sprintParams.id)
							{
								if (completedSprints.has(item.getEntityId()))
								{
									completedSprints.get(item.getEntityId()).setItem(item);
								}
								else
								{
									const completedSprint = Sprint.buildSprint(sprintParams);
									completedSprint.setItem(item);
									completedSprint.setShortView('Y');

									completedSprints.set(completedSprint.getId(), completedSprint);
								}
							}
						})
					;
				}

				if (entity && !entity.isCompleted())
				{
					item.setShortView(entity.getShortView());

					entity.appendItemToList(item);
					entity.setItem(item);

					this.planBuilder.clearLoadItemsRepeatCounter();

					entity.setActiveLoadItems(false);
					entity.bindItemsLoader();
				}
			});

			const isExactSearchApplied = response.data.isExactSearchApplied === 'Y';

			this.entityStorage.getAllEntities()
				.forEach((entity: Entity) => {
					entity.setExactSearchApplied(response.data.isExactSearchApplied);
					if (!entity.isCompleted() && entity.isEmpty())
					{
						if (entity.getNumberTasks() > 0 && entity.isExactSearchApplied())
						{
							entity.showEmptySearchStub();
							entity.hideDropzone();
						}
						else
						{
							if (this.entityStorage.existsAtLeastOneItem())
							{
								entity.showDropzone();
							}
							entity.hideEmptySearchStub();
						}
					}
					if (!entity.isBacklog() && !entity.isCompleted())
					{
						entity.setPageNumberItems(Math.ceil((entity.getNumberItems() / entity.getPageSize())));
					}
				})
			;

			this.planBuilder.hideEmptySearchStub();

			if (completedSprints.size)
			{
				this.planBuilder.showFilteredCompletedSprints(completedSprints);
			}
			else
			{
				this.planBuilder.hideFilteredCompletedSprints();

				if (isExactSearchApplied)
				{
					this.planBuilder.showEmptySearchStub();
				}
			}

			if (this.refreshCountersPending)
			{
				this.refreshCountersPending = false;
				const entities = new Map(
					[...this.entityStorage.getAllEntities()]
						.filter(([, entity]) => !entity.isCompleted())
				);
				this.entityCounters.updateCounters(entities);
			}

			this.fadeInAll();

			loader.hide();
		}).catch((response) => {
			if (this.pendingRequestGeneration === requestGeneration)
			{
				this.pendingRequestGeneration = null;
			}

			if (requestGeneration !== this.requestGeneration)
			{
				loader.hide();

				return;
			}

			this.fadeInAll();

			loader.hide();

			this.requestSender.showErrorAlert(response);
		});
	}

	fadeOutAll()
	{
		this.entityStorage.getBacklog().fadeOut();

		this.entityStorage.getSprints().forEach((sprint: Sprint) => {
			if (!sprint.isCompleted())
			{
				sprint.fadeOut();
			}
		});
	}

	fadeInAll()
	{
		this.entityStorage.getBacklog().fadeIn();

		this.entityStorage.getSprints().forEach((sprint: Sprint) => {
			if (!sprint.isCompleted())
			{
				sprint.fadeIn();
			}
		});
	}
}
