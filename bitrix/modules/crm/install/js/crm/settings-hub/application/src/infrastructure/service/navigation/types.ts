import {
	type HydratedSettingsPresentation,
	type SettingPresentation,
} from '../settings/types';

export type NavigationTarget =
	| Readonly<{ available: false }>
	| Readonly<{ available: true, url: string }>;

export type NavigationTargets = Readonly<Record<string, NavigationTarget>>;

export type SettingsHubBootstrap = Readonly<{
	settings: readonly SettingPresentation[],
	navigation: NavigationTargets,
}>;

export type HydratedSettingsHubBootstrap = Readonly<{
	settings: HydratedSettingsPresentation,
	navigation: NavigationTargets,
}>;
