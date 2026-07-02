/**
 * @module mail/mailbox/settings/src/crm-card
 */
jn.define('mail/mailbox/settings/src/crm-card', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');
	const { Loc } = require('loc');
	const { Color, Indent, Component } = require('tokens');
	const { ElementsStack } = require('elements-stack');
	const { Card, CardDesign } = require('ui-system/layout/card');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { PureComponent } = require('layout/pure-component');
	const { PopupMenu } = require('ui-system/popups/popup-menu');
	const { Text4, Text5, Text6, Text7 } = require('ui-system/typography/text');
	const { Switcher, SwitcherSize } = require('ui-system/blocks/switcher');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { SocialNetworkUserSelector } = require('selector/widget/entity/socialnetwork/user');
	const { TextAreaInput, InputDesign, InputMode } = require('ui-system/form/inputs/textarea');
	const {
		renderChipSelector,
		renderSectionDivider,
		renderToggleRow,
		renderToggleWithChip,
		getPeriodText,
	} = require('mail/mailbox/settings/src/settings-ui');

	const QUEUE_AVATAR_SIZE = 36;
	const QUEUE_EDIT_ICON_SIZE = 24;
	const QUEUE_VISIBLE_COUNT = 5;
	const ADD_MEMBER_BUTTON_SIZE = 40;
	const ADD_MEMBER_ICON_SIZE = 24;
	const CRM_ICON_SIZE = 44;
	const CRM_HEADER_SWITCHER_WIDTH = 40;
	const CRM_HEADER_SWITCHER_GAP = 16;
	const BACKDROP_POSITION_PERCENT = 70;
	const SELECTOR_RECENT_LIMIT = 20;
	const CARD_GAP = Component.cardListGap.toNumber();
	const CRM_ICON_URI = makeLibraryImagePath('crm-exact.png', 'mailbox-settings', 'mail');
	const SETTINGS_DISABLED_CONTENT_OPACITY = 0.45;
	const SETTINGS_DISABLED_OVERLAY_OPACITY = 0.18;
	const AVATAR_STACK_OUTLINE = 4;
	const AVATAR_STACK_OFFSET = 5;
	const CRM_SETTINGS_GAP = Indent.XL3.toNumber();
	const SECTION_DIVIDER_MARGIN_TOP = Indent.XL.toNumber() + Indent.XS2.toNumber();
	const SECTION_DIVIDER_MARGIN_BOTTOM = Indent.XL.toNumber();

	/**
	 * @class CrmCard
	 */
	class CrmCard extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.crmSyncPeriodLinkRef = null;
			this.incomingEntityLinkRef = null;
			this.outgoingEntityLinkRef = null;
			this.sourceLinkRef = null;

			this.handleHeaderToggle = this.handleHeaderToggle.bind(this);
			this.handleNoopClick = this.handleNoopClick.bind(this);
			this.handleCrmSyncToggle = this.handleCrmSyncToggle.bind(this);
			this.handleCrmAssignKnownToggle = this.handleCrmAssignKnownToggle.bind(this);
			this.handleCrmIncomingToggle = this.handleCrmIncomingToggle.bind(this);
			this.handleCrmOutgoingToggle = this.handleCrmOutgoingToggle.bind(this);
			this.handleAddressesChange = this.handleAddressesChange.bind(this);
			this.showCrmSyncPeriodMenu = this.showCrmSyncPeriodMenu.bind(this);
			this.showIncomingEntityMenu = this.showIncomingEntityMenu.bind(this);
			this.showOutgoingEntityMenu = this.showOutgoingEntityMenu.bind(this);
			this.showSourceMenu = this.showSourceMenu.bind(this);
			this.toggleAddressesInput = this.toggleAddressesInput.bind(this);
			this.showMemberSelector = this.showMemberSelector.bind(this);
		}

		render()
		{
			const cards = [
				this.shouldShowHeaderCard() ? this.renderHeaderCard() : null,
				...this.getSettingsCards(),
			].filter(Boolean);

			return View(
				{},
				...cards.map((card, index) => {
					if (index === 0)
					{
						return card;
					}

					return View(
						{
							style: {
								marginTop: index === 1 && this.shouldShowHeaderCard()
									? CRM_SETTINGS_GAP
									: CARD_GAP,
							},
						},
						card,
					);
				}),
			);
		}

		renderHeaderCard()
		{
			const canEdit = this.canEditCrmIntegration();
			const isEnabled = Boolean(this.props.crmEnabled);
			const handleToggle = canEdit ? this.handleHeaderToggle : undefined;

			return Card(
				{
					testId: 'mail-connector-settings-crm-header-card',
					design: isEnabled ? CardDesign.ACCENT : CardDesign.PRIMARY,
					border: !isEnabled,
					selected: false,
				},
				View(
					{},
					View(
						{
							style: {
								position: 'relative',
								minHeight: 24,
							},
						},
						View(
							{
								style: {
									flexDirection: 'row',
									alignItems: 'center',
									paddingRight: CRM_HEADER_SWITCHER_WIDTH + CRM_HEADER_SWITCHER_GAP,
								},
								onClick: handleToggle,
							},
							this.renderCrmIcon(),
							View(
								{
									style: {
										flex: 1,
										flexShrink: 1,
										marginLeft: Indent.L.toNumber(),
									},
								},
								Text4({
									testId: 'mail-connector-settings-crm-header-title',
									text: 'CRM',
									color: Color.base1,
								}),
								View(
									{
										style: {
											marginTop: Indent.XS2.toNumber(),
										},
									},
									Text5({
										testId: 'mail-connector-settings-crm-header-status',
										text: this.getCrmStatusText(),
										color: this.getCrmStatusColor(),
									}),
								),
							),
						),
						View(
							{
									style: {
										position: 'absolute',
										top: 0,
										right: 0,
										bottom: 0,
										width: CRM_HEADER_SWITCHER_WIDTH,
										justifyContent: 'center',
										flexShrink: 0,
									},
								onClick: handleToggle,
							},
							Switcher({
								testId: 'mail-connector-settings-crm-header_toggle',
								checked: this.props.crmEnabled,
								disabled: !canEdit,
								useState: false,
								size: SwitcherSize.L,
							}),
						),
					),
					this.renderNoAccessNote(),
				),
			);
		}

		shouldShowHeaderCard()
		{
			return this.props.showHeaderCard !== false;
		}

		shouldShowSettings()
		{
			return this.props.forceShowSettings || this.props.crmEnabled;
		}

		getSettingsCards()
		{
			if (!this.shouldShowSettings())
			{
				return [];
			}

			return [
				this.renderSettingsBlock(),
			];
		}

		renderSettingsBlock()
		{
			const sections = [
				this.isNewMailbox() ? this.renderSyncCard() : null,
				this.renderAssignKnownCard(),
				this.renderIncomingCard(),
				this.renderOutgoingCard(),
				!this.isNewMailbox() ? this.renderSourceCard() : null,
				!this.isNewMailbox() ? this.renderLeadAddressesCard() : null,
				!this.isNewMailbox() ? this.renderDistributionQueueCard() : null,
			].filter(Boolean);

			const isLocked = this.isSettingsLocked();

			return View(
				{
					testId: 'mail-connector-settings-crm-settings-block',
					style: {
						position: 'relative',
					},
				},
				View(
					{
						style: {
							opacity: isLocked ? SETTINGS_DISABLED_CONTENT_OPACITY : 1,
						},
					},
					...sections.flatMap((section, index) => {
						if (index === sections.length - 1)
						{
							return [section];
						}

						return [
							section,
							View(
								{
									testId: `mail-connector-settings-crm-divider-wrap-${index}`,
									style: {
										marginTop: SECTION_DIVIDER_MARGIN_TOP,
										marginBottom: SECTION_DIVIDER_MARGIN_BOTTOM,
									},
								},
								renderSectionDivider({
									testId: `mail-connector-settings-crm-divider-${index}`,
								}),
							),
						];
					}),
				),
				isLocked ? this.renderSettingsOverlay() : null,
			);
		}

		renderSettingsOverlay()
		{
			return View(
					{
						testId: 'mail-connector-settings-crm-settings-overlay',
						style: {
						position: 'absolute',
						top: 0,
						right: 0,
						bottom: 0,
							left: 0,
							backgroundColor: Color.bgContentPrimary.toHex(SETTINGS_DISABLED_OVERLAY_OPACITY),
						},
						onClick: this.handleNoopClick,
					},
				);
		}

		renderCrmIcon()
		{
			return View(
				{
					style: {
						width: CRM_ICON_SIZE,
						height: CRM_ICON_SIZE,
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				Image({
					style: {
						width: CRM_ICON_SIZE,
						height: CRM_ICON_SIZE,
						resizeMode: 'contain',
					},
					uri: CRM_ICON_URI,
				}),
			);
		}

		renderNoAccessNote()
		{
			if (this.canEditCrmIntegration())
			{
				return null;
			}

			return View(
				{
					style: {
						marginTop: Indent.XL.toNumber(),
					},
				},
				Text5({
					testId: 'mail-connector-settings-crm-no-access',
					text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_NO_ACCESS'),
					color: Color.base3,
				}),
			);
		}

		renderSyncCard()
		{
			return this.renderSectionCard(
				{
					testId: 'mail-connector-settings-crm-sync-card',
				},
				View(
					{},
					renderToggleWithChip({
						testId: 'mail-connector-settings-crm-sync',
						checked: this.props.crmSyncEnabled,
						text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_SYNC_PERIOD'),
						chipText: getPeriodText(this.props.crmSyncPeriod, this.props.crmSyncOptions),
						disabled: !this.canEditCrmSettings(),
						onToggle: this.handleCrmSyncToggle,
						onChipClick: this.showCrmSyncPeriodMenu,
						chipRef: this.onCrmSyncPeriodLinkRef,
					}),
					View(
						{
							style: {
								marginTop: Indent.XL.toNumber(),
							},
						},
						Text7({
							testId: 'mail-connector-settings-crm-sync-desc',
							text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_SYNC_DESCRIPTION'),
							color: Color.base4,
						}),
					),
				),
			);
		}

		renderAssignKnownCard()
		{
			return this.renderSectionCard(
				{
					testId: 'mail-connector-settings-crm-assign-card',
				},
				renderToggleRow({
					testId: 'mail-connector-settings-crm-assign-known',
					checked: this.props.crmAssignKnown,
					text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_ASSIGN_KNOWN'),
					disabled: !this.canEditCrmSettings(),
					onToggle: this.handleCrmAssignKnownToggle,
				}),
			);
		}

		renderIncomingCard()
		{
			return this.renderEntityCard({
				testId: 'mail-connector-settings-crm-incoming-card',
				title: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_INCOMING_TITLE'),
				rowTestId: 'mail-connector-settings-crm-incoming',
				checked: this.props.crmIncomingCreate,
				text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_INCOMING_CREATE'),
				chipText: this.getCrmEntityTitle('incoming'),
				onToggle: this.handleCrmIncomingToggle,
				onChipClick: this.showIncomingEntityMenu,
				chipRef: this.onIncomingEntityLinkRef,
			});
		}

		renderOutgoingCard()
		{
			return this.renderEntityCard({
				testId: 'mail-connector-settings-crm-outgoing-card',
				title: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_OUTGOING_TITLE'),
				rowTestId: 'mail-connector-settings-crm-outgoing',
				checked: this.props.crmOutgoingCreate,
				text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_OUTGOING_CREATE'),
				chipText: this.getCrmEntityTitle('outgoing'),
				onToggle: this.handleCrmOutgoingToggle,
				onChipClick: this.showOutgoingEntityMenu,
				chipRef: this.onOutgoingEntityLinkRef,
			});
		}

		renderEntityCard({ testId, title, rowTestId, checked, text, chipText, onToggle, onChipClick, chipRef })
		{
			return this.renderSectionCard(
				{
					testId,
					title,
				},
				View(
					{},
					renderToggleWithChip({
						testId: rowTestId,
						checked,
						text,
						chipText,
						disabled: !this.canEditCrmSettings(),
						onToggle,
						onChipClick,
						chipRef,
					}),
					View(
						{
							style: {
								marginTop: Indent.XL.toNumber(),
							},
						},
						Text7({
							testId: `${rowTestId}-desc`,
							text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_CREATE_DESCRIPTION'),
							color: Color.base4,
						}),
					),
				),
			);
		}

		renderSourceCard()
		{
			return this.renderSectionCard(
				{
					testId: 'mail-connector-settings-crm-source-card',
					title: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_SOURCE_TITLE'),
				},
				View(
					{
						style: {
							flexDirection: 'row',
							flexWrap: 'wrap',
							alignItems: 'center',
						},
					},
					Text4({
						testId: 'mail-connector-settings-crm-source-label',
						text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_SOURCE_LABEL'),
						color: Color.base1,
					}),
					View(
						{
							style: {
								marginLeft: Indent.XS.toNumber(),
								marginTop: Indent.XS2.toNumber(),
							},
						},
						renderChipSelector({
							testId: 'mail-connector-settings-crm-source-chip',
							text: this.getCrmSourceTitle(),
							forwardRef: this.onSourceLinkRef,
							disabled: !this.canEditCrmSettings(),
							onClick: this.showSourceMenu,
						}),
					),
				),
			);
		}

		renderLeadAddressesCard()
		{
			return this.renderSectionCard(
				{
					testId: 'mail-connector-settings-crm-leads-card',
					title: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_LEADS_TITLE'),
				},
				View(
					{},
					Text4({
						testId: 'mail-connector-settings-crm-new-lead-label',
						text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_NEW_LEAD_PER_EMAIL'),
						color: Color.base1,
					}),
					View(
						{
							style: {
								alignSelf: 'flex-start',
								marginTop: Indent.M.toNumber(),
							},
						},
						renderChipSelector({
							testId: 'mail-connector-settings-crm-addresses-chip',
							text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_ADDRESSES_LINK'),
							disabled: !this.canEditCrmSettings(),
							onClick: this.toggleAddressesInput,
						}),
					),
					this.renderAddressesInput(),
				),
			);
		}

		renderAddressesInput()
		{
			if (!this.props.showAddressesInput)
			{
				return null;
			}

			return View(
				{
					style: {
						marginTop: Indent.XL.toNumber(),
					},
				},
				TextAreaInput({
					testId: 'mail-connector-settings-crm-addresses-input',
					design: InputDesign.GREY,
					mode: InputMode.STROKE,
					showTitle: false,
					showCharacterCount: false,
					height: null,
					disabled: !this.canEditCrmSettings(),
					placeholder: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_ADDRESSES_PLACEHOLDER'),
					value: this.props.crmNewLeadFor,
					onChange: this.handleAddressesChange,
				}),
			);
		}

		renderDistributionQueueCard()
		{
			const queueUsers = Array.isArray(this.props.crmLeadRespUsers) ? this.props.crmLeadRespUsers : [];

			return this.renderSectionCard(
				{
					testId: 'mail-connector-settings-crm-queue-card',
					title: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_QUEUE_TITLE'),
				},
				queueUsers.length > 0
					? this.renderQueueAvatars(queueUsers)
					: this.renderAddMembersButton(),
			);
		}

		renderAddMembersButton()
		{
			const canEdit = this.canEditCrmSettings();

			return View(
				{
					testId: 'mail-connector-settings-crm-add-members',
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingVertical: Indent.XS.toNumber(),
					},
					onClick: canEdit ? this.showMemberSelector : undefined,
				},
				View(
					{
						style: {
							width: ADD_MEMBER_BUTTON_SIZE,
							height: ADD_MEMBER_BUTTON_SIZE,
							borderRadius: ADD_MEMBER_BUTTON_SIZE / 2,
							backgroundColor: canEdit
								? Color.accentMainPrimary.toHex()
								: Color.base6.toHex(),
							alignItems: 'center',
							justifyContent: 'center',
						},
					},
					IconView({
						icon: Icon.ADD_PERSON,
						color: Color.baseWhiteFixed,
						size: ADD_MEMBER_ICON_SIZE,
					}),
				),
				View(
					{
						style: {
							marginLeft: Indent.XL.toNumber(),
						},
					},
					Text4({
						text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_ADD_MEMBERS'),
						color: canEdit ? Color.accentMainLink : Color.base4,
					}),
				),
			);
		}

		renderQueueAvatars(queueUsers)
		{
			const canEdit = this.canEditCrmSettings();

			return View(
				{
					testId: 'mail-connector-settings-crm-queue-row',
					style: {
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				View(
					{
						style: {
							flex: 1,
						},
					},
					this.renderQueueAvatarStack(queueUsers, canEdit),
				),
				canEdit
					? View(
						{
							style: {
								marginLeft: Indent.M.toNumber(),
							},
							onClick: this.showMemberSelector,
						},
						IconView({
							testId: 'mail-connector-settings-crm-queue-edit',
							icon: Icon.EDIT,
							color: Color.base4,
							size: QUEUE_EDIT_ICON_SIZE,
						}),
					)
					: null,
			);
		}

		renderQueueAvatarStack(queueUsers, canEdit)
		{
			return ElementsStack(
				{
					testId: 'mail-connector-settings-crm-queue-avatars',
					maxElements: QUEUE_VISIBLE_COUNT,
					offset: AVATAR_STACK_OFFSET,
					externalIndent: AVATAR_STACK_OUTLINE,
					restView: this.renderQueueRestAvatar,
				},
				...queueUsers.map((user, index) => this.renderQueueAvatar(user, index, canEdit)).filter(Boolean),
			);
		}

		renderQueueAvatar(user, index, canEdit)
		{
			if (!user)
			{
				return null;
			}

			const avatarProps = {
				testId: `mail-connector-settings-crm-queue-avatar-${index}`,
				id: user.id ?? index,
				name: user.title || user.name || '',
				size: QUEUE_AVATAR_SIZE,
				outline: AVATAR_STACK_OUTLINE,
				withRedux: false,
				style: {
					backgroundColor: Color.bgSecondary.toHex(),
				},
			};

			if (canEdit)
			{
				avatarProps.onClick = this.showMemberSelector;
			}

			if (typeof user.imageUrl === 'string' && user.imageUrl.length > 0)
			{
				avatarProps.uri = user.imageUrl;
			}

			return Avatar(avatarProps);
		}

		handleHeaderToggle()
		{
			Keyboard.dismiss();
			this.handleStateChange({ crmEnabled: !this.props.crmEnabled });
		}

		handleNoopClick()
		{}

		handleCrmSyncToggle(checked)
		{
			this.handleStateChange({ crmSyncEnabled: checked });
		}

		handleCrmAssignKnownToggle(checked)
		{
			this.handleStateChange({ crmAssignKnown: checked });
		}

		handleCrmIncomingToggle(checked)
		{
			this.handleStateChange({ crmIncomingCreate: checked });
		}

		handleCrmOutgoingToggle(checked)
		{
			this.handleStateChange({ crmOutgoingCreate: checked });
		}

		handleAddressesChange(value)
		{
			this.handleStateChange({ crmNewLeadFor: value });
		}

		showIncomingEntityMenu()
		{
			this.showEntityMenu('incoming');
		}

		showOutgoingEntityMenu()
		{
			this.showEntityMenu('outgoing');
		}

		renderQueueRestAvatar = (restCount) => {
			const restText = restCount > 99 ? '99+' : `+${restCount}`;

			return View(
				{
					style: {
						width: QUEUE_AVATAR_SIZE + AVATAR_STACK_OUTLINE,
						height: QUEUE_AVATAR_SIZE + AVATAR_STACK_OUTLINE,
						backgroundColor: Color.bgSecondary.toHex(),
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: 512,
					},
				},
				View(
					{
						style: {
							width: QUEUE_AVATAR_SIZE,
							height: QUEUE_AVATAR_SIZE,
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

		renderSectionCard({ testId, title }, content)
		{
			return View(
				{
					testId,
				},
				title ? this.renderSectionTitle({ testId: `${testId}-title`, text: title }) : null,
				title
					? View(
						{
							style: {
								marginTop: Indent.XL.toNumber(),
							},
						},
						content,
					)
					: content,
			);
		}

		renderSectionTitle({ testId, text })
		{
			return View(
				{
					style: {
						paddingTop: Indent.S.toNumber(),
						paddingBottom: Indent.M.toNumber(),
					},
				},
				Text4({
					testId: `${testId}-text`,
					text,
					color: Color.base4,
				}),
			);
		}

		showCrmSyncPeriodMenu()
		{
			if (!this.canEditCrmSettings())
			{
				return;
			}

			const actions = (this.props.crmSyncOptions || []).map((option) => ({
				id: String(option.value),
				title: option.label,
				onItemSelected: () => this.handleStateChange({ crmSyncPeriod: option.value }),
			}));

			new PopupMenu(actions).show({ target: this.crmSyncPeriodLinkRef });
		}

		showEntityMenu(direction)
		{
			if (!this.canEditCrmSettings())
			{
				return;
			}

			const stateKey = direction === 'incoming' ? 'crmIncomingEntity' : 'crmOutgoingEntity';
			const options = this.props.crmEntityOptions || [];
			const target = direction === 'incoming' ? this.incomingEntityLinkRef : this.outgoingEntityLinkRef;
			const actions = options.map((option) => ({
				id: option.value,
				title: option.label,
				onItemSelected: () => this.handleStateChange({ [stateKey]: option.value }),
			}));

			new PopupMenu(actions).show({ target });
		}

		showSourceMenu()
		{
			if (!this.canEditCrmSettings())
			{
				return;
			}

			const actions = (this.props.crmSourceOptions || []).map((source) => ({
				id: source.value,
				title: source.label,
				onItemSelected: () => this.handleStateChange({ crmSource: source.value }),
			}));

			new PopupMenu(actions).show({ target: this.sourceLinkRef });
		}

		showMemberSelector()
		{
			if (!this.canEditCrmSettings())
			{
				return;
			}

			SocialNetworkUserSelector.make({
				initSelectedIds: this.props.crmLeadResp,
				allowMultipleSelection: true,
				provider: {
					context: 'MAIL_CRM_QUEUE',
					options: {
						recentItemsLimit: SELECTOR_RECENT_LIMIT,
						maxUsersInRecentTab: SELECTOR_RECENT_LIMIT,
						searchLimit: SELECTOR_RECENT_LIMIT,
					},
				},
				events: {
					onClose: (selectedUsers) => {
						if (!selectedUsers)
						{
							return;
						}

						this.handleStateChange({
							crmLeadResp: selectedUsers.map((user) => user.id),
							crmLeadRespUsers: selectedUsers,
						});
					},
				},
				widgetParams: {
					title: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_ADD_MEMBERS'),
					backdrop: {
						mediumPositionPercent: BACKDROP_POSITION_PERCENT,
						horizontalSwipeAllowed: false,
					},
				},
			}).show().catch(() => {});
		}

		getCrmStatusText()
		{
			return this.props.crmEnabled
				? Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_STATUS_ENABLED')
				: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_STATUS_DISABLED')
			;
		}

		getCrmStatusColor()
		{
			return this.props.crmEnabled ? Color.accentMainPrimary : Color.base4;
		}

		getCrmSourceTitle()
		{
			const sources = this.props.crmSourceOptions || [];
			const source = sources.find((item) => item.value === this.props.crmSource);

			return source ? source.label : '';
		}

		isNewMailbox()
		{
			return Boolean(this.props.isNewMailbox);
		}

		canEditCrmIntegration()
		{
			return this.props.canEditCrmIntegration !== false;
		}

		canEditCrmSettings()
		{
			return this.canEditCrmIntegration() && !this.isSettingsLocked();
		}

		isSettingsLocked()
		{
			return Boolean(this.props.lockSettingsWhenDisabled) && !this.props.crmEnabled;
		}

		handleStateChange(partialState)
		{
			if (!this.canEditCrmIntegration())
			{
				return;
			}

			this.props.onStateChange(partialState);
		}

		toggleAddressesInput()
		{
			if (!this.canEditCrmSettings())
			{
				return;
			}

			this.handleStateChange({ showAddressesInput: !this.props.showAddressesInput });
		}

		getCrmEntityTitle(direction)
		{
			const entityId = direction === 'incoming'
				? this.props.crmIncomingEntity
				: this.props.crmOutgoingEntity
			;
			const options = this.props.crmEntityOptions || [];
			const option = options.find((item) => item.value === entityId);

			return option ? option.label : '';
		}

		onCrmSyncPeriodLinkRef = (ref) => {
			this.crmSyncPeriodLinkRef = ref;
		};

		onIncomingEntityLinkRef = (ref) => {
			this.incomingEntityLinkRef = ref;
		};

		onOutgoingEntityLinkRef = (ref) => {
			this.outgoingEntityLinkRef = ref;
		};

		onSourceLinkRef = (ref) => {
			this.sourceLinkRef = ref;
		};
	}

	module.exports = { CrmCard };
});
