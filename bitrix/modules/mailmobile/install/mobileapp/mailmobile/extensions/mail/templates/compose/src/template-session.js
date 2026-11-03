/**
 * @module mail/templates/compose/src/template-session
 */
jn.define('mail/templates/compose/src/template-session', (require, exports, module) => {
	const { TemplateApi } = require('mail/templates/compose/src/template-api');
	const { TemplateSearch } = require('mail/templates/compose/src/template-search');
	const { PerfPoint } = require('debug/prism');
	const QUICK_LIMIT = 5;

	class MailTemplateSession
	{
		constructor({ api = new TemplateApi(), perfPointClass = PerfPoint } = {})
		{
			this.api = api;
			this.perfPointClass = perfPointClass;
			this.destroyed = false;
			this.generation = 0;
			this.quickPromise = null;
			this.priorityReference = null;
			this.pinRecentlyCreated = false;
			this.listeners = new Set();
			this.searches = new Set();
			this.perfPoints = new Set();
			this.state = {
				quickItems: [],
				isQuickLoading: false,
				quickError: false,
				quickLoaded: false,
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

		async loadQuick(force = false)
		{
			if (this.destroyed)
			{
				return false;
			}

			if (this.quickPromise)
			{
				await this.quickPromise;
				if (this.destroyed)
				{
					return false;
				}

				if (!force)
				{
					return !this.state.quickError;
				}
			}

			if (this.state.quickLoaded && !force)
			{
				return true;
			}

			const generation = this.generation;
			const request = this.#requestQuick(generation);
			this.quickPromise = request;
			try
			{
				return await request;
			}
			finally
			{
				if (this.quickPromise === request)
				{
					this.quickPromise = null;
				}
			}
		}

		prioritizeCreated(reference = null)
		{
			this.priorityReference = reference;
			this.pinRecentlyCreated = reference === null;
		}

		createSearch(options = {})
		{
			const search = new TemplateSearch({ api: this.api, perfPointClass: this.perfPointClass, ...options });
			this.searches.add(search);

			return search;
		}

		destroy()
		{
			this.destroyed = true;
			this.generation += 1;
			this.quickPromise = null;
			this.priorityReference = null;
			this.pinRecentlyCreated = false;
			this.searches.forEach((search) => search.destroy());
			this.searches.clear();
			this.listeners.clear();
			this.perfPoints.forEach((point) => point.end());
			this.perfPoints.clear();
		}

		async #requestQuick(generation)
		{
			const perfPoint = new this.perfPointClass('Mail Templates Quick List', 'quickList').start();
			this.perfPoints.add(perfPoint);
			this.#patchState({ isQuickLoading: true, quickError: false });
			const priorityReference = this.priorityReference;
			const pinRecentlyCreated = this.pinRecentlyCreated;
			this.priorityReference = null;
			this.pinRecentlyCreated = false;
			try
			{
				const response = await this.api.quickList(priorityReference, pinRecentlyCreated);
				if (this.destroyed || generation !== this.generation)
				{
					return false;
				}

				const patch = {
					quickItems: Array.isArray(response.items) ? response.items.slice(0, QUICK_LIMIT) : [],
					isQuickLoading: false,
					quickError: false,
					quickLoaded: true,
				};
				this.#patchState(patch);

				return true;
			}
			catch (failure)
			{
				if (!this.destroyed && generation === this.generation)
				{
					this.priorityReference ??= priorityReference;
					this.pinRecentlyCreated ||= pinRecentlyCreated;
					this.#patchState({ isQuickLoading: false, quickError: true, quickLoaded: false });
				}

				return false;
			}
			finally
			{
				perfPoint.end();
				this.perfPoints.delete(perfPoint);
			}
		}

		#patchState(patch)
		{
			Object.assign(this.state, patch);
			this.#notify();
		}

		#notify()
		{
			this.listeners.forEach((listener) => listener(this.state));
		}
	}

	module.exports = { MailTemplateSession };
});
