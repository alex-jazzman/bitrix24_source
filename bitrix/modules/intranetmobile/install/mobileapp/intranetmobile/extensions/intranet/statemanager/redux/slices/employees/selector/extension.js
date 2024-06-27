/**
 * @module intranet/statemanager/redux/slices/employees/selector
 */
jn.define('intranet/statemanager/redux/slices/employees/selector', (require, exports, module) => {
	const { createDraftSafeSelector } = require('statemanager/redux/toolkit');
	const { sliceName, userListAdapter } = require('intranet/statemanager/redux/slices/employees/meta');
	const { selectById: selectMobileUserById } = require('statemanager/redux/slices/users/selector');
	const { EmployeeStatus, EmployeeActions } = require('intranet/enum');
	const { Moment } = require('utils/date');

	const {
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
	} = userListAdapter.getSelectors((state) => state[sliceName]);

	const selectWholeUserById = createDraftSafeSelector(
		(state, userId) => selectById(state, userId),
		selectMobileUserById,
		(intranetUser, mobileUser) => ({ ...mobileUser, ...intranetUser }),
	);

	const selectUserActions = createDraftSafeSelector(
		(user) => user.actions,
	);

	const selectCanUserBeReinvited = createDraftSafeSelector(
		selectById,
		({ lastInvitationTimestamp }) => (
			!Moment.createFromTimestamp((lastInvitationTimestamp ?? 0) / 1000).withinHour
		),
	);

	const selectActions = createDraftSafeSelector(
		(state, { currentUserId }) => selectWholeUserById(state, currentUserId),
		(state, { userId }) => selectWholeUserById(state, userId),
		(state, { userId }) => selectCanUserBeReinvited(state, userId),
		(currentUser, user, canUserBeReinvited) => ({
			[EmployeeActions.DELETE_INVITATION.getValue()]: user.employeeStatus === EmployeeStatus.INVITED.getValue(),
			[EmployeeActions.FIRE.getValue()]: (
				currentUser.id !== user.id
				&& currentUser.isAdmin
				&& user.employeeStatus === EmployeeStatus.ACTIVE.getValue()
			),
			[EmployeeActions.HIRE.getValue()]: (
				currentUser.id !== user.id
				&& currentUser.isAdmin
				&& user.employeeStatus === EmployeeStatus.FIRED.getValue()
			),
			[EmployeeActions.REINVITE.getValue()]: (
				currentUser.id !== user.id
				&& canUserBeReinvited
				&& currentUser.isAdmin
				&& user.employeeStatus === EmployeeStatus.INVITED.getValue()
			),
			[EmployeeActions.CHANGE_DEPARTMENT.getValue()]: (
				currentUser.isAdmin
				&& (
					user.employeeStatus === EmployeeStatus.INVITED.getValue()
					|| user.employeeStatus === EmployeeStatus.ACTIVE.getValue()
				)
			),
			[EmployeeActions.CONFIRM_USER_REQUEST.getValue()]: (
				currentUser.id !== user.id
				&& currentUser.isAdmin
				&& user.employeeStatus === EmployeeStatus.INVITE_AWAITING_APPROVE.getValue()
			),
			[EmployeeActions.DECLINE_USER_REQUEST.getValue()]: (
				currentUser.id !== user.id
				&& currentUser.isAdmin
				&& user.employeeStatus === EmployeeStatus.INVITE_AWAITING_APPROVE.getValue()
			),
		}),
	);

	module.exports = {
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,

		selectWholeUserById,
		selectUserActions,
		selectActions,
		selectCanUserBeReinvited,
	};
});
