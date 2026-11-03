/**
 * @module vibecode/catalog/share/src/link-sheet
 */
jn.define('vibecode/catalog/share/src/link-sheet', (require, exports, module) => {
	const { confirmDefaultAction, confirmDestructiveAction } = require('alert');
	const { BottomSheet } = require('bottom-sheet');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { showToast } = require('toast');
	const { Type } = require('type');
	const { Moment } = require('utils/date');
	const { longDate, shortTime } = require('utils/date/formats');
	const { createTestIdGenerator } = require('utils/test');
	const { PureComponent } = require('layout/pure-component');
	const { LoadingScreen } = require('layout/ui/loading-screen');
	const { Icon } = require('ui-system/blocks/icon');
	const { SettingSelector } = require('ui-system/blocks/setting-selector');
	const { SwitcherSize } = require('ui-system/blocks/switcher');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Input, InputDesign } = require('ui-system/form/inputs/input');
	const { Area } = require('ui-system/layout/area');
	const { Box, BoxFooter } = require('ui-system/layout/box');
	const { Card } = require('ui-system/layout/card');
	const { CardList } = require('ui-system/layout/card-list');
	const { Text5 } = require('ui-system/typography/text');
	const { normalizeShareErrorCode } = require('vibecode/catalog/share/src/share-api');
	const {
		LINK_EXPIRY_MAX_OFFSET_SECONDS,
		LINK_EXPIRY_MIN_OFFSET_SECONDS,
		LinkAvailability,
		ShareViewStatus,
	} = require('vibecode/catalog/share/src/share-state');

	const MILLISECONDS_IN_SECOND = 1000;

	/** Local code of a copy that did not reach the clipboard: the save itself has succeeded. */
	const COPY_FAILED_ERROR_CODE = 'COPY_FAILED';

	const EXPIRY_ERROR_CODES = new Set(['LINK_EXPIRY_TOO_SOON', 'LINK_EXPIRY_TOO_LATE']);

	/**
	 * Statuses in which the sheet still answers taps. A confirmation waiting for its answer is one of
	 * them on purpose: nothing is stored while it waits, so the next tap is free to end it.
	 */
	const LIVE_STATUSES = new Set([
		ShareViewStatus.LinkSettings,
		ShareViewStatus.ConfirmAnonymousLink,
		ShareViewStatus.ConfirmPortalLinkRevoke,
	]);

	const DATE_PICKED_EVENT = 'onPick';

	/**
	 * @param {string} errorCode
	 * @return {string}
	 */
	const errorPhrase = (errorCode) => {
		if (errorCode === COPY_FAILED_ERROR_CODE)
		{
			return 'MOBILE_VIBECODE_CATALOG_SHARE_LINK_COPY_ERROR';
		}

		if (EXPIRY_ERROR_CODES.has(errorCode))
		{
			return 'MOBILE_VIBECODE_CATALOG_SHARE_LINK_EXPIRY_ERROR';
		}

		return 'MOBILE_VIBECODE_CATALOG_SHARE_LINK_SAVE_ERROR';
	};

	/**
	 * @param {Date} expiresAt
	 * @return {string}
	 */
	const formatExpiry = (expiresAt) => {
		const moment = Moment.createFromTimestamp(Math.floor(expiresAt.getTime() / MILLISECONDS_IN_SECOND));

		return `${moment.format(longDate)}, ${moment.format(shortTime)}`;
	};

	/**
	 * Settings of the public link: the second sheet, opened over the audience one and driven by the
	 * same state machine. It renders the snapshot and hands the user intent back; what is allowed,
	 * what counts as changed and what has to be confirmed is decided there, not here.
	 *
	 * @extends {PureComponent<VibeCodeCatalogShareLinkSheetProps, VibeCodeCatalogShareLinkSheetState>}
	 */
	class VibeCodeCatalogShareLinkSheet extends PureComponent
	{
		/**
		 * @param {VibeCodeCatalogShareLinkSheetProps} props
		 * @param {LayoutWidget} [parentWidget] the widget of the audience sheet
		 * @return {Promise<void>}
		 */
		static open(props, parentWidget = PageManager)
		{
			const sheet = new VibeCodeCatalogShareLinkSheet(props);

			return new BottomSheet({ component: sheet })
				.setParentWidget(parentWidget)
				.setTitle(Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_TITLE'))
				.setBackgroundColor(Color.bgSecondary)
				.setNavigationBarColor(Color.bgSecondary)
				.disableOnlyMediumPosition()
				.enableResizeContent()
				.enableSwipe()
				.disableHorizontalSwipe()
				.open()
				.then((layoutWidget) => {
					sheet.setLayoutWidget(layoutWidget);
				})
			;
		}

		/**
		 * @param {VibeCodeCatalogShareLinkSheetProps} props
		 */
		constructor(props)
		{
			super(props);

			this.machine = props.machine;
			this.api = props.api;
			this.state = this.createViewState();
			this.layoutWidget = null;
			this.linkRequest = null;
			this.destroyed = false;
			this.getTestId = createTestIdGenerator({
				prefix: 'share-link-sheet',
				context: this,
			});
		}

		componentDidMount()
		{
			if (this.machine.getSnapshot().status === ShareViewStatus.GeneratingDefaultLink)
			{
				this.generateDefaultLink();
			}
		}

		componentWillUnmount()
		{
			super.componentWillUnmount();

			this.destroyed = true;
			this.leaveLinkSettings();
		}

		/**
		 * @param {LayoutWidget} layoutWidget
		 */
		setLayoutWidget(layoutWidget)
		{
			this.layoutWidget = layoutWidget;
		}

		/**
		 * Puts the shared machine back on the audience screen. A request still in flight leaves the
		 * machine in a saving status, so it repeats the call once the answer arrives.
		 *
		 * @return {void}
		 */
		leaveLinkSettings()
		{
			this.machine.closeLinkSettings();
			this.props.onClose?.();
		}

		/**
		 * @return {Date}
		 */
		now()
		{
			return this.props.now?.() ?? new Date();
		}

		/**
		 * @return {number|null}
		 */
		getCatalogItemId()
		{
			return this.props.catalogItemId ?? null;
		}

		/**
		 * Отрисованное состояние - копия снимка, и только для отрисовки. Решения читают машину напрямую:
		 * второй `setState` в одном тике до `this.state` уже не доезжает, и решение по нему молча ушло бы
		 * не в ту сторону.
		 *
		 * @return {void}
		 */
		syncSnapshot()
		{
			this.setState(this.createViewState());
		}

		/**
		 * Признак истечения держится в состоянии вместе со снимком, потому что зависит не от машины, а от
		 * часов: `PureComponent` сравнивает состояние по значению, и снимок, не изменившийся к моменту
		 * истечения срока, экран бы не перерисовал.
		 *
		 * @return {VibeCodeCatalogShareLinkSheetState}
		 */
		createViewState()
		{
			const snapshot = this.machine.getSnapshot();

			return {
				snapshot,
				isExpired: this.isExpired(snapshot),
			};
		}

		/**
		 * Keeps a single link request at a time and brings the sheet back in step with the machine
		 * afterwards. A request that outlives the sheet only returns the machine to the audience.
		 *
		 * @param {Promise<void>} request
		 * @return {void}
		 */
		runLinkRequest(request)
		{
			this.linkRequest = request.then(() => {
				if (this.destroyed)
				{
					this.leaveLinkSettings();
				}
				else
				{
					this.syncSnapshot();
				}

				this.linkRequest = null;
			});
		}

		/**
		 * @return {void}
		 */
		generateDefaultLink()
		{
			let payload = null;
			try
			{
				payload = this.machine.prepareDefaultLinkGeneration(this.now());
			}
			catch (error)
			{
				this.machine.failDefaultLinkGeneration(normalizeShareErrorCode(error));
				this.syncSnapshot();

				return;
			}

			this.runLinkRequest(this.storeDefaultLink(payload));
		}

		/**
		 * @param {SetLinkPayload} payload
		 * @return {Promise<void>}
		 */
		async storeDefaultLink(payload)
		{
			try
			{
				const linkState = await this.api.setLink(this.getCatalogItemId(), payload);
				if (linkState.link === null)
				{
					throw new Error('LINK_GENERATION_FAILED');
				}

				this.machine.completeDefaultLinkGeneration(linkState, this.now());
			}
			catch (error)
			{
				this.machine.failDefaultLinkGeneration(normalizeShareErrorCode(error));
			}
		}

		/**
		 * @param {SetLinkPayload} payload
		 * @return {Promise<LinkState|null>} the stored state, or null when the request failed
		 */
		async saveLink(payload)
		{
			try
			{
				const linkState = await this.api.setLink(this.getCatalogItemId(), payload);
				this.machine.completeLinkSave(linkState, this.now());

				return linkState;
			}
			catch (error)
			{
				this.machine.failSaving(normalizeShareErrorCode(error));

				return null;
			}
		}

		/**
		 * @param {SetLinkPayload} payload
		 * @return {Promise<void>}
		 */
		async saveAndCopyLink(payload)
		{
			const linkState = await this.saveLink(payload);
			if (linkState === null || linkState.link === null)
			{
				return;
			}

			await this.copyLink(linkState.link.url);
		}

		/**
		 * @param {SetLinkPayload} payload
		 * @return {Promise<void>}
		 */
		async revokeLink(payload)
		{
			const linkState = await this.saveLink(payload);
			if (linkState !== null)
			{
				this.closeSheet();
			}
		}

		/**
		 * The address always comes from the answer of the server, never from the draft.
		 *
		 * @param {string} url
		 * @return {Promise<void>}
		 */
		async copyLink(url)
		{
			try
			{
				await Application.copyToClipboard(url);
				showToast({
					message: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_COPIED'),
					icon: Icon.COPY,
				}, this.layoutWidget);
			}
			catch
			{
				// The settings are stored, only the clipboard failed: hence a message in the sheet
				// instead of a toast about a failed action.
				this.machine.setLinkSettingsError(COPY_FAILED_ERROR_CODE);
			}
		}

		handleCopy = () => {
			if (this.linkRequest !== null)
			{
				return;
			}

			this.cancelAbandonedConfirmation();

			const snapshot = this.machine.getSnapshot();
			if (this.isExpired(snapshot))
			{
				// The screen has no timer of its own, so the expiry can pass while the sheet stands
				// still. Then the button is live only on the drawn frame: the sheet is brought back in
				// step instead of putting an address that no longer opens into the clipboard.
				this.syncSnapshot();

				return;
			}

			if (!snapshot.isLinkDraftDirty && this.hasStoredLink(snapshot))
			{
				this.runLinkRequest(this.copyLink(snapshot.linkState.link.url));

				return;
			}

			let payload = null;
			try
			{
				payload = this.machine.prepareLinkSave(this.now());
			}
			catch (error)
			{
				this.machine.setLinkSettingsError(normalizeShareErrorCode(error));
				this.syncSnapshot();

				return;
			}

			this.syncSnapshot();

			if (payload === null)
			{
				this.confirmAnonymousAccess();

				return;
			}

			this.runLinkRequest(this.saveAndCopyLink(payload));
		};

		confirmAnonymousAccess()
		{
			confirmDefaultAction({
				title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_CONFIRM_ANONYMOUS_TITLE'),
				description: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_CONFIRM_ANONYMOUS_DESCRIPTION'),
				actionButtonText: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_CONFIRM_ANONYMOUS_BUTTON'),
				cancelButtonText: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_CANCEL'),
				onAction: this.handleConfirmAnonymousAccess,
				onCancel: this.handleCancelAnonymousAccess,
			});
		}

		handleConfirmAnonymousAccess = () => {
			if (this.linkRequest !== null)
			{
				return;
			}

			let payload = null;
			try
			{
				payload = this.machine.confirmAnonymousLinkSave(this.now());
			}
			catch (error)
			{
				this.machine.cancelAnonymousLinkSave();
				this.machine.setLinkSettingsError(normalizeShareErrorCode(error));
				this.syncSnapshot();

				return;
			}

			this.syncSnapshot();
			this.runLinkRequest(this.saveAndCopyLink(payload));
		};

		handleCancelAnonymousAccess = () => {
			if (this.machine.cancelAnonymousLinkSave())
			{
				this.syncSnapshot();
			}
		};

		handleRevoke = () => {
			if (this.linkRequest !== null)
			{
				return;
			}

			this.cancelAbandonedConfirmation();

			if (!this.machine.requestPortalLinkRevoke())
			{
				return;
			}

			this.syncSnapshot();
			confirmDestructiveAction({
				title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_CONFIRM_REVOKE_TITLE'),
				description: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_CONFIRM_REVOKE_DESCRIPTION'),
				destructionText: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_CONFIRM_REVOKE_BUTTON'),
				cancelText: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_CANCEL'),
				onDestruct: this.handleConfirmRevoke,
				onCancel: this.handleCancelRevoke,
			});
		};

		handleConfirmRevoke = () => {
			if (this.linkRequest !== null)
			{
				return;
			}

			let payload = null;
			try
			{
				payload = this.machine.confirmPortalLinkRevoke();
			}
			catch (error)
			{
				this.machine.cancelPortalLinkRevoke();
				this.machine.setLinkSettingsError(normalizeShareErrorCode(error));
				this.syncSnapshot();

				return;
			}

			this.syncSnapshot();
			this.runLinkRequest(this.revokeLink(payload));
		};

		handleCancelRevoke = () => {
			if (this.machine.cancelPortalLinkRevoke())
			{
				this.syncSnapshot();
			}
		};

		/**
		 * A confirmation can disappear without an answer - the system takes the screen away, Android
		 * rebuilds the activity underneath it - and then neither answer ever reaches the machine: it
		 * goes on waiting for one. Every control of the sheet therefore ends the question first, and
		 * only then does its own work: nothing has been stored by the time the question is asked, so
		 * abandoning it is exactly the refusal that never came, and the draft stays as it was.
		 *
		 * @return {void}
		 */
		cancelAbandonedConfirmation()
		{
			const anonymousAnswered = this.machine.cancelAnonymousLinkSave();
			const revokeAnswered = this.machine.cancelPortalLinkRevoke();

			if (anonymousAnswered || revokeAnswered)
			{
				this.syncSnapshot();
			}
		}

		handleToggleExpiry = (expiryEnabled) => {
			this.cancelAbandonedConfirmation();

			if (this.machine.setLinkExpiryEnabled(expiryEnabled))
			{
				this.syncSnapshot();
			}
		};

		handleToggleRequireAuth = (requireB24Auth) => {
			this.cancelAbandonedConfirmation();

			if (this.machine.setLinkRequireB24Auth(requireB24Auth))
			{
				this.syncSnapshot();
			}
		};

		handleOpenExpiryPicker = () => {
			this.cancelAbandonedConfirmation();

			const snapshot = this.machine.getSnapshot();
			if (!this.isEditable(snapshot))
			{
				return;
			}

			const nowTime = this.now().getTime();

			dialogs.showDatePicker(
				{
					title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_EXPIRY'),
					type: 'datetime',
					value: snapshot.linkDraft.lastFiniteExpiresAt.getTime(),
					minDate: nowTime + LINK_EXPIRY_MIN_OFFSET_SECONDS * MILLISECONDS_IN_SECOND,
					maxDate: nowTime + LINK_EXPIRY_MAX_OFFSET_SECONDS * MILLISECONDS_IN_SECOND,
				},
				this.handleExpiryPicked,
			);
		};

		/**
		 * @param {string} eventName
		 * @param {number} [pickedTime] the picked moment, in milliseconds
		 */
		handleExpiryPicked = (eventName, pickedTime) => {
			if (eventName !== DATE_PICKED_EVENT || !Type.isNumber(pickedTime))
			{
				return;
			}

			if (this.machine.setLinkExpiry(new Date(pickedTime)))
			{
				this.syncSnapshot();
			}
		};

		handleBack = () => {
			if (this.isSaving(this.machine.getSnapshot()))
			{
				return;
			}

			this.closeSheet();
		};

		closeSheet()
		{
			this.layoutWidget?.close?.();
		}

		/**
		 * Whether the machine takes an edit of the draft right now.
		 *
		 * @param {ShareSnapshot} snapshot
		 * @return {boolean}
		 */
		isEditable(snapshot)
		{
			return snapshot.status === ShareViewStatus.LinkSettings;
		}

		/**
		 * How far a tap gets to travel. Wider than the edit itself: a confirmation left without an
		 * answer keeps the controls live, and the tap that reaches them ends it - otherwise a question
		 * nobody can answer any more would lock the sheet down to its footer.
		 *
		 * @param {ShareSnapshot} snapshot
		 * @return {boolean}
		 */
		answersTaps(snapshot)
		{
			return LIVE_STATUSES.has(snapshot.status);
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 * @return {boolean}
		 */
		isSaving(snapshot)
		{
			return snapshot.status === ShareViewStatus.SavingLink;
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 * @return {boolean}
		 */
		isLinkUnavailable(snapshot)
		{
			return snapshot.linkState?.availability === LinkAvailability.Unavailable;
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 * @return {boolean}
		 */
		hasStoredLink(snapshot)
		{
			return (snapshot.linkState?.link ?? null) !== null;
		}

		/**
		 * By the time of the device, as in the web: there is no timer of its own, the flag is
		 * recomputed on every render.
		 *
		 * @param {ShareSnapshot} snapshot
		 * @return {boolean}
		 */
		isExpired(snapshot)
		{
			return snapshot.linkDraft?.expiryEnabled === true
				&& snapshot.linkDraft.lastFiniteExpiresAt.getTime() <= this.now().getTime()
			;
		}

		render()
		{
			const { snapshot } = this.state;

			if (snapshot.status === ShareViewStatus.GeneratingDefaultLink)
			{
				return this.renderGeneration();
			}

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
					this.renderDescription(),
					this.renderSettings(snapshot),
					this.renderRevoke(snapshot),
					this.renderUnavailableNotice(snapshot),
					this.renderError(snapshot),
				),
			);
		}

		renderDescription()
		{
			return Text5({
				testId: this.getTestId('description'),
				text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_DESCRIPTION'),
				color: Color.base3,
			});
		}

		/**
		 * The link is being created for an audience that has none yet: no controls until it exists.
		 */
		renderGeneration()
		{
			return Box(
				{
					testId: this.getTestId('generation'),
					safeArea: { bottom: true },
					style: {
						flex: 1,
					},
				},
				Area(
					{
						isFirst: true,
					},
					this.renderDescription(),
					Text5({
						testId: this.getTestId('generation-hint'),
						text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_GENERATING'),
						color: Color.base3,
						style: {
							marginTop: Indent.XL.toNumber(),
						},
					}),
				),
				LoadingScreen({
					testId: this.getTestId('generation-loader'),
					backgroundColor: Color.bgSecondary.toHex(),
				}),
			);
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 */
		renderSettings(snapshot)
		{
			if (snapshot.linkDraft === null || this.isLinkUnavailable(snapshot))
			{
				return null;
			}

			return CardList(
				{
					testId: this.getTestId('settings'),
					withScroll: false,
					style: {
						marginTop: Indent.XL.toNumber(),
					},
				},
				this.renderExpiry(snapshot),
				this.renderRequireAuth(snapshot),
			);
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 */
		renderExpiry(snapshot)
		{
			const { expiryEnabled } = snapshot.linkDraft;

			return Card(
				{
					testId: this.getTestId('expiry-card'),
					border: true,
				},
				SettingSelector({
					testId: this.getTestId('expiry'),
					checked: expiryEnabled,
					// The row declines the touch while the sheet takes no taps at all, so the switcher
					// never flips ahead of the state. Not `locked`: that prop means "not allowed to"
					// and puts a lock icon into the row, which is not what a save in flight is.
					clickable: this.answersTaps(snapshot),
					title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_EXPIRY'),
					switcherSize: SwitcherSize.L,
					additionalContent: expiryEnabled ? this.renderExpiryValue(snapshot) : null,
					onClick: this.handleToggleExpiry,
				}),
			);
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 */
		renderExpiryValue(snapshot)
		{
			const isExpired = this.isExpired(snapshot);

			return Input({
				testId: this.getTestId('expiry-value'),
				readOnly: true,
				dropdown: true,
				design: InputDesign.GREY,
				disabled: !this.answersTaps(snapshot),
				value: formatExpiry(snapshot.linkDraft.lastFiniteExpiresAt),
				error: isExpired,
				errorText: isExpired
					? Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_EXPIRED')
					: null,
				onClick: this.handleOpenExpiryPicker,
				style: {
					marginTop: Indent.L.toNumber(),
				},
			});
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 */
		renderRequireAuth(snapshot)
		{
			return Card(
				{
					testId: this.getTestId('require-auth-card'),
					border: true,
				},
				SettingSelector({
					testId: this.getTestId('require-auth'),
					checked: snapshot.linkDraft.requireB24Auth,
					clickable: this.answersTaps(snapshot),
					title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_REQUIRE_AUTH'),
					switcherSize: SwitcherSize.L,
					onClick: this.handleToggleRequireAuth,
				}),
			);
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 */
		renderRevoke(snapshot)
		{
			if (this.isLinkUnavailable(snapshot) || !this.hasStoredLink(snapshot))
			{
				return null;
			}

			const isLive = this.answersTaps(snapshot);

			return Button({
				testId: this.getTestId('revoke'),
				text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_REVOKE'),
				design: ButtonDesign.PLAIN,
				size: ButtonSize.M,
				// The prop beats the disabled palette, so the alert colour is handed over only while
				// the button is live: a disabled one has to stay grey.
				color: isLive ? Color.accentMainAlert : null,
				disabled: !isLive,
				onClick: this.handleRevoke,
				style: {
					alignSelf: 'flex-start',
					marginTop: Indent.L.toNumber(),
				},
			});
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 */
		renderUnavailableNotice(snapshot)
		{
			if (!this.isLinkUnavailable(snapshot))
			{
				return null;
			}

			return Text5({
				testId: this.getTestId('unavailable'),
				text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_UNAVAILABLE'),
				color: Color.base3,
				style: {
					marginTop: Indent.XL.toNumber(),
				},
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
				text: Loc.getMessage(errorPhrase(snapshot.errorCode)),
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
				this.renderBack(snapshot),
				this.renderCopy(snapshot),
			);
		}

		/**
		 * @param {ShareSnapshot} snapshot
		 */
		renderBack(snapshot)
		{
			return Button({
				testId: this.getTestId('back'),
				text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SHARE_LINK_BACK'),
				design: ButtonDesign.OUTLINE,
				size: ButtonSize.L,
				stretched: true,
				disabled: this.isSaving(snapshot),
				onClick: this.handleBack,
				style: {
					marginBottom: Indent.M.toNumber(),
				},
			});
		}

		/**
		 * A draft that differs from the stored link is saved by the very same button: it changes its
		 * wording and copies the address the server has answered with.
		 *
		 * @param {ShareSnapshot} snapshot
		 */
		renderCopy(snapshot)
		{
			if (this.isLinkUnavailable(snapshot))
			{
				return null;
			}

			const isSaving = this.isSaving(snapshot);

			return Button({
				testId: this.getTestId('copy'),
				text: Loc.getMessage(
					snapshot.isLinkDraftDirty
						? 'MOBILE_VIBECODE_CATALOG_SHARE_LINK_SAVE_AND_COPY'
						: 'MOBILE_VIBECODE_CATALOG_SHARE_LINK_COPY',
				),
				design: ButtonDesign.FILLED,
				size: ButtonSize.L,
				stretched: true,
				loading: isSaving,
				disabled: isSaving || this.isExpired(snapshot),
				onClick: this.handleCopy,
			});
		}
	}

	module.exports = {
		VibeCodeCatalogShareLinkSheet,
	};
});
