/**
 * @module mail/dialog/banners/migrationnotice
 */
jn.define('mail/dialog/banners/migrationnotice', (require, exports, module) => {
	const { Type } = require('type');
	const { Indent } = require('tokens');
	const { showToast } = require('toast');
	const { requireLazy } = require('require-lazy');
	const {
		Button,
		ButtonDesign,
		ButtonSize,
	} = require('ui-system/form/buttons/button');
	const { BannerTemplate } = require('mail/dialog/banners/template');
	const { AjaxMethod } = require('mail/const');

	/** API-02. What a person can answer a message with. */
	const MigrationNoticeReaction = Object.freeze({
		shown: 'shown',
		remindLater: 'remind_later',
		dismissed: 'dismissed',
	});

	/**
	 * API-01. The surfaces the application stands on; the portal, the web section and the CRM card are
	 * the web's own.
	 *
	 * The way into the application is a surface of its own and not the portal of the web. The two are
	 * the same kind of place - a whole product to draw the announcement over - but not the same set of
	 * ways out of it: a way the application cannot see through is one the server leaves out, and it can
	 * only leave it out for a surface it can tell apart.
	 */
	const MigrationNoticeSurface = Object.freeze({
		mobilePortal: 'mobile_portal',
		mobileList: 'mobile_list',
	});

	const REACTIONS = Object.values(MigrationNoticeReaction);

	/** DTO-02. The one button of a migration message that ends nothing: it links to an article. */
	const DETAILS = 'details';

	/** iOS hides the widget, Android removes it; either of them is the person closing the popup. */
	const CLOSE_EVENTS = ['onViewHidden', 'onViewRemoved'];

	const ICON = Object.freeze({
		pathName: 'mailbox-connection-full.png',
		width: 142,
		height: 127,
	});

	/**
	 * An address of the portal is a path of the portal and never anything else, and an address that
	 * leaves the portal is absolute: the server settles this before the decision is handed out
	 * ({@see \Bitrix\Mail\Helper\Config\Feature}), so the shape alone tells the two apart here.
	 *
	 * @param {string} url
	 * @return {boolean}
	 */
	function isPortalPath(url)
	{
		return Type.isStringFilled(url) && url.startsWith('/');
	}

	/**
	 * DTO-02. Where a button of a migration message leads, once the application has looked at its
	 * identifier and found no screen of its own behind it.
	 *
	 * A page of the portal is not opened in the application at all. The application does not draw the
	 * web portal inside itself, and it cannot hand the page to the browser of the system either: the
	 * session does not travel out, and a person sent there meets a login form instead of their mail.
	 * So it offers the computer - the «Открыть на компьютере» screen with the QR code, the same one
	 * the provider restriction message opens beside it - and the address of the button becomes the
	 * page that computer lands on once the code is scanned.
	 *
	 * The one address that leaves the portal is the helpdesk article behind "Learn more", and help is
	 * not the portal: it asks for no session and the application has a window of its own for it.
	 *
	 * @param {MigrationNoticeButton} button
	 * @param {object} [parentWidget] The screen to open over; the application itself when there is none.
	 * @return {Promise<void>}
	 */
	async function openMigrationNoticeTarget(button, parentWidget = null)
	{
		const url = button?.url ?? '';

		if (isPortalPath(url))
		{
			await openOnDesktop(url, button?.label ?? '', parentWidget);

			return;
		}

		if (Type.isStringFilled(url))
		{
			await openHelpPage(url);
		}
	}

	/**
	 * The QR code carries the session of the person over to a browser on their computer and lands it
	 * on {@see url}. The words of the button they pressed become the title, so the screen answers what
	 * they asked for instead of announcing itself.
	 *
	 * The hint is the one the screen ships with - that this is not available in the application yet -
	 * which is exactly the case here and costs no phrase of ours.
	 *
	 * @param {string} url
	 * @param {string} title
	 * @param {object} [parentWidget]
	 * @return {Promise<void>}
	 */
	async function openOnDesktop(url, title, parentWidget = null)
	{
		try
		{
			const { qrauth } = await requireLazy('qrauth/utils');

			qrauth.open({
				title,
				redirectUrl: url,
				showHint: true,
				layout: parentWidget,
			});
		}
		catch (error)
		{
			console.error('mail:migrationNotice:openOnDesktop error', error);
		}
	}

	/**
	 * The helpdesk article behind "Learn more" (Q-2). Help has one way of opening in the application
	 * and every module of it goes that way: the native helpdesk window. It stands over the screen the
	 * person is on and takes nothing down, so the message they left is there when they come back.
	 *
	 * @param {string} url An address of the helpdesk, absolute - the server settles that (AC-016).
	 * @return {Promise<void>}
	 */
	async function openHelpPage(url)
	{
		try
		{
			await helpdesk.openHelp(url);
		}
		catch (error)
		{
			console.error('mail:migrationNotice:openHelpPage error', error);
		}
	}

	/**
	 * The migration popup (MIG-A, MIG-B). One popup for both texts: which of them a person reads is the
	 * server's to say, and the popup draws the title, the text and the buttons it was given.
	 *
	 * No condition of the display lives here and none is repeated: the state of the mailbox never
	 * reaches the client, the two texts arrive as two codes of the decision (AC-017). What a button does
	 * its own shape tells: one with an address leads there, one without answers the message and its
	 * identifier names the reaction (API-02). The variant B therefore loses "Remind later" by itself,
	 * without a branch of its own (AC-020).
	 *
	 * @extends {LayoutComponent<MigrationNoticeProps>}
	 */
	class MigrationNotice extends LayoutComponent
	{
		/**
		 * API-01. The decision for a surface that does not carry one already. The message list brings
		 * its own with the letters (DTO-03) and spends no call; a message shown anywhere else asks here.
		 *
		 * A decision that came back has to be drawn: the sitting is closed for a second fullscreen
		 * message the moment one is handed out, so every request of the same sitting that follows is
		 * answered with nothing.
		 *
		 * @param {string} surface One of {@see MigrationNoticeSurface}.
		 * @param {number} [mailboxId] The mailbox of the surface, when the surface knows one.
		 * @return {Promise<MigrationNoticeDecision|null>}
		 */
		static request(surface, mailboxId = 0)
		{
			const data = { surface };
			if (mailboxId > 0)
			{
				data.mailboxId = mailboxId;
			}

			return BX.ajax
				.runAction(AjaxMethod.mailMigrationNoticeGet, { data })
				.then((response) => MigrationNotice.readDecision(response?.data?.decision))
				.catch(() => null)
			;
		}

		/**
		 * API-02. Reports what the person did and answers with the decision in force once it is written
		 * down, so what follows a reaction is drawn from that answer and never guessed here.
		 *
		 * @param {string} reactionToken
		 * @param {string} reaction
		 * @return {Promise<MigrationNoticeDecision|null>}
		 */
		static react(reactionToken, reaction)
		{
			if (!Type.isStringFilled(reactionToken) || !REACTIONS.includes(reaction))
			{
				return Promise.resolve(null);
			}

			return BX.ajax
				.runAction(AjaxMethod.mailMigrationNoticeReact, { data: { reactionToken, reaction } })
				.then((response) => MigrationNotice.readDecision(response?.data?.decision))
				.catch(() => null)
			;
		}

		/**
		 * DTO-01 as it arrives, brought to the shape the messages draw. A decision that could not be read
		 * changes nothing: no message of its own is invented in its place.
		 *
		 * @param {*} payload
		 * @return {MigrationNoticeDecision|null}
		 */
		static readDecision(payload)
		{
			if (!Type.isPlainObject(payload) || !Type.isStringFilled(payload.code))
			{
				return null;
			}

			return {
				code: payload.code,
				mailboxId: Type.isNumber(payload.mailboxId) ? payload.mailboxId : null,
				title: Type.isString(payload.title) ? payload.title : '',
				text: Type.isString(payload.text) ? payload.text : '',
				buttons: MigrationNotice.readButtons(payload.buttons),
				dismissHint: Type.isString(payload.dismissHint) ? payload.dismissHint : '',
				reactionToken: Type.isString(payload.reactionToken) ? payload.reactionToken : '',
			};
		}

		/**
		 * @param {*} payload
		 * @return {MigrationNoticeButton[]}
		 */
		static readButtons(payload)
		{
			return (Type.isArray(payload) ? payload : [])
				.filter((button) => Type.isPlainObject(button) && Type.isStringFilled(button.label))
				.map((button) => ({
					id: Type.isString(button.id) ? button.id : '',
					label: button.label,
					url: Type.isStringFilled(button.url) ? button.url : '',
				}))
			;
		}

		/**
		 * @param {MigrationNoticeProps} props
		 */
		constructor(props)
		{
			super(props);

			this.decision = MigrationNotice.readDecision(props.decision);
			this.answered = false;
			this.handleClose = this.handleClose.bind(this);
		}

		componentDidMount()
		{
			CLOSE_EVENTS.forEach((eventName) => this.props.layoutWidget?.on?.(eventName, this.handleClose));

			// The popup is shown once per mailbox (AC-010, AC-021), and the server is the one counting:
			// a mark kept in the memory of the screen would not survive a restart of the application
			void MigrationNotice.react(this.getReactionToken(), MigrationNoticeReaction.shown);
		}

		/**
		 * A popup nobody answered is a popup that was closed: the person is told where the transfer lives
		 * (AC-012) and the closing itself is reported.
		 */
		handleClose()
		{
			if (this.answered)
			{
				return;
			}

			this.answered = true;

			const dismissHint = this.decision?.dismissHint ?? '';
			if (Type.isStringFilled(dismissHint))
			{
				showToast({ message: dismissHint }, this.props.parentWidget);
			}

			void MigrationNotice.react(this.getReactionToken(), MigrationNoticeReaction.dismissed);
		}

		/**
		 * DTO-02. A button whose identifier names a reaction the application knows answers the message
		 * with it; every other button is followed where its address leads ({@see openMigrationNoticeTarget}).
		 * The reaction comes first because the server fills an address in for every button it can - the
		 * web has nothing but addresses to follow - and an answer turned into a page would leave the
		 * person's word unwritten.
		 *
		 * "Learn more" is the one button that ends nothing. It is a link to an article of the helpdesk
		 * (AC-016) - neither a decision nor a refusal, and none of the ways SC-002 and SC-003 end - so
		 * the article opens in the help window of the application, over the popup, and the popup is
		 * still standing when the person comes back. In the web the same tap opens a tab of its own
		 * and leaves the popup where it was.
		 *
		 * Every other button ends the popup, and the ending is reported: the application has no second
		 * tab to leave it standing in, and a popup gone off the screen is the popup the banner follows
		 * (AC-024). The balloon of the closing is not for a person who has just chosen.
		 *
		 * @param {MigrationNoticeButton} button
		 */
		handleButton(button)
		{
			if (REACTIONS.includes(button.id))
			{
				this.answered = true;
				void MigrationNotice.react(this.getReactionToken(), button.id);
				this.closeLayout();

				return;
			}

			if (button.id === DETAILS)
			{
				void openMigrationNoticeTarget(button, this.props.layoutWidget ?? this.props.parentWidget);

				return;
			}

			this.answered = true;

			if (Type.isStringFilled(button.url))
			{
				void MigrationNotice.react(this.getReactionToken(), MigrationNoticeReaction.dismissed);
				this.closeLayout(() => {
					void openMigrationNoticeTarget(button, this.props.parentWidget);
				});

				return;
			}

			this.closeLayout();
		}

		/**
		 * @param {function} [callback]
		 */
		closeLayout(callback = () => {})
		{
			const widget = this.props.needsToCloseLayout === false ? null : this.props.layoutWidget;

			if (widget?.close)
			{
				widget.close(callback);

				return;
			}

			callback();
		}

		/**
		 * @return {string}
		 */
		getReactionToken()
		{
			return this.decision?.reactionToken ?? '';
		}

		/** The first button of the decision is the way out of the trouble, the rest go beside it. */
		renderButtons()
		{
			const buttons = this.decision?.buttons ?? [];

			return View(
				{
					style: {
						alignSelf: 'stretch',
					},
				},
				...buttons.map((button, index) => View(
					{
						style: {
							marginTop: index === 0 ? 0 : Indent.M.toNumber(),
						},
					},
					Button({
						testId: `mail-migration-notice-button-${index}`,
						text: button.label,
						size: ButtonSize.XL,
						design: index === 0 ? ButtonDesign.FILLED : ButtonDesign.OUTLINE,
						stretched: true,
						onClick: () => this.handleButton(button),
					}),
				)),
			);
		}

		render()
		{
			return BannerTemplate({
				iconPathName: ICON.pathName,
				iconWidth: ICON.width,
				iconHeight: ICON.height,
				title: this.decision?.title ?? '',
				description: this.decision?.text ?? '',
				buttonsView: this.renderButtons(),
			});
		}
	}

	module.exports = {
		MigrationNotice,
		MigrationNoticeReaction,
		MigrationNoticeSurface,
		openMigrationNoticeTarget,
	};
});
