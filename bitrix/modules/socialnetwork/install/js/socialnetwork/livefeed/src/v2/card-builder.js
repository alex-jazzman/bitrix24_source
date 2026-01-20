import { Loc, Type, Text } from 'main.core';
import type { AnalyticsParams } from 'tasks.v2.application.task-card';
import type { Source } from 'tasks.v2.model.tasks';

import { EntityType, Analytics } from './const';
import type { CardParams, CreateParams, TaskLinkData } from './types';

export class CardBuilder
{
	static buildCardParams(createParams: CreateParams, requestData: TaskLinkData): CardParams
	{
		const isFromComment = createParams.entityType === EntityType.BlogComment;

		return {
			taskId: `${createParams.entityType}_${Date.now()}`,
			createParams,
			requestData,
			description: this.#formatTaskDescription(createParams.entityType, requestData),
			groupId: Number(requestData.GROUP_ID) || null,
			parentId: Number(requestData.PARENT_ID) || null,
			auditorsIds: requestData.AUDITORS.split(',').filter((id) => id).map(Number),
			fileIds: requestData.UF_TASK_WEBDAV_FILES,
			source: this.#buildSourceParams(createParams),
			analytics: this.#buildAnalyticsParams(isFromComment),
		};
	}

	static #buildAnalyticsParams(isFromComment: boolean): AnalyticsParams
	{
		return {
			context: Analytics.Context.Feed,
			element: isFromComment ? Analytics.Element.CommentContextMenu : Analytics.Element.PostContextMenu,
		};
	}

	static #buildSourceParams(createParams: CreateParams): Source
	{
		return {
			type: createParams.entityType,
			entityId: Number(createParams.entityId),
			subEntityId: Number(createParams.logId) || null,
		};
	}

	static #formatTaskDescription(entityType: string, requestData: TaskLinkData): string
	{
		const text = Text.decode(requestData.DESCRIPTION);
		const title = requestData.TITLE;

		const url = new URL(requestData.URL, location).toString();
		const suffix = (Type.isStringFilled(requestData.SUFFIX) ? `_${requestData.SUFFIX}` : '');
		const headerLoc = `SONET_EXT_COMMENTAUX_CREATE_TASK_${entityType}${suffix}`;
		const headerText = Loc.getMessage(headerLoc)
			.replace('#A_BEGIN#', `[URL=${url}]`)
			.replace('#A_END#', '[/URL]')
		;

		if (entityType === EntityType.BlogPost && Type.isStringFilled(title))
		{
			return `[QUOTE]${headerText}\n\n[B]${title}[/B]\n\n${text}[/QUOTE]`;
		}

		return `[QUOTE]${headerText}\n\n${text}[/QUOTE]`;
	}
}
