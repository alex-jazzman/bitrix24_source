/**
 * @module timeman/work-reports/review/list
 */
jn.define('timeman/work-reports/review/list', (require, exports, module) => {
	const { Loc } = require('timeman/work-reports/loc');
	const { Color, Indent, Component, Typography } = require('tokens');
	const { Moment } = require('utils/date');
	const { StatefulList } = require('layout/ui/stateful-list');
	const { TypeGenerator } = require('layout/ui/stateful-list/type-generator');
	const { Icon } = require('ui-system/blocks/icon');
	const { PopupMenu, PopupMenuType } = require('ui-system/popups/popup-menu');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { showErrorToast } = require('toast');
	const { PureComponent } = require('layout/pure-component');
	const { makeLibraryImagePath } = require('asset-manager');
	const { ReportBanner } = require('timeman/ui/report-banner');
	const { DraftReportBanner } = require('timeman/work-reports/ui/draft-report-banner');
	const { FilterBar } = require('timeman/work-reports/review/list/src/filter-bar');
	const { WorkReportDetail } = require('timeman/work-reports/review/detail');
	const { WorkReportsApi } = require('timeman/work-reports/api');
	const { WorkReportsSettings } = require('timeman/work-reports/settings');
	const { FullReportBox } = require('timeman/work-reports/submit/full');
	const { ListItemsFactory, REPORT_ITEM_TYPE } = require(
		'timeman/work-reports/review/list/src/item-factory',
	);
	const { ReportItem } = require('timeman/work-reports/review/list/src/report-item');
	const { WorkReportListSkeleton } = require('timeman/work-reports/ui/skeleton');
	const { MarkEnum } = require('timeman/work-reports/enum');
	const { normalizeUserIds } = require('timeman/work-reports/utils');
	const { getReportBannerFlags } = require('timeman/work-reports/presentation');
	const { isEqual } = require('utils/object');
	const { createTestIdGenerator } = require('utils/test');

	const getCurrentMonthTime = () => new Moment().startOfMonth.date.getTime();

	const MORE_MENU_CACHE_ID = 'timeman-work-reports-review-list-more-menu';

	class WorkReportsList extends PureComponent
	{
		#api = new WorkReportsApi();

		/**
		 * @param {WorkReportsListProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				loaded: false,
				draftReport: props.draftReport ?? null,
				settings: props.settings ?? null,
				timestamp: getCurrentMonthTime(),
				selectedUserIds: WorkReportsList.#normalizeInitialUserIds(props),
				hasOtherSubordinates: false,
			};

			this.getTestId = createTestIdGenerator({
				prefix: 'work-reports',
				context: this,
			});

			this.itemsMap = new Map();
			this.lastPagination = { hasMore: true, nextOffset: 0 };
			this.filterBar = this.#createFilterBar();

			ListItemsFactory.setHandlers({
				onMarkChange: this.#handleRowMarkChange,
			});

			void this.#refreshHasOtherSubordinates();
		}

		#refreshHasOtherSubordinates = async () => {
			try
			{
				const hasOtherSubordinates = await this.#api.hasOtherSubordinates();
				if (this.state.hasOtherSubordinates !== hasOtherSubordinates)
				{
					this.setState({ hasOtherSubordinates });
				}
			}
			catch (error)
			{
				console.error(error);
			}
		};

		get parentWidget()
		{
			const { parentWidget } = this.props;

			return parentWidget;
		}

		render()
		{
			const loaded = this.#hasLoaded();

			if (loaded)
			{
				this.filterBar.refresh({
					selectedUserIds: this.state.selectedUserIds,
					timestamp: this.state.timestamp,
					hasOtherSubordinates: this.#hasOtherSubordinates(),
				});
			}

			return View(
				{
					testId: this.getTestId('list-container'),
					style: {
						flex: 1,
						backgroundColor: Color.bgPrimary.toHex(),
					},
				},
				this.#renderBanner(),
				this.#renderWorkReportListSkeleton(),
				View(
					{
						style: {
							flex: loaded ? 1 : undefined,
							display: loaded ? 'flex' : 'none',
						},
					},
					this.#renderList(),
				),
			);
		}

		#createFilterBar()
		{
			const { selectedUserIds, timestamp } = this.state;

			return new FilterBar({
				parentWidget: this.parentWidget,
				selectedUserIds,
				timestamp,
				hasOtherSubordinates: this.#hasOtherSubordinates(),
				onUsersSelected: this.#handleUsersSelected,
				onMonthSelected: this.#handleMonthSelected,
				extraButtons: this.#getExtraButtons(),
			});
		}

		#getExtraButtons()
		{
			if (!this.#getSettings()?.isAiReportsEnabled)
			{
				return [];
			}

			return [
				{
					id: 'more',
					type: Icon.MORE.getIconName(),
					callback: this.#showMoreMenu,
				},
			];
		}

		#renderWorkReportListSkeleton()
		{
			if (!this.#hasLoaded())
			{
				return new WorkReportListSkeleton({});
			}

			return null;
		}

		#renderBanner()
		{
			return View(
				{
					style: {
						paddingTop: Indent.XL.toNumber(),
					},
				},
				this.#renderGptBanner(),
				this.#renderDraftBanner(),
			);
		}

		#renderGptBanner()
		{
			const { hasGpt, hasAutoReport } = getReportBannerFlags(this.#getSettings());

			return ReportBanner({
				testId: 'work-reports-gpt-banner',
				hasAutoReport,
				hasGpt,
				text: hasGpt
					? Loc.getMessage('M_TIMEMAN_WORK_REPORTS_BANNER_DESCRIPTION', {
						'#BBCODE_START#': `[COLOR=${Color.copilotAccentLess2.toHex()}][B]`,
						'#BBCODE_END#': '[/B][/COLOR]',
					})
					: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_BANNER_DESCRIPTION_ROBOT'),
				typography: Typography.text6,
				style: {
					paddingHorizontal: Component.paddingLr.toNumber(),
					marginBottom: Indent.S.toNumber(),
				},
			});
		}

		/**
		 * The send screen belongs to both schemes: the ai layer only prefills its text, the send itself is
		 * the old scheme. So this entry point follows the draft alone and not the ai reports mode.
		 */
		#renderDraftBanner()
		{
			if (!this.#hasDraftReport())
			{
				return null;
			}

			return DraftReportBanner({
				testId: 'work-reports-draft-banner',
				count: 1,
				onClick: this.#handleDraftBannerClick,
			});
		}

		#handleDraftBannerClick = () => {
			const { draftReport } = this.state;
			if (!draftReport)
			{
				return;
			}

			FullReportBox.openReport({
				parentWidget: this.parentWidget,
				reportToSend: draftReport,
				settings: this.#getSettings(),
				onSent: this.#refreshDraftReport,
			});
		};

		#showMoreMenu = () => {
			PopupMenu
				.create({ cacheId: MORE_MENU_CACHE_ID })
				.setActions([
					{
						id: 'SETTINGS',
						title: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_MORE_MENU_SETTINGS'),
						icon: Icon.SETTINGS,
						onItemSelected: () => {
							WorkReportsSettings.open({
								parentWidget: this.parentWidget,
								onClose: this.#handleSettingsClosed,
							});
						},
					},
					{
						type: PopupMenuType.HELPDESK,
						data: {
							articleCode: '28482350',
						},
					},
				])
				.show()
			;
		};

		#handleSettingsClosed = async () => {
			try
			{
				const settings = await this.#api.getReportSettings();
				this.#updateSettings(settings);
			}
			catch (e)
			{
				console.error(e);
			}
		};

		#refreshDraftReport = async () => {
			let nextDraftReport = null;

			try
			{
				const report = await this.#api.getReportToSend();
				if (report?.isReadyForSubmit)
				{
					nextDraftReport = report;
				}
			}
			catch (e)
			{
				console.error(e);
			}

			if (this.state.draftReport !== nextDraftReport)
			{
				this.setState({ draftReport: nextDraftReport });

				if (nextDraftReport === null)
				{
					BX.postComponentEvent('stafftrack.check-in-v2.tabs:set-tab-label', [
						{
							tabId: 'work-reports',
							label: '',
						},
					]);
				}
			}
		};

		#renderList()
		{
			return new StatefulList({
				testId: this.getTestId('list'),
				jsonEnabled: true,
				actions: {
					loadItems: 'timemanmobile.FullReport.getSubordinateUserReports',
				},
				actionParams: this.#getActionParams(),
				actionCallbacks: {
					loadItems: this.#onItemsLoaded,
				},
				typeGenerator: {
					generator: TypeGenerator.generators.bySelectedProperties,
					groups: ['this', 'report', 'user'],
					properties: [
						'itemType',
						'dateFrom',
						'dateTo',
						'name',
					],
				},
				showAirStyle: true,
				onBeforeItemsRender: this.#onBeforeItemsRender,
				itemType: REPORT_ITEM_TYPE,
				itemFactory: ListItemsFactory,
				hasActions: false,
				itemsLoadLimit: 20,
				isShowFloatingButton: false,
				layout: this.parentWidget,
				ref: this.#bindRef,
				itemDetailOpenHandler: this.#handleItemClick,
				getItemCustomStyles: this.#getItemCustomStyles,
				animationTypes: {
					insertRows: 'fade',
					updateRows: 'none',
					deleteRow: 'fade',
				},
				getEmptyListComponent: this.#renderEmptyState,
				getRequestNavigation: this.#getRequestNavigation,
				isAllItemsLoaded: this.#isAllItemsLoaded,
				forceLoadMoreEnabled: true,
			});
		}

		/**
		 * @param {WorkReportsListNavigationRequest} params
		 * @returns {object}
		 */
		#getRequestNavigation = ({ blockPage, itemsLoadLimit, defaultNavigation }) => {
			if (blockPage === 1)
			{
				this.lastPagination = { hasMore: true, nextOffset: 0 };

				return defaultNavigation;
			}

			const offset = this.lastPagination?.nextOffset;
			if (!Number.isFinite(offset) || offset <= 0)
			{
				return defaultNavigation;
			}

			return {
				page: Math.floor(offset / itemsLoadLimit) + 1,
				size: itemsLoadLimit,
			};
		};

		/**
		 * @param {{ response?: { hasMore?: boolean } }} params
		 * @returns {boolean}
		 */
		#isAllItemsLoaded = ({ response }) => response?.hasMore === false;

		#getItemCustomStyles = () => ({
			wrapper: {
				paddingBottom: 0,
			},
		});

		#renderEmptyState = () => {
			return StatusBlock({
				testId: this.getTestId('empty-state'),
				title: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_EMPTY_TITLE'),
				description: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_EMPTY_DESCRIPTION'),
				emptyScreen: true,
				onRefresh: this.#onEmptyScreenPullToRefresh,
				image: Image({
					resizeMode: 'contain',
					style: {
						width: 224,
						height: 224,
					},
					uri: makeLibraryImagePath('misunderstanding.png', 'marshmallow', 'mobile', false),
				}),
			});
		};

		#onEmptyScreenPullToRefresh = () => {
			this.statefulList?.reload({
				actionParams: this.#getActionParams(),
			}, {
				useCache: false,
			});
		};

		#bindRef = (ref) => {
			if (ref)
			{
				this.statefulList = ref;
			}
		};

		/**
		 * @param {WorkReportsListResponseData} responseData
		 * @param {string} renderType
		 * @param {WorkReportsListLoadConfig} config
		 */
		#onItemsLoaded = (responseData, renderType, config) => {
			const { items = [], hasMore, nextOffset } = responseData || {};

			const isFirstPage = (config?.navigation?.page ?? 1) === 1;
			if (isFirstPage)
			{
				this.itemsMap.clear();
			}

			const responseSettings = responseData?.settings;
			let settings = this.#getSettings();
			if (responseSettings)
			{
				this.#updateSettings(responseSettings);
				settings = responseSettings;
			}

			items.forEach((item) => {
				const normalizedItem = WorkReportsList.#isReportRow(item) && item.report
					? {
						...item,
						report: WorkReportsApi.normalizeReportPayload(item.report, { settings }),
					}
					: item;

				this.itemsMap.set(normalizedItem.id, normalizedItem);
			});

			this.lastPagination = {
				hasMore: hasMore !== false,
				nextOffset: Number.isFinite(nextOffset) ? nextOffset : null,
			};

			if (!this.#hasLoaded())
			{
				this.setState({ loaded: true });
			}
		};

		/**
		 * @param {WorkReportListItem[]} items
		 * @returns {WorkReportListItem[]}
		 */
		#onBeforeItemsRender = (items) => {
			return items.map((item) => ({
				...item,
				showBorder: WorkReportsList.#isReportRow(item),
			}));
		};

		/**
		 * @param {Partial<object>} stateUpdate
		 */
		#reload(stateUpdate)
		{
			this.setState(stateUpdate, () => {
				this.statefulList?.reload(
					{
						actionParams: this.#getActionParams(),
					},
					{
						useCache: false,
					},
				);
			});
		}

		/**
		 * @param {FilterBarSelectedUser[]} [selectedUsers]
		 */
		#handleUsersSelected = (selectedUsers) => {
			const nextUserIds = normalizeUserIds(selectedUsers?.map((user) => user?.id));

			if (isEqual(new Set(nextUserIds), new Set(this.state.selectedUserIds)))
			{
				return;
			}

			this.#reload({ selectedUserIds: nextUserIds });
		};

		/**
		 * @returns {WorkReportsListActionParams}
		 */
		#getActionParams()
		{
			const { selectedUserIds, timestamp } = this.state;
			const moment = new Moment(timestamp);

			const filter = {
				dateFrom: moment.startOfMonth.timestamp,
				dateTo: Math.floor(moment.endOfMonth.date.getTime() / 1000),
			};

			if (Array.isArray(selectedUserIds) && selectedUserIds.length > 0)
			{
				filter.userIds = selectedUserIds;
			}

			return {
				loadItems: { filter },
			};
		}

		/**
		 * @param {WorkReportsListProps} props
		 * @returns {number[]}
		 */
		static #normalizeInitialUserIds(props)
		{
			if (Array.isArray(props.selectedUserIds))
			{
				return normalizeUserIds(props.selectedUserIds);
			}

			const singleId = Number(props.userId);

			return singleId > 0 ? [singleId] : [];
		}

		/**
		 * @param {WorkReportListItem | undefined | null} item
		 * @returns {boolean}
		 */
		static #isReportRow(item)
		{
			return item?.itemType === REPORT_ITEM_TYPE;
		}

		/**
		 * @param {number} timestamp
		 */
		#handleMonthSelected = (timestamp) => {
			if (timestamp === this.state.timestamp)
			{
				return;
			}

			this.#reload({ timestamp });
		};

		/**
		 * @param {string} rowId
		 */
		#handleItemClick = (rowId) => {
			const item = this.itemsMap.get(rowId);
			if (!WorkReportsList.#isReportRow(item) || !item.report)
			{
				return;
			}

			WorkReportDetail.open({
				item: item.report,
				settings: this.#getSettings(),
				onMarkChange: this.#applyMarkStateByReportId,
				parentWidget: this.parentWidget,
			});
		};

		/**
		 * @param {string} rowId
		 * @param {MarkStateValue} nextState
		 */
		#handleRowMarkChange = async (rowId, nextState) => {
			const prev = this.itemsMap.get(rowId);
			const reportId = prev?.report?.id;
			// A tap while the write of this report is in flight is dropped silently: there is no error to report.
			if (!reportId || this.#api.isMarkWriteInFlight(reportId))
			{
				return;
			}

			// The mark itself rather than the state it shows: the unconfirmed mark and the neutral one look
			// alike, so a rollback through the state would leave the row holding a mark the server never
			// stored, and the rows would differ from the portal until the list is loaded again.
			const prevMark = prev.report.mark;

			try
			{
				this.#applyMarkStateByReportId(reportId, nextState);

				await this.#api.saveMarkState(reportId, nextState);
			}
			catch (error)
			{
				this.#applyMarkByReportId(reportId, prevMark);
				showErrorToast();
				console.error(error);
			}
		};

		/**
		 * @param {number} reportId
		 * @param {MarkStateValue} markState
		 */
		#applyMarkStateByReportId = (reportId, markState) => {
			this.#applyMarkByReportId(reportId, MarkEnum.fromState(markState));
		};

		/**
		 * @param {number} reportId
		 * @param {string} mark
		 */
		#applyMarkByReportId = (reportId, mark) => {
			this.itemsMap.forEach((item, rowId) => {
				if (WorkReportsList.#isReportRow(item) && item.report?.id === reportId)
				{
					this.#applyMark(rowId, mark);
				}
			});
		};

		/**
		 * @param {string} rowId
		 * @param {string} mark
		 */
		#applyMark = (rowId, mark) => {
			const prev = this.itemsMap.get(rowId);
			if (!prev?.report)
			{
				return;
			}

			const next = {
				...prev,
				report: {
					...prev.report,
					mark,
				},
			};

			this.itemsMap.set(rowId, next);
			this.statefulList?.updateItemsData?.([next]);
		};

		/**
		 * @param {ReportSettings|null|undefined} responseSettings
		 */
		#updateSettings(responseSettings)
		{
			if (!responseSettings)
			{
				return;
			}

			const { settings } = this.state;

			if (!isEqual(settings, responseSettings))
			{
				this.setState({ settings: responseSettings });
			}
		}

		#hasLoaded()
		{
			return Boolean(this.state.loaded);
		}

		#hasDraftReport()
		{
			return Boolean(this.state.draftReport);
		}

		#hasOtherSubordinates()
		{
			return Boolean(this.state.hasOtherSubordinates);
		}

		/**
		 * @returns {ReportSettings|null}
		 */
		#getSettings()
		{
			return this.state.settings;
		}
	}

	module.exports = { WorkReportsList, ReportItem };
});
