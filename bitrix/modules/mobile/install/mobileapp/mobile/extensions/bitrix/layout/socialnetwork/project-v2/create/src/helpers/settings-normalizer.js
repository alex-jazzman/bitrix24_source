/**
 * @module layout/socialnetwork/project-v2/create/src/helpers/settings-normalizer
 */
jn.define('layout/socialnetwork/project-v2/create/src/helpers/settings-normalizer', (require, exports, module) => {
	const DEFAULT_OWNER = {
		id: 0,
		title: '',
		imageUrl: '',
	};

	const normalizeUserItem = (item = {}, fallback = DEFAULT_OWNER) => ({
		...fallback,
		...item,
		id: Number(item.id ?? fallback.id),
		title: item.title ?? fallback.title,
		imageUrl: item.imageUrl ?? fallback.imageUrl,
	});

	const normalizeDepartmentItem = (item = {}) => ({
		...item,
		id: Number(item.id ?? 0),
		title: item.title ?? '',
		imageUrl: item.imageUrl ?? '',
	});

	const getUniqueUserItems = (items = [], excludedIds = new Set()) => {
		const uniqueIds = new Set();

		return (Array.isArray(items) ? items : []).reduce((result, item) => {
			const normalizedItem = normalizeUserItem(item);
			const id = normalizedItem.id;

			if (id <= 0 || uniqueIds.has(id) || excludedIds.has(id))
			{
				return result;
			}

			uniqueIds.add(id);
			result.push(normalizedItem);

			return result;
		}, []);
	};

	const getUniqueDepartmentItems = (items = []) => {
		const uniqueIds = new Set();

		return (Array.isArray(items) ? items : []).reduce((result, item) => {
			const normalizedItem = normalizeDepartmentItem(item);
			const id = normalizedItem.id;

			if (id <= 0 || uniqueIds.has(id))
			{
				return result;
			}

			uniqueIds.add(id);
			result.push(normalizedItem);

			return result;
		}, []);
	};

	const normalizeProjectSettings = (settings = {}) => {
		const ownerData = normalizeUserItem(settings.ownerData, DEFAULT_OWNER);
		const ownerId = ownerData.id;

		const moderatorsData = getUniqueUserItems(
			settings.moderatorsData,
			new Set(ownerId > 0 ? [ownerId] : []),
		);
		const moderatorIds = new Set(moderatorsData.map((item) => item.id));
		const excludedParticipantIds = new Set([
			...moderatorIds,
			...(ownerId > 0 ? [ownerId] : []),
		]);

		return {
			...settings,
			ownerData,
			moderatorsData,
			participants: {
				user: getUniqueUserItems(settings.participants?.user, excludedParticipantIds),
				department: getUniqueDepartmentItems(settings.participants?.department),
			},
		};
	};

	const hasInvalidDateRange = (settings = {}) => {
		const dateStart = Number(settings.dateStart ?? 0);
		const dateFinish = Number(settings.dateFinish ?? 0);

		return dateStart > 0 && dateFinish > 0 && dateStart > dateFinish;
	};

	module.exports = {
		normalizeProjectSettings,
		hasInvalidDateRange,
	};
});
