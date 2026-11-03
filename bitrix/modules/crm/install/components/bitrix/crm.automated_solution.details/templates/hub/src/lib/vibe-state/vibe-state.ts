export type VibeVisibility = {
	featureEnabled: boolean,
	available: boolean,
	readOnly: boolean,
};

// The only visibility rule of the home page section. isVibeEnabled is not part of it: a solution with the page off
// still shows the switch.
export function canShowVibe({ featureEnabled, available, readOnly }: VibeVisibility): boolean
{
	return featureEnabled === true && available === true && readOnly !== true;
}
