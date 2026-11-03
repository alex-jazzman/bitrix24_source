/** @module tasks/checklist/controller/src/filter-storage */
jn.define('tasks/checklist/controller/src/filter-storage', (require, exports, module) => {
	const STORAGE_KEY = 'tasks.checklist.filter';

	/**
	 * The filter is a device-local user preference: it outlives the task card and the app session,
	 * but is not synced with the web or with other devices.
	 *
	 * @param {number|string} userId
	 * @return {string}
	 */
	const storageKey = (userId) => `${STORAGE_KEY}.${Number(userId) || 0}`;

	/**
	 * @param {ChecklistConditions} [filter]
	 * @return {ChecklistConditions}
	 */
	const normalize = (filter) => ({
		onlyMine: Boolean(filter?.onlyMine),
		hideCompleted: Boolean(filter?.hideCompleted),
	});

	/**
	 * @param {number|string} userId
	 * @return {ChecklistConditions}
	 */
	const readChecklistFilter = (userId) => normalize(Application.storage.getObject(storageKey(userId), {}));

	/**
	 * @param {number|string} userId
	 * @param {ChecklistConditions} filter
	 */
	const saveChecklistFilter = (userId, filter) => {
		Application.storage.setObject(storageKey(userId), normalize(filter));
	};

	module.exports = { readChecklistFilter, saveChecklistFilter };
});
