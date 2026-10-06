/**
 * An onboarding is shown once per browser, and the mark of it survives a reload. Storage is not always
 * writable (private mode with storage blocked), and there the onboarding simply stays repeatable.
 */
export function isOnboardingDismissed(key: string): boolean
{
	try
	{
		return localStorage.getItem(key) === '1';
	}
	catch
	{
		return false;
	}
}

export function markOnboardingDismissed(key: string): void
{
	try
	{
		localStorage.setItem(key, '1');
	}
	catch
	{
		// localStorage is not available (e.g. private mode with storage blocked)
	}
}
