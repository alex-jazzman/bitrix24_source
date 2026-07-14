/**
 * @module im/messenger/controller/dialog/lib/message-menu/src/action
 */
jn.define('im/messenger/controller/dialog/lib/message-menu/src/action', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');
	const AppTheme = require('apptheme');
	const { Icon } = require('assets/icons');
	const { Color } = require('tokens');

	const { MessageMenuActionType } = require('im/messenger/const');
	const { Url } = require('im/messenger/lib/helper');

	const deleteColor = AppTheme.colors.accentMainAlert;

	const ActionViewType = Object.freeze({
		button: 'button',
		separator: 'separator',
		subtitle: 'subtitle',
		base: 'base',
	});

	/** @type MessageContextMultiLevelMenuActionItem */
	const ReplyAction = {
		id: MessageMenuActionType.reply,
		testId: 'MESSAGE_MENU_ACTION_REPLY',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_REPLY'),
		iconName: Icon.QUOTE.getIconName(),
		iconUrl: Url.createFromPath(Icon.QUOTE.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const CopyAction = {
		id: MessageMenuActionType.copy,
		testId: 'MESSAGE_MENU_ACTION_COPY',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_COPY_V3'),
		iconName: Icon.COPY.getIconName(),
		iconUrl: Url.createFromPath(Icon.COPY.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const CopyLinkAction = {
		id: MessageMenuActionType.copyLink,
		testId: 'MESSAGE_MENU_ACTION_COPY_LINK',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_COPY_LINK'),
		iconName: Icon.LINK.getIconName(),
		iconUrl: Url.createFromPath(Icon.LINK.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const MarkAction = {
		id: MessageMenuActionType.mark,
		testId: 'MESSAGE_MENU_ACTION_MARK',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_MARK'),
		iconName: Icon.BOOKMARK.getIconName(),
		iconUrl: Url.createFromPath(Icon.BOOKMARK.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const PinAction = {
		id: MessageMenuActionType.pin,
		testId: 'MESSAGE_MENU_ACTION_PIN',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_PIN'),
		iconName: Icon.PIN.getIconName(),
		iconUrl: Url.createFromPath(Icon.PIN.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const UnpinAction = {
		id: MessageMenuActionType.unpin,
		testId: 'MESSAGE_MENU_ACTION_UNPIN',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_UNPIN'),
		iconName: Icon.UNPIN.getIconName(),
		iconUrl: Url.createFromPath(Icon.UNPIN.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const SubscribeAction = {
		id: MessageMenuActionType.subscribe,
		testId: 'MESSAGE_MENU_ACTION_SUBSCRIBE',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_SUBSCRIBE'),
		iconName: Icon.OBSERVER.getIconName(),
		iconUrl: Url.createFromPath(Icon.OBSERVER.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const UnsubscribeAction = {
		id: MessageMenuActionType.unsubscribe,
		testId: 'MESSAGE_MENU_ACTION_UNSUBSCRIBE',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_UNSUBSCRIBE'),
		iconName: Icon.CROSSED_EYE.getIconName(),
		iconUrl: Url.createFromPath(Icon.CROSSED_EYE.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const ForwardAction = {
		id: MessageMenuActionType.forward,
		testId: 'MESSAGE_MENU_ACTION_FORWARD',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_FORWARD'),
		iconName: Icon.FORWARD.getIconName(),
		iconUrl: Url.createFromPath(Icon.FORWARD.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const CreateAction = {
		id: MessageMenuActionType.create,
		testId: 'MESSAGE_MENU_ACTION_CREATE',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_CREATE'),
		iconName: Icon.CIRCLE_PLUS.getIconName(),
		iconUrl: Url.createFromPath(Icon.CIRCLE_PLUS.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const CreateTaskAction = {
		id: MessageMenuActionType.createTask,
		testId: 'MESSAGE_MENU_ACTION_CREATE_TASK',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_CREATE_TASK'),
		iconName: Icon.TASK.getIconName(),
		iconUrl: Url.createFromPath(Icon.TASK.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const CreateEventAction = {
		id: MessageMenuActionType.createEvent,
		testId: 'MESSAGE_MENU_ACTION_CREATE_EVENT',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_CREATE_EVENT'),
		iconName: Icon.CALENDAR_WITH_SLOTS.getIconName(),
		iconUrl: Url.createFromPath(Icon.CALENDAR_WITH_SLOTS.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const DownloadToDeviceAction = {
		id: MessageMenuActionType.downloadToDevice,
		testId: 'MESSAGE_MENU_ACTION_DOWNLOAD_TO_DEVICE',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_TO_DEVICE'),
		iconName: Icon.DOWNLOAD.getIconName(),
		iconUrl: Url.createFromPath(Icon.DOWNLOAD.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const DownloadToDiskAction = {
		id: MessageMenuActionType.downloadToDisk,
		testId: 'MESSAGE_MENU_ACTION_DOWNLOAD_TO_DISK',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DOWNLOAD_TO_DISK_MSGVER_1'),
		iconName: Icon.FOLDER_24.getIconName(),
		iconUrl: Url.createFromPath(Icon.FOLDER_24.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const ProfileAction = {
		id: MessageMenuActionType.profile,
		testId: 'MESSAGE_MENU_ACTION_PROFILE',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_PROFILE_MSGVER_1'),
		iconName: Icon.PERSON.getIconName(),
		iconUrl: Url.createFromPath(Icon.PERSON.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const EditAction = {
		id: MessageMenuActionType.edit,
		testId: 'MESSAGE_MENU_ACTION_EDIT',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_EDIT'),
		iconName: Icon.EDIT.getIconName(),
		iconUrl: Url.createFromPath(Icon.EDIT.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const DeleteAction = {
		id: MessageMenuActionType.delete,
		testId: 'MESSAGE_MENU_ACTION_DELETE',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_DELETE'),
		iconName: Icon.TRASHCAN.getIconName(),
		iconUrl: Url.createFromPath(Icon.TRASHCAN.getPath()).href,
		styles: {
			title: {
				font: {
					color: deleteColor,
				},
			},
			icon: {
				color: deleteColor,
			},
		},
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const FeedbackAction = {
		id: MessageMenuActionType.feedback,
		testId: 'MESSAGE_MENU_ACTION_FEEDBACK',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_FEEDBACK'),
		iconName: Icon.FEEDBACK.getIconName(),
		iconUrl: Url.createFromPath(Icon.FEEDBACK.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const ResendAction = {
		id: MessageMenuActionType.resend,
		testId: 'MESSAGE_MENU_ACTION_RESEND',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_RESEND'),
		iconName: Icon.REFRESH.getIconName(),
		iconUrl: Url.createFromPath(Icon.REFRESH.getPath()).href,
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const MultiSelectAction = {
		id: MessageMenuActionType.multiselect,
		testId: 'messageMenuAction_item_multiselect',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_MULTISELECT'),
		iconName: Icon.CIRCLE_CHECK.getIconName(),
		iconUrl: Url.createFromPath(Icon.CIRCLE_CHECK.getPath()).href,
		iconSvg: Icon.CIRCLE_CHECK.getSvg(),
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const GoToMessageAction = {
		id: MessageMenuActionType.goToMessage,
		testId: 'messageMenuAction_go-to-message',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_GO_TO_MESSAGE'),
		iconName: Icon.GO_TO_MESSAGE.getIconName(),
		iconUrl: Url.createFromPath(Icon.GO_TO_MESSAGE.getPath()).href,
		iconSvg: Icon.GO_TO_MESSAGE.getSvg(),
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const FinishVoteAction = {
		id: MessageMenuActionType.finishVote,
		testId: 'MESSAGE_MENU_ACTION_FINISH_VOTE',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_FINISH_VOTE'),
		iconName: Icon.FLAG.getIconName(),
		iconUrl: Url.createFromPath(Icon.FLAG.getPath()).href,
		iconSvg: Icon.FLAG.getSvg(),
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const RevoteAction = {
		id: MessageMenuActionType.revote,
		testId: 'MESSAGE_MENU_ACTION_REVOTE',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_REVOTE'),
		iconName: Icon.EDIT.getIconName(),
		iconUrl: Url.createFromPath(Icon.EDIT.getPath()).href,
		iconSvg: Icon.EDIT.getSvg(),
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const OpenVoteResultAction = {
		id: MessageMenuActionType.openVoteResult,
		testId: 'MESSAGE_MENU_ACTION_OPEN_VOTE_RESULT',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_OPEN_VOTE_RESULT'),
		iconName: Icon.POLL.getIconName(),
		iconUrl: Url.createFromPath(Icon.POLL.getPath()).href,
		iconSvg: Icon.POLL.getSvg(),
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const AskCopilotAction = {
		id: MessageMenuActionType.askCopilot,
		testId: 'MESSAGE_MENU_ACTION_ASK_COPILOT',
		type: ActionViewType.base,
		title: Loc.getMessageWithCopilotBotName('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_ASK_COPILOT_MSGVER_1'),
		iconName: Feature.isBitrixGptV2Available ? Icon.BITRIX_GPT.getIconName() : Icon.COPILOT.getIconName(),
		iconUrl: Url.createFromPath(Icon.COPILOT.getPath()).href,
		iconSvg: Icon.COPILOT.getSvg(),
		styles: {
			title: {
				font: {
					color: Color.accentSoftElementViolet.toHex(),
				},
			},
			icon: {
				color: Color.accentSoftElementViolet.toHex(),
			},
		},
	};

	/** @type MessageContextMultiLevelMenuActionItem */
	const MoreAction = {
		id: MessageMenuActionType.more,
		testId: 'MESSAGE_MENU_ACTION_MORE',
		type: ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_MORE'),
		iconName: Icon.CHEVRON_TO_THE_RIGHT.getIconName(),
		iconUrl: Url.createFromPath(Icon.CHEVRON_TO_THE_RIGHT.getPath()).href,
	};

	/** @type MessageContextMenuSeparator */
	const SeparatorAction = {
		type: ActionViewType.separator,
	};

	module.exports = {
		ActionViewType,
		ReplyAction,
		CopyAction,
		CopyLinkAction,
		MarkAction,
		PinAction,
		UnpinAction,
		ForwardAction,
		CreateAction,
		DownloadToDeviceAction,
		DownloadToDiskAction,
		ProfileAction,
		EditAction,
		DeleteAction,
		FeedbackAction,
		SubscribeAction,
		UnsubscribeAction,
		ResendAction,
		SeparatorAction,
		MultiSelectAction,
		FinishVoteAction,
		RevoteAction,
		OpenVoteResultAction,
		GoToMessageAction,
		AskCopilotAction,
		CreateTaskAction,
		CreateEventAction,
		MoreAction,
	};
});
