/**
 * @module vibecode/catalog/share/src/share-sheet
 */
jn.define('vibecode/catalog/share/src/share-sheet', (require, exports, module) => {
	const { confirmDefaultAction } = require('alert');
	const { BottomSheet } = require('bottom-sheet');
	const { Loc } = require('loc');
	const { Color, Corner, Indent } = require('tokens');
	const { showErrorToast, showToast } = require('toast');
	const { copyToClipboard } = require('utils/copy');
	const { createTestIdGenerator } = require('utils/test');
	const { PureComponent } = require('layout/pure-component');
	const { LoadingScreen } = require('layout/ui/loading-screen');
	const { SafeImage } = require('layout/ui/safe-image');
	const { ScrollView } = require('layout/ui/scroll-view');
	const {
		SettingSelectorList,
		SettingSelectorListItemDesign,
	} = require('layout/ui/setting-selector-list');
	const { RecipientSelector } = require('selector/recipient');
	const {
		ChipButton,
		ChipButtonDesign,
		ChipButtonMode,
		ChipButtonSize,
	} = require('ui-system/blocks/chips/chip-button');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Area } = require('ui-system/layout/area');
	const { Box, BoxFooter } = require('ui-system/layout/box');
	const { PopupMenu, PopupMenuPosition } = require('ui-system/popups/popup-menu');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const {
		normalizeAbsoluteUrl,
		normalizePositiveInteger,
		renderVibeCodeCatalogState,
	} = require('vibecode/catalog');
	const { VibeCodeCatalogShareLinkSheet } = require('vibecode/catalog/share/src/link-sheet');
	const {
		VibeCodeCatalogShareApi,
		normalizeShareErrorCode,
	} = require('vibecode/catalog/share/src/share-api');
	const {
		Audience,
		LinkAvailability,
		ShareViewStatus,
		VibeCodeCatalogShareStateMachine,
	} = require('vibecode/catalog/share/src/share-state');

	const AUDIENCE_MENU_SECTION_CODE = 'vibecode-share-audience';
	const APPLICATION_ICON_SIZE = 40;
	const CHIP_GAP = Indent.XS.toNumber();
	const MEMBER_CHIP_ROW_HEIGHT = ChipButtonSize.M.getHeight() + CHIP_GAP;

	/**
	 * A whole department can bring hundreds of chips, so the cloud stops growing at two rows and a
	 * half: the row cut in the middle is what shows there is more of the list below.
	 */
	const MEMBERS_MAX_HEIGHT = MEMBER_CHIP_ROW_HEIGHT * 2.5;
	const IS_IOS = Application.getPlatform() === 'ios';

	/** Error code of a copy blocked by the device policy: utils/copy reports it with its own toast. */
	const COPY_BLOCKED_ERROR_CODE = 1;

	const USER_ENTITY_ID = 'user';
	const DEPARTMENT_ENTITY_ID = 'department';
	const MEMBER_ENTITY_IDS = [USER_ENTITY_ID, DEPARTMENT_ENTITY_ID];
	const MEMBER_SELECTOR_CONTEXT = 'VIBECODE_CATALOG_SHARE';

	const MEMBER_ENTITY_OPTIONS = {
		[USER_ENTITY_ID]: {
			options: {
				intranetUsersOnly: true,
			},
			searchable: true,
			dynamicLoad: true,
			dynamicSearch: true,
		},
		[DEPARTMENT_ENTITY_ID]: {
			// The flat list of departments is the default of the entity, not the behaviour of the
			// selector: the tree comes back as soon as that default is overridden here.
			options: {
				selectMode: 'departmentsOnly',
				allowFlatDepartments: false,
				allowSelectRootDepartment: true,
			},
			searchable: true,
			dynamicLoad: true,
			dynamicSearch: true,
		},
	};

	const AUDIENCE_ORDER = [
		Audience.OwnerOnly,
		Audience.SpecificMembers,
		Audience.Portal,
		Audience.Authenticated,
		Audience.Public,
	];

	const AUDIENCE_PHRASES = Object.freeze({
		[Audience.OwnerOnly]: 'MOBILE_VIBECODE_CATALOG_SHARE_AUDIENCE_OWNER_ONLY',
		[Audience.SpecificMembers]: 'MOBILE_VIBECODE_CATALOG_SHARE_AUDIENCE_SPECIFIC_MEMBERS',
		[Audience.Portal]: 'MOBILE_VIBECODE_CATALOG_SHARE_AUDIENCE_PORTAL',
		[Audience.Authenticated]: 'MOBILE_VIBECODE_CATALOG_SHARE_AUDIENCE_AUTHENTICATED',
		[Audience.Public]: 'MOBILE_VIBECODE_CATALOG_SHARE_AUDIENCE_PUBLIC',
	});

	const GLOBAL_AUDIENCE_CONFIRMATIONS = Object.freeze({
		[Audience.Authenticated]: {
			title: 'MOBILE_VIBECODE_CATALOG_SHARE_CONFIRM_AUTHENTICATED_TITLE',
			description: 'MOBILE_VIBECODE_CATALOG_SHARE_CONFIRM_AUTHENTICATED_DESCRIPTION',
		},
		[Audience.Public]: {
			title: 'MOBILE_VIBECODE_CATALOG_SHARE_CONFIRM_PUBLIC_TITLE',
			description: 'MOBILE_VIBECODE_CATALOG_SHARE_CONFIRM_PUBLIC_DESCRIPTION',
		},
	});

	const EDITABLE_STATUSES = new Set([ShareViewStatus.Audience, ShareViewStatus.MemberDraft]);
	const SAVING_STATUSES = new Set([ShareViewStatus.SavingShare, ShareViewStatus.RefreshingLink]);

	/** The user has gone to the link sheet: this sheet waits below untouched until they come back. */
	const LINK_SHEET_STATUSES = new Set([
		ShareViewStatus.GeneratingDefaultLink,
		ShareViewStatus.LinkSettings,
	]);

	/**
	 * The application is reachable directly, so the public link is meaningless for these audiences.
	 *
	 * @param {Audience} [audience]
	 * @return {boolean}
	 */
	const hasDirectGlobalAccess = (audience) => audience === Audience.Authenticated || audience === Audience.Public;

	/**
	 * @param {Audience} audience
	 * @return {string}
	 */
	const audienceTestIdSuffix = (audience) => audience.toLowerCase().replaceAll('_', '-');

	/**
	 * What the height of the member cloud depends on: its composition and whether the chips carry a
	 * clear icon, which makes every chip wider.
	 *
	 * @param {ShareMember[]} members
	 * @param {boolean} hasClearIcon
	 * @return {string}
	 */
	const membersCloudKey = (members, hasClearIcon) => [
		hasClearIcon ? 'clearable' : 'readonly',
		...members.map(({ entityId, participant }) => `${entityId}-${participant.id}`),
	].join('|');

	/**
	 * @param {ShareParticipant[]} participants
	 * @return {Array<{ id: string, title: string }>}
	 */
	const toSelectorItems = (participants) => participants.map(({ id, name }) => ({ id, title: name }));

	/**
	 * @param {Array<{ id: string|number, title: string }>} [items]
	 * @return {ShareParticipant[]}
	 */
	const toParticipants = (items) => (Array.isArray(items) ? items : []).map(({ id, title }) => ({
		id: String(id),
		name: String(title ?? ''),
	}));

	/**
	 * Sharing sheet of a Vibecode application: renders the snapshot of the state machine and hands
	 * it back the user intent. It decides nothing about what is allowed and what counts as changed.
	 *
	 * @extends {PureComponent<VibeCodeCatalogShareSheetProps, VibeCodeCatalogShareSheetState>}
	 */
	class VibeCodeCatalogShareSheet extends PureComponent
	{
		/**
		 * @param {VibeCodeCatalogShareSheetProps} props
		 * @param {LayoutWidget} [parentWidget]
		 * @return {Promise<void>}
		 */
		static open(props, parentWidget = PageManager)
		{
			const sheet = new VibeCodeCatalogShareSheet({ ...props, parentWidget });

			return new BottomSheet({ component: sheet })
				.setParentWidget(parentWidget)
				.setTitle(Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_TITLE'))
				.setBackgroundColor(Color.bgSecondary)
				.setNavigationBarColor(Color.bgSecondary)
				.disableOnlyMediumPosition()
				.enableResizeContent()
				.enableSwipe()
				.disableHorizontalSwipe()
				// The member cloud scrolls on its own: without this the sheet takes that drag and rises.
				.disableContentSwipe()
				.open()
				.then((layoutWidget) => {
					sheet.setLayoutWidget(layoutWidget);
				})
			;
		}

		/**
		 * @param {VibeCodeCatalogShareSheetProps} props
		 */
		constructor(props)
		{
			super(props);

			this.machine = new VibeCodeCatalogShareStateMachine();
			this.api = new VibeCodeCatalogShareApi();
			this.state = {
				snapshot: this.machine.getSnapshot(),
				membersCloud: null,
			};
			this.layoutWidget = null;
			this.audienceMenu = null;
			this.audienceRowRef = null;
			this.saveRequest = null;
			this.getTestId = createTestIdGenerator({
				prefix: 'share-sheet',
				context: this,
			});
		}

		componentDidMount()
		{
			void this.load();
		}

		componentWillUnmount()
		{
			super.componentWillUnmount();

			this.audienceMenu?.hide?.();
			this.audienceMenu = null;
			this.machine.close();
		}

		/**
		 * @param {LayoutWidget} layoutWidget
		 */
		setLayoutWidget(layoutWidget)
		{
			this.layoutWidget = layoutWidget;
		}

		/**
		 * @return {Promise<void>}
		 */
		load()
		{
			const { status } = this.machine.getSnapshot();
			if (status === ShareViewStatus.LoadError)
			{
				this.machine.retryLoading();
			}
			else if (status !== ShareViewStatus.Loading && !this.machine.beginLoading())
			{
				return Promise.resolve();
			}

			this.syncSnapshot();

			const catalogItemId = this.getCatalogItemId();

			return Promise.all([
				this.api.getShare(catalogItemId),
				this.api.getLink(catalogItemId),
			])
				.then(([share, linkState]) => {
					this.machine.completeLoading(share, linkState);
				})
				.catch((error) => {
					this.machine.failLoading(normalizeShareErrorCode(error));
				})
				.then(() => {
					this.syncSnapshot();
				})
			;
		}

		/**
		 * Отрисованное состояние - копия снимка, и только для отрисовки. Решения читают машину напрямую:
		 * второй `setState` в одном тике до `this.state` уже не доезжает (проверено на устройстве -
		 * машина отдавала пустой состав и поднятый вопрос, а `this.state` всё ещё прежний состав), и
		 * решение по нему молча уходило бы не в ту сторону.
		 *
		 * @return {void}
		 */
		syncSnapshot()
		{
			this.setState({ snapshot: this.machine.getSnapshot() });
		}

		/**
		 * The cloud reports its full height from inside its own scroll, but reports it twice: once with
		 * the gap under the last row of chips and once without it (measured on device). The taller of
		 * the two is the cloud, so within one composition the height only grows; a new composition
		 * starts the measurement over. A zero is a pass with nothing to measure yet.
		 *
		 * @param {string} key
		 * @param {number} height
		 * @return {void}
		 */
		handleMembersCloudLayout = (key, height) => {
			if (height <= 0)
			{
				return;
			}

			const { membersCloud } = this.state;
			const isSameComposition = membersCloud?.key === key;
			const next = isSameComposition ? Math.max(membersCloud.height, height) : height;
			if (isSameComposition && next === membersCloud.height)
			{
				return;
			}

			this.setState({ membersCloud: { key, height: next } });
		};

		handleRetry = () => {
			void this.load();
		};

		handleAudienceClick = () => {
			this.cancelAbandonedConfirmation();

			const snapshot = this.machine.getSnapshot();
			if (!this.isAudienceEditable(snapshot))
			{
				return;
			}

			this.audienceMenu?.hide?.();
			this.audienceMenu = new PopupMenu({
				items: AUDIENCE_ORDER.map((audience) => ({
					id: audience,
					testId: this.getTestId(`audience-${audienceTestIdSuffix(audience)}`),
					title: Loc.getMessage(AUDIENCE_PHRASES[audience]),
					checked: audience === snapshot.draftShare?.audience,
					sectionCode: AUDIENCE_MENU_SECTION_CODE,
					onItemSelected: () => this.selectAudience(audience),
				})),
				sections: [
					{
						id: AUDIENCE_MENU_SECTION_CODE,
					},
				],
			});

			const showOptions = {
				position: this.audienceRowRef ? PopupMenuPosition.BOTTOM : PopupMenuPosition.TOP_RIGHT,
			};
			if (this.audienceRowRef)
			{
				showOptions.target = this.audienceRowRef;
			}

			this.audienceMenu.show(showOptions);
		};

		/**
		 * @param {Audience} audience
		 */
		selectAudience(audience)
		{
			if (this.machine.selectAudience(audience))
			{
				this.syncSnapshot();

				return;
			}

			const { pendingAudience } = this.machine.getSnapshot();
			if (pendingAudience === null)
			{
				return;
			}

			const phrases = GLOBAL_AUDIENCE_CONFIRMATIONS[pendingAudience];
			confirmDefaultAction({
				title: Loc.getMessage(phrases.title),
				description: Loc.getMessage(phrases.description),
				actionButtonText: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_CONFIRM_GLOBAL_BUTTON'),
				cancelButtonText: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_CANCEL'),
				onAction: () => {
					if (this.machine.confirmLinkRevoke())
					{
						this.syncSnapshot();
					}
				},
				onCancel: () => {
					if (this.machine.cancelLinkRevoke())
					{
						this.syncSnapshot();
					}
				},
			});
		}

		handleOpenMemberSelector = () => {
			const snapshot = this.machine.getSnapshot();
			if (snapshot.draftShare === null || !this.isAudienceEditable(snapshot))
			{
				return;
			}

			const { draftShare } = snapshot;

			void new RecipientSelector(MEMBER_SELECTOR_CONTEXT, MEMBER_ENTITY_IDS)
				.setEntitiesOptions(MEMBER_ENTITY_OPTIONS)
				.setMultipleSelection(true)
				.open({
					title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_ADD_MEMBERS'),
					selected: {
						[USER_ENTITY_ID]: toSelectorItems(draftShare.users),
						[DEPARTMENT_ENTITY_ID]: toSelectorItems(draftShare.departments),
					},
				})
				.then((selected) => {
					this.applyMembers(
						toParticipants(selected?.[USER_ENTITY_ID]),
						toParticipants(selected?.[DEPARTMENT_ENTITY_ID]),
					);
				})
				.catch((error) => {
					console.error('[vibecode/catalog] failed to select the sharing members', error);
				})
			;
		};

		/**
		 * @param {string} entityId
		 * @param {string} participantId
		 */
		removeMember(entityId, participantId)
		{
			const { draftShare } = this.machine.getSnapshot();
			if (draftShare === null)
			{
				return;
			}

			this.applyMembers(
				entityId === USER_ENTITY_ID
					? draftShare.users.filter(({ id }) => id !== participantId)
					: draftShare.users,
				entityId === DEPARTMENT_ENTITY_ID
					? draftShare.departments.filter(({ id }) => id !== participantId)
					: draftShare.departments,
			);
		}

		/**
		 * @param {ShareParticipant[]} users
		 * @param {ShareParticipant[]} departments
		 */
		applyMembers(users, departments)
		{
			if (!this.machine.setMembers(users, departments))
			{
				return;
			}

			this.syncSnapshot();

			if (this.machine.getSnapshot().ownerOnlyConfirmationRequired)
			{
				this.confirmOwnerOnly();
			}
		}

		confirmOwnerOnly()
		{
			confirmDefaultAction({
				title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_CONFIRM_OWNER_ONLY_TITLE'),
				description: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_CONFIRM_OWNER_ONLY_DESCRIPTION'),
				actionButtonText: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_CONFIRM_OWNER_ONLY_BUTTON'),
				cancelButtonText: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_CANCEL'),
				onAction: () => {
					if (this.machine.confirmOwnerOnly())
					{
						this.syncSnapshot();
					}
				},
				onCancel: () => {
					if (this.machine.cancelOwnerOnly())
					{
						this.syncSnapshot();
					}
				},
			});
		}

		/**
		 * A confirmation can disappear without an answer - the system takes the screen away, Android
		 * rebuilds the activity underneath it - and then neither answer ever reaches the machine: it
		 * goes on waiting while the sheet greys out. The next tap is read as the refusal that never
		 * came; nothing has been stored by then, so the draft stays as it was.
		 *
		 * @return {void}
		 */
		cancelAbandonedConfirmation()
		{
			const linkRevokeAnswered = this.machine.cancelLinkRevoke();
			const ownerOnlyAnswered = this.machine.cancelOwnerOnly();

			if (linkRevokeAnswered || ownerOnlyAnswered)
			{
				this.syncSnapshot();
			}
		}

		handleSave = () => {
			if (this.saveRequest !== null)
			{
				return;
			}

			this.cancelAbandonedConfirmation();

			let desiredShare = null;
			try
			{
				desiredShare = this.machine.beginShareSave();
			}
			catch (error)
			{
				this.machine.setEditableError(normalizeShareErrorCode(error));
				this.syncSnapshot();

				return;
			}

			this.syncSnapshot();
			this.saveRequest = this.saveShare(desiredShare).then(() => {
				this.saveRequest = null;
			});
		};

		/**
		 * The public link state is re-read only after the audience is stored: the server revokes the
		 * link while saving, and its new state comes from that second request, not from the client.
		 *
		 * @param {SharePayload} desiredShare
		 * @return {Promise<void>}
		 */
		saveShare(desiredShare)
		{
			const catalogItemId = this.getCatalogItemId();

			return this.api.setShare(catalogItemId, desiredShare)
				.then((canonicalShare) => {
					this.machine.completeShareSave(canonicalShare);
					this.syncSnapshot();

					return this.api.getLink(catalogItemId);
				})
				.then((linkState) => {
					this.machine.completeLinkRefresh(linkState);
					this.close();
					showToast({
						message: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_SAVED'),
					}, this.props.parentWidget);
				})
				.catch((error) => {
					this.machine.failSaving(normalizeShareErrorCode(error));
					this.syncSnapshot();
				})
			;
		}

		handleOpenLinkSettings = () => {
			this.cancelAbandonedConfirmation();

			if (!this.machine.openLinkSettings(this.now()))
			{
				return;
			}

			this.syncSnapshot();

			void VibeCodeCatalogShareLinkSheet.open(
				{
					machine: this.machine,
					api: this.api,
					catalogItemId: this.getCatalogItemId(),
					now: this.props.now,
					onClose: this.handleLinkSettingsClosed,
				},
				this.layoutWidget ?? this.props.parentWidget,
			);
		};

		handleLinkSettingsClosed = () => {
			this.syncSnapshot();
		};

		handleCopyApplicationLink = () => {
			const applicationUrl = this.getApplicationUrl();
			if (!applicationUrl)
			{
				return;
			}

			void copyToClipboard(
				applicationUrl,
				Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_COPIED'),
			).catch((error) => {
				if (error?.code === COPY_BLOCKED_ERROR_CODE)
				{
					return;
				}

				showErrorToast({
					message: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_COPY_ERROR'),
				}, this.layoutWidget);
			});
		};

		close()
		{
			this.machine.close();
			this.layoutWidget?.close?.();
		}

		bindAudienceRowRef = (ref) => {
			this.audienceRowRef = ref;
		};

		/**
		 * The only clock of the sharing flow: it is handed on to the link sheet as it is.
		 *
		 * @return {Date}
		 */
		now()
		{
			return this.props.now?.() ?? new Date();
		}

		/**
		 * @return {VibeCodeCatalogItemData}
		 */
		getItem()
		{
			return this.props.item ?? {};
		}

		/**
		 * @return {number|null}
		 */
		getCatalogItemId()
		{
			return normalizePositiveInteger(this.getItem().id);
		}

		/**
		 * @return {string}
		 */
		getApplicationUrl()
		{
			return normalizeAbsoluteUrl(this.getItem().viewUrl);
		}

		/**
		 * Whether the audience block still answers taps. The state machine refuses the same
		 * transitions on its own, so this only decides how far a tap gets to travel.
		 *
		 * @param {ShareSnapshot} snapshot
		 * @return {boolean}
		 */
		isAudienceEditable(snapshot)
		{
			return EDITABLE_STATUSES.has(snapshot.status) && !this.hasPendingConfirmation(snapshot);
		}

		/**
		 * Whether the audience block is greyed out. Leaving for the link sheet is not a reason to grey
		 * anything: the sheet keeps the look the user left it with, and only what it is truly busy
		 * with - a save or a confirmation of its own - dims it.
		 *
		 * @param {ShareSnapshot} snapshot
		 * @return {boolean}
		 */
		isAudienceDimmed(snapshot)
		{
			const isLive = EDITABLE_STATUSES.has(snapshot.status) || LINK_SHEET_STATUSES.has(snapshot.status);

			return !isLive || this.hasPendingConfirmation(snapshot);
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 * @return {boolean}
		 */
		hasPendingConfirmation(snapshot)
		{
			return snapshot.pendingAudience !== null || snapshot.ownerOnlyConfirmationRequired;
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 * @return {boolean}
		 */
		isSaving(snapshot)
		{
			return SAVING_STATUSES.has(snapshot.status);
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 * @return {boolean}
		 */
		isSaveHidden(snapshot)
		{
			return snapshot.draftShare?.audience === Audience.SpecificMembers
				&& snapshot.draftShare.users.length === 0
				&& snapshot.draftShare.departments.length === 0
			;
		}

		render()
		{
			const { snapshot } = this.state;

			if (snapshot.status === ShareViewStatus.Loading)
			{
				return this.renderStateScreen(LoadingScreen({
					testId: this.getTestId('loading'),
				}));
			}

			if (snapshot.status === ShareViewStatus.LoadError)
			{
				return this.renderStateScreen(renderVibeCodeCatalogState({
					testId: this.getTestId('load-error'),
					title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LOAD_ERROR'),
					actionText: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_RETRY'),
					onActionClick: this.handleRetry,
				}));
			}

			return this.renderEditor(snapshot);
		}

		renderStateScreen(content)
		{
			return Box(
				{
					testId: this.getTestId(),
					safeArea: { bottom: true },
					style: {
						flex: 1,
					},
				},
				content,
			);
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 */
		renderEditor(snapshot)
		{
			return Box(
				{
					testId: this.getTestId(),
					withScroll: true,
					safeArea: { bottom: true },
					footer: this.renderFooter(snapshot),
				},
				Area(
					{
						isFirst: true,
					},
					Text5({
						testId: this.getTestId('description'),
						text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_DESCRIPTION'),
						color: Color.base3,
					}),
					this.renderApplication(),
					this.renderAudience(snapshot),
					this.renderMembers(snapshot),
					this.renderLinkSettings(snapshot),
					this.renderError(snapshot),
				),
			);
		}

		renderApplication()
		{
			const item = this.getItem();

			return View(
				{
					testId: this.getTestId('application'),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginTop: Indent.XL.toNumber(),
					},
				},
				this.renderApplicationIcon(),
				Text3({
					testId: this.getTestId('application-title'),
					text: item.title ?? '',
					numberOfLines: 2,
					style: {
						flex: 1,
						marginLeft: Indent.L.toNumber(),
					},
				}),
			);
		}

		renderApplicationIcon()
		{
			const iconStyle = {
				width: APPLICATION_ICON_SIZE,
				height: APPLICATION_ICON_SIZE,
				borderRadius: Corner.M.toNumber(),
			};
			const iconUrl = normalizeAbsoluteUrl(this.getItem().iconUrl);

			if (iconUrl)
			{
				return SafeImage({
					testId: this.getTestId('application-icon'),
					uri: iconUrl,
					resizeMode: 'cover',
					style: iconStyle,
				});
			}

			return View(
				{
					testId: this.getTestId('application-icon-placeholder'),
					style: {
						...iconStyle,
						backgroundColor: Color.accentSoftBlue2.toHex(),
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				IconView({
					testId: this.getTestId('application-icon-placeholder-icon'),
					icon: Icon.APPS,
					size: 24,
					color: Color.baseWhiteFixed,
				}),
			);
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 */
		renderAudience(snapshot)
		{
			const isDimmed = this.isAudienceDimmed(snapshot);
			const audience = snapshot.draftShare?.audience ?? Audience.OwnerOnly;

			return SettingSelectorList({
				testId: this.getTestId('audience'),
				style: {
					marginTop: Indent.XL.toNumber(),
				},
				items: [
					{
						id: 'value',
						testId: this.getTestId('audience'),
						title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_AUDIENCE_TITLE'),
						subtitle: Loc.getMessage(AUDIENCE_PHRASES[audience]),
						design: SettingSelectorListItemDesign.OPENER,
						disabled: isDimmed,
					},
				],
				itemRef: this.bindAudienceRowRef,
				onItemClick: this.handleAudienceClick,
			});
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 */
		renderMembers(snapshot)
		{
			const { draftShare } = snapshot;
			if (draftShare?.audience !== Audience.SpecificMembers)
			{
				return null;
			}

			const isDimmed = this.isAudienceDimmed(snapshot);
			const members = [
				...draftShare.users.map((participant) => ({ entityId: USER_ENTITY_ID, participant })),
				...draftShare.departments.map((participant) => ({ entityId: DEPARTMENT_ENTITY_ID, participant })),
			];

			return View(
				{
					testId: this.getTestId('members'),
					style: {
						marginTop: Indent.XL.toNumber(),
					},
				},
				Text5({
					testId: this.getTestId('members-title'),
					text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_MEMBERS_TITLE'),
					color: Color.base3,
				}),
				members.length > 0 && this.renderMembersBox(members, !isDimmed),
				ChipButton({
					testId: this.getTestId('members-add'),
					text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_ADD_MEMBERS'),
					icon: Icon.PLUS,
					design: ChipButtonDesign.PRIMARY,
					mode: ChipButtonMode.OUTLINE,
					disabled: isDimmed,
					onClick: this.handleOpenMemberSelector,
					style: {
						alignSelf: 'flex-start',
						marginTop: Indent.M.toNumber(),
					},
				}),
			);
		}

		/**
		 * Drawn only for a composition that has someone in it: an empty box is a frame around nothing.
		 *
		 * A native scroll has no size of its own: both a free height and a percentage of a box that is
		 * itself sized by its content collapse it to nothing. So the scroll is always given a number: the
		 * measured height of the cloud, capped by MEMBERS_MAX_HEIGHT, and a single row before the first
		 * measurement. The scroll stays the same node throughout: swapping it for a plain view rebuilds
		 * the whole block on every change of the composition.
		 *
		 * @param {ShareMember[]} members
		 * @param {boolean} hasClearIcon
		 */
		renderMembersBox(members, hasClearIcon)
		{
			const key = membersCloudKey(members, hasClearIcon);
			const { membersCloud } = this.state;
			// Until the cloud is measured the previous height carries it: starting from the ceiling would
			// make every short composition open expanded and then shrink.
			const height = Math.min(membersCloud?.height ?? MEMBER_CHIP_ROW_HEIGHT, MEMBERS_MAX_HEIGHT);
			const chips = members.map(({ entityId, participant }) => ChipButton({
				testId: this.getTestId(`members-${entityId}-${participant.id}`),
				text: participant.name,
				design: ChipButtonDesign.GREY,
				mode: ChipButtonMode.SOLID,
				backgroundColor: Color.accentSoftBlue3,
				color: Color.accentMainPrimary,
				clearable: hasClearIcon,
				onClear: () => this.removeMember(entityId, participant.id),
				style: {
					marginRight: CHIP_GAP,
					marginBottom: CHIP_GAP,
				},
			}));

			return View(
				{
					// The cloud scrolls on its own, and outside iOS the sheet scroll takes that drag unless
					// the frame claims the touches for itself.
					interactable: !IS_IOS,
					style: {
						marginTop: Indent.M.toNumber(),
						borderWidth: 1,
						borderColor: Color.bgSeparatorPrimary.toHex(),
						borderRadius: Corner.L.toNumber(),
						paddingHorizontal: Indent.M.toNumber(),
						paddingTop: Indent.M.toNumber(),
						// The last row of chips carries a gap of its own, so the box gives that much back.
						paddingBottom: Indent.M.toNumber() - CHIP_GAP,
					},
				},
				ScrollView(
					{
						testId: this.getTestId('members-cloud'),
						bounces: false,
						style: { height },
					},
					// The row goes inside the scroll's own view, not on it: the axis of a scroll is read from
					// the flexDirection of the view it holds, and a row there scrolls sideways.
					View(
						{
							onLayout: ({ height: measured }) => this.handleMembersCloudLayout(key, measured),
							style: {
								width: '100%',
								flexDirection: 'row',
								flexWrap: 'wrap',
								alignItems: 'flex-start',
								justifyContent: 'flex-start',
							},
						},
						...chips,
					),
				),
			);
		}

		/**
		 * The way into the public link settings. It is offered only while the link means something:
		 * at a global audience the application is reachable by its own address instead.
		 *
		 * @param {ShareSnapshot} snapshot
		 */
		renderLinkSettings(snapshot)
		{
			if (
				snapshot.linkState?.availability !== LinkAvailability.Available
				|| hasDirectGlobalAccess(snapshot.draftShare?.audience)
			)
			{
				return null;
			}

			return SettingSelectorList({
				testId: this.getTestId('link-settings'),
				style: {
					marginTop: Indent.XL.toNumber(),
				},
				items: [
					{
						id: 'value',
						title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_SETTINGS'),
						design: SettingSelectorListItemDesign.OPENER,
						disabled: this.isAudienceDimmed(snapshot),
					},
				],
				onItemClick: this.handleOpenLinkSettings,
			});
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 */
		renderError(snapshot)
		{
			if (snapshot.errorCode === null)
			{
				return null;
			}

			return Text5({
				testId: this.getTestId('error'),
				text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_SAVE_ERROR'),
				color: Color.accentMainAlert,
				style: {
					marginTop: Indent.L.toNumber(),
				},
			});
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 */
		renderFooter(snapshot)
		{
			return BoxFooter(
				{
					testId: this.getTestId('footer'),
				},
				this.renderCopyApplicationLink(snapshot),
				this.renderSave(snapshot),
			);
		}

		/**
		 * At a global audience the application is reachable by its own address, so its link replaces
		 * the public one. Copying does not depend on the unsaved draft and saves nothing itself.
		 *
		 * @param {ShareSnapshot} snapshot
		 */
		renderCopyApplicationLink(snapshot)
		{
			if (!hasDirectGlobalAccess(snapshot.draftShare?.audience) || !this.getApplicationUrl())
			{
				return null;
			}

			return Button({
				testId: this.getTestId('copy-application-link'),
				text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_COPY_APPLICATION_LINK'),
				design: ButtonDesign.OUTLINE,
				size: ButtonSize.L,
				stretched: true,
				disabled: this.isSaving(snapshot),
				onClick: this.handleCopyApplicationLink,
				style: {
					marginBottom: Indent.M.toNumber(),
				},
			});
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 */
		renderSave(snapshot)
		{
			if (this.isSaveHidden(snapshot))
			{
				return null;
			}

			const isSaving = this.isSaving(snapshot);

			return Button({
				testId: this.getTestId('save'),
				text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_SAVE'),
				design: ButtonDesign.FILLED,
				size: ButtonSize.L,
				stretched: true,
				loading: isSaving,
				disabled: isSaving || !snapshot.isShareDraftDirty,
				onClick: this.handleSave,
			});
		}
	}

	module.exports = {
		VibeCodeCatalogShareSheet,
	};
});
