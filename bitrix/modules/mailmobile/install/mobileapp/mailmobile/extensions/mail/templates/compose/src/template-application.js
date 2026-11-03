/**
 * @module mail/templates/compose/src/template-application
 */
jn.define('mail/templates/compose/src/template-application', (require, exports, module) => {
	const { PerfPoint } = require('debug/prism');

	class TemplateApplicationController
	{
		constructor({ api, host, session = null, perfPointClass = PerfPoint } = {})
		{
			this.api = api;
			this.host = host;
			this.session = session;
			this.perfPointClass = perfPointClass;
			this.generation = 0;
			this.destroyed = false;
			this.prepared = null;
			this.perfPoints = new Set();
		}

		async select(reference)
		{
			if (!TemplateApplicationController.isReference(reference) || this.destroyed)
			{
				return { status: 'cancelled' };
			}

			const generation = ++this.generation;
			this.prepared = null;
			try
			{
				const { template } = await this.#measure('Mail Template Prepare', 'select', () => this.api.prepare(reference));
				if (!this.#isCurrent(generation))
				{
					return { status: 'stale' };
				}

				this.prepared = template;
				if (this.host.hasUserContent())
				{
					return { status: 'needsDecision', template, generation };
				}

				return this.complete('replace', generation);
			}
			catch (failure)
			{
				return this.#isCurrent(generation) ? { status: 'failed', failure } : { status: 'stale' };
			}
		}

		async complete(decision, generation = this.generation)
		{
			if (!this.#isCurrent(generation))
			{
				return { status: 'stale' };
			}

			if (decision === 'cancel' || !this.prepared)
			{
				this.prepared = null;

				return { status: 'cancelled' };
			}

			const template = this.prepared;
			this.prepared = null;
			let applied = false;
			try
			{
				applied = await this.#measure(
					'Mail Template Apply',
					decision,
					() => this.host.applyTemplate(template, decision),
				);
			}
			catch (failure)
			{
				return { status: 'failed', failure };
			}
			if (!applied || !this.#isCurrent(generation))
			{
				return { status: applied ? 'stale' : 'failed' };
			}

			void this.api.recordUsage(template.reference).catch(() => {});

			return { status: 'applied' };
		}

		destroy()
		{
			this.destroyed = true;
			this.generation += 1;
			this.prepared = null;
			this.perfPoints.forEach((point) => point.end());
			this.perfPoints.clear();
		}

		async #measure(badge, label, action)
		{
			const perfPoint = new this.perfPointClass(badge, label).start();
			this.perfPoints.add(perfPoint);
			try
			{
				return await action();
			}
			finally
			{
				perfPoint.end();
				this.perfPoints.delete(perfPoint);
			}
		}

		#isCurrent(generation)
		{
			return !this.destroyed && generation === this.generation;
		}

		static isReference(reference)
		{
			return typeof reference?.source === 'string'
				&& reference.source.trim() !== ''
				&& Number.isInteger(reference.id)
				&& reference.id > 0
			;
		}
	}

	module.exports = { TemplateApplicationController };
});
