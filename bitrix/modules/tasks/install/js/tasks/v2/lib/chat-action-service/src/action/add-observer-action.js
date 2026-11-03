import { Loc } from 'main.core';
import { Notifier } from 'ui.notification-manager';

import { ChatAction, Endpoint } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';

import { BaseAction } from './base-action';
import { chatHint } from '../chat-hint';
import type { ActionPayload } from '../type/action-payload';

const Outcome = Object.freeze({
	Success: 'success',
	NoPermission: 'no_permission',
	AlreadyObserver: 'already_observer',
	UserInactive: 'user_inactive',
	NotAllowedByPolicy: 'not_allowed_by_policy',
	NoRequest: 'no_request',
});

class AddObserverAction extends BaseAction
{
	#inFlight: Set<string> = new Set();

	getName(): string
	{
		return ChatAction.AddObserver;
	}

	async execute(payload: ActionPayload): Promise<void>
	{
		if (!this.isValid(payload))
		{
			throw new Error('Invalid payload');
		}

		if (!payload.entityId)
		{
			return;
		}

		const key = `${payload.taskId}:${payload.entityId}`;

		if (this.#inFlight.has(key))
		{
			return;
		}

		this.#inFlight.add(key);

		try
		{
			const { outcome } = await apiClient.post(Endpoint.TaskAccessAddObserver, {
				taskId: payload.taskId,
				userId: payload.entityId,
			});

			this.#handleOutcome(outcome, payload);
		}
		catch (error)
		{
			this.#notify(Loc.getMessage('TASKS_V2_CHAT_ACTION_ADD_OBSERVER_ERROR'));
		}
		finally
		{
			this.#inFlight.delete(key);
		}
	}

	#handleOutcome(outcome: string, payload: ActionPayload): void
	{
		switch (outcome)
		{
			case Outcome.Success:
				break;

			case Outcome.NoPermission:
				void chatHint.show(Loc.getMessage('TASKS_V2_CHAT_ACTION_ADD_OBSERVER_NO_PERMISSION'), payload);
				break;

			case Outcome.AlreadyObserver:
				this.#notify(Loc.getMessage('TASKS_V2_CHAT_ACTION_ADD_OBSERVER_ALREADY_OBSERVER'));
				break;

			case Outcome.UserInactive:
				this.#notify(Loc.getMessage('TASKS_V2_CHAT_ACTION_ADD_OBSERVER_USER_INACTIVE'));
				break;

			case Outcome.NotAllowedByPolicy:
				this.#notify(Loc.getMessage('TASKS_V2_CHAT_ACTION_ADD_OBSERVER_NOT_ALLOWED'));
				break;

			case Outcome.NoRequest:
				this.#notify(Loc.getMessage('TASKS_V2_CHAT_ACTION_ADD_OBSERVER_NO_REQUEST'));
				break;

			default:
				this.#notify(Loc.getMessage('TASKS_V2_CHAT_ACTION_ADD_OBSERVER_ERROR'));
				break;
		}
	}

	#notify(text: string): void
	{
		Notifier.notifyViaBrowserProvider({
			id: 'tasks-chat-action-add-observer',
			text,
		});
	}
}

export const addObserverAction = new AddObserverAction();
