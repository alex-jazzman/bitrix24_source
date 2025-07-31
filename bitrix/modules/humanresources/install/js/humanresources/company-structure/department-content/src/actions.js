import { useChartStore } from 'humanresources.company-structure.chart-store';
import { getMemberRoles } from 'humanresources.company-structure.api';
import { Type } from 'main.core';
import type { ChatOrChannelDetailed } from 'humanresources.company-structure.utils';

export const DepartmentContentActions = {
	moveUserToDepartment: (departmentId, userId, targetDepartmentId, role): void => {
		const store = useChartStore();
		const department = store.departments.get(departmentId);
		const targetDepartment = store.departments.get(targetDepartmentId);

		if (!department || !targetDepartment)
		{
			return;
		}

		const oldMemberRoles = getMemberRoles(department.entityType);
		const targetMemberRoles = getMemberRoles(targetDepartment.entityType);
		const user = role === oldMemberRoles.employee
			? department.employees?.find((employee) => employee.id === userId)
			: department.heads.find((head) => head.id === userId)
		;
		if (!user)
		{
			return;
		}

		department.userCount -= 1;
		if (role === oldMemberRoles.employee)
		{
			department.employees = department.employees.filter((employee) => employee.id !== userId);
		}
		else
		{
			department.heads = department.heads.filter((head) => head.id !== userId);
		}

		targetDepartment.userCount += 1;
		if (userId === store.userId)
		{
			store.changeCurrentDepartment(departmentId, targetDepartmentId);
		}

		user.role = targetMemberRoles.employee;
		if (!targetDepartment.employees)
		{
			return;
		}
		targetDepartment.employees.push(user);
	},
	removeUserFromDepartment: (departmentId, userId, role): void => {
		const store = useChartStore();
		const department = store.departments.get(departmentId);
		const oldMemberRoles = getMemberRoles(department.entityType);
		if (!department)
		{
			return;
		}

		if (userId === store.userId)
		{
			store.changeCurrentDepartment(departmentId);
		}

		department.userCount -= 1;
		if (role === oldMemberRoles.employee)
		{
			department.employees = department.employees.filter((employee) => employee.id !== userId);

			return;
		}

		department.heads = department.heads.filter((head) => head.id !== userId);
	},
	updateEmployees: (departmentId: number, employees: Array): void => {
		const { departments } = useChartStore();
		const department = departments.get(departmentId);

		if (!department)
		{
			return;
		}

		departments.set(departmentId, { ...department, employees });
	},
	updateEmployeeListOptions: (
		departmentId: number,
		options: { page?: number, shouldUpdateList?: boolean, isListUpdated?: boolean },
	): void => {
		const { departments } = useChartStore();
		const department = departments.get(departmentId);

		if (!department)
		{
			return;
		}

		department.employeeListOptions = {
			...department.employeeListOptions,
			...options,
		};

		departments.set(departmentId, department);
	},
	setChatsAndChannels: (
		nodeId: number,
		chats: Array<ChatOrChannelDetailed>,
		channels: Array<ChatOrChannelDetailed>,
	): void => {
		const store = useChartStore();
		const department = store.departments.get(nodeId);
		if (!department)
		{
			return;
		}

		department.channelsDetailed = channels;
		department.chatsDetailed = chats;
		department.chatAndChannelsCount = (chats.length + channels.length);
	},
	removeUserFromAllDepartments: async (userId): Promise<void> => {
		const store = useChartStore();
		const departments = store.departments;
		const departmentsToUpdate = [];

		for (const [key, department] of departments)
		{
			if (
				(
					'heads' in department
					&& Type.isArray(department.heads)
					&& department.heads.some((employee) => employee.id === userId)
				)
				|| (
					'employees' in department
					&& Type.isArray(department.employees)
					&& department.employees.some((employee) => employee.id === userId)
				)
			)
			{
				departmentsToUpdate.push(key);
			}
		}

		return store.refreshDepartments(departmentsToUpdate);
	},
	unbindChatFromNode: (nodeId: number, chatId: number): void => {
		const store = useChartStore();
		const department = store.departments.get(nodeId);
		if (!department)
		{
			return;
		}

		department.channelsDetailed = department.channelsDetailed.filter((chat) => chat.id !== chatId);
		department.chatsDetailed = department.chatsDetailed.filter((chat) => chat.id !== chatId);
		department.chatAndChannelsCount--;
	},
};
