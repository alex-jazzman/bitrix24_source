/**
 * @module mail/message-grid/src/conversation-extension-gate
 */
jn.define('mail/message-grid/src/conversation-extension-gate', (require, exports, module) => {
	const createRetryableSingleFlight = (load) => {
		let loadPromise = null;

		return () => {
			loadPromise ??= Promise.resolve()
				.then(() => load())
				.catch((error) => {
					loadPromise = null;

					throw error;
				})
			;

			return loadPromise;
		};
	};

	const createConversationExtensionLoader = (load) => createRetryableSingleFlight(async () => {
		const extension = await load();
		if (typeof extension?.MessageGridConversationRuntime !== 'function')
		{
			throw new Error('The mail conversation runtime is unavailable.');
		}

		return extension;
	});

	class ConversationExtensionGate
	{
		constructor({
			load,
			onLoaded = () => {},
			onFailed = () => {},
			createActivationPerfPoint = () => null,
		} = {})
		{
			this.load = load;
			this.onLoaded = onLoaded;
			this.onFailed = onFailed;
			this.createActivationPerfPoint = createActivationPerfPoint;
			this.loadPromise = null;
			this.loaded = false;
			this.failureReported = false;
			this.destroyed = false;
			this.generation = 0;
			this.activationPerfPoint = null;
			this.isLoadPointActive = false;
			this.isCommitPointActive = false;
		}

		hold(response, commit, source = '')
		{
			const generation = ++this.generation;
			if (response?.data?.grouped !== true)
			{
				this.failureReported = false;
				this.#finishActivation('superseded');
				if (!this.destroyed)
				{
					commit(response);
				}

				return Promise.resolve();
			}

			this.#startActivation();

			return this.#ensureLoaded().then((loaded) => {
				if (
					!loaded
					|| this.destroyed
					|| generation !== this.generation
				)
				{
					return;
				}

				this.activationPerfPoint?.startPoint('Commit Grouped Response');
				this.isCommitPointActive = this.activationPerfPoint !== null;

				try
				{
					commit(response);
				}
				finally
				{
					this.#finishCommit(response, source);
					this.#finishActivation();
				}
			});
		}

		#startActivation()
		{
			if (this.loaded || this.loadPromise !== null || this.activationPerfPoint !== null)
			{
				return;
			}

			this.activationPerfPoint = this.createActivationPerfPoint();
			this.activationPerfPoint?.startPoint('Load Runtime');
			this.isLoadPointActive = this.activationPerfPoint !== null;
		}

		#ensureLoaded()
		{
			if (this.loaded)
			{
				return Promise.resolve(true);
			}

			if (this.loadPromise === null)
			{
				this.loadPromise = Promise.resolve()
					.then(() => this.load())
					.then((extension) => {
						if (this.destroyed)
						{
							return false;
						}

						this.onLoaded(extension);
						this.loaded = true;
						this.#finishLoad();

						return true;
					})
					.catch(async (error) => {
						this.loadPromise = null;
						this.#finishLoad('error');

						try
						{
							if (!this.destroyed && !this.failureReported)
							{
								this.failureReported = true;
								// StatefulList reports reload errors; the gate only waits for its fallback lifecycle.
								await Promise.resolve(this.onFailed(error)).catch(() => {});
							}
						}
						finally
						{
							this.#finishActivation();
						}

						return false;
					})
				;
			}

			return this.loadPromise;
		}

		#finishLoad(status = null)
		{
			if (!this.isLoadPointActive)
			{
				return;
			}

			this.activationPerfPoint?.endPoint(
				'Load Runtime',
				status === null ? {} : { status },
			);
			this.isLoadPointActive = false;
		}

		#finishCommit(response, source)
		{
			if (!this.isCommitPointActive)
			{
				return;
			}

			const extra = {
				source,
				itemsCount: response?.data?.items?.length ?? 0,
			};

			this.activationPerfPoint?.endPoint('Commit Grouped Response', extra);
			this.isCommitPointActive = false;
		}

		#finishActivation(status = null)
		{
			if (this.activationPerfPoint === null)
			{
				return;
			}

			if (status !== null)
			{
				this.#finishLoad(status);
				if (this.isCommitPointActive)
				{
					this.activationPerfPoint.endPoint('Commit Grouped Response', { status });
					this.isCommitPointActive = false;
				}
			}

			this.activationPerfPoint.end();
			this.activationPerfPoint = null;
		}

		destroy()
		{
			this.destroyed = true;
			this.generation += 1;
			this.#finishActivation('unmount');
		}
	}

	module.exports = {
		ConversationExtensionGate,
		createConversationExtensionLoader,
		createRetryableSingleFlight,
	};
});
