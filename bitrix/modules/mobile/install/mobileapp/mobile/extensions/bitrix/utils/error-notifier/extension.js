/**
 * @module utils/error-notifier
 */
jn.define('utils/error-notifier', (require, exports, module) => {
	const { Loc } = require('loc');

	/**
	 * @class ErrorNotifier
	 */
	class ErrorNotifier
	{
		static showErrors(errors, options = {})
		{
			errors = Array.isArray(errors) ? errors : [];

			const {
				textBefore,
				addDefaultIfEmpty,
				defaultErrorText,
				title,
			} = options;

			if (errors.length === 0 && addDefaultIfEmpty === true)
			{
				errors.push({
					message: (defaultErrorText || Loc.getMessage('UTILS_ERROR_NOTIFIER_DEFAULT_ERROR')),
				});
			}

			return this.showError(
				(textBefore ? `${textBefore}\n` : '')
				+ ErrorNotifier.joinErrors(errors),
				title || '',
			);
		}

		static joinErrors(errors)
		{
			return errors.map(({ message }) => message).filter(Boolean).join('\n');
		}

		static showError(text, title = '')
		{
			return new Promise((resolve, reject) => {
				navigator.notification.alert(
					text,
					() => resolve(),
					title,
				);
			});
		}
	}

	module.exports = {
		ErrorNotifier,
	};
});

(() => {
	const require = (ext) => jn.require(ext);
	const { ErrorNotifier } = require('utils/error-notifier');

	this.ErrorNotifier = ErrorNotifier;
})();
