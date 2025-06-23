import { postData } from 'humanresources.company-structure.api';
import { DepartmentUserIds } from './types';

export const WizardAPI = {
	addDepartment: (
		name: string,
		parentId: number,
		description: ?string,
		entityType: ?string,
		colorName: ?string,
	): Promise<void> => {
		return postData('humanresources.api.Structure.Node.add', {
			name,
			parentId,
			description,
			entityType,
			colorName,
		});
	},
	getEmployees: (nodeId: number): Promise<Array<number>> => {
		return postData('humanresources.api.Structure.Node.Member.Employee.getIds', { nodeId });
	},
	updateDepartment: (
		nodeId: number,
		parentId: number,
		name: string,
		description: ?string,
		colorName: ?string,
	): Promise<void> => {
		return postData('humanresources.api.Structure.Node.update', {
			nodeId,
			name,
			parentId,
			description,
			colorName,
		});
	},
	saveUsers: (nodeId: number, userIds: DepartmentUserIds, parentId: ?number): Promise<Array> => {
		return postData('humanresources.api.Structure.Node.Member.saveUserList', {
			nodeId,
			userIds,
			parentId,
		});
	},
	moveUsers: (nodeId: number, userIds: DepartmentUserIds, parentId: ?number): Promise<Array> => {
		return postData('humanresources.api.Structure.Node.Member.moveUserListToDepartment', {
			nodeId,
			userIds,
			parentId,
		});
	},
	saveChats: (
		nodeId: number,
		ids: number[],
		createDefault: boolean[],
	): Promise<void> => {
		return postData('humanresources.api.Structure.Node.Member.Chat.saveChatList', {
			nodeId,
			ids,
			createDefault,
		});
	},
	createSettings: (
		nodeId: number,
		settings: Record<string, {values: string[], replace: boolean}>,
		parentId: ?number,
	): Promise<void> => {
		return postData('humanresources.api.Structure.Node.NodeSettings.create', {
			settings,
			nodeId,
			parentId,
		});
	},
	updateSettings: (
		nodeId: number,
		settings: Record<string, {values: string[], replace: boolean}>,
		parentId: ?number,
	): Promise<void> => {
		return postData('humanresources.api.Structure.Node.NodeSettings.update', {
			settings,
			nodeId,
			parentId,
		});
	},
	getSettings: (nodeId: number): Promise<Array<number>> => {
		return postData('humanresources.api.Structure.Node.NodeSettings.get', { nodeId });
	},
};
