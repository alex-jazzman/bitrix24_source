/**
 * @module timeman/layout/workday-intent-box-v3
 */
jn.define('timeman/layout/workday-intent-box-v3', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { downloadImages, makeLibraryImagePath } = require('asset-manager');
	const { confirmClosing } = require('alert');
	const { Haptics } = require('haptics');
	const { Loc } = require('loc');
	const { PropTypes } = require('utils/validation');
	const { WorkdayIntentId } = require('timeman/workday-intent/workday-intent-id');
	const { SuccessScreen } = require('timeman/layout/workday-intent-box-v3/src/success-screen');
	const { IntentScreen } = require('timeman/layout/workday-intent-box-v3/src/intent-screen');

	const ContentId = {
		INTENT_SCREEN: 'intentScreen',
		SUCCESS_SCREEN: 'successScreen',
	};

	const makeIntentImagePath = (intentId) => {
		return makeLibraryImagePath(
			`${intentId.toLowerCase()}.png`,
			'intent',
			'timeman',
			false,
		);
	};

	class WorkdayIntentBox extends PureComponent
	{
		/**
		 * Height the sheet was last asked for. Null means the height of the sheet is not known to be
		 * the one of the box: the first frame was reserved before the component existed, and around
		 * the editor of the description the height belongs to the native adopt of the keyboard.
		 * @type {?number}
		 */
		#appliedBottomSheetHeight = null;

		/**
		 * @param {{ isDayStartCheckInEnabled?: boolean, preselectedIntentId?: string,
		 *   intentList?: Array }} [data] data of the box, read before the component is created to
		 *   reserve the height of the first frame
		 */
		static getWidgetParams(data)
		{
			const startBlockState = IntentScreen.getStartBlockState(data?.isDayStartCheckInEnabled);
			// an absent status is the work day for the component too (defaultProps below)
			const preselectedIntentId = data?.preselectedIntentId ?? WorkdayIntentId.WORKDAY;

			return {
				modal: true,
				backdrop: {
					hideNavigationBar: true,
					// The place of the block belongs to the first frame only for a preselected
					// work day. The server preselects a non-working status when the date is already
					// marked as an absence or is a day off, and the block has nothing to show there -
					// reserving its place would cost a visible jump right after the mount. The rows of
					// chips are estimated by the number of statuses until the layout reports them.
					mediumPositionHeight: IntentScreen.getContentHeight({
						blockState: startBlockState,
						isWorkdaySelected: preselectedIntentId === WorkdayIntentId.WORKDAY,
						chipsContentHeight: IntentScreen.getChipsContentHeightEstimate(data?.intentList?.length),
					}),
					onlyMediumPosition: true,
					horizontalSwipeAllowed: false,
					adoptHeightByKeyboard: true,
				},
			};
		}

		constructor(props)
		{
			super(props);

			this.bindIntentScreenRef = this.#bindIntentScreenRef.bind(this);
			this.bindSuccessScreenRef = this.#bindSuccessScreenRef.bind(this);
			this.onIntentSent = this.#onIntentSent.bind(this);
			this.onWorkdayStarted = this.#onWorkdayStarted.bind(this);
			this.onIntentChanged = this.#onIntentChanged.bind(this);
			this.onCheckInBlockStateChange = this.#onCheckInBlockStateChange.bind(this);
			this.onChipsContentHeightChange = this.#onChipsContentHeightChange.bind(this);
			this.onDescriptionEditorToggle = this.#onDescriptionEditorToggle.bind(this);
			this.onPreventDismiss = this.#onPreventDismiss.bind(this);
			this.onShiftsChipShown = this.#onShiftsChipShown.bind(this);

			this.preselectedIntentId = this.#getPreselectedIntentId();

			// Inputs of the height of the sheet. All start as the reserved height of the first frame did; the slide
			// reports the selected status right after the mount and the height of its rows of chips
			// from the layout, the block - its state and its own height through onStateChange. The
			// render does not depend on them, so they are kept out of the state.
			this.blockState = IntentScreen.getStartBlockState(props.isDayStartCheckInEnabled);
			this.isWorkdaySelected = this.preselectedIntentId === WorkdayIntentId.WORKDAY;
			this.chipsContentHeight = IntentScreen.getChipsContentHeightEstimate(props.intentList?.length);
			this.blockContentHeight = null;

			this.hasPostedTargetAction = false;

			// the counter of the confirmation arrives after the mount, so the chip is another input
			// of the height and lives next to the other inputs
			this.hasShiftsChip = false;

			this.state = {
				contentId: ContentId.INTENT_SCREEN,
				intentId: this.preselectedIntentId,
			};

			void downloadImages([
				makeLibraryImagePath('confetti.svg', 'graphic'),
				...Object.values(WorkdayIntentId).map((intentId) => makeIntentImagePath(intentId)),
			]);
		}

		componentDidMount()
		{
			const { parentWidget } = this.props;

			// Without this the swipe down closes the widget silently and there is nothing left to
			// intercept, so the unsaved check-in input would be lost without a question.
			parentWidget.preventBottomSheetDismiss(true);
			parentWidget.on('preventDismiss', this.onPreventDismiss);
		}

		componentWillUnmount()
		{
			this.props.parentWidget.off('preventDismiss', this.onPreventDismiss);
		}

		render()
		{
			switch (this.state.contentId)
			{
				case ContentId.INTENT_SCREEN:
					return this.#renderSelectionScreen();

				case ContentId.SUCCESS_SCREEN:
					return this.#renderSuccessScreen();

				default:
					return null;
			}
		}

		#renderSelectionScreen()
		{
			const { intentList, shifts, parentWidget, isDayStartCheckInEnabled } = this.props;

			return new IntentScreen({
				intentList,
				shifts,
				parentWidget,
				isDayStartCheckInEnabled,
				preselectedIntentId: this.preselectedIntentId,
				testId: 'welcome-box-v3',
				ref: this.bindIntentScreenRef,
				onIntentSent: this.onIntentSent,
				onWorkdayStarted: this.onWorkdayStarted,
				onIntentChanged: this.onIntentChanged,
				onCheckInBlockStateChange: this.onCheckInBlockStateChange,
				onChipsContentHeightChange: this.onChipsContentHeightChange,
				onDescriptionEditorToggle: this.onDescriptionEditorToggle,
			});
		}

		#renderSuccessScreen()
		{
			const { chatIdWithAiAdvice, parentWidget } = this.props;
			const { intentId } = this.state;

			return new SuccessScreen({
				chatIdWithAiAdvice,
				parentWidget,
				intentId,
				intentImage: makeIntentImagePath(intentId),
				testId: 'welcome-box-v3',
				ref: this.bindSuccessScreenRef,
				onShiftsChipShown: this.onShiftsChipShown,
			});
		}

		#onIntentSent(intentId)
		{
			// Invariant: the outcome of the period MUST be posted before any await and before the
			// success-screen. The opener synchronously sets sessionHasTargetAction on it earlier than
			// onViewRemoved (close) arrives, which is what guards against a double outcome
			// (targetAction + dismiss). For a non-working status this is still the first statement of
			// the confirmation. For WORKDAY the confirmation is no longer a single step: the box gets
			// here only after both the work day start and the check-in, so the event has already been
			// posted right after the confirmed start and the latch below keeps it single.
			this.#postTargetAction(intentId);

			this.setState({ intentId }, () => {
				if (intentId !== WorkdayIntentId.WORKDAY)
				{
					// Kept for backward compatibility with external subscribers.
					BX.postComponentEvent('workday-intent-box.onAbsenceAdded');
				}

				void this.#showSuccessScreen();
			});
		}

		#onWorkdayStarted()
		{
			this.#postTargetAction(WorkdayIntentId.WORKDAY);
		}

		/**
		 * The only place the outcome of the period is published. Both branches of the confirmation
		 * lead here, and after a failed check-in the employee may still switch to a non-working
		 * status - a second event would make the opener register the outcome twice.
		 * @param {string} intentId
		 */
		#postTargetAction(intentId)
		{
			if (this.hasPostedTargetAction)
			{
				return;
			}

			this.hasPostedTargetAction = true;

			BX.postComponentEvent('workday-intent-box.onTargetAction', [{ intentId }]);
		}

		#onIntentChanged(intentId)
		{
			this.isWorkdaySelected = intentId === WorkdayIntentId.WORKDAY;
			this.#updateBottomSheetHeight(ContentId.INTENT_SCREEN);
		}

		/**
		 * @param {string} state state of the inline check-in block
		 * @param {number} [contentHeight] height the block reported for itself
		 */
		#onCheckInBlockStateChange(state, contentHeight)
		{
			this.blockState = state;
			this.blockContentHeight = contentHeight ?? null;
			this.#updateBottomSheetHeight(ContentId.INTENT_SCREEN);
		}

		/**
		 * @param {number} height height the layout gave the rows of status chips
		 */
		#onChipsContentHeightChange(height)
		{
			this.chipsContentHeight = height;
			this.#updateBottomSheetHeight(ContentId.INTENT_SCREEN);
		}

		/**
		 * @param {boolean} isOpen the editor of the description is on the screen
		 */
		#onDescriptionEditorToggle(isOpen)
		{
			// The editor is a sheet of its own and compensates the keyboard itself. On iOS the native
			// adopt of this widget would fight with that compensation over the height, so the flag is
			// off while the editor lives and comes back with the height of the current block state.
			this.props.parentWidget.setBottomSheetParams({ adoptHeightByKeyboard: !isOpen });

			// Switching the adopt hands the height over to the native side and takes it back, so the
			// number applied before the switch proves nothing about the height of the sheet after it.
			this.#appliedBottomSheetHeight = null;

			if (!isOpen)
			{
				this.#updateBottomSheetHeight(ContentId.INTENT_SCREEN);
			}
		}

		#onShiftsChipShown()
		{
			this.hasShiftsChip = true;
			this.#updateBottomSheetHeight(ContentId.SUCCESS_SCREEN);
		}

		#onPreventDismiss()
		{
			const { parentWidget } = this.props;

			// The confirmation belongs to this box alone and only the unsaved check-in input earns it:
			// choosing a status is not an input, and the success-screen has nothing left to lose.
			const hasUnsavedInput = this.state.contentId === ContentId.INTENT_SCREEN
				&& this.intentScreenRef?.hasUnsavedCheckInInput() === true;

			if (!hasUnsavedInput)
			{
				parentWidget.close();

				return;
			}

			Haptics.impactLight();

			confirmClosing({
				hasSaveAndClose: false,
				title: Loc.getMessage('TIMEMANMOBILE_WORKDAY_INTENT_BOX_CLOSE_CONFIRM_TITLE'),
				description: Loc.getMessage('TIMEMANMOBILE_WORKDAY_INTENT_BOX_CLOSE_CONFIRM_DESCRIPTION'),
				onClose: () => parentWidget.close(),
			});
		}

		async #showSuccessScreen()
		{
			await this.#fadeOutCurrentContent();

			this.#updateBottomSheetHeight(ContentId.SUCCESS_SCREEN);
			this.setState(
				{ contentId: ContentId.SUCCESS_SCREEN },
				() => this.successScreenRef?.fadeIn(),
			);
		}

		async #fadeOutCurrentContent()
		{
			switch (this.state.contentId)
			{
				case ContentId.INTENT_SCREEN:
					return this.intentScreenRef?.fadeOut();

				case ContentId.SUCCESS_SCREEN:
					return this.successScreenRef?.fadeOut();

				default:
					return Promise.resolve();
			}
		}

		#updateBottomSheetHeight(targetContent)
		{
			const { parentWidget, chatIdWithAiAdvice } = this.props;

			let mediumPositionHeight = 0;

			switch (targetContent)
			{
				case ContentId.INTENT_SCREEN:
					mediumPositionHeight = IntentScreen.getContentHeight({
						blockState: this.blockState,
						isWorkdaySelected: this.isWorkdaySelected,
						chipsContentHeight: this.chipsContentHeight,
						blockContentHeight: this.blockContentHeight,
					});
					break;

				case ContentId.SUCCESS_SCREEN:
					mediumPositionHeight = SuccessScreen.getContentHeight(
						this.state.intentId,
						chatIdWithAiAdvice,
						this.hasShiftsChip,
					);
					break;

				default:
					break;
			}

			if (!mediumPositionHeight || mediumPositionHeight === this.#appliedBottomSheetHeight)
			{
				return;
			}

			this.#appliedBottomSheetHeight = mediumPositionHeight;

			parentWidget.setBottomSheetParams({ mediumPositionHeight, onlyMediumPosition: true });
			parentWidget.setBottomSheetHeight(mediumPositionHeight);
		}

		#getPreselectedIntentId()
		{
			const { preselectedIntentId, intentList } = this.props;

			// guard against server/client version mismatch
			const isKnownIntent = Object.values(WorkdayIntentId).includes(preselectedIntentId);
			const isAvailableIntent = Object.values(intentList).some((intent) => intent.id === preselectedIntentId);

			return isKnownIntent && isAvailableIntent ? preselectedIntentId : WorkdayIntentId.WORKDAY;
		}

		#bindIntentScreenRef(ref)
		{
			this.intentScreenRef = ref;
		}

		#bindSuccessScreenRef(ref)
		{
			this.successScreenRef = ref;
		}
	}

	WorkdayIntentBox.defaultProps = {
		chatIdWithAiAdvice: 0,
		isDayStartCheckInEnabled: false,
		parentWidget: PageManager,
		preselectedIntentId: WorkdayIntentId.WORKDAY,
	};

	WorkdayIntentBox.propTypes = {
		intentList: PropTypes.arrayOf(
			PropTypes.shape({
				id: PropTypes.string.isRequired,
				label: PropTypes.string.isRequired,
			}),
		).isRequired,
		shifts: PropTypes.arrayOf(
			PropTypes.shape({
				start: PropTypes.string.isRequired,
				stop: PropTypes.string.isRequired,
				startTimestamp: PropTypes.number.isRequired,
				stopTimestamp: PropTypes.number.isRequired,
				scheduleType: PropTypes.string.isRequired,
			}),
		).isRequired,
		chatIdWithAiAdvice: PropTypes.number,
		isDayStartCheckInEnabled: PropTypes.bool,
		parentWidget: PropTypes.object,
		preselectedIntentId: PropTypes.string,
	};

	module.exports = { WorkdayIntentBox };
});
