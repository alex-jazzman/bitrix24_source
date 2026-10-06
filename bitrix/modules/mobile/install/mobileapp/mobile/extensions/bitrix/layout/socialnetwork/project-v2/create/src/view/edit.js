/**
 * @module layout/socialnetwork/project-v2/create/src/view/edit
 */
jn.define('layout/socialnetwork/project-v2/create/src/view/edit', (require, exports, module) => {
	const { Alert, ButtonType } = require('alert');
	const { showToast } = require('toast');
	const { getFeatureRestriction, tariffPlanRestrictionsReady } = require('tariff-plan-restriction');
	const { Box } = require('ui-system/layout/box');
	const { Button, ButtonSize } = require('ui-system/form/buttons');
	const { AreaList } = require('ui-system/layout/area-list');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Indent, Color } = require('tokens');
	const { Loc } = require('loc');
	const { ComplexSelector } = require('selector/widget/entity/complex');
	const { EntitySelectorFactory, EntitySelectorFactoryType } = require('selector/widget/factory');
	const { AvatarPicker } = require('avatar-picker');
	const { createTestIdGenerator } = require('utils/test');
	const { ProjectCreateDescriptionInput } = require('layout/socialnetwork/project-v2/create/src/view/components/description-input');
	const { ProjectCreateNameInput } = require('layout/socialnetwork/project-v2/create/src/view/components/name-input');
	const { ProjectCreateParticipantsBlock } = require('layout/socialnetwork/project-v2/create/src/view/components/participants-block');
	const { ProjectCreateSettingsBlock } = require('layout/socialnetwork/project-v2/create/src/view/components/settings-block');
	const { ProjectCreateAdditionalSettings } = require('layout/socialnetwork/project-v2/create/src/view/additional-settings');
	const { ProjectNotificationsSettings } = require('layout/socialnetwork/project-v2/create/src/view/project-notifications-settings');
	const { ProjectType } = require('layout/socialnetwork/project-v2/create/src/enum/project-type');
	const {
		normalizeAvatar,
		createUploadedAvatar,
		createRemovedAvatar,
		hasAvatarPreview,
	} = require('layout/socialnetwork/project-v2/create/src/helpers/project-avatar');
	const { ProjectCreatePermissionsSettings } = require('layout/socialnetwork/project-v2/create/src/view/permissions-settings');
	const {
		extractSettings,
		getNormalizedSettings,
		isValidNotificationCatalog,
	} = require('layout/socialnetwork/project-v2/create/src/helpers/project-create-settings');
	const { normalizeProjectSettings } = require('layout/socialnetwork/project-v2/create/src/helpers/settings-normalizer');
	const { ProjectCreateTypeSettings } = require('layout/socialnetwork/project-v2/create/src/view/type-settings');

	const FOOTER_CONTENT_OFFSET = ButtonSize.L.getHeight() + (Indent.XL.toNumber() * 2);

	const getEntityImageUrl = (entity = {}) => {
		return entity.imageUrl ?? entity.avatar ?? entity.customData?.imageUrl ?? '';
	};

	class ProjectCreateEdit extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.avatarPicker = new AvatarPicker();
			this.isLegacyProject = props.isLegacyProject === true;
			this.nameFieldRef = null;
			this.getTestId = createTestIdGenerator({
				prefix: 'project-create-edit',
				context: this,
			});

			const normalizedSettings = getNormalizedSettings(
				extractSettings({
					...props,
					avatar: normalizeAvatar(props.avatar, props.image),
				}),
				Number(props.userId ?? env.userId ?? 0),
			);

			this.state = {
				...normalizedSettings,
				pending: false,
			};
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					resizableByKeyboard: true,
					footer: this.#renderSaveButton(),
					onClick: this.#hideKeyboard,
				},
				AreaList(
					{
						testId: this.getTestId('area-list'),
						resizableByKeyboard: true,
						showsVerticalScrollIndicator: true,
						onScrollBeginDrag: this.#hideKeyboard,
						viewProps: {
							style: {
								paddingBottom: FOOTER_CONTENT_OFFSET,
							},
						},
					},
					this.#renderName(),
					this.#renderDescription(),
					this.#renderParticipantsBlock(),
					this.#renderSettingsBlock(),
				),
			);
		}

		#hideKeyboard = () => {
			Keyboard.dismiss();
		};

		#renderName = () => ProjectCreateNameInput({
			testId: this.getTestId('name-input'),
			avatar: this.state.avatar,
			value: this.state.name,
			onChange: this.#onNameChange,
			onImageClick: this.#onImageClick,
			bindNameFieldRef: this.#bindNameFieldRef,
		});

		#renderDescription = () => ProjectCreateDescriptionInput({
			testId: this.getTestId('description-input'),
			value: this.state.description,
			onChange: this.#onDescriptionChange,
		});

		#renderParticipantsBlock = () => ProjectCreateParticipantsBlock({
			testId: this.getTestId('participants-block'),
			ownerData: this.state.ownerData,
			moderatorsData: this.state.moderatorsData,
			participants: this.state.participants,
			showParticipants: !this.isLegacyProject,
			onOwnerClick: this.#showOwnerSelector,
			onModeratorsClick: this.#showModeratorsSelector,
			onParticipantsClick: this.#showParticipantsSelector,
		});

		#renderSettingsBlock = () => ProjectCreateSettingsBlock({
			testId: this.getTestId('settings-block'),
			typeSubtitle: this.#getProjectTypeSubtitle(),
			showPermissions: true,
			showProjectNotifications: !this.isLegacyProject
				&& isValidNotificationCatalog(this.state.notifications),
			onItemClick: this.#onSettingsItemClick,
		});

		#bindNameFieldRef = (ref) => {
			this.nameFieldRef = ref;
		};

		#onSettingsItemClick = async (item) => {
			if (item.id === 'type')
			{
				await this.#openTypeSettings();

				return;
			}

			if (item.id === 'permissions')
			{
				await this.#openPermissionsSettings();

				return;
			}

			if (item.id === 'additional-settings')
			{
				await this.#openAdditionalSettings();

				return;
			}

			if (item.id === 'project-notifications')
			{
				await this.#openProjectNotificationsSettings();
			}
		};

		#getProjectTypeSubtitle()
		{
			return this.state.type === ProjectType.PRIVATE.getValue()
				? Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_TYPE_PRIVATE')
				: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_TYPE_PUBLIC');
		}

		#showOwnerSelector = () => {
			const ownerSelector = EntitySelectorFactory.createByType(EntitySelectorFactoryType.USER, {
				provider: {
					context: 'GROUP_INVITE_OWNER',
					options: {
						useLettersForEmptyAvatar: true,
					},
				},
				createOptions: {
					enableCreation: false,
				},
				integrateSelectorToParentLayout: true,
				initSelectedIds: [this.state.ownerData.id].filter(Boolean),
				allowMultipleSelection: false,
				closeOnSelect: true,
				events: {
					onClose: (selectedUsers) => this.#onSelectOwner(selectedUsers?.[0]),
				},
			});

			void this.#openSelectorWidget(
				Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_OWNER_SELECTOR_TITLE'),
				ownerSelector,
				false,
			);
		};

		#onSelectOwner = (owner) => {
			if (!owner)
			{
				return;
			}

			this.setState(
				normalizeProjectSettings({
					...this.state,
					ownerData: {
						id: Number(owner.id),
						title: owner.title ?? '',
						imageUrl: getEntityImageUrl(owner),
					},
				}),
				this.#callOnChangeHandler,
			);
		};

		#showModeratorsSelector = () => {
			const moderatorSelector = EntitySelectorFactory.createByType(EntitySelectorFactoryType.USER, {
				provider: {
					context: 'GROUP_INVITE_MODERATORS',
					options: {
						useLettersForEmptyAvatar: true,
					},
				},
				createOptions: {
					enableCreation: false,
				},
				integrateSelectorToParentLayout: true,
				initSelectedIds: this.state.moderatorsData.map((user) => user.id),
				allowMultipleSelection: true,
				closeOnSelect: false,
				events: {
					onClose: (selectedUsers = []) => {
						this.#onSelectModerators(selectedUsers);
					},
				},
			});

			void this.#openSelectorWidget(
				Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_MODERATORS_SELECTOR_TITLE'),
				moderatorSelector,
				true,
			);
		};

		#onSelectModerators = (selectedUsers = []) => {
			const ownerId = Number(this.state.ownerData?.id ?? 0);
			const availableModerators = selectedUsers.filter((user) => Number(user.id) !== ownerId);
			const excludedOwner = availableModerators.length !== selectedUsers.length;
			const moderatorsData = availableModerators.map((user) => ({
				id: Number(user.id),
				title: user.title ?? '',
				imageUrl: getEntityImageUrl(user),
			}));
			const moderatorIds = new Set(moderatorsData.map((user) => user.id));
			const removedModerators = (this.state.moderatorsData ?? []).filter((user) => !moderatorIds.has(user.id));
			const participants = {
				...this.state.participants,
				user: [
					...(this.state.participants?.user ?? []),
					...removedModerators,
				],
			};

			this.setState(
				normalizeProjectSettings({
					...this.state,
					moderatorsData,
					participants,
				}),
				() => {
					this.#callOnChangeHandler();

					if (excludedOwner)
					{
						showToast({
							message: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_OWNER_CANNOT_BE_MODERATOR'),
						}, this.props.layoutWidget);
					}
				},
			);
		};

		#showParticipantsSelector = async () => {
			const participantsSelector = ComplexSelector.make({
				entityIds: ['user', 'department'],
				provider: {
					context: 'GROUP_INVITE',
					options: {
						useLettersForEmptyAvatar: true,
						department: {
							selectMode: 'departmentsOnly',
							allowFlatDepartments: true,
						},
					},
				},
				createOptions: {
					enableCreation: false,
				},
				integrateSelectorToParentLayout: true,
				initSelectedIds: this.#getParticipantsSelectedIds(),
				allowMultipleSelection: true,
				closeOnSelect: false,
				events: {
					onClose: this.#onSelectParticipants,
				},
			});

			void this.#openSelectorWidget(
				Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_PARTICIPANTS_SELECTOR_TITLE'),
				participantsSelector,
				true,
			);
		};

		#openSelectorWidget = async (title, selector, withSendButton = true) => {
			const parentWidget = this.props.selectorParentWidget ?? this.props.layoutWidget;
			const selectorWidget = await parentWidget?.openWidget('selector', {
				titleParams: {
					text: title,
					type: 'dialog',
				},
				backdrop: {
					mediumPositionPercent: 90,
					horizontalSwipeAllowed: false,
				},
				sendButtonName: withSendButton
					? Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_SELECTOR_SEND_BUTTON')
					: null,
			});

			if (!selectorWidget)
			{
				return;
			}

			await selector.show({}, selectorWidget);
		};

		#getParticipantsSelectedIds = () => {
			const users = (this.state.participants.user ?? []).map((item) => ['user', item.id]);
			const departments = (this.state.participants.department ?? []).map((item) => ['department', item.id]);

			return [...users, ...departments];
		};

		#onSelectParticipants = (selectedItems = []) => {
			const participants = selectedItems.reduce((acc, item) => {
				if (item.type === 'user')
				{
					acc.user.push({
						id: Number(item.id),
						title: item.title ?? '',
						imageUrl: item.imageUrl ?? '',
					});
				}

				if (item.type === 'department')
				{
					acc.department.push({
						id: Number(item.id),
						title: item.title ?? '',
					});
				}

				return acc;
			}, { user: [], department: [] });

			this.setState(
				normalizeProjectSettings({
					...this.state,
					participants,
				}),
				this.#callOnChangeHandler,
			);
		};

		#openAdditionalSettings = async () => {
			const layoutWidget = await this.props.layoutWidget?.openWidget('layout', {
				backgroundColor: Color.bgPrimary.toHex(),
				titleParams: {
					text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_ADDITIONAL_BLOCK_TITLE'),
					type: 'entity',
				},
			});

			layoutWidget?.showComponent(ProjectCreateAdditionalSettings({
				layoutWidget,
				rootLayoutWidget: this.props.rootLayoutWidget,
				projectId: this.props.projectId,
				dateStart: this.state.dateStart,
				dateFinish: this.state.dateFinish,
				tags: this.state.tags,
				messagesAutoDeleteDelay: this.state.messagesAutoDeleteDelay,
				autoDeleteEnabledInPortalSettings: this.props.autoDeleteEnabledInPortalSettings,
				showMessagesAutoDelete: !this.isLegacyProject,
				onChange: this.#onFieldsChange,
			}));
		};

		#openProjectNotificationsSettings = async () => {
			const layoutWidget = await this.props.layoutWidget?.openWidget('layout', {
				backgroundColor: Color.bgPrimary.toHex(),
				titleParams: {
					text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_NOTIFICATIONS_TITLE'),
					type: 'entity',
				},
			});

			layoutWidget?.showComponent(ProjectNotificationsSettings({
				layoutWidget,
				rootLayoutWidget: this.props.rootLayoutWidget,
				projectId: this.props.projectId,
				notifications: this.state.notifications,
				onChange: this.#onFieldsChange,
			}));
		};

		#openPermissionsSettings = async () => {
			const { isRestricted, showRestriction } = getFeatureRestriction('socialnetwork_projects_access_permissions');
			if (isRestricted())
			{
				showRestriction();
			}

			const layoutWidget = await this.props.layoutWidget?.openWidget('layout', {
				backgroundColor: Color.bgPrimary.toHex(),
				titleParams: {
					text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_PERMISSIONS_TITLE'),
					type: 'entity',
				},
			});

			layoutWidget?.showComponent(ProjectCreatePermissionsSettings({
				showChatSettings: !this.isLegacyProject,
				showTaskPermissions: !this.isLegacyProject,
				showKnowledgeBasePermissions: this.props.showKnowledgeBasePermissions === true
					&& !this.isLegacyProject,
				initiatePerms: this.state.initiatePerms,
				messageWriters: this.state.messageWriters,
				showHistory: this.state.showHistory,
				taskViewPerms: this.state.taskViewPerms,
				taskSortPerms: this.state.taskSortPerms,
				taskCreatePerms: this.state.taskCreatePerms,
				taskEditPerms: this.state.taskEditPerms,
				taskDeletePerms: this.state.taskDeletePerms,
				knowledgeViewPerms: this.state.knowledgeViewPerms,
				knowledgeEditPerms: this.state.knowledgeEditPerms,
				knowledgeSettingsPerms: this.state.knowledgeSettingsPerms,
				knowledgeDeletePerms: this.state.knowledgeDeletePerms,
				layoutWidget,
				rootLayoutWidget: this.props.rootLayoutWidget,
				onChange: this.#onFieldsChange,
			}));
		};

		#openTypeSettings = async () => {
			const layoutWidget = await this.props.layoutWidget?.openWidget('layout', {
				backgroundColor: Color.bgPrimary.toHex(),
				titleParams: {
					text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_TYPE_TITLE'),
					type: 'entity',
				},
			});

			layoutWidget?.showComponent(ProjectCreateTypeSettings({
				layoutWidget,
				rootLayoutWidget: this.props.rootLayoutWidget,
				type: this.state.type,
				onChange: this.#onFieldsChange,
			}));
		};

		#onNameChange = (name) => {
			this.setState({ name }, this.#callOnChangeHandler);
		};

		#onDescriptionChange = (description) => {
			this.setState({ description }, this.#callOnChangeHandler);
		};

		#onFieldsChange = (fields) => {
			this.setState(
				normalizeProjectSettings({
					...this.state,
					...fields,
				}),
				this.#callOnChangeHandler,
			);
		};

		#callOnChangeHandler = () => {
			this.props.onChange?.({
				name: this.state.name,
				description: this.state.description,
				avatar: this.state.avatar,
				ownerData: this.state.ownerData,
				moderatorsData: this.state.moderatorsData,
				participants: this.state.participants,
				type: this.state.type,
				initiatePerms: this.state.initiatePerms,
				messageWriters: this.state.messageWriters,
				showHistory: this.state.showHistory,
				taskViewPerms: this.state.taskViewPerms,
				taskSortPerms: this.state.taskSortPerms,
				taskCreatePerms: this.state.taskCreatePerms,
				taskEditPerms: this.state.taskEditPerms,
				taskDeletePerms: this.state.taskDeletePerms,
				knowledgeViewPerms: this.state.knowledgeViewPerms,
				knowledgeEditPerms: this.state.knowledgeEditPerms,
				knowledgeSettingsPerms: this.state.knowledgeSettingsPerms,
				knowledgeDeletePerms: this.state.knowledgeDeletePerms,
				dateStart: this.state.dateStart,
				dateFinish: this.state.dateFinish,
				tags: this.state.tags,
				messagesAutoDeleteDelay: this.state.messagesAutoDeleteDelay,
				notifications: this.state.notifications,
			});
		};

		#onImageClick = () => {
			if (hasAvatarPreview(this.state.avatar))
			{
				this.#showAvatarActions();

				return;
			}

			this.#pickAvatar();
		};

		#showAvatarActions()
		{
			Alert.confirm(
				Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_AVATAR_ACTIONS_TITLE'),
				'',
				[
					{
						type: ButtonType.DEFAULT,
						text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_AVATAR_ACTIONS_UPLOAD'),
						onPress: this.#pickAvatar,
					},
					{
						type: ButtonType.DESTRUCTIVE,
						text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_AVATAR_ACTIONS_REMOVE'),
						onPress: this.#removeAvatar,
					},
					{
						type: ButtonType.CANCEL,
						text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_AVATAR_ACTIONS_CANCEL'),
					},
				],
			);
		}

		#pickAvatar = () => {
			this.avatarPicker.open()
				.then((image) => {
					if (!image)
					{
						return;
					}

					this.setState({
						avatar: createUploadedAvatar(image),
					}, () => {
						this.#callOnChangeHandler();
						this.nameFieldRef?.focus?.();
					});
				})
				.catch((error) => {
					console.error(error);
					Alert.alert(
						Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_UPLOAD_ERROR_TITLE'),
						Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_UPLOAD_ERROR_TEXT'),
						() => this.nameFieldRef?.focus?.(),
						Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_UPLOAD_ERROR_OK'),
					);
				})
			;
		};

		#removeAvatar = () => {
			this.setState({
				avatar: createRemovedAvatar(),
			}, () => {
				this.#callOnChangeHandler();
				this.nameFieldRef?.focus?.();
			});
		};

		#renderSaveButton()
		{
			return BoxFooter(
				{
					testId: this.getTestId('footer'),
					safeArea: true,
					backgroundColor: Color.bgContentPrimary,
					keyboardButton: this.#getKeyboardButtonProps(),
				},
				Button({
					testId: this.getTestId('create-btn'),
					size: ButtonSize.L,
					loading: this.state.pending,
					disabled: this.#isSubmitButtonDisabled(),
					stretched: true,
					backgroundColor: Color.accentMainPrimary,
					text: this.#getSubmitButtonText(),
					onClick: this.#onSubmitButtonClick,
				}),
			);
		}

		#getKeyboardButtonProps = () => ({
			testId: this.getTestId('create-btn-keyboard'),
			loading: this.state.pending,
			disabled: this.#isSubmitButtonDisabled(),
			backgroundColor: Color.accentMainPrimary,
			text: this.#getSubmitButtonText(),
			onClick: this.#onSubmitButtonClick,
		});

		#getSubmitButtonText = () => {
			return this.props.submitButtonText ?? Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_CREATE_BUTTON');
		};

		#isSubmitButtonDisabled()
		{
			return this.state.name.trim().length === 0;
		}

		#onSubmitButtonClick = () => {
			if (this.state.pending)
			{
				return;
			}

			this.setState({ pending: true }, () => {
				this.props.onSubmitButtonClick?.(this.disablePending);
			});
		};

		disablePending = () => {
			this.setState({ pending: false });
		};
	}

	module.exports = {
		ProjectCreateEdit: (props) => new ProjectCreateEdit(props),
	};
});
