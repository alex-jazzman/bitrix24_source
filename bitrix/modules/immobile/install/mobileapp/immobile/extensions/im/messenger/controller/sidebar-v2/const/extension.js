/**
 * @module im/messenger/controller/sidebar-v2/const
 */
jn.define('im/messenger/controller/sidebar-v2/const', (require, exports, module) => {
	const SidebarContextMenuActionId = {
		MORE: 'more',
		EDIT: 'edit',
		LEAVE: 'leave',
		DELETE: 'delete',
		COPY_LINK: 'copy_link',
		PIN: 'pin',
		UNPIN: 'unpin',
		ADD_PARTICIPANTS: 'add_participants',
		OPEN_PROFILE: 'open_profile',
		OPEN_CALENDAR: 'open_calendar',
		HIDE: 'hide',
		CLEAR_HISTORY: 'clear_history',
		CLEAR_HISTORY_FOR_ME: 'clear_history_for_me',
		CLEAR_HISTORY_FOR_ALL: 'clear_history_for_all',
		COPILOT_HELP: 'copilot_help',
	};

	const SidebarContextMenuActionSection = {
		CLEAR_HISTORY: 'clear_history',
		COPILOT_MODELS: 'copilot_models',
		COPILOT_HELP: 'copilot_help',
	};

	const SidebarContextMenuActionPosition = {
		TOP: 100,
		MIDDLE: 200,
		BOTTOM: 500,
	};

	const SidebarFileType = Object.freeze({
		document: 'document',
		other: 'other',
		media: 'media',
		audio: 'audio',
	});

	const SIDEBAR_DEFAULT_TOAST_OFFSET = 26;

	const SidebarPrimaryActionButtonId = {
		SEARCH: 'search',
		MUTE: 'mute',
		VIDEO_CALL: 'video-call',
		AUDIO_CALL: 'audio-call',
		MESSAGE_AUTO_DELETE: 'messages-auto-delete',
		COPILOT_ROLE: 'copilot-role',
		COPILOT_MODEL: 'copilot-model',
	};

	module.exports = {
		SidebarContextMenuActionId,
		SidebarContextMenuActionPosition,
		SidebarContextMenuActionSection,
		SidebarFileType,
		SIDEBAR_DEFAULT_TOAST_OFFSET,
		SidebarPrimaryActionButtonId,
	};
});
