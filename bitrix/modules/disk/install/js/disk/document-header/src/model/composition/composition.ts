import { defineStore } from 'ui.vue3.pinia';

import { type HeaderElementValue } from '../../const/element';
import { type CompositionModel, type CompositionState } from './types';

export const useCompositionStore = defineStore('diskDocumentHeaderComposition', {
	state: (): CompositionState => ({
		composition: null,
	}),
	getters: {
		// the header renders exactly what the server put into the composition, nothing else
		hasElement: (state: CompositionState) => (element: HeaderElementValue): boolean => {
			return state.composition?.elements.includes(element) ?? false;
		},
	},
	actions: {
		setComposition(composition: CompositionModel): void
		{
			this.composition = composition;
		},
		setObjectName(name: string): void
		{
			if (this.composition !== null)
			{
				this.composition.object.name = name;
			}
		},
	},
});
