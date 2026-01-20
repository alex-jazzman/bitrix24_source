/**
 * @module more-menu/block/tools-list
 */
jn.define('more-menu/block/tools-list', (require, exports, module) => {
	const {
		handleItemClick,
		getUpdateSectionsWithCounters,
	} = require('more-menu/utils');
	const { List } = require('more-menu/ui/list');
	const { PropTypes } = require('utils/validation');
	const { PureComponent } = require('layout/pure-component');

	/**
	 * @class ToolsList
	 */
	class ToolsList extends PureComponent
	{
		render()
		{
			const { testId, menuList, counters } = this.props;

			return new List({
				testId,
				structure: getUpdateSectionsWithCounters(menuList, counters),
				onItemClick: handleItemClick,
			});
		}
	}

	ToolsList.propTypes = {
		menuList: PropTypes.array.isRequired,
		counters: PropTypes.object,
		onBeforeItemClick: PropTypes.func,
		testId: PropTypes.string.isRequired,
	};

	module.exports = {
		ToolsList,
	};
});
