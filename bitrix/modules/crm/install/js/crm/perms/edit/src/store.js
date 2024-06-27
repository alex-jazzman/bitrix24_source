import getters from './store/getters';
import mutations from './store/mutations';
import actions from './store/actions';

export const MAX_SORT_ORDER_ON_THE_DESK = 7;

export interface PermissionEntityIdentifier {
	permissionCode: string;
	entityCode: string;
	stageField: ?string;
	stageCode: ?string;
}

export interface AssignAttributeParam {
	identifier: PermissionEntityIdentifier,
	value: string
}

export interface Permissions {
	code: string;
	name: string;
	sortOrder: number;
	canAssignPermissionToStages: boolean;
}

function initState()
{
	return {
		ui: {
			expandedStageEntities: {},
			isSaveInProgress: false,
			lastErrorMessage: '',
		},
		roleAssignedPermissions: {},
		restriction: {
			hasPermission: null,
			restrictionScript: '',
		},
		role: {
			id: 0,
			name: '',
		},
		desk: {
			availablePermissions: [],
			permissionEntities: [],
			availablePermissionsOrders: {},
		},
		touched: {
			originalAttributes: {},
			touchedAttributes: {},
		},
	};
}

export default () => {
	return {
		state: initState(),
		getters,
		mutations,
		actions,
	};
};
