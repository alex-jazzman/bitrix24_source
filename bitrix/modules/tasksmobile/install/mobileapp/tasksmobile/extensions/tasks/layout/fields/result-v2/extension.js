/**
 * @module tasks/layout/fields/result-v2
 */
jn.define('tasks/layout/fields/result-v2', (require, exports, module) => {
	const { ResultEntry } = require('tasks/layout/fields/result-v2/entry');

	/**
	 * @class TaskResultField
	 */
	class TaskResultField extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.fieldContainerRef = null;
		}

		render()
		{
			if (this.props.ThemeComponent)
			{
				return this.props.ThemeComponent(this);
			}

			return null;
		}

		/**
		 * @public
		 * @param {PageManager} [parentWidget = this.parentWidget]
		 */
		openResultCreation(parentWidget = this.parentWidget)
		{
			ResultEntry.openResultCreation(this.taskId, parentWidget);
		}

		/**
		 * @public
		 * @param {number} resultId
		 * @param {boolean} [isFocused = false]
		 * @param {PageManager} [parentWidget = this.parentWidget]
		 */
		openResult(resultId, isFocused = false, parentWidget = this.parentWidget)
		{
			void ResultEntry.openResult(resultId, isFocused, this.taskId, parentWidget);
		}

		/**
		 * @public
		 */
		openResultList()
		{
			ResultEntry.openResultList(this.taskId, this.parentWidget);
		}

		/**
		 * @public
		 * @param {number} id
		 */
		removeResult(id)
		{
			ResultEntry.removeResult(id, this.taskId);
		}

		/**
		 * @public
		 * @returns {number|string}
		 */
		get taskId()
		{
			return this.props.taskId;
		}

		/**
		 * @public
		 * @returns {string}
		 */
		get testId()
		{
			return this.props.testId;
		}

		/**
		 * @public
		 * @returns {PageManager}
		 */
		get parentWidget()
		{
			return this.props.config.parentWidget;
		}

		/**
		 * @public
		 * @returns {number}
		 */
		getResultsCount()
		{
			return this.props.resultsCount;
		}

		/**
		 * @public
		 * @returns {boolean}
		 */
		isEmpty()
		{
			return (this.getResultsCount() === 0);
		}

		/**
		 * @public
		 * @returns {boolean}
		 */
		isReadOnly()
		{
			return this.props.readOnly;
		}

		/**
		 * @public
		 * @returns {boolean}
		 */
		validate()
		{
			return true;
		}

		/**
		 * @public
		 * @returns {boolean}
		 */
		isValid()
		{
			return true;
		}

		/**
		 * @public
		 * @returns {boolean}
		 */
		isRequired()
		{
			return false;
		}

		/**
		 * @public
		 * @returns {string}
		 */
		getId()
		{
			return 'result';
		}

		/**
		 * @public
		 * @returns {boolean}
		 */
		hasUploadingFiles()
		{
			return false;
		}

		/**
		 * @public
		 * @param ref
		 */
		bindContainerRef(ref)
		{
			this.fieldContainerRef = ref;
		}
	}

	module.exports = { TaskResultField };
});
