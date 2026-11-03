/**
 * @module mail/large-attachment/aha
 */
jn.define('mail/large-attachment/aha', (require, exports, module) => {
	const { Loc } = require('loc');
	const { AhaMoment } = require('ui-system/popups/aha-moment');
	const { LARGE_ATTACHMENT_USER_OPTION_CATEGORY } = require('mail/large-attachment');

	/**
	 * The two one-time messages of the scenario. They explain different things, so they have their own
	 * marks, but they compete for the same moment of the composition.
	 */
	const LargeAttachmentAhaKind = Object.freeze({
		heavyFile: 'heavy-file',
		storageNotice: 'storage-notice',
	});

	// the person has just picked a file, so the popup waits for the field to settle before it appears
	const SHOW_DELAY = 500;
	// the same time the web guide stays on screen: the message needs no answer and leaves on its own
	const AUTO_CLOSE_DELAY = 12000;
	// closes the gap between the popup and the tiles the storage notice speaks about (default is 2), so the
	// message sits right on the attachments instead of floating away from them
	const STORAGE_NOTICE_POINTER_MARGIN = 0;

	/**
	 * The one-time onboarding of the large attachment scenario. It owns which of the two messages the
	 * person sees and when the mark of a message is written.
	 *
	 * The marks live in the user options of the mail module, the very ones the web writes: the mobile
	 * mechanism of one-time events keeps its marks in options of its own and would drift apart from the
	 * web, showing the same message twice to the same person.
	 */
	class LargeAttachmentAha
	{
		/**
		 * @param {LargeAttachmentAhaOptions} options
		 */
		constructor(options = {})
		{
			this.connector = options.connector ?? null;
			// the scenario is unavailable on this tariff: nothing about it is worth explaining
			const available = options.available !== false;
			this.notices = {
				[LargeAttachmentAhaKind.heavyFile]: {
					pending: available && options.showHeavyFileHint === true,
					optionName: String(options.heavyFileOptionName ?? ''),
					testId: 'mail-large-attachment-aha',
					text: Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_AHA_TEXT'),
				},
				[LargeAttachmentAhaKind.storageNotice]: {
					pending: available && options.showStorageNotice === true,
					optionName: String(options.storageNoticeOptionName ?? ''),
					testId: 'mail-large-attachment-storage-notice',
					text: Loc.getMessage('MAILMOBILE_LARGE_ATTACHMENT_STORAGE_NOTICE_TEXT'),
					spotlightParams: { pointerMargin: STORAGE_NOTICE_POINTER_MARGIN },
				},
			};
			this.showMoment = options.showMoment ?? ((props) => AhaMoment.show(props));
			this.inFlight = null;
			this.controller = null;
		}

		/**
		 * An attachment has just appeared in the letter. Only one message ever reaches the screen at this
		 * moment: two one-time messages in a row read as pestering. The heavy file wins, because it explains
		 * what is happening to the letter right now, and the explanation about the storage waits for the
		 * next attachment.
		 *
		 * @param {LargeAttachmentAhaParams} params
		 * @return {?string} the kind that was offered to the screen
		 */
		handleAttachmentAdded(params = {})
		{
			const kind = this.#chooseKind(params.hasHeavyFile === true);

			return kind !== null && this.show(kind, params.targetRef) ? kind : null;
		}

		/**
		 * @param {string} kind
		 * @param {*} targetRef
		 * @return {boolean}
		 */
		show(kind, targetRef)
		{
			const notice = this.notices[kind];
			if (!notice?.pending || this.inFlight !== null || !targetRef)
			{
				return false;
			}

			this.inFlight = kind;
			this.controller = this.showMoment({
				testId: notice.testId,
				targetRef,
				description: notice.text,
				// the notice that owns pointer options passes them through; the rest keep the native defaults
				...(notice.spotlightParams ? { spotlightParams: notice.spotlightParams } : {}),
				// the message asks for nothing, so it carries no action button and closes by itself
				disableHideByOutsideClick: false,
				delay: SHOW_DELAY,
				autoCloseDelay: AUTO_CLOSE_DELAY,
				// the mark belongs to the show itself: a popup that never reached the screen must not burn
				// the only chance the person has to read the message
				onShow: () => this.#remember(kind),
				onShowSkipped: () => this.#release(),
				// the lock is held until the popup actually leaves the screen: a next attachment while it
				// is still up must not open a second popup over this one and orphan its controller
				onHide: () => this.#release(),
			});

			if (!this.controller)
			{
				this.#release();

				return false;
			}

			return true;
		}

		/**
		 * @param {string} kind
		 * @return {boolean}
		 */
		isPending(kind)
		{
			return this.notices[kind]?.pending === true;
		}

		destroy()
		{
			this.controller?.hide();
			this.controller = null;
			this.inFlight = null;
		}

		#chooseKind(hasHeavyFile)
		{
			if (hasHeavyFile && this.notices[LargeAttachmentAhaKind.heavyFile].pending)
			{
				return LargeAttachmentAhaKind.heavyFile;
			}

			return this.notices[LargeAttachmentAhaKind.storageNotice].pending
				? LargeAttachmentAhaKind.storageNotice
				: null
			;
		}

		#release()
		{
			this.inFlight = null;
			this.controller = null;
		}

		/**
		 * @param {string} kind
		 * @return {Promise<boolean>}
		 */
		#remember(kind)
		{
			const notice = this.notices[kind];
			notice.pending = false;

			if (!this.connector || notice.optionName === '')
			{
				return Promise.resolve(false);
			}

			// the name of the option is the one the server named: the client spells none of them itself
			return this.connector
				.saveUserOption({
					category: LARGE_ATTACHMENT_USER_OPTION_CATEGORY,
					name: notice.optionName,
					value: 'Y',
				})
				.catch(() => false)
			;
		}
	}

	module.exports = { LargeAttachmentAha, LargeAttachmentAhaKind };
});
