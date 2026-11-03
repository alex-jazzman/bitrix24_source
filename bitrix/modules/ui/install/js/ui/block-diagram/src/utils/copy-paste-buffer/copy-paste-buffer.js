import { computed, shallowRef, type ComputedRef, type Ref } from 'ui.vue3';

import { type DiagramClipboardContent } from '../../types';

// Both directions copy deeply, so the buffer neither follows later edits of the copied blocks nor
// hands out a fragment that a caller can edit in place.
function cloneContent(content: DiagramClipboardContent): DiagramClipboardContent
{
	return JSON.parse(JSON.stringify(content));
}

/**
 * One buffer per diagram application: a fragment stays available to any canvas of that application
 * and outlives the canvas it was copied from. It never enters a history snapshot and is never reset
 * by time or by any event.
 */
export class CopyPasteBuffer
{
	// Only the reference swap has to stay reactive, that is all #isEmpty reads. A deep proxy over
	// every block of the fragment would just make reading and cloning the buffer more expensive.
	#copiedContent: Ref<DiagramClipboardContent | null> = shallowRef(null);

	// "nothing has been copied", not "the fragment is empty": a fragment with empty arrays still
	// leaves the buffer filled.
	#isEmpty: ComputedRef<boolean> = computed((): boolean => this.#copiedContent.value === null);

	get isEmpty(): ComputedRef<boolean>
	{
		return this.#isEmpty;
	}

	setContent(content: DiagramClipboardContent): void
	{
		this.#copiedContent.value = cloneContent(content);
	}

	getContent(): DiagramClipboardContent | null
	{
		if (this.#copiedContent.value === null)
		{
			return null;
		}

		return cloneContent(this.#copiedContent.value);
	}

	clear(): void
	{
		this.#copiedContent.value = null;
	}
}
