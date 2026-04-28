/**
 * @module im/messenger/lib/element/recent/item/action/action
 */
jn.define('im/messenger/lib/element/recent/item/action/action', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Theme } = require('im/lib/theme');
	const { Loc } = require('im/messenger/loc');
	const { Icon } = require('assets/icons');

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

	module.exports = {
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
	};
});
