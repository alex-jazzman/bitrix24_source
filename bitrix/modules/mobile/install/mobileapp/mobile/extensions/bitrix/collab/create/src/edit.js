/**
 * @module collab/create/src/edit
 */
jn.define('collab/create/src/edit', (require, exports, module) => {
	const { Alert } = require('alert');
	const { Box } = require('ui-system/layout/box');
	const { Button, ButtonSize } = require('ui-system/form/buttons');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Indent, Color, Component } = require('tokens');
	const { Loc } = require('loc');
	const { Link4, LinkMode, Ellipsize } = require('ui-system/blocks/link');
	const { CollabImage } = require('collab/create/src/image');
	const { StringInput, InputDesign, InputMode, InputSize } = require('ui-system/form/inputs/string');
	const { SettingSelectorList, SettingSelectorListItemDesign } = require('layout/ui/setting-selector-list');
	const { AvatarPicker } = require('avatar-picker');
	const { debounce } = require('utils/function');
	const { TextAreaInput } = require('ui-system/form/inputs/textarea');
	const { capitalize } = require('utils/string');
	const { MessagesAutoDeleteContextMenu } = require('im/messenger/lib/ui/context-menu/messages-auto-delete');
	const { MessagesAutoDeleteDelay } = require('im/messenger/const');
	const { Haptics } = require('haptics');
	const { showToast } = require('toast');
	const { Icon } = require('assets/icons');

	const helpArticleCode = '22706878';
	const CollabSettingsItem = {
		PERMISSIONS: 'permissions',
		SECURITY: 'security',
		TASK_PERMISSIONS: 'taskPermissions',
		AUTO_DELETE_MESSAGES: 'autoDeleteMessages',
	};

	/**
	 * @typedef {Object} CollabCreateEditProps
	 * @property {string} testId
	 * @property {string} name
	 * @property {string} description
	 * @property {string} image
	 * @property {boolean} isEditMode
	 * @property {function} onChange
	 * @property {function} onCreateButtonClick
	 * @property {function} onSettingsItemClick

	 * @class CollabCreateEdit
	 */
	class CollabCreateEdit extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.#initializeState(props);

			this.settingsSelectorItemsRefsMap = new Map();
			this.nameFieldRef = null;
			this.descriptionFieldRef = null;
			this.imageSelectorRef = null;
			this.avatarPicker = new AvatarPicker();
			this.scrollViewRef = null;

			this.debounceGetIsCollabNameExistsStatus = debounce(this.#getIsCollabNameExistsStatus, 500);
			this.onChangeDelay = this.onChangeDelay.bind(this);
		}

		get testId()
		{
			return `${this.props.testId}-edit`;
		}

		componentDidMount()
		{
			const { isEditMode } = this.props;
			if (!isEditMode)
			{
				this.#focusOnNameField(500);
			}

			if (this.state.name !== '')
			{
				void this.#getIsCollabNameExistsStatus(this.state.name);
			}
		}

		componentWillReceiveProps(props)
		{
			this.#initializeState(props);
		}

		#initializeState(props)
		{
			this.state = {
				name: props.name ?? '',
				isCollabNameExists: null,
				description: props.description ?? '',
				image: props.image ?? null,
				pending: false,
				messagesAutoDeleteDelay: props.messagesAutoDeleteDelay
					? Number(props.messagesAutoDeleteDelay)
					: MessagesAutoDeleteDelay.off,
			};
		}

		render()
		{
			return Box(
				{
					testId: `${this.testId}-main-screen-box`,
					resizableByKeyboard: true,
					footer: this.#renderSaveButton(),
					onClick: this.#hideKeyboard,
				},
				this.#renderEditableFields(),
			);
		}

		#hideKeyboard = () => {
			Keyboard.dismiss();
		};

		#getIsCollabNameExistsStatus = async (name) => {
			try
			{
				const response = await BX.ajax.runAction('mobile.Collab.getIsCollabNameExistsStatus', {
					json: {
						name,
					},
				}).catch((result) => result);
				if (response.status !== 'success')
				{
					return;
				}

				const { isExists, name: requestedName } = response.data;
				if (requestedName !== this.state.name)
				{
					return;
				}

				let isCollabNameExists = isExists;
				let pending = this.state.pending;

				if (pending)
				{
					if (isCollabNameExists)
					{
						pending = false;
					}
					else
					{
						this.props.onCreateButtonClick?.(this.disablePending);
					}
				}

				const isInitialName = this.props.name === name;
				const { isEditMode } = this.props;
				if (isEditMode && isInitialName)
				{
					isCollabNameExists = false;
				}

				if (this.state.isCollabNameExists === isCollabNameExists && this.state.pending === pending)
				{
					return;
				}

				this.setState({
					isCollabNameExists,
					pending,
				});
			}
			catch (error)
			{
				console.error(error);
			}
		};

		#renderEditableFields()
		{
			return AreaList(
				{
					testId: `${this.testId}-area-list`,
					ref: this.#bindScrollViewRef,
					resizableByKeyboard: true,
					showsVerticalScrollIndicator: true,
				},
				this.#renderImageWithNameInput(),
				this.#renderDescriptionTextArea(),
				this.#renderSettings(),
			);
		}

		#bindScrollViewRef = (ref) => {
			this.scrollViewRef = ref;
		};

		#renderImageWithNameInput = () => {
			return Area(
				{
					isFirst: true,
					style: {
						flexDirection: 'row',
						alignItems: 'flex-start',
					},
				},
				CollabImage({
					onClick: this.#onImageClick,
					ref: this.#bindImageSelectorRef,
					url: this.state.image?.previewUrl,
				}),
				View(
					{
						style: {
							height: 60,
							flex: 1,
							paddingLeft: Indent.XL2.getValue(),
						},
					},
					StringInput({
						forwardRef: this.#bindNameFieldRef,
						testId: `${this.testId}-name-input`,
						size: InputSize.L,
						value: this.state.name,
						error: this.state.isCollabNameExists,
						errorText: this.state.isCollabNameExists ? Loc.getMessage('M_COLLAB_CREATE_COLLAB_NAME_EXISTS') : '',
						placeholder: Loc.getMessage('M_COLLAB_CREATE_COLLAB_NAME_PLACEHOLDER'),
						onChange: this.#onChangeName,
						design: InputDesign.LIGHT_GREY,
						mode: InputMode.STROKE,
						onSubmit: this.#nameInputOnSubmit,
					}),
				),
			);
		};

		#nameInputOnSubmit = () => {
			if (this.descriptionFieldRef && this.scrollViewRef)
			{
				this.descriptionFieldRef?.contentFieldRef?.focus?.();
				const { y } = this.scrollViewRef.getPosition(this.descriptionFieldRef.contentFieldRef);
				// todo: fix after getPosition method native fix
				const positionY = Application.getPlatform() === 'ios' ? y - 20 : y - 140;
				this.scrollViewRef.scrollTo({ y: positionY, animated: true });
			}
		};

		#renderDescriptionTextArea = () => {
			return Area(
				{},
				TextAreaInput({
					testId: `${this.testId}-description-textarea`,
					ref: this.#bindDescriptionFieldRef,
					value: this.state.description,
					size: InputSize.M,
					placeholder: Loc.getMessage('M_COLLAB_CREATE_COLLAB_DESCRIPTION_PLACEHOLDER'),
					label: Loc.getMessage('M_COLLAB_CREATE_COLLAB_DESCRIPTION_LABEL'),
					onChange: this.#onChangeDescription,
					design: InputDesign.LIGHT_GREY,
					mode: InputMode.STROKE,
					showCharacterCount: false,
					height: 102,
				}),
			);
		};

		#bindDescriptionFieldRef = (ref) => {
			this.descriptionFieldRef = ref;
		};

		#onChangeDescription = (description) => {
			this.setState({ description }, () => this.#callOnChangeHandler());
		};

		onChangeDelay(messagesAutoDeleteDelay)
		{
			this.setState({ messagesAutoDeleteDelay }, this.#callOnChangeHandler);
		}

		#callOnChangeHandler = () => {
			this.props?.onChange({
				name: this.state.name,
				description: this.state.description,
				image: this.state.image,
				messagesAutoDeleteDelay: this.state.messagesAutoDeleteDelay,
			});
		};

		#renderSettings = () => {
			const { messagesAutoDeleteDelay } = this.state;
			const { isEditMode, isAutoDeleteFeatureAvailable } = this.props;

			return Area(
				{
					testId: `${this.testId}-area-settings`,
				},
				SettingSelectorList({
					items: [
						{
							id: CollabSettingsItem.AUTO_DELETE_MESSAGES,
							title: Loc.getMessage('M_COLLAB_CREATE_AUTO_DELETE_MESSAGES_ITEM_TITLE'),
							subtitle: null,
							design: SettingSelectorListItemDesign.OPENER,
							useOptionPreview: true,
							optionPreviewValue: this.#getAutoDeleteText(messagesAutoDeleteDelay),
							optionColor: messagesAutoDeleteDelay === MessagesAutoDeleteDelay.off
								? null
								: Color.accentMainPrimary,
						},
						{
							id: CollabSettingsItem.PERMISSIONS,
							title: Loc.getMessage('M_COLLAB_CREATE_PERMISSIONS_ITEM_TITLE_MSGVER_1'),
							subtitle: Loc.getMessage('M_COLLAB_CREATE_PERMISSIONS_ITEM_SUBTITLE_MSGVER_1'),
							design: SettingSelectorListItemDesign.OPENER,
						},
						{
							id: CollabSettingsItem.TASK_PERMISSIONS,
							title: Loc.getMessage('M_COLLAB_CREATE_TASK_PERMISSIONS_ITEM_TITLE'),
							subtitle: Loc.getMessage('M_COLLAB_CREATE_TASK_PERMISSIONS_ITEM_SUBTITLE'),
							design: SettingSelectorListItemDesign.OPENER,
						},
						/* {
							id: CollabSettingsItem.SECURITY,
							title: Loc.getMessage('M_COLLAB_CREATE_SECURITY_ITEM_TITLE'),
							subtitle: Loc.getMessage('M_COLLAB_CREATE_SECURITY_ITEM_SUBTITLE'),
							design: SettingSelectorListItemDesign.OPENER,
						}, */
					].filter((item) => item.id !== CollabSettingsItem.AUTO_DELETE_MESSAGES
						|| (!isEditMode && isAutoDeleteFeatureAvailable)),
					itemRef: this.#bindSettingsSelectorItemRef,
					onItemClick: this.#onSettingsItemClick,
				}),
				this.#renderDetailsButton(),
			);
		};

		#getAutoDeleteText = (messagesAutoDeleteDelay) => {
			switch (messagesAutoDeleteDelay)
			{
				case MessagesAutoDeleteDelay.off:
					return Loc.getMessage('M_COLLAB_CREATE_AUTO_DELETE_MESSAGES_ITEM_OFF');
				case MessagesAutoDeleteDelay.hour:
					return Loc.getMessage('M_COLLAB_CREATE_AUTO_DELETE_MESSAGES_ITEM_HOUR');
				case MessagesAutoDeleteDelay.day:
					return Loc.getMessage('M_COLLAB_CREATE_AUTO_DELETE_MESSAGES_ITEM_DAY');
				case MessagesAutoDeleteDelay.week:
					return Loc.getMessage('M_COLLAB_CREATE_AUTO_DELETE_MESSAGES_ITEM_WEEK');
				case MessagesAutoDeleteDelay.month:
					return Loc.getMessage('M_COLLAB_CREATE_AUTO_DELETE_MESSAGES_ITEM_MONTH');
				default:
					return '';
			}
		};

		#bindSettingsSelectorItemRef = (ref, item) => {
			this.settingsSelectorItemsRefsMap.set(item.id, {
				ref,
				item,
			});
		};

		#onSettingsItemClick = async (item) => {
			if (item.id === CollabSettingsItem.AUTO_DELETE_MESSAGES)
			{
				if (!this.props.isEnabledAutoDeleteInPortalSettings)
				{
					Haptics.notifyWarning();
					showToast(
						{
							message: Loc.getMessage('M_COLLAB_CREATE_AUTO_DELETE_PERMISSION_MESSAGE'),
							iconName: Icon.TIMER_DOT.getIconName(),
						},
						this.props.layoutWidget,
					);

					return;
				}

				void MessagesAutoDeleteContextMenu
					.createByFileId({
						ref: this.settingsSelectorItemsRefsMap.get(CollabSettingsItem.AUTO_DELETE_MESSAGES).ref,
						selectedItem: this.state.messagesAutoDeleteDelay,
						onItemSelected: this.onChangeDelay,
					})
					.open();

				return;
			}

			this.props.onSettingsItemClick?.(item);
		};

		#renderDetailsButton = () => {
			return Link4({
				testId: `${this.testId}-details-link`,
				text: Loc.getMessage('M_COLLAB_CREATE_DETAILS_LINK'),
				ellipsize: Ellipsize.END,
				mode: LinkMode.SOLID,
				color: Color.base4,
				numberOfLines: 1,
				textDecorationLine: 'underline',
				style: {
					alignSelf: 'center',
					marginTop: Component.cardListGap.toNumber(),
				},
				onClick: () => helpdesk.openHelpArticle(helpArticleCode),
			});
		};

		#bindNameFieldRef = (ref) => {
			this.nameFieldRef = ref;
		};

		#bindImageSelectorRef = (ref) => {
			this.imageSelectorRef = ref;
		};

		#onChangeName = (name) => {
			const nameWithCapitalizedFirstLetter = capitalize(name);
			this.setState({
				name: nameWithCapitalizedFirstLetter,
				isCollabNameExists: null,
			}, () => {
				this.#callOnChangeHandler();
				void this.debounceGetIsCollabNameExistsStatus(nameWithCapitalizedFirstLetter);
			});
		};

		#onImageClick = () => {
			this.#pickAvatar();
		};

		#pickAvatar = () => {
			const { isEditMode } = this.props;
			this.avatarPicker.open()
				.then((image) => {
					if (image)
					{
						this.setState({ image }, () => this.#callOnChangeHandler());
					}

					if (!isEditMode)
					{
						this.#focusOnNameField(500);
					}
				})
				.catch((err) => {
					console.error(err);
					Alert.alert(
						Loc.getMessage('M_COLLAB_CREATE_UPLOAD_ERROR_TITLE'),
						Loc.getMessage('M_COLLAB_CREATE_UPLOAD_ERROR_TEXT'),
						() => {
							if (!isEditMode)
							{
								this.#focusOnNameField(500);
							}
						},
						Loc.getMessage('M_COLLAB_CREATE_UNKNOWN_ERROR_OK'),
					);
				});
		};

		#focusOnNameField(timeout = 0)
		{
			setTimeout(() => {
				this.nameFieldRef?.focus?.();
			}, timeout);
		}

		#renderSaveButton()
		{
			return BoxFooter(
				{
					safeArea: true,
					backgroundColor: Color.bgContentPrimary,
					keyboardButton: this.#getKeyboardButtonProps(),
				},
				this.#renderBoxFooterButton(),
			);
		}

		#renderBoxFooterButton = () => {
			const { isEditMode } = this.props;
			const commonButton = {
				size: ButtonSize.L,
				loading: this.state.pending,
				disabled: this.#isCreateDisabled(),
				stretched: true,
				backgroundColor: Color.accentMainPrimary,
				onClick: this.#onCreateButtonClick,
			};

			if (isEditMode)
			{
				return Button({
					...commonButton,
					testId: `${this.testId}-save-button`,
					text: Loc.getMessage('M_COLLAB_CREATE_SAVE_BUTTON'),
				});
			}

			return Button({
				...commonButton,
				testId: `${this.testId}-create-button`,
				text: Loc.getMessage('M_COLLAB_CREATE_CREATE_BUTTON'),
			});
		};

		#getKeyboardButtonProps = () => {
			const { isEditMode } = this.props;
			const commonButton = {
				loading: this.state.pending,
				disabled: this.#isCreateDisabled(),
				onClick: this.#onCreateButtonClick,
			};

			if (isEditMode)
			{
				return {
					...commonButton,
					text: Loc.getMessage('M_COLLAB_CREATE_SAVE_BUTTON'),
					testId: `${this.testId}-save-button-keyboard`,
				};
			}

			return {
				...commonButton,
				text: Loc.getMessage('M_COLLAB_CREATE_CREATE_BUTTON'),
				testId: `${this.testId}-create-button-keyboard`,
			};
		};

		#isCreateDisabled()
		{
			return this.state.name.length === 0 || this.state.isCollabNameExists;
		}

		#isCollabNameUniqueChecking = () => {
			return this.state.isCollabNameExists === null;
		};

		#onCreateButtonClick = () => {
			if (this.state.pending)
			{
				return;
			}

			this.setState({ pending: true }, () => {
				if (!this.#isCollabNameUniqueChecking())
				{
					this.props.onCreateButtonClick?.(this.disablePending);
				}
			});
		};

		disablePending = () => {
			this.setState({ pending: false });
		};

		enablePending = () => {
			this.setState({ pending: true });
		};
	}

	module.exports = {
		/**
		 * @param {CollabCreateEditProps} props
		 * @returns {CollabCreateEdit}
		 */
		CollabCreateEdit: (props) => new CollabCreateEdit(props),
		CollabSettingsItem,
	};
});
