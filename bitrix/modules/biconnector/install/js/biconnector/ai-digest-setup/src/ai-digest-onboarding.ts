import { Onboarding, type AiDigestOnboardingOptions } from './onboarding';

export class AiDigestOnboarding
{
	static #onboarding = new Onboarding();

	static enqueue(options: AiDigestOnboardingOptions): void
	{
		AiDigestOnboarding.#onboarding.enqueue(options);
	}
}
