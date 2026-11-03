/**
 * @module mail/dialog/banners/announcement
 */
jn.define('mail/dialog/banners/announcement', (require, exports, module) => {
	const { Type } = require('type');
	const { Indent } = require('tokens');
	const { requireLazy } = require('require-lazy');
	const { PerfPoint } = require('debug/prism');
	const {
		Button,
		ButtonDesign,
		ButtonSize,
	} = require('ui-system/form/buttons/button');
	const { BannerTemplate } = require('mail/dialog/banners/template');
	const {
		MigrationNotice,
		MigrationNoticeReaction,
		MigrationNoticeSurface,
		openMigrationNoticeTarget,
	} = require('mail/dialog/banners/migrationnotice');

	/** DTO-01. The one code this message draws; every other one belongs to another message. */
	const ANNOUNCEMENT_CODE = 'ann_1';

	/** DTO-02. The way of the announcement that opens a screen of the application instead of an address. */
	const CONNECT_EXTERNAL = 'connect_external';

	/** The step of the connection wizard that way opens. */
	const SERVICES_LIST_STEP = 'servicesList';

	const ICON = Object.freeze({
		pathName: 'mailbox-connection-full.png',
		width: 142,
		height: 127,
	});

	/**
	 * Which step of the connection wizard a button of the announcement opens, or nothing when the button
	 * opens no wizard at all.
	 *
	 * The mail of the company has no step behind it and is given none. The wizard connects the services
	 * of the showcase and issues addresses at `@bitrix24`, while the mail of a company - its own domain
	 * and its own addresses - is settled in the control panel. That button therefore goes out by its
	 * address, as the web follows it, and the handover to a computer carries it from here.
	 *
	 * @param {string} buttonId
	 * @return {string}
	 */
	function getConnectorStep(buttonId)
	{
		return buttonId === CONNECT_EXTERNAL ? SERVICES_LIST_STEP : '';
	}

	/**
	 * The announcement of the mail of Bitrix24 (ANN-1): the news that the product has a mail of its
	 * own. Not a word of it is about providers, about being cut off or about a migration (AC-005) -
	 * and none could be, because the announcement holds no text of its own: the title, the words and
	 * the buttons all come from the decision.
	 *
	 * It is shown once per person for good (AC-002), and the counting is the server's: the screen
	 * reports itself as shown the moment it appears, and until that report the announcement is still
	 * owed - a decision lost on the way here is asked for again on the next entry (ERR-001).
	 *
	 * @extends {LayoutComponent<MigrationAnnouncementProps>}
	 */
	class MigrationAnnouncement extends LayoutComponent
	{
		/**
		 * API-01. The decision of the way into the application, the only surface of the application that
		 * carries the announcement: the list of letters asks about its own and is answered with nothing
		 * while the announcement is still owed. This still goes out before the list does, so that the
		 * announcement is written down before the list asks for a decision of its own.
		 *
		 * @return {Promise<MigrationNoticeDecision|null>} The decision to show, or nothing to show.
		 */
		static async resolve()
		{
			const decision = await MigrationNotice.request(MigrationNoticeSurface.mobilePortal);

			return decision?.code === ANNOUNCEMENT_CODE ? decision : null;
		}

		/**
		 * @param {MigrationAnnouncementProps} props
		 */
		constructor(props)
		{
			super(props);

			this.decision = MigrationNotice.readDecision(props.decision);
		}

		componentDidMount()
		{
			// The announcement is shown once for a lifetime (AC-002), and the server counts it by this
			// report: a screen that never opened must leave the announcement owed
			void MigrationNotice.react(
				this.decision?.reactionToken ?? '',
				MigrationNoticeReaction.shown,
			);
		}

		/**
		 * DTO-02. What a button of the announcement does the application knows by its identifier: the way
		 * the announcement offers here opens the connection wizard, at the step the identifier names, and
		 * the wizard is a screen of the application that no address opens.
		 *
		 * The address the decision carries is therefore the way out for identifiers the application
		 * does not know, and not the first thing looked at: the server fills an address in for every
		 * button, because the web has nothing but addresses to follow. Where such an address leads is
		 * settled in one place for every message of the feature ({@see openMigrationNoticeTarget}).
		 *
		 * Both ways open over the announcement and leave it standing, as the help article does over the
		 * migration popup and as the message about a restricted provider does with its own buttons: the
		 * announcement offers two ways and a person may look at either without losing the other. It is
		 * due once for a lifetime, so a way out that also dismisses it would make the second way
		 * unreachable for good. Only a button that leads nowhere closes it - there is nothing else it
		 * could do.
		 *
		 * @param {MigrationNoticeButton} button
		 */
		handleButton(button)
		{
			const layout = this.props.layoutWidget ?? this.props.parentWidget;

			const startStepId = getConnectorStep(button.id);
			if (startStepId !== '')
			{
				void this.openConnector(startStepId, layout);

				return;
			}

			if (Type.isStringFilled(button.url))
			{
				void openMigrationNoticeTarget(button, layout);

				return;
			}

			this.closeLayout();
		}

		/**
		 * The showcase of the providers, and nothing of Bitrix24 Mail in it: the card that creates a
		 * mailbox of ours leads into a wizard that belongs to another feature, kept behind a switch of
		 * its own and absent from an ordinary portal. The announcement asks for the list as the rest of
		 * the application asks for it - the button that opens it says an external mailbox and means one,
		 * and the mail of the company is offered by the button beside it.
		 *
		 * @param {string} startStepId
		 * @param {object} layout The screen the wizard opens over - the announcement itself, while it stands.
		 */
		async openConnector(startStepId, layout)
		{
			const perfPoint = new PerfPoint('Mail Connector Open', startStepId).start();
			perfPoint.startPoint('Load Connector Extension');

			let connectorExtension = {};
			try
			{
				connectorExtension = await requireLazy('mail:mailbox/connector') ?? {};
			}
			finally
			{
				perfPoint.endPoint('Load Connector Extension');
				perfPoint.end();
			}

			const { Connector } = connectorExtension;

			if (!Connector)
			{
				return;
			}

			void (new Connector({
				connectFrom: 'mail',
				parentWidget: layout,
				startStepId,
				createBitrixEnabled: false,
			})).show();
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

		/** The first button of the decision is the way it offers, the rest go beside it. */
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
						testId: `mail-migration-announcement-button-${index}`,
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

	module.exports = { MigrationAnnouncement };
});
