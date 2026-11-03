/**
 * @module mail/draft/aha
 */
jn.define('mail/draft/aha', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Tourist } = require('tourist');
	const { AhaMoment, ButtonType } = require('ui-system/popups/aha-moment');

	const FIRST_MAIL_DRAFT_CREATED_EVENT = 'mail_mobile_first_draft_created';
	const DRAFT_AHA_ACKNOWLEDGED_EVENT = 'mail_mobile_draft_aha_acknowledged';
	const TARGET_REF = 'message-grid-folder-selector-button';
	const SHOW_DELAY = 500;
	const RETRY_DELAY = 1000;

	function rememberFirstMailDraftCreated(tourist = Tourist)
	{
		return tourist.ready()
			.then(() => {
				if (!tourist.firstTime(FIRST_MAIL_DRAFT_CREATED_EVENT))
				{
					return false;
				}

				return tourist.remember(FIRST_MAIL_DRAFT_CREATED_EVENT).then(() => true);
			})
			.catch((error) => {
				console.error('rememberFirstMailDraftCreated:', error);

				return false;
			})
		;
	}

	class DraftAhaMomentController
	{
		constructor({
			tourist = Tourist,
			ahaMoment = AhaMoment,
			scheduler = null,
			retryDelay = RETRY_DELAY,
		} = {})
		{
			this.tourist = tourist;
			this.ahaMoment = ahaMoment;
			this.scheduler = scheduler ?? {
				setTimeout: (callback, timeout) => setTimeout(callback, timeout),
				clearTimeout: (timerId) => clearTimeout(timerId),
			};
			this.retryDelay = retryDelay;
			this.mounted = false;
			this.visible = false;
			this.destroyed = false;
			this.attemptInProgress = false;
			this.acknowledgementInProgress = false;
			this.retryTimerId = null;
			this.ahaMomentController = null;
		}

		mount()
		{
			if (this.destroyed)
			{
				return;
			}

			this.mounted = true;
		}

		onViewShown()
		{
			if (!this.mounted || this.destroyed)
			{
				return;
			}

			this.visible = true;
			this.#tryShow();
		}

		onViewHidden()
		{
			this.visible = false;
			this.#clearRetryTimer();
			this.ahaMomentController?.hide();
			this.ahaMomentController = null;
		}

		destroy()
		{
			if (this.destroyed)
			{
				return;
			}

			this.onViewHidden();
			this.mounted = false;
			this.destroyed = true;
		}

		#tryShow()
		{
			if (!this.#canShow() || this.attemptInProgress || this.retryTimerId !== null)
			{
				return;
			}

			this.attemptInProgress = true;
			void this.tourist.ready()
				.then(() => {
					if (
						!this.#canShow()
						|| this.tourist.firstTime(FIRST_MAIL_DRAFT_CREATED_EVENT)
						|| !this.tourist.firstTime(DRAFT_AHA_ACKNOWLEDGED_EVENT)
					)
					{
						return;
					}

					this.ahaMomentController = this.ahaMoment.show({
						testId: 'mail-draft-aha',
						targetRef: TARGET_REF,
						title: Loc.getMessage('MAILMOBILE_DRAFT_AHA_TITLE'),
						description: Loc.getMessage('MAILMOBILE_DRAFT_AHA_DESCRIPTION'),
						buttonText: Loc.getMessage('MAILMOBILE_DRAFT_AHA_BUTTON'),
						bottomButtonType: ButtonType.CLOSE,
						disableHideByOutsideClick: true,
						delay: SHOW_DELAY,
						canShow: () => this.#canShow(),
						onClick: this.#acknowledge,
						onClose: this.#acknowledge,
						onShowSkipped: this.#handleShowSkipped,
					});
				})
				.catch((error) => {
					console.error('DraftAhaMomentController:', error);
					this.#scheduleRetry();
				})
				.finally(() => {
					this.attemptInProgress = false;
				})
			;
		}

		#acknowledge = () => {
			if (this.acknowledgementInProgress)
			{
				return;
			}

			this.acknowledgementInProgress = true;
			this.#clearRetryTimer();
			this.ahaMomentController = null;
			void this.tourist.remember(DRAFT_AHA_ACKNOWLEDGED_EVENT)
				.catch((error) => {
					this.acknowledgementInProgress = false;
					console.error('DraftAhaMomentController:', error);
					this.#scheduleRetry();
				})
			;
		};

		#handleShowSkipped = (error) => {
			this.ahaMomentController = null;
			if (error)
			{
				console.warn('DraftAhaMomentController:', error);
			}

			this.#scheduleRetry();
		};

		#scheduleRetry()
		{
			if (!this.#canShow() || this.retryTimerId !== null)
			{
				return;
			}

			this.retryTimerId = this.scheduler.setTimeout(() => {
				this.retryTimerId = null;
				this.#tryShow();
			}, this.retryDelay);
		}

		#clearRetryTimer()
		{
			if (this.retryTimerId === null)
			{
				return;
			}

			this.scheduler.clearTimeout(this.retryTimerId);
			this.retryTimerId = null;
		}

		#canShow()
		{
			return this.mounted && this.visible && !this.destroyed;
		}
	}

	module.exports = {
		DRAFT_AHA_ACKNOWLEDGED_EVENT,
		FIRST_MAIL_DRAFT_CREATED_EVENT,
		DraftAhaMomentController,
		rememberFirstMailDraftCreated,
	};
});
