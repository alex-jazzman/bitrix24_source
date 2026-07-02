export type RecentConfigSections = Array<SectionRecentValue>;

export type SectionRecentType = {
	default: 'default',
	copilot: 'copilot',
	openChannel: 'openChannel',
	collab: 'collab',
	tasksTask: 'tasksTask',
	lines: 'lines',
	collabDefault: 'collabDefault',
	collabChats: 'collabChats',
	calendar: 'calendar',
}

export type SectionRecentValue = SectionRecentType[keyof SectionRecentType];
