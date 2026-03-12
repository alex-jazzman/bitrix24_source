/**
 * @module user-profile/common-tab/src/block/header/user-card
 */
jn.define('user-profile/common-tab/src/block/header/user-card', (require, exports, module) => {
	const { UserCardClass } = require('layout/ui/user/card');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { Color, Indent } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { H3 } = require('ui-system/typography/heading');
	const { Text5, Text6 } = require('ui-system/typography/text');
	const { BBCodeText } = require('ui-system/typography/bbcodetext');
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { UserStatus } = require('user-profile/common-tab/src/block/header/const');
	const { FriendlyDate } = require('layout/ui/friendly-date');
	const { FormatterTypes } = require('layout/ui/friendly-date/formatter-factory');
	const { Moment } = require('utils/date');
	const { Circle, Line } = require('utils/skeleton');
	const { PropTypes } = require('utils/validation');

	const AVATAR_SIZE = 72;

	/**
	 * @class ProfileUserCard
	 */
	class ProfileUserCard extends UserCardClass
	{
		renderAvatar()
		{
			const { user, status, isBirthday, onAvatarClick } = this.props;
			if (!user)
			{
				return View(
					{
						style: {
							marginRight: Indent.XL2.toNumber(),
						},
					},
					Circle(AVATAR_SIZE),
				);
			}

			return View(
				{
					testId: this.getTestId('avatar-container'),
					style: {
						marginRight: Indent.XL2.toNumber(),
						position: 'relative',
					},
				},
				Avatar({
					id: user.id,
					name: user.name,
					size: AVATAR_SIZE,
					testId: this.getTestId('avatar'),
					image: user.avatar,
					withRedux: true,
					onClick: onAvatarClick,
					accent: user?.isExtranet || user?.isCollaber,
					entityType: this.getEntityType(user),
					backBorderWidth: 0,
				}),
				this.renderStatusIcon(status, isBirthday),
			);
		}

		renderStatusIcon(status, isBirthday)
		{
			const statusIconData = this.#getStatusIconData(status, isBirthday);
			if (!statusIconData)
			{
				return null;
			}

			const iconContainerSize = 26;

			return View(
				{
					testId: this.getTestId('status-icon-container'),
					style: {
						position: 'absolute',
						bottom: 0,
						right: 0,
						height: iconContainerSize,
						width: iconContainerSize,
						borderRadius: iconContainerSize / 2,
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				IconView({
					testId: this.getTestId('status-icon'),
					icon: statusIconData.name,
					color: statusIconData.color,
					size: 20,
				}),
			);
		}

		#getStatusIconData(status, isBirthday)
		{
			switch (status)
			{
				case UserStatus.ON_VACATION:
					return {
						name: Icon.SMALL_VACATION,
						color: Color.accentExtraAqua,
					};

				case UserStatus.ONLINE:
				case UserStatus.OFFLINE:
				case UserStatus.DND:
				case UserStatus.INVITED:
				case UserStatus.REINVITED:
					return isBirthday && {
						name: Icon.SMALL_GIFT,
						color: Color.accentMainPrimaryalt,
					};

				default:
					return null;
			}
		}

		renderDetails()
		{
			const { user, currentTheme } = this.props;

			if (!user)
			{
				return View(
					{
						style: {
							flex: 1,
							flexDirection: 'column',
							justifyContent: 'center',
						},
					},
					Line(80, 9, Indent.S.toNumber(), Indent.S.toNumber()),
					Line(100, 9, Indent.S.toNumber(), Indent.S.toNumber()),
					Line(60, 9, Indent.S.toNumber(), Indent.S.toNumber()),
				);
			}

			const textColor = this.getTextColorByTheme(currentTheme);

			return View(
				{
					testId: this.getTestId('text-content'),
					style: {
						justifyContent: 'center',
						flex: 1,
					},
				},
				this.renderFullName(textColor),
				this.renderWorkPosition(textColor),
				this.renderUserRole(textColor),
				this.renderStatusText(textColor),
			);
		}

		renderFullName(textColor)
		{
			const { user } = this.props;

			return H3({
				testId: this.getTestId('full-name'),
				accent: true,
				color: textColor,
				text: user.fullName,
			});
		}

		renderWorkPosition(textColor)
		{
			const { user } = this.props;
			const workPosition = user?.workPosition;

			if (Type.isNil(workPosition) || workPosition === '')
			{
				return null;
			}

			return Text5({
				testId: this.getTestId('work-position'),
				text: workPosition,
				color: textColor,
				style: {
					marginTop: Indent.XS2.toNumber(),
				},
				ellipsize: 'end',
				numberOfLines: 1,
			});
		}

		renderStatusText(textColor)
		{
			const { status, lastSeenDate, personalGender } = this.props;
			if (!status)
			{
				return null;
			}

			if ((status === UserStatus.OFFLINE) && !Type.isNil(lastSeenDate) && lastSeenDate !== 0)
			{
				return View(
					{
						style: {
							marginTop: Indent.XS2.toNumber(),
							flexDirection: 'row',
						},
					},
					new FriendlyDate({
						moment: Moment.createFromTimestamp(lastSeenDate),
						showTime: true,
						useTimeAgo: true,
						futureAllowed: false,
						formatType: FormatterTypes.HUMAN_DATE,
						renderContent: ({ state }) => this.renderOfflineStatusFriendlyDateContent(
							state,
							personalGender,
							textColor,
						),
						style: {
							marginTop: Indent.M.toNumber(),
						},
						ellipsize: 'end',
						numberOfLines: 1,
					}),
				);
			}

			return BBCodeText({
				testId: this.getTestId('status-text'),
				value: this.getStatusText(textColor),
				color: textColor,
				size: 6,
				style: {
					marginTop: Indent.M.toNumber(),
				},
				ellipsize: 'end',
				numberOfLines: 1,
			});
		}

		renderOfflineStatusFriendlyDateContent(state, personalGender, textColor)
		{
			const gender = (personalGender === 'M' || personalGender === 'F') ? personalGender : null;
			const text = Type.isNil(gender)
				? Loc.getMessage('M_PROFILE_USER_STATUS_OFFLINE_WITH_TIME_NO_GENDER', {
					'#DATE#': state.text,
				})
				: Loc.getMessage(`M_PROFILE_USER_STATUS_OFFLINE_WITH_TIME_${gender}`, {
					'#DATE#': state.text,
				});

			return Text6({
				text,
				color: textColor,
			});
		}

		getStatusText(textColor)
		{
			const {
				status,
				GMTString,
				onVacationDateTo,
			} = this.props;

			switch (status)
			{
				case UserStatus.FIRED:
					return Loc.getMessage('M_PROFILE_USER_STATUS_FIRED');

				case UserStatus.ON_VACATION:
					return Loc.getMessage('M_PROFILE_USER_STATUS_ON_VACATION', {
						'#DATE_TO#': onVacationDateTo,
					});

				case UserStatus.DND:
					return Loc.getMessage('M_PROFILE_USER_STATUS_DND', {
						'#COLOR#': textColor,
						'#GMT#': GMTString,
					});

				case UserStatus.ONLINE:
					return Loc.getMessage('M_PROFILE_USER_STATUS_ONLINE', {
						'#COLOR#': textColor,
						'#GMT#': GMTString,
					});

				case UserStatus.OFFLINE:
					return Loc.getMessage('M_PROFILE_USER_STATUS_OFFLINE');

				case UserStatus.INVITED:
					return Loc.getMessage('M_PROFILE_USER_STATUS_INVITED');

				case UserStatus.REINVITED:
					return Loc.getMessage('M_PROFILE_USER_STATUS_REINVITED');

				default:
					return '';
			}
		}

		renderUserRole(textColor)
		{
			const { user } = this.props;
			if (user?.isCollaber)
			{
				return Text5({
					testId: this.getTestId('role'),
					text: Loc.getMessage('M_PROFILE_USER_ROLE_COLLAB'),
					color: textColor,
					style: {
						marginTop: Indent.XS2.toNumber(),
					},
				});
			}

			if (user.isExtranet)
			{
				return Text5({
					testId: this.getTestId('role'),
					text: Loc.getMessage('M_PROFILE_USER_ROLE_EXTRANET'),
					color: textColor,
					style: {
						marginTop: Indent.XS2.toNumber(),
					},
				});
			}

			if (user.isRootAdmin)
			{
				return View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'flex-start',
						},
					},
					IconView({
						testId: this.getTestId('role-icon'),
						icon: Icon.CROWN_1,
						color: Color.baseWhiteFixed,
						size: 20,
						solid: true,
						style: {
							marginRight: Indent.XS2.toNumber(),
						},
					}),
					Text5({
						testId: this.getTestId('role'),
						text: Loc.getMessage('M_PROFILE_USER_ROLE_ROOT_ADMIN'),
						color: textColor,
						style: {
							marginTop: Indent.XS2.toNumber(),
						},
					}),
				);
			}

			return null;
		}
	}

	ProfileUserCard.propsTypes = {
		testId: PropTypes.string,
		user: PropTypes.object,
		currentTheme: PropTypes.string.isRequired,
		status: PropTypes.oneOf(Object.values(UserStatus)),
		GMTString: PropTypes.string,
		lastSeenDate: PropTypes.number,
		onVacationDateTo: PropTypes.string,
		personalGender: PropTypes.string,
		isBirthday: PropTypes.bool,
		onAvatarClick: PropTypes.func,
		clickable: PropTypes.bool,
	};

	module.exports = {
		ProfileUserCard,
	};
});
