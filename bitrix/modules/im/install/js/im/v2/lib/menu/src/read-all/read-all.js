import { ParentChatScope, RecentType, type RecentTypeItem } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { UnreadModeManager } from 'im.v2.lib.unread-mode';
import { ChatService } from 'im.v2.provider.service.chat';

// Sections readable in one server call, with the parent scope each one is read within. The list is
// explicit rather than "everything but a showcase": reading is irreversible, so a section added by a
// neighbouring release gets no read until it is put here deliberately.
const SectionScope = Object.freeze({
	[RecentType.taskComments]: ParentChatScope.all,
	[RecentType.collab]: ParentChatScope.topLevel,
	[RecentType.vibecodeApp]: ParentChatScope.all,
});

const SectionAnalytics = Object.freeze({
	[RecentType.default]: (analytics, section) => analytics.onReadAllChats(section),
	[RecentType.taskComments]: (analytics, section) => analytics.onReadAllTaskChats(section),
	[RecentType.collab]: (analytics, section) => analytics.onReadAllProjectTabChats(section),
	[RecentType.vibecodeApp]: (analytics, section) => analytics.onReadAllVibecodeAppChats(section),
});

// The read of a whole section, shared by every surface that offers it: the funnel of the list, the
// menu of a folder in the panel and the menu of the unread chip.
export const ReadAllOperation = {
	isSupported(section: ?RecentTypeItem): boolean
	{
		if (!section)
		{
			return false;
		}

		return section === RecentType.default || Object.hasOwn(SectionScope, section);
	},

	run(section: ?RecentTypeItem, analyticsSection: string): void
	{
		if (!this.isSupported(section))
		{
			return;
		}

		SectionAnalytics[section](Analytics.getInstance().recentHeaderMenu, analyticsSection);

		// The recent list has no read of its own: it is served by the messenger-wide call. That call
		// clears the counters of every section on the server, so the unread index is swept whole as
		// well - a sweep of a single section would keep the chats of the neighbouring ones in their
		// unread lists with a zero counter until the pull event arrives.
		if (section === RecentType.default)
		{
			UnreadModeManager.removeAllClosedChats();
			(new ChatService()).readAll();

			return;
		}

		(new ChatService()).readAllByRecentType(section, SectionScope[section]);
	},
};
