import { RecentType } from 'im.v2.const';

import { AnalyticsForwardTab } from '../const';

const ForwardTabByRecentType = {
	[RecentType.default]: AnalyticsForwardTab.chats,
	[RecentType.taskComments]: AnalyticsForwardTab.tasks,
	[RecentType.collab]: AnalyticsForwardTab.projects,
	[RecentType.openChannel]: AnalyticsForwardTab.channels,
	[RecentType.copilot]: AnalyticsForwardTab.copilot,
};

export function getForwardTab(section: string): $Values<typeof AnalyticsForwardTab>
{
	return ForwardTabByRecentType[section] ?? AnalyticsForwardTab.all;
}
