/**
 * @module im/messenger/controller/dialog/lib/date-calendar/src/jump
 */
jn.define('im/messenger/controller/dialog/lib/date-calendar/src/jump', (require, exports, module) => {
	const { PerfPoint } = require('debug/prism');
	const { AfterScrollMessagePosition } = require('im/messenger/view/dialog');
	const { Loc } = require('im/messenger/loc');
	const { ErrorType } = require('im/messenger/const');
	const { getLogger } = require('im/messenger/lib/logger');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const {
		DateCode,
		DateNavigationErrorCode,
		DateNavigationService,
		DateNavigationStatus,
	} = require('im/messenger/lib/date-navigation');

	const LOGGER_KEY = 'dialog-date-calendar';
	/** Name the jump of a dialog is registered in the locator of that dialog under. */
	const DIALOG_LOCATOR_KEY = 'date-calendar-jump';

	const DateJumpStatus = Object.freeze({
		success: 'success',
		cancelled: 'cancelled',
		error: 'error',
	});

	/**
	 * What the loading of the context of a day ended with. A context that never arrived and an
	 * attempt the user has left behind look alike from the feed - the message of the day is simply
	 * not there - and mean the opposite to the user: the first one is worth a toast, the second one
	 * must stay silent.
	 */
	const ContextOutcome = Object.freeze({
		reached: 'reached',
		notReached: 'notReached',
		superseded: 'superseded',
	});

	/**
	 * Why the feed has not moved. The day without messages and the request that never reached the
	 * server are different answers to the user: the first one is final, the second one is worth
	 * repeating.
	 */
	const DateJumpFailure = Object.freeze({
		noMessages: 'noMessages',
		connection: 'connection',
		unknown: 'unknown',
	});

	/**
	 * @param {DateNavigationErrorCodeValue} errorCode
	 * @return {string}
	 */
	const getFailure = (errorCode) => {
		if (errorCode === DateNavigationErrorCode.messageNotFound)
		{
			return DateJumpFailure.noMessages;
		}

		// a request that never reached the server carries the code the transport puts in place of the
		// answer, and a bare rejection carries no code at all
		if (errorCode === ErrorType.networkError || errorCode === null || errorCode === undefined)
		{
			return DateJumpFailure.connection;
		}

		return DateJumpFailure.unknown;
	};

	/**
	 * Jump of the feed to a picked day: the day is resolved into the first message of it, the feed
	 * goes to that message through the very path a search result goes, and the date separator above
	 * it gets highlighted.
	 *
	 * The jump outlives the calendar it was started from - the widget closes itself the moment a day
	 * is picked - so it lives next to the entry point and not inside the widget.
	 *
	 * ONE jump serves the whole dialog and both of its entry points, the chat search and the date
	 * separator: they move the very same feed, and only a shared sequence of attempts lets the day
	 * picked last be the day the feed stays on. The entry point therefore belongs to the attempt and
	 * not to the jump.
	 *
	 * Attempts are NOT held for one another: a pick made to wait out the load of the pick before it
	 * would leave the last wish of the user blocked on a load nobody needs any more. An overtaken
	 * context is turned down by `ContextManager` itself; the highlight of the separator is the only
	 * mutation this jump makes past the manager, and the two counters below are what keep it off a
	 * feed that has moved on.
	 *
	 * @class DateCalendarJump
	 */
	class DateCalendarJump
	{
		#dialogId;
		#dialogLocator;
		#service;
		#logger;
		#generation = 0;
		#destroyed = false;

		/**
		 * The jump of the dialog: built on the first ask and kept in the locator of that dialog next
		 * to the managers it moves.
		 *
		 * @param {DateCalendarJumpOptions} options
		 * @return {DateCalendarJump}
		 */
		static forDialog({ dialogId, dialogLocator })
		{
			const registered = dialogLocator?.get(DIALOG_LOCATOR_KEY);
			if (registered)
			{
				return registered;
			}

			const jump = new DateCalendarJump({ dialogId, dialogLocator });
			dialogLocator?.add(DIALOG_LOCATOR_KEY, jump);

			return jump;
		}

		/**
		 * @param {DateCalendarJumpOptions} options
		 */
		constructor({ dialogId, dialogLocator })
		{
			this.#dialogId = dialogId;
			this.#dialogLocator = dialogLocator;
			this.#service = new DateNavigationService(dialogId);
			this.#logger = getLogger(LOGGER_KEY);
		}

		/**
		 * @param {DateNavigationDay} day
		 * @param {DateCalendarJumpAttempt} [attempt] - where the day was picked from; a repeat
		 * offered by a failed jump belongs to the same entry point as the attempt it repeats
		 * @return {Promise<DateCalendarJumpResult>}
		 */
		async goToDate(day, attempt = {})
		{
			// the dialog of the jump is closed: there is no feed to move and no screen to report to,
			// and a repeat offered by a toast raised before the close arrives exactly here
			if (this.#destroyed)
			{
				return { status: DateJumpStatus.cancelled, failure: null };
			}

			this.#reportAttempt(day, attempt);

			// a picked day supersedes the day picked before it, and the whole sequence of the jump
			// belongs to the pick: an answer left behind must move neither the feed nor the highlight
			this.#generation += 1;
			const generation = this.#generation;
			// ... and a jump of any other kind supersedes the picked day just as much: the day is
			// resolved over the network, and the user is free to go to a search result or a pinned
			// message meanwhile. Only the manager below sees every such move
			const navigation = this.#watchNavigation();
			const point = new PerfPoint('IM Date Calendar Jump', `dialog ${this.#dialogId}`).start();

			try
			{
				point.startPoint('Resolve Date');
				const { status, errorCode, resolvedDate } = await this.#service.resolveDate(day);
				point.endPoint('Resolve Date', { status });

				if (
					status === DateNavigationStatus.cancelled
					|| this.#isStale(generation)
					|| navigation.isSuperseded()
				)
				{
					return { status: DateJumpStatus.cancelled, failure: null };
				}

				if (status !== DateNavigationStatus.success)
				{
					return this.#fail(day, attempt, getFailure(errorCode), errorCode);
				}

				// the day of the answer is read strictly further down, and its message has to be read
				// just as strictly: the feed is asked for exactly this identifier
				const messageId = Number(resolvedDate?.messageId);
				if (!Number.isInteger(messageId) || messageId <= 0)
				{
					return this.#fail(day, attempt, DateJumpFailure.unknown, resolvedDate);
				}

				const outcome = await this.#goToResolvedDate(
					{ messageId, date: resolvedDate.date },
					{ generation, navigation },
					point,
				);

				if (this.#isStale(generation) || outcome === ContextOutcome.superseded)
				{
					return { status: DateJumpStatus.cancelled, failure: null };
				}

				if (outcome !== ContextOutcome.reached)
				{
					// the day was resolved and the feed still does not carry its message: the context
					// never arrived. Why it did not stays behind `ContextManager`, so the outcome is
					// not called a lost connection - a toast about the network on a working network
					// is a wrong answer of its own
					return this.#fail(day, attempt, DateJumpFailure.unknown, messageId);
				}

				return { status: DateJumpStatus.success, failure: null };
			}
			catch (error)
			{
				// the very last path able to speak up on behalf of an attempt nobody waits for any
				// more: a move made in the meantime, or the dialog closed under it
				if (this.#isStale(generation) || navigation.isSuperseded())
				{
					return { status: DateJumpStatus.cancelled, failure: null };
				}

				return this.#fail(day, attempt, DateJumpFailure.unknown, error);
			}
			finally
			{
				point.end();
			}
		}

		/**
		 * Stops the jump for good: the dialog it moves is gone. The generation moves, so an attempt
		 * still in flight - waiting for the resolution of a day or for the context of it - finds
		 * itself left behind at the next check and ends where it stands: no context is asked for, no
		 * highlight is drawn and no toast is raised over the screen that came next.
		 *
		 * Called at the teardown of the dialog and not at the closing of the calendar: the jump
		 * outlives the calendar on purpose, the widget closes itself the moment a day is picked.
		 */
		destructor()
		{
			this.#destroyed = true;
			this.#generation += 1;
		}

		/**
		 * Whether the dialog this jump belongs to is gone. The jump lives exactly as long as that
		 * dialog does and is torn down together with it, so it is also what anything slower than a
		 * screen - the opening of the calendar above all - asks whether it still has a dialog to
		 * open over.
		 *
		 * @return {boolean}
		 */
		get isDestroyed()
		{
			return this.#destroyed;
		}

		/**
		 * @return {ContextManager|null}
		 */
		get #contextManager()
		{
			return this.#dialogLocator?.get('context-manager') ?? null;
		}

		/**
		 * @return {DialogView|null}
		 */
		get #view()
		{
			return this.#dialogLocator?.get('view') ?? null;
		}

		/**
		 * @return {MessageRenderer|null}
		 */
		get #messageRenderer()
		{
			return this.#dialogLocator?.get('message-renderer') ?? null;
		}

		/**
		 * The whole day is NOT loaded at once: the context of the first message arrives by the
		 * ordinary paging of the feed.
		 *
		 * @param {DateNavigationResolvedDate} resolvedDate - the day the server resolved the pick to;
		 * it differs from the picked one whenever the picked day carries no messages, and the
		 * server falls forward to the nearest day that does - an ordinary outcome for a day of a
		 * month whose markup has not arrived, since such days stay pickable by the very design of
		 * the snapshot
		 * @param {{ generation: number, navigation: DateCalendarNavigationWatch }} attemptState
		 * @param {PerfPoint} point
		 * @return {Promise<DateCalendarContextOutcomeValue>}
		 */
		async #goToResolvedDate({ messageId, date }, { generation, navigation }, point)
		{
			point.startPoint('Message Context');
			const goingToContext = this.#contextManager?.goToMessageContext({
				dialogId: this.#dialogId,
				messageId,
				// the separator above the message is what gets highlighted, and which row that is
				// can only be told once the context of the day is rendered
				withMessageHighlight: false,
				targetMessagePosition: AfterScrollMessagePosition.top,
			});
			// our own move counts in that sequence as well, and the manager counts it before the
			// first await of its own - so the reading right here is the one it gave to this very
			// call, and anything past it belongs to somebody else
			navigation.accept();
			await goingToContext;
			point.endPoint('Message Context', { messageId });

			// an ordinary jump - a search result, a quotation, a pinned message - aborts the loading
			// of our context on its way through the same manager, and the feed then rightfully shows
			// the target of that jump. Nothing is broken here, so this must not look like a failure
			if (navigation.isSuperseded())
			{
				return ContextOutcome.superseded;
			}

			// `goToMessageContext` answers nothing at all: a context that failed to load is swallowed
			// together with its error, and the feed is left where it was. The message in the feed is
			// the only honest sign that the jump has happened
			if (!this.#isRendered(messageId))
			{
				return ContextOutcome.notReached;
			}

			if (this.#isStale(generation))
			{
				return ContextOutcome.reached;
			}

			const separatorId = DateCode.toSeparatorId(date);
			if (separatorId === null || !this.#isRendered(separatorId))
			{
				// the topmost row of a loaded window carries no separator of its own; then the first
				// message of the day is highlighted instead, and the jump stays correct
				this.#view?.highlightMessageById(messageId);

				return ContextOutcome.reached;
			}

			// the separator sits ABOVE the message the feed has just been scrolled to, so it takes a
			// scroll of its own to become visible; the highlight waits for the end of that scroll,
			// because a highlight of a row the feed has not drawn yet is lost without a word
			point.startPoint('Separator Scroll');
			await this.#view?.scrollToMessageById(
				separatorId,
				true,
				() => {
					// the scroll ends later than the pick that asked for it, and by then the feed can
					// already belong to a newer one: a mark left over it reads as a jump that happened
					if (!this.#isStale(generation) && !navigation.isSuperseded())
					{
						this.#view?.highlightMessageById(separatorId);
					}
				},
				AfterScrollMessagePosition.top,
			);
			point.endPoint('Separator Scroll');

			return ContextOutcome.reached;
		}

		/**
		 * A date separator is a template row of the feed, so the index of the rendered messages -
		 * the one the jump by a message id is checked against - does not know it at all. The
		 * collection of the drawn rows knows both, so the message of the day and the separator above
		 * it are looked up alike.
		 *
		 * @param {string|number} rowId
		 * @return {boolean}
		 */
		#isRendered(rowId)
		{
			return Boolean(this.#messageRenderer?.viewMessageCollection?.[rowId]);
		}

		/**
		 * @param {number} generation
		 * @return {boolean}
		 */
		#isStale(generation)
		{
			return generation !== this.#generation;
		}

		/**
		 * Watch over the moves of the feed made past this jump. Coordination of "the last move wins"
		 * cannot live inside the jump alone: a search result, a quotation, a pinned message and a
		 * link all take the feed away through `ContextManager` and know nothing of a picked day,
		 * while an answer of the date arriving late would take the feed back and undo a newer wish
		 * of the user. The manager is the only place that sees every move, and the counter it keeps
		 * is what makes those moves visible from here.
		 *
		 * A manager that leaves the locator under an attempt already in flight reads as superseded as
		 * well, and rightly so: there is no feed left to move and nothing to report about.
		 *
		 * @return {DateCalendarNavigationWatch}
		 */
		#watchNavigation()
		{
			const read = () => this.#contextManager?.navigationSequence ?? null;
			let seen = read();

			return {
				isSuperseded: () => read() !== seen,
				accept: () => {
					seen = read();
				},
			};
		}

		/**
		 * The event goes at the start of the jump, so it counts attempts and not hits; a repeat
		 * offered by a failed jump is an attempt of its own. A metric must never stop the navigation.
		 *
		 * @param {DateNavigationDay} day
		 * @param {DateCalendarJumpAttempt} attempt
		 */
		#reportAttempt(day, { entryPoint = null, analytics = null } = {})
		{
			try
			{
				analytics?.sendGoToDateEvent({ entryPoint, day });
			}
			catch (error)
			{
				this.#logger.error(`${this.constructor.name}.goToDate: the event is not sent`, error);
			}
		}

		/**
		 * The single place a failed jump is reported from: an empty feed is not an outcome.
		 *
		 * @param {DateNavigationDay} day
		 * @param {DateCalendarJumpAttempt} attempt
		 * @param {string} failure
		 * @param {unknown} detail
		 * @return {DateCalendarJumpResult}
		 */
		#fail(day, attempt, failure, detail)
		{
			this.#logger.error(`${this.constructor.name}.goToDate: ${day} is not reached`, failure, detail);
			this.#notify(day, attempt, failure);

			return { status: DateJumpStatus.error, failure };
		}

		/**
		 * A silent failure would look like a feed that ignores the pick, so every outcome ends in a
		 * toast. A day without messages is a final answer and offers nothing; a request that never
		 * left and an unknown refusal are worth repeating.
		 *
		 * @param {DateNavigationDay} day
		 * @param {DateCalendarJumpAttempt} attempt
		 * @param {string} failure
		 */
		#notify(day, attempt, failure)
		{
			if (failure === DateJumpFailure.noMessages)
			{
				Notification.showToastWithParams({
					message: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_DATE_CALENDAR_ERROR_NO_MESSAGES'),
				});

				return;
			}

			const retry = {
				buttonText: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_DATE_CALENDAR_ERROR_RETRY'),
				onButtonTap: () => {
					void this.goToDate(day, attempt);
				},
			};

			if (failure === DateJumpFailure.connection)
			{
				// the offline toast carries the wording and the icon of the whole application
				Notification.showOfflineToast(retry);

				return;
			}

			Notification.showErrorToast({
				message: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_DATE_CALENDAR_ERROR_UNKNOWN'),
				...retry,
			});
		}
	}

	module.exports = { DateCalendarJump, DateJumpStatus, DateJumpFailure, DIALOG_LOCATOR_KEY };
});
