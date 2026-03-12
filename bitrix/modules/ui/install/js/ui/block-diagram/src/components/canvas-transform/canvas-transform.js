import {
	computed,
	toValue,
	useTemplateRef,
	onMounted,
	onUnmounted,
	ref,
} from 'ui.vue3';
import { Event } from 'main.core';
import { useCanvasTransfrom, useCanvasSelection, type UseCanvasTransform } from '../../composables';
import { INPUT_TAGS } from '../../constants';
import './canvas-transform.css';

type CanvasTransformSetup = {
	rootRef: ?HTMLElement,
	canvasRef: ?HTMLElement,
	transformLayoutRef: ?HTMLElement,
	canvasTransformClassNames: { [key: string]: boolean },
	onMouseDown: Pick<UseCanvasTransform, 'onMouseDown'>,
	onMouseMove: Pick<UseCanvasTransform, 'onMouseMove'>,
	onMouseUp: Pick<UseCanvasTransform, 'onMouseUp'>,
	onWheel: Pick<UseCanvasTransform, 'onWheel'>,
	isSelecting: boolean,
	selectionRect: { x: number, y: number, width: number, height: number },
	openContextMenu: (event: MouseEvent) => void,
};

const CANVAS_TRANSFORM_CLASS_NAMES = {
	base: 'ui-block-diagram-canvas-transform',
	dragging: '--dragging',
	grabbing: '--grabbing',
	grab: '--grab',
};

const KEY_SPACE = 'Space';

// @vue/component
export const CanvasTransform = {
	name: 'canvas-transform',
	props: {
		canvasStyle: {
			type: Object,
			required: true,
		},
		zoomSensitivity: {
			type: Number,
			default: 0.01,
		},
		zoomSensitivityMouse: {
			type: Number,
			default: 0.04,
		},
		selectionEnabled: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['openContextMenu'],
	setup(props, { emit }): CanvasTransformSetup
	{
		const rootRef = useTemplateRef('rootRef');
		const canvasRef = useTemplateRef('canvasLayout');
		const transformLayoutRef = useTemplateRef('transformLayout');

		const isSpacePressed = ref(false);
		const isPanning = ref(false);

		const {
			isDragging,
			onMounted: onMountedCanvasTransform,
			onUnmounted: onUnmountedCanvasTransform,
			onMouseDown: onPanStart,
			onMouseMove: onPanMove,
			onMouseUp: onPanEnd,
			onWheel,
		} = useCanvasTransfrom({
			canvasRef,
			transformLayoutRef,
			canvasStyle: props.canvasStyle,
			zoomSensitivity: props.zoomSensitivity,
			zoomSensitivityMouse: props.zoomSensitivityMouse,
		});

		const {
			isSelecting,
			selectionRect,
			start: onSelectionStart,
			move: onSelectionMove,
			end: onSelectionEnd,
		} = useCanvasSelection({
			rootRef,
			transformLayoutRef,
		});

		const canvasTransformClassNames = computed((): { [string]: boolean } => ({
			[CANVAS_TRANSFORM_CLASS_NAMES.base]: true,
			[CANVAS_TRANSFORM_CLASS_NAMES.dragging]: toValue(isDragging),
			[CANVAS_TRANSFORM_CLASS_NAMES.grabbing]: toValue(isPanning),
			[CANVAS_TRANSFORM_CLASS_NAMES.grab]: toValue(isSpacePressed) && !toValue(isPanning),
		}));

		onMounted(() => {
			onMountedCanvasTransform();
			Event.bind(window, 'keydown', onKeyDown);
			Event.bind(window, 'keyup', onKeyUp);
		});

		onUnmounted(() => {
			onUnmountedCanvasTransform();
			Event.unbind(window, 'keydown', onKeyDown);
			Event.unbind(window, 'keyup', onKeyUp);
		});

		function onMouseDown(event: MouseEvent): void
		{
			if (event.button === 2)
			{
				return;
			}

			const isMiddleClick = event.button === 1;
			const isLeftClick = event.button === 0;
			const isSpace = toValue(isSpacePressed);
			const shouldPan = isMiddleClick || (isLeftClick && (isSpace || !props.selectionEnabled));
			const shouldSelect = isLeftClick && !isSpace && props.selectionEnabled;

			if (shouldPan)
			{
				if (toValue(isSelecting))
				{
					onSelectionEnd();
				}

				isPanning.value = true;

				if (isMiddleClick || (isLeftClick && !props.selectionEnabled))
				{
					event.preventDefault();
				}

				onPanStart(event);
			}
			else if (shouldSelect)
			{
				isPanning.value = false;
				event.preventDefault();
				onSelectionStart(event);
			}
		}

		function onMouseMove(event: MouseEvent): void
		{
			if (toValue(isSelecting) && toValue(isSpacePressed))
			{
				onSelectionEnd();
				isPanning.value = true;
				onPanStart(event);
			}

			if (toValue(isSelecting))
			{
				onSelectionMove(event);
			}
			else if (toValue(isPanning))
			{
				onPanMove(event);
			}
		}

		function onMouseUp(): void
		{
			if (toValue(isSelecting))
			{
				onSelectionEnd();
			}

			if (toValue(isPanning))
			{
				isPanning.value = false;
				onPanEnd();
			}
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.code !== KEY_SPACE)
			{
				return;
			}

			if (event.repeat)
			{
				return;
			}

			const target = event.target;
			const isInputActive = (target.tagName in INPUT_TAGS) || target.isContentEditable;

			if (isInputActive)
			{
				return;
			}

			isSpacePressed.value = true;
		};

		const onKeyUp = (event: KeyboardEvent) => {
			if (event.code === KEY_SPACE)
			{
				isSpacePressed.value = false;
			}
		};

		function openContextMenu(event: MouseEvent): void
		{
			if (
				event.target === toValue(canvasRef)
				|| event.target?.parentElement === toValue(transformLayoutRef)
			)
			{
				emit('openContextMenu', event);
			}
		}

		return {
			rootRef,
			canvasRef,
			transformLayoutRef,
			canvasTransformClassNames,
			onMouseDown,
			onMouseMove,
			onMouseUp,
			onWheel,
			openContextMenu,
			isSelecting,
			selectionRect,
		};
	},
	template: `
		<div
			ref="rootRef"
			:class="canvasTransformClassNames"
			@mousedown="onMouseDown"
			@mousemove="onMouseMove"
			@mouseup="onMouseUp"
			@wheel="onWheel"
			@contextmenu.prevent="openContextMenu"
		>
			<canvas
				ref="canvasLayout"
				class="ui-block-diagram-canvas-transform__canvas"
			/>
			<div
				ref="transformLayout"
				class="ui-block-diagram-canvas-transform__transform"
			>
				<slot/>
			</div>
			<div v-if="isSelecting" class="ui-block-diagram-selection-rect"
				 :style="{
					left: selectionRect.x + 'px',
					top: selectionRect.y + 'px',
					width: selectionRect.width + 'px',
					height: selectionRect.height + 'px'
				}"
			>
			</div>
		</div>
	`,
};
