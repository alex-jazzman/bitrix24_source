/**
 * @module tab-presets/managed/src/managed/preset-cache-state
 */
jn.define('tab-presets/managed/src/managed/preset-cache-state', (require, exports, module) => {
	/**
	 * @template {TabPresetsCacheState} State
	 * @param {State} state
	 * @param {string} presetId
	 * @param {TabPreset | null} [preset]
	 * @return {State}
	 */
	const changeCurrentPresetState = (state, presetId, preset = null) => {
		if (!state.presets)
		{
			return state;
		}

		return {
			...state,
			presets: {
				...state.presets,
				current: presetId,
				list: {
					...state.presets.list,
					...(preset ? { [presetId]: preset } : {}),
				},
			},
		};
	};

	/**
	 * @template {TabPresetsCacheState} State
	 * @param {State} state
	 * @param {string} presetId
	 * @param {TabPreset} preset
	 * @return {State}
	 */
	const updatePresetState = (state, presetId, preset) => {
		if (!state.presets)
		{
			return state;
		}

		return {
			...state,
			presets: {
				...state.presets,
				list: {
					...state.presets.list,
					[presetId]: preset,
				},
			},
		};
	};

	/**
	 * @template {TabPresetsCacheState} State
	 * @param {State} state
	 * @param {string} presetId
	 * @return {State}
	 */
	const removePresetState = (state, presetId) => {
		if (!state.presets?.list)
		{
			return state;
		}

		const list = { ...state.presets.list };
		delete list[presetId];

		return {
			...state,
			presets: {
				...state.presets,
				list,
			},
		};
	};

	/**
	 * @template {TabPresetsCacheState} State
	 * @param {State} state
	 * @param {string} presetId
	 * @return {State}
	 */
	const setPortalDefaultState = (state, presetId) => {
		if (!state.presets?.list)
		{
			return state;
		}

		const list = {};
		Object.keys(state.presets.list).forEach((key) => {
			list[key] = {
				...state.presets.list[key],
				isPortalDefault: key === presetId,
			};
		});

		return {
			...state,
			presets: {
				...state.presets,
				list,
			},
		};
	};

	module.exports = {
		changeCurrentPresetState,
		updatePresetState,
		removePresetState,
		setPortalDefaultState,
	};
});
