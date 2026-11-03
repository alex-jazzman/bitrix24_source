/**
 * @module mail/large-attachment/connector
 */
jn.define('mail/large-attachment/connector', (require, exports, module) => {
	const { AjaxMethod } = require('mail/const');

	/**
	 * Codes the actions of the mail module answer with. They always arrive inside a successful HTTP
	 * response, so the code is the only thing that tells one failure from another.
	 */
	const LargeAttachmentErrorCode = Object.freeze({
		invalidContext: 'MAIL_LA_INVALID_CONTEXT',
		tariffUnavailable: 'MAIL_LA_TARIFF_UNAVAILABLE',
		accessDenied: 'MAIL_LA_ACCESS_DENIED',
		tooManyFiles: 'MAIL_LA_TOO_MANY_FILES',
		diskUnavailable: 'MAIL_LA_DISK_UNAVAILABLE',
		noSpace: 'MAIL_LA_NO_SPACE',
		uploadFailed: 'MAIL_LA_UPLOAD_FAILED',
		invalidToken: 'MAIL_LA_INVALID_TOKEN',
		linkUnavailable: 'MAIL_LA_LINK_UNAVAILABLE',
		invalidArgument: 'MAIL_LA_INVALID_ARGUMENT',
	});

	/**
	 * What a caller has to do about a failure. The transport knows no more than that: whether the
	 * scenario is unavailable for good, whether the attempt may be repeated, or whether the person is
	 * out of storage.
	 */
	const LargeAttachmentErrorState = Object.freeze({
		tariffUnavailable: 'tariff-unavailable',
		noSpace: 'no-space',
		accessDenied: 'access-denied',
		unavailable: 'unavailable',
		retryable: 'retryable',
	});

	const CONTEXT_MAIL = 'mail';
	const FINALIZE_ATTEMPTS = 3;

	/**
	 * How many calls of the scenario the client keeps in flight at once. A set is finalized, released and
	 * removed one call per token, so a registry that holds many sets would otherwise send one request per
	 * token side by side, and the number would come from the registry instead of from the client.
	 *
	 * Four is the conservative end of the connection budget a mobile client keeps for one host, and it is
	 * above everything the scenario asks for organically: a conversion leaves exactly one set in the
	 * registry, so the next one spends five calls with a single one in flight at a time. A list of four or
	 * fewer therefore starts whole and at once, exactly as it did before the cap.
	 */
	const MAX_CONCURRENT_CALLS = 4;

	/**
	 * Runs the given tasks with no more than `limit` of them in flight at once and answers with their
	 * results in the order the tasks were given - the very composition and the very order `Promise.all`
	 * over the same list answers with.
	 *
	 * A refusal is passed on the way `Promise.all` passes it: the answer is refused with the reason of the
	 * first refusal at the moment it happens, and no task is cancelled or skipped because of it, because
	 * `Promise.all` had already sent every call of its list by then. The refusals that follow are absorbed:
	 * an answer that is refused already cannot be refused a second time, and each caller of this decides
	 * on its own which of its tasks may refuse at all.
	 *
	 * @param {Array<function(): *>} tasks
	 * @param {number} [limit]
	 * @return {Promise<Array>}
	 */
	function runWithConcurrencyLimit(tasks, limit = MAX_CONCURRENT_CALLS)
	{
		const list = Array.isArray(tasks) ? tasks : [];
		const results = Array.from({ length: list.length });
		if (list.length === 0)
		{
			return Promise.resolve(results);
		}

		const slots = Math.max(1, Math.min(list.length, Number(limit) || 1));

		return new Promise((resolve, reject) => {
			let started = 0;
			let settled = 0;
			let refused = false;

			const finish = () => {
				settled++;
				if (settled === list.length && !refused)
				{
					resolve(results);
				}
			};

			const startNext = () => {
				if (started >= list.length)
				{
					return;
				}

				const index = started;
				started++;

				let task;
				try
				{
					task = list[index]();
				}
				catch (error)
				{
					task = Promise.reject(error);
				}

				Promise.resolve(task).then(
					(result) => {
						results[index] = result;
						finish();
						startNext();
					},
					(error) => {
						if (!refused)
						{
							refused = true;
							reject(error);
						}
						finish();
						startNext();
					},
				);
			};

			for (let slot = 0; slot < slots; slot++)
			{
				startNext();
			}
		});
	}

	class LargeAttachmentConnector
	{
		/**
		 * @param {LargeAttachmentConnectorOptions} options
		 */
		constructor(options = {})
		{
			this.context = options.context ?? CONTEXT_MAIL;
			this.mailboxId = options.mailboxId ?? null;
			this.runAction = options.runAction ?? ((action, config) => BX.ajax.runAction(action, config));
		}

		/**
		 * @param {LargeAttachmentConvertParams} params
		 * @return {Promise<LargeAttachmentSet>}
		 */
		convert(params = {})
		{
			return this.#call(AjaxMethod.mailLargeAttachmentConvert, {
				fileIds: Array.isArray(params.fileIds) ? params.fileIds.map(Number) : [],
				mailboxId: params.mailboxId ?? this.mailboxId ?? null,
				replacementToken: params.replacementToken ?? null,
				context: this.context,
			}).then((response) => LargeAttachmentConnector.readSet(response?.data));
		}

		/**
		 * @param {{ token: string }} params
		 * @return {Promise<boolean>}
		 */
		deleteUploaded(params = {})
		{
			return this.#call(AjaxMethod.mailLargeAttachmentDeleteUploaded, {
				token: String(params.token ?? ''),
			}).then((response) => Boolean(response?.data?.deleted));
		}

		/**
		 * The replacement is finalized with repeats: a set that failed to be finalized leaves an
		 * intermediate state on the Disk, so the web spends three attempts on it and so does this.
		 *
		 * @param {{ previousToken: string, currentToken: string }} params
		 * @param {number} [attemptsLeft]
		 * @return {Promise<boolean>}
		 */
		finalizeReplacement(params = {}, attemptsLeft = FINALIZE_ATTEMPTS)
		{
			return this.#call(AjaxMethod.mailLargeAttachmentFinalizeReplacement, {
				previousToken: String(params.previousToken ?? ''),
				currentToken: String(params.currentToken ?? ''),
			})
				.then(() => true)
				.catch((error) => (
					attemptsLeft > 1
						? this.finalizeReplacement(params, attemptsLeft - 1)
						: Promise.reject(error)
				))
			;
		}

		/**
		 * Writes the mark of a one-time decision into the user option the server named. The web writes
		 * the same option, so a person who has already answered on one platform is not asked on the other.
		 *
		 * @param {{ category: string, name: string, value?: string }} params
		 * @return {Promise<boolean>}
		 */
		saveUserOption(params = {})
		{
			const category = String(params.category ?? '');
			const name = String(params.name ?? '');
			if (category === '' || name === '')
			{
				return Promise.resolve(false);
			}

			// main.userOption.saveOptions is a JsonController: it reads the JSON body only and rejects a
			// form-urlencoded one with invalid_content_type, so this call alone travels as a JSON body
			return this.#call(AjaxMethod.saveUserOption, {
				newValues: [{ c: category, n: name, v: String(params.value ?? 'Y') }],
			}, { asJson: true }).then(() => true);
		}

		/**
		 * @param {*} data
		 * @return {LargeAttachmentSet}
		 */
		static readSet(data)
		{
			return {
				publicUrl: String(data?.publicUrl ?? ''),
				token: String(data?.token ?? ''),
				fileIds: Array.isArray(data?.fileIds) ? data.fileIds.map(Number) : [],
				folderName: String(data?.folderName ?? ''),
			};
		}

		/**
		 * @param {*} response
		 * @return {LargeAttachmentError}
		 */
		static readError(response)
		{
			const error = (response?.errors ?? [])[0];
			const code = String(error?.code ?? '');

			return {
				code,
				message: String(error?.message ?? ''),
				state: LargeAttachmentConnector.resolveErrorState(code),
			};
		}

		/**
		 * @param {string} code
		 * @return {string}
		 */
		static resolveErrorState(code)
		{
			switch (code)
			{
				case LargeAttachmentErrorCode.tariffUnavailable:
					return LargeAttachmentErrorState.tariffUnavailable;
				case LargeAttachmentErrorCode.noSpace:
					return LargeAttachmentErrorState.noSpace;
				case LargeAttachmentErrorCode.accessDenied:
					return LargeAttachmentErrorState.accessDenied;
				case LargeAttachmentErrorCode.invalidContext:
				case LargeAttachmentErrorCode.diskUnavailable:
				case LargeAttachmentErrorCode.linkUnavailable:
				case LargeAttachmentErrorCode.tooManyFiles:
					return LargeAttachmentErrorState.unavailable;
				default:
					return LargeAttachmentErrorState.retryable;
			}
		}

		/**
		 * The mail.largeAttachment.* controllers read a form-urlencoded body, so the payload travels as
		 * `data` by default. A caller aimed at a JsonController asks for the JSON body with `asJson`.
		 *
		 * @param {string} action
		 * @param {object} payload
		 * @param {{ asJson?: boolean }} [options]
		 * @return {Promise<*>}
		 */
		#call(action, payload, options = {})
		{
			const config = options.asJson === true ? { json: payload } : { data: payload };

			return this.runAction(action, config).catch((response) => {
				throw LargeAttachmentConnector.readError(response);
			});
		}
	}

	module.exports = {
		LargeAttachmentConnector,
		LargeAttachmentErrorCode,
		LargeAttachmentErrorState,
		MAX_CONCURRENT_CALLS,
		runWithConcurrencyLimit,
	};
});
