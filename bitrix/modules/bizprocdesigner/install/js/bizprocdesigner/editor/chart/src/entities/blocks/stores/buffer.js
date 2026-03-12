import { defineStore } from 'ui.vue3.pinia';
import type { Block, BufferContent } from '../../../shared/types';
import { BUFFER_CONTENT_TYPES } from '../constants';
import { cloneSingleBlockWithNewIds } from '../utils';

type BufferState = {
	copied: BufferContent | null,
};

export const useBufferStore = defineStore('bizprocdesigner-editor-buffer', {
	state: (): BufferState => ({
		copied: null,
	}),
	getters: {
		isBufferEmpty(): boolean
		{
			return this.copied === null;
		},
	},
	actions: {
		copyBlock(block: Block): void
		{
			this.copied = {
				type: BUFFER_CONTENT_TYPES.BLOCK,
				content: JSON.parse(JSON.stringify(block)),
			};
		},
		getBufferContent(): BufferContent | null
		{
			if (!this.copied)
			{
				return null;
			}

			if (this.copied.type === BUFFER_CONTENT_TYPES.BLOCK)
			{
				return {
					type: this.copied.type,
					content: cloneSingleBlockWithNewIds(this.copied.content),
				};
			}

			throw new Error('Unexpected copied content type');
		},
	},
});
