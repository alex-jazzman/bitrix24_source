/** @module tasks/checklist/view-model/support/src/focus */
jn.define('tasks/checklist/view-model/support/src/focus', (require, exports, module) => {
	/** @return {ChecklistFocusController} */
	const makeNoopFocusController = () => {
		let focusedItemId = null;

		return {
			getFocusedItemId: () => focusedItemId,
			isFocused: (id) => focusedItemId === id,
			focus: (id) => {
				focusedItemId = id;
			},
			blur: (id) => {
				if (focusedItemId === id)
				{
					focusedItemId = null;
				}
			},
		};
	};

	module.exports = { makeNoopFocusController };
});
