/**
 * @module im/messenger/controller/dialog/lib/date-calendar/src/search-show
 */
jn.define('im/messenger/controller/dialog/lib/date-calendar/src/search-show', (require, exports, module) => {
	/**
	 * One showing of the search panel over a dialog, counted so that an opening of the calendar
	 * outlives it no longer than the panel itself.
	 *
	 * The opening of the calendar waits before it builds anything, and the overlay closed in the
	 * meantime leaves the dialog behind it alive - the panel covers the feed, it does not own it.
	 * So the liveness of the dialog cannot tell an opening asked for inside a showing that is over
	 * from one asked for right now, and the number of the showing can.
	 *
	 * @class DateCalendarSearchShow
	 */
	class DateCalendarSearchShow
	{
		#generation = 0;

		/**
		 * The showing is over and everything started inside it is abandoned. Answers the hiding of
		 * the overlay, whichever way it was closed: the cancel button, the back gesture, the panel
		 * closing itself to uncover the feed for a picked day.
		 */
		end()
		{
			this.#generation += 1;
		}

		/**
		 * Reading of the showing taken by one opening of the calendar: it answers `true` while the
		 * showing it was taken in is the one going on.
		 *
		 * A showing that ended never comes back - the panel shown again is a showing of its own - so
		 * an opening left behind by a closed overlay stays left behind, and an opening started in
		 * the new showing is not touched by the number of the old one.
		 *
		 * @return {function(): boolean}
		 */
		watch()
		{
			const generation = this.#generation;

			return () => generation === this.#generation;
		}
	}

	module.exports = { DateCalendarSearchShow };
});
