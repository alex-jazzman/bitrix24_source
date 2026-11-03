import { defineComponent } from 'ui.vue3';
import { mapState } from 'ui.vue3.pinia';

import { HeaderElement } from '../../const/element';
import { HeaderTestId } from '../../const/testid';
import { useCompositionStore } from '../../model/composition/composition';

/**
 * Mount point of the boost button. The button is drawn by `disk.promo-boost` into the container with
 * the given id - the header neither reproduces it nor re-checks the conditions of the package.
 */
export const BoostSlot = defineComponent({
	name: 'DiskDocumentHeaderBoostSlot',
	props: {
		containerId: {
			type: String,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			HeaderTestId,
		};
	},
	computed: {
		...mapState(useCompositionStore, ['hasElement']),
		isPresent(): boolean
		{
			return this.hasElement(HeaderElement.Boost);
		},
	},
	template: `
		<div
			v-if="isPresent"
			:id="containerId"
			class="disk-document-header-boost-slot"
			:data-testid="HeaderTestId.Boost"
		></div>
	`,
});
