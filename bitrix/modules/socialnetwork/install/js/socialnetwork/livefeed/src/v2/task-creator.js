import { Type } from 'main.core';

import { Api } from './api';
import { CardBuilder } from './card-builder';
import { eventHandler } from './event-handler';
import type { CreateParams } from './types';

export const createFromContent = async (createParams: CreateParams): Promise<void> => {
	eventHandler.init();

	const taskLinkData = await Api.getTaskLinkData(createParams);

	const cardParams = CardBuilder.buildCardParams(createParams, taskLinkData);

	const { TaskCard } = await top.BX.Runtime.loadExtension('tasks.v2.application.task-card');

	const isFromComment = Type.isStringFilled(createParams.postEntityType);
	if (isFromComment)
	{
		TaskCard.showCompactCard(cardParams);
	}
	else
	{
		TaskCard.showFullCard(cardParams);
	}
};
