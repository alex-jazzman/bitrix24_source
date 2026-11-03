import {
	computed,
	toValue,
	useTemplateRef,
	onMounted,
	onUnmounted,
	ref,
} from 'ui.vue3';
import { Event } from 'main.core';
import {
	useBlockDiagram,
	useCanvasTransfrom,
	useCanvasSelection,
	clearSelection,
	type UseCanvasTransform,
} from '../../composables';
import { clearTextSelection, isInputEventTarget, KEY_TOKEN } from '../../utils';
import { MOUSE_BUTTON } from '../../constants';
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

const CAPTURE_LISTENER_OPTIONS = Object.freeze({ capture: true });

const CANVAS_TRANSFORM_CLASS_NAMES = {
	base: 'ui-block-diagram-canvas-transform',
	dragging: '--dragging',
	grabbing: '--grabbing',
	grab: '--grab',
};

/**
 * Drops the text selection the way the browser would on a press. The canvas suppresses the browser
 * action on mousedown - panning and the selection box both need it - and takes this with it, so
 * the component gives it back. Bound on the capture phase: a node starting its gesture stops the
 * press from propagating, so a bubbling handler on the root would never see such a press. A field
 * on the canvas owns its own selection and is left alone.
 */
function clearTextSelectionOnCanvasPress(event: MouseEvent): void
{
	if (isInputEventTarget(event))
	{
		return;
	}

	clearTextSelection();
}

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
	// eslint-disable-next-line max-lines-per-function
	setup(props, { emit }): CanvasTransformSetup
	{
		const rootRef = useTemplateRef('rootRef');
		const canvasRef = useTemplateRef('canvasLayout');
		const transformLayoutRef = useTemplateRef('transformLayout');

		const isSpacePressed = ref(false);
		const isPanning = ref(false);

		const { inputState, highlitedBlockIds, isOpenContextMenu } = useBlockDiagram();

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

		let unsubscribeSpaceHold = () => {};

		let unsubscribeEscape = () => {};
		let pressListenerTarget = null;

		onMounted(() => {
			onMountedCanvasTransform();

			pressListenerTarget = toValue(rootRef);
			Event.bind(
				pressListenerTarget,
				'mousedown',
				clearTextSelectionOnCanvasPress,
				CAPTURE_LISTENER_OPTIONS,
			);

			// A forced release - the window losing focus, the tab going away - arrives here as well,
			// so the panning cursor never outlives the hold that turned it on. Only the press is
			// ignored for a field: a release always applies, or the hold would stick.
			unsubscribeSpaceHold = inputState.onChange(KEY_TOKEN.SPACE, (
				isPressed: boolean,
				event: KeyboardEvent | PointerEvent | null,
			) => {
				if (isPressed && isInputEventTarget(event))
				{
					return;
				}

				isSpacePressed.value = isPressed;
			});

			// Plain, not exclusive: the component lives as long as the canvas is shown, so an exclusive
			// claim would hold Escape away from the layers above it even with nothing selected. On the
			// bubbling phase the key still reaches them, and an operation that claims Escape for itself
			// - a gesture, the search - runs before this handler is ever asked. The browser action is
			// left alone for the same reason: dropping a selection is not a claim on the key.
			unsubscribeEscape = inputState.on(KEY_TOKEN.ESCAPE, (event: KeyboardEvent) => {
				// A held key repeats, and a repeat is the same press: the selection drops once.
				if (event.repeat === true)
				{
					return;
				}

				// The canvas menu listens for Escape on its own, outside the input state, so one press
				// closes it - and the selection it was opened on has to survive that press.
				if (toValue(isOpenContextMenu))
				{
					return;
				}

				if (toValue(highlitedBlockIds).length === 0)
				{
					return;
				}

				clearSelection(highlitedBlockIds);
			}, { preventDefault: false });
		});

		onUnmounted(() => {
			onUnmountedCanvasTransform();
			Event.unbind(
				pressListenerTarget,
				'mousedown',
				clearTextSelectionOnCanvasPress,
				CAPTURE_LISTENER_OPTIONS,
			);
			pressListenerTarget = null;
			unsubscribeSpaceHold();
			unsubscribeEscape();
		});

		function onMouseDown(event: MouseEvent): void
		{
			if (event.button === MOUSE_BUTTON.RIGHT)
			{
				return;
			}

			const isMiddleClick = event.button === MOUSE_BUTTON.MIDDLE;
			const isLeftClick = event.button === MOUSE_BUTTON.LEFT;
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

			Event.bind(document, 'mouseup', onMouseUp);
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
			Event.unbind(document, 'mouseup', onMouseUp);

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
