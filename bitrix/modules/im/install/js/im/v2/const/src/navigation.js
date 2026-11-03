import { Layout } from './layout';

export const NavigationMenuItem = Object.freeze({
	messenger: 'messenger',
	[Layout.chat]: Layout.chat,
	[Layout.copilot]: Layout.copilot,
	[Layout.collab]: Layout.collab,
	[Layout.channel]: Layout.channel,
	[Layout.openlines]: Layout.openlines,
	[Layout.openlinesV2]: Layout.openlinesV2,
	[Layout.notification]: Layout.notification,
	[Layout.market]: Layout.market,
	[Layout.settings]: Layout.settings,
	[Layout.taskComments]: Layout.taskComments,
	[Layout.vibecodeApp]: Layout.vibecodeApp,
	call: 'call',
	timemanager: 'timemanager',
	homepage: 'homepage',
});

export type NavigationMenuItemType = $Values<typeof NavigationMenuItem>;
