import { EventEmitter } from 'main.core.events';

import { FeatureCode } from 'bizprocdesigner.feature';

import { useFeature } from '../../../shared/composables';
import { FRAGMENT_LIBRARY_EVENTS } from '../../../shared/constants';
import { type Block, type Connection } from '../../../shared/types';

export type UseSaveToLibrary = {
	canSaveToLibrary: () => boolean,
	saveToLibrary: (blocks: Array<Block>, connections: Array<Connection>) => void,
};

/**
 * The way from a context menu into the dialog of saving, for the entry points that have no widget of
 * the canvas above them. Saving reads the scheme and writes nothing into it, so the ban on writing does
 * not close it - the same reason copying stays open under the lock.
 *
 * A set of nodes with no links is a fragment as good as any (AC-016): the links are the ones with both
 * ends inside the selection, and a single node simply has none.
 */
export const useSaveToLibrary = (): UseSaveToLibrary => {
	const { isFeatureAvailable } = useFeature();

	const canSaveToLibrary = (): boolean => isFeatureAvailable(FeatureCode.componentLibrary);

	const saveToLibrary = (blocks: Array<Block>, connections: Array<Connection> = []): void => {
		if (!canSaveToLibrary() || blocks.length === 0)
		{
			return;
		}

		EventEmitter.emit(FRAGMENT_LIBRARY_EVENTS.SAVE, { blocks, connections });
	};

	return { canSaveToLibrary, saveToLibrary };
};
