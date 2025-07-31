export const PermissionActions = Object.freeze({
	structureView: 'ACTION_STRUCTURE_VIEW',
	departmentCreate: 'ACTION_DEPARTMENT_CREATE',
	departmentDelete: 'ACTION_DEPARTMENT_DELETE',
	departmentEdit: 'ACTION_DEPARTMENT_EDIT',
	employeeAddToDepartment: 'ACTION_EMPLOYEE_ADD_TO_DEPARTMENT',
	employeeRemoveFromDepartment: 'ACTION_EMPLOYEE_REMOVE_FROM_DEPARTMENT',
	employeeFire: 'ACTION_FIRE_EMPLOYEE',
	departmentCommunicationEdit: 'ACTION_DEPARTMENT_COMMUNICATION_EDIT',
	accessEdit: 'ACTION_USERS_ACCESS_EDIT',
	teamAccessEdit: 'ACTION_TEAM_ACCESS_EDIT',
	inviteToDepartment: 'ACTION_USER_INVITE',
	teamView: 'ACTION_TEAM_VIEW',
	teamCreate: 'ACTION_TEAM_CREATE',
	teamEdit: 'ACTION_TEAM_EDIT',
	teamDelete: 'ACTION_TEAM_DELETE',
	teamAddMember: 'ACTION_TEAM_MEMBER_ADD',
	teamRemoveMember: 'ACTION_TEAM_MEMBER_REMOVE',
	teamSettingsEdit: 'ACTION_TEAM_SETTINGS_EDIT',
	teamCommunicationEdit: 'ACTION_TEAM_COMMUNICATION_EDIT',
});

export const PermissionLevels = Object.freeze({
	fullCompany: 30,
	selfAndSub: 20,
	self: 10,
	none: 0,
});
