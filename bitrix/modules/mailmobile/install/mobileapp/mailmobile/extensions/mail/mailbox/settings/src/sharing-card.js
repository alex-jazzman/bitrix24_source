/**
 * @module mail/mailbox/settings/src/sharing-card
 */
jn.define('mail/mailbox/settings/src/sharing-card', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { ElementsStack } = require('elements-stack');
	const { Text4, Text5, Text6 } = require('ui-system/typography/text');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { SocialNetworkUserSelector } = require('selector/widget/entity/socialnetwork/user');

	const MEMBER_AVATAR_SIZE = 32;
	const MAX_VISIBLE_AVATARS = 4;
	const ADD_ICON_SIZE = 16;
	const BACKDROP_POSITION_PERCENT = 70;
	const SELECTOR_RECENT_LIMIT = 20;
	const AVATAR_STACK_OUTLINE = 4;
	const AVATAR_STACK_OFFSET = 5;

	/**
	 * @class SharingCard
	 */
	class SharingCard extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.showMemberSelector = this.showMemberSelector.bind(this);
		}

		render()
		{
			return View(
				{
					testId: 'mail-connector-settings-sharing-card',
				},
				this.renderAccessCard(),
				View(
					{
						style: { marginTop: Indent.XL.toNumber() },
					},
					Text6({
						testId: 'mail-connector-settings-sharing-description',
						text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_SHARING_DESCRIPTION'),
						color: Color.base3,
					}),
				),
			);
		}

		renderAccessCard()
		{
			return Card(
				{
					testId: 'mail-connector-settings-sharing-panel',
					design: CardDesign.PRIMARY,
					border: true,
					selected: false,
				},
				View(
					{},
					Text6({
						testId: 'mail-connector-settings-sharing-hint',
						text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_SHARING_HINT'),
						color: Color.base2,
					}),
					this.renderAvatarRow(),
					this.renderAddAction(),
				),
			);
		}

		renderAvatarRow()
		{
			const users = Array.isArray(this.props.shareAccessUsers) ? this.props.shareAccessUsers : [];
			if (users.length === 0)
			{
				return null;
			}

			return View(
				{
					testId: 'mail-connector-settings-sharing-avatars',
					style: {
						marginTop: Indent.XL.toNumber(),
					},
				},
				this.renderMembersStack(users),
			);
		}

		renderMembersStack(users)
		{
			return ElementsStack(
				{
					testId: 'mail-connector-settings-sharing-avatar-stack',
					maxElements: MAX_VISIBLE_AVATARS,
					offset: AVATAR_STACK_OFFSET,
					externalIndent: AVATAR_STACK_OUTLINE,
					restView: this.renderRestAvatar,
				},
				...users.map((user, index) => this.renderMemberAvatar(user, index)).filter(Boolean),
			);
		}

		renderMemberAvatar(user, index)
		{
			if (!user)
			{
				return null;
			}

			const avatarProps = {
				testId: `mail-connector-settings-sharing-avatar-${index}`,
				id: user.id ?? index,
				name: user.title || user.name || '',
				size: MEMBER_AVATAR_SIZE,
				outline: AVATAR_STACK_OUTLINE,
				withRedux: false,
				style: {
					backgroundColor: Color.bgSecondary.toHex(),
				},
				onClick: this.showMemberSelector,
			};

			if (typeof user.imageUrl === 'string' && user.imageUrl.length > 0)
			{
				avatarProps.uri = user.imageUrl;
			}

			return Avatar(avatarProps);
		}

		renderRestAvatar = (restCount) => {
			const restText = restCount > 99 ? '99+' : `+${restCount}`;

			return View(
				{
					style: {
						width: MEMBER_AVATAR_SIZE + AVATAR_STACK_OUTLINE,
						height: MEMBER_AVATAR_SIZE + AVATAR_STACK_OUTLINE,
						backgroundColor: Color.bgSecondary.toHex(),
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: 512,
					},
				},
				View(
					{
						style: {
							width: MEMBER_AVATAR_SIZE,
							height: MEMBER_AVATAR_SIZE,
							backgroundColor: Color.bgContentTertiary.toHex(),
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: 512,
						},
					},
					Text5({
						text: restText,
						color: Color.base4,
					}),
				),
			);
		};

		renderAddAction()
		{
			return View(
				{
					testId: 'mail-connector-settings-sharing-add',
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginTop: Indent.XL.toNumber(),
					},
					onClick: this.showMemberSelector,
				},
				IconView({
					testId: 'mail-connector-settings-sharing-add-icon',
					icon: Icon.PLUS_SIZE_M,
					color: Color.accentMainLink,
					size: ADD_ICON_SIZE,
				}),
				View(
					{
						style: {
							marginLeft: Indent.XS.toNumber(),
						},
					},
					Text4({
						testId: 'mail-connector-settings-sharing-add-text',
						text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_SHARING_ADD'),
						color: Color.accentMainLink,
					}),
				),
			);
		}

		showMemberSelector()
		{
			const selectedUsers = Array.isArray(this.props.shareAccessUsers) ? this.props.shareAccessUsers : [];
			const initSelectedIds = selectedUsers.map((user) => user.id);
			const currentUserId = this.props.currentUserId;
			const undeselectableIds = currentUserId ? [currentUserId] : [];

			SocialNetworkUserSelector.make({
				initSelectedIds,
				undeselectableIds,
				allowMultipleSelection: true,
				provider: {
					context: 'MAIL_SHARE_ACCESS',
					options: {
						recentItemsLimit: SELECTOR_RECENT_LIMIT,
						maxUsersInRecentTab: SELECTOR_RECENT_LIMIT,
						searchLimit: SELECTOR_RECENT_LIMIT,
					},
				},
				events: {
					onClose: (users) => {
						if (!users)
						{
							return;
						}

						this.props.onStateChange({
							shareAccess: users.map((user) => `U${user.id}`),
							shareAccessUsers: users,
						});
					},
				},
				widgetParams: {
					title: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_SHARING_TITLE'),
					backdrop: {
						mediumPositionPercent: BACKDROP_POSITION_PERCENT,
						horizontalSwipeAllowed: false,
					},
				},
			}).show().catch(() => {});
		}
	}

	module.exports = { SharingCard };
});
