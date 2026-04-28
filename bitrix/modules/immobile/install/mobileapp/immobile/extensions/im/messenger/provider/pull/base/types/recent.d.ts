export type RecentConfigSections = Array<SectionRecentType>;

export type SectionRecentType = {
	default: 'default',
	copilot: 'copilot',
	openChannel: 'openChannel',
	collab: 'collab',
}

export type SectionRecentValue = SectionRecentType[keyof SectionRecentType];
