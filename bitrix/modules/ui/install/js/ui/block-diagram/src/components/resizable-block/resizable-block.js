import './resizable-block.css';
import '../placement-feedback/placement-feedback.css';
import {
	toValue,
	toRefs,
	useTemplateRef,
	computed,
	onMounted,
	onUnmounted,
} from 'ui.vue3';
import {
	useMoveableBlock,
	useResizableBlock,
	useBlockState,
} from '../../composables';
import { BLOCK_INDEXES } from '../../constants';

const RESIZABLE_BLOCK_CLASS_NAMES = {
	base: 'ui-block-diagram-resizable-block',
	placementFeedback: 'ui-block-diagram-placement-feedback',
	displaced: '--displaced',
	placementRefused: '--placement-refused',
};

// @vue/component
export const ResizableBlock = {
	name: 'resizable-block',
	props: {
		/** @type DiagramBlock */
		block: {
			type: Object,
			required: true,
		},
		minWidth: {
			type: Number,
			default: 100,
		},
		minHeight: {
			type: Number,
			default: 100,
		},
		canStartMove: {
			type: Function,
			default: null,
		},
	},
	setup(props): {...}
	{
		const { block, minWidth, minHeight, canStartMove } = toRefs(props);
		const blockRef = useTemplateRef('blockEl');
		const {
			isHiglitedBlock,
			isDisplacedBlock,
			isPlacementRefusedBlock,
			isDisabled,
			blockZindex,
			onMountedBlock,
			onUnmountedBlock,
		} = useBlockState({
			block,
			blockRef,
			// The backdrop is a background, so it keeps its own resting step instead of following
			// hover and selection. The stylesheet states the same value for a consumer that mounts
			// this component outside the canvas.
			restingZIndex: BLOCK_INDEXES.BACKDROP,
		});
		const {
			isDragged,
			blockPositionStyle,
		} = useMoveableBlock(
			blockRef,
			block,
			{ canStartMove },
		);
		const {
			isResize,
			sizeBlockStyle,
			blockDimensions,
			onMounted: onMountedResizableBlock,
			onUnmounted: onUnmountedResizableBlock,
		} = useResizableBlock({
			block,
			minWidth,
			minHeight,
			leftSideRef: useTemplateRef('leftSide'),
			topSideRef: useTemplateRef('topSide'),
			rightSideRef: useTemplateRef('rightSide'),
			bottomSideRef: useTemplateRef('bottomSide'),
			leftTopCornerRef: useTemplateRef('leftTopCorner'),
			rightTopCornerRef: useTemplateRef('rightTopCorner'),
			rightBottomCornerRef: useTemplateRef('rightBottomCorner'),
			leftBottomCornerRef: useTemplateRef('leftBottomCorner'),
		});

		const blockStyle = computed(() => {
			return {
				...toValue(blockPositionStyle),
				...toValue(sizeBlockStyle),
				zIndex: toValue(blockZindex),
			};
		});

		// The rule moves a backdrop as readily as a node, so the backdrop shows the same feedback:
		// without it a corrected backdrop would just jump aside with nothing said to the eye.
		const blockClassNames = computed(() => ({
			[RESIZABLE_BLOCK_CLASS_NAMES.base]: true,
			[RESIZABLE_BLOCK_CLASS_NAMES.placementFeedback]: true,
			[RESIZABLE_BLOCK_CLASS_NAMES.displaced]: toValue(isDisplacedBlock),
			[RESIZABLE_BLOCK_CLASS_NAMES.placementRefused]: toValue(isPlacementRefusedBlock),
		}));

		onMounted(() => {
			onMountedBlock();
			onMountedResizableBlock();
		});

		onUnmounted(() => {
			onUnmountedBlock();
			onUnmountedResizableBlock();
		});

		return {
			isHiglitedBlock,
			isDisplacedBlock,
			isPlacementRefusedBlock,
			isDisabled,
			isResize,
			isDragged,
			blockClassNames,
			blockStyle,
			blockDimensions,
		};
	},
	template: `
		<div
			:style="blockStyle"
			ref="blockEl"
			:class="blockClassNames"
		>
			<div class="ui-block-diagram-resizable-block__container">
				<div
					ref="leftSide"
					class="ui-block-diagram-resizable-block__left-side"
				/>
				<div
					ref="topSide"
					class="ui-block-diagram-resizable-block__top-side"
				/>
				<div
					ref="rightSide"
					class="ui-block-diagram-resizable-block__right-side"
				/>
				<div
					ref="bottomSide"
					class="ui-block-diagram-resizable-block__bottom-side"
				/>
				<div
					ref="leftTopCorner"
					class="ui-block-diagram-resizable-block__top-left-corner"
				/>
				<div
					ref="rightTopCorner"
					class="ui-block-diagram-resizable-block__top-right-corner"
				/>
				<div
					ref="rightBottomCorner"
					class="ui-block-diagram-resizable-block__bottom-right-corner"
				/>
				<div
					ref="leftBottomCorner"
					class="ui-block-diagram-resizable-block__bottom-left-corner"
				/>

				<slot
					:block="block"
					:isHighlighted="isHiglitedBlock"
					:isDragged="isDragged"
					:isResize="isResize"
					:isDisabled="isDisabled"
					:isDisplaced="isDisplacedBlock"
					:isPlacementRefused="isPlacementRefusedBlock"
					:width="blockDimensions.width"
					:height="blockDimensions.height"
				/>
			</div>
		</div>
	`,
};
