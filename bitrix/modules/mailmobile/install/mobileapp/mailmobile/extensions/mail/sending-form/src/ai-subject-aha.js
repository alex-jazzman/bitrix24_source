/**
 * @module mail/sending-form/src/ai-subject-aha
 */
jn.define('mail/sending-form/src/ai-subject-aha', (require, exports, module) => {
	const { Loc } = require('loc');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Tourist } = require('tourist');
	const { AhaMoment, ButtonType } = require('ui-system/popups/aha-moment');

	// Kept from the bottom-sheet onboarding this hint replaces: whoever has already seen the
	// explanation must not get it again.
	const ONBOARDING_TOURIST_EVENT = 'mail_subject_gpt_onboarding_shown';
	const IMAGE_SIZE = 78;
	const SHOW_DELAY = 500;

	// The size comes from the element itself: the hint puts the slot into a fixed-width container
	// and never reads props.image.size, so an unsized 383x383 asset would break the layout.
	function renderImage()
	{
		return Image({
			// The path carries the current theme, so it is built at show time, not at module load.
			uri: makeLibraryImagePath('ai-subject-onboarding.png', 'empty-states', 'mail'),
			resizeMode: 'contain',
			style: {
				width: IMAGE_SIZE,
				height: IMAGE_SIZE,
			},
		});
	}

	/**
	 * Shows the first-time hint anchored to the subject generation button.
	 *
	 * The one-time flag is written only after an explicit acknowledgement. AhaMoment may call
	 * onShow after losing its global semaphore race, when its spotlight never reached the screen.
	 *
	 * @param {object} params
	 * @param {object} params.targetRef native ref of the generation button to anchor the hint to
	 * @param {function(): boolean} params.canShow whether the generation button is available;
	 *   asked again right before the show, so a hint delayed into a closed form is dropped
	 * @return {Promise<?AhaMomentController>} the handle to take the hint down with, and null
	 *   when there is nothing on screen to take down. Never rejects
	 */
	function showAiSubjectAhaMoment({ targetRef, canShow })
	{
		return Tourist.ready()
			.then(() => {
				if (!Tourist.firstTime(ONBOARDING_TOURIST_EVENT))
				{
					return null;
				}

				let acknowledged = false;
				const rememberOnboarding = () => {
					if (acknowledged)
					{
						return;
					}

					acknowledged = true;

					return Tourist.remember(ONBOARDING_TOURIST_EVENT);
				};

				return AhaMoment.show({
					testId: 'mail-ai-subject-aha',
					targetRef,
					description: Loc.getMessage('MESSAGE_SEND_AI_SUBJECT_AHA_DESCRIPTION'),
					buttonText: Loc.getMessage('MESSAGE_SEND_AI_SUBJECT_AHA_BUTTON'),
					bottomButtonType: ButtonType.CLOSE,
					image: renderImage(),
					shouldShowImageBackgroundColor: false,
					disableHideByOutsideClick: false,
					delay: SHOW_DELAY,
					canShow,
					analyticsLabel: {
						c_section: 'mail',
						c_sub_section: 'sending_form',
						p1: 'aiSubject',
					},
					onClick: rememberOnboarding,
					onClose: rememberOnboarding,
					onShowSkipped: (error) => {
						// No flag is written here: the attempt repeats the next time the form opens.
						if (error)
						{
							console.warn('showAiSubjectAhaMoment:', error);
						}
					},
				});
			})
			.catch((error) => {
				console.error('showAiSubjectAhaMoment:', error);

				return null;
			});
	}

	class AiSubjectAhaMomentController
	{
		constructor({ canShow })
		{
			this.canShow = canShow;
			this.targetRef = null;
			this.targetLaidOut = false;
			this.mounted = false;
			this.started = false;
			this.showPromise = null;
		}

		mount()
		{
			this.mounted = true;
			this.#tryShow();
		}

		setTargetRef(targetRef)
		{
			this.targetRef = targetRef;
			this.#tryShow();
		}

		markTargetAsLaidOut()
		{
			this.targetLaidOut = true;
			this.#tryShow();
		}

		hide()
		{
			this.mounted = false;
			const showPromise = this.showPromise;
			this.showPromise = null;

			return showPromise?.then((ahaMoment) => ahaMoment?.hide()) ?? Promise.resolve();
		}

		#tryShow()
		{
			if (!this.mounted || !this.targetRef || !this.targetLaidOut || this.started)
			{
				return;
			}

			this.started = true;
			this.showPromise = showAiSubjectAhaMoment({
				targetRef: this.targetRef,
				canShow: this.canShow,
			});
		}
	}

	module.exports = { AiSubjectAhaMomentController, showAiSubjectAhaMoment };
});
