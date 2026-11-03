/**
 * @module more-menu/block/company/integrator/src/view-model
 */
jn.define('more-menu/block/company/integrator/src/view-model', (require, exports, module) => {
	/**
	 * View decisions of the integrator card: which view is rendered, which menu items the current
	 * user gets, which contact rows exist and where they lead, how tall the contact sheet must be.
	 * Pure functions without a single require on purpose - so they are testable without the
	 * extension graph of the card.
	 */

	const IntegratorState = Object.freeze({
		PROMO: 'promo',
		CONNECTED: 'connected',
	});

	const IntegratorMenuItem = Object.freeze({
		FEEDBACK: 'feedback',
		REFUSE: 'refuse',
	});

	const IntegratorContactRow = Object.freeze({
		EMAIL: 'email',
		PHONE: 'phone',
		SITE: 'site',
		DETAILS: 'details',
	});

	/**
	 * @param {IntegratorInfo} [integrator]
	 * @return {boolean}
	 */
	const isConnected = (integrator) => integrator?.state === IntegratorState.CONNECTED;

	/** A scheme that is not http(s): `b24:`, `tel:`, `javascript:` and the like. */
	const FOREIGN_SCHEME = /^[a-z][a-z\d+.-]*:/i;

	/**
	 * Turns the partner site into an absolute http(s) address, or reports that there is no site to
	 * open. The value comes from the partner profile through the license server, so it is not ours to
	 * trust: a relative path or a local scheme (`b24:`) would otherwise let someone else's data drive
	 * navigation inside the app. A site written without a scheme still opens - it gets one prepended,
	 * the same way `utils/url` does it.
	 *
	 * @param {string} url
	 * @return {?string} null when the value can not be an external site address
	 */
	const resolveSiteUrl = (url) => {
		if (/^(https?:)?\/\//i.test(url))
		{
			return url;
		}

		return FOREIGN_SCHEME.test(url) || url.startsWith('/') ? null : `http://${url}`;
	};

	/**
	 * Deny by default: without canManage nothing is offered, and every item additionally needs the
	 * data it acts upon - the form the server resolved for the region, and the delete action.
	 *
	 * @param {IntegratorInfo} [integrator]
	 * @return {string[]} item codes in render order
	 */
	const getMenuItems = (integrator) => {
		const { canManage, feedbackFormId, refusalFormId, deleteAction } = integrator ?? {};

		if (!canManage)
		{
			return [];
		}

		const items = [];

		if (feedbackFormId)
		{
			items.push(IntegratorMenuItem.FEEDBACK);
		}

		if (refusalFormId && deleteAction)
		{
			items.push(IntegratorMenuItem.REFUSE);
		}

		return items;
	};

	/**
	 * @param {IntegratorInfo} [integrator]
	 * @return {Array<{ code: string, url: string, openInApp: boolean, text: ?string }>} rows in render
	 *   order; text is null when the row is labeled by a phrase instead of the value itself
	 */
	const getContactRows = (integrator) => {
		const { email, phone, url, cardUrl } = integrator ?? {};
		const rows = [];

		if (email)
		{
			rows.push({
				code: IntegratorContactRow.EMAIL,
				url: `mailto:${email}`,
				openInApp: false,
				text: email,
			});
		}

		if (phone)
		{
			rows.push({
				code: IntegratorContactRow.PHONE,
				url: `tel:${phone}`,
				openInApp: false,
				text: phone,
			});
		}

		const siteUrl = url ? resolveSiteUrl(url) : null;
		if (siteUrl)
		{
			rows.push({
				code: IntegratorContactRow.SITE,
				url: siteUrl,
				openInApp: false,
				text: url,
			});
		}

		if (cardUrl)
		{
			rows.push({
				code: IntegratorContactRow.DETAILS,
				url: cardUrl,
				openInApp: true,
				text: null,
			});
		}

		return rows;
	};

	/**
	 * @param {IntegratorInfo} [integrator]
	 * @return {boolean}
	 */
	const hasContactFooter = (integrator) => Boolean(integrator?.partnerFormId);

	/**
	 * Whether the contact sheet has anything to show. A partner that arrived with nothing but a name
	 * would open an empty sheet, so such a card stays informational: no chip, no tap on the body.
	 *
	 * @param {IntegratorInfo} [integrator]
	 * @return {boolean}
	 */
	const hasContactTarget = (integrator) => getContactRows(integrator).length > 0 || hasContactFooter(integrator);

	/**
	 * Height is summed from the very indents and component sizes the sheet layout uses, so it
	 * follows the app theme instead of hardcoded pixels; the caller injects them as metrics.
	 *
	 * @param {IntegratorInfo} [integrator]
	 * @param {{
	 *   indentL: number,
	 *   indentM: number,
	 *   indentXL: number,
	 *   indentXL2: number,
	 *   avatarSize: number,
	 *   rowIconSize: number,
	 *   footerButtonHeight: number,
	 * }} metrics
	 * @return {number}
	 */
	const calcContactHeight = (integrator, metrics) => {
		const { indentL, indentM, indentXL, indentXL2, avatarSize, rowIconSize, footerButtonHeight } = metrics;

		const header = indentL + avatarSize;
		const rowHeight = rowIconSize + 2 * indentM;
		const rows = indentM + getContactRows(integrator).length * rowHeight;
		// BoxFooter overlays the content, but Box reserves the same height with a stub above it,
		// plus a gap so the last field does not sit right on top of the button.
		const footer = hasContactFooter(integrator)
			? footerButtonHeight + 2 * indentXL + indentXL2
			: 0;

		return header + rows + footer;
	};

	module.exports = {
		IntegratorState,
		IntegratorMenuItem,
		IntegratorContactRow,
		isConnected,
		getMenuItems,
		getContactRows,
		hasContactFooter,
		hasContactTarget,
		calcContactHeight,
	};
});
