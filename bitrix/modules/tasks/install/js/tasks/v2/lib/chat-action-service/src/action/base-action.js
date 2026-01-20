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
