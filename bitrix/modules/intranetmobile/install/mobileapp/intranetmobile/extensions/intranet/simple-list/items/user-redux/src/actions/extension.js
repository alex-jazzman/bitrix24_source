/**
 * @module intranet/simple-list/items/user-redux/src/actions
 */
jn.define('intranet/simple-list/items/user-redux/src/actions', (require, exports, module) => {
	const { Color } = require('tokens');
	const { confirmDestructiveAction, confirmDefaultAction } = require('alert');
	const { dispatch } = require('statemanager/redux/store');
	const {
		deleteInvitation,
		fireEmployee,
		hireEmployee,
		reinvite,
		reinviteWithChangeContact,
		confirmUserRequest,
		changeDepartment,
	} = require('intranet/statemanager/redux/slices/employees/thunk');
	const { DepartmentSelector } = require('selector/widget/entity/intranet/department');
	const { EmployeeActions } = require('intranet/enum');
	const { isRequestAdminFireEnabled } = require('intranet/simple-list/items/user-redux/src/actions/src/utils');
	const { Loc } = require('loc');
	const { selectById } = require('intranet/statemanager/redux/slices/employees/selector');
	const store = require('statemanager/redux/store');

	/**
	 * @class Actions
	 */
	class Actions
	{
		static get list()
		{
			const handleUserRequest = (userId, isAccept) => {
				dispatch(
					confirmUserRequest({
						userId,
						isAccept,
					}),
				);
			};

			return {
				[EmployeeActions.DELETE_INVITATION.getValue()]: ({ userId }) => {
					confirmDestructiveAction({
						title: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_DELETE_INVITATION_TITLE'),
						description: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_DELETE_INVITATION_DESCRIPTION'),
						destructionText: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_DELETE_INVITATION_ACCEPT'),
						onDestruct: () => {
							dispatch(
								deleteInvitation({
									userId,
								}),
							);
						},
					});
				},
				[EmployeeActions.FIRE.getValue()]: ({ userId, isRootAdmin, fullName }, title) => {
					confirmDestructiveAction({
						title: title || Loc.getMessage('MOBILE_USERS_USER_ACTIONS_FIRE_TITLE'),
						description: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_FIRE_DESCRIPTION'),
						destructionText: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_FIRE_ACCEPT'),
						onDestruct: async () => {
							const fireAdminRequestEnabled = await isRequestAdminFireEnabled();
							if (isRootAdmin && fireAdminRequestEnabled)
							{
								const { RequestAdminFireConfirmation } = await requireLazy('intranet:fire-admin');
								if (RequestAdminFireConfirmation)
								{
									RequestAdminFireConfirmation.open({
										currentAdminId: userId,
										currentAdminFullName: fullName,
										initiatorId: Number(env.userId),
									});
								}

								return;
							}

							dispatch(
								fireEmployee({
									userId,
								}),
							);
						},
					});
				},
				[EmployeeActions.HIRE.getValue()]: ({ userId }) => {
					dispatch(
						hireEmployee({
							userId,
						}),
					);
				},
				[EmployeeActions.REINVITE.getValue()]: ({ userId }) => {
					dispatch(
						reinvite({
							userId,
						}),
					);
				},
				[EmployeeActions.REINVITE_WITH_CHANGE_CONTACT.getValue()]: ({ userId, email, phone }) => {
					dispatch(
						reinviteWithChangeContact({
							userId,
							email,
							phone,
						}),
					);
				},
				[EmployeeActions.CONFIRM_USER_REQUEST.getValue()]: ({ userId }) => {
					confirmDefaultAction({
						title: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_CONFIRM_USER_REQUEST_TITLE'),
						description: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_CONFIRM_USER_REQUEST_DESCRIPTION'),
						actionButtonText: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_CONFIRM_USER_REQUEST_ACCEPT'),
						onAction: () => handleUserRequest(userId, true),
					});
				},
				[EmployeeActions.DECLINE_USER_REQUEST.getValue()]: ({ userId }) => {
					confirmDestructiveAction({
						title: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_DECLINE_USER_REQUEST_TITLE'),
						description: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_DECLINE_USER_REQUEST_DESCRIPTION'),
						destructionText: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_DECLINE_USER_REQUEST_ACCEPT'),
						onDestruct: () => handleUserRequest(userId, false),
					});
				},
				[EmployeeActions.CHANGE_DEPARTMENT.getValue()]: ({ userId }) => {
					const { department } = selectById(store.getState(), userId) || {};
					const departmentIds = Object.keys(department)?.map((id) => Number(id));
					const selector = DepartmentSelector.make({
						initSelectedIds: departmentIds || null,
						widgetParams: {
							backdrop: {
								mediumPositionPercent: 70,
								horizontalSwipeAllowed: false,
							},
						},
						allowMultipleSelection: true,
						closeOnSelect: true,
						events: {
							onClose: (departments) => {
								const preparedDepartments = {};
								departments.forEach(({ id, title }) => {
									preparedDepartments[id] = title;
								});

								dispatch(
									changeDepartment({
										userId,
										departments: preparedDepartments,
									}),
								);
							},
						},
						selectOptions: {
							canUnselectLast: false,
						},
					});

					selector.show({}, layout);
				},
			};
		}

		static getToastParams()
		{
			return {
				backgroundColor: Color.bgContentInapp.toHex(),
				messageTextColor: Color.baseWhiteFixed.toHex(),
				textSize: 14,
				time: 1,
			};
		}
	}

	module.exports = { Actions };
});
