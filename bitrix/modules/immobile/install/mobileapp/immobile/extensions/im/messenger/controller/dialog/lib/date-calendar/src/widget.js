/**
 * @module im/messenger/controller/dialog/lib/date-calendar/src/widget
 */
jn.define('im/messenger/controller/dialog/lib/date-calendar/src/widget', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Moment } = require('utils/date');
	const { capitalize } = require('utils/string');
	const { BottomSheet } = require('bottom-sheet');
	const { PerfPoint } = require('debug/prism');
	const {
		Button,
		ButtonDesign,
		ButtonSize,
		Icon,
	} = require('ui-system/form/buttons/button');
	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');
	const { getLogger } = require('im/messenger/lib/logger');
	const {
		DateCode,
		DateNavigationService,
		DateNavigationStatus,
		DateNavigationTimezone,
	} = require('im/messenger/lib/date-navigation');
	const { DisabledDays } = require('im/messenger/controller/dialog/lib/date-calendar/src/disabled-days');

	const LOGGER_KEY = 'dialog-date-calendar';
	const TEST_ID = 'dialog-date-calendar';
	const MILLISECONDS_IN_SECOND = 1000;
	const SHEET_HEIGHT = 520;

	// the controls of the header are the only way to the previous month on Android, so they are
	// sized by the minimum comfortable touch target and not by the smallest button that fits:
	// `ButtonSize.M` is 36dp, and a tap a few pixels off such a target misses it
	const HEADER_BUTTON_SIZE = ButtonSize.L;
	const HEADER_HEIGHT = 56;
	// one token step below the usual sheet indent, and the step is what fits the longest month name
	// of the locale together with everything else in the row - measured on the narrowest phone the
	// application supports. The shrink rules of the header still guard the row (see renderHeader):
	// this indent decides whether they have to fire at all on an ordinary month
	const HEADER_PADDING = Indent.L;
	const PREVIOUS_MONTH_STEP = -1;
	const NEXT_MONTH_STEP = 1;
	const ANDROID_PLATFORM = 'android';
	const IOS_PLATFORM = 'ios';
	const MONTH_SWITCH_ANIMATION_DURATION = 300;
	// the grid the component builds for itself, and the only months a date can be set into. iOS
	// spans a hundred years each way from today, Android a fixed pair of years - and the whole year
	// of an edge is dropped rather than counted to the day, because the ends of those grids are
	// months of the native side and not of ours (see canSetDate)
	const IOS_ADDRESSABLE_YEARS = 100;
	const ANDROID_FIRST_ADDRESSABLE_YEAR = 1900;
	const ANDROID_LAST_ADDRESSABLE_YEAR = 2100;
	// one window carries two months, so a single request warms the whole pair ahead of the shown one
	const MONTHS_WARMED_AHEAD = 2;
	const MONTH_KEY_LENGTH = 7;
	// A sheet built while the list that reported the tap is still busy with it leaves `CalendarView`
	// without its grid: the header draws, the days never appear. Measured on iOS on the entry from
	// the date separator - the entry from the search panel asks the feed for its visible messages and
	// is saved by that round trip alone. The wait is what the round trip gives for free.
	const OPEN_DELAY = 120;
	const STANDALONE_MONTH_NAME = 'LLLL';

	// the component numbers the weekdays from Sunday, and the chat has no calendar settings of its
	// own to ask - unlike the calendar module, which sends the portal ones along with its data
	const FIRST_WEEKDAY_MONDAY = 2;

	const waitFor = (milliseconds) => new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});

	/**
	 * The day named by a visible row itself: the id of a date separator carries it, and nothing else
	 * on the row does.
	 *
	 * @param {Array<{id: string}>} [messageList]
	 * @return {DateNavigationDay|null}
	 */
	const findSeparatorDay = (messageList) => (messageList ?? [])
		.map((message) => DateCode.fromSeparatorId(message?.id))
		.find(Boolean) ?? null;

	/**
	 * The day of a visible row read from the model behind it.
	 *
	 * A date separator is an ordinary row of the feed, so a scroll INSIDE a long day leaves it above
	 * the viewport while the messages of that day stay on screen - and the row of a message carries
	 * its time, never its day. The model does carry the day, and the separator is built from that
	 * very date, so the two answers cannot disagree.
	 *
	 * The oldest message of a rendered window gets no separator above it at all
	 * (`MessageRenderer.addTemplateMessagesToList`), which is why the day is taken from the model and
	 * not by walking the rendered rows back to the nearest separator.
	 *
	 * @param {Array<{id: string}>} [messageList]
	 * @param {IDateCalendarDialogLocator} [dialogLocator]
	 * @return {DateNavigationDay|null}
	 */
	const findMessageDay = (messageList, dialogLocator) => {
		const modelList = dialogLocator?.get('message-renderer')?.messageList;

		if (!Array.isArray(modelList) || modelList.length === 0)
		{
			return null;
		}

		for (const row of messageList ?? [])
		{
			// the view reports its rows with string ids while the model keeps them as numbers, and an
			// own message wears a UUID until the server confirms it
			const rowId = String(row?.id ?? '');
			const model = modelList.find(
				(message) => String(message?.id) === rowId || String(message?.templateId) === rowId,
			);
			const day = model?.date instanceof Date ? DateNavigationTimezone.toServerDay(model.date) : null;

			if (DateCode.fromServerDay(day) !== null)
			{
				return day;
			}
		}

		return null;
	};

	/**
	 * Month of the period the feed is showing. The visible date separator is the cheapest answer, the
	 * model of a visible message is the one that survives a scroll inside a day, and a feed that
	 * carries neither has no month of its own.
	 *
	 * @param {Array<{id: string}>} [messageList]
	 * @param {IDateCalendarDialogLocator} [dialogLocator]
	 * @return {Date|null}
	 */
	const findVisibleMonth = (messageList, dialogLocator) => {
		const day = findSeparatorDay(messageList) ?? findMessageDay(messageList, dialogLocator);

		if (day === null)
		{
			return null;
		}

		const visibleDate = DateNavigationTimezone.fromServerDay(day);

		return new Date(visibleDate.getFullYear(), visibleDate.getMonth(), 1);
	};

	/**
	 * Calendar of the chat history on the native `CalendarView`: a grid of days of our own is not
	 * written, and the days that cannot be picked are handed over by `setDisabledDates` - the very
	 * mechanism that bans them.
	 *
	 * @class DateCalendarWidget
	 * @extends {LayoutComponent<DateCalendarProps, DateCalendarState>}
	 */
	class DateCalendarWidget extends LayoutComponent
	{
		#service;
		#calendarRef = null;
		#markupGeneration = 0;
		#expectedOpeningSelection = null;
		#expectedSyntheticSelections = [];

		/**
		 * Sheets being opened right now, one slot per dialog, shared by both entry points of that
		 * dialog. The open waits OPEN_DELAY before it builds anything, so two taps inside that window
		 * would otherwise raise two sheets stacked over each other: the pick closes the upper one and
		 * leaves the lower one over the feed. The web closes the same case explicitly, by resetting
		 * the open picker first.
		 *
		 * The slot is per dialog and never per class: a chat left while its opening was still waiting
		 * would otherwise hand its sheet - built for a feed nobody is looking at any more - to the
		 * chat opened next.
		 *
		 * @type {Map<string, Promise<PageManager|null>>}
		 */
		static #openInFlight = new Map();

		/**
		 * @param {DateCalendarOpenOptions} options
		 * @return {Promise<PageManager|null>}
		 */
		static async open(options)
		{
			const { dialogId } = options;
			const inFlight = DateCalendarWidget.#openInFlight.get(dialogId);
			if (inFlight)
			{
				return inFlight;
			}

			const opening = DateCalendarWidget.#open(options).finally(() => {
				// the slot is freed by the opening that still holds it and never by one left behind:
				// a chat reopened while the previous opening was in flight may already sit under the
				// very same dialog id, and freeing that one would let its second tap raise a sheet of
				// its own on top
				if (DateCalendarWidget.#openInFlight.get(dialogId) === opening)
				{
					DateCalendarWidget.#openInFlight.delete(dialogId);
				}
			});

			DateCalendarWidget.#openInFlight.set(dialogId, opening);

			return opening;
		}

		/**
		 * @param {DateCalendarOpenOptions} options
		 * @return {Promise<PageManager|null>}
		 */
		static async #open(options)
		{
			const logger = getLogger(LOGGER_KEY);

			// the contract forbids probing the new calendar API by exception, so the paired gate is
			// the only thing that lets the widget open at all
			if (!Feature.isMessageDateNavigationEnabled)
			{
				logger.warn(`${DateCalendarWidget.name}.open: the feature is closed`);

				return null;
			}

			const {
				dialogId,
				dialogLocator,
				parentWidget = PageManager,
				preselectedDay = null,
				onDaySelected,
				// a caller that names no way of going away always gets the calendar it asked for:
				// the gate below is about an entry point that went away, not about the lack of one
				isOpeningRelevant = () => true,
			} = options;

			// the wait below is a part of what the user waits for, so it is inside the measure
			const point = new PerfPoint('IM Date Calendar Open', `dialog ${dialogId}`).start();

			try
			{
				await waitFor(OPEN_DELAY);

				// the tap that asked for the calendar and the leaving of the screen it was asked from
				// fit into one another easily, and the waits of this open are exactly where they
				// meet: a chat left behind, a search overlay cancelled. A sheet built past that
				// point would rise over the screen that came next, so the entry point is asked again
				// after every wait - raising the sheet included, because that wait is no shorter
				// than the two before it
				if (!isOpeningRelevant())
				{
					logger.log(`${DateCalendarWidget.name}.open: the opening is abandoned`);

					return null;
				}

				point.startPoint('Initial Date');
				const initialDate = await DateCalendarWidget.getInitialDate(dialogLocator, preselectedDay);
				point.endPoint('Initial Date');

				if (!isOpeningRelevant())
				{
					logger.log(`${DateCalendarWidget.name}.open: the opening is abandoned`);

					return null;
				}

				point.startPoint('Sheet Open');
				const widget = await new BottomSheet({
					titleParams: {
						text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_DATE_CALENDAR_TITLE'),
						type: 'dialog',
					},
					component: (layout) => new DateCalendarWidget({
						dialogId,
						initialDate,
						onDaySelected,
						sheetLayout: layout,
					}),
				})
					.setParentWidget(parentWidget)
					.setBackgroundColor(Color.bgContentPrimary.toHex())
					.setNavigationBarColor(Color.bgContentPrimary.toHex())
					.enableOnlyMediumPosition()
					.setMediumPositionHeight(SHEET_HEIGHT)
					// Android pages the months of the component VERTICALLY, and a swipe DOWN over the
					// content of a bottom sheet is always claimed by the sheet - measured on the device
					// with the content swipe both on and off, it never reaches the pager. So the gesture
					// can only ever page one way, and the month steps of the header are the way in both:
					// the content swipe is dropped whole, which also stops the sheet from closing itself
					// under a swipe over the grid.
					.disableContentSwipe()
					.disableHorizontalSwipe()
					.disableForceDismissOnSwipeDown()
					.open()
				;
				point.endPoint('Sheet Open');

				// an entry point left while the sheet was rising leaves the only case of the three
				// that cannot be closed by not building anything: the sheet is already on screen,
				// and the way to keep it off the next screen is to close it
				if (!isOpeningRelevant())
				{
					logger.log(`${DateCalendarWidget.name}.open: the opening is abandoned`);
					widget.close();

					return null;
				}

				// the sheet no longer takes a swipe over its content, so the way out is explicit
				widget.setRightButtons([
					{
						id: 'close',
						type: Icon.CROSS.getIconName(),
						callback: () => widget.close(),
					},
				]);

				return widget;
			}
			finally
			{
				point.end();
			}
		}

		/**
		 * Day the calendar opens on and with selected. The entry from the date separator names that
		 * day itself; the entry from the search panel has no day of its own, so the month of the
		 * visible part of the feed serves - today when the feed is empty or cannot be asked.
		 *
		 * @param {IDateCalendarDialogLocator} [dialogLocator]
		 * @param {DateNavigationDay|null} [preselectedDay]
		 * @return {Promise<Date>}
		 */
		static async getInitialDate(dialogLocator, preselectedDay = null)
		{
			// a day that is not a day would reach the native `initialDate` as NaN; the visible month
			// below is the same answer as the one given for no day at all
			if (DateCode.fromServerDay(preselectedDay) !== null)
			{
				return DateNavigationTimezone.fromServerDay(preselectedDay);
			}

			try
			{
				const view = dialogLocator?.get('view');
				const { messageList } = (await view?.getViewableMessages()) ?? {};

				return findVisibleMonth(messageList, dialogLocator) ?? new Date();
			}
			catch (error)
			{
				getLogger(LOGGER_KEY).error(`${DateCalendarWidget.name}.getInitialDate`, error);

				return new Date();
			}
		}

		/**
		 * Android animates the month switch and does NOT apply data given before the animation ends -
		 * the existing consumer of the component waits for exactly this reason. The contract says
		 * nothing about it, so the wait is kept on our side. It is also where the answer time of the
		 * markup is measured from: the animation is not a budget the client disposes of.
		 *
		 * @param {string} [platform]
		 * @return {number} milliseconds
		 */
		static getMonthSwitchDelay(platform = Application.getPlatform())
		{
			return platform === ANDROID_PLATFORM ? MONTH_SWITCH_ANIMATION_DURATION : 0;
		}

		/**
		 * Whether opening the calendar on a day is reported back as an ordinary selection.
		 *
		 * iOS SELECTS `initialDate` while mounting and reports it exactly as a tap
		 * (`JNCalendarView` -> `CalendarView.selectDate` -> `didSelectDate`). Android applies
		 * `initialDate` through the very same `setDate` that does report a selection, and stays
		 * silent for a reason of the layout and not of the calendar: the properties of an element
		 * are applied in the order they are declared in, on the ui thread and one by one, and
		 * `initialDate` is declared ahead of `onDateSelected` - so by the time that first selection
		 * is reported there is no callback bound to report it to. Waiting for an event the platform
		 * never sends would swallow the first tap on the day the calendar opened with - and the
		 * entry from the date separator opens on it.
		 *
		 * @param {string} [platform]
		 * @return {boolean}
		 */
		static reportsOpeningSelection(platform = Application.getPlatform())
		{
			return platform === IOS_PLATFORM;
		}

		/**
		 * Whether setting a date will reach the component at all.
		 *
		 * Outside the grid it holds, the component returns from `setDate` without moving and
		 * without reporting anything: iOS finds no cell for such a day (`CalendarView.setDate` ->
		 * `indexPathForDate`, the grid spans a hundred years each way from today), Android no page
		 * for such a year (`CalendarView.setDate` -> `CalendarAdapter.findPosition`, 1900..2100).
		 * Both ends are ordinary places to stand: the year picker of either platform reaches them.
		 *
		 * A month step that cannot move the grid must not pretend it did: without this the header
		 * named a month the grid never went to, the markup of that month was asked of the server
		 * for nobody to see, and every press left behind an expectation of a selection nobody was
		 * going to report. A tap on such a day is not swallowed by that expectation - both platforms
		 * keep the very same day untappable as well - but it outlives its reason all the same, and
		 * the two lies about the shown month are plain to see.
		 *
		 * @param {Date} date
		 * @param {string} [platform]
		 * @param {Date} [today]
		 * @return {boolean}
		 */
		static canSetDate(date, platform = Application.getPlatform(), today = new Date())
		{
			const year = date.getFullYear();

			if (platform === IOS_PLATFORM)
			{
				const currentYear = today.getFullYear();

				return year > currentYear - IOS_ADDRESSABLE_YEARS && year < currentYear + IOS_ADDRESSABLE_YEARS;
			}

			return year >= ANDROID_FIRST_ADDRESSABLE_YEAR && year <= ANDROID_LAST_ADDRESSABLE_YEAR;
		}

		/**
		 * @param {DateCalendarProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = { visibleMonth: props.initialDate };

			this.logger = getLogger(LOGGER_KEY);
			this.#service = new DateNavigationService(props.dialogId);

			// opening the calendar on a day reports the very same selection a tap does, so it is
			// awaited apart from the ordered sets below - and only where the platform reports it at
			// all (see reportsOpeningSelection). The first selection of any kind drops it, so even
			// a set that stayed silent cannot swallow a tap of the user later on.
			if (DateCalendarWidget.reportsOpeningSelection())
			{
				this.#expectedOpeningSelection = DateNavigationTimezone.toServerDay(props.initialDate);
			}
		}

		componentWillUnmount()
		{
			// a closed calendar has no shown month any more, so everything in flight - the markup of
			// the shown month and the warming behind it - is stale by the same counter that tells a
			// month left behind from the shown one
			this.#markupGeneration += 1;
			// the markup belongs to the opened calendar and outlives nothing
			this.#service.reset();
		}

		/**
		 * The header keeps a size of its own and the grid stays a sibling that cannot grow over it:
		 * `CalendarView` is a native view, and left without geometry on Android it spread across the
		 * header and swallowed every tap on it, while staying visible underneath.
		 *
		 * @return {object}
		 */
		render()
		{
			return View(
				{
					testId: TEST_ID,
					safeArea: { bottom: true },
					style: {
						flex: 1,
						flexDirection: 'column',
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				this.#renderHeader(),
				this.#renderCalendar(),
			);
		}

		/**
		 * `CalendarView` stays without a header of its own, so month steps and the year jump are
		 * drawn by the consumer.
		 *
		 * The month name is the one child that gives width up: the arrows are touch targets before
		 * they are labels - sized by HEADER_BUTTON_SIZE and pinned by `flexShrink: 0`, because a
		 * target that shrank would be missed by a tap a few pixels off. Pinned edges of one size
		 * are also what keeps the name centered between them.
		 *
		 * @return {object}
		 */
		#renderHeader()
		{
			return View(
				{
					testId: `${TEST_ID}-header`,
					style: {
						flexDirection: 'row',
						flexShrink: 0,
						alignItems: 'center',
						justifyContent: 'space-between',
						width: '100%',
						height: HEADER_HEIGHT,
						paddingHorizontal: HEADER_PADDING.toNumber(),
					},
				},
				this.#renderMonthStepButton(PREVIOUS_MONTH_STEP),
				Button({
					testId: `${TEST_ID}-year`,
					text: this.#getVisibleMonthTitle(),
					rightIcon: Icon.CHEVRON_DOWN,
					design: ButtonDesign.PLAIN,
					size: HEADER_BUTTON_SIZE,
					style: { flexShrink: 1 },
					onClick: this.showYearPicker,
				}),
				this.#renderMonthStepButton(NEXT_MONTH_STEP),
			);
		}

		/**
		 * @param {number} monthStep
		 * @return {object}
		 */
		#renderMonthStepButton(monthStep)
		{
			const isPrevious = monthStep === PREVIOUS_MONTH_STEP;

			return Button({
				testId: `${TEST_ID}-month-${isPrevious ? 'previous' : 'next'}`,
				leftIcon: isPrevious ? Icon.CHEVRON_TO_THE_LEFT : Icon.CHEVRON_TO_THE_RIGHT,
				design: ButtonDesign.PLAIN,
				size: HEADER_BUTTON_SIZE,
				style: { flexShrink: 0 },
				onClick: () => this.stepMonth(monthStep),
			});
		}

		/**
		 * @return {object}
		 */
		#renderCalendar()
		{
			return CalendarView({
				testId: `${TEST_ID}-grid`,
				initialDate: DateNavigationTimezone.toComponentTimestamp('initialDate', this.props.initialDate),
				firstWeekday: FIRST_WEEKDAY_MONDAY,
				showWeekNumbers: false,
				// a day of the disabled snapshot keeps none of this: the same accent of the current
				// day is repeated by DisabledDays for the day it hands over
				textStyle: {
					today: {
						textColor: Color.accentMainPrimary.toHex(),
					},
					todaySelected: {
						textColor: Color.baseWhiteFixed.toHex(),
						backgroundColor: Color.accentMainPrimary.toHex(),
					},
				},
				onMonthSwitched: this.onMonthSwitched,
				onDateSelected: this.onDateSelected,
				ref: this.bindCalendarRef,
			});
		}

		/**
		 * @return {string}
		 */
		#getVisibleMonthTitle()
		{
			const { visibleMonth } = this.state;
			const moment = Moment.createFromTimestamp(Math.round(visibleMonth.getTime() / MILLISECONDS_IN_SECOND));

			return `${capitalize(moment.format(STANDALONE_MONTH_NAME))} ${visibleMonth.getFullYear()}`;
		}

		/**
		 * `ref` callback of the calendar: nothing can be handed to the component before it is
		 * mounted, so the first markup starts from here.
		 *
		 * @param {CalendarViewProps} ref
		 * @return {Promise<void>}
		 */
		bindCalendarRef = (ref) => {
			this.#calendarRef = ref;
			// the sets were ordered from the component that has just gone, and a component that has
			// just arrived reports none of them: an expectation of its own outlives its component
			// no longer than the ref does
			this.#expectedSyntheticSelections = [];

			// the callback also arrives without a component - a calendar that is gone is not asked
			// for markup, and the server is not asked for it either
			if (!ref)
			{
				return Promise.resolve();
			}

			return this.#refreshMarkup(this.state.visibleMonth, { waitForAnimation: false });
		};

		/**
		 * A programmatic date set reports the same selection a tap does, and for us a selection
		 * means the feed jumps - so as many selections are swallowed as were ordered, and a pick of
		 * the user still wins over an unfinished one.
		 *
		 * Every ordered set is awaited on its own: the event comes back through the bridge, while
		 * two taps on a month step of the header do not wait for anything, so the second set is
		 * ordered before the event of the first one arrives.
		 *
		 * An expectation lives exactly as long as the component it was ordered from: it is raised
		 * only together with a set of a mounted calendar that can answer it (see canSetDate) and
		 * dropped whole when the ref changes. A limit by time instead would be worse than the case
		 * it closes: a tap of the user on the day a month switch is animating towards is swallowed,
		 * and the user taps again - while a synthetic event arriving after such a limit is taken for
		 * a tap, closes the sheet and takes the feed to the 1st of a month nobody asked for.
		 *
		 * The day is all the event carries - neither platform names the source, and the payload of
		 * a set and of a tap on that same day is byte for byte the same one - so a tap made while a
		 * set of the very same day is in flight is swallowed in its place and the set is taken for
		 * the tap. The outcome is the one the tap asked for, because both name one day: the feed
		 * goes to that day one bridge round later, and never anywhere else.
		 *
		 * @param {number} timestamp
		 */
		onDateSelected = (timestamp) => {
			const day = DateNavigationTimezone.toServerDay(
				DateNavigationTimezone.fromComponentTimestamp('onDateSelected', timestamp),
			);
			const expectedOpeningSelection = this.#expectedOpeningSelection;
			this.#expectedOpeningSelection = null;

			if (expectedOpeningSelection === day)
			{
				return;
			}

			const expectedIndex = this.#expectedSyntheticSelections.indexOf(day);

			if (expectedIndex !== -1)
			{
				this.#expectedSyntheticSelections.splice(expectedIndex, 1);

				return;
			}

			this.logger.log(`${this.constructor.name}.onDateSelected`, day);

			// the sheet covers the feed, and neither the first message of the day nor the highlighted
			// separator would be seen under it
			this.props.sheetLayout?.close();
			this.props.onDaySelected?.(day);
		};

		/**
		 * @param {number} timestamp
		 * @return {Promise<void>}
		 */
		onMonthSwitched = (timestamp) => {
			const visibleMonth = DateNavigationTimezone.fromComponentTimestamp('onMonthSwitched', timestamp);

			return this.#showMonth(visibleMonth);
		};

		showYearPicker = () => {
			// a repeated call while the picker is open is ignored by the component itself, and its
			// confirmation comes back as an ordinary month switch without picking a day
			this.#calendarRef?.showYearPicker();
		};

		/**
		 * Explicit month step. The gesture alone does not reach the past on Android: the component
		 * pages the months vertically, and a swipe down inside a bottom sheet is read by the sheet.
		 *
		 * @param {number} monthStep - months to move by, negative for the past
		 * @return {Promise<void>}
		 */
		stepMonth = (monthStep) => {
			const { visibleMonth } = this.state;
			const target = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + monthStep, 1);

			// a step the grid does not take is not a step: the shown month of the header, the markup
			// asked for and the grid on screen all name one month or the header starts lying
			if (!this.#setViewMonthProgrammatically(target))
			{
				return Promise.resolve();
			}

			return this.#showMonth(target);
		};

		/**
		 * @param {Date} date
		 * @return {boolean} whether the component was given the date
		 */
		#setViewMonthProgrammatically(date)
		{
			// the expectation and the set that answers it are ordered together or not at all: a
			// calendar that is not mounted, and a month outside the grid the component holds, report
			// nothing - and an expectation left without its own event would swallow the first real
			// tap on that very day
			if (!this.#calendarRef || !DateCalendarWidget.canSetDate(date))
			{
				return false;
			}

			this.#expectedSyntheticSelections.push(DateNavigationTimezone.toServerDay(date));
			this.#calendarRef.setDate(DateNavigationTimezone.toComponentTimestamp('setDate', date), true);

			return true;
		}

		/**
		 * @param {Date} visibleMonth
		 * @return {Promise<void>}
		 */
		#showMonth(visibleMonth)
		{
			this.setState({ visibleMonth });

			return this.#refreshMarkup(visibleMonth, { waitForAnimation: true });
		}

		/**
		 * Markup of one shown month: the month itself first, and the months ahead of it only after
		 * it is drawn - the user waits for the shown month alone.
		 *
		 * @param {Date} visibleMonth
		 * @param {{ waitForAnimation: boolean }} options
		 * @return {Promise<void>}
		 */
		async #refreshMarkup(visibleMonth, { waitForAnimation })
		{
			this.#markupGeneration += 1;
			const generation = this.#markupGeneration;
			const delay = waitForAnimation ? DateCalendarWidget.getMonthSwitchDelay() : 0;

			if (delay > 0)
			{
				await waitFor(delay);

				if (generation !== this.#markupGeneration)
				{
					return;
				}
			}

			if (await this.#loadShownMonth(visibleMonth, generation))
			{
				await this.#warmMonthsAhead(visibleMonth, generation);
			}
		}

		/**
		 * The snapshot is applied twice on purpose: the first one bans the future before the server
		 * answers, the second one adds what the answer told.
		 *
		 * @param {Date} visibleMonth
		 * @param {number} generation
		 * @return {Promise<boolean>} whether the shown month is marked up
		 */
		async #loadShownMonth(visibleMonth, generation)
		{
			const month = DateNavigationTimezone.toServerMonth(visibleMonth);
			// the animation is not a budget the client disposes of, so the measure starts after it
			const point = new PerfPoint('IM Date Calendar Markup', `month ${month}`).start();

			try
			{
				this.#applyDisabledDays(visibleMonth);

				point.startPoint('Month Load');
				const source = this.#service.isMonthLoaded(month) ? 'cache' : 'server';
				const result = await this.#service.loadMonth(month);
				point.endPoint('Month Load', { source, status: result.status });

				// fast paging must not pile requests up: a month left behind never overwrites the shown one
				if (generation !== this.#markupGeneration)
				{
					return false;
				}

				// the markup of a closed calendar is dropped by the service, and only its own
				// generation moves - a cancelled answer belongs to a calendar that is gone
				if (result.status === DateNavigationStatus.cancelled)
				{
					return false;
				}

				if (result.status === DateNavigationStatus.error)
				{
					this.logger.error(`${this.constructor.name}.loadShownMonth: markup is not loaded`, result.errorCode);

					return false;
				}

				this.#applyDisabledDays(visibleMonth);

				return true;
			}
			catch (error)
			{
				// the markup is refreshed from native callbacks, and nobody there awaits the promise
				this.logger.error(`${this.constructor.name}.loadShownMonth`, error);

				return false;
			}
			finally
			{
				point.end();
			}
		}

		/**
		 * Warms the months the user is about to page into, and it is nobody's wait: the shown month
		 * is marked up before this starts, and the measure above is already closed.
		 *
		 * One window carries a month together with the one before it, so asking for the second month
		 * ahead closes the first one on the way. Paging back has never waited for the network for
		 * that very reason; now paging forward waits once per pair instead of once per step, and the
		 * tail of the next month drawn by the grid stops staying unmarked.
		 *
		 * @param {Date} visibleMonth
		 * @param {number} generation
		 * @return {Promise<void>}
		 */
		async #warmMonthsAhead(visibleMonth, generation)
		{
			// a warming that asks for nothing leaves no measure behind, and that is the usual calendar:
			// opened on the current month, it has nothing ahead of it to warm
			let point = null;

			try
			{
				const month = this.#getMonthToWarm(visibleMonth);

				if (month === null || this.#service.isMonthLoaded(month))
				{
					return;
				}

				// measured apart from the shown month, and never inside it: on the timeline this is the
				// request that shares the network with the month the user does wait for
				point = new PerfPoint('IM Date Calendar Warm', `month ${month}`).start();
				point.startPoint('Warm Load');

				const result = await this.#service.loadMonth(month);
				point.endPoint('Warm Load', { status: result.status });

				if (result.status === DateNavigationStatus.error)
				{
					this.logger.error(
						`${this.constructor.name}.warmMonthsAhead: ${month} is not warmed`,
						result.errorCode,
					);

					return;
				}

				// the grid owes a redraw only while it shows what it showed when the warming started:
				// an answer to a month left behind, and an answer to a calendar that is gone
				// (cancelled by the service on reset), change nothing on screen
				if (generation !== this.#markupGeneration || result.status !== DateNavigationStatus.success)
				{
					return;
				}

				this.#applyDisabledDays(visibleMonth);
			}
			catch (error)
			{
				// nobody awaits this promise either, and the user is not waiting for the warming at
				// all - a refusal here must stay a line in the log and nothing more
				this.logger.error(`${this.constructor.name}.warmMonthsAhead`, error);
			}
			finally
			{
				point?.end();
			}
		}

		/**
		 * The month to ask for ahead of the shown one: the second one when the history reaches it,
		 * the first one otherwise, and none at all when the history ends on the shown month - which
		 * is why a calendar opened on the current month, the usual case, warms nothing.
		 *
		 * The history has a start as well, and a jump by the year picker lands behind it easily:
		 * months before the first message carry nothing to warm, and asking for them would spend a
		 * request on an answer known in advance.
		 *
		 * @param {Date} visibleMonth
		 * @return {DateNavigationMonth|null}
		 */
		#getMonthToWarm(visibleMonth)
		{
			const { firstAvailableDate, boundariesKnown } = this.#service.getHistoryBoundaries();

			// an opening whose first answer never came knows neither the end of the history nor
			// whether the network is there at all, and guessing the months to warm is not the way
			// to find out
			if (!boundariesKnown)
			{
				return null;
			}

			const lastMonth = this.#getLastMonthOfHistory();
			// `Y-m-d` and `Y-m` are zero padded, so the month of a day is its own first seven characters
			const firstMonth = firstAvailableDate === null ? null : firstAvailableDate.slice(0, MONTH_KEY_LENGTH);

			for (let ahead = MONTHS_WARMED_AHEAD; ahead > 0; ahead--)
			{
				const month = DateNavigationTimezone.toServerMonth(
					new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + ahead, 1),
				);

				// the months are `Y-m` keys, so comparing the strings compares the months
				if (month <= lastMonth && (firstMonth === null || month >= firstMonth))
				{
					return month;
				}
			}

			return null;
		}

		/**
		 * The month the last message of the chat falls into, and never later than the current one:
		 * a chat whose history ends years ago has nothing to warm past that, and a chat answered
		 * without a last day at all has nothing past today.
		 *
		 * @return {DateNavigationMonth}
		 */
		#getLastMonthOfHistory()
		{
			const { lastAvailableDate } = this.#service.getHistoryBoundaries();
			const currentMonth = DateNavigationTimezone.toServerMonth(new Date());
			const lastMonth = lastAvailableDate === null
				? currentMonth
				: DateNavigationTimezone.toServerMonth(DateNavigationTimezone.fromServerDay(lastAvailableDate));

			return lastMonth < currentMonth ? lastMonth : currentMonth;
		}

		/**
		 * @param {Date} visibleMonth
		 */
		#applyDisabledDays(visibleMonth)
		{
			this.#calendarRef?.setDisabledDates(DisabledDays.buildSnapshot(visibleMonth, this.#service));
		}
	}

	module.exports = { DateCalendarWidget };
});
