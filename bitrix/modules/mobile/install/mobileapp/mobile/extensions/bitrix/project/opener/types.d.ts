type ProjectOpenerItem = {
	id: number | string,
	title?: string,
	type?: 'group' | 'project' | 'scrum' | 'collab',
	params?: {
		avatar?: string,
		initiatedByType?: string,
		features?: string[],
		membersCount?: number,
		role?: string,
		opened?: boolean,
		dialogId?: string,
		isCollab?: boolean,
		hasCollabers?: boolean,
		color?: string,
	},
};

type ProjectAccessDeniedParams = {
	projectId: number,
};

type ProjectOpenerParams = {
	item?: ProjectOpenerItem | null,
	projectId?: number | string,
	selectedTabId?: string,
	siteId?: string | null,
	siteDir?: string | null,
	newsPathTemplate?: string,
	calendarWebPathTemplate?: string,
	currentUserId?: number | string,
	analyticsLabel?: object,
	openChatFirst?: boolean,
	chatId?: number | string,
	hasCollabers?: boolean,
	color?: string,
	onProjectAccessDenied?: (params: ProjectAccessDeniedParams) => void | Promise<void>,
};

declare class ProjectOpener
{
	static readonly tabId: {
		tasks: string,
		news: string,
		disk: string,
		calendar: string,
	};

	static open(params?: ProjectOpenerParams): Promise<void>;
	static openTasks(params?: ProjectOpenerParams): Promise<void>;
	static openNews(params?: ProjectOpenerParams): Promise<void>;
	static openDisk(params?: ProjectOpenerParams): Promise<void>;
	static openCalendar(params?: ProjectOpenerParams): Promise<void>;
}
