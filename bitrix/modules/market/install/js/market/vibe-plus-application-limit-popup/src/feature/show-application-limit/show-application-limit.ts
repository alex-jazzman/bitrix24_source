import { Page } from 'main.core';
import { BannerDispatcher } from 'ui.banner-dispatcher';
import { MarketLinks } from 'market.market-links';

import { ApplicationLimitPopup } from '../../application/application-limit-popup';
import {
	isApplicationLimitExceeded,
	type ApplicationLimitAction,
	type ApplicationLimitDto,
} from '../../model/application-limit/types';

const AUTO_LAUNCH_ID = 'market-vibe-plus-application-limit-popup';
const popup = new ApplicationLimitPopup();

let autoShowScheduled = false;
let autoShowCompleted = false;

function getAutoLaunchStorageKey(): string
{
	const userId = String((window as any).BX?.message?.('USER_ID') ?? 'anonymous');

	return `${AUTO_LAUNCH_ID}:shown:${userId}`;
}

function wasAutoShown(): boolean
{
	try
	{
		return window.localStorage.getItem(getAutoLaunchStorageKey()) === 'Y';
	}
	catch
	{
		return false;
	}
}

function rememberAutoShow(): void
{
	try
	{
		window.localStorage.setItem(getAutoLaunchStorageKey(), 'Y');
	}
	catch
	{
		// Storage can be unavailable in restricted browser contexts.
	}
}

export function resolveApplicationLimitActionTarget(action: ApplicationLimitAction): string
{
	return action.type === 'list'
		? (MarketLinks as any).installedVibePlusLimitLink()
		: action.target;
}

function openApplicationLimitAction(action: ApplicationLimitAction): void
{
	const target = resolveApplicationLimitActionTarget(action);
	const topWindow: any = window.top ?? window;
	popup.close();

	if (action.type !== 'list')
	{
		Page.redirect(target);
	}
	else if (topWindow.BX?.SidePanel?.Instance)
	{
		topWindow.BX.SidePanel.Instance.open(target);
	}
	else
	{
		window.location.assign(target);
	}
}

export function showVibePlusApplicationLimitPopup(
	dto: ApplicationLimitDto | null | undefined,
): boolean
{
	if (!isApplicationLimitExceeded(dto))
	{
		return false;
	}

	return popup.show(dto, {
		onAction: openApplicationLimitAction,
	});
}

export function showVibePlusApplicationLimitPopupPreview(
	dto: ApplicationLimitDto | null | undefined,
): boolean
{
	if (!isApplicationLimitExceeded(dto))
	{
		return false;
	}

	return popup.showPreview(dto);
}

export function scheduleVibePlusApplicationLimitPopup(
	dto: ApplicationLimitDto | null | undefined,
): boolean
{
	if (
		autoShowScheduled
		|| autoShowCompleted
		|| wasAutoShown()
		|| !isApplicationLimitExceeded(dto)
	)
	{
		return false;
	}

	autoShowScheduled = true;
	BannerDispatcher.normal.toQueue((onDone) => {
		let queueCompleted = false;
		const completeQueue = (): void => {
			if (queueCompleted)
			{
				return;
			}

			queueCompleted = true;
			autoShowCompleted = true;
			onDone();
		};

		try
		{
			const shown = popup.show(dto, {
				onAction: openApplicationLimitAction,
				onClose: completeQueue,
			});
			if (!shown)
			{
				completeQueue();

				return {};
			}

			rememberAutoShow();
		}
		catch
		{
			completeQueue();
		}

		return {};
	}, { id: AUTO_LAUNCH_ID } as any);

	return true;
}
