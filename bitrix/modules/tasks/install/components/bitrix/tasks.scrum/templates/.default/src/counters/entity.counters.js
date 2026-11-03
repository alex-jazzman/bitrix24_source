import {EntityStorage} from '../entity/entity.storage';

import {Backlog} from '../entity/backlog/backlog';
import {Sprint} from '../entity/sprint/sprint';

import {RequestSender} from '../utility/request.sender';

type Params = {
	requestSender: RequestSender,
	entityStorage: EntityStorage
}

export class EntityCounters
{
	constructor(params: Params)
	{
		this.requestSender = params.requestSender;
		this.entityStorage = params.entityStorage;
		this.latestCounterRequestByEntity = new Map();
	}

	updateCounters(entities: Map<number, Backlog | Sprint>)
	{
		const requestData = {
			entityIds: [...entities.keys()]
		};

		const request = this.requestSender.getEntityCounters(requestData);
		entities.forEach((entity, entityId) => {
			this.latestCounterRequestByEntity.set(entityId, request);
		});

		request
			.then((response) => {
				Object.keys(response.data).forEach((entityId: number) => {
					entityId = parseInt(entityId, 10);
					if (this.latestCounterRequestByEntity.get(entityId) !== request)
					{
						return;
					}

					const entity = entities.get(entityId);
					const counters = response.data[entityId];
					entity.setStoryPoints(counters.storyPoints);
					entity.setNumberTasks(counters.numberTasks);
					if (entity.isActive())
					{
						entity.setCompletedStoryPoints(counters.completedStoryPoints);
						entity.setUncompletedStoryPoints(counters.uncompletedStoryPoints);
					}
				});
			})
			.catch((response) => {
				this.requestSender.showErrorAlert(response);
			})
		;
	}
}
