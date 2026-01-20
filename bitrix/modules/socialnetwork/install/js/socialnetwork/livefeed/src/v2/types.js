import type { Params } from 'tasks.v2.application.task-card';

export type TaskLinkData = {
	SUFFIX: string,
	TITLE: string,
	DESCRIPTION: string,
	URL: string,
	PARENT_ID: number,
	link: string,
	GROUP_ID: number,
	AUDITORS: string,
	UF_TASK_WEBDAV_FILES_SIGN: string,
	UF_TASK_WEBDAV_FILES: string[],
};

export type CardParams = Params & {
	createParams: CreateParams,
	requestData: TaskLinkData,
};

export type CreateParams = {
	entityType: string,
	entityId: number | string,
	postEntityType: string,
	entryEntityType: string,
	parentTaskId: number,
	logId: number,
};
