/**
 * @module biconnector/dashboard-list
 */
jn.define('biconnector/dashboard-list', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Component, Corner, Indent } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
	const { StatefulList } = require('layout/ui/stateful-list');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Text2, Text5 } = require('ui-system/typography/text');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { SafeImage } = require('layout/ui/safe-image');
	const { ChipStatus, ChipStatusDesign, ChipStatusMode } = require('ui-system/blocks/chips/chip-status');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons');
	const { BottomSheet } = require('bottom-sheet');
	const { InfoScreen } = require('layout/ui/info-screen');
	const { AnalyticsEvent } = require('analytics');
	const { SpinnerLoader } = require('layout/ui/loaders/spinner');
	const { withCurrentDomain } = require('utils/url');
	const { debounce } = require('utils/function');
	const { makeLibraryImagePath } = require('asset-manager');
	const { isOffline } = require('device/connection');
	const { ComponentHelper } = require('helpers/component');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { PerfPoint } = require('debug/prism');
	const { PopupMenu } = require('ui-system/popups/popup-menu');
	const { Haptics } = require('haptics');
	const { showToast, showErrorToast, showOfflineToast } = require('toast');
	const { ListFilterEntry } = require('layout/ui/field-filter/entry');
	const { getUnifiedFilterConfig } = require('biconnector/dashboard-list/src/unified-filter');
	const { UnifiedFiltersFeature } = require('biconnector/dashboard-list/src/unified-filters-feature');

	const LIST_ACTION = 'biconnectormobile.Dashboard.getList';
	const STATUS_ACTION = 'biconnectormobile.Instance.getStatus';
	const ITEM_TYPE = 'BIC_DASHBOARD';
	const SEARCH_DEBOUNCE_MS = 400;
	const AUTHOR_AVATAR_SIZE = 24;
	const GROUP_ICON_SIZE = 24;
	const GROUP_ICON_BOX_SIZE = 36;
	const LOADING_INDICATOR_SIZE = 64;
	const CONNECTION_STATUS_EVENT = 'connectionStatusChanged';

	const PIN_ACTION = 'biconnectormobile.Dashboard.pin';
	const UNPIN_ACTION = 'biconnectormobile.Dashboard.unpin';
	const SUBSCRIBE_ACTION = 'biconnectormobile.Dashboard.subscribeToUpdates';

	const PULL_MODULE_ID = 'biconnector';
	const PULL_WATCH_TAG = 'superset_dashboard';
	const PULL_LIST_CHANGED_COMMAND = 'onDashboardListChanged';
	const PULL_RELOAD_DEBOUNCE_MS = 300;

	// What the previous entry left applied, kept per user: the cache of the list is drawn long before
	// the filter can say what the server holds, so that answer is the only one available in time.
	const FILTER_MARK_STORAGE = 'biconnector.dashboard.list.filter';
	const FILTER_MARK_KEY = 'applied';

	const PIN_LIMIT_ERROR = 'MOBILE_DASHBOARD_PIN_LIMIT_EXCEEDED';
	const DASHBOARD_ACTION_SIZE = 44;
	const PIN_MARKER_SIZE = 20;

	// Same feature id the web grid passes to BX.UI.InfoHelper for the BI tariff limit.
	const TARIFF_FEATURE_ID = 'limit_crm_BI_constructor';

	// One onboarding hint per user for the whole feature: the journal event carries no zone, so the "BI" section
	// and the tab of any zone share the single show.
	const AHA_TOURIST_EVENT = 'biconnector_mobile_bi_aha';

	// A title longer than a row wraps, but no further than this: past two lines a row stops reading as a row.
	const TITLE_LINES = 2;

	// The rows are drawn right after the load callback, so the ref of the first one appears a moment later.
	const AHA_MOMENT_DELAY_MS = 500;

	// Working art until the final one arrives: the only analytics illustration the mobile library has.
	// The size keeps the 299x237 proportions of the file, otherwise `contain` shrinks the drawing.
	const AHA_MOMENT_IMAGE = {
		filename: 'zefir-empty-analytics.png',
		folder: 'empty-states',
		width: 160,
		height: 127,
	};

	// Measured on a device with the 160x127 image: the content takes 385, the rest is about 7 of air.
	// The measurement was taken on the Russian locale, where the title and the description take two lines
	// each; longer languages wrap wider and are covered by `withScroll` of the content.
	const AHA_MOMENT_SHEET_HEIGHT = 392;

	// The sheet is ours, so the events the aha-moment core used to send are sent by hand.
	const AHA_ANALYTICS_TOOL = 'intranet';
	const AHA_ANALYTICS_CATEGORY = 'aha';
	const AHA_ANALYTICS_EVENT_SHOW = 'show';

	// The first letter of the event name below is a Cyrillic es (U+0441), and it is deliberate: the core sends
	// the name misspelled (ui-system/popups/aha-moment/extension.js:229), and the whole point of sending the
	// events by hand is to stay in the same series - the correct spelling would start a new one and blind the
	// dashboards built on the old value. Do not "fix" this letter.
	const AHA_ANALYTICS_EVENT_CLICK = 'сlick_button';
	const AHA_ANALYTICS_TYPE_GO_TO_FEATURE = 'go_to_feature';
	const AHA_ANALYTICS_TYPE_CLOSE = 'close';

	// The section is ours, p1 tells where the list was met.
	const AHA_ANALYTICS_SECTION = 'bi_constructor';
	const AHA_ANALYTICS_SUB_SECTION = 'dashboard_list';

	// Both the nested-group list and the dashboard detail open as pushed stack screens (native back arrow).
	const LIST_COMPONENT = 'biconnector:biconnector.dashboard.list';
	const DETAIL_COMPONENT = 'biconnector:biconnector.dashboard.detail';

	const EntityType = {
		DASHBOARD: 'dashboard',
		GROUP: 'group',
	};

	// Wire values of SupersetDashboardTable::DASHBOARD_TYPE_*. Dashboards of these types are authored by
	// Bitrix24 or by Marketplace: their avatar is a square web badge, not a user photo.
	const BADGE_AUTHOR_DASHBOARD_TYPES = ['SYSTEM', 'MARKET'];

	// Wire value of SupersetDashboardGroupTable::GROUP_TYPE_SYSTEM: the group type is what the row colour encodes.
	const SYSTEM_GROUP_TYPE = 'SYSTEM';

	const READY_DASHBOARD_STATUS = 'ready';
	const PROHIBITED_DASHBOARD_STATUS = 'prohibited';

	const ScreenState = {
		READY: 'ready',
		LOADING: 'loading',
		LIMIT: 'limit',
		PROXY: 'proxy',
		ERROR: 'error',
		UNAVAILABLE: 'unavailable',
	};

	const StatusTone = {
		SUCCESS: 'success',
		PRIMARY: 'primary',
		WARNING: 'warning',
		DANGER: 'danger',
		MUTED: 'muted',
	};

	const STATUS_CHIP_DESIGN = {
		[StatusTone.SUCCESS]: ChipStatusDesign.SUCCESS,
		[StatusTone.PRIMARY]: ChipStatusDesign.PRIMARY,
		[StatusTone.WARNING]: ChipStatusDesign.WARNING,
		[StatusTone.DANGER]: ChipStatusDesign.ALERT,
		[StatusTone.MUTED]: ChipStatusDesign.NEUTRAL,
	};

	/**
	 * @typedef {object} StateView
	 * @property {string} titleId
	 * @property {string} descId
	 * @property {string} [footnoteId]
	 * @property {{ filename: string, folder: string, size: number }} [image]
	 * @property {boolean} [withIndicator]
	 * @property {string} [action]
	 */

	// Illustrations taken from the mobile asset library: the mockups name their own set
	// (search-analytics / refresh-issue / storage--warning / upgrade-boost / connection-error), which has no
	// counterpart here yet. Every file exists in both themes, the theme variant is picked by the path helper.
	const StateImage = {
		EMPTY: { filename: 'zefir-empty-analytics.png', folder: 'empty-states', size: 120 },
		SEARCH_EMPTY: { filename: 'zefir-empty-search.png', folder: 'empty-states', size: 120 },
		PROBLEM: { filename: 'status-problem.svg', folder: 'graphic', size: 140 },
		TARIFF: { filename: 'tariff1.png', folder: 'volumetric', size: 140 },
		OFFLINE: { filename: 'connection.svg', folder: 'graphic', size: 140 },
	};

	const StateAction = {
		RETRY: 'retry',
		UPGRADE_TARIFF: 'upgradeTariff',
	};

	// Codes come from biconnector BIConstructorAccess, plus our own FEATURE_DISABLED (MobileBIFeatureAccess
	// prefilter) - a zone tab left in the client cache still reaches the list after the flag goes off. Of the
	// biconnector codes only TARIFF is reachable in the normal flow (the menu item is hidden on missing rights /
	// disabled tool); the rest are a defensive fallback for deeplinks / state races.
	const NoAccessCode = {
		FEATURE_DISABLED: 'FEATURE_DISABLED',
		TARIFF: 'INSUFFICIENT_TARIFF',
		TOOL_DISABLED: 'TOOL_DISABLED',
		ACCESS_DENIED: 'ACCESS_DENIED',
	};

	// A known code without an entry here falls back to DEFAULT_NO_ACCESS_VIEW: FEATURE_DISABLED deliberately has
	// none, because a switched-off feature is nothing the user can be told to act on.
	const NO_ACCESS_VIEW = {
		[NoAccessCode.TARIFF]: {
			titleId: 'M_BIC_DASHBOARD_LIST_NO_ACCESS_TARIFF_TITLE',
			descId: 'M_BIC_DASHBOARD_LIST_NO_ACCESS_TARIFF_DESC',
			image: StateImage.TARIFF,
			action: StateAction.UPGRADE_TARIFF,
		},
		[NoAccessCode.TOOL_DISABLED]: {
			titleId: 'M_BIC_DASHBOARD_LIST_NO_ACCESS_TOOL_TITLE',
			descId: 'M_BIC_DASHBOARD_LIST_NO_ACCESS_TOOL_DESC',
		},
		[NoAccessCode.ACCESS_DENIED]: {
			titleId: 'M_BIC_DASHBOARD_LIST_NO_ACCESS_RIGHTS_TITLE',
			descId: 'M_BIC_DASHBOARD_LIST_NO_ACCESS_RIGHTS_DESC',
		},
	};

	const DEFAULT_NO_ACCESS_VIEW = {
		titleId: 'M_BIC_DASHBOARD_LIST_NO_ACCESS_TITLE',
		descId: 'M_BIC_DASHBOARD_LIST_NO_ACCESS_DESC',
	};

	const DASHBOARD_STATUS_VIEW = {
		[READY_DASHBOARD_STATUS]: { phraseId: 'M_BIC_DASHBOARD_STATUS_READY', tone: StatusTone.SUCCESS },
		load: { phraseId: 'M_BIC_DASHBOARD_STATUS_LOAD', tone: StatusTone.PRIMARY },
		draft: { phraseId: 'M_BIC_DASHBOARD_STATUS_DRAFT', tone: StatusTone.MUTED },
		failed: { phraseId: 'M_BIC_DASHBOARD_STATUS_FAILED', tone: StatusTone.DANGER },
		not_available: { phraseId: 'M_BIC_DASHBOARD_STATUS_NOT_AVAILABLE', tone: StatusTone.DANGER },
		limit_exceeded: { phraseId: 'M_BIC_DASHBOARD_STATUS_LIMIT_EXCEEDED', tone: StatusTone.DANGER },
		not_found: { phraseId: 'M_BIC_DASHBOARD_STATUS_NOT_FOUND', tone: StatusTone.DANGER },
		[PROHIBITED_DASHBOARD_STATUS]: { phraseId: 'M_BIC_DASHBOARD_STATUS_PROHIBITED', tone: StatusTone.MUTED },
	};

	/**
	 * Maps a server-computed displayStatus to a phrase id and a semantic tone.
	 * Pure: the client only displays, it never computes the status itself.
	 *
	 * @param {string} displayStatus
	 * @returns {{ phraseId: string, tone: string }}
	 */
	const getDashboardStatusView = (displayStatus) => {
		return DASHBOARD_STATUS_VIEW[displayStatus]
			|| { phraseId: 'M_BIC_DASHBOARD_STATUS_NOT_AVAILABLE', tone: StatusTone.MUTED };
	};

	const INSTANCE_STATE_VIEW = {
		[ScreenState.LOADING]: {
			titleId: 'M_BIC_DASHBOARD_LIST_INSTANCE_LOADING_TITLE',
			descId: 'M_BIC_DASHBOARD_LIST_INSTANCE_LOADING_DESC',
			// The mockup shows a pulse animation instead of an illustration, so the screen carries a spinner.
			withIndicator: true,
		},
		[ScreenState.LIMIT]: {
			titleId: 'M_BIC_DASHBOARD_LIST_INSTANCE_LIMIT_TITLE',
			descId: 'M_BIC_DASHBOARD_LIST_INSTANCE_LIMIT_DESC',
			// Raising the limit is an administrator's job: that is a note here, not a button of its own.
			footnoteId: 'M_BIC_DASHBOARD_LIST_INSTANCE_LIMIT_FOOTNOTE',
			image: StateImage.PROBLEM,
			action: StateAction.UPGRADE_TARIFF,
		},
		[ScreenState.PROXY]: {
			titleId: 'M_BIC_DASHBOARD_LIST_INSTANCE_PROXY_TITLE',
			descId: 'M_BIC_DASHBOARD_LIST_INSTANCE_PROXY_DESC',
			image: StateImage.PROBLEM,
			action: StateAction.RETRY,
		},
		[ScreenState.ERROR]: {
			titleId: 'M_BIC_DASHBOARD_LIST_INSTANCE_ERROR_TITLE',
			descId: 'M_BIC_DASHBOARD_LIST_INSTANCE_ERROR_DESC',
			image: StateImage.PROBLEM,
			action: StateAction.RETRY,
		},
		[ScreenState.UNAVAILABLE]: {
			titleId: 'M_BIC_DASHBOARD_LIST_INSTANCE_UNAVAILABLE_TITLE',
			descId: 'M_BIC_DASHBOARD_LIST_INSTANCE_UNAVAILABLE_DESC',
		},
	};

	const OFFLINE_VIEW = {
		titleId: 'M_BIC_DASHBOARD_LIST_OFFLINE_TITLE',
		descId: 'M_BIC_DASHBOARD_LIST_OFFLINE_DESC',
		image: StateImage.OFFLINE,
		action: StateAction.RETRY,
	};

	const SEARCH_EMPTY_VIEW = {
		titleId: 'M_BIC_DASHBOARD_LIST_SEARCH_EMPTY_TITLE',
		descId: 'M_BIC_DASHBOARD_LIST_SEARCH_EMPTY_DESC',
		image: StateImage.SEARCH_EMPTY,
	};

	const EMPTY_VIEW = {
		titleId: 'M_BIC_DASHBOARD_LIST_EMPTY_TITLE',
		descId: 'M_BIC_DASHBOARD_LIST_EMPTY_DESC',
		image: StateImage.EMPTY,
	};

	/**
	 * Resolves the empty-list placeholder for a screenState from the server response.
	 * Pure: returns the state view or null when the instance is ready/unknown.
	 *
	 * @param {?string} screenState
	 * @returns {?StateView}
	 */
	const resolveInstanceEmptyState = (screenState) => {
		if (!screenState || screenState === ScreenState.READY)
		{
			return null;
		}

		return INSTANCE_STATE_VIEW[screenState] || INSTANCE_STATE_VIEW[ScreenState.UNAVAILABLE];
	};

	/**
	 * A failed action answers the same way a successful one does - the executor hands the answer to the
	 * handler either way - so success is told from failure by the answer itself.
	 * Pure.
	 *
	 * @param {?object} response
	 * @returns {boolean}
	 */
	const isFailedResponse = (response) => (
		response?.status === 'error'
		|| (Array.isArray(response?.errors) && response.errors.length > 0)
	);

	// Every refusal to show the onboarding names itself: a silent exit leaves no trace of why
	// the hint did not appear.
	const logAhaSkipped = (reason) => {
		console.info(`aha: skipped, ${reason}`);
	};

	// Required on the spot and not at the top of the module: the extension builds its singleton
	// (`new Tourist(env.userId)`) as it is required, and that is pointless for everyone who opens an empty
	// list or a refusal, and for everyone who has long seen the hint. The whole journal path runs behind
	// scheduleAhaMoment. The entry in deps.php stays: without it the extension is out of the bundle.
	const getTourist = () => require('tourist').Tourist;

	/**
	 * Resolves the badge image of an author that is not a user. The server answers the raw path of the
	 * asset on the portal, so the domain the application is connected to is added here - it is known on
	 * the client only - and the path is percent-encoded on the way, exactly as Avatar does it with a user
	 * photo (ui-system/blocks/avatar/src/elements/avatar-view.js). An absolute url is left as it is.
	 * Pure.
	 *
	 * @param {?string} path
	 * @returns {?string}
	 */
	const resolveAuthorBadgeUri = (path) => {
		if (typeof path !== 'string' || path === '')
		{
			return null;
		}

		return encodeURI(withCurrentDomain(path));
	};

	const rowStyles = {
		screen: {
			flex: 1,
			backgroundColor: Color.bgPrimary.toHex(),
		},
		groupRow: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: Indent.XL.toNumber(),
		},
		groupIconBox: {
			width: GROUP_ICON_BOX_SIZE,
			height: GROUP_ICON_BOX_SIZE,
			borderRadius: Corner.M.toNumber(),
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: Indent.XL.toNumber(),
		},
		groupContent: {
			flexGrow: 1,
			flexShrink: 2,
			paddingVertical: Indent.XL2.toNumber(),
		},
		groupTitle: {
			flexShrink: 2,
		},
		groupCount: {
			marginTop: Indent.XS2.toNumber(),
		},
		metaRow: {
			flexDirection: 'row',
			alignItems: 'center',
			marginTop: Indent.XS.toNumber(),
		},
		// Rendered even when empty: it holds the right pole, so a report without an author still keeps
		// its chip at the right edge.
		metaAuthorBox: {
			flexDirection: 'row',
			alignItems: 'center',
			flexGrow: 1,
			flexShrink: 2,
		},
		// ElementStyle has no gap, so the spacing between meta parts lives on the preceding element:
		// a row without an author must not start with an empty indent. An avatar keeps its width when
		// the row gets tight: elements here shrink by default, and a shrinking avatar squeezes its image.
		metaAvatar: {
			marginRight: Indent.M.toNumber(),
			flexShrink: 0,
		},
		// The badge image carries its own size: unlike Avatar it takes no size prop. SafeImage draws the
		// image inside a wrapper View, so the place in the row belongs to the wrapper and the size has to
		// be repeated on the image itself - the placeholder of a missing badge is sized by the same style.
		metaBadgeBox: {
			width: AUTHOR_AVATAR_SIZE,
			height: AUTHOR_AVATAR_SIZE,
			marginRight: Indent.M.toNumber(),
			flexShrink: 0,
		},
		metaBadge: {
			width: AUTHOR_AVATAR_SIZE,
			height: AUTHOR_AVATAR_SIZE,
		},
		metaText: {
			flexShrink: 2,
			marginRight: Indent.M.toNumber(),
		},
		// ChipStatus is shrinkable by default, and a shrinking chip would clip its own text.
		statusChip: {
			flexShrink: 0,
		},
		dashboardRow: {
			flexDirection: 'row',
			alignItems: 'stretch',
			paddingLeft: Indent.XL.toNumber(),
		},
		dashboardContent: {
			flexGrow: 1,
			flexShrink: 1,
			paddingVertical: Indent.XL2.toNumber(),
		},
		// Not a border: a report row with pinning has no right padding, and the inset would differ.
		rowDivider: {
			position: 'absolute',
			left: Indent.XL.toNumber(),
			right: Indent.XL.toNumber(),
			bottom: 0,
			height: Component.separatorStroke.toNumber(),
			backgroundColor: Color.bgSeparatorSecondary.toHex(),
		},
		dashboardTitleRow: {
			flexDirection: 'row',
			alignItems: 'center',
		},
		dashboardTitle: {
			flexGrow: 1,
			flexShrink: 1,
		},
		pinMarker: {
			flexShrink: 0,
			marginLeft: Indent.S.toNumber(),
		},
		dashboardAction: {
			width: DASHBOARD_ACTION_SIZE,
			height: DASHBOARD_ACTION_SIZE,
			alignSelf: 'center',
			marginHorizontal: Indent.S.toNumber(),
			alignItems: 'center',
			justifyContent: 'center',
		},
	};

	/**
	 * @class GroupRow
	 */
	class GroupRow extends LayoutComponent
	{
		render()
		{
			const { item } = this.props;
			const count = item.countDashboards ?? 0;
			const isSystem = item.groupType === SYSTEM_GROUP_TYPE;

			// Own layout instead of EntityCell: the cell hardcodes the icon colour and size and always keeps
			// room for the group chevron, so neither the colour backing nor its absence is expressible there.
			return View(
				{
					testId: `${this.props.testId}-group-${item.id}`,
					ref: this.props.forwardRef,
					style: rowStyles.groupRow,
					onClick: () => this.handleClick(),
				},
				View(
					{
						style: {
							...rowStyles.groupIconBox,
							backgroundColor: (isSystem ? Color.accentSoftBlue2 : Color.accentSoftGreen2).toHex(),
						},
					},
					IconView({
						testId: `${this.props.testId}-group-icon-${item.id}`,
						icon: isSystem ? Icon.FOLDER_24 : Icon.FOLDER,
						color: isSystem ? Color.accentMainPrimary : Color.accentExtraGrass,
						size: GROUP_ICON_SIZE,
					}),
				),
				View(
					{ style: rowStyles.groupContent },
					Text2({
						testId: `${this.props.testId}-group-title-${item.id}`,
						text: item.title,
						color: Color.base1,
						numberOfLines: 1,
						ellipsize: 'end',
						style: rowStyles.groupTitle,
					}),
					Text5({
						testId: `${this.props.testId}-group-count-${item.id}`,
						text: Loc.getMessagePlural('M_BIC_DASHBOARD_GROUP_COUNT', count, {
							'#COUNT#': String(count),
						}),
						color: Color.base4,
						style: rowStyles.groupCount,
					}),
				),
				item.showBorder === true && View({ style: rowStyles.rowDivider }),
			);
		}

		handleClick()
		{
			if (typeof this.props.itemDetailOpenHandler === 'function')
			{
				this.props.itemDetailOpenHandler(this.props.item.id, this.props.item, this.props.params);
			}
		}
	}

	/**
	 * @class DashboardRow
	 */
	class DashboardRow extends LayoutComponent
	{
		render()
		{
			const { item } = this.props;

			return View(
				{
					testId: `${this.props.testId}-dashboard-${item.id}`,
					ref: this.props.forwardRef,
					style: {
						...rowStyles.dashboardRow,
						paddingRight: item.isPinningEnabled === true
							? 0
							: Indent.XL.toNumber(),
					},
				},
				View(
					{
						style: rowStyles.dashboardContent,
						onClick: () => this.handleClick(),
						onLongClick: item.isPinningEnabled === true
							? () => this.handleLongClick()
							: undefined,
					},
					View(
						{ style: rowStyles.dashboardTitleRow },
						Text2({
							testId: `${this.props.testId}-dashboard-title-${item.id}`,
							text: item.title,
							color: Color.base1,
							numberOfLines: TITLE_LINES,
							ellipsize: 'end',
							style: rowStyles.dashboardTitle,
						}),
						item.isPinned === true && IconView({
							testId: `${this.props.testId}-dashboard-pin-marker-${item.id}`,
							icon: Icon.SOLID_PIN,
							color: Color.accentMainPrimary,
							size: PIN_MARKER_SIZE,
							style: rowStyles.pinMarker,
						}),
					),
					this.renderMetaRow(),
				),
				item.isPinningEnabled === true && View(
					{
						testId: `${this.props.testId}-dashboard-more-${item.id}`,
						style: rowStyles.dashboardAction,
						ref: (ref) => {
							this.dashboardActionRef = ref;
						},
						onClick: () => this.handleActionClick(),
					},
					IconView({
						testId: `${this.props.testId}-dashboard-more-icon-${item.id}`,
						icon: Icon.MORE,
						color: Color.base4,
						size: 24,
					}),
				),
				item.showBorder === true && View({ style: rowStyles.rowDivider }),
			);
		}

		handleActionClick()
		{
			this.props.params?.dashboardActionHandler?.(
				this.props.item.id,
				this.props.item,
				this.dashboardActionRef,
			);
		}

		handleLongClick()
		{
			Haptics.impactLight();
			this.handleActionClick();
		}

		renderMetaRow()
		{
			const avatar = this.renderAuthorAvatar();
			const meta = this.renderMeta();
			const statusChip = this.renderStatusChip();

			// Neither an author nor a chip means no second line at all: an empty one would only add a stripe.
			if (!avatar && !meta && !statusChip)
			{
				return null;
			}

			return View(
				{ style: rowStyles.metaRow },
				View(
					{ style: rowStyles.metaAuthorBox },
					avatar,
					meta,
				),
				statusChip,
			);
		}

		renderAuthorAvatar()
		{
			const { item } = this.props;

			// dashboardType, not type: the list overwrites type with its own row type (see keepDashboardTypes).
			if (BADGE_AUTHOR_DASHBOARD_TYPES.includes(item.dashboardType))
			{
				// The badge is ready square artwork of the web set, drawn as an image rather than through
				// Avatar: the avatar is built for user photos - it masks with a circle unless told
				// otherwise, and its letter placeholder and Redux lookup are meaningless for an author that
				// is not a user. A missing badge therefore leaves the row without one.
				const uri = resolveAuthorBadgeUri(item.authorAvatar);
				if (!uri)
				{
					return null;
				}

				return SafeImage({
					testId: `${this.props.testId}-avatar-${item.id}`,
					uri,
					resizeMode: 'contain',
					style: rowStyles.metaBadge,
					wrapperStyle: rowStyles.metaBadgeBox,
					clickable: false,
					onFailure: () => console.error(`bic: the author badge did not load, ${uri}`),
				});
			}

			if (!item.author)
			{
				return null;
			}

			const avatarProps = {
				testId: `${this.props.testId}-avatar-${item.id}`,
				id: item.authorId ?? item.id,
				name: item.author,
				size: AUTHOR_AVATAR_SIZE,
				withRedux: false,
				style: rowStyles.metaAvatar,
			};

			if (item.authorAvatar)
			{
				avatarProps.uri = item.authorAvatar;
			}

			return Avatar(avatarProps);
		}

		renderMeta()
		{
			const { item } = this.props;
			const meta = this.buildMeta(item);

			if (!meta)
			{
				return null;
			}

			return Text5({
				testId: `${this.props.testId}-meta-${item.id}`,
				text: meta,
				color: Color.base4,
				numberOfLines: 1,
				ellipsize: 'end',
				style: rowStyles.metaText,
			});
		}

		renderStatusChip()
		{
			const { item } = this.props;

			if (
				item.isPinned === true
				&& ['prohibited', 'not_found', 'not_available', 'limit_exceeded', 'failed'].includes(item.displayStatus)
			)
			{
				return null;
			}

			// A ready dashboard carries no chip: the row shows a status only when something is wrong with it.
			if (!item.displayStatus || item.displayStatus === READY_DASHBOARD_STATUS)
			{
				return null;
			}

			const statusView = getDashboardStatusView(item.displayStatus);

			return ChipStatus({
				testId: `${this.props.testId}-status-${item.id}`,
				text: Loc.getMessage(statusView.phraseId),
				design: STATUS_CHIP_DESIGN[statusView.tone] || ChipStatusDesign.NEUTRAL,
				mode: ChipStatusMode.TINTED,
				compact: true,
				style: rowStyles.statusChip,
			});
		}

		buildMeta(item)
		{
			// The author alone: the date of the last change told the user nothing here, and the report shows
			// it inside itself anyway.
			return item.author;
		}

		handleClick()
		{
			if (typeof this.props.itemDetailOpenHandler === 'function')
			{
				this.props.itemDetailOpenHandler(this.props.item.id, this.props.item, this.props.params);
			}
		}
	}

	/**
	 * Builds a row by the entityType of the item off the wire; StatefulList itemType is not used here.
	 *
	 * @class DashboardItemsFactory
	 */
	class DashboardItemsFactory
	{
		static create(type, props)
		{
			if (props?.item?.entityType === EntityType.GROUP)
			{
				return new GroupRow(props);
			}

			return new DashboardRow(props);
		}
	}

	/**
	 * @class DashboardList
	 */
	class DashboardList extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.layout = props.layout;
			this.statefulList = null;
			this.isUnmounted = false;
			this.initializationPerfPoint = null;
			this.initializationPendingParts = new Set();
			this.activePerfPointKeys = new Set();
			this.activeListResponsePerfPointKey = null;
			this.isListInitializationFinished = false;
			this.isAhaMomentShown = false;
			this.isAhaMomentRequested = false;
			this.ahaMomentTimeoutId = null;
			this.lastItemsCount = 0;
			this.isPinningEnabled = false;
			this.shownStaleSignature = '';
			this.isFilterStateRequested = false;

			this.state = {
				groupId: props.groupId || null,
				scopeCode: props.scopeCode || null,
				searchText: '',
				instanceScreenState: null,
				instanceChecked: false,
				listLoaded: false,
				noAccessCode: null,
				isFilterPresetsEnabled: false,
				isOffline: isOffline(),
			};

			this.filter = this.createFilter();
			// Decided once for the whole life of the screen: the name of the cache travels with the
			// first request, and a list already drawn out of it cannot be undrawn.
			this.isListCacheUsable = this.resolveListCacheUsability();

			this.renderEmptyState = this.renderEmptyState.bind(this);
			this.onListResponse = this.onListResponse.bind(this);
			this.onListItemsLoaded = this.onListItemsLoaded.bind(this);
			this.onBeforeItemsRender = this.onBeforeItemsRender.bind(this);
			this.onItemClick = this.onItemClick.bind(this);
			this.onSearchCancel = this.onSearchCancel.bind(this);
			this.onConnectionStatusChanged = this.onConnectionStatusChanged.bind(this);
			this.onRetry = this.onRetry.bind(this);
			this.onUpgradeTariff = this.onUpgradeTariff.bind(this);
			this.onSearchTextChanged = debounce((params) => this.handleSearchText(params), SEARCH_DEBOUNCE_MS, this);

			this.dashboardContextMenu = null;
			this.busyDashboardIds = new Set();
			this.pinnedDashboardIds = new Set();
			this.unsubscribePull = null;

			this.onDashboardAction = this.onDashboardAction.bind(this);
			this.onPullEvent = this.onPullEvent.bind(this);

			this.reloadAfterDashboardChange = debounce(
				() => this.reloadQuietly(),
				PULL_RELOAD_DEBOUNCE_MS,
				this,
			);
		}

		onDashboardAction(dashboardId, item, target)
		{
			if (!this.isPinningEnabled)
			{
				return;
			}

			if (!item || !target || this.busyDashboardIds.has(Number(dashboardId)))
			{
				return;
			}

			const shouldPin = item.isPinned !== true;
			const actionCode = shouldPin ? 'pin' : 'unpin';

			this.dashboardContextMenu?.hide();
			this.dashboardContextMenu = new PopupMenu([
				{
					id: `dashboard-${actionCode}`,
					testId: `bic-dashboard-${actionCode}-action-${dashboardId}`,
					title: Loc.getMessage(
						shouldPin
							? 'M_BIC_DASHBOARD_LIST_ACTION_PIN'
							: 'M_BIC_DASHBOARD_LIST_ACTION_UNPIN',
					),
					icon: shouldPin ? Icon.PIN : Icon.UNPIN,
					onItemSelected: () => {
						void this.changePinState(item, shouldPin);
					},
				},
			]);

			this.dashboardContextMenu.show({ target });
		}

		async changePinState(item, shouldPin)
		{
			if (!this.isPinningEnabled)
			{
				return;
			}

			const dashboardId = Number(item.id);

			if (this.busyDashboardIds.has(dashboardId))
			{
				return;
			}

			if (isOffline())
			{
				showOfflineToast({}, this.layout);

				return;
			}

			this.busyDashboardIds.add(dashboardId);
			this.statefulList?.setLoadingOfItem(dashboardId);

			try
			{
				const response = await new RunActionExecutor(
					shouldPin ? PIN_ACTION : UNPIN_ACTION,
					{
						dashboardId,
						filter: this.buildActionParams().loadItems.filter,
					},
				).call(false);

				if (isFailedResponse(response))
				{
					this.showPinError(response);

					return;
				}

				this.applyPinnedDashboardIds(response?.data?.pinnedDashboardIds);

				this.statefulList?.unsetLoadingOfItem(dashboardId, false);

				await this.applyCanonicalDashboardItem(
					dashboardId,
					response?.data?.item ?? null,
				);

				this.reloadAfterDashboardChange();
			}
			catch (error)
			{
				if (isOffline())
				{
					showOfflineToast({}, this.layout);
				}
				else
				{
					showErrorToast({}, this.layout);
				}
			}
			finally
			{
				this.busyDashboardIds.delete(dashboardId);

				this.statefulList?.unsetLoadingOfItem(dashboardId, false);
			}
		}

		applyPinnedDashboardIds(ids)
		{
			this.pinnedDashboardIds = new Set(
				(Array.isArray(ids) ? ids : []).map(Number).filter((id) => id > 0),
			);
		}

		async applyCanonicalDashboardItem(dashboardId, item)
		{
			if (!item)
			{
				await this.statefulList?.deleteItem(dashboardId);

				return;
			}

			item.dashboardType = item.type;
			item.isPinningEnabled = this.isPinningEnabled;
			item.isPinned = this.isPinningEnabled && this.pinnedDashboardIds.has(Number(item.id));

			await this.statefulList?.updateItemsData([item]);
		}

		showPinError(response)
		{
			const error = Array.isArray(response?.errors)
				? response.errors[0]
				: null;

			const message = error?.code === PIN_LIMIT_ERROR
				? Loc.getMessage('M_BIC_DASHBOARD_LIST_PIN_LIMIT_ERROR')
				: (error?.message || Loc.getMessage('M_BIC_DASHBOARD_LIST_PIN_COMMON_ERROR'));

			showErrorToast({ message }, this.layout);
		}

		reloadQuietly()
		{
			if (this.isUnmounted || this.state.isOffline || !this.statefulList)
			{
				return;
			}

			this.statefulList.reload(
				{
					skipItems: true,
					forcedShowSkeleton: false,
					actionParams: this.buildActionParams(),
				},
				{ useCache: false },
			);
		}

		subscribeToDashboardListChanges()
		{
			new RunActionExecutor(SUBSCRIBE_ACTION, {}).call(false).catch(() => {});

			if (!BX.PULL)
			{
				return;
			}

			BX.PULL.extendWatch(PULL_WATCH_TAG, true);
			this.unsubscribePull = BX.PULL.subscribe({
				moduleId: PULL_MODULE_ID,
				callback: this.onPullEvent,
			});
		}

		unsubscribeFromDashboardListChanges()
		{
			this.unsubscribePull?.();
			this.unsubscribePull = null;
		}

		onPullEvent(event)
		{
			if (event?.command === PULL_LIST_CHANGED_COMMAND)
			{
				this.reloadAfterDashboardChange();
			}
		}

		componentDidMount()
		{
			// A host tab panel (store documents, CRM entities) keeps its create button on the shared widget
			// and takes it off nowhere when its body is swapped out: a guest tab body clears what its host
			// left behind. A no-op on our own screens, which never put a button there (isShowFloatingButton
			// below is false).
			this.layout?.setFloatingButton?.({});

			this.startInitializationPerfPoint();
			this.loadInstanceStatus();

			// device/connection exposes the status only, so the change event is taken from the native object,
			// the same way the core list does it.
			device?.on?.(CONNECTION_STATUS_EVENT, this.onConnectionStatusChanged);

			this.subscribeToDashboardListChanges();
			this.syncFilterMode();

			// Scope mode has no search: the short zone list needs none, and the grid's search chrome
			// (indicator / clear / reset) is not wired here, so a search entry point would half-render.
			if (this.state.scopeCode)
			{
				return;
			}

			const search = this.getNativeSearch();
			if (search)
			{
				search.on('textChanged', this.onSearchTextChanged);
				search.on('cancel', this.onSearchCancel);
			}
		}

		componentWillUnmount()
		{
			// utils/function::debounce has no cancel, so a pending textChanged callback can still fire
			// after unmount; the flag makes handleSearchText / reloadWithFilter bail out early.
			this.isUnmounted = true;
			this.finishInitializationPerfPoint({ source: 'unmount' });

			this.dropAhaMomentTimeout();

			device?.off?.(CONNECTION_STATUS_EVENT, this.onConnectionStatusChanged);

			const search = this.getNativeSearch();
			if (search)
			{
				search.off('textChanged', this.onSearchTextChanged);
				search.off('cancel', this.onSearchCancel);
			}

			this.dashboardContextMenu?.hide();
			this.dashboardContextMenu = null;
			this.unsubscribeFromDashboardListChanges();
		}

		getNativeSearch()
		{
			return this.layout && this.layout.search ? this.layout.search : null;
		}

		render()
		{
			return View(
				{
					resizableByKeyboard: true,
					style: rowStyles.screen,
				},
				// Without a connection the list has nothing to show and its own request ends in a skeleton,
				// so the offline state replaces it instead of waiting inside it.
				this.state.isOffline
					? this.renderStateBlock(this.getEmptyStateConfig(false), 'bic-dashboard-list-offline')
					: this.renderStatefulList(),
			);
		}

		renderStatefulList()
		{
			return new StatefulList({
				testId: 'bic-dashboard-list',
				layout: this.layout,
				// Without it the list falls back to the legacy palette, where bgPrimary is the grey page
				// background instead of the content surface the flat rows are drawn on.
				showAirStyle: true,
				actions: {
					loadItems: LIST_ACTION,
				},
				actionParams: this.buildActionParams(),
				actionResponseAdapter: this.onListResponse,
				actionCallbacks: {
					loadItems: this.onListItemsLoaded,
				},
				itemType: ITEM_TYPE,
				itemFactory: DashboardItemsFactory,
				itemDetailOpenHandler: this.onItemClick,
				onBeforeItemsRender: this.onBeforeItemsRender,
				getEmptyListComponent: this.renderEmptyState,
				// getEmptyListComponent is a stable reference and its own props otherwise stay deep-equal, so
				// SimpleList (a PureComponent) would never repaint the slot on a later answer. This value is the
				// only thing that has to change for that: StatefulList spreads its props onto SimpleList as-is.
				emptyStateSignature: this.buildEmptyStateSignature(),
				isShowFloatingButton: false,
				cacheName: this.isListCacheUsable
					? `biconnector.dashboard.list.${env.userId}.${this.getCacheScope()}`
					: null,
				// StatefulList draws the cache wherever it has a name for it, so the name is taken away
				// and the flag with it (`Boolean(cacheId) || isCacheEnabled` of loadItems)
				useCache: this.isListCacheUsable,
				menuButtons: this.getMenuButtons(),
				layoutOptions: {
					useSearch: false,
					useOnViewLoaded: true,
				},
				itemParams: {
					dashboardActionHandler: this.onDashboardAction,
				},
				ref: (ref) => {
					if (ref)
					{
						this.statefulList = ref;
					}
				},
			});
		}

		// The last row keeps its divider while the list still pages: the next page goes on right under it.
		onBeforeItemsRender(items, { allItemsLoaded })
		{
			const lastIndex = items.length - 1;

			return items.map((item, index) => ({
				...item,
				showBorder: !allItemsLoaded || index !== lastIndex,
			}));
		}

		buildActionParams()
		{
			const filter = {};

			// Scope and group modes are mutually exclusive: a scopeCode host passes no groupId.
			if (this.state.scopeCode)
			{
				filter.scopeCode = this.state.scopeCode;
			}
			else if (this.state.groupId !== null)
			{
				filter.groupId = this.state.groupId;
			}

			if (this.state.searchText)
			{
				filter.searchString = this.state.searchText;
			}

			// Preset keys are added only when there is something to send: the zone, group and
			// root modes keep the exact request shape they had before the unified filter.
			const requestFields = this.filter ? this.filter.getRequestFields() : {};

			if (requestFields.presetId)
			{
				filter.presetId = requestFields.presetId;
			}

			if (requestFields.tmpFields && Object.keys(requestFields.tmpFields).length > 0)
			{
				filter.tmpFields = requestFields.tmpFields;
			}

			return {
				loadItems: { filter },
			};
		}

		getCacheScope()
		{
			if (this.state.scopeCode)
			{
				return `scope-${this.state.scopeCode}`;
			}

			return this.state.groupId ?? 'root';
		}

		startInitializationPerfPoint()
		{
			// Never a second point over a running one: the field is the only handle to it, so the multi it
			// opened would stay unfinished.
			if (this.initializationPerfPoint)
			{
				return;
			}

			this.initializationPerfPoint = new PerfPoint(
				'BI Dashboard List Init',
				this.getInitializationPerfPointLabel(),
			).start();
			this.initializationPendingParts = new Set(['instanceStatus', 'list']);
			this.isListInitializationFinished = false;
			this.startPerfPoint('Load Instance Status');
			this.startPerfPoint('Load Dashboard List');

			// Opened without a connection the list is replaced by a state screen: it never mounts and never
			// asks the server, so its phase closes at once instead of living until the screen is unmounted.
			if (this.state.isOffline)
			{
				this.finishListInitialization({ source: 'offline' });
			}
		}

		getInitializationPerfPointLabel()
		{
			if (this.state.scopeCode)
			{
				return `scope ${this.state.scopeCode}`;
			}

			if (this.state.groupId !== null)
			{
				return `group ${this.state.groupId}`;
			}

			return 'root';
		}

		startPerfPoint(key)
		{
			if (!this.initializationPerfPoint || this.activePerfPointKeys.has(key))
			{
				return;
			}

			this.initializationPerfPoint.startPoint(key);
			this.activePerfPointKeys.add(key);
		}

		finishPerfPoint(key, extra = {})
		{
			if (!this.initializationPerfPoint || !this.activePerfPointKeys.has(key))
			{
				return;
			}

			this.initializationPerfPoint.endPoint(key, extra);
			this.activePerfPointKeys.delete(key);
		}

		finishInitializationPart(part, extra = {})
		{
			if (!this.initializationPendingParts.has(part))
			{
				return;
			}

			this.initializationPendingParts.delete(part);
			if (this.initializationPendingParts.size === 0)
			{
				this.finishInitializationPerfPoint(extra);
			}
		}

		finishInitializationPerfPoint(extra = {})
		{
			if (!this.initializationPerfPoint)
			{
				return;
			}

			for (const key of this.activePerfPointKeys)
			{
				this.initializationPerfPoint.endPoint(key, extra);
			}
			this.activePerfPointKeys.clear();
			this.initializationPendingParts.clear();
			this.initializationPerfPoint.end();
			this.initializationPerfPoint = null;
			this.activeListResponsePerfPointKey = null;
		}

		reloadWithFilter()
		{
			if (this.isUnmounted || !this.statefulList)
			{
				return;
			}

			this.statefulList.reload({ actionParams: this.buildActionParams() }, { useCache: false });
		}

		createFilter()
		{
			// The filter belongs to the root list. A zone host shows the list of its own section, and a
			// folder shows what it holds: the applied preset is shared with the root list, so a folder
			// would open under conditions the user never applied in it. The server leaves the preset
			// out of both requests as well.
			if (this.state.scopeCode || this.state.groupId !== null || !UnifiedFiltersFeature.isEnabled())
			{
				return null;
			}

			return new ListFilterEntry(getUnifiedFilterConfig({
				onApply: () => {
					this.rememberAppliedFilter();
					this.refreshMenuButtons();
					this.reloadWithFilter();
				},
				// the drawer replaces the stand-in with the filter itself
				onResolve: (filter) => {
					this.filter = filter;
				},
			}));
		}

		syncFilterMode()
		{
			// A start with nothing mirrored yet reads the flag as off, and the list is already drawn when
			// the answer arrives. The screen picks the filter up then, instead of waiting for the next
			// start of the application.
			UnifiedFiltersFeature.resolve()
				.then((enabled) => {
					if (!enabled || this.isUnmounted || this.filter)
					{
						return;
					}

					this.filter = this.createFilter();
					this.refreshMenuButtons();
					this.readFilterState(this.state.isFilterPresetsEnabled);
				})
				.catch(console.error)
			;
		}

		refreshMenuButtons()
		{
			// The badge of the filter button counts the applied conditions, so the navigation bar is
			// rebuilt where they change: the list reloads without redrawing the screen around it.
			this.statefulList?.setMenuButtons(this.getMenuButtons());
			this.statefulList?.initMenu();
		}

		/**
		 * The badge of the funnel counts what the filter holds, and the stand-in holds nothing: a list
		 * the server opened under the conditions it keeps (Dashboard::getListAction) would stand
		 * narrowed under an empty funnel, with nothing on the screen to say why. Reading the state
		 * answers the button, and leaves the answer for the cache of the next entry
		 * (rememberAppliedFilter).
		 *
		 * Once per screen, and only where the funnel is drawn at all: both switches have to agree, and
		 * the portal one arrives with the list. Asked after the first answer rather than at mount - the
		 * read loads the graph of the drawer, which the bundle of the list leaves out on purpose, so it
		 * is paid for behind a list that is already on screen.
		 *
		 * @param {boolean} presetsEnabled as the answer of the list names it
		 */
		readFilterState(presetsEnabled)
		{
			if (this.isFilterStateRequested || !presetsEnabled || !this.filter)
			{
				return;
			}

			this.isFilterStateRequested = true;

			this.filter.readState()
				.then((isStateRead) => {
					if (!isStateRead || this.isUnmounted)
					{
						return;
					}

					this.rememberAppliedFilter();
					this.refreshMenuButtons();
				})
				.catch(console.error)
			;
		}

		/**
		 * Whether the cache of the list may be drawn on this entry. A zone tab and a folder are
		 * answered by the server without the filter at all, so their cache is never in question.
		 *
		 * @return {boolean}
		 */
		resolveListCacheUsability()
		{
			return !(this.filter && this.isFilterMarkedApplied());
		}

		/**
		 * Whether the list is about to open under conditions the server already holds.
		 *
		 * The conditions stand on the server behind the pointer of the list, so two sets of them ask
		 * with one and the same payload and the cache cannot tell their answers apart: the rows of the
		 * previous conditions are drawn first and replaced by the answer of these - the list appears
		 * whole and narrows a moment later. A list that opens under no conditions has nothing to
		 * disagree with and keeps its cache, which is how most of them open.
		 *
		 * The mark is of the previous entry: conditions changed in the web are not known here, and
		 * that entry pays one redraw for them.
		 *
		 * @return {boolean}
		 */
		isFilterMarkedApplied()
		{
			return this.getFilterMarkStorage().getObject(FILTER_MARK_KEY, { applied: false }).applied === true;
		}

		rememberAppliedFilter()
		{
			this.getFilterMarkStorage().setObject(FILTER_MARK_KEY, { applied: this.filter?.isActive() === true });
		}

		getFilterMarkStorage()
		{
			return Application.storageById(`${FILTER_MARK_STORAGE}.${env.userId}`);
		}

		getMenuButtons()
		{
			// No search entry point in scope mode (see componentDidMount), and none on a state screen:
			// there is nothing to search through while access, the instance or the connection blocks the list.
			if (this.state.scopeCode || this.hasStateScreen())
			{
				return [];
			}

			const buttons = [
				{
					type: 'search',
					badgeCode: 'search',
					callback: () => this.showSearch(),
				},
			];

			// Two switches have to agree: the portal option of the module, which arrives with the list,
			// and the flag of the unified filter, whose value is mirrored on the device.
			if (this.filter && this.state.isFilterPresetsEnabled)
			{
				// the drawer opens over the layout of this screen, so it is opened from here
				buttons.push(this.filter.getMenuButton(() => {
					void this.filter.open(this.layout);
				}));
			}

			return buttons;
		}

		showSearch()
		{
			const search = this.getNativeSearch();
			if (search)
			{
				search.mode = 'bar';
				search.show();
			}
		}

		handleSearchText(params)
		{
			if (this.isUnmounted)
			{
				return;
			}

			const text = (params && params.text ? params.text : '').trim();
			if (text === this.state.searchText)
			{
				return;
			}

			// A single character is below the search threshold: %TITLE% is a leading-wildcard LIKE with no
			// index, so searching on the first keystroke is a full scan. An empty string still resets the list.
			if (text.length === 1)
			{
				return;
			}

			this.setState({ searchText: text }, () => this.reloadWithFilter());
		}

		onSearchCancel()
		{
			if (!this.state.searchText)
			{
				return;
			}

			this.setState({ searchText: '' }, () => this.reloadWithFilter());
		}

		onConnectionStatusChanged()
		{
			const offline = isOffline();
			if (offline === this.state.isOffline)
			{
				return;
			}

			if (offline)
			{
				// The offline screen replaces the list, so a pending search must not reload it any more.
				this.statefulList = null;
				// The list goes away with its load unfinished: the phase is closed here so the wait for a
				// connection stays out of the measurement.
				this.finishListInitialization({ source: 'offline' });
				this.setState({ isOffline: true }, () => this.dropMenuButtons());

				return;
			}

			// The list reloads itself once the connection is back; only the instance status has to be asked
			// again, because a request that failed offline is remembered as an error screen. Both are measured
			// anew: the point of the first attempt was closed when the connection went away.
			this.setState(
				{
					isOffline: false,
					instanceScreenState: null,
					instanceChecked: false,
				},
				() => {
					this.startInitializationPerfPoint();
					this.loadInstanceStatus();
				},
			);
		}

		dropMenuButtons()
		{
			// The list is unmounted on the offline screen, so nobody else can remove the button it installed.
			this.layout?.setRightButtons?.([]);
		}

		onRetry()
		{
			const offline = isOffline();

			this.setState(
				{
					isOffline: offline,
					instanceScreenState: null,
					instanceChecked: false,
					noAccessCode: null,
				},
				() => {
					if (offline)
					{
						return;
					}

					this.loadInstanceStatus();
					this.reloadWithFilter();
				},
			);
		}

		async onUpgradeTariff()
		{
			// Loaded on demand: the extension prefetches demo availability as soon as it is evaluated,
			// and that request is pointless for everyone who never opens a tariff screen.
			const { PlanRestriction } = await requireLazy('layout/ui/plan-restriction');

			PlanRestriction.openComponent(
				{
					title: Loc.getMessage('M_BIC_DASHBOARD_LIST_TARIFF_RESTRICTION_TITLE'),
					text: Loc.getMessage('M_BIC_DASHBOARD_LIST_TARIFF_RESTRICTION_TEXT'),
					featureId: TARIFF_FEATURE_ID,
				},
				this.layout,
			);
		}

		onItemClick(itemId, item)
		{
			if (item && item.entityType === EntityType.GROUP)
			{
				this.openGroup(item);

				return;
			}

			this.openDashboard(item);
		}

		openGroup(item)
		{
			if (!item)
			{
				return;
			}

			// A nested group opens as its own pushed screen so the native back arrow returns to the parent
			// list (no in-list "back to root" chrome).
			ComponentHelper.openLayout({
				name: LIST_COMPONENT,
				componentParams: {
					GROUP_ID: item.id,
					GROUP_TITLE: item.title,
				},
				widgetParams: {
					titleParams: {
						text: item.title,
						useLargeTitleMode: true,
					},
				},
			});
		}

		openDashboard(item)
		{
			if (!item)
			{
				return;
			}

			if (item.displayStatus === PROHIBITED_DASHBOARD_STATUS && item.isPinned !== true)
			{
				this.showProhibitedToast();

				return;
			}

			// The detail screen runs in a JS context of its own, so the point cannot travel there: this one
			// measures the open call, and what happens after it belongs to 'BI Dashboard Detail Open'.
			const point = new PerfPoint('BI Dashboard Open Detail', `dashboard ${item.id}`).start();

			try
			{
				// Full-screen pushed stack screen with a native back arrow (not a modal).
				ComponentHelper.openLayout({
					name: DETAIL_COMPONENT,
					// Without a version of its own the helper reads one off `availableComponents` - a map baked
					// into the script of this very screen, which the application keeps cached until the script
					// changes. A change in the detail screen alone leaves that map behind and the device opens
					// the report by the old script. The answer of the list is asked for anew every entry, so
					// the version travels with it; an answer without it falls back to the map.
					version: this.detailComponentVersion || undefined,
					componentParams: {
						DASHBOARD_ID: item.id,
						DASHBOARD_TITLE: item.title,
						DASHBOARD_IS_PINNED: item.isPinned === true,
					},
					// The title alone: the author and the date of the report are shown by the report itself,
					// and a second line here would repeat them right above their own place.
					widgetParams: {
						titleParams: {
							text: item.title,
						},
					},
				});
			}
			finally
			{
				point.end();
			}
		}

		showProhibitedToast()
		{
			// Explanatory only - the detail screen is refused by the server anyway. The reason is left unnamed
			// because the list response collapses a missing right and a missing Marketplace subscription into
			// the same status. Bound to the current layout so it cannot surface over another screen.
			showToast({
				message: Loc.getMessage('M_BIC_DASHBOARD_LIST_PROHIBITED_TOAST'),
				icon: Icon.LOCK,
			}, this.layout);
		}

		loadInstanceStatus()
		{
			try
			{
				new RunActionExecutor(STATUS_ACTION, {})
					.setHandler((response) => {
						if (isFailedResponse(response))
						{
							this.applyInstanceStatus(ScreenState.ERROR, 'error');

							return;
						}

						this.applyInstanceStatus(response?.data?.screenState || null, 'success');
					})
					.call(false)
					// The promise only rejects when the request never happened at all: an answer of the
					// server, failed or not, reaches the handler above.
					.catch(() => this.applyInstanceStatus(ScreenState.ERROR, 'error'));
			}
			catch (error)
			{
				this.applyInstanceStatus(ScreenState.ERROR, 'error');
			}
		}

		/**
		 * Whatever the outcome, the phase of the instance has to be closed: the initialization point waits
		 * for it, and a screen that never answers keeps the whole measurement open.
		 *
		 * @param {?string} instanceScreenState
		 * @param {string} perfStatus
		 */
		applyInstanceStatus(instanceScreenState, perfStatus)
		{
			try
			{
				this.setState({
					instanceScreenState,
					instanceChecked: true,
				});
			}
			finally
			{
				this.finishPerfPoint('Load Instance Status', { status: perfStatus });
				this.finishInitializationPart('instanceStatus', { source: 'instance' });
			}
		}

		onListResponse(response)
		{
			const responsePerfPointKey = this.isListInitializationFinished
				? null
				: 'Process First List Response';
			if (responsePerfPointKey)
			{
				this.startPerfPoint(responsePerfPointKey);
				this.activeListResponsePerfPointKey = responsePerfPointKey;
			}

			try
			{
				this.applyPinningAvailability(response);
				this.keepDashboardTypes(response);
				this.keepDetailComponentVersion(response);
				this.keepStaleConditions(response);

				const noAccessCode = this.detectNoAccessCode(response);
				const patch = {};
				if (noAccessCode !== this.state.noAccessCode)
				{
					patch.noAccessCode = noAccessCode;
				}
				const filterPresetsEnabled = response?.data?.isFilterPresetsEnabled === true;
				if (filterPresetsEnabled !== this.state.isFilterPresetsEnabled)
				{
					patch.isFilterPresetsEnabled = filterPresetsEnabled;
				}
				if (!this.state.listLoaded)
				{
					patch.listLoaded = true;
				}
				if (Object.keys(patch).length > 0)
				{
					this.setState(patch);
				}

				this.readFilterState(filterPresetsEnabled);

				return response;
			}
			catch (error)
			{
				this.finishListInitialization({ source: 'error' });

				throw error;
			}
		}

		applyPinningAvailability(response)
		{
			this.isPinningEnabled = response?.data?.isPinningEnabled === true;

			if (!this.isPinningEnabled)
			{
				this.dashboardContextMenu?.hide();
				this.pinnedDashboardIds.clear();
			}

			const items = response?.data?.items;
			if (!Array.isArray(items))
			{
				return;
			}

			items.forEach((item) => {
				item.isPinningEnabled = this.isPinningEnabled;
				item.isPinned = this.isPinningEnabled && item.isPinned === true;
			});
		}

		/**
		 * StatefulList overwrites item.type with a row type of its own making (`prepareItems` puts a
		 * generated hash there), so the DTO field cannot be read from the item in a row. It is carried
		 * under a name of ours instead, and the adapter is the right place: it runs on the server
		 * response and on the cached one alike, before the list touches the items.
		 *
		 * @param {?object} response
		 */
		keepDashboardTypes(response)
		{
			const items = response?.data?.items;

			if (!Array.isArray(items))
			{
				return;
			}

			items.forEach((item) => {
				item.dashboardType = item.type;
			});
		}

		/**
		 * The version the detail screen is opened at, as the server names it. It is held aside from the
		 * state on purpose: nothing on this screen is drawn from it, and a re-render for the sake of a
		 * version would redraw the whole list. The answer of the cache brings the version of the previous
		 * entry, the answer of the server the current one - the later answer wins, which is the one to
		 * open the report by.
		 *
		 * @param {?object} response
		 */
		keepDetailComponentVersion(response)
		{
			const version = response?.data?.detailComponentVersion;

			if (typeof version === 'string' && version !== '')
			{
				this.detailComponentVersion = version;
			}
		}

		keepStaleConditions(response)
		{
			const stale = Array.isArray(response?.data?.staleConditions) ? response.data.staleConditions : [];

			// One toast per set of dropped conditions: the list reloads on every page and every filter
			// change, and the same preset must not toast again on each of them.
			const signature = stale.map(({ fieldId, reason }) => `${fieldId}:${reason}`).join('|');
			if (signature === '' || signature === this.shownStaleSignature)
			{
				return;
			}

			this.shownStaleSignature = signature;

			const names = stale.map(({ fieldName }) => fieldName).filter(Boolean);

			showToast({
				message: names.length > 0
					? Loc.getMessage('M_BIC_DASHBOARD_LIST_STALE_CONDITIONS_TOAST', { '#FIELDS#': names.join(', ') })
					: Loc.getMessage('M_BIC_DASHBOARD_LIST_STALE_CONDITIONS_TOAST_SHORT'),
				icon: Icon.ALERT,
			}, this.layout);
		}

		onListItemsLoaded(data, source)
		{
			const itemsCount = Array.isArray(data?.items) ? data.items.length : 0;

			// The list is loaded twice per entry, from the cache and from the server, and the two answers can
			// disagree. The onboarding obeys the last one, so the size is remembered instead of being read
			// from the answer that happened to arm the timer.
			this.lastItemsCount = itemsCount;

			this.finishListInitialization({ source, itemsCount });

			void this.scheduleAhaMoment();
		}

		/**
		 * Onboarding into the feature: the hint is anchored to the first row of the list.
		 *
		 * @returns {Promise<void>}
		 */
		async scheduleAhaMoment()
		{
			if (this.isAhaMomentRequested || this.isAhaMomentShown)
			{
				return;
			}

			const skipReason = this.getAhaMomentSkipReason();
			if (skipReason)
			{
				// A timer armed by an earlier answer must not outlive it: a non-empty cached list arms it, and
				// an empty or refused server answer would otherwise still open the sheet over a state screen
				// and spend the single show of the user.
				this.dropAhaMomentTimeout();
				logAhaSkipped(skipReason);

				return;
			}

			try
			{
				await getTourist().ready();
			}
			catch (error)
			{
				console.error(error);
				logAhaSkipped('tourist is unavailable');

				return;
			}

			// Not logged: every list load of everyone who has seen the hint would land here, twice per
			// entry (cache and ajax) and forever.
			if (!getTourist().firstTime(AHA_TOURIST_EVENT))
			{
				return;
			}

			// Every list load lands here, so without this only the first one of a burst arms the timer.
			// The id is dropped as the timer fires, so an attempt that ended without a sheet leaves nothing
			// set and the next load is free to try again.
			if (this.ahaMomentTimeoutId !== null)
			{
				return;
			}

			this.ahaMomentTimeoutId = setTimeout(() => {
				this.ahaMomentTimeoutId = null;
				this.showAhaMoment();
			}, AHA_MOMENT_DELAY_MS);
		}

		/**
		 * Names the reason the onboarding must not appear right now, or null when the screen is ready for it.
		 * Read both when the timer is armed and when it fires: what the screen shows changes in between.
		 *
		 * @returns {?string}
		 */
		getAhaMomentSkipReason()
		{
			// An empty list has no row to anchor the hint to, so it neither shows nor spends the single show:
			// the hint waits for the first non-empty list.
			if (this.lastItemsCount === 0)
			{
				return 'empty list';
			}

			// Nobody is onboarded into a feature the screen refuses to show: a missing tariff, revoked rights,
			// a switched-off tool, an unavailable instance and a lost connection all draw a state screen
			// instead of the list, and the sheet would open over it.
			if (this.hasStateScreen())
			{
				return 'the screen shows a state instead of the list';
			}

			return null;
		}

		dropAhaMomentTimeout()
		{
			clearTimeout(this.ahaMomentTimeoutId);
			this.ahaMomentTimeoutId = null;
		}

		showAhaMoment()
		{
			if (this.isUnmounted || this.isAhaMomentRequested || this.isAhaMomentShown)
			{
				return;
			}

			// Asked again on the fire and not only on the arming: the answer that armed the timer is already
			// stale here. Both the fresher list and the state it brought (or the connection that went away)
			// arrive during the delay, and `state` is read anew instead of the closure of the arming call.
			const skipReason = this.getAhaMomentSkipReason();
			if (skipReason)
			{
				logAhaSkipped(skipReason);

				return;
			}

			if (!getTourist().firstTime(AHA_TOURIST_EVENT))
			{
				logAhaSkipped('the journal says the hint was already shown');

				return;
			}

			// The portal switch the aha-moment core used to check before a show. The dependency on
			// `ui-system/popups/aha-moment` in deps.php is kept for this flag alone, not for the popup.
			if (!jnExtensionData.get('ui-system/popups/aha-moment')?.momentsEnabled)
			{
				logAhaSkipped('aha moments are disabled for the portal');

				return;
			}

			try
			{
				// The sheet is about to open: from here on no list load may bring a second one.
				// `isAhaMomentShown` cannot do it, it waits for the sheet to actually appear.
				this.isAhaMomentRequested = true;

				this.openAhaMomentSheet();
			}
			catch (error)
			{
				console.error(error);
			}
		}

		openAhaMomentSheet()
		{
			// The click event is reported once per sheet, whatever ends it: the button reports its own type
			// and closes the sheet, so the dismiss listener must stay silent afterwards.
			let isClickReported = false;
			const reportClick = (type) => {
				if (isClickReported)
				{
					return;
				}

				isClickReported = true;
				this.sendAhaMomentAnalytics(AHA_ANALYTICS_EVENT_CLICK, type);
			};

			void new BottomSheet({
				// The sheet hands its widget to the content, and that is what the button closes.
				component: (widget) => this.renderAhaMomentContent(() => {
					reportClick(AHA_ANALYTICS_TYPE_GO_TO_FEATURE);
					widget.close();
				}),
			})
				.setParentWidget(this.layout)
				.setBackgroundColor(Color.bgContentPrimary.toHex())
				.setMediumPositionHeight(AHA_MOMENT_SHEET_HEIGHT)
				.open()
				.then((widget) => {
					// Marked on the fact of a show, not on the attempt: `open()` resolves once the widget
					// carries the content, and a failed open never resolves, so it cannot spend the show.
					this.isAhaMomentShown = true;
					void getTourist().remember(AHA_TOURIST_EVENT);
					this.sendAhaMomentAnalytics(AHA_ANALYTICS_EVENT_SHOW);

					// The dismissal by the backdrop or a swipe is a `close` click for analytics, and the two
					// names are the same event on the two platforms: onViewWillHidden - iOS,
					// onViewRemoved - Android.
					widget.setListener((eventName) => {
						if (eventName === 'onViewWillHidden' || eventName === 'onViewRemoved')
						{
							reportClick(AHA_ANALYTICS_TYPE_CLOSE);
						}
					});
				});
		}

		/**
		 * @param {function} onButtonClick
		 */
		renderAhaMomentContent(onButtonClick)
		{
			return InfoScreen({
				testId: 'bic-dashboard-list-aha',
				testIds: {
					box: 'bic-dashboard-list-aha',
					content: 'bic-dashboard-list-aha-content',
					image: 'bic-dashboard-list-aha-image',
					footer: 'bic-dashboard-list-aha-footer',
					primaryButton: 'bic-dashboard-list-aha-button',
				},
				safeArea: { bottom: true },
				withScroll: true,
				backgroundColor: Color.bgContentPrimary,
				image: {
					uri: makeLibraryImagePath(AHA_MOMENT_IMAGE.filename, AHA_MOMENT_IMAGE.folder),
					resizeMode: 'contain',
					width: AHA_MOMENT_IMAGE.width,
					height: AHA_MOMENT_IMAGE.height,
				},
				title: Loc.getMessage('M_BIC_DASHBOARD_LIST_AHA_TITLE'),
				titleColor: Color.base1,
				description: Loc.getMessage('M_BIC_DASHBOARD_LIST_AHA_DESC'),
				descriptionColor: Color.base3,
				footer: true,
				accentColor: Color.accentMainPrimary,
				// The button only closes the sheet. Navigating would make no sense: the user already stands
				// in the report list the hint is about.
				primaryButton: {
					testId: 'bic-dashboard-list-aha-button',
					text: Loc.getMessage('M_BIC_DASHBOARD_LIST_AHA_BUTTON'),
					backgroundColor: Color.accentMainPrimary,
					onClick: onButtonClick,
				},
			});
		}

		/**
		 * @param {string} event
		 * @param {?string} [type]
		 */
		sendAhaMomentAnalytics(event, type = null)
		{
			new AnalyticsEvent({
				...this.getAhaMomentAnalyticsLabel(),
				tool: AHA_ANALYTICS_TOOL,
				category: AHA_ANALYTICS_CATEGORY,
				event,
				type,
			}).send();
		}

		getAhaMomentAnalyticsLabel()
		{
			// `analytics/validator` drops the whole event when p1 holds more than one underscore, and a scope
			// code carries its own (automated_solution_7), so the separator stays only after the `zone` prefix.
			const zone = `${this.state.scopeCode ?? 'none'}`.replaceAll('_', '-');

			return {
				c_section: AHA_ANALYTICS_SECTION,
				c_sub_section: AHA_ANALYTICS_SUB_SECTION,
				p1: `zone_${zone}`,
			};
		}

		finishListInitialization(extra)
		{
			if (this.activeListResponsePerfPointKey)
			{
				this.finishPerfPoint(this.activeListResponsePerfPointKey, extra);
				this.activeListResponsePerfPointKey = null;
			}

			if (this.isListInitializationFinished)
			{
				return;
			}

			this.isListInitializationFinished = true;
			this.finishPerfPoint('Load Dashboard List', extra);
			this.finishInitializationPart('list', { source: 'list' });
		}

		/**
		 * Returns the first known no-access code found in the response errors, or null.
		 * Pure.
		 *
		 * @param {object} response
		 * @returns {?string}
		 */
		detectNoAccessCode(response)
		{
			const errors = response && Array.isArray(response.errors) ? response.errors : [];
			const knownCodes = Object.values(NoAccessCode);
			const error = errors.find((item) => item && knownCodes.includes(item.code));

			return error ? error.code : null;
		}

		/**
		 * Tells whether the screen currently shows a state instead of a list.
		 * An empty search result is not one of those: the query still has to be editable.
		 *
		 * @returns {boolean}
		 */
		hasStateScreen()
		{
			return this.state.isOffline
				|| Boolean(this.state.noAccessCode)
				|| resolveInstanceEmptyState(this.state.instanceScreenState) !== null;
		}

		/**
		 * Changes only when the empty-state slot has something new to draw. Passed down to StatefulList so a
		 * later answer (e.g. the instance status arriving after the list) breaks SimpleList's deep-equal guard
		 * and the slot is asked for a component again instead of keeping the pending placeholder forever.
		 *
		 * @returns {string}
		 */
		buildEmptyStateSignature()
		{
			return [
				this.state.listLoaded,
				this.state.instanceChecked,
				this.state.noAccessCode,
				this.state.instanceScreenState,
			].join('|');
		}

		renderEmptyState({ isSearchEnabled })
		{
			// Nothing is known yet: the list itself has not answered.
			if (!this.state.listLoaded)
			{
				return View({ testId: 'bic-dashboard-list-empty-pending', style: { flex: 1 } });
			}

			// A known no-access code already decides the screen - getEmptyStateConfig checks it before the
			// instance state - so a still-pending instance answer cannot change the outcome. Waiting for it
			// only means the placeholder never gets a second render.
			if (!this.state.noAccessCode && !this.state.instanceChecked)
			{
				return View({ testId: 'bic-dashboard-list-empty-pending', style: { flex: 1 } });
			}

			return this.renderStateBlock(this.getEmptyStateConfig(isSearchEnabled), 'bic-dashboard-list-empty');
		}

		/**
		 * @param {StateView} view
		 * @param {string} testId
		 * @returns {StatusBlock}
		 */
		renderStateBlock(view, testId)
		{
			return StatusBlock({
				testId,
				title: Loc.getMessage(view.titleId),
				description: Loc.getMessage(view.descId),
				footnote: view.footnoteId ? Loc.getMessage(view.footnoteId) : null,
				image: this.renderStateGraphic(view),
				buttons: this.buildStateButtons(view.action),
			});
		}

		/**
		 * @param {StateView} view
		 * @returns {?object}
		 */
		renderStateGraphic(view)
		{
			if (view.withIndicator)
			{
				return SpinnerLoader({ size: LOADING_INDICATOR_SIZE });
			}

			if (!view.image)
			{
				return null;
			}

			const { filename, folder, size } = view.image;
			const uri = makeLibraryImagePath(filename, folder);
			const params = {
				resizeMode: 'contain',
				style: {
					width: size,
					height: size,
				},
			};

			// A vector asset is passed through the svg prop, the uri prop decodes raster images only.
			return Image(filename.endsWith('.svg') ? { ...params, svg: { uri } } : { ...params, uri });
		}

		/**
		 * @param {?string} action
		 * @returns {Array}
		 */
		buildStateButtons(action)
		{
			if (action === StateAction.RETRY)
			{
				return [
					Button({
						testId: 'bic-dashboard-list-retry-button',
						text: Loc.getMessage('M_BIC_DASHBOARD_LIST_ACTION_RETRY'),
						design: ButtonDesign.FILLED,
						size: ButtonSize.L,
						leftIcon: Icon.REPEAT_CYCLE,
						onClick: this.onRetry,
					}),
				];
			}

			if (action === StateAction.UPGRADE_TARIFF)
			{
				return [
					Button({
						testId: 'bic-dashboard-list-upgrade-tariff-button',
						text: Loc.getMessage('M_BIC_DASHBOARD_LIST_ACTION_UPGRADE_TARIFF'),
						design: ButtonDesign.FILLED,
						size: ButtonSize.L,
						leftIcon: Icon.ROCKET,
						onClick: this.onUpgradeTariff,
					}),
				];
			}

			return [];
		}

		/**
		 * Picks the state the screen shows instead of the list. Offline comes first: without a connection
		 * there is no server answer, and blaming access or the instance for it would be wrong.
		 *
		 * @param {boolean} isSearchEnabled
		 * @returns {StateView}
		 */
		getEmptyStateConfig(isSearchEnabled)
		{
			if (this.state.isOffline)
			{
				return OFFLINE_VIEW;
			}

			if (this.state.noAccessCode)
			{
				return NO_ACCESS_VIEW[this.state.noAccessCode] || DEFAULT_NO_ACCESS_VIEW;
			}

			const instanceState = resolveInstanceEmptyState(this.state.instanceScreenState);
			if (instanceState)
			{
				return instanceState;
			}

			if (isSearchEnabled || this.state.searchText)
			{
				return SEARCH_EMPTY_VIEW;
			}

			return EMPTY_VIEW;
		}
	}

	module.exports = {
		DashboardList,
		DashboardItemsFactory,
		EntityType,
		ScreenState,
		StatusTone,
		getDashboardStatusView,
		resolveInstanceEmptyState,
		resolveAuthorBadgeUri,
	};
});
