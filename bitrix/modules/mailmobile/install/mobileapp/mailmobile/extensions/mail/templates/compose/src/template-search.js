/**
 * @module mail/templates/compose/src/template-search
 */
jn.define('mail/templates/compose/src/template-search', (require, exports, module) => {
	const { PerfPoint } = require('debug/prism');
	const SEARCH_DELAY = 300;
	const SEARCH_LIMIT = 20;
	const MAX_QUERY_LENGTH = 128;

	class TemplateSearch
	{
		constructor({ api, delay = SEARCH_DELAY, perfPointClass = PerfPoint } = {})
		{
			this.api = api;
			this.perfPointClass = perfPointClass;
			this.delay = delay;
			this.timer = null;
			this.generation = 0;
			this.query = '';
			this.overBound = false;
			this.destroyed = false;
			this.listeners = new Set();
			this.perfPoints = new Set();
			this.state = {
				query: '',
				items: [],
				isLoading: false,
				error: false,
				nextOffset: null,
			};
		}

		getState()
		{
			return this.state;
		}

		subscribe(listener)
		{
			this.listeners.add(listener);

			return () => this.listeners.delete(listener);
		}

		search(query)
		{
			const characters = [...String(query ?? '').trim()];
			this.query = characters.join('');
			this.overBound = characters.length > MAX_QUERY_LENGTH;
			this.#patchState({ query: this.query, items: [], error: false, nextOffset: null });

			if (this.overBound)
			{
				this.#answerEmpty();

				return;
			}

			this.#request(0, false, true);
		}

		loadMore()
		{
			if (!this.destroyed && !this.state.isLoading && this.state.nextOffset !== null)
			{
				this.#request(this.state.nextOffset, true, false);
			}
		}

		retry()
		{
			if (this.overBound)
			{
				this.#answerEmpty();

				return;
			}

			this.#request(0, false, false);
		}

		destroy()
		{
			this.destroyed = true;
			this.generation += 1;
			this.#clearTimer();
			this.listeners.clear();
			this.perfPoints.forEach((point) => point.end());
			this.perfPoints.clear();
		}

		#request(offset, append, deferred)
		{
			this.#clearTimer();
			const generation = ++this.generation;
			const run = async () => {
				this.timer = null;
				if (this.destroyed || generation !== this.generation)
				{
					return;
				}

				this.#patchState({ isLoading: true, error: false });
				const perfPoint = new this.perfPointClass(
					'Mail Templates Search',
					append ? 'loadMore' : 'search',
				).start();
				this.perfPoints.add(perfPoint);
				try
				{
					const response = await this.api.search({ query: this.query, offset, limit: SEARCH_LIMIT });
					if (this.destroyed || generation !== this.generation)
					{
						return;
					}

					this.#patchState({
						items: append ? [...this.state.items, ...response.items] : response.items,
						nextOffset: response.nextOffset,
						isLoading: false,
					});
				}
				catch (failure)
				{
					if (!this.destroyed && generation === this.generation)
					{
						this.#patchState({ isLoading: false, error: true });
					}
				}
				finally
				{
					perfPoint.end();
					this.perfPoints.delete(perfPoint);
				}
			};

			if (deferred && this.delay > 0)
			{
				this.timer = setTimeout(run, this.delay);
			}
			else
			{
				void run();
			}
		}

		#answerEmpty()
		{
			this.#clearTimer();
			this.generation += 1;
			this.#patchState({ items: [], nextOffset: null, isLoading: false, error: false });
		}

		#clearTimer()
		{
			if (this.timer !== null)
			{
				clearTimeout(this.timer);
				this.timer = null;
			}
		}

		#patchState(patch)
		{
			Object.assign(this.state, patch);
			this.listeners.forEach((listener) => listener(this.state));
		}
	}

	module.exports = { TemplateSearch };
});
