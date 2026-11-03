/**
 * @module more-menu/block/company/bitrix-answers/screen/src/nav-state
 */
jn.define('more-menu/block/company/bitrix-answers/screen/src/nav-state', (require, exports, module) => {
	const { Type } = require('type');

	class BitrixAnswersNavState
	{
		#fallbackTitle = '';
		#title = '';
		#searchVisible = false;
		#searchValue = '';
		#canGoBack = false;

		/**
		 * @param {{ title?: string }} options title the screen opened with
		 */
		constructor({ title = '' } = {})
		{
			this.#fallbackTitle = Type.isStringFilled(title) ? title : '';
		}

		/**
		 * A key left out keeps what the bar already shows.
		 *
		 * @param {{
		 *     title?: string,
		 *     searchVisible?: boolean,
		 *     searchValue?: string,
		 *     canGoBack?: boolean,
		 * }} patch
		 */
		update(patch = {})
		{
			if (!Type.isPlainObject(patch))
			{
				return;
			}

			const { title, searchVisible, searchValue, canGoBack } = patch;

			if (Type.isString(title))
			{
				// an empty text is the reset of the title, not a title of no letters
				this.#title = title;
			}

			if (Type.isBoolean(searchVisible))
			{
				this.#searchVisible = searchVisible;
			}

			if (Type.isString(searchValue))
			{
				this.#searchValue = searchValue;
			}

			if (Type.isBoolean(canGoBack))
			{
				this.#canGoBack = canGoBack;
			}
		}

		getTitle()
		{
			return Type.isStringFilled(this.#title) ? this.#title : this.#fallbackTitle;
		}

		shouldShowSearchButton()
		{
			return this.#searchVisible;
		}

		getSearchValue()
		{
			return this.#searchValue;
		}

		hasSearchValue()
		{
			return Type.isStringFilled(this.#searchValue);
		}

		canGoBack()
		{
			return this.#canGoBack;
		}
	}

	module.exports = { BitrixAnswersNavState };
});
