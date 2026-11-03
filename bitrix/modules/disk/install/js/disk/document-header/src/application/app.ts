import { defineComponent } from 'ui.vue3';

import { Header } from '../component/header/header';

/**
 * The root of the application. It carries the context of the opening down to the header and holds no
 * state of its own: what is drawn is decided by the composition in the store.
 */
export const App = defineComponent({
	name: 'DiskDocumentHeaderApp',
	components: {
		Header,
	},
	props: {
		/** Absent for an opening which is not a session of a document: nothing is then asked of the controller. */
		documentSessionHash: {
			type: String,
			default: '',
		},
		boostContainerId: {
			type: String,
			required: true,
		},
		logoUrl: {
			type: String,
			default: '',
		},
	},
	template: `
		<Header
			:documentSessionHash="documentSessionHash"
			:boostContainerId="boostContainerId"
			:logoUrl="logoUrl"
		/>
	`,
});
