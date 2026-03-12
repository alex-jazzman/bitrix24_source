import { toValue, watch, computed } from 'ui.vue3';
import {
	useHighlightedBlocks,
	useGroupSelectionLogic,
	useGroupDragLogic,
	useContextMenu,
	useBlockDiagram,
} from '../../composables';

const DEFAULT_SELECTION_PADDING = 17;
const DEFAULT_BLOCK_SIZE = { width: 150, height: 100 };

export const GroupSelectionBox = {
	name: 'GroupSelectionBox',
	props: {
		menuItems: {
			type: Array,
			default: () => [],
		},
		padding: {
			type: [Number, Object],
			default: DEFAULT_SELECTION_PADDING,
		},
		defaultBlockSize: {
			type: Object,
			default: DEFAULT_BLOCK_SIZE,
		},
	},
	setup(props): {...}
	{
		const highlightedBlocks = useHighlightedBlocks();
		const { selectionWorldRect, isSelectionActive } = useBlockDiagram();
		const { showMenu, closeContextMenu } = useContextMenu();
		const {
			onCanvasSelect,
			onSelectionStart,
			groupSelectionStyle,
		} = useGroupSelectionLogic(
			closeContextMenu,
			{
				padding: computed(() => props.padding),
				defaultBlockSize: props.defaultBlockSize,
			},
		);

		watch(selectionWorldRect, (newRect) => {
			onCanvasSelect(newRect);
		});

		watch(isSelectionActive, (isActive) => {
			if (isActive)
			{
				onSelectionStart();
			}
		});

		const { onGroupMouseDown } = useGroupDragLogic(
			closeContextMenu,
		);

		function onGroupContextMenu(event): void
		{
			const ids = toValue(highlightedBlocks.highlitedBlockIds);
			if (!ids || ids.length === 0 || props.menuItems.length === 0)
			{
				return;
			}

			showMenu(
				{ clientX: event.clientX, clientY: event.clientY },
				{ items: props.menuItems },
			);
		}

		return {
			groupSelectionStyle,
			onGroupMouseDown,
			onGroupContextMenu,
		};
	},
	template: `
		<div
			v-if="groupSelectionStyle"
			:style="groupSelectionStyle"
			class="ui-block-diagram-group-box"
			@mousedown="onGroupMouseDown"
			@contextmenu.prevent.stop="onGroupContextMenu"
		></div>
	`,
};
