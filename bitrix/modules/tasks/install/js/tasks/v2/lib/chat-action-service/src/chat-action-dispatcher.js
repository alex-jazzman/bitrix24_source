import { Type } from 'main.core';

import { BaseAction } from './action/base-action.js';
import type { ActionPayload } from './type/action-payload.js';

export class ChatActionDispatcher
{
	#actions: Map<string, BaseAction> = new Map();

	register(action: BaseAction): void
	{
		const actionName = action.getName();
		if (this.#actions.has(actionName))
		{
			throw new Error(`ChatActionDispatcher: action '${actionName}' already registered`);
		}

		this.#actions.set(actionName, action);
	}

	async execute(actionName: string, payload: ActionPayload): Promise<void>
	{
		if (!Type.isString(actionName) || actionName.trim() === '')
		{
			throw new Error('Invalid action name');
		}

		const action = this.#actions.get(actionName.trim());
		if (!action)
		{
			throw new Error(`Action '${actionName}' not found`);
		}

		await action.execute(payload);
	}
}
