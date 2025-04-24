/**
 * @module im/messenger/lib/element/chat-avatar
 */
jn.define('im/messenger/lib/element/chat-avatar', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Type } = require('type');
	const { Typography, Color } = require('tokens');
	const { Icon } = require('assets/icons');
	const { Theme } = require('im/lib/theme');
	const { merge } = require('utils/object');
	const { withCurrentDomain } = require('utils/url');
	const { getFirstLetters } = require('layout/ui/user/empty-avatar');

	const { Feature } = require('im/messenger/lib/feature');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper, UserHelper } = require('im/messenger/lib/helper');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { DialogType, UserType } = require('im/messenger/const');
	const { AvatarShape } = require('ui-system/blocks/avatar');
	const { ColorUtils } = require('im/messenger/lib/utils');

	const ASSET_PATH = '/bitrix/mobileapp/immobile/extensions/im/messenger/assets/common/png/';

	const AvatarDetailFields = Object.freeze({
		accentType: {
			orange: 'orange',
			green: 'green',
			blue: 'blue',
		},
		placeholderType: {
			auto: 'auto',
			letters: 'letters',
			svg: 'svg',
			none: 'none',
		},
	});

	const themeId = AppTheme.id;
	const DefaultUserNamedIcon = {
		[UserType.collaber]: `collab_user_${themeId}`,
		[UserType.extranet]: `extranet_user_${themeId}`,
		[UserType.user]: `default_user_${themeId}`,
	};

	/**
	 * @class ChatAvatar
	 */
	class ChatAvatar
	{
		/** @type {ColorUtils} */
		static #colorUtils;

		static get colorUtils()
		{
			this.#colorUtils ??= new ColorUtils();

			return this.#colorUtils;
		}

		/**
		 *
		 * @param {string || number} dialogId
		 * @param {object} options
		 * @return {ChatAvatar}
		 */
		static createFromDialogId(dialogId, options = {})
		{
			return new this(dialogId, options);
		}

		constructor(dialogId, options = {})
		{
			this.store = serviceLocator.get('core').getStore();
			this.messengerStore = serviceLocator.get('core').getMessengerStore();
			this.avatar = null;
			this.color = null;
			this.title = null;
			this.isSuperEllipseIcon = false;
			this.type = null;
			this.dialogId = dialogId;
			this.extranet = false;
			this.isCurrentUser = UserHelper.isCurrentUser(dialogId);

			if (DialogHelper.isDialogId(dialogId))
			{
				this.createDialogAvatar(dialogId);
			}
			else
			{
				this.createUserAvatar(dialogId);
			}
		}

		static getImagePath()
		{
			return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/lib/element/src/chat-avatar/images/`;
		}

		createDialogAvatar(dialogId)
		{
			const dialogModel = this.getDialogById(dialogId);
			if (!dialogModel)
			{
				return;
			}

			this.color = dialogModel.color;
			this.avatar = Type.isStringFilled(dialogModel.avatar) ? dialogModel.avatar : null;
			this.title = dialogModel.name;
			this.type = dialogModel.type;
			this.extranet = dialogModel.extranet;

			if (this.extranet)
			{
				this.color = Theme.colors.accentExtraOrange;
			}

			if (this.type === DialogType.collab)
			{
				this.color = Theme.colors.collabAccentPrimary;
			}

			if ([DialogType.generalChannel, DialogType.openChannel, DialogType.channel].includes(this.type))
			{
				this.isSuperEllipseIcon = true;
			}

			if (dialogModel.chatId === MessengerParams.getGeneralChatId())
			{
				this.avatar = `${ChatAvatar.getImagePath()}avatar_general_chat.png`;

				return;
			}

			if (this.type === DialogType.generalChannel)
			{
				this.avatar = `${ChatAvatar.getImagePath()}avatar_general_channel.png`;

				return;
			}

			if (dialogModel.entityType === 'SUPPORT24_QUESTION')
			{
				this.avatar = `${ChatAvatar.getImagePath()}avatar_support_24.png`;

				return;
			}

			if (this.type === DialogType.copilot)
			{
				this.avatar = this.getCopilotRoleAvatar(dialogModel.dialogId) || `${ChatAvatar.getImagePath()}avatar_copilot_assistant.png`;
			}
		}

		createUserAvatar(userId)
		{
			const user = this.getUserById(userId);
			if (!user)
			{
				return;
			}

			if (this.isUser(userId) && !user.lastActivityDate && !user.avatar)
			{
				this.avatar = `${ChatAvatar.getImagePath()}avatar_wait_air.png`;
				this.color = user.color;

				return;
			}

			this.avatar = Type.isStringFilled(user.avatar) ? user.avatar : null;
			this.color = user.color;
			if (user.type === UserType.collaber)
			{
				this.color = Theme.colors.collabAccentPrimary;
			}

			if (user.type === UserType.extranet)
			{
				this.color = Theme.colors.accentMainWarning;
			}

			this.title = user.name;
			this.type = DialogType.private;
		}

		/**
		 * @deprecated - use to AvatarDetail
		 * @return {ChatAvatarTitleParams}
		 */
		getTitleParams()
		{
			if (this.type === DialogType.comment)
			{
				return {};
			}

			const titleParams = {
				useLetterImage: true,
				isSuperEllipseIcon: this.isSuperEllipseIcon,
			};

			if (this.avatar)
			{
				titleParams.imageUrl = this.avatar;
			}

			if (this.color && (this.avatar === '' || this.avatar === null))
			{
				titleParams.imageColor = this.color;
			}

			return titleParams;
		}

		/**
		 * @deprecated - use to AvatarDetail
		 * @return {string | null}
		 */
		getAvatarUrl()
		{
			return this.avatar;
		}

		/**
		 * @return {AvatarDetail}
		 */
		getMentionAvatarProps()
		{
			const avatarProps = this.getAvatarProps();
			avatarProps.radius = Theme.corner.S.toNumber();
			avatarProps.placeholder.letters.fontSize = 13;

			return avatarProps;
		}

		/**
		 * @return {AvatarDetail}
		 */
		getMessageAvatarProps()
		{
			const avatarProps = this.getAvatarProps();
			avatarProps.placeholder.letters.fontSize = 15;

			return avatarProps;
		}

		/**
		 * @return {AvatarDetail}
		 */
		getRecentItemAvatarProps()
		{
			const avatarProps = this.getAvatarProps({
				placeholder: {
					svg: {
						size: 38,
					},
				},
			}, { useNotes: true });
			avatarProps.radius = Theme.corner.M.toNumber();

			return avatarProps;
		}

		/**
		 * @return {AvatarDetail}
		 */
		getDialogHeaderAvatarProps()
		{
			const avatarProps = this.getAvatarProps({
				placeholder: {
					svg: {
						size: 22,
					},
				},
			}, { useNotes: true });
			avatarProps.radius = Theme.corner.S.toNumber();
			avatarProps.placeholder.letters.fontSize = 12;

			return avatarProps;
		}

		/**
		 * @return {AvatarDetail}
		 */
		getSidebarTitleAvatarProps()
		{
			const avatarProps = this.getAvatarProps({
				placeholder: {
					svg: {
						size: 48,
					},
				},
			}, { useNotes: true });
			avatarProps.radius = Theme.corner.L.toNumber();
			avatarProps.placeholder.letters.fontSize = 30;
			avatarProps.style = this.#getSizeStyle(72);

			return avatarProps;
		}

		/**
		 * @return {AvatarDetail}
		 */
		getSidebarTabItemDescriptionAvatarProps()
		{
			return this.getAvatarProps({
				backBorderWidth: 1,
				placeholder: {
					letters: {
						fontSize: 8,
					},
				},
				style: this.#getSizeStyle(18),
			});
		}

		/**
		 * @return {AvatarDetail}
		 */
		getRecentSearchCarouselAvatarProps()
		{
			return this.getRecentItemAvatarProps();
		}

		/**
		 * @return {AvatarDetail}
		 */
		getRecentSearchItemAvatarProps()
		{
			const avatarProps = this.getAvatarProps({
				placeholder: {
					svg: {
						size: 28,
					},
				},
			}, { useNotes: true });
			avatarProps.radius = Theme.corner.S.toNumber();
			avatarProps.placeholder.letters.fontSize = 15;

			return avatarProps;
		}

		/**
		 * @return {AvatarDetail}
		 */
		getListItemAvatarProps(options = {})
		{
			const { useNotes } = options;
			const { fontSize } = Typography.h5.getValue();

			return this.getAvatarProps({
				placeholder: {
					letters: {
						fontSize,
					},
				},
				style: this.#getSizeStyle(40),
			}, { useNotes });
		}

		/**
		 * @return {AvatarDetail}
		 */
		getReactionAvatarProps()
		{
			return this.getAvatarProps({
				style: this.#getSizeStyle(18),
				placeholder: {
					letters: null,
				},
			});
		}

		/**
		 * @return {AvatarDetail}
		 */
		getMessageCommentInfoAvatarProps()
		{
			return this.getAvatarProps({
				style: this.#getSizeStyle(28),
				placeholder: {
					letters: null,
				},
			});
		}

		/**
		 * @private
		 * @param {Partial<AvatarDetail>} customAvatarProps
		 * @param {boolean} useNotes
		 * @return {AvatarDetail}
		 */
		getAvatarProps(customAvatarProps = {}, { useNotes = false } = {})
		{
			if (useNotes && this.isCurrentUser)
			{
				return this.getAvatarNotesProps(customAvatarProps.placeholder?.svg?.size);
			}

			// eslint-disable-next-line init-declarations
			let avatarProps;
			if (DialogHelper.isDialogId(this.dialogId))
			{
				avatarProps = this.getChatAvatarProps();
			}
			else
			{
				avatarProps = this.getUserAvatarProps();
			}

			return merge(avatarProps, customAvatarProps);
		}

		/**
		 * @private
		 * @return {AvatarDetail}
		 */
		getChatAvatarProps()
		{
			switch (this.type)
			{
				case DialogType.collab:
				{
					return this.#getAvatarCollabFields();
				}

				case DialogType.channel:
				case DialogType.comment:
				case DialogType.generalChannel:
				case DialogType.openChannel:
				{
					return this.#getAvatarChannelFields();
				}

				default:
				{
					return this.#getAvatarChatFields();
				}
			}
		}

		/**
		 * @private
		 * @return {AvatarDetail}
		 */
		getUserAvatarProps()
		{
			const user = this.getUserById(this.dialogId);
			if (!user)
			{
				return this.#getAvatarUserFields();
			}

			// eslint-disable-next-line sonarjs/no-small-switch
			switch (user.type)
			{
				case UserType.collaber:
				{
					return this.#getAvatarCollaberFields();
				}

				case UserType.extranet:
				{
					return this.#getAvatarExtranetFields();
				}

				default:
				{
					return this.#getAvatarUserFields();
				}
			}
		}

		/**
		 * @param {number} size
		 * @return {AvatarDetail}
		 */
		getAvatarNotesProps(size = 38) {
			const defaultFields = this.#getAvatarDefaultFields();

			if (!Feature.isNotesIconAvailable)
			{
				return {
					...defaultFields,
					uri: withCurrentDomain(`${ASSET_PATH}favorite_avatar.png`),
					placeholder: {
						...defaultFields.placeholder,
						backgroundColor: Color.accentMainPrimaryalt.toHex(),
					},
				};
			}

			return {
				...defaultFields,
				uri: null,
				placeholder: {
					...defaultFields.placeholder,
					type: AvatarDetailFields.placeholderType.svg,
					backgroundColor: Color.accentMainPrimaryalt.toHex(),
					svg: {
						named: Icon.BOOKMARK.getIconName(),
						tintColor: Color.baseWhiteFixed.toHex(),
						size,
					},
				},
			};
		}

		/**
		 * @private
		 * @return {AvatarDetail}
		 */
		#getAvatarCollabFields()
		{
			const defaultFields = this.#getAvatarDefaultFields();

			return {
				...defaultFields,
				...this.#getCollabFields(),
				type: AvatarShape.HEXAGON.value,
			};
		}

		/**
		 * @private
		 * @return {AvatarDetail}
		 */
		#getAvatarCollaberFields()
		{
			const defaultFields = this.#getAvatarDefaultFields();

			return { ...defaultFields, ...this.#getCollabFields() };
		}

		/**
		 * @private
		 * @return {AvatarDetail}
		 */
		#getAvatarExtranetFields()
		{
			const defaultFields = this.#getAvatarDefaultFields();

			return { ...defaultFields, ...this.#getExtranetFields() };
		}

		/**
		 * @returns {Partial<AvatarDetail>}
		 */
		#getExtranetFields()
		{
			return {
				accentType: AvatarDetailFields.accentType.orange,
				hideOutline: false,
				backBorderWidth: 2,
			};
		}

		/**
		 * @returns {Partial<AvatarDetail>}
		 */
		#getCollabFields()
		{
			return {
				accentType: AvatarDetailFields.accentType.green,
				hideOutline: false,
				backBorderWidth: 2,
			};
		}

		/**
		 * @private
		 * @return {AvatarDetail}
		 */
		#getAvatarChannelFields()
		{
			const defaultFields = this.#getAvatarDefaultFields();
			/** @type {Partial<AvatarDetail>} */
			const channelFields = {
				type: AvatarShape.SQUARE.value,
				radius: Theme.corner.S.toNumber(),
			};

			if (this.extranet)
			{
				return {
					...defaultFields,
					...channelFields,
					...this.#getExtranetFields(),
					hideOutline: true,
				};
			}

			return { ...defaultFields, ...channelFields };
		}

		/**
		 * @private
		 * @return {AvatarDetail}
		 */
		#getAvatarChatFields()
		{
			const defaultFields = this.#getAvatarDefaultFields();

			if (this.extranet)
			{
				return {
					...defaultFields,
					...this.#getExtranetFields(),
					hideOutline: true,
				};
			}

			return defaultFields;
		}

		/**
		 * @private
		 * @return {AvatarDetail}
		 */
		#getAvatarUserFields()
		{
			return this.#getAvatarDefaultFields();
		}

		/**
		 * @private
		 * @return {AvatarDetail}
		 */
		#getAvatarDefaultFields()
		{
			const defaultFields = ChatAvatar.#defaultAvatarFields;
			defaultFields.uri = this.avatar;
			defaultFields.title = this.title;
			defaultFields.placeholder.backgroundColor = this.color;

			if (!this.checkIsFirstLettersValid())
			{
				const {
					type: placeholderType,
					svg: placeholderSvg,
				} = this.#getDefaultPlaceholder();
				defaultFields.placeholder.type = placeholderType;
				defaultFields.placeholder.svg = placeholderSvg;
			}

			return defaultFields;
		}

		/**
		 * @private
		 * @returns {boolean}
		 */
		checkIsFirstLettersValid()
		{
			return Boolean(getFirstLetters(this.title));
		}

		/**
		 *
		 * @return {string | null}
		 */
		getColor()
		{
			return this.color;
		}

		/**
		 * @deprecated
		 * @return {boolean}
		 */
		getIsSuperEllipseIcon()
		{
			return this.isSuperEllipseIcon;
		}

		isUser(userId)
		{
			const user = this.getUserById(userId);

			return !user.bot && !user.network && !user.connector;
		}

		/**
		 * @desc get name copilot role
		 * @param {string} dialogId
		 * @return {string|null}
		 * @private
		 */
		getCopilotRoleAvatar(dialogId)
		{
			const copilotMainRole = this.store.getters['dialoguesModel/copilotModel/getMainRoleByDialogId'](dialogId);

			return copilotMainRole?.avatar?.small ? encodeURI(copilotMainRole?.avatar?.small) : null;
		}

		/**
		 * @return {object}
		 */
		static get #defaultAvatarFields()
		{
			const { accentType, placeholderType } = AvatarDetailFields;

			return {
				type: AvatarShape.CIRCLE.value,
				polygonAngle: 30, // only IOS
				radius: 0,
				accentType: accentType.blue,
				backBorderWidth: 0,
				backColor: '#ffffff', // only IOS
				hideOutline: true,
				uri: null,
				title: '',
				placeholder: {
					type: placeholderType.auto,
					backgroundColor: '#ffffff',
					letters: {
						fontSize: 20,
					},
				},
			};
		}

		/**
		 * @private
		 * @param userId
		 * @return {?UsersModelState|null}
		 */
		getUserById(userId)
		{
			const user = this.store.getters['usersModel/getById'](userId);
			if (user)
			{
				return user;
			}

			const messengerUser = this.messengerStore.getters['usersModel/getById'](userId);
			if (messengerUser)
			{
				return messengerUser;
			}

			return null;
		}

		/**
		 * @private
		 * @param dialogId
		 * @return {?DialoguesModelState|null}
		 */
		getDialogById(dialogId)
		{
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			if (dialog)
			{
				return dialog;
			}

			const messengerDialog = this.messengerStore.getters['dialoguesModel/getById'](dialogId);
			if (messengerDialog)
			{
				return messengerDialog;
			}

			return null;
		}

		#getDefaultUserNamedIcon()
		{
			const user = this.store.getters['usersModel/getById'](this.dialogId);

			switch (user?.type)
			{
				case UserType.extranet:
				case UserType.collaber:
				{
					return DefaultUserNamedIcon[user.type];
				}

				default:
				{
					return DefaultUserNamedIcon[UserType.user];
				}
			}
		}

		#getDefaultPlaceholder()
		{
			const { placeholderType } = AvatarDetailFields;

			return {
				type: placeholderType.svg,
				svg: {
					named: this.#getDefaultUserNamedIcon(),
				},
			};
		}

		/**
		 * @param {number} size
		 * @returns {{width, height}}
		 */
		#getSizeStyle(size)
		{
			return {
				width: Number(size),
				height: Number(size),
			};
		}
	}

	module.exports = {
		ChatAvatar,
	};
});
