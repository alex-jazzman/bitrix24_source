import { ajax, Dom, Loc, Runtime, Tag, Text, Type } from 'main.core';
import { Alert } from 'ui.alerts';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import './css/style.css';

type NoticeButton = {
	label: string,
	url: string,
};

type NoticeDecision = {
	code: string,
	title: string,
	text: string,
	buttons: NoticeButton[],
};

// The only decision code this alert draws: every other one belongs to a migration message, and a
// mailbox that gets one is never offered Bitrix24 Mail here (ERR-008).
const OFFER_CODE = 'err_1_offer';

/** Where the stored state of the connection is read from: the mailbox itself is never asked. */
const CONNECTION_COMPONENT = 'bitrix:mail.client.message.list';
const CONNECTION_ACTION = 'getMailboxCachedConnectionStatus';

/**
 * The alert leaves the page without a word once the mailbox syncs again: a removed node says nothing
 * to a screen reader, while the state it stood for has changed (WCAG 4.1.3). `ui.a11y` is asked for
 * at that very moment - a page where the mailbox works carries it for nothing.
 */
function announceRecovery(): void
{
	const message = Loc.getMessage('MAIL_ERROR_BOX_MAILBOX_CONNECTION_RESTORED');
	if (!Type.isStringFilled(message))
	{
		return;
	}

	void Runtime
		.loadExtension('ui.a11y')
		.then(({ LiveAnnouncer }) => {
			LiveAnnouncer.announce(message);
		})
		// A page that cannot bring `ui.a11y` stays as silent as it was before
		.catch(() => {})
	;
}

export class ErrorBox
{
	#wrapper;
	#errorLink;
	#mailboxId;
	// Only what this alert reads of the show decision: the decision itself is the server's.
	#migrationNotice: NoticeDecision | null;
	#alert: Alert | null = null;

	constructor(config)
	{
		const {
			wrapper = [],
			errorLink = '',
			currentMailboxId = null,
			migrationNotice = null,
			mailboxConnected = true,
		} = config;

		if (currentMailboxId !== null)
		{
			this.#mailboxId = Number(currentMailboxId);
		}

		this.#wrapper = wrapper;
		this.#errorLink = errorLink;
		this.#migrationNotice = migrationNotice;

		top.BX.addCustomEvent('MailClient:syncWasSuccessful', (data) => {
			this.#onSyncEvent(data, true);
		});

		top.BX.addCustomEvent('MailClient:syncFailedWithErrors', (data) => {
			this.#onSyncEvent(data, false);
		});

		/*
			The state of the connection comes with the page, so the alert of a mailbox that fell off long
			ago is here from the first render on and no longer waits for a synchronization that never
			starts (ERR-007). No request is made on this way in.
		*/
		this.#applyConnectionState(mailboxConnected);
	}

	destroy()
	{
		if (this.#alert === null)
		{
			return;
		}

		this.#alert.destroy();
		this.#alert = null;
	}

	build()
	{
		if (this.#alert !== null)
		{
			return;
		}

		// No close button: the alert leaves on its own once the mailbox syncs again (AC-032).
		this.#alert = new Alert({
			text: this.#getText(),
			color: Alert.Color.DANGER,
			icon: Alert.Icon.DANGER,
			size: Alert.Size.MD,
			// Air colours are read from the context of the surface, and this card is a light one. Without
			// the class the buttons take their colours from the branded background of the portal behind
			// the section, and a plain button hovers in colours drawn for another surface.
			customClass: 'ui-alert-mail-error-box --ui-context-content-light',
			beforeMessageHtml: this.#renderTitle(),
			afterMessageHtml: this.#renderActions(),
		});

		const container = this.#alert.render();
		Dom.attr(container, {
			'data-testid': 'mail-error-box',
			// The alert also comes up on a failed synchronization, long after the page was read: it is
			// a status message and has to reach a screen reader as one (WCAG 4.1.3).
			role: 'alert',
		});

		Dom.prepend(container, this.#wrapper);
	}

	/** One rule for both ways in: the alert lives while the mailbox does not connect. */
	#applyConnectionState(isConnected: boolean)
	{
		if (isConnected)
		{
			const wasShown = this.#alert !== null;
			this.destroy();

			if (wasShown)
			{
				announceRecovery();
			}

			return;
		}

		this.build();
	}

	#onSyncEvent(data, isConnected: boolean)
	{
		const {
			mailboxId,
		} = data;

		if (mailboxId === undefined || this.#mailboxId !== Number(mailboxId))
		{
			return;
		}

		// A synchronization that went through says by itself that the mailbox connects
		if (isConnected)
		{
			this.#applyConnectionState(true);

			return;
		}

		void this.#askConnectionState();
	}

	/**
	 * A synchronization request that did not go through is not a mailbox that does not connect: the
	 * same event carries the plain network error of the browser, and the alert states that the mailbox
	 * itself is broken. Only the server knows which of the two happened, so it is asked.
	 *
	 * The first render asks nothing: the state comes with the page (ERR-007). This way is the event,
	 * where no state comes at all.
	 */
	async #askConnectionState(): Promise<void>
	{
		try
		{
			const { data } = await ajax.runComponentAction(CONNECTION_COMPONENT, CONNECTION_ACTION, {
				mode: 'class',
				data: { mailboxId: this.#mailboxId },
			});

			// The server answers nothing at all when it cannot tell, and then nothing is claimed either
			if (Type.isBoolean(data))
			{
				this.#applyConnectionState(data);
			}
		}
		catch
		{
			// A request of ours failed, not the mailbox: the alert stays as it was
		}
	}

	/** The wording of the offer is the server's (ERR-1); without an offer the alert speaks for itself. */
	#getText(): string
	{
		const offer = this.#getOffer();

		return offer !== null && Type.isStringFilled(offer.text)
			? Text.encode(offer.text)
			: Loc.getMessage('MAIL_ERROR_BOX_MAILBOX_CONNECTION_ERROR')
		;
	}

	#renderTitle(): HTMLElement | null
	{
		const offer = this.#getOffer();

		if (offer === null || !Type.isStringFilled(offer.title))
		{
			return null;
		}

		return Tag.render`<span class="mail-error-box__title">${Text.encode(offer.title)}</span>`;
	}

	#renderActions(): HTMLElement
	{
		const actions = Tag.render`<div class="mail-error-box__actions"></div>`;

		this.#getButtons().forEach((button) => button.renderTo(actions));

		return actions;
	}

	/**
	 * The way to the mailbox settings is mandatory and comes first (AC-030); after it goes whatever
	 * the server offered, and nothing at all when it offered nothing.
	 */
	#getButtons(): Button[]
	{
		// The settings of the mailbox are a page of this portal, and a page of the portal opens in place:
		// a second tab of the same portal reads as "nothing happened". The offer beside it goes the same
		// way, and two buttons of one alert must not part ways over it.
		const settingsButton = new Button({
			text: Loc.getMessage('MAIL_ERROR_BOX_SETTINGS_BUTTON'),
			link: this.#errorLink,
			dataset: { testid: 'mail-error-box-settings-btn' },
			className: 'mail-error-box__action',
			size: ButtonSize.SMALL,
			useAirDesign: true,
			style: AirButtonStyle.FILLED,
		});

		return [settingsButton, ...this.#getOfferButtons()];
	}

	/**
	 * The offer and its wording come from the decision (DTO-01, DTO-02): the alert chooses nothing.
	 *
	 * The alert answers no message and has no way to, so a button of the offer is drawn only when it
	 * carries the address it leads to: one without it would be a button that does nothing at all.
	 */
	#getOfferButtons(): Button[]
	{
		const offer = this.#getOffer();

		if (offer === null || !Type.isArray(offer.buttons))
		{
			return [];
		}

		return offer.buttons
			.filter((button) => Type.isStringFilled(button?.label) && Type.isStringFilled(button?.url))
			.map((button) => new Button({
				text: button.label,
				link: button.url,
				dataset: { testid: 'mail-error-box-offer-btn' },
				className: 'mail-error-box__action',
				size: ButtonSize.SMALL,
				useAirDesign: true,
				// Outlined and not plain: the two are different offers, not an action and its refusal, and
				// a plain button on the tinted card of the alert loses its edges and stops looking like one
				style: AirButtonStyle.OUTLINE,
			}))
		;
	}

	#getOffer(): NoticeDecision | null
	{
		const decision = this.#migrationNotice;

		return decision?.code === OFFER_CODE ? decision : null;
	}
}
