/**
 * @module tasks/statemanager/redux/slices/project-list/src/tools
 */
jn.define('tasks/statemanager/redux/slices/project-list/src/tools', (require, exports, module) => {
	/** @type {ProjectListItem} */
	const defaultItem = {
		id: 0,
		activityDate: null,
		isPinned: false,
		opened: false,
		closed: false,
		visible: false,
		ownerId: 0,
		moderatorIds: [],
		memberIds: [],
		counter: {},
		actions: {},
		hasCollabers: false,
	};

	const normalizeId = (value) => {
		const id = Number(value);

		return id > 0 ? id : 0;
	};

	const normalizeIdList = (list, fallback = []) => {
		if (!Array.isArray(list))
		{
			return fallback;
		}

		return [
			...new Set(
				list
				.map((id) => normalizeId(id))
				.filter((id) => id > 0),
			)
		];
	};

	/**
	 * @param {object} item
	 * @param {Partial<ProjectListItem>} existingItem
	 * @returns {ProjectListItem|null}
	 */
	const normalizeProjectListItem = (item, existingItem = {}) => {
		const getValue = (field) => item?.[field] ?? existingItem[field] ?? defaultItem[field];
		const id = normalizeId(getValue('id'));

		if (id <= 0)
		{
			return null;
		}

		return {
			...defaultItem,
			...existingItem,
			id,
			activityDate: getValue('activityDate'),
			isPinned: getValue('isPinned'),
			opened: getValue('opened'),
			closed: getValue('closed'),
			visible: getValue('visible'),
			ownerId: normalizeId(getValue('ownerId')),
			moderatorIds: normalizeIdList(getValue('moderatorIds')),
			memberIds: normalizeIdList(getValue('memberIds')),
			counter: getValue('counter'),
			actions: getValue('actions'),
			hasCollabers: getValue('hasCollabers'),
		};
	};

	/**
	 * @param {ProjectListState} state
	 * @param {object[]} items
	 * @returns {ProjectListItem[]}
	 */
	const prepareProjectListItems = (state, items) => {
		if (!Array.isArray(items))
		{
			return [];
		}

		return items
			.map((item) => normalizeProjectListItem(item, state.entities?.[normalizeId(item?.id)]))
			.filter(Boolean);
	};

	module.exports = {
		normalizeId,
		prepareProjectListItems,
	};
});
