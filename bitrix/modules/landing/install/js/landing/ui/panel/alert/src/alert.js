import {Dom, Tag, Cache} from 'main.core';
import {Loc} from 'landing.loc';
import {BasePanel} from 'landing.ui.panel.base';

import './css/style.css';

// Backs the animation frame up: a frame is about 16ms, so it wins whenever the tab is visible.
const FRAME_FALLBACK_TIMEOUT = 100;

/**
 * Implements interface for works with alert panel
 * use this panel for show error and info messages
 *
 * Implements singleton design pattern. Don't use it as constructor
 * use BX.Landing.UI.Panel.Alert.getInstance() for get instance of module
 * @memberOf BX.Landing.UI.Panel
 */
export class Alert extends BasePanel
{
	static staticCache = new Cache.MemoryCache();

	// A snackbar, not a dialog: the message takes no answer and must not steal focus.
	isDialog: boolean = false;

	static getInstance(): Alert
	{
		return this.staticCache.remember('instance', () => {
			return new Alert();
		});
	}

	constructor(options = {})
	{
		super(options);
		this.cache = new Cache.MemoryCache();
		this.onCloseClick = this.onCloseClick.bind(this);
		this.text = this.getText();
		this.closeButton = this.getCloseButton();
		this.action = this.getAction();
		this.leaving = Promise.resolve();

		// Live region set once on the message itself: an atomic region spanning the layout would
		// read the support link and the close button along with every message.
		this.text.setAttribute('role', 'alert');

		Dom.addClass(this.layout, 'landing-ui-panel-alert');
		// The layout joins the document closed and stays out of the tab order until the first
		// show(), which is what drops the attribute. Only the class is set by createLayout, and
		// a snackbar moved off screen by a transform alone keeps its close button focusable.
		this.layout.hidden = true;

		Dom.append(this.text, this.layout);
		Dom.append(this.action, this.layout);
		Dom.append(this.layout, document.body);
	}

	getText(): HTMLDivElement
	{
		return this.cache.remember('text', () => {
			return Tag.render`<div class="landing-ui-panel-alert-text"></div>`;
		});
	}

	getCloseButton(): HTMLButtonElement
	{
		return this.cache.remember('closeButton', () => {
			const text = Loc.getMessage('LANDING_ALERT_ACTION_CLOSE');
			return Tag.render`
				<button class="ui-btn ui-btn-link" onclick="${this.onCloseClick}">${text}</button>
			`;
		});
	}

	getAction(): HTMLDivElement
	{
		return this.cache.remember('action', () => {
			return Tag.render`<div class="landing-ui-panel-alert-action">${this.getCloseButton()}</div>`;
		});
	}

	show(type, text, hideSupportLink = false): Promise<Alert>
	{
		// A leave animation ends with `Utils.Hide` taking the layout down, and it would take a message
		// written in the meantime with it. Interrupting the leave is not an option: the `animationend`
		// `Utils.Hide` waits for is the one of whatever animation comes next. So the leave is let
		// finish and the snackbar carries the message shown anew.
		if (this.isLeaving())
		{
			return this.leaving.then(() => this.showMessage(type, text, hideSupportLink));
		}

		return this.showMessage(type, text, hideSupportLink);
	}

	showMessage(type, text, hideSupportLink): Promise<Alert>
	{
		// A live region is announced by a change of its content, so a message that replaces a visible
		// one is only written. Hiding the singleton layout to show it again would blink the snackbar,
		// add a mutation of its own to the region and hand focus back to the page while it stays up.
		if (!this.isShown())
		{
			void super.show(this);
		}

		return this.writeMessage(type, text || type, hideSupportLink);
	}

	hide(): Promise<any>
	{
		this.leaving = super.hide();

		return this.leaving;
	}

	// The leave class lands on the layout when the animation starts, the mark of the enter animation
	// goes away only once `Utils.Hide` gets its `animationend`: in between the two disagree.
	isLeaving(): boolean
	{
		return !this.isShown() && BX.Landing.Utils.isShown(this.layout);
	}

	applyType(type: string)
	{
		if (type === 'error')
		{
			Dom.removeClass(this.layout, 'landing-ui-alert');
			Dom.addClass(this.layout, 'landing-ui-error');

			return;
		}

		Dom.removeClass(this.layout, 'landing-ui-error');
		Dom.addClass(this.layout, 'landing-ui-alert');
	}

	/**
	 * Screen readers need a rendered frame between the live region entering the accessibility
	 * tree and its first content change, otherwise the message is silently dropped. The same
	 * guard the LiveAnnouncer of ui.a11y uses for its own region. Colours belong to the message,
	 * so they are switched in that very frame: applying them earlier would both show the previous
	 * message in the look of the next one and add a mutation of its own to an assertive region.
	 * A message replacing a visible one needs no such frame, but keeps the very same path: it costs
	 * one frame and keeps the colours paired with the text they belong to.
	 * @param {string} type
	 * @param {string} message trusted markup, written as innerHTML: never pass user input as is
	 * @param {boolean} hideSupportLink
	 * @return {Promise<Alert>}
	 */
	writeMessage(type: string, message: string, hideSupportLink: boolean): Promise<Alert>
	{
		return new Promise((resolve) => {
			let written = false;
			let fallbackTimeout = null;

			const write = () => {
				if (written)
				{
					return;
				}

				written = true;
				clearTimeout(fallbackTimeout);

				this.applyType(type);
				this.text.innerHTML = `${message} `;

				if (!hideSupportLink)
				{
					Dom.append(this.getSupportLink(), this.text);
				}

				resolve(this);
			};

			requestAnimationFrame(write);
			// A background tab paints no frames, and an error message must not wait for the user
			// to come back to be written, let alone keep the show() promise pending until then.
			fallbackTimeout = setTimeout(write, FRAME_FALLBACK_TIMEOUT);
		});
	}

	getSupportLink(): HTMLAnchorElement
	{
		return this.cache.remember('supportLink', () => {
			let url = 'https://helpdesk.bitrix24.com/ticket.php';

			switch (Loc.getMessage('LANGUAGE_ID'))
			{
				case 'ru':
				case 'by':
				case 'kz':
					url = 'https://helpdesk.bitrix24.ru/ticket.php';
					break;
				case 'de':
					url = 'https://helpdesk.bitrix24.de/ticket.php';
					break;
				case 'br':
					url = 'https://helpdesk.bitrix24.com.br/ticket.php';
					break;
				case 'es':
					url = 'https://helpdesk.bitrix24.es/ticket.php';
					break;
				default:
			}

			this.supportLink = BX.create('a', {
				props: {className: 'landing-ui-panel-alert-support-link'},
				html: BX.Landing.Loc.getMessage('LANDING_ALERT_ACTION_SUPPORT_LINK'),
				attrs: {href: url, target: '_blank'},
			});

			const text = Loc.getMessage('LANDING_ALERT_ACTION_SUPPORT_LINK');
			return Tag.render`
				<a href="${url}" target="_blank" class="landing-ui-panel-alert-support-link">${text}</a>
			`;
		});
	}

	onCloseClick()
	{
		void this.hide();
	}
}