/**
 * @module timeman/layout/workday-intent-box/src/success-screen
 */
jn.define('timeman/layout/workday-intent-box/src/success-screen', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons/button');
	const { Color } = require('tokens');
	const { Loc } = require('loc/ai');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { StatusBox } = require('timeman/layout/status-box');
	const { WorkdayIntentId } = require('timeman/workday-intent/workday-intent-id');
	const { StartDayPopupAnalytics } = require('timeman/workday-intent/analytics');

	class SuccessScreen extends PureComponent
	{
		static getContentHeight(intentId, chatIdWithAiAdvice)
		{
			const hasBanner = SuccessScreen.isWithChat(intentId, chatIdWithAiAdvice);

			return StatusBox.getContentHeight({ hasAutoReport: hasBanner, hasTitle: true });
		}

		static isWithChat(intentId, chatIdWithAiAdvice)
		{
			return intentId === WorkdayIntentId.WORKDAY && chatIdWithAiAdvice > 0;
		}

		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				context: this,
				prefix: 'success-screen',
			});
		}

		fadeIn()
		{
			this.statusBoxRef?.fadeIn();
		}

		render()
		{
			const { intentId, intentImage, parentWidget } = this.props;

			return new StatusBox({
				style: {
					opacity: 0,
				},
				header: Loc.getMessage('TIMEMANMOBILE_SUCCESS_SCREEN_HEADER'),
				title: Loc.getMessage(`TIMEMANMOBILE_SUCCESS_SCREEN_TITLE_${intentId}`),
				imageUri: intentImage,
				showConfetti: intentId !== WorkdayIntentId.LEAVESICK,
				buttons: [
					this.#isWithChat() && Button({
						text: Loc.getMessage('TIMEMANMOBILE_SUCCESS_SCREEN_BUTTON_SHOW_ADVICE'),
						size: ButtonSize.L,
						design: ButtonDesign.FILLED,
						stretched: true,
						testId: this.getTestId('show-ai-advice-button'),
						onClick: () => this.#onShowAdviceButtonClick(),
					}),
					!this.#isWithChat() && Button({
						text: Loc.getMessage('TIMEMANMOBILE_SUCCESS_SCREEN_BUTTON_CLOSE'),
						size: ButtonSize.L,
						design: ButtonDesign.FILLED,
						stretched: true,
						testId: this.getTestId('ok-button'),
						onClick: () => parentWidget.close(),
					}),
				],
				parentWidget,
				banner: this.#isWithChat() ? this.#getBannerProps() : null,
				testId: 'success-screen',
				ref: (ref) => {
					this.statusBoxRef = ref;
				},
			});
		}

		#getBannerProps()
		{
			return {
				text: Loc.getMessage(
					'TIMEMANMOBILE_SUCCESS_SCREEN_AI_ADVICE_TEXT',
					{
						'#BBCODE_START#': `[COLOR=${Color.copilotAccentLess2.toHex()}][B]`,
						'#BBCODE_END#': '[/B][/COLOR]',
					},
				),
			};
		}

		#onShowAdviceButtonClick()
		{
			StartDayPopupAnalytics.sendAdviceClick();

			const { parentWidget, chatIdWithAiAdvice } = this.props;

			parentWidget.close(() => {
				BX.postComponentEvent(
					'workday-intent-box.onChatOpen',
					[{ dialogId: String(chatIdWithAiAdvice) }],
				);
			});
		}

		#isWithChat()
		{
			const { intentId, chatIdWithAiAdvice } = this.props;

			return SuccessScreen.isWithChat(intentId, chatIdWithAiAdvice);
		}
	}

	SuccessScreen.defaultProps = {
		chatIdWithAiAdvice: 0,
		parentWidget: PageManager,
	};

	SuccessScreen.propTypes = {
		intentId: PropTypes.string.isRequired,
		intentImage: PropTypes.string.isRequired,
		chatIdWithAiAdvice: PropTypes.number,
		testId: PropTypes.string.isRequired,
		parentWidget: PropTypes.object,
	};

	module.exports = { SuccessScreen };
});
