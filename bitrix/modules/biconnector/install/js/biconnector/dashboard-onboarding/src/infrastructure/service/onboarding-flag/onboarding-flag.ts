import { ajax } from 'main.core';

import { FlagAction } from '../../../const';

/**
 * Writes the per-user onboarding flags on the server: the portal keeps no local copy of
 * them, so a failed call just means the hint may appear once more.
 */
class OnboardingFlagService
{
	completeTour(): Promise<void>
	{
		return this.#send(FlagAction.CompleteTour);
	}

	dismissEmptyDashboardCta(): Promise<void>
	{
		return this.#send(FlagAction.DismissEmptyDashboardCta);
	}

	#send(action: string): Promise<void>
	{
		return ajax.runAction(action, { data: {} }).catch(() => {});
	}
}

export const onboardingFlagService = new OnboardingFlagService();
