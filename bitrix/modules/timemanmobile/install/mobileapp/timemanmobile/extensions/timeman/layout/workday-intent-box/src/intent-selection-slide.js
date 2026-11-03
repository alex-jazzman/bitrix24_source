/**
 * @module timeman/layout/workday-intent-box/src/intent-selection-slide
 */
jn.define('timeman/layout/workday-intent-box/src/intent-selection-slide', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons/button');
	const {
		ChipButton,
		ChipButtonSize,
		ChipButtonDesign,
		ChipButtonMode,
	} = require('ui-system/blocks/chips/chip-button');
	const { H3 } = require('ui-system/typography/heading');
	const { Component, Indent } = require('tokens');
	const { Loc } = require('loc');
	const { Haptics } = require('haptics');
	const { useCallback } = require('utils/function');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { WorkdayIntentId } = require('timeman/workday-intent/workday-intent-id');
	const { StartDayPopupAnalytics } = require('timeman/workday-intent/analytics');
	const { AutoupdatingDate } = require('timeman/layout/workday-intent-box/src/autoupdating-date');

	const HEADER_HEIGHT = 44;
	const DAY_DESCRIPTION_HEIGHT = 18;
	const INTENT_CHIPS_HEIGHT = (
		40 - Indent.XL.toNumber() / 2 // top margin
		+ 40 - Indent.XL.toNumber() / 2 // bottom margin
		+ 3 * 50 // 3 rows of chips
	);
	const FOOTER_HEIGHT = 96 + 2 * Indent.XL.toNumber();

	class IntentSelectionSlide extends PureComponent
	{
		static getContentHeight()
		{
			return HEADER_HEIGHT + DAY_DESCRIPTION_HEIGHT + INTENT_CHIPS_HEIGHT + FOOTER_HEIGHT;
		}

		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				context: this,
				prefix: 'intent-selection-content',
			});

			this.state = {
				intentId: props.preselectedIntentId,
			};
		}

		render()
		{
			const { isSending } = this.props;

			return Box(
				{
					safeArea: {
						bottom: true,
					},
					footer: BoxFooter(
						{
							testId: this.getTestId('footer'),
						},
						Button({
							text: (
								this.#isAnyIntentSelected()
									? Loc.getMessage(`TIMEMANMOBILE_INTENT_SELECTION_BUTTON_${this.state.intentId}`)
									: Loc.getMessage(`TIMEMANMOBILE_INTENT_SELECTION_BUTTON_${WorkdayIntentId.WORKDAY}`)
							),
							size: ButtonSize.L,
							design: ButtonDesign.FILLED,
							stretched: true,
							disabled: !this.#isAnyIntentSelected(),
							loading: isSending,
							testId: this.getTestId('send-intent-button'),
							onClick: () => this.#onSendIntentButtonClick(),
						}),
						Button({
							style: {
								marginTop: Indent.XL.toNumber(),
							},
							text: Loc.getMessage('TIMEMANMOBILE_INTENT_SELECTION_BUTTON_REMIND_LATER'),
							size: ButtonSize.L,
							design: ButtonDesign.OUTLINE,
							stretched: true,
							disabled: isSending,
							testId: this.getTestId('remind-later-button'),
							onClick: () => this.#close(),
						}),
					),
					testId: this.getTestId('container'),
				},
				View(
					{
						style: {
							marginHorizontal: Component.paddingLr.toNumber(),
						},
					},
					this.#renderHeader(),
					this.#renderDayDescription(),
					this.#renderIntentChips(),
				),
			);
		}

		#renderHeader()
		{
			return H3({
				style: {
					height: HEADER_HEIGHT,
					textAlign: 'center',
				},
				text: Loc.getMessage('TIMEMANMOBILE_WORKDAY_INTENT_BOX_TITLE'),
				testId: this.getTestId('header-field'),
			});
		}

		#renderDayDescription()
		{
			return View(
				{
					style: {
						height: DAY_DESCRIPTION_HEIGHT,
						alignItems: 'center',
						justifyContent: 'flex-end',
					},
				},
				new AutoupdatingDate({ testId: this.getTestId('day-description-datetime') }),
			);
		}

		#renderIntentChips()
		{
			const { intentList, isSending } = this.props;

			return View(
				{
					style: {
						flexDirection: 'row',
						flexWrap: 'wrap',
						justifyContent: 'center',
						alignContent: 'center',
						alignItems: 'center',
						height: INTENT_CHIPS_HEIGHT,
					},
					testId: this.getTestId('intent-chips-container'),
				},
				...Object.values(intentList).map((intent) => {
					const isSelected = this.#isIntentSelected(intent.id);

					return ChipButton({
						style: {
							padding: Indent.XL.toNumber() / 2,
						},
						text: intent.label,
						rounded: false,
						size: ChipButtonSize.L,
						disabled: isSending,
						design: (
							this.#isAnyIntentSelected() && !isSelected
								? ChipButtonDesign.BLACK
								: ChipButtonDesign.PRIMARY
						),
						mode: isSelected ? ChipButtonMode.SOLID : ChipButtonMode.OUTLINE,
						testId: this.getTestId(`intent-chip-${intent.id}`),
						onClick: useCallback(() => this.#onIntentChipClick(intent.id)),
					});
				}),
			);
		}

		#onIntentChipClick(id)
		{
			Haptics.impactLight();
			this.setState({ intentId: this.#isIntentSelected(id) ? null : id });
		}

		#onSendIntentButtonClick()
		{
			const { isSending, onIntentSent } = this.props;

			if (!isSending)
			{
				onIntentSent(this.state.intentId);
			}
		}

		#isIntentSelected(id)
		{
			return this.state.intentId === id;
		}

		#isAnyIntentSelected()
		{
			return this.state.intentId !== null;
		}

		#close()
		{
			StartDayPopupAnalytics.sendRemindLater();
			Haptics.notifySuccess();
			this.props.parentWidget.close();
		}
	}

	IntentSelectionSlide.defaultProps = {
		isSending: false,
		parentWidget: PageManager,
		preselectedIntentId: WorkdayIntentId.WORKDAY,
	};

	IntentSelectionSlide.propTypes = {
		isSending: PropTypes.bool,
		intentList: PropTypes.arrayOf(
			PropTypes.shape({
				id: PropTypes.string.isRequired,
				label: PropTypes.string.isRequired,
			}),
		).isRequired,
		onIntentSent: PropTypes.func.isRequired,
		testId: PropTypes.string.isRequired,
		parentWidget: PropTypes.object,
		preselectedIntentId: PropTypes.string,
	};

	module.exports = { IntentSelectionSlide };
});
