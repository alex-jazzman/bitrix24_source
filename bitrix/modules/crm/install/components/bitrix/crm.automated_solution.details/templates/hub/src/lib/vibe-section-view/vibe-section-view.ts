import { VibeWidgetStatus, type VibeWidgetStatusValue } from '../../const/vibe-widget-status';
import { canShowVibe } from '../vibe-state/vibe-state';

// The decisions of the home page section control. The control itself imports the kit, Vue and ui.a11y, which the
// template unit harness does not load, so everything it decides lives here.

export const VIBE_SWITCH_ID = 'crm-vibe';

export const VibeMessage = {
	Switch: 'CRM_AUTOMATED_SOLUTION_DETAILS_ENABLE_VIBE',
	Loading: 'CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_LOADING',
	Loaded: 'CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_LOADED',
	Empty: 'CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_EMPTY',
	LoadError: 'CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_LOAD_ERROR',
} as const;

export type VibeSectionState = {
	visible: boolean,
	enabled: boolean,
	vibeId: number,
	saving: boolean,
	solutionId: number | null,
};

export type VibeSwitch = {
	featureId: string,
	title: string,
	checked: boolean,
	disabled: boolean,
};

export type VibeWidgetView = {
	isShown: boolean,
	isBusy: boolean,
	showSkeleton: boolean,
	showEmpty: boolean,
	showError: boolean,
	showSettings: boolean,
};

export type VibeAnnouncement = {
	code: string,
	politeness: 'polite' | 'assertive',
};

// The section reads the draft of the form from the hub snapshot: the switch shows what the next save sends.
export function readVibeSection(snapshot: Record<string, unknown>, readOnly: boolean): VibeSectionState
{
	return {
		visible: canShowVibe({
			featureEnabled: snapshot.isVibeFeatureEnabled === true,
			available: snapshot.isVibeAvailable === true,
			readOnly,
		}),
		enabled: snapshot.isVibeEnabled === true,
		vibeId: toPositiveInteger(snapshot.vibeId) ?? 0,
		saving: snapshot.isVibeSettingsPending === true,
		solutionId: toPositiveInteger(snapshot.automatedSolutionId),
	};
}

export function buildVibeSwitch(section: VibeSectionState, disabled: boolean): VibeSwitch
{
	return {
		featureId: VIBE_SWITCH_ID,
		title: VibeMessage.Switch,
		checked: section.enabled,
		disabled,
	};
}

// The section as it is right after a toggle, before the store has taken it: switching off hides the widget at once.
export function resolveVibeToggle(section: VibeSectionState, checked: boolean): VibeSectionState
{
	return { ...section, enabled: checked };
}

export function resolveWidgetView(status: VibeWidgetStatusValue): VibeWidgetView
{
	const showSkeleton = status === VibeWidgetStatus.Pending || status === VibeWidgetStatus.Loading;

	return {
		isShown: status !== VibeWidgetStatus.Hidden,
		isBusy: showSkeleton,
		showSkeleton,
		showEmpty: status === VibeWidgetStatus.Empty,
		showError: status === VibeWidgetStatus.Error,
		showSettings: status === VibeWidgetStatus.Ready,
	};
}

const ANNOUNCEMENTS: Partial<Record<VibeWidgetStatusValue, VibeAnnouncement>> = {
	[VibeWidgetStatus.Loading]: { code: VibeMessage.Loading, politeness: 'polite' },
	[VibeWidgetStatus.Ready]: { code: VibeMessage.Loaded, politeness: 'polite' },
	[VibeWidgetStatus.Empty]: { code: VibeMessage.Empty, politeness: 'polite' },
	[VibeWidgetStatus.Error]: { code: VibeMessage.LoadError, politeness: 'assertive' },
};

// The skeleton of the first save is not announced: the save itself is what the user waits for.
export function resolveWidgetAnnouncement(status: VibeWidgetStatusValue): VibeAnnouncement | null
{
	const announcement = ANNOUNCEMENTS[status];

	return announcement ? { ...announcement } : null;
}

function toPositiveInteger(value: unknown): number | null
{
	const number = Number(value);

	return Number.isInteger(number) && number > 0 ? number : null;
}
