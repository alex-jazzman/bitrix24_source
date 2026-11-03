import { Loader } from 'main.loader';
import { defineComponent, markRaw } from 'ui.vue3';

import { useSessionStore } from '../../model/session/session';

import './submit-spinner.css';

const LOADER_SIZE = 60;
// The loader draws its ring grey by default; the mockup asks for the accent one.
const LOADER_COLOR = 'var(--ui-color-accent-main-primary)';

/**
 * What stands in place of the tree while the operation is on its way (PRD FR-7).
 *
 * The tree is taken away rather than dimmed: while the object is being moved every row
 * of it is out of date, and a person clicking one would be pointing at a state the
 * server has already left behind.
 */
export const SubmitSpinner = defineComponent({
	name: 'DiskDestinationPickerSubmitSpinner',
	data(): { loader: Loader | null }
	{
		// Non-reactive on purpose: Vue's proxy breaks the private fields of the class.
		return { loader: null };
	},
	computed: {
		label(): string
		{
			return useSessionStore().operation === 'copy'
				? 'DISK_DESTINATION_PICKER_SUBMITTING_COPY'
				: 'DISK_DESTINATION_PICKER_SUBMITTING_MOVE'
			;
		},
	},
	mounted(): void
	{
		const loader = markRaw(new Loader({
			target: this.$refs.area as HTMLElement,
			size: LOADER_SIZE,
			color: LOADER_COLOR,
			mode: 'inline',
		}));
		void loader.show();
		this.loader = loader;
	},
	beforeUnmount(): void
	{
		this.loader?.destroy();
		this.loader = null;
	},
	template: `
		<div
			ref="area"
			class="disk-destination-picker-submit-spinner"
			data-testid="disk-move-copy-submit-spinner-area"
			role="status"
			aria-busy="true"
			:aria-label="loc(label)"
		></div>
	`,
});
