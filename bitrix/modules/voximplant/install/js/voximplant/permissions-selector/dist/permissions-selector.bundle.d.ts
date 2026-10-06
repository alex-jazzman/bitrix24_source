/* eslint-disable */
type PermissionsSelectorOptions = {
	container: HTMLElement;
	ajaxUrl: string;
	sessid: string;
	providerNames: {
		[entityId: string]: string;
	};
	useStructureRoles: boolean;
};

declare namespace BX.Voximplant {
	class PermissionsSelector {
		constructor(options: PermissionsSelectorOptions);
	}
}
