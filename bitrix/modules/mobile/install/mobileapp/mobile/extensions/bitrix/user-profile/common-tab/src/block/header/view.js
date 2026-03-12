/**
 * @module user-profile/common-tab/src/block/header/view
 */
jn.define('user-profile/common-tab/src/block/header/view', (require, exports, module) => {
	const { Avatar } = require('ui-system/blocks/avatar');
	const { H3 } = require('ui-system/typography/heading');
	const { Text5 } = require('ui-system/typography/text');
	const { ButtonSize, ButtonDesign, Button } = require('ui-system/form/buttons/button');
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc');
	const { createTestIdGenerator } = require('utils/test');
	const { Type } = require('type');
	const { Icon } = require('ui-system/blocks/icon');
	const { DialogOpener } = require('im/messenger/api/dialog-opener');
	const { UserStatus } = require('user-profile/common-tab/src/block/header/const');
	const { BadgeButton, BadgeButtonDesign, BadgeButtonSize } = require('ui-system/blocks/badges/button');
	const { AvatarPicker } = require('avatar-picker');
	const { Alert } = require('alert');
	const { ProfileUserCard } = require('user-profile/common-tab/src/block/header/user-card');
	const { UserProfileAnalytics } = require('user-profile/analytics');
	const { showToast } = require('toast');
	const { ReinviteEntry } = require('intranet/reinvite/entry');
	const { PropTypes } = require('utils/validation');
	const { isCloudAccount } = require('user/account');

	const { dispatch } = require('statemanager/redux/store');
	const { connect } = require('statemanager/redux/connect');
	const { usersSelector } = require('statemanager/redux/slices/users');
	const { reinviteWithChangeContact, reinvite } = require('intranet/statemanager/redux/slices/employees/thunk');
	const { getChatId } = require('user-profile/api');

	/**
	 * @typedef {Object} HeaderProps
	 * @property {number} ownerId
	 * @property {number} id
	 * @property {string} fullName
	 * @property {string} workPosition
	 * @property {Object} image
	 * @property {string} image.previewUrl
	 * @property {string} image.originalImage
	 * @property {boolean} isCollaber
	 * @property {boolean} isExtranet
	 * @property {string} GMTString
	 * @property {number} lastSeenDate
	 * @property {string} personalGender
	 * @property {string} onVacationDateTo
	 * @property {boolean} isBirthday
	 * @property {Object} currentTheme
	 * @property {UserStatus} status
	 * @property {Object} inviteSettings
	 * @property {boolean} isEditMode
	 * @property {function} onChange
	 * @property {Object} parentWidget
	 *
	 * @class Header
	 */
	class Header extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'header-block',
				context: this,
			});
			this.avatarPicker = new AvatarPicker();

			this.#initState(props);
		}

		componentWillReceiveProps(props)
		{
			this.#initState(props);
		}

		#initState(props)
		{
			const { status: oldStatus } = this.state;
			const { status: newStatus, image } = props;

			this.state = {
				image: image ?? null,
				status: oldStatus === UserStatus.REINVITED && newStatus === UserStatus.INVITED ? oldStatus : newStatus,
			};
		}

		render()
		{
			const { isEditMode } = this.props;
			const editStyles = (
				isEditMode
					? {
						paddingTop: Indent.XL.toNumber(),
						paddingBottom: Indent.XL2.toNumber(),
					}
					: {}
			);

			return View(
				{
					style: {
						...editStyles,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				this.#renderProfileUserCard(),
				!isEditMode && this.#renderButtons(),
			);
		}

		#renderProfileUserCard()
		{
			if (this.props.isEditMode)
			{
				return View(
					{
						style: {
							flexDirection: 'row',
						},
					},
					this.#renderAvatar(),
					this.#renderTextContent(),
				);
			}

			const {
				id,
				fullName,
				isExtranet,
				isCollaber,
				workPosition,
				currentTheme,
				GMTString,
				lastSeenDate,
				personalGender,
				onVacationDateTo,
				isBirthday,
				isRootAdmin,
			} = this.props;
			const { status } = this.state;

			return new ProfileUserCard({
				testId: this.getTestId('profile-user-card'),
				user: {
					id,
					fullName,
					isExtranet,
					isCollaber,
					workPosition,
					isRootAdmin,
				},
				currentTheme,
				GMTString,
				lastSeenDate,
				personalGender,
				onVacationDateTo,
				isBirthday,
				status,
				clickable: false,
				onAvatarClick: this.#showAvatarInViewer,
			});
		}

		#renderAvatar()
		{
			return View(
				{
					testId: this.getTestId('avatar-container'),
					onClick: this.#pickAvatar,
				},
				Avatar({
					testId: this.getTestId('avatar-edit'),
					size: 84,
					accent: false,
					uri: this.state.image?.previewUrl ?? null,
				}),
				this.#renderEditAvatarButton(),
			);
		}

		#renderEditAvatarButton()
		{
			return View(
				{
					style: {
						position: 'absolute',
						top: 0,
						right: 0,
					},
				},
				BadgeButton({
					testId: this.getTestId('edit-badge-button'),
					size: BadgeButtonSize.XL,
					icon: Icon.EDIT,
					design: BadgeButtonDesign.WHITE,
				}),
			);
		}

		#renderTextContent()
		{
			return View(
				{
					testId: this.getTestId('content-container'),
					style: {
						flex: 1,
						justifyContent: 'center',
						paddingLeft: Indent.XL2.toNumber(),
					},
				},
				this.#renderFullName(),
				this.#renderWorkPosition(),
			);
		}

		#renderFullName()
		{
			return H3({
				testId: this.getTestId('full-name'),
				accent: true,
				color: this.#getFullNameColor(),
				text: this.props.fullName,
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

		#pickAvatar = () => {
			this.avatarPicker.open()
				.then((image) => {
					if (image)
					{
						this.setState({ image }, () => {
							this.props.onChange?.('header', { image });
							UserProfileAnalytics.sendEditPhoto();
						});
					}
				})
				.catch((err) => {
					console.error(err);
					Alert.alert(
						Loc.getMessage('M_PROFILE_AVATAR_CHOOSE_ERROR_TITLE'),
						Loc.getMessage('M_PROFILE_AVATAR_CHOOSE_ERROR_TEXT'),
						() => {},
					);
				})
			;
		};

		#showAvatarInViewer = () => {
			const { image } = this.state;
			const { fullName } = this.props;
			const url = image?.originalImage ?? image?.previewUrl;
			if (url)
			{
				viewer.openImage(url, fullName);
			}
		};

		#getFullNameColor()
		{
			const { isCollaber, isExtranet } = this.props;

			if (isCollaber)
			{
				return Color.collabAccentPrimaryAlt;
			}

			if (isExtranet)
			{
				return Color.accentExtraOrange;
			}

			return Color.base1;
		}

		#renderButtons()
		{
			return View(
				{
					testId: this.getTestId('buttons-view'),
					style: {
						flexDirection: 'row',
						marginTop: Indent.XL2.toNumber(),
					},
				},
				...this.#getButtons(),
			);
		}

		#getButtons()
		{
			const { status } = this.state;

			if (status === UserStatus.FIRED)
			{
				return [
					Button({
						testId: this.getTestId('chat-button'),
						text: Loc.getMessage('M_PROFILE_HEADER_CHAT_BUTTON_FIRED_TEXT'),
						design: ButtonDesign.OUTLINE_ACCENT_2,
						size: ButtonSize.L,
						stretched: true,
						onClick: this.#openChat,
					}),
				];
			}

			if (status === UserStatus.INVITED || status === UserStatus.REINVITED)
			{
				return [
					Button({
						style: {
							marginRight: Indent.XL.toNumber(),
						},
						testId: this.getTestId('chat-button'),
						design: ButtonDesign.OUTLINE_ACCENT_2,
						size: ButtonSize.L,
						leftIcon: Icon.MESSAGE,
						onClick: this.#openChat,
					}),
					Button({
						style: {
							flex: 1,
						},
						testId: this.getTestId('reinvite-button'),
						text: Loc.getMessage('M_PROFILE_HEADER_REINVITE_BUTTON_TEXT'),
						disabled: status === UserStatus.REINVITED || !this.props.inviteSettings.canCurrentUserInvite,
						design: ButtonDesign.FILLED,
						size: ButtonSize.L,
						stretched: true,
						onClick: this.#onReinviteButtonClick,
					}),
				];
			}

			const isCurrentUserProfile = Number(this.props.id) === Number(env.userId);
			if (isCurrentUserProfile)
			{
				return [
					Button({
						testId: this.getTestId('notes-button'),
						text: Loc.getMessage('M_PROFILE_HEADER_NOTES_BUTTON_TEXT'),
						design: ButtonDesign.OUTLINE_ACCENT_2,
						size: ButtonSize.L,
						stretched: true,
						leftIcon: Icon.BOOKMARK,
						onClick: this.#openChat,
					}),
				];
			}

			return [
				Button({
					style: {
						flex: 1,
						marginRight: Indent.XL2.toNumber(),
					},
					testId: this.getTestId('chat-button'),
					text: Loc.getMessage('M_PROFILE_HEADER_CHAT_BUTTON_TEXT'),
					design: ButtonDesign.OUTLINE_ACCENT_2,
					size: ButtonSize.L,
					stretched: true,
					onClick: this.#openChat,
				}),
				Button({
					style: {
						flex: 1,
					},
					testId: this.getTestId('video-call-button'),
					text: Loc.getMessage('M_PROFILE_HEADER_VIDEO_CALL_BUTTON_TEXT'),
					design: ButtonDesign.FILLED,
					size: ButtonSize.L,
					stretched: true,
					onClick: this.#createCall,
				}),
			];
		}

		#openChat = () => DialogOpener.open({ dialogId: this.props.id });

		#onReinviteButtonClick = () => {
			const userId = this.props.id;

			if (!isCloudAccount())
			{
				dispatch(
					reinvite({ userId }),
				);
				this.#onReinviteSent();

				return;
			}

			void ReinviteEntry.tryToOpenReinvite({
				userId,
				parentWidget: this.props.parentWidget,
				onSave: (newValue, valueType) => {
					dispatch(
						reinviteWithChangeContact({
							userId,
							[valueType]: newValue,
						}),
					);
					this.#onReinviteSent();
				},
			});
		};

		#onReinviteSent = () => {
			showToast({
				message: Loc.getMessage('M_PROFILE_HEADER_REINVITE_TOAST'),
				iconName: Icon.MESSAGE_TO.getIconName(),
			});
			this.setState({ status: UserStatus.REINVITED });
		};

		#createCall = async () => {
			const { id, fullName, image } = this.props;

			let chatId = null;

			try
			{
				chatId = await getChatId(id);
			}
			catch (error)
			{
				console.error('[UserProfile][createCall] Failed to get chatId:', error);

				return;
			}

			if (!chatId)
			{
				console.error('[UserProfile][createCall] chatId is empty');

				return;
			}

			const eventData = {
				userId: id,
				video: true,
				chatData: {
					dialogId: id,
					chatId,
					name: fullName,
					avatar: image.previewUrl,
				},
				userData: {
					[id]: {
						id,
						name: fullName,
						avatar: image.previewUrl,
					},
				},
			};

			BX.postComponentEvent('onCallInvite', [eventData], 'calls');
		};
	}

	Header.propTypes = {
		ownerId: PropTypes.number.isRequired,
		id: PropTypes.number.isRequired,
		fullName: PropTypes.string.isRequired,
		workPosition: PropTypes.string.isRequired,
		image: PropTypes.shape({
			previewUrl: PropTypes.string,
			originalImage: PropTypes.string,
		}).isRequired,
		isCollaber: PropTypes.bool,
		isExtranet: PropTypes.bool,
		GMTString: PropTypes.string,
		lastSeenDate: PropTypes.number,
		personalGender: PropTypes.string,
		onVacationDateTo: PropTypes.string,
		isBirthday: PropTypes.bool,
		currentTheme: PropTypes.object.isRequired,
		status: PropTypes.oneOf(Object.values(UserStatus)),
		inviteSettings: PropTypes.object.isRequired,
		isEditMode: PropTypes.bool.isRequired,
		onChange: PropTypes.func.isRequired,
		parentWidget: PropTypes.object.isRequired,
	};

	const mapStateToProps = (state, { ownerId }) => {
		const {
			id,
			fullName,
			workPosition,
			avatarSize100,
			avatarSizeOriginal,
			isCollaber,
			isExtranet,
			isRootAdmin,
		} = usersSelector.selectById(state, ownerId);

		return {
			id,
			fullName,
			workPosition,
			isCollaber,
			isExtranet,
			isRootAdmin,
			image: {
				previewUrl: avatarSize100,
				originalImage: avatarSizeOriginal,
			},
		};
	};

	module.exports = {
		Header: connect(mapStateToProps)(Header),
	};
});
