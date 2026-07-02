/**
 * @module im/messenger/controller/sidebar-v2/tabs/participants/src/items/user
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/participants/src/items/user', (require, exports, module) => {
	const { Color } = require('tokens');
	const { isEmpty } = require('utils/object');
	const { UserProfile } = require('user-profile');
	const { Icon } = require('assets/icons');

	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Loc } = require('im/messenger/loc');
	const { UserHelper } = require('im/messenger/lib/helper');
	const { ParticipantBaseItem } = require('im/messenger/controller/sidebar-v2/tabs/participants/src/items/base');
	const { PositionEnum } = require('im/messenger/controller/sidebar-v2/ui/sidebar-avatar');

	/**
	 * @class ParticipantUserItem
	 */
	class ParticipantUserItem extends ParticipantBaseItem
	{
		constructor(props)
		{
			super(props);

			this.chatTitle = this.createChatTitle(this.getUserId());
			this.userHelper = UserHelper.createByUserId(this.getUserId());
		}

		createTitle()
		{
			const title = this.chatTitle.getTitle({ isNotes: false });
			const text = this.isYou()
				? `${title} [COLOR=${Color.base4.toHex()}]${Loc.getMessage('IMMOBILE_SIDEBAR_V2_PARTICIPANTS_IS_YOU')}[/COLOR]`
				: title;

			return {
				text,
				style: {
					color: this.chatTitle.getTitleColor(),
				},
			};
		}

		createSubtitle()
		{
			return {
				text: this.chatTitle.getDescription({ isNotes: false }),
			};
		}

		createAvatar()
		{
			return {
				testId: 'participant-user-item',
				dialogId: this.getUserId(),
				statusIcons: this.renderStatusIcons(),
			};
		}

		renderStatusIcons()
		{
			const userStatus = this.getUserStatusIcon();
			const crownStatus = this.getCrownStatusIcon();
			const statuses = [userStatus, crownStatus].filter(Boolean);

			if (isEmpty(statuses))
			{
				return null;
			}

			return statuses.map(({ tintColor, named, position }) => ({
				statusIcon: Image({
					style: {
						width: 18,
						height: 18,
						backgroundColor: Color.bgContentPrimary.toHex(),
						borderRadius: 9,
						overflow: 'hidden',
					},
					tintColor,
					named,
				}),
				position,
			}));
		}

		/**
		 * @return {{
		 * named: string,
		 * tintColor: string,
		 * position: PositionEnum
		 * } | null}
		 */
		getUserStatusIcon()
		{
			const store = serviceLocator.get('core').getStore();

			const hasVacation = store.getters['usersModel/hasVacation'](this.getUserId());
			if (hasVacation)
			{
				return {
					named: Icon.SMALL_VACATION.getIconName(),
					tintColor: Color.accentSoftElementGreen.toHex(),
					position: PositionEnum.BOTTOM_RIGHT,
				};
			}

			const hasBirthday = store.getters['usersModel/hasBirthday'](this.getUserId());
			if (hasBirthday)
			{
				return {
					named: Icon.SMALL_GIFT.getIconName(),
					tintColor: Color.accentSoftElementGreen.toHex(),
					position: PositionEnum.BOTTOM_RIGHT,
				};
			}

			return null;
		}

		/**
		 * @return {{
		 * named: string,
		 * tintColor: string,
		 * position: PositionEnum
		 * } | null}
		 */
		getCrownStatusIcon()
		{
			if (this.isAdmin() || this.isManager())
			{
				return {
					named: Icon.SMALL_CROWN.getIconName(),
					tintColor: Color.accentMainWarningSolid.toHex(),
					position: PositionEnum.TOP_RIGHT,
				};
			}

			return null;
		}

		getTestId()
		{
			return 'sidebar-tab-participant-item';
		}

		handleOnClick()
		{
			if (this.userHelper.isBot)
			{
				return;
			}

			void UserProfile.open({
				ownerId: this.getUserId(),
				analyticsSection: 'im_sidebar_participants',
			});
		}

		getUserId()
		{
			const { userId } = this.props;

			return userId;
		}

		isManager()
		{
			const { isManager } = this.props;

			return Boolean(isManager);
		}

		shouldShowMenu()
		{
			return true;
		}
	}

	module.exports = {
		ParticipantUserItem,
	};
});
