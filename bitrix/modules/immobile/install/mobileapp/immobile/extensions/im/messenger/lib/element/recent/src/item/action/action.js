/**
 * @module im/messenger/lib/element/recent/item/action/action
 */
jn.define('im/messenger/lib/element/recent/item/action/action', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Loc } = require('im/messenger/loc');
	const { Icon } = require('assets/icons');

	const ContextMenuSection = Object.freeze({
		main: 'main',
		bottom: 'bottom',
	});

	const InviteResendAction = {
		title: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_ACTION_INVITE_RESEND'),
		identifier: 'inviteResend',
		color: Color.accentMainSuccess.toHex(),
	};

	const InviteCancelAction = {
		title: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_ACTION_INVITE_CANCEL'),
		color: Color.accentMainWarning.toHex(),
		identifier: 'inviteCancel',
	};

	const PinAction = {
		title: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_ACTION_PIN'),
		identifier: 'pin',
		color: Color.accentMainPrimaryalt.toHex(),
		iconName: Icon.PIN.getIconName(),
		direction: 'leftToRight',
	};

	const UnpinAction = {
		title: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_ACTION_UNPIN'),
		identifier: 'unpin',
		color: Color.accentMainPrimaryalt.toHex(),
		iconName: Icon.UNPIN.getIconName(),
		direction: 'leftToRight',
	};

	const ReadAction = {
		title: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_ACTION_READ'),
		iconName: Icon.MESSAGES.getIconName(),
		identifier: 'read',
		color: Color.accentMainSuccess.toHex(),
		direction: 'leftToRight',
		fillOnSwipe: true,
		contextMenu: {
			iconName: Icon.DOUBLE_CHECK.getIconName(),
		},
	};

	const UnreadAction = {
		title: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_ACTION_UNREAD'),
		iconName: Icon.CHATS_WITH_CHECK.getIconName(),
		identifier: 'unread',
		color: Color.accentMainSuccess.toHex(),
		direction: 'leftToRight',
		fillOnSwipe: true,
	};

	const MuteAction = {
		title: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_ACTION_MUTE_MSGVER_2'),
		identifier: 'mute',
		iconName: Icon.NOTIFICATION_OFF.getIconName(),
		color: Color.base3.toHex(),
	};

	const UnmuteAction = {
		title: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_ACTION_UNMUTE_MSGVER_2'),
		identifier: 'unmute',
		iconName: Icon.NOTIFICATION.getIconName(),
		color: Color.base3.toHex(),
	};

	const ProfileAction = {
		title: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_ACTION_PROFILE'),
		identifier: 'profile',
		color: Color.accentMainPrimaryalt.toHex(),
		iconName: Icon.PERSON.getIconName(),
	};

	const HideAction = {
		title: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_ACTION_HIDE'),
		iconName: Icon.BOX_WITH_LID.getIconName(),
		identifier: 'hide',
		color: Color.accentMainAlert.toHex(),
		contextMenu: {
			sectionCode: ContextMenuSection.bottom,
			showTopSeparator: true,
			iconName: Icon.CROSSED_EYE.getIconName(),
		},
	};

	const OperatorAnswerAction = {
		title: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_ACTION_ANSWER'),
		iconName: Icon.LOWER_LEFT_ARROW.getIconName(),
		identifier: 'operatorAnswer',
		color: Color.accentMainSuccess.toHex(),
	};

	const OperatorSpamAction = {
		title: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_ACTION_SPAM'),
		iconName: Icon.ALERT.getIconName(),
		identifier: 'operatorSpam',
		color: Color.accentMainWarning.toHex(),
		contextMenu: {
			styles: {
				title: {
					font: {
						color: Color.accentMainAlert.toHex(),
					},
				},
				icon: {
					color: Color.accentMainAlert.toHex(),
				},
			},
		},
	};

	const OperatorSkipAction = {
		title: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_ACTION_SKIP'),
		iconName: Icon.ARROW_TO_THE_RIGHT.getIconName(),
		identifier: 'operatorSkip',
		color: Color.accentMainAlert.toHex(),
	};

	const OperatorFinishAction = {
		title: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_ACTION_FINISH'),
		iconName: Icon.FLAG.getIconName(),
		identifier: 'operatorFinish',
		color: Color.accentMainSuccess.toHex(),
	};

	const AddToFolderAction = {
		title: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_ACTION_ADD_TO_FOLDER'),
		identifier: 'addToFolder',
		iconName: Icon.FOLDER_PLUS.getIconName(),
		color: Color.base3.toHex(),
		direction: 'leftToRight',
	};

	/** Popup context menu order. OpenlineItem overrides via its own createContextMenuActions. */
	const ContextMenuActionOrder = [
		ReadAction,
		UnreadAction,
		PinAction,
		UnpinAction,
		MuteAction,
		UnmuteAction,
		AddToFolderAction,
		HideAction,
		ProfileAction,
		InviteResendAction,
		InviteCancelAction,
	];

	module.exports = {
		ContextMenuSection,
		ContextMenuActionOrder,
		InviteResendAction,
		InviteCancelAction,
		PinAction,
		UnpinAction,
		ReadAction,
		UnreadAction,
		MuteAction,
		UnmuteAction,
		ProfileAction,
		HideAction,
		OperatorAnswerAction,
		OperatorSpamAction,
		OperatorSkipAction,
		OperatorFinishAction,
		AddToFolderAction,
	};
});
