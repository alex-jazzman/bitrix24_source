/**
 * @module disk/statemanager/redux/slices/settings
 */
jn.define('disk/statemanager/redux/slices/settings', (require, exports, module) => {
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice } = require('statemanager/redux/toolkit');
	const { Cache } = require('disk/cache');

	const reducerName = 'disk:settings';
	const DEFAULT_SORTING_TYPE = 'UPDATE_TIME';
	const DEFAULT_SORTING_IS_ASC = false;
	const SORTING_TYPES = ['UPDATE_TIME', 'CREATE_TIME', 'NAME', 'SIZE'];

	const initialState = {
		showFileExtension: Cache.get('show-file-extension', false),
		sortingType: getStoredSortingType(),
		sortingIsASC: getStoredSortingOrder(),
	};

	const settingsSlice = createSlice({
		name: reducerName,
		initialState,
		reducers: {
			setShowFileExtension: (state, { payload }) => {
				Cache.set('show-file-extension', payload);
				state.showFileExtension = payload;
			},
			setSortingType: (state, { payload }) => {
				Cache.set('sorting-type', payload);
				state.sortingType = payload;
			},
			setSortingOrder: (state, { payload }) => {
				Cache.set('sorting-is-asc', payload);
				state.sortingIsASC = payload;
			},
		},
	});

	const {
		setShowFileExtension,
		setSortingType,
		setSortingOrder,
	} = settingsSlice.actions;

	const selectShowFileExtension = (state) => state[reducerName].showFileExtension;
	const selectSortingType = (state) => state[reducerName].sortingType;
	const selectSortingOrder = (state) => state[reducerName].sortingIsASC;

	ReducerRegistry.register(reducerName, settingsSlice.reducer);

	function getStoredSortingType()
	{
		const sortingType = Cache.get('sorting-type', DEFAULT_SORTING_TYPE);

		return SORTING_TYPES.includes(sortingType) ? sortingType : DEFAULT_SORTING_TYPE;
	}

	function getStoredSortingOrder()
	{
		const sortingIsASC = Cache.get('sorting-is-asc', DEFAULT_SORTING_IS_ASC);

		return typeof sortingIsASC === 'boolean' ? sortingIsASC : DEFAULT_SORTING_IS_ASC;
	}

	module.exports = {
		setShowFileExtension,
		setSortingType,
		setSortingOrder,
		selectShowFileExtension,
		selectSortingType,
		selectSortingOrder,
	};
});
