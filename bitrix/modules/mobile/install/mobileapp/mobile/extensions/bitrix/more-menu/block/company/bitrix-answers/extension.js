/**
 * @module more-menu/block/company/bitrix-answers
 */
jn.define('more-menu/block/company/bitrix-answers', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc/ai');
	const { BitrixAnswersScreenOpener } = require('more-menu/block/company/bitrix-answers/screen');
	const { Color, Indent } = require('tokens');
	const { Card, CardCorner } = require('ui-system/layout/card');
	const { Text2, Text5 } = require('ui-system/typography/text');
	const { createTestIdGenerator } = require('utils/test');
	const { PropTypes } = require('utils/validation');

	const CARD_MIN_HEIGHT = 92;

	const BORDER_OPACITY = 0.35;

	// box repeats the mascot asset aspect ratio (348x289): `contain` centers the graphic, so in a taller
	// box the letterbox would lift it off the card edges instead of keeping it flush with them
	const MASCOT_WIDTH = 116;
	const MASCOT_HEIGHT = 96;

	// caption right inset from the mockup; the mascot box starts 6px earlier, but is transparent there
	const TEXT_MASCOT_INSET = 96;

	/**
	 * @extends {PureComponent<BitrixAnswersProps>}
	 */
	class BitrixAnswers extends PureComponent
	{
		/**
		 * @param {BitrixAnswersProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: props.testId });
		}

		render()
		{
			return Card(
				{
					testId: this.getTestId(),
					corner: CardCorner.L,
					border: true,
					// the same outline the card of the working day and the check-in wears in the menu, held
					// back a little: this card is the lightest surface of the section and a line at full
					// strength reads as a frame around it
					borderColor: Color.cardStrokeGradient1.toHex(BORDER_OPACITY),
					// no pressed state: `withPressed` only repaints `backgroundColor`, and the gradient is
					// painted over it
					onClick: () => this.#openScreen(),
					style: {
						minHeight: CARD_MIN_HEIGHT,
						// the card is taller than its captions, and without this the whole spare height lands
						// under them: the text would sit against the top padding with a gap twice as big below
						justifyContent: 'center',
						// the mascot is taller than the card: clip it by the card edge and by the rounded corner
						overflow: 'hidden',
						// The mockup axis runs from the top left corner to the bottom right one, 135deg.
						// What stands here is 45: the native angle is the css one with 0 pointing up
						// (checked on a simulator with an opaque probe), so this axis is not the one of
						// the mockup - left as it is rather than repainting the card along the way
						backgroundColorGradient: {
							start: Color.accentSoftBlue2.toHex(),
							end: Color.accentSoftBlue1.toHex(),
							angle: 45,
						},
					},
				},
				// out of the flow and pinned to the card edges past its paddings, so the card height comes
				// from the captions alone; rendered first to stay underneath them
				Image({
					testId: this.getTestId('image'),
					style: {
						position: 'absolute',
						right: 0,
						bottom: 0,
						width: MASCOT_WIDTH,
						height: MASCOT_HEIGHT,
					},
					resizeMode: 'contain',
					uri: makeLibraryImagePath('zephyr-answers.png', 'more-menu'),
				}),
				// the inset belongs to the wrapper: typography components pass `paddingRight` down to the
				// native text, where it does not narrow the line box, so the caption would run under the
				// mascot. The wrapper only carries the padding, so the card height still comes from the text
				View(
					{
						testId: this.getTestId('texts'),
						style: {
							paddingRight: TEXT_MASCOT_INSET,
						},
					},
					Text2({
						testId: this.getTestId('title'),
						text: Loc.getMessage('MORE_MENU_COMPANY_BITRIX_ANSWERS_TITLE'),
						color: Color.base1,
						accent: true,
					}),
					Text5({
						testId: this.getTestId('subtitle'),
						text: Loc.getMessage('MORE_MENU_COMPANY_BITRIX_ANSWERS_SUBTITLE'),
						color: Color.base2,
						style: {
							marginTop: Indent.XS.toNumber(),
						},
					}),
				),
			);
		}

		// The data of the block travels to the screen untouched, and the title is the phrase of the card.
		// An address the answer brought none of opens nothing - that rule belongs to the opener.
		#openScreen()
		{
			this.props.onCardClick?.();

			const { url, layout, canUseSupport, helpdeskUrl, supportBotId, analyticsSection } = this.props;

			void BitrixAnswersScreenOpener.open({
				url,
				title: Loc.getMessage('MORE_MENU_COMPANY_BITRIX_ANSWERS_TITLE'),
				parentWidget: layout,
				canUseSupport,
				helpdeskUrl,
				supportBotId,
				analyticsSection,
			});
		}
	}

	BitrixAnswers.propTypes = {
		testId: PropTypes.string.isRequired,
		// the section listens to the tap; nobody else mounting the card hands the handler over
		onCardClick: PropTypes.func,
		// the widget the card is drawn in: the screen of the answers opens inside it
		layout: PropTypes.object,
		// the data of the block: the page the screen opens and where the tap of support inside it goes
		url: PropTypes.string,
		supportBotId: PropTypes.number,
		helpdeskUrl: PropTypes.string,
		canUseSupport: PropTypes.bool,
		// the screen the card is drawn in; left out, the events of support carry no section
		analyticsSection: PropTypes.string,
	};

	module.exports = { BitrixAnswers };
});
