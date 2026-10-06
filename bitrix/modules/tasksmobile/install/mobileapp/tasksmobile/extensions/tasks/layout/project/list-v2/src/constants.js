/**
 * @module tasks/layout/project/list-v2/src/constants
 */
jn.define('tasks/layout/project/list-v2/src/constants', (require, exports, module) => {
		/** @type {ProjectListMode} */
		const PROJECT_LIST_MODE = 'tasks_project';
		/** @type {'my'} */
		const DEFAULT_PRESET_ID = 'my';
		/** @type {{none: 'none', sonetTotalExpired: 'sonetTotalExpired', sonetTotalComments: 'sonetTotalComments'}} */
		const COUNTER_FILTER = {
			none: 'none',
			sonetTotalExpired: 'sonetTotalExpired',
			sonetTotalComments: 'sonetTotalComments',
		};
		/** @type {string[]} */
		const COUNTER_TYPES_TO_LOAD = [
			'sonet_total_expired',
			'sonet_total_comments',
		];

		/** @type {'readAll'} */
		const READ_ALL_BUTTON_ID = 'readAll';

	module.exports = {
		PROJECT_LIST_MODE,
		DEFAULT_PRESET_ID,
		COUNTER_FILTER,
		COUNTER_TYPES_TO_LOAD,
		READ_ALL_BUTTON_ID,
	};
});
