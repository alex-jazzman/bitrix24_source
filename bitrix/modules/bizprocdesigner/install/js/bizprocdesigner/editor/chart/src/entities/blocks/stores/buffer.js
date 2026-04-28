import { defineStore } from 'ui.vue3.pinia';
import { cloneBLocksWithNewIds } from '../utils';
import type { BufferContent } from '../../../shared/types';

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
		setBufferContent(content: BlocksContent): void
		{
			this.copied = JSON.parse(JSON.stringify(content));
		},
		getBufferContent(): ?GroupContent
		{
			if (!this.copied)
			{
				return null;
			}

			return cloneBLocksWithNewIds(this.copied);
		},
	},
});
