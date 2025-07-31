import { Type } from 'main.core';
import { defineStore } from 'ui.vue3.pinia';
import { getData } from 'humanresources.company-structure.api';
import {
	EntityTypes,
	WizardApiEntityChangedDict,
	NodeSettingsTypes,
	type ChatOrChannelDetailed,
	type UserData,
	type NodeColorSettingsType,
} from 'humanresources.company-structure.utils';

export type DepartmentData = {
	id: number;
	name: string;
	description: string;
	parentId: number;
	heads: Array<UserData>;
	employees: Array<UserData>;
	userCount: number;
	chats: Array<number>,
	chatsDetailed: Array<ChatOrChannelDetailed>,
	channels: Array<number>,
	channelsDetailed: Array<ChatOrChannelDetailed>,
	createDefaultChat: boolean,
	createDefaultChannel: boolean,
	teamColor: NodeColorSettingsType,
	settings: {
		[NodeSettingsTypes.businessProcAuthority]: Set,
		[NodeSettingsTypes.reportsAuthority]: Set,
	},
	entityType: EntityTypes.department | EntityTypes.team | EntityTypes.company,
	apiEntityChanged: WizardApiEntityChangedDict.department | WizardApiEntityChangedDict.employees,
};

export const useChartStore = defineStore('hr-org-chart', {
	state: () => ({
		departments: new Map(),
		currentDepartments: [],
		focusedNode: 0,
		searchedUserId: 0,
		userId: 0,
	}),
	actions: {
		async refreshDepartments(nodeIds: number[]): Promise<void>
		{
			if (nodeIds.length === 0)
			{
				return;
			}

			const [departments, currentDepartments] = await Promise.all([
				getData('humanresources.api.Structure.Node.getByIds', { nodeIds }),
				getData('humanresources.api.Structure.Node.current'),
			]);
			this.currentDepartments = currentDepartments;
			Object.keys(departments).forEach((id) => {
				const department = departments[id];
				const existingDepartment = this.departments.get(Number(id)) || {};
				this.departments.set(Number(id), {
					...existingDepartment,
					heads: department.heads,
					userCount: department.userCount,
					employees: null,
					employeeListOptions: {
						page: 0,
						shouldUpdateList: true,
						isListUpdated: false,
					},
				});
			});
		},
		changeCurrentDepartment(oldDepartmentId: number, newDepartmentId: ?number): void
		{
			const currentDepartments = this.currentDepartments.filter((departmentId) => {
				return departmentId !== oldDepartmentId && departmentId !== newDepartmentId;
			});

			if (!newDepartmentId)
			{
				this.currentDepartments = currentDepartments;

				return;
			}

			this.currentDepartments = [
				...currentDepartments,
				newDepartmentId,
			];
		},
		async loadHeads(nodeIds: number[]): Promise<void>
		{
			if (nodeIds.length === 0)
			{
				return;
			}

			const heads = await getData('humanresources.api.Structure.Node.getHeadsByIds', { nodeIds });
			nodeIds.forEach((departmentId) => {
				const department = this.departments.get(departmentId);
				if (heads[departmentId])
				{
					this.departments.set(departmentId, { ...department, heads: heads[departmentId] });
				}
			});
		},
		updateDepartment(departmentData: DepartmentData, position: ?number): void
		{
			const { id, parentId } = departmentData;
			const oldData = this.departments.get(id);
			const prevParent = this.departments.get(oldData.parentId);
			this.departments.set(id, { ...oldData, ...departmentData });
			if (parentId !== 0 && prevParent.id !== parentId)
			{
				prevParent.children = prevParent.children.filter((childId) => childId !== id);
				const newParent = this.departments.get(parentId);
				newParent.children = newParent.children ?? [];
				if (Type.isNumber(position))
				{
					newParent.children.splice(position, 0, id);
				}
				else
				{
					newParent.children.push(id);
				}

				this.departments.set(id, { ...this.departments.get(id), prevParentId: prevParent.id });
			}
		},
	},
});
