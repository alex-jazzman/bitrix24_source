/**
 * @module im/lib/theme
 */
jn.define('im/lib/theme', (require, exports, module) => {
	const { Feature } = require('feature');
	const AppTheme = require('apptheme');

	let tokens = null;
	try
	{
		tokens = require('tokens');
	}
	catch (e)
	{
		console.error(e);
	}

	let tokenCollection = null;

	class Theme
	{
		/**
		 * @return {{[p: string]: string}}
		 */
		static get colors()
		{
			if (
				Theme.isDesignSystemSupported
				&& tokens?.Color
			)
			{
				tokenCollection ??= Theme.createNewDesignTokenCollection();

				return tokenCollection;
			}

			return AppTheme.colors;
		}

		static createNewDesignTokenCollection()
		{
			const result = {};
			Object.keys(tokens.Color).forEach((token) => {
				result[token] = tokens.Color[token].getValue();
			});

			return result;
		}

		static get isDesignSystemSupported()
		{
			return Feature.isAirStyleSupported();
		}

		/**
		 * @return {Theme}
		 */
		static getInstance()
		{
			if (!this.instance)
			{
				this.instance = new this();
			}

			return this.instance;
		}

		getId()
		{
			return AppTheme.id;
		}
	}

	module.exports = {
		Theme,
	};
});
