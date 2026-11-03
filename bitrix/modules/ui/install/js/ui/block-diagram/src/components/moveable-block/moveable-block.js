import './moveable-block.css';
import '../placement-feedback/placement-feedback.css';
import {
	toRefs,
	useTemplateRef,
	onMounted,
	onUnmounted,
	computed,
	toValue,
} from 'ui.vue3';
import { useMoveableBlock, useBlockState, useBlockDiagram } from '../../composables';
// eslint-disable-next-line no-unused-vars
import type { DiagramBlock } from '../../types';

type MoveableBlockSetup = {
	isDragged: boolean;
	isHiglitedBlock: boolean;
	isDisplacedBlock: boolean;
	isPlacementRefusedBlock: boolean;
	blockClassNames: { [string]: boolean };
	blockPositionStyle: { [string]: string };
	isDisabled: boolean;
	onMouseEnterHoverBlock: () => void;
	onMouseLeaveHoverBlock: () => void;
};

const MOVEABLE_BLOCK_CLASS_NAMES = {
	base: 'ui-block-diagram-moveable-block',
	placementFeedback: 'ui-block-diagram-placement-feedback',
	displaced: '--displaced',
	placementRefused: '--placement-refused',
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
	},
	setup(props): MoveableBlockSetup
	{
		const { block } = toRefs(props);
		const blockRef = useTemplateRef('blockEl');
		const {
			isMakeNewConnection,
			hoveredBlockId,
			setHoveredBlock,
			resetHoveredBlock,
		} = useBlockDiagram();
		const {
			blockZindex,
			isHiglitedBlock,
			isDisplacedBlock,
			isPlacementRefusedBlock,
			isDisabled,
			onMountedBlock,
			onUnmountedBlock,
		} = useBlockState({ block, blockRef });
		const { isDragged, blockPositionStyle } = useMoveableBlock(
			blockRef,
			block,
		);

		const blockStyle = computed((): { [string]: string } => ({
			...toValue(blockPositionStyle),
			zIndex: toValue(blockZindex),
		}));

		// The placement feedback lives on the wrapper the canvas owns, so it shows without a single
		// change in the consumer's block content.
		const blockClassNames = computed((): { [string]: boolean } => ({
			[MOVEABLE_BLOCK_CLASS_NAMES.base]: true,
			[MOVEABLE_BLOCK_CLASS_NAMES.placementFeedback]: true,
			[MOVEABLE_BLOCK_CLASS_NAMES.displaced]: toValue(isDisplacedBlock),
			[MOVEABLE_BLOCK_CLASS_NAMES.placementRefused]: toValue(isPlacementRefusedBlock),
		}));

		onMounted(() => {
			onMountedBlock();
		});

		onUnmounted(() => {
			onUnmountedBlock();
		});

		function onMouseEnterHoverBlock(): void
		{
			setHoveredBlock(props.block.id);
		}

		// A quick move between neighbours brings the enter of the new node before the leave of the
		// old one, so the leave only clears the state while this node is still the raised one.
		function onMouseLeaveHoverBlock(): void
		{
			if (toValue(hoveredBlockId) === props.block.id)
			{
				resetHoveredBlock();
			}
		}

		return {
			isHiglitedBlock,
			isDisplacedBlock,
			isPlacementRefusedBlock,
			isDisabled,
			isDragged,
			isMakeNewConnection,
			blockClassNames,
			blockStyle,
			onMouseEnterHoverBlock,
			onMouseLeaveHoverBlock,
		};
	},
	template: `
		<div
			:class="blockClassNames"
			:style="blockStyle"
			ref="blockEl"
			:data-test-id="$blockDiagramTestId('block', block.id)"
			:data-id="block.id"
			@mouseenter="onMouseEnterHoverBlock"
			@mouseleave="onMouseLeaveHoverBlock"
		>
			<slot
				:block="block"
				:isHighlighted="isHiglitedBlock"
				:isDragged="isDragged"
				:isDisabled="isDisabled"
				:isMakeNewConnection="isMakeNewConnection"
				:isDisplaced="isDisplacedBlock"
				:isPlacementRefused="isPlacementRefusedBlock"
			/>
		</div>
	`,
};
