/**
 * @module my-company/screen/src/screen
 */
jn.define('my-company/screen/src/screen', (require, exports, module) => {
	const { animate } = require('animation');
	const { PerfPoint } = require('debug/prism');
	const { Color, Component, Indent } = require('tokens');
	const { Feature } = require('feature');
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { LoadingScreen } = require('layout/ui/loading-screen');
	const { storeAppFontScale } = require('more-menu/block/company/app-font-scale');
	const {
		SubscriptionFloatingBanner,
		SubscriptionFloatingBannerReserve,
	} = require('more-menu/block/company/tariff-plate/subscription/floating-banner');
	const { SubscriptionState } = require('more-menu/block/company/tariff-plate/subscription/plate');
	const { getMenuCounters } = require('more-menu/utils');
	const store = require('statemanager/redux/store');
	const { usersUpserted } = require('statemanager/redux/slices/users');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Box } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const {
		resolveAppearanceTextColorMode,
		subscribeToAppearanceTextColorModeChange,
	} = require('user/theme');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { MyCompanyAnalytics, MY_COMPANY_SECTION } = require('my-company/screen/src/analytics');
	const { MyCompanyApi } = require('my-company/screen/src/api');
	const { PortalSection } = require('my-company/screen/src/section/portal');
	const {
		getCardCodes,
		getCardEntry,
		getUnknownCardCodes,
	} = require('my-company/screen/src/card-registry');

	const MY_COMPANY_TEST_ID = 'my-company';
	const PORTAL_SECTION_ID = 'portal';
	const FLOATING_BANNER_TEST_ID = 'floating-promo-subscription';
	const EMPTY_STATE_TEST_ID = 'empty-state';
	const LOADER_TEST_ID = 'loader';
	// the screen of the description of the subscription posts it after the demo of the subscription is
	// activated; the menu listens to the very same event
	const RELOAD_EVENT = 'MoreMenu::Reload';
	// the counters of the app: the first event brings the whole snapshot of them and the second a change
	// of it, and the menu keeps its own badges up to date by the very same pair
	const SET_COUNTERS_EVENT = 'onSetUserCounters';
	const UPDATE_COUNTERS_EVENT = 'onUpdateUserCounters';
	const EMPLOYEES_BLOCK_ID = 'employees';
	const TARIFF_BLOCK_ID = 'tariff';
	// the code of no block of the answer: the screen puts it in the place of the tariff block when the
	// answer says the showcase of the states is on
	const TARIFF_SHOWCASE_BLOCK_ID = 'tariffShowcase';
	const INTEGRATOR_BLOCK_ID = 'integrator';
	const IMPLEMENTATION_SPECIALISTS_BLOCK_ID = 'implementationSpecialists';
	const PERSONAL_ACCOUNT_BLOCK_ID = 'personalAccount';
	// The only pair of the section drawn side by side: the tiles of the integrator and of the
	// implementation specialists share one row - the partners row of the mockup - half of its width
	// each, and the equal height of the slots stretches the shorter card to the taller one. A row left
	// with one tile gives it the whole width, and the locator of the row stays the same whichever of
	// the two blocks the answer brought.
	const SIDE_BY_SIDE_ROW = {
		testId: 'partners',
		codes: [INTEGRATOR_BLOCK_ID, IMPLEMENTATION_SPECIALISTS_BLOCK_ID],
	};
	const SIDE_BY_SIDE_ROW_STYLE = {
		flexDirection: 'row',
		alignItems: 'stretch',
	};
	const SIDE_BY_SIDE_GAP = Indent.M.toNumber();
	const EMPLOYEES_HIGHLIGHT = 'employees';
	// What the section makes of a run of a flow of the personnel data a card reports. A state the
	// section knows nothing of leaves no event behind.
	const FLOW_ANALYTICS = {
		pending: (code, type) => MyCompanyAnalytics.sendFlowStart(code, type),
		success: (code, type) => MyCompanyAnalytics.sendFlowSuccess(code, type),
		failed: (code, type) => MyCompanyAnalytics.sendFlowError(code, type),
	};

	/**
	 * @extends {LayoutComponent<MyCompanyScreenProps, MyCompanyScreenState>}
	 */
	class MyCompanyScreen extends PureComponent
	{
		/**
		 * @param {MyCompanyScreenProps} [props]
		 */
		constructor(props = {})
		{
			super(props);

			// The open of the section as the screen sees it: from the moment its component was built to
			// the composition standing on the screen, whichever answer - saved or fresh - drew it first.
			/** @type {?PerfPoint} */
			this.openPoint = new PerfPoint('My Company Section Open', 'cold open').start();

			this.api = new MyCompanyApi();
			this.isComponentMounted = false;
			this.isEmployeesHighlightPending = props.highlight === EMPLOYEES_HIGHLIGHT;
			this.unsubscribeFromAppearanceTextColorModeChange = null;
			this.cardClickHandlers = new Map();
			// the codes of the composition no card can draw are told of once, see #reportUnknownBlocks
			this.areUnknownBlocksReported = false;

			// kept out of state: the stub follows the floating layer by ref, without re-rendering the section
			this.floatingStubRef = null;
			// the stub takes the other number of the banner once the promo has started to collapse
			this.floatingPromoCollapsed = false;

			this.getTestId = createTestIdGenerator({
				prefix: props.testId ?? MY_COMPANY_TEST_ID,
			});

			this.state = {
				// the whole section as the server sent it: the cards it holds and what every one of them
				// shows. Until the first answer, saved or fresh, lands the screen shows its loader
				section: null,
				// the load brought nothing back while the screen has nothing of its own to keep showing
				loadFailed: false,
				// the gesture of the refresh keeps its own indicator: the content stays on the screen while
				// the answer is on its way
				refreshing: false,
				// the color the texts of the portal are readable in over the wallpaper of the chosen bundle of
				// the appearance; empty until the answer lands, and empty for good while the bundles are off
				appearanceTextColorMode: null,
				// nothing of the drawing reads this number: a bump of it is the whole news that the counters
				// changed and the cards are to be built anew off the storage they are read from
				countersRevision: 0,
			};
		}

		componentDidMount()
		{
			MyCompanyAnalytics.sendSectionOpen();

			// the step of the hint the section was opened by: the card decides whether it really draws
			// the highlight, and the section tells of the step it was asked for
			if (this.isEmployeesHighlightPending)
			{
				MyCompanyAnalytics.sendHintShow(EMPLOYEES_BLOCK_ID);
			}

			this.isComponentMounted = true;

			// The scale of the app font the card of the subscription states its height by is read here as
			// well as in the menu: the section is opened by a link of a chat too, and a scale stored by the
			// menu alone would leave the card of such an open on the scale of the launch before.
			void storeAppFontScale().catch(console.error);

			this.openPoint?.startPoint('Section Data');
			void this.load();

			BX.addCustomEvent(RELOAD_EVENT, this.#reloadSection);
			BX.addCustomEvent(SET_COUNTERS_EVENT, this.#handleCountersUpdate);
			BX.addCustomEvent(UPDATE_COUNTERS_EVENT, this.#handleCountersUpdate);

			this.#loadAppearanceTextColorMode();

			this.unsubscribeFromAppearanceTextColorModeChange = subscribeToAppearanceTextColorModeChange(
				() => this.state.appearanceTextColorMode,
				(appearanceTextColorMode) => this.#applyAppearanceTextColorMode(appearanceTextColorMode),
			);
		}

		componentWillUnmount()
		{
			this.isComponentMounted = false;
			// the instance outlives its unmount, and the promo of the next mount is built expanded anew:
			// the stub goes back with it, or it would hold the collapsed room under an expanded card
			this.floatingPromoCollapsed = false;

			// a section closed before its first answer never draws anything: the measurement of the
			// open has to be closed here, or it stays open in the debug runtime for good
			this.#endOpenPoint();

			BX.removeCustomEvent(RELOAD_EVENT, this.#reloadSection);
			BX.removeCustomEvent(SET_COUNTERS_EVENT, this.#handleCountersUpdate);
			BX.removeCustomEvent(UPDATE_COUNTERS_EVENT, this.#handleCountersUpdate);

			this.unsubscribeFromAppearanceTextColorModeChange?.();
			this.unsubscribeFromAppearanceTextColorModeChange = null;
		}

		/**
		 * The gate of the feature flag and the subscription both live in the wrapper of the theme, so the
		 * screen asks once and is answered with an empty mode wherever the bundles are off.
		 */
		#loadAppearanceTextColorMode()
		{
			void resolveAppearanceTextColorMode().then((appearanceTextColorMode) => {
				this.#applyAppearanceTextColorMode(appearanceTextColorMode);
			});
		}

		#applyAppearanceTextColorMode(appearanceTextColorMode)
		{
			if (this.isComponentMounted)
			{
				this.setState({ appearanceTextColorMode });
			}
		}

		/**
		 * The saved answer is drawn at once and the fresh one replaces it as soon as it lands, so the
		 * section opens on what it showed the last time instead of a loader.
		 *
		 * @param {boolean} [useCache=true] `false` asks the server past the saved answer
		 * @return {Promise}
		 */
		load(useCache = true)
		{
			// the answer of the cache and the one of the server come to the very same handler, and the
			// composition they bring is the same one: the codes it holds are told of for the run, not for
			// every answer of it
			this.areUnknownBlocksReported = false;

			return this.api
				.load({
					useCache,
					onData: this.#applySection,
					onFailedRefresh: this.#keepShownState,
				})
				.catch((error) => {
					console.error(error);
					this.#keepShownState();
				})
			;
		}

		/**
		 * The answer is the whole state of the screen: one of them redraws the section once, cards and
		 * their contents together. The order of the sections is the one the server sent, and the client
		 * never re-sorts it.
		 *
		 * @param {MyCompanySectionData} section
		 */
		#applySection = (section) => {
			// the answer of the server outlives the widget it was asked from: a screen already closed has
			// nothing left to draw the section on
			if (!this.isComponentMounted)
			{
				return;
			}

			this.#reportUnknownBlocks(section?.blocks);
			MyCompanyScreen.#warmUpUserStorage(section);

			this.openPoint?.endPoint('Section Data', {
				blocks: Array.isArray(section?.blocks) ? section.blocks.length : 0,
			});

			this.setState({
				section,
				loadFailed: false,
				refreshing: false,
			}, this.#endOpenPoint);
		};

		/**
		 * The preview of the employees goes into the storage of the users the whole app shares: the
		 * avatars of the app take the name they draw their letters from out of it, and the section runs in
		 * a JS context of its own where nobody else has warmed it up.
		 *
		 * @param {MyCompanySectionData} [section]
		 */
		static #warmUpUserStorage(section)
		{
			const users = section?.blockData?.[EMPLOYEES_BLOCK_ID]?.users;

			if (Array.isArray(users) && users.length > 0)
			{
				store.dispatch(usersUpserted(users));
			}
		}

		#handleEmployeesHighlightComplete = () => {
			// the card reports the end of the step once, and the pair of the events of the hint stays
			// symmetric even if it ever reported it twice
			if (!this.isEmployeesHighlightPending)
			{
				return;
			}

			this.isEmployeesHighlightPending = false;
			MyCompanyAnalytics.sendHintClose(EMPLOYEES_BLOCK_ID);
		};

		/**
		 * A refresh that brought nothing back does not replace what the screen already shows, and it is not
		 * reported either: only the indicator stops. A first load that brought nothing back is another
		 * matter - there is nothing to keep showing, and the empty state says so.
		 */
		#keepShownState = () => {
			if (!this.isComponentMounted)
			{
				return;
			}

			const loadFailed = this.state.section === null;

			this.openPoint?.endPoint('Section Data', { failed: true });

			if (this.state.refreshing || loadFailed !== this.state.loadFailed)
			{
				this.setState({ loadFailed, refreshing: false }, this.#endOpenPoint);
			}
		};

		/**
		 * The open of the section is over: the composition stands on the screen, or the empty state
		 * stands in its place, or the screen was closed before either of them. The measurement is
		 * closed once and never reopened - a later answer belongs to a refresh and not to the open.
		 */
		#endOpenPoint = () => {
			this.openPoint?.endPoint('Section Data');
			this.openPoint?.end();
			this.openPoint = null;
		};

		/**
		 * The gesture is the only way to see a switch of the feature flag on the device, so it goes past the
		 * saved answer. One request brings the cards and their contents back together, so there is nothing
		 * else for the gesture to ask for.
		 */
		#handleRefresh = () => {
			this.setState({ refreshing: true }, () => {
				void this.load(false);
			});
		};

		/**
		 * Something the section shows changed on the server while the screen stayed open: the demo of the
		 * subscription was activated on another screen, an integrator was dropped, a specialist invited.
		 * The section is one answer, so all of it is asked for anew, past the record of the cache; the
		 * indicator of the refresh belongs to the gesture and stays out of it.
		 */
		#reloadSection = () => {
			void this.load(false);
		};

		/**
		 * The counters travel past the answer of the section: the layer that receives them writes the storage
		 * the app shares and announces it. There is nothing to ask the server for - the cards read that
		 * storage while they are built, so a bump of the revision is the whole redraw the news calls for.
		 */
		#handleCountersUpdate = () => {
			this.setState({ countersRevision: this.state.countersRevision + 1 });
		};

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					backgroundColor: this.#getBackgroundColor(),
					style: {
						flex: 1,
					},
				},
				...this.#renderBody(),
			);
		}

		/**
		 * What stands in the root of the screen: the loader while the first answer is still on its way, the
		 * empty state when there is nothing to show, and the content of the section with the promo of the
		 * demo floating above it otherwise.
		 *
		 * @return {Array<?object>}
		 */
		#renderBody()
		{
			if (this.#isSectionAwaited())
			{
				this.#giveFloatingPromoRoomBack();

				return [this.#renderLoader()];
			}

			if (this.#isSectionEmpty())
			{
				this.#giveFloatingPromoRoomBack();

				return [this.#renderEmptyState()];
			}

			const floatingBanner = this.#renderFloatingBanner();

			return [this.#renderContent(Boolean(floatingBanner)), floatingBanner];
		}

		/**
		 * Neither the saved answer nor the one of the server has landed and nothing has failed yet: the
		 * section is on its way, and the loader is all the screen has to show meanwhile.
		 *
		 * @return {boolean}
		 */
		#isSectionAwaited()
		{
			return this.state.section === null && !this.state.loadFailed;
		}

		/**
		 * The section has nothing of its own to show: the load brought nothing back, the section is none of
		 * the user's business, or its composition holds no card the client can draw. The gesture of the
		 * refresh is the way out of all three, and the empty state carries one of its own.
		 *
		 * @return {boolean}
		 */
		#isSectionEmpty()
		{
			const { section } = this.state;

			if (section === null)
			{
				return true;
			}

			return !section.available || this.#getBlockCodes(section.blocks).length === 0;
		}

		/**
		 * The screen is see-through where the widget really draws the portal background, so the loader is
		 * see-through too: the root of the screen is the one that paints the surface under it.
		 *
		 * @return {object}
		 */
		#renderLoader()
		{
			return LoadingScreen({
				testId: this.getTestId(LOADER_TEST_ID),
				backgroundColor: Color.bgContentPrimary.toHex(0),
			});
		}

		/**
		 * @return {object}
		 */
		#renderEmptyState()
		{
			return StatusBlock({
				testId: this.getTestId(EMPTY_STATE_TEST_ID),
				emptyScreen: true,
				title: Loc.getMessage('MY_COMPANY_EMPTY_STATE_TITLE'),
				onRefresh: this.#handleRefresh,
			});
		}

		/**
		 * The view of the refresh is the one that scrolls the section: the gesture has to reach the whole
		 * content, and a scroll of its own inside it would fight with both.
		 *
		 * @param {boolean} withFloatingStub
		 * @return {object}
		 */
		#renderContent(withFloatingStub)
		{
			return RefreshView(
				{
					style: {
						flex: 1,
					},
					refreshing: this.state.refreshing,
					onRefresh: this.#handleRefresh,
				},
				View(
					{
						// the sections of the cards give up their own bottom padding, so the column pays it
						// here once - for the last of them, whichever it turns out to be; under the
						// floating layer it pays nothing: the layer keeps a ring of its own above the reserve
						style: {
							paddingBottom: withFloatingStub ? 0 : Component.areaPaddingB.toNumber(),
						},
					},
					this.#renderSections(),
					withFloatingStub ? this.#renderFloatingStub() : null,
				),
			);
		}

		/**
		 * The floating layer is the last child of the root: the order in the tree already gives the overlap.
		 * The promo of the demo of the subscription is the only banner of the section - the one of the
		 * invitation stays in the menu.
		 *
		 * @return {?object}
		 */
		#renderFloatingBanner()
		{
			const subscription = this.#getDemoSubscription();

			if (!subscription)
			{
				this.#giveFloatingPromoRoomBack();

				return null;
			}

			return SubscriptionFloatingBanner({
				testId: this.getTestId(FLOATING_BANNER_TEST_ID),
				// the widget of the section, as its component handed it over: the parent layout of the flow
				// the banner opens
				layout: this.props.layout,
				onCollapseStarted: this.#handleFloatingBannerCollapseStarted,
				subscription,
			});
		}

		/**
		 * The room the stub holds belongs to the promo that is really on the screen. Whichever way the
		 * banner leaves it - an answer that no longer offers the demo, an empty state, a load that has
		 * not landed yet - the collapsed room goes back with it: the promo built after that is expanded
		 * anew, and the stub would otherwise hold the collapsed room under an expanded card.
		 */
		#giveFloatingPromoRoomBack()
		{
			this.floatingPromoCollapsed = false;
		}

		/**
		 * The subscription the promo of the demo is raised from. The layer is drawn by the screen and not by
		 * the card of the tariff block, so the screen reads the record of that block itself; whether the
		 * demo is offered at all is the state of the subscription and no rule of the screen.
		 *
		 * @return {?object}
		 */
		#getDemoSubscription()
		{
			const subscription = this.#getBlockData(TARIFF_BLOCK_ID)?.subscription;

			if (SubscriptionState.fromCode(subscription?.state) !== SubscriptionState.DEMO_AVAILABLE)
			{
				return null;
			}

			return subscription;
		}

		/**
		 * Keeps the tail of the section clear of the floating layer. The room is the one the banner states
		 * of itself, so the stub holds it from the very frame the banner appears in and never starts at zero.
		 *
		 * @return {object}
		 */
		#renderFloatingStub()
		{
			return View({
				ref: (ref) => {
					this.floatingStubRef = ref;
				},
				style: {
					width: '100%',
					height: this.floatingPromoCollapsed
						? SubscriptionFloatingBannerReserve.collapsed
						: SubscriptionFloatingBannerReserve.expanded,
				},
			});
		}

		/**
		 * The stub goes to the other number of the banner the moment the transition starts, and over the
		 * duration of that very transition: a time of its own would have the stub and the promo move apart.
		 * Which of the two numbers is the taller one is none of the section's business.
		 *
		 * @param {{ duration: number }} params
		 */
		#handleFloatingBannerCollapseStarted = ({ duration }) => {
			this.floatingPromoCollapsed = true;

			void animate(this.floatingStubRef, {
				duration,
				height: SubscriptionFloatingBannerReserve.collapsed,
			});
		};

		/**
		 * The screen is see-through only where the widget really draws the portal background:
		 * without the native capability it keeps its own opaque surface.
		 *
		 * @return {Color|null}
		 */
		#getBackgroundColor()
		{
			return Feature.canUseWidgetBackground() ? null : Color.bgSecondary;
		}

		#renderSections()
		{
			return AreaList(
				{
					testId: this.getTestId('sections'),
					withScroll: false,
				},
				this.#renderPortalSection(),
				...this.#getBlockRows().map((row) => this.#renderBlockSection(row)),
			);
		}

		/**
		 * The blocks the section draws, in the order the server sent them. While the answer says the demo
		 * mode is on, the tariff block is handed over to the showcase of the states: it draws every state
		 * of the plate at once and off mocked data of its own, taking the place of the tariff card and its
		 * locator.
		 *
		 * @param {MyCompanyBlockId[]} [blocks]
		 * @return {MyCompanyCardId[]}
		 */
		#getBlockCodes(blocks)
		{
			const codes = getCardCodes(blocks);

			if (!this.state.section?.tariffShowcase)
			{
				return codes;
			}

			return codes.map((code) => (code === TARIFF_BLOCK_ID ? TARIFF_SHOWCASE_BLOCK_ID : code));
		}

		/**
		 * The composition laid out in rows: a block takes a row of its own, and the two blocks of the
		 * pair share one. The row of the pair stands where the first of its codes came, and the order of
		 * everything else is the one the server sent.
		 *
		 * @return {Array<{testId: string, codes: MyCompanyCardId[], sideBySide: boolean}>}
		 */
		#getBlockRows()
		{
			const rows = [];
			let sideBySideRow = null;

			this.#getBlockCodes(this.state.section.blocks).forEach((code) => {
				if (!SIDE_BY_SIDE_ROW.codes.includes(code))
				{
					rows.push({ testId: getCardEntry(code).testId, codes: [code], sideBySide: false });

					return;
				}

				if (sideBySideRow === null)
				{
					sideBySideRow = { testId: SIDE_BY_SIDE_ROW.testId, codes: [], sideBySide: true };
					rows.push(sideBySideRow);
				}

				sideBySideRow.codes.push(code);
			});

			return rows;
		}

		/**
		 * The portal has no block code of its own: the screen draws it itself and always first.
		 *
		 * @return {?object}
		 */
		#renderPortalSection()
		{
			const { portal } = this.state.section;

			if (!portal)
			{
				return null;
			}

			return Area(
				{
					testId: this.getTestId(`section-${PORTAL_SECTION_ID}`),
					isFirst: true,
					// the section below pays the gap to the portal, the way one section of cards pays the gap
					// to the next: paying it from both sides would part the pair by twice the one of the layout
					excludePaddingSide: {
						bottom: true,
					},
				},
				new PortalSection({
					portal,
					testId: this.getTestId(PORTAL_SECTION_ID),
					appearanceTextColorMode: this.state.appearanceTextColorMode,
				}),
			);
		}

		/**
		 * A section holds the cards of one row and appears together with them, drawn from the answer the
		 * screen already has.
		 * The paddings of two neighbouring areas would stack up into a gap twice the one of the layout, so
		 * a section of a card pays the top one only, and the column below closes the last of them.
		 *
		 * @param {{testId: string, codes: MyCompanyCardId[], sideBySide: boolean}} row
		 * @return {object}
		 */
		#renderBlockSection(row)
		{
			const { testId, codes, sideBySide } = row;

			return Area(
				{
					testId: this.getTestId(`section-${testId}`),
					excludePaddingSide: {
						bottom: true,
					},
					style: sideBySide ? SIDE_BY_SIDE_ROW_STYLE : {},
				},
				...codes.map((code, index) => (sideBySide
					? this.#renderSlot(code, index < codes.length - 1)
					: this.#renderCard(code)
				)),
			);
		}

		/**
		 * A slot is half of the row whatever it measures: the width comes from the slot and not from the
		 * content, and the equal height of the slots is what stretches the shorter card to the taller one.
		 *
		 * @param {MyCompanyCardId} code
		 * @param {boolean} withGap
		 * @return {object}
		 */
		#renderSlot(code, withGap)
		{
			return View(
				{
					testId: this.getTestId(`${getCardEntry(code).testId}-slot`),
					style: {
						flex: 1,
						marginRight: withGap ? SIDE_BY_SIDE_GAP : 0,
					},
				},
				this.#renderCard(code),
			);
		}

		/**
		 * @param {MyCompanyCardId} code
		 * @return {object}
		 */
		#renderCard(code)
		{
			const entry = getCardEntry(code);

			return entry.create(this.#buildCardProps(code, entry));
		}

		/**
		 * What the section tells a card: where it is drawn, what it opens its own flows in, the data of its
		 * block and the callbacks that are the whole per card difference.
		 *
		 * @param {MyCompanyCardId} code
		 * @param {MyCompanyCardEntry} entry
		 * @return {object}
		 */
		#buildCardProps(code, entry)
		{
			const commonProps = {
				testId: this.getTestId(entry.testId),
				// the widget of the section, as its component handed it over: the parent layout of
				// everything the cards open
				layout: this.props.layout,
				// the section is the hub itself: every card of it wears the look of the hub
				hubDesign: true,
				// the tap on a card as an event of the section: the code of the block is bound here, where
				// it is known for certain, and a card holding several rows names the one that was tapped.
				// The very same card drawn by the menu hears nothing of this - it is not the section of the
				// menu that a tap in the hub belongs to.
				onCardClick: this.#getCardClickHandler(code),
				// a card owned by the menu sends events of its own, and they belong to the screen the card
				// was drawn in rather than to the one that owns it
				analyticsSection: MY_COMPANY_SECTION,
				...this.#getCardDataProps(code, entry),
			};

			switch (code)
			{
				case EMPLOYEES_BLOCK_ID:
					return {
						...commonProps,
						// the counters of the card, built the very way the menu builds them: the numbers of the
						// storage the app shares, and above them the hint of the first invitation, which is no
						// number of the storage but a rule over the right to invite. The card of the section
						// and the one of the menu thus never count differently
						counters: getMenuCounters(commonProps.canInvite),
						// the intention of the highlight as it is: whether it has already been played out is
						// the business of the card, and a redraw of the section is none of that business
						highlighted: this.isEmployeesHighlightPending,
						onHighlightComplete: this.#handleEmployeesHighlightComplete,
					};

				case PERSONAL_ACCOUNT_BLOCK_ID:
					return {
						...commonProps,
						// the flows of the personnel data run inside the card, and only their run reaches
						// the section: neither the document, nor the one-time code, nor the employee travels
						// with the report
						onFlowStateChange: this.#handlePersonalAccountFlowStateChange,
					};

				case INTEGRATOR_BLOCK_ID:
					return {
						...commonProps,
						onIntegratorChange: this.#reloadSection,
					};

				case IMPLEMENTATION_SPECIALISTS_BLOCK_ID:
					return {
						...commonProps,
						onRefresh: this.#reloadSection,
					};

				default:
					return commonProps;
			}
		}

		/**
		 * @param {MyCompanyCardId} code
		 * @return {function(?string): void}
		 */
		#getCardClickHandler(code)
		{
			if (!this.cardClickHandlers.has(code))
			{
				this.cardClickHandlers.set(
					code,
					(item) => MyCompanyAnalytics.sendCardClick(code, item),
				);
			}

			return this.cardClickHandlers.get(code);
		}

		#handlePersonalAccountFlowStateChange = (type, state) => {
			FLOW_ANALYTICS[state]?.(PERSONAL_ACCOUNT_BLOCK_ID, type);
		};

		/**
		 * The data of the block turned into the props of its card. A block with no record in the answer
		 * hands nothing over: the card of it either draws a static view or fills itself in.
		 *
		 * @param {MyCompanyCardId} code
		 * @param {MyCompanyCardEntry} entry
		 * @return {object}
		 */
		#getCardDataProps(code, entry)
		{
			const data = this.#getBlockData(code);

			return data && entry.toProps ? entry.toProps(data) : {};
		}

		/**
		 * The record of the answer a card is drawn from, `undefined` for a block that has none.
		 *
		 * @param {MyCompanyCardId} code
		 * @return {?object}
		 */
		#getBlockData(code)
		{
			return this.state.section?.blockData?.[code];
		}

		/**
		 * A code no card of the client draws is a client and a server out of step rather than a failure of
		 * the load - the section skips such a block and keeps going, so the message about it is a warning.
		 * It is printed once for a run of the loads: the answer of the cache and the one of the server reach
		 * the very same handler.
		 *
		 * @param {string[]} [blocks]
		 */
		#reportUnknownBlocks(blocks)
		{
			if (this.areUnknownBlocksReported)
			{
				return;
			}

			const unknownCodes = getUnknownCardCodes(blocks);

			if (unknownCodes.length === 0)
			{
				return;
			}

			this.areUnknownBlocksReported = true;

			console.warn(`MyCompanyScreen: no card for blocks ${unknownCodes.join(', ')}`);
		}
	}

	MyCompanyScreen.propTypes = {
		layout: PropTypes.object.isRequired,
		testId: PropTypes.string,
		highlight: PropTypes.string,
	};

	module.exports = { MyCompanyScreen };
});
