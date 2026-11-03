// The class the template puts on the notice, and the one the ui module draws the cross with: both
// carry the styles of this button, so neither can be dropped without the notice changing shape.
const ALERT_SELECTOR = '.landing-mainpage-alert';
const CLOSE_BUTTON_SELECTOR = '.ui-alert-close-btn';

// one entry per notice, so a repeated initialization finds the node already bound
const boundAlerts = new WeakSet();

export class Alert
{
	/**
	 * Constructor.
	 */
	constructor()
	{
		this.init();
	}

	/**
	 * Binds the cross of the draft notice.
	 *
	 * @return {void}
	 */
	init()
	{
		const alertNode = document.querySelector(ALERT_SELECTOR);
		if (!alertNode)
		{
			return;
		}

		const closeButton = alertNode.querySelector(CLOSE_BUTTON_SELECTOR);
		if (!closeButton)
		{
			return;
		}

		if (boundAlerts.has(alertNode))
		{
			return;
		}

		boundAlerts.add(alertNode);

		closeButton.addEventListener('click', () => {
			this.close(alertNode);
		});
	}

	/**
	 * Removes the notice and moves the focus to the area of content that held it.
	 *
	 * The area belongs to the template of the portal: it is only made focusable, and only when it
	 * carries no tabindex of its own. Its absence is not an error - the notice still closes.
	 *
	 * @param {HTMLElement} alertNode
	 * @return {void}
	 */
	close(alertNode)
	{
		// read before the removal: a detached node has no way back to the document
		const contentArea = alertNode.closest('main');

		alertNode.remove();

		if (!contentArea)
		{
			return;
		}

		if (!contentArea.hasAttribute('tabindex'))
		{
			contentArea.setAttribute('tabindex', '-1');
		}

		contentArea.focus();
	}
}
