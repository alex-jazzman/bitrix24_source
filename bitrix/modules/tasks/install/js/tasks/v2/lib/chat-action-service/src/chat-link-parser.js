import { Type } from 'main.core';

import type { ParsedLink, Link } from './type/link.js';
import { ChatActionParam } from 'tasks.v2.const';

export class ChatLinkParser
{
	parse(link: Link): ParsedLink | null
	{
		if (!this.#validateLink(link))
		{
			console.error('ChatLinkParser: Link is not valid');

			return null;
		}

		const {
			taskId,
			[ChatActionParam.ChatAction]: chatAction,
			[ChatActionParam.EntityId]: entityId,
		} = link.matches.groups;

		const parsedTaskId = this.#parseNumber(taskId);

		if (parsedTaskId <= 0)
		{
			console.error('ChatLinkParser: taskId must be positive number');

			return null;
		}

		if (!chatAction || chatAction.trim() === '')
		{
			console.error('ChatLinkParser: actionName is required');

			return null;
		}

		const urlParams = this.#parseUrlParams(link.url);

		return {
			actionName: chatAction.trim(),
			payload: {
				taskId: parsedTaskId,
				entityId: entityId ? this.#parseNumber(entityId) : null,
				bindElement: link.anchor,
				...urlParams,
			},
		};
	}

	#validateLink(link: Link): boolean
	{
		if (!Type.isPlainObject(link))
		{
			return false;
		}

		if (!Type.isString(link.url) || link.url.trim() === '')
		{
			return false;
		}

		if (!Type.isArray(link.matches) || link.matches.length < 4)
		{
			return false;
		}

		return Type.isDomNode(link.anchor);
	}

	#parseUrlParams(url: string): Object
	{
		try
		{
			const urlParams = new URLSearchParams(url);

			return {
				[ChatActionParam.ChildrenIds]: this.#parseArrayIds(urlParams, ChatActionParam.ChildrenIds),
			};
		}
		catch
		{
			return {};
		}
	}

	#parseArrayIds(urlParams: URLSearchParams, paramName: string): Array
	{
		const result = [];
		urlParams.forEach((value: string, key: string) => {
			if (key.startsWith(paramName))
			{
				result.push(this.#parseNumber(value));
			}
		});

		return result;
	}

	#parseNumber(value: string): number
	{
		const parsed = parseInt(value, 10);

		return Number.isInteger(parsed) ? parsed : 0;
	}
}
