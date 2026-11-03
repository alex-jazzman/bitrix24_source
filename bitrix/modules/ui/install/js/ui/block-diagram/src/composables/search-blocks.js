import { debounce } from 'main.core';
import { ref, toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import type { DiagramBlock } from '../types';

type UseSearchBlocksOptions = {
	searchCallback: (item: {...}, searchText: string) => boolean;
	delay: number;
};

type UseSearchBlocks = {
	seachText: string;
	foundBlocks: Array<DiagramBlock>;
	onSearchBlocks: (searchText: string) => void;
	onClearSearch: () => void;
};

const DEFAULT_OPTIONS: UseSearchBlocksOptions = {
	searchCallback: () => false,
	delay: 300,
};

export function useSearchBlocks(optionParams: UseSearchBlocksOptions): UseSearchBlocks
{
	const {
		blocks,
	} = useBlockDiagram();
	const options: UseSearchBlocksOptions = { ...DEFAULT_OPTIONS, ...optionParams };
	const seachText: string = ref('');
	const foundBlocks: Array<DiagramBlock> = ref([]);

	// A search given up inside the delay leaves a pass already scheduled, and `debounce` has no way
	// to drop it. Landing after the search is over, that pass refills the results, and whoever
	// watches them takes the highlight over and moves the camera with nobody searching any more.
	let isScheduledSearchDropped = false;

	function searchBlocks(searchText: string): void
	{
		if (isScheduledSearchDropped)
		{
			return;
		}

		seachText.value = searchText;
		foundBlocks.value = [];

		if (toValue(seachText).trim() === '')
		{
			return;
		}

		blocks.value.forEach((block) => {
			if (options.searchCallback(block, toValue(seachText)))
			{
				foundBlocks.value.push(block);
			}
		});
	}

	const runSearchBlocks = debounce(searchBlocks, options.delay);

	function onSearchBlocks(searchText: string): void
	{
		isScheduledSearchDropped = false;
		runSearchBlocks(searchText);
	}

	function onClearSearch(): void
	{
		isScheduledSearchDropped = true;
		seachText.value = '';
		foundBlocks.value = [];
	}

	return {
		seachText,
		foundBlocks,
		onSearchBlocks,
		onClearSearch,
	};
}
