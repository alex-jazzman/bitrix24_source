/**
 * @module tasks/project-list/simple-list/items/project-redux
 */
jn.define('tasks/project-list/simple-list/items/project-redux', (require, exports, module) => {
	const { Base } = require('layout/ui/simple-list/items/base');
	const { ProjectContentView } = require('tasks/project-list/simple-list/items/project-redux/src/project-content');

	class Project extends Base
	{
		/**
		 * @returns {object|null}
		 */
		renderItemContent()
		{
			return ProjectContentView({
				id: this.props.item.id,
				testId: this.props.testId,
			});
		}

		/**
		 * @param {?Function} callback
		 */
		blink(callback = null)
		{
			if (typeof callback === 'function')
			{
				callback();
			}
		}

		setLoading(callback = null)
		{
			this.blink(callback);
		}

		dropLoading(callback = null)
		{
			this.blink(callback);
		}
	}

	module.exports = { Project };
});
