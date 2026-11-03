import { DialogId } from '../../../../types/common';
import { MessengerModel } from '../../../base';

/**
 * Raw payload of the mobile.Project.getViewInfo action.
 */
declare type SidebarProjectInfoPayload = {
	description: string,
	goal: string,
	dateStart: string | null,
	dateFinish: string | null,
	tags: string[],
};

/**
 * Normalized element. Dates use YYYY-MM-DD, null means the date is not set.
 */
declare type SidebarProjectInfoItem = {
	description: string,
	goal: string,
	dateStart: string | null,
	dateFinish: string | null,
	tags: string[],
};

declare type SidebarProjectInfoModelState = {
	collection: Record<DialogId, SidebarProjectInfoItem>,
};

export type SidebarProjectInfoModel = MessengerModel<SidebarProjectInfoModelState>;

declare type SidebarProjectInfoModelActions =
	'sidebarModel/sidebarProjectInfoModel/set'
	| 'sidebarModel/sidebarProjectInfoModel/delete'
	;

declare type SidebarProjectInfoModelMutation =
	'sidebarModel/sidebarProjectInfoModel/set'
	| 'sidebarModel/sidebarProjectInfoModel/delete'
	;

declare type SidebarProjectInfoSetActions = 'set';
declare type SidebarProjectInfoSetData = {
	dialogId: DialogId,
	fields: SidebarProjectInfoItem,
};

declare type SidebarProjectInfoDeleteActions = 'delete';
declare type SidebarProjectInfoDeleteData = {
	dialogId: DialogId,
};
