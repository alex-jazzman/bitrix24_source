import { ProgressBarRepository } from 'crm.autorun';
import { Extension, Type } from 'main.core';
import { Router } from './event/router';

import './event/handlers-registry';

const routers: Map<string, Router> = new Map();

/**
 * @memberOf BX.Crm.EntityList.Panel
 */
export function init({ gridId, progressBarContainerId }): void
{
	if (!Type.isStringFilled(gridId))
	{
		console.error('entity list panel gridId is empty');

		return;
	}

	const progressBarContainer = document.getElementById(progressBarContainerId);
	if (!Type.isElementNode(progressBarContainer))
	{
		console.error(`entity list panel progress bar container not found: ${progressBarContainerId}`);

		return;
	}

	const progressBarRepo = new ProgressBarRepository(progressBarContainer, gridId);

	const settings = Extension.getSettings('crm.entity-list.panel');

	const eventRouter = new Router(gridId, progressBarRepo, settings);

	// the working router is dropped only once its replacement stands: a panel left without one
	// swallows every command of its grid
	routers.get(gridId)?.stopListening();

	eventRouter.startListening();

	routers.set(gridId, eventRouter);
}
