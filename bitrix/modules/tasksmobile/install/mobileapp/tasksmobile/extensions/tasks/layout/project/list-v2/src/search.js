/**
 * @module tasks/layout/project/list-v2/src/search
 */
jn.define('tasks/layout/project/list-v2/src/search', (require, exports, module) => {
	const { SearchLayout } = require('layout/ui/search-bar');
	const { DEFAULT_PRESET_ID } = require('tasks/layout/project/list-v2/src/constants');

	class ProjectListSearch
	{
		/**
		 * @param {ProjectListSearchConfig} config
		 */
		constructor({
			layout,
			mode,
			onChange,
		})
		{
			this.onChange = onChange;
			this.params = this.getDefaultParams();
			this.layout = new SearchLayout({
				layout,
				id: 'tasks_project_list_v2',
				cacheId: `tasks_project_list_v2_${env.userId}`,
				presetId: DEFAULT_PRESET_ID,
				searchDataAction: 'tasksmobile.ProjectV2.getSearchBarPresets',
				searchDataActionParams: {
					mode,
				},
				onSearch: this.onSearch,
				onCancel: this.onCancel,
				getDefaultPresetId: () => DEFAULT_PRESET_ID,
			});
		}

		/**
		 * @returns {ProjectListSearchParams}
		 */
		getDefaultParams()
		{
			return {
				searchString: '',
				presetId: DEFAULT_PRESET_ID,
			};
		}

		onSearch = ({ text, presetId }) => {
			const previousPresetId = this.params.presetId;

			this.setParams({
				searchString: text,
				presetId,
			});

			this.onChange?.({
				isPresetChanged: this.params.presetId !== previousPresetId,
			});
		};

		onCancel = ({ text, presetId }) => {
			this.setParams({
				searchString: text,
				presetId,
			});

			this.onChange?.();
		};

		setParams({ searchString, presetId })
		{
			this.params = {
				...this.params,
				searchString: searchString === undefined ? this.params.searchString : searchString,
				presetId: presetId === undefined ? this.params.presetId : (presetId ?? DEFAULT_PRESET_ID),
			};
		}

		/**
		 * @returns {ProjectListSearchParams}
		 */
		getParams()
		{
			return { ...this.params };
		}

		isActive()
		{
			return this.params.searchString.trim() !== ''
				|| this.params.presetId !== DEFAULT_PRESET_ID;
		}

		getButton()
		{
			return this.layout.getSearchButton();
		}

		close()
		{
			this.layout?.close?.();
		}
	}

	module.exports = { ProjectListSearch };
});
