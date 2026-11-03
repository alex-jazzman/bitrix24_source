/**
 * @module im/messenger/controller/dialog/lib/date-calendar/src/search-entry
 */
jn.define('im/messenger/controller/dialog/lib/date-calendar/src/search-entry', (require, exports, module) => {
	const ENTRY_ID = 'date-navigation';
	const BUTTON_TEST_ID = 'dialog-date-calendar-search-btn';

	const isPhraseTranslated = (phrase) => (phrase ?? '').trim() !== '';

	/**
	 * Entry point of the calendar inside the chat search: the button of the right slot of the search
	 * bar, and nothing else. The pinned row of the result list that used to stand in for the button
	 * is gone - see the note on the platforms below.
	 *
	 * The slot is not the same on the two platforms, and the difference belongs to the native side.
	 * Android puts the button in a container of its own, to the right of the clear cross, so it
	 * stays whatever the field holds. iOS hands it the `rightView` of the text field, which the
	 * clear cross shares: `JNSearchController.updateRightButtonVisibility` gives the slot to the
	 * cross as soon as the field has something to clear. So on iOS a field with text has no entry
	 * to the calendar in this panel - and the chat search restores the query of the previous visit,
	 * which is an ordinary way to arrive in that state. The row used to cover exactly this case.
	 * The way out is a slot of its own on iOS, on the native side; until then the date separator of
	 * the feed is the entry point that stays.
	 *
	 * @class DateCalendarSearchEntry
	 */
	class DateCalendarSearchEntry
	{
		/**
		 * Name of the entry point the click of the button comes back under.
		 *
		 * @return {string}
		 */
		static get id()
		{
			return ENTRY_ID;
		}

		/**
		 * Button of the search bar, or null where there is nothing to build one from - the same null
		 * that removes a button already set.
		 *
		 * The phrase is required though the button draws itself with an icon: without it a screen
		 * reader gets no name for the button on Android and an untranslated asset name on iOS, where
		 * UIKit falls back to one.
		 *
		 * @param {{ isEnabled: boolean, isButtonSupported: boolean, iconName: string, accessibilityText: string }} options
		 * @return {?DateCalendarSearchButton}
		 */
		static createButton({ isEnabled, isButtonSupported, iconName, accessibilityText })
		{
			if (!isEnabled || !isButtonSupported || !isPhraseTranslated(accessibilityText))
			{
				return null;
			}

			return {
				id: ENTRY_ID,
				type: iconName,
				// iOS only: on Android the field shares its channel with the accessibility label
				testId: BUTTON_TEST_ID,
				accessibilityText,
			};
		}

		/**
		 * Both platforms report the click with one flat object naming the button, so the payload is
		 * read as it comes.
		 *
		 * @param {{ id?: string }} payload
		 * @return {boolean}
		 */
		static isButtonClick(payload)
		{
			return payload?.id === ENTRY_ID;
		}
	}

	module.exports = { DateCalendarSearchEntry };
});
