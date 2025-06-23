/* eslint-disable no-constructor-return */
import { chartAPI } from '../../org-chart/src/api';
import { useChartStore } from 'humanresources.company-structure.chart-store';
import { EntityTypes } from 'humanresources.company-structure.utils';

export const PermissionActions = Object.freeze({
	structureView: 'ACTION_STRUCTURE_VIEW',
	departmentCreate: 'ACTION_DEPARTMENT_CREATE',
	departmentDelete: 'ACTION_DEPARTMENT_DELETE',
	departmentEdit: 'ACTION_DEPARTMENT_EDIT',
	employeeAddToDepartment: 'ACTION_EMPLOYEE_ADD_TO_DEPARTMENT',
	employeeRemoveFromDepartment: 'ACTION_EMPLOYEE_REMOVE_FROM_DEPARTMENT',
	employeeFire: 'ACTION_FIRE_EMPLOYEE',
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
});

export const PermissionLevels = Object.freeze({
	fullCompany: 30,
	selfAndSub: 20,
	self: 10,
	none: 0,
});

export class PermissionCheckerClass
{
	constructor(): PermissionCheckerClass
	{
		if (!PermissionCheckerClass.instance)
		{
			this.currentUserPermissions = {};
			this.permissionVariablesDictionary = [];
			this.isTeamsAvailable = false;
			this.isInitialized = false;
			PermissionCheckerClass.instance = this;
		}

		return PermissionCheckerClass.instance;
	}

	getInstance(): PermissionCheckerClass
	{
		return PermissionCheckerClass.instance;
	}

	async init(): Promise<void>
	{
		if (this.isInitialized)
		{
			return;
		}

		const {
			currentUserPermissions,
			permissionVariablesDictionary,
			teamsAvailable,
		} = await chartAPI.getDictionary();

		this.currentUserPermissions = currentUserPermissions;
		this.permissionVariablesDictionary = permissionVariablesDictionary;
		this.isTeamsAvailable = teamsAvailable;

		this.isInitialized = true;
	}

	hasPermission(action: string, departmentId: number, minLevel: number = PermissionLevels.none): boolean
	{
		const permissionLevel = this.currentUserPermissions[action];

		if (!permissionLevel || departmentId === 0)
		{
			return false;
		}

		if (this.#isTeamAction(action))
		{
			if (!this.isTeamsAvailable)
			{
				return false;
			}

			return this.#hasPermissionOfTeamAction(permissionLevel, departmentId, action);
		}

		return this.#hasPermissionOfDepartmentAction(permissionLevel, departmentId, action, minLevel);
	}

	hasPermissionWithAnyNode(action: string): boolean
	{
		const permissionLevel = this.currentUserPermissions[action];

		if (!permissionLevel)
		{
			return false;
		}

		if (this.#isTeamAction(action))
		{
			if (!this.isTeamsAvailable)
			{
				return false;
			}

			return permissionLevel.TEAM > PermissionLevels.none || permissionLevel.DEPARTMENT > PermissionLevels.none;
		}

		return permissionLevel > PermissionLevels.none;
	}

	hasPermissionOfAction(action: string): boolean
	{
		if (this.#isTeamAction(action))
		{
			return this.hasPermissionWithAnyNode(action);
		}

		return this.currentUserPermissions[action] !== undefined
			&& this.currentUserPermissions[action] !== null
			&& this.currentUserPermissions[action] !== PermissionLevels.none
		;
	}

	#isTeamAction(action: string): boolean
	{
		const teamActions = [
			PermissionActions.teamView,
			PermissionActions.teamCreate,
			PermissionActions.teamEdit,
			PermissionActions.teamDelete,
			PermissionActions.teamAddMember,
			PermissionActions.teamRemoveMember,
			PermissionActions.teamSettingsEdit,
		];

		return teamActions.includes(action);
	}

	/**
	 *
	 * @param {{ TEAM: number, DEPARTMENT: number }} permissionValue
	 * @param nodeId
	 * @param action
	 * @returns {boolean}
	 */
	#hasPermissionOfTeamAction(permissionValue: Object, nodeId: number, action: string): boolean
	{
		if (permissionValue.TEAM === PermissionLevels.fullCompany)
		{
			const departments = useChartStore().departments;
			const currentNode = departments.get(nodeId);
			if (
				action === PermissionActions.teamCreate
				&& currentNode.entityType === EntityTypes.department
			)
			{
				return this.hasPermission(PermissionActions.structureView, currentNode.id);
			}

			return true;
		}

		if (this.#hasPermissionOfTeamActionByTeamPermission(nodeId, permissionValue.TEAM))
		{
			return true;
		}

		return this.#hasPermissionOfTeamActionByDepartmentPermission(nodeId, permissionValue.DEPARTMENT, action);
	}

	/**
	 *
	 * @param permissionLevel
	 * @param departmentId
	 * @param action
	 * @param minLevel
	 * @returns {boolean}
	 */
	#hasPermissionOfDepartmentAction(permissionLevel: Object, departmentId: number, action: string, minLevel: number): boolean
	{
		const permissionObject = this.permissionVariablesDictionary.find((item) => item.id === permissionLevel);

		if (!permissionObject)
		{
			return false;
		}

		const departments = useChartStore().departments;
		if (action === PermissionActions.departmentDelete)
		{
			const rootId = [...departments.values()].find((department) => department.parentId === 0).id;
			if (departmentId === rootId)
			{
				return false;
			}
		}

		const userDepartments = useChartStore().currentDepartments;

		if (permissionObject.id < minLevel)
		{
			return false;
		}

		switch (permissionObject.id)
		{
			case PermissionLevels.fullCompany:
				return true;

			case PermissionLevels.selfAndSub:
			{
				if (userDepartments.includes(departmentId))
				{
					return true;
				}

				let currentDepartment = departments.get(departmentId);
				while (currentDepartment)
				{
					if (userDepartments.includes(currentDepartment.id))
					{
						return true;
					}

					currentDepartment = departments.get(currentDepartment.parentId);
				}

				return false;
			}
			case PermissionLevels.self:
				return userDepartments.includes(departmentId);

			case PermissionLevels.none:
			default:
				return false;
		}
	}

	#hasPermissionOfTeamActionByTeamPermission(nodeId: number, level: number = PermissionLevels.none): boolean
	{
		if (level === PermissionLevels.none)
		{
			return false;
		}

		const userDepartments = useChartStore().currentDepartments;
		if (userDepartments.includes(nodeId))
		{
			return true;
		}

		if (level === PermissionLevels.self)
		{
			return false;
		}

		const nodes = useChartStore().departments;
		let currentDepartment = nodes.get(nodeId);
		while (currentDepartment)
		{
			if (currentDepartment.entityType === EntityTypes.department)
			{
				return false;
			}

			if (userDepartments.includes(currentDepartment.id))
			{
				return true;
			}

			currentDepartment = nodes.get(currentDepartment.parentId);
		}

		return false;
	}

	#hasPermissionOfTeamActionByDepartmentPermission(nodeId: number, level: number = PermissionLevels.none, action: string = ''): boolean
	{
		if (level === PermissionLevels.none)
		{
			return false;
		}

		const userDepartments = useChartStore().currentDepartments;
		if (userDepartments.includes(nodeId))
		{
			return true;
		}

		const nodes = useChartStore().departments;
		let currentDepartment = nodes.get(nodeId);
		while (currentDepartment)
		{
			if (userDepartments.includes(currentDepartment.id))
			{
				return true;
			}

			if (level === PermissionLevels.self && currentDepartment.type === EntityTypes.department)
			{
				if (action === PermissionActions.teamCreate)
				{
					return this.hasPermission(PermissionActions.structureView, currentDepartment.id)
						&& userDepartments.includes(currentDepartment.id)
					;
				}

				return false;
			}

			currentDepartment = nodes.get(currentDepartment.parentId);
		}

		return false;
	}
}

export const PermissionChecker = new PermissionCheckerClass();
