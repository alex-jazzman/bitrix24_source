import { Type } from 'main.core';

import type { ActionPayload } from '../type/action-payload.js';

export class BaseAction
{
	execute(payload: ActionPayload): Promise<void>
	{
		throw new Error(`Method execute must be implemented in ${this.constructor.name}`);
	}

	getName(): string
	{
		throw new Error(`Method getName must be implemented in ${this.constructor.name}`);
	}

	isValid(payload: ActionPayload): boolean
	{
		return this.#validatePayload(payload);
	}

	hasPermission(payload: ActionPayload): boolean
	{
		return true;
	}

	isTooltipOnly(payload: ActionPayload): boolean
	{
		return false;
	}

	isReady(payload: ActionPayload): boolean
	{
		return true;
	}

	get needsTaskData(): boolean
	{
		return false;
	}

	get redirectsToTaskWhenNotReady(): boolean
	{
		return false;
	}

	get needsResultData(): boolean
	{
		return false;
	}

	// an action whose store data may be stale asks to refetch it before its predicates are trusted
	needsRefresh(payload: ActionPayload): boolean
	{
		return false;
	}

	// resolves to false when the refetch failed and the action already reported it to the user, so the
	// caller drops the click; a refetch that proved nothing still resolves to true and leaves isReady()
	// false, which sends the click to the card instead of a verdict
	async refreshData(payload: ActionPayload): Promise<boolean>
	{
		return true;
	}

	requiresCard(payload: ActionPayload): boolean
	{
		return true;
	}

	#validatePayload(payload: ActionPayload): boolean
	{
		if (!Type.isPlainObject(payload))
		{
			return false;
		}

		return (
			Type.isNumber(payload.taskId)
			&& payload.taskId > 0
			&& Type.isDomNode(payload.bindElement)
		);
	}
}
