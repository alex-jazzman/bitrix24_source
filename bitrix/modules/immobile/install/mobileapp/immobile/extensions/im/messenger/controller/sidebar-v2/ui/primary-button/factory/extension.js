/**
 * @module im/messenger/controller/sidebar-v2/ui/primary-button/factory
 */
jn.define('im/messenger/controller/sidebar-v2/ui/primary-button/factory', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Color, Indent } = require('tokens');
	const { Text6 } = require('ui-system/typography/text');
	const { SpinnerLoader } = require('layout/ui/loaders/spinner');
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const { SidebarPrimaryActionButtonId } = require('im/messenger/controller/sidebar-v2/const');
	const { SidebarAvatar } = require('im/messenger/controller/sidebar-v2/ui/sidebar-avatar');

	const createSearchButton = ({ onClick, ...rest }) => ({
		id: SidebarPrimaryActionButtonId.SEARCH,
		icon: Icon.SEARCH,
		title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_BUTTON_SEARCH'),
		onClick,
		...rest,
	});

	const createMuteButton = ({ onClick, muted, ...rest }) => ({
		id: SidebarPrimaryActionButtonId.MUTE,
		testIdSuffix: muted ? 'muted' : 'unmuted',
		icon: muted ? Icon.NOTIFICATION_OFF : Icon.NOTIFICATION,
		title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_BUTTON_MUTE'),
		onClick,
		...rest,
	});

	const createVideoCallButton = ({ onClick, disabled, ...rest }) => ({
		id: SidebarPrimaryActionButtonId.VIDEO_CALL,
		icon: Icon.RECORD_VIDEO,
		title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_BUTTON_VIDEO_CALL'),
		onClick,
		disabled,
		...rest,
	});

	const createAudioCallButton = ({ onClick, disabled, ...rest }) => ({
		id: SidebarPrimaryActionButtonId.AUDIO_CALL,
		icon: Icon.PHONE_UP,
		title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_BUTTON_AUDIO_CALL'),
		onClick,
		disabled,
		...rest,
	});

	const createAutoDeleteButton = ({ onClick, selected, ...rest }) => {
		return {
			id: SidebarPrimaryActionButtonId.MESSAGE_AUTO_DELETE,
			icon: Icon.TIMER_DOT,
			title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_BUTTON_AUTO_DELETE'),
			onClick,
			selected,
			...rest,
		};
	};

	const createCopilotRoleButton = ({ onClick, disabled, selected, dialogId, ahaMoment, ...rest }) => {
		const title = Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_BUTTON_COPILOT_ROLE_MSGVER_1');
		const id = SidebarPrimaryActionButtonId.COPILOT_ROLE;

		return {
			id,
			icon: Icon.COPILOT,
			title,
			onClick,
			selected,
			ahaMoment,
			renderCustomContent: () => [
				SidebarAvatar({
					dialogId,
					size: 32,
					isNotes: false,
					style: {
						marginBottom: 4,
					},
				}),
				Text6({
					testId: `${id}-text`,
					color: disabled ? Color.base5 : Color.base1,
					text: title,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						marginBottom: Indent.M.toNumber(),
					},
				}),
			],
			...rest,
		};
	};

	const createCopilotModelButton = ({ onClick, disabled, selected, ...rest }) => {
		const title = Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_BUTTON_COPILOT_MODEL');
		const id = SidebarPrimaryActionButtonId.COPILOT_MODEL;

		return {
			id,
			icon: Icon.COPILOT,
			title,
			onClick,
			selected,
			...rest,
		};
	};

	const createCopilotChangeModelStateButton = ({ onClick, disabled, selected, title, ...rest }) => {
		const stateTitle = title ?? Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_BUTTON_COPILOT_MODEL');
		const id = SidebarPrimaryActionButtonId.COPILOT_MODEL;

		return {
			id,
			icon: Icon.COPILOT,
			title: stateTitle,
			onClick,
			selected,
			renderCustomContent: () => [
				View(
					{
						style: {
							width: '100%',
							height: '100%',
							alignItems: 'center',
							justifyContent: 'center',
						},
					},
					SpinnerLoader({ size: 32 }),
				),
			],
			...rest,
		};
	};

	module.exports = {
		createSearchButton,
		createMuteButton,
		createVideoCallButton,
		createAudioCallButton,
		createAutoDeleteButton,
		createCopilotRoleButton,
		createCopilotModelButton,
		createCopilotChangeModelStateButton,
	};
});
