/* eslint-disable */
type NavigationWindow = EventTarget & Pick<Window, 'document'> & {
	location: Pick<Location, 'origin' | 'pathname' | 'assign'>;
};

declare namespace BX.Crm.Config.Bp {
	function bindSettingsHubNavigation(targetWindow?: NavigationWindow): void;
}
