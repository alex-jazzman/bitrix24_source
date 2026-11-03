/**
 * @module timeman/workday-intent/workday-intent-id
 */
jn.define('timeman/workday-intent/workday-intent-id', (require, exports, module) => {
	const WorkdayIntentId = {
		WORKDAY: 'WORKDAY',
		WEEKEND: 'WEEKEND',
		LEAVEUNPAYED: 'LEAVEUNPAYED',
		VACATION: 'VACATION',
		LEAVESICK: 'LEAVESICK',
	};

	module.exports = { WorkdayIntentId };
});
