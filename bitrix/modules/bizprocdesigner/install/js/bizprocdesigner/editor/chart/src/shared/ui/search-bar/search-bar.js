import { SearchBar as DiagramSearchBar } from 'ui.block-diagram';
import { useLoc } from '../../composables';
import type { Block } from '../../types';

// @vue/component
export const SearchBar = {
	name: 'SearchBar',
	components: {
		DiagramSearchBar,
	},
	setup(): {...}
	{
		const { getMessage } = useLoc();

		function searchCallback(block: Block, text: string): boolean
		{
			return block.node.title
				.toLowerCase()
				.includes(text.toLowerCase());
		}

		return {
			getMessage,
			searchCallback,
		};
	},
	template: `
		<DiagramSearchBar
			:searchResultTitle="getMessage('BIZPROCDESIGNER_EDITOR_SEARCH_RESULTS')"
			:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_SEARCH_PLACEHOLDER')"
			:searchCallback="searchCallback"
		/>
	`,
};
