/**
 * @module user-profile/common-tab/block/header
 */
jn.define('user-profile/common-tab/block/header', (require, exports, module) => {
	const { Avatar } = require('ui-system/blocks/avatar');
	const { connect } = require('statemanager/redux/connect');
	const { usersSelector } = require('statemanager/redux/slices/users');
	const { Area } = require('ui-system/layout/area');
	const { H3 } = require('ui-system/typography/heading');
	const { Text5, Text6 } = require('ui-system/typography/text');
	const { BBCodeText } = require('ui-system/typography/bbcodetext');
	const { ButtonSize, ButtonDesign, Button } = require('ui-system/form/buttons/button');
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc');
	const { createTestIdGenerator } = require('utils/test');
	const { Type } = require('type');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { DialogOpener } = require('im/messenger/api/dialog-opener');
	const { FriendlyDate } = require('layout/ui/friendly-date');
	const { FormatterTypes } = require('layout/ui/friendly-date/formatter-factory');
	const { Moment } = require('utils/date');
	const store = require('statemanager/redux/store');
	const { UserStatus } = require('user-profile/common-tab/enum/user-status');

	/**
	 * @typedef {Object} HeaderBlockProps
	 * @property {number} id
	 * @property {string} fullName
	 * @property {string} workPosition
	 * @property {string} statusText
	 * @property {string} GMTString
	 * @property {Date} lastSeenDate
	 * @property {string} personalGender
	 * @property {string} onVacationDateTo
	 * @property {string} status
	 * @property {string} [testId]

	 * @class HeaderBlock
	 */
	class HeaderBlock extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.getTestId = createTestIdGenerator({
				prefix: 'header-block',
				context: this,
			});
		}

		get personalGender()
		{
			const { personalGender } = this.props;
			if (personalGender === 'M' || personalGender === 'F')
			{
				return personalGender;
			}

			return null;
		}

		render()
		{
			return Area(
				{
					style: {
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
					testId: this.getTestId('area'),
					isFirst: true,
				},
				View(
					{},
					View(
						{
							style: {
								flexDirection: 'row',
							},
						},
						this.#renderAvatar(),
						this.#renderTextContent(),
					),
					this.#renderButtons(),
				),
			);
		}

		#renderAvatar = () => {
			const { id } = this.props;

			return View(
				{
					testId: this.getTestId('avatar-container'),
				},
				Avatar({
					testId: this.getTestId('avatar'),
					id,
					size: 84,
					withRedux: true,
					accent: true,
				}),
				this.#renderStatusIcon(),
			);
		};

		#renderStatusIcon()
		{
			const { status } = this.props;
			const size = 30;

			return View(
				{
					testId: this.getTestId('status-icon-container'),
					style: {
						position: 'absolute',
						bottom: 0,
						right: 0,
						height: size,
						width: size,
						zIndex: 1,
						backgroundColor: Color.baseWhiteFixed.toHex(),
						borderRadius: size / 2,
					},
				},
				IconView({
					testId: this.getTestId('status-icon'),
					icon: status.getIcon(),
					color: status.getIconColor(),
					size,
				}),
			);
		}

		#renderTextContent()
		{
			return View(
				{
					testId: this.getTestId('avatar'),
					style: {
						paddingLeft: Indent.XL2.toNumber(),
						justifyContent: 'center',
						flex: 1,
					},
				},
				this.#renderFullName(),
				this.#renderWorkPosition(),
				this.#renderStatusText(),
			);
		}

		#renderFullName()
		{
			const { fullName } = this.props;

			return H3({
				testId: this.getTestId('full-name'),
				accent: true,
				color: Color.base1,
				text: fullName,
			});
		}

		#renderWorkPosition()
		{
			const { workPosition } = this.props;
			if (Type.isNil(workPosition) || workPosition === '')
			{
				return null;
			}

			return Text5({
				testId: this.getTestId('work-position'),
				text: workPosition,
				color: Color.base2,
				style: {
					marginTop: Indent.XS2.toNumber(),
				},
			});
		}

		#renderStatusText()
		{
			const { status, lastSeenDate } = this.props;
			if ((status === UserStatus.OFFLINE || status === UserStatus.ONLINE) && !Type.isNil(lastSeenDate))
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
						renderContent: this.#renderOfflineStatusFriendlyDateContent,
					}),
				);
			}

			return BBCodeText({
				testId: this.getTestId('status-text'),
				value: this.#getStatusText(),
				color: Color.base3,
				size: 6,
				style: {
					marginTop: Indent.XS2.toNumber(),
				},
			});
		}

		#renderOfflineStatusFriendlyDateContent = ({ state }) => {
			const text = Type.isNil(this.personalGender)
				? Loc.getMessage('M_PROFILE_USER_STATUS_OFFLINE_WITH_TIME_NO_GENDER', {
					'#DATE#': state.text,
				})
				: Loc.getMessage(`M_PROFILE_USER_STATUS_OFFLINE_WITH_TIME_${this.personalGender}`, {
					'#DATE#': state.text,
				});

			return Text6({
				text,
				color: Color.base3,
			});
		};

		#getStatusText()
		{
			const {
				GMTString,
				onVacationDateTo,
				status,
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
						'#COLOR#': Color.base5,
						'#GMT#': GMTString,
					});
				case UserStatus.ONLINE:
					return Loc.getMessage('M_PROFILE_USER_STATUS_ONLINE', {
						'#COLOR#': Color.base5,
						'#GMT#': GMTString,
					});
				case UserStatus.OFFLINE:
					return Loc.getMessage('M_PROFILE_USER_STATUS_OFFLINE');
				default:
					return '';
			}
		}

		#renderButtons()
		{
			const { status } = this.props;
			const isFiredUser = status === UserStatus.FIRED;
			const isProfileOfCurrentUser = this.#isProfileOfCurrentUser();

			return View(
				{
					testId: this.getTestId('buttons-view'),
					style: {
						flexDirection: 'row',
						marginTop: Indent.XL2.toNumber(),
					},
				},
				isProfileOfCurrentUser && Button({
					testId: this.getTestId('notes-button'),
					text: Loc.getMessage('M_PROFILE_HEADER_NOTES_BUTTON_TEXT'),
					design: ButtonDesign.OUTLINE_ACCENT_2,
					size: ButtonSize.L,
					stretched: true,
					leftIcon: Icon.BOOKMARK,
					onClick: this.#onNotesButtonClick,
				}),
				!isProfileOfCurrentUser && Button({
					testId: this.getTestId('chat-button'),
					text: isFiredUser
						? Loc.getMessage('M_PROFILE_HEADER_CHAT_BUTTON_FIRED_TEXT')
						: Loc.getMessage('M_PROFILE_HEADER_CHAT_BUTTON_TEXT'),
					design: ButtonDesign.OUTLINE_ACCENT_2,
					size: ButtonSize.L,
					stretched: true,
					style: {
						marginRight: Indent.XL.toNumber(),
						flex: 1,
					},
					onClick: this.#onChatButtonClick,
				}),
				!isProfileOfCurrentUser && !isFiredUser && Button({
					testId: this.getTestId('video-call-button'),
					text: Loc.getMessage('M_PROFILE_HEADER_VIDEO_CALL_BUTTON_TEXT'),
					design: ButtonDesign.FILLED,
					size: ButtonSize.L,
					stretched: true,
					style: {
						flex: 1,
					},
					onClick: this.#onVideoCallButtonClick,
				}),
			);
		}

		#onVideoCallButtonClick = () => {
			this.createCall();
		};

		createCall()
		{
			const { id } = this.props;
			const calleeUser = usersSelector.selectById(store.getState(), id);
			const chatData = {
				dialogId: id,
				name: calleeUser.fullName,
				avatar: calleeUser.avatarSize100,
			};
			const eventData = {
				userId: id,
				video: true,
				chatData,
			};

			BX.postComponentEvent('onCallInvite', [eventData], 'calls');
		}

		#onNotesButtonClick = () => {
			void DialogOpener.open({
				dialogId: env.userId,
			});
		};

		#onChatButtonClick = () => {
			const { id } = this.props;

			void DialogOpener.open({
				dialogId: id,
			});
		};

		#isProfileOfCurrentUser()
		{
			const { id } = this.props;

			return String(id) === String(env.userId);
		}
	}

	const mapStateToProps = (state, {
		ownerId,
		GMTString,
		lastSeenDate,
		onVacationDateTo,
		status,
	}) => {
		const {
			id,
			fullName,
			workPosition,
		} = usersSelector.selectById(state, ownerId);

		return {
			id,
			fullName,
			workPosition,
			GMTString,
			lastSeenDate,
			onVacationDateTo,
			status,
		};
	};

	module.exports = {
		HeaderBlock: connect(mapStateToProps)(HeaderBlock),
	};
});
