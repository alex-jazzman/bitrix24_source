import './moveable-block.css';
import {
	toRefs,
	useTemplateRef,
	watch,
	onMounted,
	onUnmounted,
	computed,
	toValue,
} from 'ui.vue3';
import { useMoveableBlock, useBlockState, useHighlightedBlocks, useBlockDiagram } from '../../composables';
// eslint-disable-next-line no-unused-vars
import type { DiagramBlock } from '../../types';

type MoveableBlockSetup = {
	isDragged: boolean;
	isHiglitedBlock: boolean;
	blockPositionStyle: { [string]: string };
	isDisabled: boolean;
	onMouseDownSelectBlock: () => void;
};

// @vue/component
export const MoveableBlock = {
	name: 'moveable-block',
	props: {
		/** @type DiagramBlock */
		block: {
			type: Object,
			required: true,
		},
		highlighted: {
			type: Boolean,
			default: false,
		},
	},
	setup(props): MoveableBlockSetup
	{
		const { block } = toRefs(props);
		const blockRef = useTemplateRef('blockEl');
		const { isMakeNewConnection } = useBlockDiagram();
		const {
			blockZindex,
			isHiglitedBlock,
			isDisabled,
			onMountedBlock,
			onUnmountedBlock,
		} = useBlockState({ block, blockRef });
		const highlightedBlocks = useHighlightedBlocks();
		const { isDragged, blockPositionStyle } = useMoveableBlock(
			blockRef,
			block,
		);

		watch(() => props.highlighted, (value) => {
			if (value)
			{
				highlightedBlocks.add(props.block.id);
			}
			else
			{
				highlightedBlocks.remove(props.block.id);
			}
		});

		const blockStyle = computed((): { [string]: string } => ({
			...toValue(blockPositionStyle),
			...toValue(blockZindex),
		}));

		onMounted(() => {
			onMountedBlock();
		});

		onUnmounted(() => {
			highlightedBlocks.remove(props.block.id);
			onUnmountedBlock();
		});

		function onMouseDownSelectBlock(): void
		{
			highlightedBlocks.clear();
			highlightedBlocks.add(props.block.id);
		}

		return {
			isHiglitedBlock,
			isDisabled,
			isDragged,
			isMakeNewConnection,
			blockStyle,
			blockZindex,
			blockPositionStyle,
			onMouseDownSelectBlock,
		};
	},
	template: `
		<div
			class="ui-block-diagram-moveable-block"
			:style="blockStyle"
			ref="blockEl"
			:data-test-id="$blockDiagramTestId('block', block.id)"
			:data-id="block.id"
			@mousedown="onMouseDownSelectBlock"
		>
			<slot
				:block="block"
				:isHighlighted="isHiglitedBlock"
				:isDragged="isDragged"
				:isDisabled="isDisabled"
				:isMakeNewConnection="isMakeNewConnection"
			/>
		</div>
	`,
};
