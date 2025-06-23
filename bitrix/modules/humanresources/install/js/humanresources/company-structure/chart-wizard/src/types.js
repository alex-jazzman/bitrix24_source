import { memberRoles, teamMemberRoles } from 'humanresources.company-structure.api';
import { EntityTypes, type UserData, type NodeColorSettingsType } from 'humanresources.company-structure.utils';
import { SettingsTypes } from './consts';

type WizardData = {
	stepIndex: number;
	waiting: boolean;
	isValidStep: boolean;
	departmentData: DepartmentData;
	removedUsers: UserData[];
	employeesIds: number[];
	shouldErrorHighlight: boolean;
	visibleSteps: Array<Step.id>;
	saveMode: 'moveUsers' | 'addUsers';
};

type DepartmentData = {
	id: number;
	name: string;
	description: string;
	parentId: number;
	heads: Array<UserData>;
	employees: Array<UserData>;
	userCount: number;
	chats: Array<number>,
	channels: Array<number>,
	createDefaultChat: boolean,
	createDefaultChannel: boolean,
	teamColor: NodeColorSettingsType,
	settings: {
		[SettingsTypes.businessProcAuthority]: Set,
		[SettingsTypes.reportsAuthority]: Set,
	},
	entityType: EntityTypes.department | EntityTypes.team | EntityTypes.company,
};

type Step = {
	id: string;
	title: string;
};

type DepartmentUserIds = {
	[memberRoles.head]: number[],
	[memberRoles.deputyHead]: number[],
	[memberRoles.employee]: number[],
} | {
	[teamMemberRoles.head]: number[],
	[teamMemberRoles.deputyHead]: number[],
	[teamMemberRoles.employee]: number[],
};

export type { WizardData, DepartmentData, Step, DepartmentUserIds };
