/**
 * @module timeman/layout/workday-intent-box-v3/src/intent-selection-slide
 */
jn.define('timeman/layout/workday-intent-box-v3/src/intent-selection-slide', (require, exports, module) => {
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
	const { Type } = require('type');
	const { Haptics } = require('haptics');
	const { useCallback } = require('utils/function');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { Feature } = require('stafftrack/feature');
	const { InlineCheckInForm } = require('stafftrack/layout/check-in-v3/inline-form');
	const { WorkdayIntentId } = require('timeman/workday-intent/workday-intent-id');
	const { AutoupdatingDate } = require('timeman/layout/workday-intent-box-v3/src/autoupdating-date');

	const HEADER_HEIGHT = 44;
	const DAY_DESCRIPTION_HEIGHT = 18;
	const INTENT_CHIP_ROW_HEIGHT = 50;
	// Chips of the statuses wrap by three per row on the widths the app supports, which is what the
	// mock shows for the five statuses the server sends. The estimate covers the first frame only:
	// the real height arrives from the layout, so a longer label or a narrower screen wrapping into
	// one more row costs a resize of the sheet, not a clipped row.
	const INTENT_CHIPS_PER_ROW = 3;
	const INTENT_CHIPS_MARGIN_VERTICAL = 40 - Indent.XL.toNumber() / 2;
	const FOOTER_HEIGHT = 96 + 2 * Indent.XL.toNumber();
	const BASE_CONTENT_HEIGHT = HEADER_HEIGHT
		+ DAY_DESCRIPTION_HEIGHT
		+ FOOTER_HEIGHT
		+ (2 * INTENT_CHIPS_MARGIN_VERTICAL);

	// States of the inline check-in block this slide names itself. Not a full mirror of the enum:
	// the stub and the ready states are left out because nothing here compares against them. Kept as
	// literals on purpose - the enum lives in an internal file of the check-in extension, and only
	// this slide has to know them: the box above passes the state through as an opaque token.
	const InlineBlockState = {
		HIDDEN: 'hidden',
		LOADING: 'loading',
	};

	class IntentSelectionSlide extends PureComponent
	{
		/**
		 * The chips of the statuses and the block of the first check-in are the variable
		 * terms of the height, so the sum is parametrized instead of getting more constants. Both
		 * are measured by whoever draws them - a row of chips that did not wrap and a preview of a
		 * message nobody can measure before the text is laid out. A non-working status leaves the
		 * block no place.
		 * @param {object} params
		 * @param {string} params.blockState state of the inline check-in block
		 * @param {boolean} params.isWorkdaySelected
		 * @param {number} [params.chipsContentHeight] height the layout gave the rows of chips
		 * @param {number} [params.blockContentHeight] height the block reported for itself
		 * @return {number}
		 */
		static getContentHeight({ blockState, isWorkdaySelected, chipsContentHeight, blockContentHeight })
		{
			const chips = Type.isNumber(chipsContentHeight) && chipsContentHeight > 0
				? chipsContentHeight
				: IntentSelectionSlide.getChipsContentHeightEstimate();

			const height = BASE_CONTENT_HEIGHT + chips;

			if (!isWorkdaySelected)
			{
				return height;
			}

			const block = Type.isNumber(blockContentHeight) && blockContentHeight > 0
				? blockContentHeight
				: InlineCheckInForm.getContentHeight(blockState);

			return height + block;
		}

		/**
		 * Height the rows of chips take before the layout reports the real one.
		 * @param {number} [intentCount] number of statuses the server sent
		 * @return {number}
		 */
		static getChipsContentHeightEstimate(intentCount = 0)
		{
			const rows = Math.max(1, Math.ceil(intentCount / INTENT_CHIPS_PER_ROW));

			return rows * INTENT_CHIP_ROW_HEIGHT;
		}

		/**
		 * The state the block starts in, needed before the component exists. Both conditions
		 * that hide the block count: without the map support check the sheet on such a device would
		 * open with a place for the block and collapse right after the mount - a visible jump exactly
		 * where no block is expected at all. The check is synchronous and needs no network.
		 * @param {boolean} isDayStartCheckInEnabled
		 * @return {string}
		 */
		static getStartBlockState(isDayStartCheckInEnabled)
		{
			const willShowBlock = isDayStartCheckInEnabled === true && Feature.isCheckinMapSupported();

			return willShowBlock ? InlineBlockState.LOADING : InlineBlockState.HIDDEN;
		}

		/**
		 * The primary button goes inactive only while an attachment of the check-in is still
		 * uploading - a check-in sent meanwhile would go without part of the files. The state of the
		 * block does not decide it: an upload started in the editor keeps running through
		 * 'work day -> absence -> work day', where the block reports itself hidden and then loading,
		 * and the start of the day would take the block for an optional one and drop the check-in
		 * together with the attachment. A non-working status sends no check-in at all, so an upload
		 * running under it blocks nothing.
		 * @param {object} params
		 * @param {boolean} params.hasUploadingFiles the block still has an attachment uploading
		 * @param {?string} params.intentId status selected on the slide
		 * @return {boolean}
		 */
		static isBlockedByUpload({ hasUploadingFiles, intentId })
		{
			return hasUploadingFiles === true && intentId === WorkdayIntentId.WORKDAY;
		}

		constructor(props)
		{
			super(props);

			this.onCheckInBlockStateChange = this.#onCheckInBlockStateChange.bind(this);
			this.onChipsLayout = this.#onChipsLayout.bind(this);

			// The layout answers on every frame, and every answer that repeats the previous
			// one would cost a resize of the sheet for nothing.
			this.chipsContentHeight = null;

			this.getTestId = createTestIdGenerator({
				context: this,
				prefix: 'intent-selection-content',
			});

			this.state = {
				intentId: props.preselectedIntentId,
				hasUploadingFiles: false,
			};
		}

		componentDidMount()
		{
			// The block has no intent prop and mounts as if the work day was selected, so a
			// preselected non-working status has to be reported once: without it the block would draw
			// itself for a status that must not have it at all.
			if (this.state.intentId !== WorkdayIntentId.WORKDAY)
			{
				this.props.onIntentChanged(this.state.intentId);
			}
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
							disabled: !this.#isAnyIntentSelected() || this.#isBlockedByUpload(),
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
					this.#renderCheckInBlock(),
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
						marginTop: INTENT_CHIPS_MARGIN_VERTICAL,
						marginBottom: INTENT_CHIPS_MARGIN_VERTICAL,
					},
					testId: this.getTestId('intent-chips-container'),
					onLayout: this.onChipsLayout,
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

		/**
		 * The block hides itself for a non-working status, so it stays mounted through the whole life
		 * of the slide: an unmount would drop the draft of the description.
		 */
		#renderCheckInBlock()
		{
			const {
				parentWidget,
				isDayStartCheckInEnabled,
				checkInBlockRef,
				onDescriptionEditorToggle,
			} = this.props;

			return new InlineCheckInForm({
				parentWidget,
				isDayStartCheckInEnabled,
				testId: this.getTestId(),
				ref: checkInBlockRef,
				onStateChange: this.onCheckInBlockStateChange,
				onDescriptionEditorToggle,
			});
		}

		/**
		 * @param {{ height: number }} layout size the platform gave the rows of chips
		 */
		#onChipsLayout({ height })
		{
			if (!Type.isNumber(height) || height <= 0 || height === this.chipsContentHeight)
			{
				return;
			}

			this.chipsContentHeight = height;
			this.props.onChipsContentHeightChange(height);
		}

		/**
		 * @param {{ state: string, isReady: boolean, hasUploadingFiles: boolean, contentHeight: number }} payload
		 *   state of the inline check-in block
		 */
		#onCheckInBlockStateChange({ state, hasUploadingFiles, contentHeight })
		{
			// Only the running upload is kept: neither a missing geo access nor a failed snapshot
			// blocks the start of the work day, and the text of the button never changes.
			this.setState({ hasUploadingFiles: hasUploadingFiles === true });

			this.props.onCheckInBlockStateChange(state, contentHeight);
		}

		#onIntentChipClick(id)
		{
			Haptics.impactLight();

			const intentId = this.#isIntentSelected(id) ? null : id;

			this.setState({ intentId });
			this.props.onIntentChanged(intentId);
		}

		#onSendIntentButtonClick()
		{
			const { isSending, onIntentSent } = this.props;

			if (!isSending && !this.#isBlockedByUpload())
			{
				onIntentSent(this.state.intentId);
			}
		}

		#isBlockedByUpload()
		{
			return IntentSelectionSlide.isBlockedByUpload({
				hasUploadingFiles: this.state.hasUploadingFiles,
				intentId: this.state.intentId,
			});
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
			Haptics.notifySuccess();
			this.props.parentWidget.close();
		}
	}

	IntentSelectionSlide.defaultProps = {
		isSending: false,
		isDayStartCheckInEnabled: false,
		parentWidget: PageManager,
		preselectedIntentId: WorkdayIntentId.WORKDAY,
	};

	IntentSelectionSlide.propTypes = {
		isSending: PropTypes.bool,
		isDayStartCheckInEnabled: PropTypes.bool,
		intentList: PropTypes.arrayOf(
			PropTypes.shape({
				id: PropTypes.string.isRequired,
				label: PropTypes.string.isRequired,
			}),
		).isRequired,
		checkInBlockRef: PropTypes.func.isRequired,
		onIntentSent: PropTypes.func.isRequired,
		onIntentChanged: PropTypes.func.isRequired,
		onCheckInBlockStateChange: PropTypes.func.isRequired,
		onChipsContentHeightChange: PropTypes.func.isRequired,
		onDescriptionEditorToggle: PropTypes.func.isRequired,
		testId: PropTypes.string.isRequired,
		parentWidget: PropTypes.object,
		preselectedIntentId: PropTypes.string,
	};

	module.exports = { IntentSelectionSlide };
});
