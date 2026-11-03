/**
 * @module mail/statemanager/redux/slices/labels/observers/stateful-list
 */
jn.define('mail/statemanager/redux/slices/labels/observers/stateful-list', (require, exports, module) => {
	const {
		selectAllLabels,
		selectCurrentLabelId,
		selectLabelsLoaded,
	} = require('mail/statemanager/redux/slices/labels/selector');
	const { isEqual } = require('utils/object');

	/**
	 * Changes of the labels domain, which the folders observer does not see: it watches the folders
	 * slice only, so the answer of the dictionary and a switch between two labels reach nobody.
	 *
	 * `onChange` receives `{ dictionaryChanged, currentLabelIdChanged, currentLabelId }`.
	 *
	 * @param {object} store
	 * @param {function({
	 *     dictionaryChanged: boolean,
	 *     currentLabelIdChanged: boolean,
	 *     currentLabelId: (number|null),
	 * }): void} onChange
	 * @return {function(): void} unsubscribe
	 */
	const observeLabelsChange = (store, onChange) => {
		let prevLabels = selectAllLabels(store.getState());
		let prevLoaded = selectLabelsLoaded(store.getState());
		let prevCurrentLabelId = selectCurrentLabelId(store.getState());

		return store.subscribe(() => {
			const nextLabels = selectAllLabels(store.getState());
			const nextLoaded = selectLabelsLoaded(store.getState());
			const nextCurrentLabelId = selectCurrentLabelId(store.getState());

			const dictionaryChanged = prevLoaded !== nextLoaded || !isEqual(prevLabels, nextLabels);
			const currentLabelIdChanged = prevCurrentLabelId !== nextCurrentLabelId;

			prevLabels = nextLabels;
			prevLoaded = nextLoaded;
			prevCurrentLabelId = nextCurrentLabelId;

			if (dictionaryChanged || currentLabelIdChanged)
			{
				onChange({
					dictionaryChanged,
					currentLabelIdChanged,
					currentLabelId: nextCurrentLabelId,
				});
			}
		});
	};

	module.exports = { observeLabelsChange };
});
