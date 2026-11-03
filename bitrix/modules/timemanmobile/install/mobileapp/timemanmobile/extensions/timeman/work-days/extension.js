/**
 * @module timeman/work-days
 */
jn.define('timeman/work-days', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Corner } = require('tokens');
	const { Moment } = require('utils/date');
	const { Icon } = require('ui-system/blocks/icon');
	const { PopupMenu, PopupMenuType } = require('ui-system/popups/popup-menu');
	const { FilterBar } = require('timeman/work-days/ui/filter-bar');
	const { CalendarLegend } = require('timeman/work-days/ui/legend');
	const { WorkDayCalendar } = require('timeman/work-days/ui/calendar');
	const { WorkDaysList } = require('timeman/work-days/ui/list');
	const { WorkDaysSettings } = require('timeman/work-days/settings');
	const { createTestIdGenerator } = require('utils/test');
	const { fetchWorkDaysData } = require('timeman/work-days/api');
	const { buildDayMap, getCalendarGridRange } = require('timeman/work-days/utils');
	const { WorkDaysListSkeleton } = require('timeman/work-days/ui/skeleton/list');
	const { WorkDaysLegendSkeleton } = require('timeman/work-days/ui/skeleton/legend');
	const { isEmpty } = require('utils/object');

	const MORE_MENU_CACHE_ID = 'timeman-work-days-more-menu';

	const getCurrentMonthTime = () => new Moment().startOfMonth.date.getTime();

	class WorkDays extends LayoutComponent
	{
		/**
		 * @param {WorkDaysProps} props
		 */
		constructor(props)
		{
			super(props);

			const currentUserId = Number(props.userId || env.userId);
			const currentMonthTimestamp = getCurrentMonthTime();

			this.state = {
				loaded: false,
				timestamp: currentMonthTimestamp,
				selectedTimestamp: currentMonthTimestamp,
				userId: currentUserId,
				user: null,
				absences: [],
				records: [],
				reports: [],
			};

			this.getTestId = createTestIdGenerator({ prefix: 'work-days', context: this });
			this.listRef = null;
			this.loadId = 0;
			this.pendingScrollTimestamp = null;
			this.pendingMonthTimestamp = null;
		}

		componentDidMount()
		{
			this.#loadData();
			this.#setRightButtons();
		}

		#setRightButtons()
		{
			this.parentWidget?.setRightButtons?.([
				{
					id: 'more',
					type: Icon.MORE.getIconName(),
					callback: this.#showMoreMenu,
				},
			]);
		}

		#showMoreMenu = () => {
			PopupMenu
				.create({ cacheId: MORE_MENU_CACHE_ID })
				.setActions([
					{
						id: 'SETTINGS',
						title: Loc.getMessage('M_TIMEMAN_WORK_DAYS_MORE_MENU_SETTINGS'),
						icon: Icon.SETTINGS,
						onItemSelected: () => WorkDaysSettings.open({ parentWidget: this.parentWidget }),
					},
					{
						type: PopupMenuType.HELPDESK,
						data: {
							articleCode: '28469478',
						},
					},
				])
				.show()
			;
		};

		get parentWidget()
		{
			const { parentWidget } = this.props;

			return parentWidget;
		}

		render()
		{
			const { monthDayMap, calendarDayMap } = this.#buildDayMaps();

			return View(
				{
					testId: this.getTestId('container'),
					style: {
						flex: 1,
						backgroundColor: Color.bgContentSecondary.toHex(),
					},
				},
				View(
					{
						style: {
							backgroundColor: Color.bgContentPrimary.toHex(),
							borderBottomRightRadius: Corner.XL.toNumber(),
							borderBottomLeftRadius: Corner.XL.toNumber(),
						},
					},
					this.#renderFilterBar(),
					this.#renderCalendar(calendarDayMap),
					this.#renderLegend(monthDayMap),
				),
				this.#renderList(monthDayMap),
			);
		}

		#renderFilterBar()
		{
			const { userId, user, timestamp } = this.state;

			return new FilterBar({
				testId: this.getTestId('filter-bar'),
				userId,
				user,
				timestamp,
				parentWidget: this.parentWidget,
				onUserSelected: this.#handleUserSelected,
				onMonthSelected: this.#handleMonthSelected,
			});
		}

		#buildDayMaps()
		{
			const {
				timestamp,
				records,
				absences,
				reports,
				user,
			} = this.state;

			const moment = new Moment(timestamp);
			const { start: gridStart, end: gridEnd } = getCalendarGridRange(moment.startOfMonth.date);
			const registerDate = user?.dateRegister ? new Date(user.dateRegister * 1000) : null;

			const monthDayMap = buildDayMap(
				moment.startOfMonth.date,
				moment.endOfMonth.date,
				records,
				absences,
				reports,
				registerDate,
			);
			const calendarDayMap = buildDayMap(gridStart, gridEnd, records, absences, reports, registerDate);

			return { monthDayMap, calendarDayMap };
		}

		#renderCalendar(dayMap)
		{
			const { timestamp, selectedTimestamp } = this.state;

			return new WorkDayCalendar({
				testId: this.getTestId('calendar'),
				timestamp,
				selectedTimestamp,
				dayMap,
				onMonthSwitched: this.#handleMonthSelected,
				onDateSelected: this.#handleDateSelected,
			});
		}

		#renderLegend(dayMap)
		{
			if (!this.state.loaded)
			{
				return WorkDaysLegendSkeleton();
			}

			const counts = {};

			dayMap.forEach(({ dayType }) => {
				if (dayType)
				{
					counts[dayType.id] = (counts[dayType.id] || 0) + 1;
				}
			});

			return !isEmpty(counts) && new CalendarLegend({
				testId: this.getTestId('legend'),
				counts,
			});
		}

		#renderList(dayMap)
		{
			const { timestamp, loaded, userId } = this.state;

			if (!loaded)
			{
				return WorkDaysListSkeleton();
			}

			return new WorkDaysList({
				ref: (ref) => {
					this.listRef = ref;
				},
				timestamp,
				dayMap,
				userId,
				layout: this.parentWidget,
				scrollToTimestamp: this.pendingScrollTimestamp,
				onDateScrolled: this.#handleListDateScrolled,
			});
		}

		#loadData()
		{
			const { userId, timestamp } = this.state;
			const moment = new Moment(timestamp);
			const { start: gridStart, end: gridEnd } = getCalendarGridRange(moment.startOfMonth.date);
			const currentLoadId = ++this.loadId;

			const isActual = () => currentLoadId === this.loadId;

			const applyData = (data) => {
				this.setState({
					loaded: true,
					records: data.records || [],
					absences: data.absences || [],
					reports: data.reports || [],
					user: data.user || null,
				}, () => {
					if (this.pendingMonthTimestamp === this.state.timestamp)
					{
						this.pendingMonthTimestamp = null;
					}

					this.#scrollToPendingDate();
				});
			};

			fetchWorkDaysData({
				userId,
				dateFrom: new Moment(gridStart.getTime()).timestamp,
				dateTo: new Moment(gridEnd.getTime()).timestamp,
				onCache: (cache) => {
					if (!isActual())
					{
						return;
					}

					applyData(cache.data || {});
				},
			})
				.then((response) => {
					if (!isActual())
					{
						return;
					}

					applyData(response.data || {});
				})
				.catch((error) => {
					console.error(error);

					if (!isActual())
					{
						return;
					}

					this.setState({ loaded: true });
				});
		}

		#reload(stateUpdate)
		{
			const userChanged = stateUpdate.userId && stateUpdate.userId !== this.state.userId;
			const timestampChanged = stateUpdate.timestamp && stateUpdate.timestamp !== this.state.timestamp;
			if (timestampChanged)
			{
				this.pendingMonthTimestamp = stateUpdate.timestamp;
			}

			this.setState({
				...stateUpdate,
				loaded: false,
				absences: [],
				records: [],
				reports: [],
				...(userChanged ? { user: null } : {}),
			}, () => {
				this.#loadData();
			});
		}

		#handleUserSelected = (selectedUser) => {
			if (!selectedUser)
			{
				return;
			}

			const userId = Number(selectedUser.id);
			if (userId === this.state.userId)
			{
				return;
			}

			const timestamp = new Moment().startOfMonth.date.getTime();
			this.pendingScrollTimestamp = null;
			this.#reload({ userId, timestamp, selectedTimestamp: timestamp });
		};

		#handleDateSelected = (timestamp) => {
			const monthTime = new Moment(timestamp).startOfMonth.date.getTime();
			this.pendingScrollTimestamp = timestamp;

			if (monthTime !== this.state.timestamp)
			{
				if (monthTime !== this.pendingMonthTimestamp)
				{
					this.#reload({ timestamp: monthTime, selectedTimestamp: timestamp });
				}
				else
				{
					this.setState({ selectedTimestamp: timestamp });
				}

				return;
			}

			this.setState({ selectedTimestamp: timestamp }, () => {
				this.#scrollToPendingDate();
			});
		};

		#scrollToPendingDate()
		{
			if (!this.pendingScrollTimestamp || !this.listRef)
			{
				return;
			}

			const scrolled = this.listRef.scrollToDate(this.pendingScrollTimestamp);
			if (scrolled)
			{
				this.pendingScrollTimestamp = null;
			}
		}

		#handleListDateScrolled = (timestamp) => {
			if (this.pendingScrollTimestamp === timestamp)
			{
				this.pendingScrollTimestamp = null;
			}
		};

		#handleMonthSelected = (timestamp) => {
			const monthTime = new Moment(timestamp).startOfMonth.date.getTime();

			if (monthTime === this.state.timestamp || monthTime === this.pendingMonthTimestamp)
			{
				return;
			}

			const pendingScrollMonthTime = this.pendingScrollTimestamp
				? new Moment(this.pendingScrollTimestamp).startOfMonth.date.getTime()
				: null;

			if (pendingScrollMonthTime !== monthTime)
			{
				this.pendingScrollTimestamp = null;
			}

			this.#reload({ timestamp: monthTime, selectedTimestamp: this.pendingScrollTimestamp || monthTime });
		};
	}

	module.exports = { WorkDays };
});
