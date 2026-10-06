import { type RecentTypeItem } from './recent';

export const CollabEntityType = {
	tasks: 'tasks',
	files: 'files',
	calendar: 'calendar',
};

export type OpenCollabOptions = {
	compactMode?: boolean,
	recentType?: RecentTypeItem,
};
