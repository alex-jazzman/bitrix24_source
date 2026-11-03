import { canShowVibe } from '../vibe-state/vibe-state';

// How the hub puts the home page card on screen. app.ts imports Vue and the kit, which the template unit harness does
// not load, so the decisions it takes about the card live here.

export const VIBE_CARD_ID = 'vibe';

export type VibeCardState = {
	automatedSolution: {
		id: number | null,
		isVibeEnabled: boolean,
		vibeId: number,
	},
	isVibeFeatureEnabled: boolean,
	isVibeAvailable: boolean,
};

// A hidden section leaves no card behind: no header, no placeholder and no settings request.
export function isVibeCardShown(state: VibeCardState, readOnly: boolean): boolean
{
	return canShowVibe({
		featureEnabled: state.isVibeFeatureEnabled,
		available: state.isVibeAvailable,
		readOnly,
	});
}

// The keys of the hub snapshot the section control reads: the draft switch, the page and its availability.
export function buildVibeSnapshot(state: VibeCardState, isSettingsPending: boolean): Record<string, unknown>
{
	return {
		automatedSolutionId: state.automatedSolution.id,
		isVibeEnabled: state.automatedSolution.isVibeEnabled,
		vibeId: state.automatedSolution.vibeId,
		isVibeFeatureEnabled: state.isVibeFeatureEnabled,
		isVibeAvailable: state.isVibeAvailable,
		isVibeSettingsPending: isSettingsPending,
	};
}

// A save that creates the page: the switch of a shown section is on and the page does not exist yet. The settings of
// such a page appear only after the reload that follows the save.
export function isPageCreatingSave(state: VibeCardState, readOnly: boolean): boolean
{
	return isVibeCardShown(state, readOnly)
		&& state.automatedSolution.isVibeEnabled
		&& state.automatedSolution.vibeId <= 0
	;
}

type SaveReport = {
	setWaiting: (waiting: boolean) => void,
	reportFailure: () => void,
};

// The skeleton of a save that creates the page stays until the reload that follows the save: the mark is set when such
// a save starts and dropped only by its failure.
export function trackPageCreatingSave<T extends SaveReport>(
	deps: T,
	isPageCreating: () => boolean,
	setPending: (pending: boolean) => void,
): T
{
	return {
		...deps,
		setWaiting: (waiting: boolean): void => {
			if (waiting)
			{
				setPending(isPageCreating());
			}

			deps.setWaiting(waiting);
		},
		reportFailure: (): void => {
			setPending(false);
			deps.reportFailure();
		},
	};
}

// The creation screen keeps the sections dead until the solution exists, except the home page one: the page is
// switched on right in the creation form.
export function isCardLockedOnCreate(cardId: string, isCreateMode: boolean): boolean
{
	return isCreateMode && cardId !== VIBE_CARD_ID;
}
