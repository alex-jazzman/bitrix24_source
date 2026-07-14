import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { EventName, ChatAction } from 'tasks.v2.const';
import { timeTrackingService } from 'tasks.v2.provider.service.time-tracking-service';

import { type ActionPayload } from '../type/action-payload';
import { BaseAction } from './base-action';
import { chatHint } from '../chat-hint';

class OpenTimeTrackingAction extends BaseAction
{
	getName(): string
	{
		return ChatAction.OpenTimeTracking;
	}

	async execute(payload: ActionPayload): Promise<void>
	{
		if (!this.isValid(payload))
		{
			throw new Error('Invalid payload');
		}

		if (payload.entityId)
		{
			const isTimeTrackingValid = await this.validateTimeTracking(payload);

			if (!isTimeTrackingValid)
			{
				return;
			}
		}

		this.openTimeTrackingPopup(payload.entityId);
	}

	async validateTimeTracking(payload: ActionPayload): Promise<boolean>
	{
		let elapsedTime = timeTrackingService.getById(payload.entityId);

		if (!elapsedTime && !timeTrackingService.hasLoaded(payload.taskId))
		{
			await timeTrackingService.list(payload.taskId);

			elapsedTime = timeTrackingService.getById(payload.entityId);
		}

		if (elapsedTime)
		{
			return true;
		}

		if (this.isNewerThanLoaded(payload.taskId, payload.entityId))
		{
			return true;
		}

		if (!timeTrackingService.hasLoadedAll(payload.taskId))
		{
			return true;
		}

		this.showRecordRemovedHint(payload);

		return false;
	}

	showRecordRemovedHint(payload: ActionPayload): void
	{
		void chatHint.show(
			Loc.getMessage('TASKS_V2_CHAT_ACTION_OPEN_TIME_TRACKING_RECORD_REMOVED'),
			payload,
		);
	}

	isNewerThanLoaded(taskId: number, entityId: number): boolean
	{
		const loadedIds = timeTrackingService.getLoadedIds(taskId);

		if (loadedIds.length === 0)
		{
			return false;
		}

		return entityId > loadedIds[0];
	}

	openTimeTrackingPopup(entityId: string): void
	{
		EventEmitter.emit(EventName.OpenTimeTrackingPopup, { entityId });
	}
}

export const openTimeTrackingAction = new OpenTimeTrackingAction();
