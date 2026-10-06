export type LegacySubmitPreparationState = 'ready' | 'pending' | 'restored' | 'error';

export type LegacySubmitPreparationHandler = {
	showSubmitPending(): void,
	showLinkRestored(): void,
	showLinkMissing(): void,
};

export function handleLegacySubmitPreparation(
	state: LegacySubmitPreparationState,
	handler: LegacySubmitPreparationHandler,
): boolean
{
	if (state === 'ready')
	{
		return true;
	}

	if (state === 'pending')
	{
		handler.showSubmitPending();
	}
	else if (state === 'restored')
	{
		handler.showLinkRestored();
	}
	else
	{
		handler.showLinkMissing();
	}

	return false;
}
