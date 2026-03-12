import type { StageDto } from 'tasks.v2.provider.service.group-service';

export type PushData = {
	USER_ID: number,
	TASK_ID: number,
	AFTER: TaskPush,
	BEFORE: TaskPush,
};

export type TaskPush = {
	TITLE: string,
	PRIORITY: number,
	CREATED_BY: number,
	RESPONSIBLE_ID: number,
	DEADLINE: number,
	START_DATE_PLAN: number,
	END_DATE_PLAN: number,
	GROUP_ID: number,
	FLOW_ID: number,
	STAGE: number,
	STAGE_INFO: StageDto,
	STATUS: number,
	ACCOMPLICES: string,
	AUDITORS: string,
	TAGS: string,
	UF_TASK_WEBDAV_FILES: string | false,
	UF_CRM_TASK_ADDED: string | false,
	UF_CRM_TASK_DELETED: string | false,
	TIME_ESTIMATE: number,
	PARENT_ID: number,
	MARK: string,
	TASK_CONTROL: boolean,
	taskRequireResult: string,
};
