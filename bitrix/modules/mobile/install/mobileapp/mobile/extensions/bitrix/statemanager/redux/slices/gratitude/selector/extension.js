/**
 * @module statemanager/redux/slices/gratitude/selector
 */
jn.define('statemanager/redux/slices/gratitude/selector', (require, exports, module) => {
	const { sliceName, gratitudeAdapter } = require('statemanager/redux/slices/gratitude/meta');
	const { createDraftSafeSelector } = require('statemanager/redux/toolkit');
	const {
		selectAll,
	} = gratitudeAdapter.getSelectors((state) => state[sliceName]);

	const selectGratitudesByOwnerId = createDraftSafeSelector(
		[selectAll, (_, userId) => userId],
		(gratitudes, userId) => gratitudes.filter((gratitude) => gratitude?.ownerId === userId),
	);

	const selectGratitudesQuantityByOwnerId = createDraftSafeSelector(
		[selectAll, (_, userId) => userId],
		(gratitudes, userId) => gratitudes.reduce((
			count,
			gratitude,
		) => (gratitude?.ownerId === userId ? count + 1 : count), 0),
	);

	const selectGratitudeById = createDraftSafeSelector(
		[selectAll, (_, id) => id],
		(gratitudes, id) => gratitudes.find((gratitude) => gratitude?.id === id),
	);

	const selectNameById = createDraftSafeSelector(
		[selectAll, (_, id) => id],
		(gratitudes, id) => gratitudes.find((gratitude) => gratitude?.id === id)?.name,
	);

	const selectRelatedPostIdById = createDraftSafeSelector(
		[selectAll, (_, id) => id],
		(gratitudes, id) => gratitudes.find((gratitude) => gratitude?.id === id)?.relatedPostId,
	);

	const selectCreatedAtById = createDraftSafeSelector(
		[selectAll, (_, id) => id],
		(gratitudes, id) => gratitudes.find((gratitude) => gratitude?.id === id)?.createdAt,
	);

	const selectTitleById = createDraftSafeSelector(
		[selectAll, (_, id) => id],
		(gratitudes, id) => gratitudes.find((gratitude) => gratitude?.id === id)?.title,
	);

	module.exports = {
		selectGratitudesByOwnerId,
		selectGratitudesQuantityByOwnerId,
		selectGratitudeById,
		selectNameById,
		selectRelatedPostIdById,
		selectCreatedAtById,
		selectTitleById,
	};
});
