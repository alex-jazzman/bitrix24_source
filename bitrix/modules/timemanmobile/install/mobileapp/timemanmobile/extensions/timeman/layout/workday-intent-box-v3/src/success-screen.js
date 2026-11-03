/**
 * @module timeman/layout/workday-intent-box-v3/src/success-screen
 */
jn.define('timeman/layout/workday-intent-box-v3/src/success-screen', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons/button');
	const { BadgeCounter, BadgeCounterDesign } = require('ui-system/blocks/badges/counter');
	const {
		ChipButton,
		ChipButtonSize,
		ChipButtonDesign,
		ChipButtonMode,
	} = require('ui-system/blocks/chips/chip-button');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc/ai');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { Entry } = require('stafftrack/entry');
	const { StatusBox } = require('timeman/layout/workday-intent-box-v3/src/status-box');
	const { WorkdayIntentId } = require('timeman/workday-intent/workday-intent-id');
	const { getMonthShiftCount } = require('timeman/layout/workday-intent-box-v3/src/api');

	const FADE_DURATION = 300;
	const ICON_SIZE = 20;

	// The tab id is taken as a literal: the namespace of the tabs is not exported on purpose
	const WORK_DAYS_TAB_ID = 'work-days';

	class SuccessScreen extends PureComponent
	{
		static getContentHeight(intentId, chatIdWithAiAdvice, hasShiftsChip = false)
		{
			const hasBanner = SuccessScreen.isWithChat(intentId, chatIdWithAiAdvice);

			return StatusBox.getContentHeight({
				hasGpt: hasBanner,
				hasTitle: true,
				hasChip: hasShiftsChip,
			});
		}

		static isWithChat(intentId, chatIdWithAiAdvice)
		{
			return intentId === WorkdayIntentId.WORKDAY && chatIdWithAiAdvice > 0;
		}

		/**
		 * The counter of the shifts outlives the screen itself: a swipe closes the box before the
		 * answer arrives, and neither the state nor the height of a closed sheet has anyone to change.
		 */
		#isUnmounted = false;

		constructor(props)
		{
			super(props);

			this.state = {
				shiftCount: 0,
			};

			this.getTestId = createTestIdGenerator({
				context: this,
				prefix: 'success-screen',
			});
		}

		componentDidMount()
		{
			// only a request made on show counts the shift this very confirmation has started
			void this.#loadShiftCount();
		}

		componentWillUnmount()
		{
			this.#isUnmounted = true;
		}

		fadeIn()
		{
			this.statusBoxRef?.fadeIn();
		}

		fadeOut()
		{
			return new Promise((resolve) => {
				this.statusBoxRef?.fadeOut();
				setTimeout(() => resolve(), FADE_DURATION);
			});
		}

		render()
		{
			const { intentId, intentImage, parentWidget } = this.props;

			return new StatusBox({
				style: {
					opacity: 0,
				},
				header: this.#getHeader(),
				title: Loc.getMessage(`TIMEMANMOBILE_SUCCESS_SCREEN_TITLE_${intentId}`),
				imageUri: intentImage,
				showConfetti: intentId !== WorkdayIntentId.LEAVESICK,
				buttons: [
					this.#isWithChat() && Button({
						text: Loc.getMessage('TIMEMANMOBILE_V3_SUCCESS_SCREEN_BUTTON_SHOW_ADVICE'),
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
				chip: this.#renderShiftsChip(),
				banner: this.#isWithChat() ? this.#getBannerProps() : null,
				testId: 'welcome-box-v3-confirmation',
				ref: (ref) => {
					this.statusBoxRef = ref;
				},
			});
		}

		/**
		 * The header of the original was common to every status, so the work day gets its own text
		 * here and the non-working statuses keep the previous one.
		 *
		 * @return {string}
		 */
		#getHeader()
		{
			const { intentId } = this.props;

			return intentId === WorkdayIntentId.WORKDAY
				? Loc.getMessage('TIMEMANMOBILE_V3_SUCCESS_SCREEN_HEADER_WORKDAY')
				: Loc.getMessage('TIMEMANMOBILE_SUCCESS_SCREEN_HEADER');
		}

		#renderShiftsChip()
		{
			const { shiftCount } = this.state;

			if (shiftCount <= 0)
			{
				return null;
			}

			return ChipButton({
				text: Loc.getMessage('TIMEMANMOBILE_V3_SUCCESS_SCREEN_SHIFTS_CHIP', {
					'#MONTH#': Loc.getMessage(`MOBILE_MONTH_${new Date().getMonth()}_NOMINATIVE`),
				}),
				icon: Icon.CALENDAR,
				size: ChipButtonSize.M,
				design: ChipButtonDesign.PRIMARY,
				mode: ChipButtonMode.OUTLINE,
				badge: this.#renderShiftsChipCounter(shiftCount),
				testId: this.getTestId('shifts-chip'),
				onClick: () => this.#onShiftsChipClick(),
			});
		}

		#renderShiftsChipCounter(shiftCount)
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				BadgeCounter({
					value: shiftCount,
					design: BadgeCounterDesign.SUCCESS,
					testId: this.getTestId('shifts-chip-counter'),
				}),
				IconView({
					icon: Icon.CHEVRON_TO_THE_RIGHT_SIZE_S,
					color: Color.accentMainPrimary,
					size: ICON_SIZE,
					style: {
						marginLeft: Indent.XS2.toNumber(),
					},
					testId: this.getTestId('shifts-chip-chevron'),
				}),
			);
		}

		async #loadShiftCount()
		{
			const { intentId, onShiftsChipShown } = this.props;

			if (intentId !== WorkdayIntentId.WORKDAY)
			{
				return;
			}

			const shiftCount = await getMonthShiftCount();

			if (this.#isUnmounted)
			{
				return;
			}

			// no counter, no rights or no shifts leave the congratulation without the chip; there is
			// neither a retry nor an error state
			if (shiftCount <= 0)
			{
				return;
			}

			// the box owns the height of the sheet, so it grows before the chip is on the screen
			onShiftsChipShown?.();
			this.setState({ shiftCount });
		}

		#getBannerProps()
		{
			return {
				hasGpt: true,
				text: Loc.getMessage(
					'TIMEMANMOBILE_V3_SUCCESS_SCREEN_AI_ADVICE_TEXT',
					{
						'#BBCODE_START#': `[COLOR=${Color.copilotAccentLess2.toHex()}][B]`,
						'#BBCODE_END#': '[/B][/COLOR]',
					},
				),
			};
		}

		#onShowAdviceButtonClick()
		{
			const { parentWidget, chatIdWithAiAdvice } = this.props;

			parentWidget.close(() => {
				BX.postComponentEvent(
					'workday-intent-box.onChatOpen',
					[{ dialogId: String(chatIdWithAiAdvice) }],
				);
			});
		}

		#onShiftsChipClick()
		{
			const { parentWidget } = this.props;

			// the box first, the tab second: an entry unfolding under an open box is what the order guards
			parentWidget.close(() => Entry.openCheckInTab(WORK_DAYS_TAB_ID));
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
		onShiftsChipShown: PropTypes.func,
	};

	module.exports = { SuccessScreen };
});
