/**
 * @module mail/ai-subject/src/controller
 */
jn.define('mail/ai-subject/src/controller', (require, exports, module) => {
	const { generateSubject } = require('mail/message/tools/connector');
	const { PerfPoint } = require('debug/prism');
	const { NoticeKind, isBodyEmpty, isLimitError } = require('mail/ai-subject/src/notice-kind');

	/**
	 * Composition mode passed to the backend. Must match
	 * \Bitrix\Mail\Integration\AI\SubjectGenerator MODE_* constants.
	 */
	const SubjectGenerationMode = Object.freeze({
		NEW: 'new',
		REPLY: 'reply',
		FORWARD: 'forward',
	});

	const AI_MODULE_ID = 'ai';
	const PullCommand = Object.freeze({
		SUCCESS: 'onQueueJobExecute',
		FAIL: 'onQueueJobFail',
	});
	const PULL_TIMEOUT_MS = 30000;

	/**
	 * Client-side controller for AI e-mail subject generation.
	 *
	 * Sends the compose body to the backend, then waits for the asynchronous
	 * result delivered through the `ai` PULL channel and correlated by queue hash.
	 * Opens no visual surface of its own: the host form gets the generated value
	 * through `onSuccess`, the loading flag through `onLoadingChange` and the kind
	 * of every notice through `onNotice`.
	 *
	 * @class AiSubjectController
	 */
	class AiSubjectController
	{
		/**
		 * @param {Object} params
		 * @param {function(string)} [params.onNotice] Receives a NoticeKind value on every
		 *   notice path. Declared here, not per request: the aborting paths report after
		 *   #reset(), which drops the per-request callbacks.
		 */
		constructor({ onNotice } = {})
		{
			this.onNotice = onNotice;

			this.isGenerating = false;
			this.activeHash = null;
			// Monotonic id: bumping it invalidates every in-flight callback/PULL event.
			this.requestId = 0;
			this.unsubscribePull = null;
			this.timeoutId = null;
			this.onSuccessCallback = null;
			this.onLoadingChange = null;
			// Perf measurement for the "time to ready subject" (PULL) phase; lives
			// across methods, so it is ended in #reset(), the single teardown funnel.
			this.pullPoint = null;
		}

		/**
		 * @return {boolean} Whether a generation request is currently in progress.
		 */
		isActive()
		{
			return this.isGenerating;
		}

		/**
		 * Starts a single subject generation request. Re-entrant calls while a
		 * request is active are ignored (one active request per message).
		 *
		 * @param {Object} params
		 * @param {string} params.body Cleaned compose body (without signature).
		 * @param {string} [params.currentSubject] Subject to improve, if already entered.
		 * @param {string} params.mode One of SubjectGenerationMode values.
		 * @param {string|number} [params.ownerType] CRM entity type of the composition, if any.
		 * @param {?number} [params.ownerId] CRM entity id of the composition, if any.
		 * @param {?number} [params.originalMessageId]
		 * @param {function(boolean)} [params.onLoadingChange]
		 * @param {function(string)} [params.onSuccess]
		 */
		generate({
			body = '',
			currentSubject = '',
			mode = SubjectGenerationMode.NEW,
			ownerType = '',
			ownerId = 0,
			originalMessageId = null,
			onLoadingChange,
			onSuccess,
		} = {})
		{
			if (this.isGenerating)
			{
				return;
			}

			if (isBodyEmpty(body))
			{
				// Precondition, not a failure: nothing started, so nothing to reset.
				this.#notify(NoticeKind.HINT);

				return;
			}

			this.onSuccessCallback = onSuccess;
			this.onLoadingChange = onLoadingChange;

			const requestId = ++this.requestId;
			this.isGenerating = true;
			this.activeHash = null;
			this.#setLoading(true);

			// Async op #1: generateSubject roundtrip, from the tap to the response
			// carrying queueHash. Fully contained in this promise chain, so a local
			// PerfPoint is ended on both terminal branches (.then / .catch).
			const requestPoint = new PerfPoint('Mail AI Subject Request', 'generateSubject').start();

			generateSubject({
				body: body.trim(),
				currentSubject: typeof currentSubject === 'string' ? currentSubject.trim() : '',
				mode,
				ownerType,
				ownerId,
				originalMessageId,
			})
				.then((response) => {
					// Roundtrip has completed regardless of whether this callback is
					// still the current request, so close the measurement here.
					requestPoint.end();

					if (requestId !== this.requestId)
					{
						return;
					}

					const data = response && response.data ? response.data : null;

					// Synchronous (non-queue) engine: the subject is already in the
					// action response, so apply it now without waiting for PULL.
					const syncSubject = data && typeof data.subject === 'string' ? data.subject.trim() : '';
					if (syncSubject !== '')
					{
						const onSuccess = this.onSuccessCallback;
						this.#reset();

						if (typeof onSuccess === 'function')
						{
							onSuccess(syncSubject);
						}

						return;
					}

					const queueHash = data ? data.queueHash : null;
					if (!queueHash)
					{
						this.#reset();
						this.#notify(NoticeKind.ERROR);

						return;
					}

					this.activeHash = queueHash;
					// Async op #2 starts here: from PULL subscription to the delivered
					// result / fail / timeout. Ended in #reset() (single teardown funnel).
					this.pullPoint = new PerfPoint('Mail AI Subject PULL', 'time-to-subject').start();
					this.#subscribeToPull(requestId);
					this.#armTimeout(requestId);
				})
				.catch((failure) => {
					requestPoint.end();

					if (requestId !== this.requestId)
					{
						return;
					}

					this.#handleSyncError(failure);
				});
		}

		/**
		 * Drops the in-flight request (if any) so its result is ignored. Used
		 * when the source body changes and the pending subject becomes stale.
		 */
		invalidate()
		{
			if (!this.isGenerating)
			{
				return;
			}

			this.requestId++;
			this.#reset();
		}

		/**
		 * Fully tears the controller down. Safe to call multiple times and when
		 * idle. Must be called when the compose form unmounts.
		 */
		destroy()
		{
			this.requestId++;
			// Drop host callbacks first: the form is unmounting, so no state update.
			// onNotice survives #reset() by design, so it is dropped only here.
			this.onLoadingChange = null;
			this.onSuccessCallback = null;
			this.onNotice = null;
			this.#reset();
		}

		#subscribeToPull(requestId)
		{
			this.#unsubscribeFromPull();

			this.unsubscribePull = BX.PULL.subscribe({
				moduleId: AI_MODULE_ID,
				callback: (eventData) => this.#onPullEvent(requestId, eventData),
			});
		}

		#unsubscribeFromPull()
		{
			if (typeof this.unsubscribePull === 'function')
			{
				this.unsubscribePull();
			}

			this.unsubscribePull = null;
		}

		#onPullEvent(requestId, eventData)
		{
			if (requestId !== this.requestId)
			{
				return;
			}

			const { command, params } = eventData || {};
			if (!params || params.hash !== this.activeHash)
			{
				return;
			}

			if (command === PullCommand.SUCCESS)
			{
				const subject = this.#extractSubject(params);
				const onSuccess = this.onSuccessCallback;
				this.#reset();

				if (subject)
				{
					if (typeof onSuccess === 'function')
					{
						onSuccess(subject);
					}
				}
				else
				{
					this.#notify(NoticeKind.ERROR);
				}
			}
			else if (command === PullCommand.FAIL)
			{
				this.#reset();
				this.#notify(NoticeKind.ERROR);
			}
		}

		#armTimeout(requestId)
		{
			this.#clearTimeout();

			this.timeoutId = setTimeout(() => {
				if (requestId !== this.requestId)
				{
					return;
				}

				this.#reset();
				this.#notify(NoticeKind.ERROR);
			}, PULL_TIMEOUT_MS);
		}

		#clearTimeout()
		{
			if (this.timeoutId)
			{
				clearTimeout(this.timeoutId);
				this.timeoutId = null;
			}
		}

		#handleSyncError(failure)
		{
			this.#reset();

			if (isLimitError(failure?.errors))
			{
				this.#notify(NoticeKind.LIMIT);
			}
			else
			{
				this.#notify(NoticeKind.ERROR);
			}
		}

		#extractSubject(params)
		{
			const result = params && params.data ? params.data.result : null;
			if (typeof result === 'string' && result.trim() !== '')
			{
				return result.trim();
			}

			return null;
		}

		#reset()
		{
			this.#unsubscribeFromPull();
			this.#clearTimeout();

			// Close the "time to ready subject" measurement on every terminal path
			// (success / fail / timeout / invalidate / destroy). Guarded so the
			// ajax-error paths, where PULL never started, emit no false measurement.
			if (this.pullPoint)
			{
				this.pullPoint.end();
				this.pullPoint = null;
			}

			this.isGenerating = false;
			this.activeHash = null;
			this.#setLoading(false);

			this.onSuccessCallback = null;
			this.onLoadingChange = null;
		}

		#setLoading(isLoading)
		{
			if (typeof this.onLoadingChange === 'function')
			{
				this.onLoadingChange(isLoading);
			}
		}

		/**
		 * @param {string} kind One of NoticeKind values.
		 */
		#notify(kind)
		{
			if (typeof this.onNotice === 'function')
			{
				this.onNotice(kind);
			}
		}
	}

	module.exports = { AiSubjectController, SubjectGenerationMode };
});
