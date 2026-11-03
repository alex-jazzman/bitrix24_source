/**
 * @module qrauth/show-code/src/code-cache
 */
jn.define('qrauth/show-code/src/code-cache', (require, exports, module) => {
	const MILLISECONDS_IN_SECOND = 1000;
	// A code with less than this left is not worth showing: the sheet would open onto a countdown
	// about to expire and refresh right away.
	const MIN_USABLE_MILLISECONDS = 5 * MILLISECONDS_IN_SECOND;

	// The login link is a bearer credential, so the last code lives in the memory of this JS context
	// only and never reaches Application.storage or disk.
	let storedCode = null;

	class QrCodeCache
	{
		/**
		 * @param {{ image: string, ttl: number, isDarkMode: boolean }} params
		 */
		static set({ image, ttl, isDarkMode })
		{
			storedCode = {
				image,
				deadlineAt: Date.now() + (ttl * MILLISECONDS_IN_SECOND),
				isDarkMode,
			};
		}

		/**
		 * @param {boolean} isDarkMode
		 * @return {{ image: string, secondsLeft: number }|null}
		 */
		static get(isDarkMode)
		{
			if (storedCode === null || storedCode.isDarkMode !== isDarkMode)
			{
				return null;
			}

			const millisecondsLeft = storedCode.deadlineAt - Date.now();

			if (millisecondsLeft <= MIN_USABLE_MILLISECONDS)
			{
				return null;
			}

			return {
				image: storedCode.image,
				secondsLeft: Math.max(1, Math.floor(millisecondsLeft / MILLISECONDS_IN_SECOND)),
			};
		}

		static clear()
		{
			storedCode = null;
		}
	}

	module.exports = { QrCodeCache };
});
