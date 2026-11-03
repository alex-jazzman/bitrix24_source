/**
 * @module more-menu/block/company/bitrix-answers/screen/src/bridge
 */
jn.define('more-menu/block/company/bitrix-answers/screen/src/bridge', (require, exports, module) => {
	const { Type } = require('type');
	const {
		AnswersScreenEvent,
		MAX_TITLE_LENGTH,
	} = require('more-menu/block/company/bitrix-answers/screen/src/const');

	// Only what the page is allowed to say. The names the screen sends back are deliberately out: an event
	// of the app coming from the web is not part of the contract.
	const INCOMING_EVENTS = Object.freeze([
		AnswersScreenEvent.PAGE_READY,
		AnswersScreenEvent.TITLE_SET,
		AnswersScreenEvent.TITLE_RESET,
		AnswersScreenEvent.SEARCH_SHOW,
		AnswersScreenEvent.SEARCH_HIDE,
		AnswersScreenEvent.SEARCH_COLLAPSE,
		AnswersScreenEvent.SUPPORT_OPEN,
		AnswersScreenEvent.CHAT_OPEN,
		AnswersScreenEvent.NAV_STATE,
	]);

	const EMPTY_PAYLOAD = Object.freeze({});

	function readNameFrom(source)
	{
		if (!Type.isPlainObject(source))
		{
			return '';
		}

		const name = source.eventType || source.type || source.name;

		return Type.isStringFilled(name) ? name : '';
	}

	function readEventName(event)
	{
		return readNameFrom(event) || readNameFrom(event.data) || readNameFrom(event.params);
	}

	function readEventData(event)
	{
		if (Type.isPlainObject(event.data))
		{
			return event.data;
		}

		if (Type.isPlainObject(event.params))
		{
			return event.params;
		}

		return {};
	}

	function validateFor(name, data)
	{
		switch (name)
		{
			case AnswersScreenEvent.TITLE_SET:
				return Type.isStringFilled(data.text) && data.text.length <= MAX_TITLE_LENGTH
					? { text: data.text }
					: null;

			case AnswersScreenEvent.SEARCH_SHOW:
				return { value: Type.isStringFilled(data.value) ? data.value : '' };

			case AnswersScreenEvent.NAV_STATE:
				return { canGoBack: data.canGoBack === true };

			default:
				// The rest of the contract carries no payload, and whatever the page put next to the name
				// is dropped here: support and the chat open with the values of the server, never with an
				// address or a bot the web named.
				return EMPTY_PAYLOAD;
		}
	}

	/**
	 * @param {*} event as the web view hands it over, in any of the forms the page sends it
	 * @return {?{ name: string, payload: object }} null when the event is outside the contract
	 */
	function parseIncoming(event)
	{
		if (!Type.isPlainObject(event))
		{
			return null;
		}

		const name = readEventName(event);
		if (!INCOMING_EVENTS.includes(name))
		{
			return null;
		}

		const payload = validateFor(name, readEventData(event));

		return payload === null ? null : { name, payload };
	}

	module.exports = { parseIncoming };
});
