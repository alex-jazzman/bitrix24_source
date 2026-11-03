/**
 * @module mail/message-grid/src/migration-banner
 */
jn.define('mail/message-grid/src/migration-banner', (require, exports, module) => {
	const { Type } = require('type');
	const { Indent } = require('tokens');
	const { isEqual } = require('utils/object');
	const { CardBanner } = require('ui-system/blocks/banners/card-banner');
	const {
		Button,
		ButtonDesign,
		ButtonSize,
	} = require('ui-system/form/buttons/button');
	const { PerfPoint } = require('debug/prism');
	const {
		MigrationNotice,
		MigrationNoticeReaction,
		openMigrationNoticeTarget,
	} = require('mail/dialog/banners/migrationnotice');

	const TEST_ID = 'mail-migration-banner';

	/** API-02. The identifiers of the buttons the application answers instead of following. */
	const REACTIONS = Object.values(MigrationNoticeReaction);

	/**
	 * The migration banner over the list of letters (BAN-1). It speaks about the move alone: a mailbox
	 * that stopped working is told about by a message of its own, with rules of its own, and the two
	 * are never mixed (AC-027).
	 *
	 * The banner has no say in whether it belongs on screen: it draws the decision it is given and
	 * disappears when given none. A person answers it once - the cross reports the closing (API-02)
	 * and what comes back is the decision in force from then on, so that a closed banner does not come
	 * back is the server's word and not a rule kept here (AC-026).
	 */
	class MessageGridMigrationBanner
	{
		/**
		 * @param {{ onDecision: function, onChange: function, parentWidget: object }} options
		 */
		constructor({ onDecision = () => {}, onChange = () => {}, parentWidget = null } = {})
		{
			this.onDecision = onDecision;
			this.onChange = onChange;
			this.parentWidget = parentWidget;
			this.decision = null;
			this.answeredToken = '';
		}

		/**
		 * @param {MigrationNoticeDecision|null} [decision]
		 */
		setDecision(decision = null)
		{
			const next = this.isAnswered(decision) ? null : decision;

			if (isEqual(this.decision, next))
			{
				return;
			}

			this.decision = next;
			this.onChange();
		}

		/**
		 * A decision the person has already answered is not drawn again: the answer travels to the
		 * server, and a list response that left before it arrived still carries the old message.
		 *
		 * @param {MigrationNoticeDecision|null} decision
		 * @return {boolean}
		 */
		isAnswered(decision)
		{
			return Type.isStringFilled(this.answeredToken) && decision?.reactionToken === this.answeredToken;
		}

		/**
		 * @return {boolean}
		 */
		isVisible()
		{
			return this.decision !== null;
		}

		/**
		 * DTO-02. A button whose identifier names a reaction the application knows answers the message
		 * with it (API-02); every other button is followed where its address leads and leaves the
		 * message alone ({@see openMigrationNoticeTarget}). The reaction is looked at first: the server
		 * fills an address in for every button it can, because the web has nothing but addresses to
		 * follow.
		 *
		 * @param {MigrationNoticeButton} button
		 */
		handleButton(button)
		{
			if (!REACTIONS.includes(button.id) && Type.isStringFilled(button.url))
			{
				void openMigrationNoticeTarget(button, this.parentWidget);

				return;
			}

			this.answer(button.id);
		}

		handleDismiss = () => {
			this.answer(MigrationNoticeReaction.dismissed);
		};

		/**
		 * The banner leaves the screen as soon as the person answers, and the decision that comes back
		 * is handed on as it is: it may well be another message (ERR-006).
		 *
		 * @param {string} reaction
		 */
		answer(reaction)
		{
			const reactionToken = this.decision?.reactionToken ?? '';

			this.answeredToken = reactionToken;
			this.setDecision(null);

			// the banner is off the screen from here on, and what takes its place is the round trip:
			// this is the stretch a person spends looking at a list with no message on it
			const perfPoint = new PerfPoint('Mail Migration Notice React', reaction).start();
			perfPoint.startPoint('React');

			void MigrationNotice
				.react(reactionToken, reaction)
				.then((decision) => {
					perfPoint.endPoint('React', { nextCode: decision?.code ?? 'none' });
					perfPoint.end();

					this.onDecision(decision);
				})
			;
		}

		renderButtons()
		{
			return (this.decision?.buttons ?? []).map((button, index) => Button({
				testId: `${TEST_ID}-button-${index}`,
				text: button.label,
				size: ButtonSize.M,
				design: index === 0 ? ButtonDesign.FILLED : ButtonDesign.OUTLINE,
				stretched: true,
				onClick: () => this.handleButton(button),
			}));
		}

		render()
		{
			if (this.decision === null)
			{
				return null;
			}

			// the same air under the card as over it: without it the card sits on the first letter of
			// the list and reads as cut off at the bottom
			return View(
				{
					style: {
						paddingHorizontal: Indent.XL.toNumber(),
						paddingTop: Indent.M.toNumber(),
						paddingBottom: Indent.M.toNumber(),
					},
				},
				CardBanner({
					testId: TEST_ID,
					image: null,
					title: this.decision.title,
					description: this.decision.text,
					buttons: this.renderButtons(),
					hideCross: false,
					onClose: this.handleDismiss,
				}),
			);
		}
	}

	module.exports = { MessageGridMigrationBanner };
});
