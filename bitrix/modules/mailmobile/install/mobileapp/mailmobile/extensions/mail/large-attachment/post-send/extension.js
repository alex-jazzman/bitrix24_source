/**
 * @module mail/large-attachment/post-send
 */
jn.define('mail/large-attachment/post-send', (require, exports, module) => {
	const { BottomSheet } = require('bottom-sheet');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Checkbox } = require('ui-system/form/checkbox');
	const { Text3, Text4 } = require('ui-system/typography/text');
	const { LargeAttachmentErrorState, runWithConcurrencyLimit } = require('mail/large-attachment/connector');
	const { LARGE_ATTACHMENT_USER_OPTION_CATEGORY } = require('mail/large-attachment');

	const PostSendChoice = Object.freeze({
		keep: 'keep',
		delete: 'delete',
	});

	const CHECKBOX_SIZE = 20;
	const SHEET_POSITION_PERCENT = 40;
	const SHEET_CLOSE_EVENTS = ['onViewHidden', 'onViewRemoved'];

	/**
	 * The offer to decide what happens to a file whose address the person removed from the letter. The
	 * letter has already been sent: neither closing the sheet nor keeping the file undoes the send, and a
	 * sheet that was never shown means the file stays.
	 *
	 * @extends {LayoutComponent<LargeAttachmentPostSendProps, LargeAttachmentPostSendState>}
	 */
	class LargeAttachmentPostSend extends LayoutComponent
	{
		/**
		 * @param {LargeAttachmentPostSendParams} params
		 * @return {boolean} whether the completion of the sheet is going to be reported to `onComplete`
		 */
		static show(params = {})
		{
			const sets = (Array.isArray(params.sets) ? params.sets : [])
				.filter((set) => String(set?.token ?? '') !== '')
			;
			if (sets.length === 0 || params.suppressed === true)
			{
				return false;
			}

			let completed = false;
			const complete = () => {
				if (completed)
				{
					return;
				}

				completed = true;
				params.onComplete?.();
			};

			const bottomSheet = new BottomSheet({
				titleParams: {
					text: Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_POST_SEND_TITLE'),
					type: 'dialog',
				},
				component: (widget) => new LargeAttachmentPostSend({
					testId: 'mail-large-attachment-post-send',
					onChoice: (choice, dontAskAgain) => {
						void LargeAttachmentPostSend.applyChoice({
							choice,
							dontAskAgain,
							sets,
							connector: params.connector,
							optionName: params.optionName,
						}).finally(() => {
							widget.close();
							complete();
						});
					},
				}),
			});

			try
			{
				const opening = bottomSheet
					.setParentWidget(LargeAttachmentPostSend.watchOpening(params.parentWidget, complete))
					.setMediumPositionPercent(SHEET_POSITION_PERCENT)
					.setBackgroundColor(Color.bgContentPrimary.toHex())
					.setNavigationBarColor(Color.bgContentPrimary.toHex())
					.open()
				;
				// a throw inside the opening reaches this promise instead of the caller
				Promise.resolve(opening).catch(complete);
			}
			catch (error)
			{
				// the send chain has already reported success: an opening that fails loudly must not
				// turn into a failure of the send
				complete();

				return false;
			}

			return true;
		}

		/**
		 * The letter is already sent, so the form waits for the sheet instead of closing itself, and a sheet
		 * that never reports back leaves the form on screen forever. `BottomSheet.open()` cannot report a
		 * failure: it logs a rejected `openWidget` and leaves its own promise unsettled, so the outcome of
		 * the opening is visible only at the call to the parent widget.
		 *
		 * The delegate watches that call on a branch of its own and hands the original promise back
		 * untouched, so nothing about the opening changes: the sheet that appeared gets the completion
		 * bound to its closing, the sheet that never appeared completes at once.
		 *
		 * @param {Object} parentWidget
		 * @param {function} complete
		 * @return {{ openWidget: function }}
		 */
		static watchOpening(parentWidget, complete)
		{
			const opener = parentWidget ?? PageManager;

			return {
				openWidget: (...args) => {
					const opening = opener.openWidget(...args);

					Promise.resolve(opening).then(
						(widget) => SHEET_CLOSE_EVENTS.forEach((eventName) => widget?.on?.(eventName, complete)),
						complete,
					);

					return opening;
				},
			};
		}

		/**
		 * Keeping is the default, so only an explicit removal touches the Disk. The mark of the one-time
		 * decision is written whichever the choice was: it is about the question, not about the answer.
		 *
		 * The offer is about every set the letter left no address of, so the removals go out under the cap of
		 * the scenario. Neither the mark nor a removal may refuse: the letter is sent already, and the sheet
		 * closes whatever the Disk answered.
		 *
		 * @param {LargeAttachmentPostSendChoiceParams} params
		 * @return {Promise<void>}
		 */
		static applyChoice(params = {})
		{
			const tasks = [];

			if (params.dontAskAgain === true)
			{
				tasks.push(() => LargeAttachmentPostSend.suppressPrompt(params.connector, params.optionName));
			}

			if (params.choice === PostSendChoice.delete)
			{
				(Array.isArray(params.sets) ? params.sets : []).forEach((set) => {
					tasks.push(() => params.connector.deleteUploaded({ token: set.token }).catch(() => false));
				});
			}

			return runWithConcurrencyLimit(tasks).then(() => {});
		}

		/**
		 * @param {Object} connector
		 * @param {string} optionName
		 * @return {Promise<boolean>}
		 */
		static suppressPrompt(connector, optionName)
		{
			if (!connector || String(optionName ?? '') === '')
			{
				return Promise.resolve(false);
			}

			return connector
				.saveUserOption({
					category: LARGE_ATTACHMENT_USER_OPTION_CATEGORY,
					name: optionName,
					value: 'Y',
				})
				.catch(() => false)
			;
		}

		/**
		 * A failure of the scenario told in plain words. No failure resets the text of the letter.
		 *
		 * @param {{ state?: string }} error
		 * @return {string}
		 */
		static getErrorMessage(error)
		{
			switch (error?.state)
			{
				case LargeAttachmentErrorState.tariffUnavailable:
					return Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_ERROR_TARIFF');
				case LargeAttachmentErrorState.noSpace:
					return Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_ERROR_NO_SPACE');
				case LargeAttachmentErrorState.accessDenied:
					return Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_ERROR_ACCESS');
				case LargeAttachmentErrorState.unavailable:
					return Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_ERROR_UNAVAILABLE');
				default:
					return Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_ERROR_COMMON');
			}
		}

		/**
		 * @param {LargeAttachmentPostSendProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = { dontAskAgain: false };
			this.handleDontAskAgain = this.handleDontAskAgain.bind(this);
		}

		handleDontAskAgain()
		{
			this.setState({ dontAskAgain: !this.state.dontAskAgain });
		}

		choose(choice)
		{
			this.props.onChoice?.(choice, this.state.dontAskAgain);
		}

		render()
		{
			const testId = this.props.testId;

			return View(
				{
					testId,
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingTop: Indent.XL.toNumber(),
						paddingBottom: Indent.XL4.toNumber(),
					},
				},
				Text3({
					testId: `${testId}-text`,
					text: Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_POST_SEND_TEXT'),
					color: Color.base2,
				}),
				this.renderDontAskAgain(),
				this.renderButtons(),
			);
		}

		renderDontAskAgain()
		{
			const testId = this.props.testId;

			return View(
				{
					testId: `${testId}-dont-ask`,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingTop: Indent.XL2.toNumber(),
						paddingBottom: Indent.XL2.toNumber(),
					},
					onClick: this.handleDontAskAgain,
				},
				new Checkbox({
					testId: `${testId}-checkbox`,
					size: CHECKBOX_SIZE,
					checked: this.state.dontAskAgain,
					useState: false,
				}),
				View(
					{
						style: { paddingLeft: Indent.M.toNumber() },
					},
					Text4({
						testId: `${testId}-dont-ask-text`,
						text: Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_POST_SEND_DONT_ASK'),
						color: Color.base2,
					}),
				),
			);
		}

		renderButtons()
		{
			const testId = this.props.testId;

			return View(
				{
					style: { flexDirection: 'column' },
				},
				Button({
					testId: `${testId}-delete-button`,
					text: Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_POST_SEND_DELETE'),
					design: ButtonDesign.FILLED,
					size: ButtonSize.L,
					stretched: true,
					onClick: () => this.choose(PostSendChoice.delete),
				}),
				View(
					{
						style: { paddingTop: Indent.M.toNumber() },
					},
					Button({
						testId: `${testId}-keep-button`,
						text: Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_POST_SEND_KEEP'),
						design: ButtonDesign.PLAIN,
						size: ButtonSize.L,
						stretched: true,
						onClick: () => this.choose(PostSendChoice.keep),
					}),
				),
			);
		}
	}

	module.exports = { LargeAttachmentPostSend, PostSendChoice };
});
