/**
 * @module timeman/layout/workday-intent-box
 */
jn.define('timeman/layout/workday-intent-box', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { downloadImages, makeLibraryImagePath } = require('asset-manager');
	const { PropTypes } = require('utils/validation');
	const { Loc } = require('loc');
	const { Geo } = require('utils/geo');
	const { WorkdayIntentId } = require('timeman/workday-intent/workday-intent-id');
	const { StartDayPopupAnalytics } = require('timeman/workday-intent/analytics');
	const { SuccessScreen } = require('timeman/layout/workday-intent-box/src/success-screen');
	const { IntentScreen } = require('timeman/layout/workday-intent-box/src/intent-screen');

	/** @type {?typeof import('stafftrack/feature').Feature} */
	let Feature = null;
	/** @type {?typeof import('stafftrack/layout/check-in-v2/form').CheckInForm} */
	let CheckInForm = null;
	try
	{
		Feature = require('stafftrack/feature').Feature;
		CheckInForm = require('stafftrack/layout/check-in-v2/form').CheckInForm;
	}
	catch (error)
	{
		console.error(error);
	}

	const ContentId = {
		INTENT_SCREEN: 'intentScreen',
		CHECK_IN_SCREEN: 'checkInScreen',
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
		static getWidgetParams()
		{
			return {
				modal: true,
				backdrop: {
					hideNavigationBar: true,
					mediumPositionHeight: IntentScreen.getContentHeight(),
					onlyMediumPosition: true,
					forceDismissOnSwipeDown: true,
					horizontalSwipeAllowed: false,
					adoptHeightByKeyboard: true,
				},
			};
		}

		constructor(props)
		{
			super(props);

			this.bindIntentScreenRef = this.#bindIntentScreenRef.bind(this);
			this.bindCheckInScreenRef = this.#bindCheckInScreenRef.bind(this);
			this.bindSuccessScreenRef = this.#bindSuccessScreenRef.bind(this);
			this.onIntentSent = this.#onIntentSent.bind(this);
			this.onCheckInSent = this.#onCheckInSent.bind(this);

			this.preselectedIntentId = this.#getPreselectedIntentId();

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
			StartDayPopupAnalytics.sendPopupOpen();
		}

		render()
		{
			switch (this.state.contentId)
			{
				case ContentId.INTENT_SCREEN:
					return this.#renderSelectionScreen();

				case ContentId.CHECK_IN_SCREEN:
					return this.#renderCheckInScreen();

				case ContentId.SUCCESS_SCREEN:
					return this.#renderSuccessScreen();

				default:
					return null;
			}
		}

		#renderSelectionScreen()
		{
			const { intentList, shifts, parentWidget } = this.props;

			return new IntentScreen({
				intentList,
				shifts,
				parentWidget,
				preselectedIntentId: this.preselectedIntentId,
				testId: 'workday-intent-box',
				ref: this.bindIntentScreenRef,
				onIntentSent: this.onIntentSent,
			});
		}

		#renderCheckInScreen()
		{
			return new CheckInForm({
				loadingViewStyle: {
					opacity: 0,
				},
				title: Loc.getMessage('TIMEMANMOBILE_CHECK_IN_SCREEN_HEADER'),
				layoutWidget: this.props.parentWidget,
				ref: this.bindCheckInScreenRef,
				onCheckInSent: this.onCheckInSent,
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
				testId: 'workday-intent-box',
				ref: this.bindSuccessScreenRef,
			});
		}

		#onIntentSent(intentId)
		{
			// Invariant: this event MUST be posted as the first statement, before any await and before
			// the success-screen. The opener synchronously sets sessionHasTargetAction on it earlier than
			// onViewRemoved (close) arrives, which is what guards against a double outcome (targetAction + dismiss).
			BX.postComponentEvent('workday-intent-box.onTargetAction', [{ intentId }]);

			this.setState({ intentId }, async () => {
				if (intentId !== WorkdayIntentId.WORKDAY)
				{
					// Kept for backward compatibility with external subscribers (see SDD-mobile P2.T1).
					BX.postComponentEvent('workday-intent-box.onAbsenceAdded');
					void this.#showSuccessScreen();

					return;
				}

				if (await this.#shouldShowCheckInScreen())
				{
					void this.#showCheckInScreen();
				}
				else
				{
					void this.#showSuccessScreen();
				}
			});
		}

		#onCheckInSent()
		{
			void this.#showSuccessScreen();
		}

		async #shouldShowCheckInScreen()
		{
			if (
				!this.props.isDayStartCheckInEnabled
				|| !CheckInForm
				|| !Feature?.isCheckinMapSupported()
			)
			{
				return false;
			}

			const locationStatus = await Geo.getLocationStatus();

			return (
				locationStatus?.isLocationServiceEnabled === true
				&& (locationStatus.isUserApproximatePermissionGranted || locationStatus.isUserPrecisePermissionGranted)
			);
		}

		async #showCheckInScreen()
		{
			await this.#fadeOutCurrentContent();

			this.#updateBottomSheetHeight(ContentId.CHECK_IN_SCREEN);
			this.setState(
				{ contentId: ContentId.CHECK_IN_SCREEN },
				() => this.checkInScreenRef?.fadeIn(),
			);
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

				case ContentId.CHECK_IN_SCREEN:
					return this.checkInScreenRef?.fadeOut();

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
			let onlyMediumPosition = true;

			switch (targetContent)
			{
				case ContentId.CHECK_IN_SCREEN:
					mediumPositionHeight = CheckInForm.getBottomSheetHeight(false, true);
					onlyMediumPosition = false;
					break;

				case ContentId.SUCCESS_SCREEN:
					mediumPositionHeight = SuccessScreen.getContentHeight(this.state.intentId, chatIdWithAiAdvice);
					break;

				default:
					break;
			}

			if (!mediumPositionHeight)
			{
				return;
			}

			parentWidget.setBottomSheetParams({ mediumPositionHeight, onlyMediumPosition });
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

		#bindCheckInScreenRef(ref)
		{
			this.checkInScreenRef = ref;
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
