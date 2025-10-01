/**
 * @module user-profile/common-tab/src/block/base-block
 */
jn.define('user-profile/common-tab/src/block/base-block', (require, exports, module) => {
	const { BaseViewWrapper, ViewMode } = require('user-profile/common-tab/src/block/base-view');

	class BaseBlock
	{
		constructor(props)
		{
			this.props = this.prepareProps(props);
		}

		/**
		 * @returns {boolean}
		 */
		isAvailable()
		{
			return true;
		}

		/**
		 * @returns {boolean}
		 */
		shouldUseBaseWrapper()
		{
			return true;
		}

		/**
		 * @returns {string}
		 */
		getViewMode()
		{
			return ViewMode.FULL_WIDTH;
		}

		/**
		 * @returns {string|null}
		 */
		getTitle()
		{
			return null;
		}

		/**
		 * @returns {Function}
		 */
		getContentClass()
		{
			throw new Error('Not implemented method getContentClass()');
		}

		/**
		 * @returns {number}
		 */
		getSort()
		{
			return 0;
		}

		/**
		 * @param {Object} commonTabData
		 */
		prepareProps(commonTabData)
		{
			return commonTabData;
		}

		/**
		 * @returns {BaseViewWrapper|LayoutComponent}
		 */
		render()
		{
			const content = this.#getContent();

			if (this.shouldUseBaseWrapper())
			{
				return this.#wrapWithBaseView({ content, ...this.props });
			}

			return content;
		}

		/**
		 * @returns {LayoutComponent}
		 */
		#getContent()
		{
			const ContentClass = this.getContentClass();

			return ContentClass(this.props);
		}

		#wrapWithBaseView(props)
		{
			const {
				content,
				testId = null,
				onClick = null,
				style = {},
				title = this.getTitle(),
				viewMode = this.getViewMode(),
			} = props;

			return BaseViewWrapper({
				title,
				content,
				testId,
				viewMode,
				onClick,
				style,
			});
		}
	}

	module.exports = {
		BaseBlock,
	};
});
