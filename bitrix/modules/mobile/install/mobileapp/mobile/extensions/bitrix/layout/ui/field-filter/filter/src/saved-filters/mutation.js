/**
 * @module layout/ui/field-filter/filter/src/saved-filters/mutation
 */
jn.define('layout/ui/field-filter/filter/src/saved-filters/mutation', (require, exports, module) => {
	const { showErrorToast } = require('toast');
	const { SavedFilterError } = require('layout/ui/field-filter/filter/src/enums/saved-filter-error');
	const { runInOrder } = require('layout/ui/field-filter/filter/src/serial-queue');

	/**
	 * Runs an action over the saved filters the way the screens show it: the store changes first and
	 * the request follows.
	 *
	 * The store is the single source of the list, so an action is drawn from the change itself
	 * instead of from the answer to it: the tap is served on the frame it happened, and the request
	 * behind it stays out of sight - which is what the action costs while the server agrees, and it
	 * does agree unless something is broken.
	 *
	 * A server that refuses gets the change taken back: the state as it stood before the action is
	 * put down again and the reason is shown as a toast.
	 *
	 * @param {PresetMutationParams} params
	 * @return {Promise<SavedFiltersResult>}
	 */
	const runPresetMutation = (params) => {
		// the actions of one filter, one after another: the rollback of a refused action puts the whole
		// state of the list back, so an action may only snapshot a state nothing else is about to
		// change. With two actions in flight the failure of the first undid the second - a preset
		// deleted in the meantime came back to the strip, and every request behind it named a preset
		// the server no longer had
		return runInOrder(params.filter, () => applyPresetMutation(params));
	};

	/**
	 * @param {PresetMutationParams} params
	 * @return {Promise<SavedFiltersResult>}
	 */
	const applyPresetMutation = async ({ filter, mutate, request, onChange }) => {
		const snapshot = filter.getSnapshot();

		mutate();
		onChange?.();

		const result = await send(request);

		if (!result.success)
		{
			filter.restoreSnapshot(snapshot);
			onChange?.();
			showErrorToast({ message: result.message });
		}

		return result;
	};

	/**
	 * A request that never answers - a connection lost, an error nobody wrapped - has to take the
	 * change back like any other failure, so a throw is worded as a failed result.
	 *
	 * @param {function(): Promise<SavedFiltersResult>} request
	 * @return {Promise<SavedFiltersResult>}
	 */
	const send = async (request) => {
		try
		{
			return await request();
		}
		catch (error)
		{
			console.error(error);

			return { success: false, code: null, message: SavedFilterError.getMessageByCode(null) };
		}
	};

	module.exports = { runPresetMutation };
});
