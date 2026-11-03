export type MeetingPrefill = {
	description?: string,
	participantsEntityList?: number[],
};

export type PrepareCalendarParams = {
	type?: 'user' | 'group',
	entryDescription?: string,
	participantsEntityList?: {
		id: number,
		entityId: string,
	}[],
};

export type PrepareTaskData = {
	link: string,
	params: {
		TITLE?: string,
		RESPONSIBLE_ID: number,
		DESCRIPTION?: string,
		AUDITORS?: string,
		IM_CHAT_ID: number,
	},
};
