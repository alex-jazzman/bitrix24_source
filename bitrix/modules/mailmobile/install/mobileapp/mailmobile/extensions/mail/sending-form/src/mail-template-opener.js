/**
 * @module mail/sending-form/src/mail-template-opener
 */
jn.define('mail/sending-form/src/mail-template-opener', (require, exports, module) => {
	const { PerfPoint } = require('debug/prism');
	const getMailTemplateAction = (enabled, action) => (
		enabled === true ? { templatesButton: action } : {}
	);

	class MailTemplateOpener
	{
		constructor({ loadModule, onModule = null, onError = null, perfPointClass = PerfPoint })
		{
			this.loadModule = loadModule;
			this.onModule = onModule;
			this.onError = onError;
			this.perfPointClass = perfPointClass;
			this.opening = null;
			this.destroyed = false;
			this.navigator = null;
			this.perfPoint = null;
		}

		open(options)
		{
			if (this.destroyed)
			{
				return Promise.resolve(false);
			}

			if (this.opening)
			{
				return this.opening;
			}

			const request = this.#open(options);
			this.opening = request.finally(() => {
				if (this.opening === request || this.opening === wrapped)
				{
					this.opening = null;
				}
			});
			const wrapped = this.opening;

			return wrapped;
		}

		destroy()
		{
			this.destroyed = true;
			this.navigator = null;
			this.#finishPerfPoint(this.perfPoint);
		}

		async #open(options)
		{
			const perfPoint = new this.perfPointClass('Mail Templates Open', 'picker').start();
			this.perfPoint = perfPoint;
			try
			{
				perfPoint.startPoint('Load Templates Extension');
				let templatesModule;
				try
				{
					templatesModule = await this.loadModule();
				}
				finally
				{
					perfPoint.endPoint('Load Templates Extension');
				}
				if (this.destroyed)
				{
					return false;
				}

				if (!templatesModule?.TemplateNavigator)
				{
					this.onError?.();

					return false;
				}

				this.onModule?.(templatesModule);
				this.navigator = new templatesModule.TemplateNavigator();
				perfPoint.startPoint('Open Picker Widget');
				try
				{
					await this.navigator.open(options);
				}
				finally
				{
					perfPoint.endPoint('Open Picker Widget');
				}

				return !this.destroyed;
			}
			catch (failure)
			{
				if (!this.destroyed)
				{
					this.onError?.(failure);
				}

				return false;
			}
			finally
			{
				this.#finishPerfPoint(perfPoint);
			}
		}

		#finishPerfPoint(perfPoint)
		{
			perfPoint?.endPoint('Load Templates Extension');
			perfPoint?.endPoint('Open Picker Widget');
			perfPoint?.end();
			if (this.perfPoint === perfPoint)
			{
				this.perfPoint = null;
			}
		}
	}

	module.exports = { MailTemplateOpener, getMailTemplateAction };
});
