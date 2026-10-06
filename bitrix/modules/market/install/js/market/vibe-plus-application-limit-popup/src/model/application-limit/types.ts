import { Type } from 'main.core';

export type ApplicationLimitState = 'finite' | 'unlimited' | 'notApplicable' | 'unknown';
export type ApplicationLimitActionType = 'list' | 'trial' | 'buy';

export type ApplicationLimit = {
	state: ApplicationLimitState,
	count: number | null,
	limit: number | null,
	configuredLimit?: number | null,
	exceeded: boolean | null,
	installationBlocked: boolean | null,
};

export type ApplicationLimitTransition = {
	active: boolean,
	endsAt: number | null,
};

export type ApplicationLimitAction = {
	type: ApplicationLimitActionType,
	target: string,
};

export type ApplicationLimitDto = {
	limit: ApplicationLimit,
	transition?: ApplicationLimitTransition,
	actions: ApplicationLimitAction[],
};

export type ApplicationLimitVariant = 'transition' | 'active';

export type ApplicationLimitPresentation = {
	variant: ApplicationLimitVariant,
	count: number,
	limit: number,
	transitionEndAt: number | null,
};

export function resolveApplicationLimitPresentation(
	dto: ApplicationLimitDto | null | undefined,
): ApplicationLimitPresentation | null
{
	const count = dto?.limit?.count;
	const actions = getApplicationLimitActions(dto);
	const hasRequiredActions = (
		actions.some((action) => action.type === 'list')
		&& actions.some((action) => action.type === 'buy')
	);
	if (!Type.isInteger(count) || count < 0 || !hasRequiredActions)
	{
		return null;
	}

	const configuredLimit = dto?.limit?.configuredLimit;
	const transitionEndAt = dto?.transition?.endsAt;
	if (
		dto?.transition?.active === true
		&& dto.limit.state === 'unlimited'
		&& Type.isInteger(configuredLimit)
		&& configuredLimit >= 0
		&& count > configuredLimit
		&& Type.isInteger(transitionEndAt)
		&& transitionEndAt > 0
	)
	{
		return {
			variant: 'transition',
			count,
			limit: configuredLimit,
			transitionEndAt,
		};
	}

	const limit = dto?.limit?.limit;
	if (
		dto?.limit?.state === 'finite'
		&& dto.limit.exceeded === true
		&& Type.isInteger(limit)
		&& limit >= 0
		&& count > limit
	)
	{
		return {
			variant: 'active',
			count,
			limit,
			transitionEndAt: null,
		};
	}

	return null;
}

export function isApplicationLimitExceeded(
	dto: ApplicationLimitDto | null | undefined,
): dto is ApplicationLimitDto
{
	return resolveApplicationLimitPresentation(dto) !== null;
}

export function isApplicationInstallationBlocked(
	dto: ApplicationLimitDto | null | undefined,
): dto is ApplicationLimitDto
{
	const count = dto?.limit?.count;
	const limit = dto?.limit?.limit;

	return (
		dto?.limit?.state === 'finite'
		&& dto.limit.installationBlocked === true
		&& Type.isInteger(count)
		&& Type.isInteger(limit)
		&& count >= limit
		&& getApplicationLimitActions(dto).some((action) => action.type === 'list')
	);
}

export function getApplicationLimitActions(
	dto: ApplicationLimitDto | null | undefined,
): ApplicationLimitAction[]
{
	if (!Array.isArray(dto?.actions))
	{
		return [];
	}

	return dto.actions.filter((action) => {
		return (
			['list', 'trial', 'buy'].includes(action?.type)
			&& Type.isStringFilled(action.target)
		);
	});
}

export function createApplicationLimitPreviewAction(
	close: () => void,
): (action: ApplicationLimitAction) => void
{
	return () => close();
}
