/**
 * @module intranet/simple-list/items/user-redux/action-menu
 */
jn.define('intranet/simple-list/items/user-redux/action-menu', (require, exports, module) => {
	const { Loc } = require('loc');
	const store = require('statemanager/redux/store');
	const { selectWholeUserById } = require('intranet/statemanager/redux/slices/employees/selector');
	const { EmployeeActions } = require('intranet/enum');
	const { selectActions } = require('intranet/statemanager/redux/slices/employees/selector');
	const { Actions } = require('intranet/simple-list/items/user-redux/actions');
	const { Icon } = require('assets/icons');

	/**
	 * @class ActionMenu
	 */
	class ActionMenu
	{
		constructor({ userId })
		{
			this.user = selectWholeUserById(store.getState(), userId);

			const actionsByState = selectActions(store.getState(), { userId: this.user.id, currentUserId: env.userId });
			this.actions = Object.values(this.getActions())
				.filter((action) => actionsByState[action.id])
				.sort((a, b) => Math.sign(a.sort - b.sort));
		}

		show(target)
		{
			void new UI.Menu(Object.values(this.actions)).show({ target });
		}

		hasActions()
		{
			return this.actions.length > 0;
		}

		getActions()
		{
			return {
				[EmployeeActions.DELETE_INVITATION.getValue()]: {
					id: EmployeeActions.DELETE_INVITATION.getValue(),
					title: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_DELETE_INVITATION'),
					sectionCode: 'delete',
					iconName: Icon.TRASHCAN,
					isDestructive: true,
					onItemSelected: () => Actions.list[EmployeeActions.DELETE_INVITATION.getValue()]({ userId: this.user.id }),
					sort: 700,
				},
				[EmployeeActions.FIRE.getValue()]: {
					id: EmployeeActions.FIRE.getValue(),
					title: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_FIRE'),
					sectionCode: 'delete',
					iconName: Icon.TRASHCAN,
					isDestructive: true,
					onItemSelected: () => Actions.list[EmployeeActions.FIRE.getValue()]({ userId: this.user.id }),
					sort: 500,
				},
				[EmployeeActions.HIRE.getValue()]: {
					id: EmployeeActions.HIRE.getValue(),
					title: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_HIRE'),
					sectionCode: 'general',
					iconName: Icon.CHECK,
					onItemSelected: () => Actions.list[EmployeeActions.HIRE.getValue()]({ userId: this.user.id }),
				},
				[EmployeeActions.REINVITE.getValue()]: {
					id: EmployeeActions.REINVITE.getValue(),
					title: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_REINVITE'),
					sectionCode: 'general',
					iconName: Icon.REFRESH,
					onItemSelected: () => Actions.list[EmployeeActions.REINVITE.getValue()]({ userId: this.user.id }),
					sort: 100,
				},
				[EmployeeActions.CHANGE_DEPARTMENT.getValue()]: {
					id: EmployeeActions.CHANGE_DEPARTMENT.getValue(),
					title: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_CHANGE_DEPARTMENT'),
					sectionCode: 'general',
					iconName: Icon.THREE_PERSONS,
					onItemSelected: () => Actions.list[EmployeeActions.CHANGE_DEPARTMENT.getValue()]({ userId: this.user.id }),
					sort: 400,
				},
				[EmployeeActions.CONFIRM_USER_REQUEST.getValue()]: {
					id: EmployeeActions.CONFIRM_USER_REQUEST.getValue(),
					title: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_CONFIRM_USER_REQUEST'),
					sectionCode: 'general',
					iconName: Icon.CHECK,
					onItemSelected: () => Actions.list[EmployeeActions.CONFIRM_USER_REQUEST.getValue()]({ userId: this.user.id }),
					sort: 200,
				},
				[EmployeeActions.DECLINE_USER_REQUEST.getValue()]: {
					id: EmployeeActions.DECLINE_USER_REQUEST.getValue(),
					title: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_DECLINE_USER_REQUEST'),
					sectionCode: 'general',
					iconName: Icon.CROSS,
					onItemSelected: () => Actions.list[EmployeeActions.DECLINE_USER_REQUEST.getValue()]({ userId: this.user.id }),
					sort: 300,
				},
				// [EmployeeActions.APPOINT_ADMIN.getValue()]: {
				// 	id: EmployeeActions.APPOINT_ADMIN.getValue(),
				// 	title: Loc.getMessage('MOBILE_USERS_USER_ACTIONS_APPOINT_ADMIN'),
				// 	sectionCode: 'general',
				// 	iconUrl: `${imagePrefix}lock.svg`,
				// 	onItemSelected: () => Actions.list[EmployeeActions.APPOINT_ADMIN.getValue()](),
				// 	sort: 600,
				// },
			};
		}
	}

	module.exports = { ActionMenu };
});
