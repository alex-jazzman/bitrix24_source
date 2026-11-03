/**
 * Markup of the opened calendar the snapshot of the unavailable days is built from. Answered by
 * `DateNavigationService`; declared as an interface so that the snapshot stays testable apart from
 * the transport.
 */
declare interface IDateNavigationMarkup {
	isDayActive(day: DateNavigationDay): boolean;

	isMonthLoaded(month: DateNavigationMonth): boolean;

	getHistoryBoundaries(): DateNavigationBoundaries;
}

declare type DateCalendarOpenOptions = {
	dialogId: string,
	dialogLocator?: IDateCalendarDialogLocator,
	/** Widget the sheet of the calendar is opened over. */
	parentWidget?: PageManager,
	/** Day the calendar opens with selected; the entry from the date separator names it. */
	preselectedDay?: DateNavigationDay | null,
	/**
	 * Whether the sheet still has where to open: the open waits twice before it builds anything,
	 * and a screen left in the meantime must get no sheet over the one that came after it.
	 *
	 * Both entry points ask the jump of their dialog about the chat itself, see
	 * `DateCalendarJump.isDestroyed`; the entry from the search panel adds the showing of that
	 * panel, which ends with an overlay the user closed while the dialog behind it stays alive, see
	 * `DateCalendarSearchShow`.
	 */
	isOpeningRelevant?: () => boolean,
	onDaySelected?: (day: DateNavigationDay) => void,
}

declare type DateCalendarProps = {
	dialogId: string,
	/**
	 * Day the calendar opens on and with selected: the day of the tapped date separator, otherwise
	 * the month of the visible part of the feed, otherwise today.
	 */
	initialDate: Date,
	/** Layout of the sheet the calendar is drawn on; the picked day closes it. */
	sheetLayout?: PageManager,
	onDaySelected?: (day: DateNavigationDay) => void,
}

declare type DateCalendarSeparatorEntryOptions = {
	/** Opens the calendar with the day of the tapped separator selected. */
	openCalendar: (day: DateNavigationDay) => void,
}

declare type DateCalendarState = {
	/** Month the calendar shows right now: the header reads it, the snapshot is built around it. */
	visibleMonth: Date,
}

/** Only the part of the dialog locator the calendar asks for. */
declare interface IDateCalendarDialogLocator {
	get(name: string): unknown;

	/** Keeps the jump of the dialog, see `DateCalendarJump.forDialog`. */
	add(name: string, service: unknown): unknown;
}

/** Emitter of the go-to-date event; the jump asks it for nothing else. */
declare interface IDateCalendarJumpAnalytics {
	sendGoToDateEvent(params: { entryPoint: string, day: DateNavigationDay }): void;
}

declare type DateCalendarJumpOptions = {
	dialogId: string,
	/**
	 * Answers `context-manager`, `view` and `message-renderer` of the dialog the jump moves, and
	 * keeps the jump itself: one jump per dialog, shared by both entry points.
	 */
	dialogLocator: IDateCalendarDialogLocator,
}

/** One pick of a day: the same dialog is reached from two entry points, one attempt at a time. */
declare type DateCalendarJumpAttempt = {
	/** Entry point the day was picked from; a parameter of the go-to-date event. */
	entryPoint?: string | null,
	analytics?: IDateCalendarJumpAnalytics | null,
}

declare type DateCalendarJumpStatusValue = 'success' | 'cancelled' | 'error';

/** How the loading of the context of a day ended; internal to the jump. */
declare type DateCalendarContextOutcomeValue = 'reached' | 'notReached' | 'superseded';

/**
 * Reading of the navigation counter of the shared `ContextManager`, taken by one attempt of the
 * jump: `isSuperseded` tells whether the feed has been taken somewhere else since the reading, and
 * `accept` moves the reading onto the move the attempt has just made itself.
 */
declare interface DateCalendarNavigationWatch {
	isSuperseded(): boolean;

	accept(): void;
}

/** Why the feed has not moved; null when it has. */
declare type DateCalendarJumpFailureValue = 'noMessages' | 'connection' | 'unknown' | null;

declare type DateCalendarJumpResult = {
	status: DateCalendarJumpStatusValue,
	failure: DateCalendarJumpFailureValue,
}

/** Button of the search bar the calendar is opened from where the build carries one. */
declare type DateCalendarSearchButton = {
	id: string,
	/** Icon name of the registry the widget navigation bar buttons use. */
	type: string,
	/** iOS only, see JNWidgetSearchRightButton. */
	testId: string,
	accessibilityText: string,
}
