/**
 * @module my-company/screen/src/analytics
 */
jn.define('my-company/screen/src/analytics', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	// The section of the hub is its own, and nothing of the menu is reused for it: the defaults of the
	// class of the menu hard-set the section of the avatar menu, so the events of the two screens would
	// land in one heap. It is exported for the same reason: a card of the hub is owned by the menu and
	// sends its own events through the class of the menu, so it is handed the name of the screen it was
	// drawn in.
	const SECTION = 'my_company';
	const TOOL = 'intranet';

	const Event = {
		OPEN_SECTION: 'open_section',
		CLICK_CARD: 'click_card',
		VIEW_HINT: 'view_hint',
		CLOSE_HINT: 'close_hint',
		GET_DOCUMENT: 'get_document',
	};

	/**
	 * The codes of the blocks travel in the camel case of the wire, while an event spells its element
	 * in the lower case: `personalAccount` becomes `personal_account`. Every code of the section stays
	 * within the single underscore the validator of the analytics allows a value to carry.
	 *
	 * @param {MyCompanyCardId} code
	 * @return {string}
	 */
	const toElement = (code) => code.replaceAll(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

	/**
	 * Events of the section of the company. An event names the block it happened in and the kind of the
	 * flow it belongs to, and carries nothing else: neither the user, nor the contents of the payslip,
	 * nor the one-time code ever reaches it in any form.
	 *
	 * @class MyCompanyAnalytics
	 */
	class MyCompanyAnalytics extends AnalyticsEvent
	{
		getDefaults()
		{
			return {
				tool: TOOL,
				category: SECTION,
				c_section: SECTION,
			};
		}

		static sendSectionOpen()
		{
			new this({ event: Event.OPEN_SECTION }).send();
		}

		/**
		 * @param {MyCompanyCardId} code the block of the composition the tap landed in
		 * @param {?string} [item] the row of that block, for a card that holds several
		 */
		static sendCardClick(code, item = null)
		{
			new this({
				event: Event.CLICK_CARD,
				c_element: toElement(code),
				type: item,
			}).send();
		}

		/**
		 * @param {MyCompanyCardId} code the card the step of the hint points at
		 */
		static sendHintShow(code)
		{
			new this({ event: Event.VIEW_HINT, c_element: toElement(code) }).send();
		}

		/**
		 * @param {MyCompanyCardId} code the card the step of the hint points at
		 */
		static sendHintClose(code)
		{
			new this({ event: Event.CLOSE_HINT, c_element: toElement(code) }).send();
		}

		/**
		 * @param {MyCompanyCardId} code
		 * @param {string} type the kind of the flow: the payslip or the balance of the vacation
		 */
		static sendFlowStart(code, type)
		{
			this.#flowEvent(code, type).markAsAttempt().send();
		}

		/**
		 * @param {MyCompanyCardId} code
		 * @param {string} type
		 */
		static sendFlowSuccess(code, type)
		{
			this.#flowEvent(code, type).markAsSuccess().send();
		}

		/**
		 * @param {MyCompanyCardId} code
		 * @param {string} type
		 */
		static sendFlowError(code, type)
		{
			this.#flowEvent(code, type).markAsError().send();
		}

		/**
		 * @param {MyCompanyCardId} code
		 * @param {string} type
		 * @return {MyCompanyAnalytics}
		 */
		static #flowEvent(code, type)
		{
			return new this({
				event: Event.GET_DOCUMENT,
				c_element: toElement(code),
				type,
			});
		}
	}

	module.exports = { MyCompanyAnalytics, MY_COMPANY_SECTION: SECTION };
});
