/* eslint-disable */
type PermissionConfigOptions = ConstructorParameters<typeof BX.UI.AccessRights.V2.App>[0];

declare namespace BX.Bizproc {
	class ConfigPermissions {
		constructor(options: PermissionConfigOptions);
		draw(): BX.UI.AccessRights.V2.App;
	}
}
