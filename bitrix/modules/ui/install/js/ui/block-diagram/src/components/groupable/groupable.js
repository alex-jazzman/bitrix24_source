import { toRefs, onMounted, onUnmounted, watch } from 'ui.vue3';
import { useGroupable } from '../../composables';

// Wrapping a block in this component is what declares the block a container. It adds no markup, no
// styles and no pointer handlers of its own and starts no gesture: the captured nodes are carried
// by the gesture the wrapped block already runs.
// @vue/component
export const Groupable = {
	name: 'Groupable',
	props: {
		/** @type DiagramBlock */
		block: {
			type: Object,
			required: true,
		},
		// A consumer closing the ability behind a flag of its own keeps the wrapper in its template
		// and switches this instead.
		enabled: {
			type: Boolean,
			default: true,
		},
	},
	setup(props): void
	{
		const { block, enabled } = toRefs(props);
		const {
			registerGroupableBlock,
			unregisterGroupableBlock,
		} = useGroupable(block, enabled);

		// The flag may go off without a reload, and a record left behind would keep the block a
		// container for the rest of the session.
		watch(enabled, (isEnabled: boolean) => {
			if (isEnabled)
			{
				registerGroupableBlock();
			}
			else
			{
				unregisterGroupableBlock();
			}
		});

		onMounted(registerGroupableBlock);
		onUnmounted(unregisterGroupableBlock);
	},
	template: `
		<slot/>
	`,
};
