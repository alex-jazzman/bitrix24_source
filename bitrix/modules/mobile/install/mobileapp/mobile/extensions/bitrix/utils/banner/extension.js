/**
 * @module utils/banner
 */
jn.define('utils/banner', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	const DEFAULT_CACHE_TTL = 24 * 60 * 60;

	class BannerService
	{
		#code;
		#cacheId;
		#cacheTtl;

		constructor({ code, cacheTtl = DEFAULT_CACHE_TTL })
		{
			this.#code = code;
			this.#cacheId = `mobile-banner-${code}`;
			this.#cacheTtl = cacheTtl;
		}

		async getStatus()
		{
			const executor = this.#createStatusExecutor();
			const cached = executor.getCache().getData();

			if (cached?.data)
			{
				return cached.data;
			}

			const response = await executor.call(false);

			return response?.data ?? {};
		}

		async dismiss()
		{
			try
			{
				await new RunActionExecutor('mobile.Banner.dismiss', { code: this.#code })
					.call(false);

				this.#createStatusExecutor()
					.getCache()
					.saveData({
						data: {
							isVisible: false,
						},
					});
			}
			catch (error)
			{
				console.error(error);
			}
		}

		#createStatusExecutor()
		{
			return new RunActionExecutor('mobile.Banner.getStatus', { code: this.#code })
				.setCacheId(this.#cacheId)
				.setCacheTtl(this.#cacheTtl);
		}
	}

	module.exports = { BannerService };
});
