import { Event, Text } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import {
	computed,
	nextTick,
	onMounted,
	onUnmounted,
	ref,
	toRaw,
	toValue,
	watch,
	type ComputedRef,
} from 'ui.vue3';

import {
	useActionKeyshortcuts,
	useBlockDiagram,
	useCanvas,
	useCanvasFocus,
	useKeyboardShortcuts,
	useLoc,
} from '../../composables';
import { INPUT_TAGS } from '../../constants';
import { type DiagramViewportInsets } from '../../types';
import {
	CANVAS_ACTION_ID,
	isFocusOnAnyOf,
	isKeyboardBusyByOverlay,
	isValidColorPalette,
	KEY_TOKEN,
} from '../../utils';
import { CanvasMapBtn } from '../canvas-map-btn/canvas-map-btn';
import { CanvasMap } from '../canvas-map/canvas-map';
import { ZoomBtn } from '../zoom-btn/zoom-btn';
import { ZoomPercent } from '../zoom-percent/zoom-percent';

import './zoom-bar.css';

type MapFocusTarget = 'mapButton' | 'canvas' | null;

type ZoomBarSetup = {
	iconSet: { [string]: string };
	mapPositionClasses: { [string]: boolean };
	isShowMap: boolean;
	isDisabled: boolean;
	canvasMapPanelId: string;
	closeMapLabel: string;
	fitToViewKeyshortcuts: ComputedRef<string | null>;
	mapKeyshortcuts: ComputedRef<string | null>;
	zoomInKeyshortcuts: ComputedRef<string | null>;
	zoomOutKeyshortcuts: ComputedRef<string | null>;
	onToggleMap: (focusTarget?: MapFocusTarget) => void,
	onCloseMap: () => void,
};

const MAP_FOCUS_TARGET: { [string]: MapFocusTarget } = {
	mapButton: 'mapButton',
	canvas: 'canvas',
};

const VERTICAL_MAP_POSITION: { [string]: string } = {
	left: 'left',
	right: 'right',
};

const HORIZONTAL_MAP_POSITION: { [string]: string } = {
	top: 'top',
	bottom: 'bottom',
};

const MAP_CLASSES: { [string]: string } = {
	base: 'ui-block-diagram-canvas-zoom-bar__map',
	top: '--top',
	bottom: '--bottom',
	left: '--left',
	right: '--right',
};

const POSITION_MAP_DEFAULT_VALUES: string = 'top right';

const VIEWPORT_INSET_EDGES: Set<string> = new Set(['top', 'right', 'bottom', 'left']);

// The bare viewport: nothing of the consumer covers it once the panel that published the insets is
// gone, and the state of the diagram says so again.
const NO_VIEWPORT_INSETS: DiagramViewportInsets = { top: 0, right: 0, bottom: 0, left: 0 };

// An edge a consumer names has to be a number the free area can be measured with; an edge it says
// nothing about stays zero, so a partial set is a valid one.
function isValidViewportInsets(value: DiagramViewportInsets): boolean
{
	return Object.entries(value).every(([edge, inset]) => {
		return VIEWPORT_INSET_EDGES.has(edge) && Number.isFinite(inset);
	});
}

/**
 * The combo of the fit types a character by default, so the command belongs to the diagram only
 * while the focus stands on one of its surfaces - the canvas, the panel itself, or the minimap the
 * consumer places on its own. Everywhere else on the page the press is the page's own: the same rule
 * the arrow keys of the canvas already follow, and the one WCAG 2.1.4 asks for from a shortcut
 * written with a printable key. The guard stays whatever the combo becomes: a user may reassign it.
 *
 * That is what `preventDefault: false` is for: the browser goes on seeing the press as usual, and the
 * default action is suppressed here and only when the command really runs, so a press left to the
 * page still types its character there.
 */
function registerFitToViewShortcut(canFitToView: () => boolean, fitToView: () => void): void
{
	function onFitToView(event: KeyboardEvent): void
	{
		if (!canFitToView())
		{
			return;
		}

		event.preventDefault();
		fitToView();
	}

	useKeyboardShortcuts([
		{
			actionId: CANVAS_ACTION_ID.FIT_TO_VIEW,
			handler: onFitToView,
			preventDefault: false,
		},
	]);
}

// `isInputEventTarget()` of the extension answers about the target of an event, while a focus
// change names the element itself, so the shared tag list is asked about the element here.
function isFieldElement(element: ?EventTarget): boolean
{
	return element instanceof HTMLElement
		&& (INPUT_TAGS[element.tagName] === true || element.isContentEditable === true);
}

// @vue/component
export const ZoomBar = {
	name: 'zoom-bar',
	components: {
		BIcon,
		ZoomBtn,
		ZoomPercent,
		CanvasMap,
		CanvasMapBtn,
	},
	props: {
		stepZoom: {
			type: Number,
			default: 0.2,
		},
		positionMap: {
			type: String,
			default: POSITION_MAP_DEFAULT_VALUES,
		},
		blockColors: {
			type: Object,
			default: () => ({}),
			validator(value): boolean
			{
				return isValidColorPalette(value);
			},
		},
		frameColors: {
			type: Object,
			default: () => ({}),
			validator(value): boolean
			{
				return isValidColorPalette(value);
			},
		},
		/**
		 * Edges of the viewport the panels of the consumer cover: the canvas is drawn under them and
		 * cannot measure them itself. The fit keeps the scheme out of the covered edges. Reactive: a
		 * panel that opens or closes changes the value without remounting the bar.
		 *
		 * One zoom bar per application. The bar registers the shortcut of the fit, so a second one
		 * mounted next to it would run the command twice on a single press.
		 */
		viewportInsets: {
			type: Object,
			default: () => ({}),
			validator(value): boolean
			{
				return isValidViewportInsets(value);
			},
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		flat: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	// eslint-disable-next-line max-lines-per-function
	setup(props): ZoomBarSetup
	{
		const loc = useLoc();
		const {
			isDisabledBlockDiagram,
			inputState,
			viewportInsets,
			blockDiagramRef,
			canvasMapRef,
			isOpenContextMenu,
		} = useBlockDiagram();
		const { fitToView, zoomIn, zoomOut } = useCanvas();
		const { returnFocusToCanvas } = useCanvasFocus();
		const isShowMap = ref(false);
		const root = ref(null);
		const mapButton = ref(null);
		const canvasMap = ref(null);
		const canvasMapPanelId = `ui-block-diagram-canvas-map-${Text.getRandom()}`;
		const closeMapLabel = loc.getMessage('UI_BLOCK_DIAGRAM_CANVAS_MAP_CLOSE');
		const isDisabled = computed(() => props.disabled || toValue(isDisabledBlockDiagram));

		let unsubscribeEscape = null;
		let isFieldFocused = isFieldElement(document.activeElement);

		const mapPositionClasses = computed((): { [string]: boolean } => {
			const isTop = props.positionMap
				.toLowerCase()
				.includes(HORIZONTAL_MAP_POSITION.top);
			const isLeft = props.positionMap
				.toLowerCase()
				.includes(VERTICAL_MAP_POSITION.left);

			return {
				[MAP_CLASSES.base]: true,
				[MAP_CLASSES.top]: isTop,
				[MAP_CLASSES.bottom]: !isTop,
				[MAP_CLASSES.left]: isLeft,
				[MAP_CLASSES.right]: !isLeft,
			};
		});

		function focusMapButton(): void
		{
			toValue(mapButton)?.$el?.focus();
		}

		// The claim of the panel goes away with the state it watches, so the canvas is asked for the
		// focus a tick later: by then the stack answers about the layers that are still open, not
		// about the map that is closing. A layer still holding Escape refuses the canvas, and the
		// panel the focus stood on is already gone, so the button it opens from takes it instead.
		function closeMap(focusTarget: MapFocusTarget): void
		{
			isShowMap.value = false;

			if (focusTarget === null)
			{
				return;
			}

			nextTick(() => {
				if (focusTarget === MAP_FOCUS_TARGET.canvas && returnFocusToCanvas())
				{
					return;
				}

				focusMapButton();
			});
		}

		function onCloseMap(): void
		{
			closeMap(MAP_FOCUS_TARGET.mapButton);
		}

		function isFocusInsideMapPanel(): boolean
		{
			return document.getElementById(canvasMapPanelId)?.contains(document.activeElement) === true;
		}

		// The panel closed from the keyboard hands the focus to the canvas, where the arrows and the
		// shortcuts of the diagram start from; the pointer paths keep the button they were aimed at.
		// The claim is page-wide, so the shortcut arrives with the focus anywhere: a close asked from
		// outside the panel moves no focus at all, the way Escape of the very same panel does not.
		function keyboardFocusTarget(): MapFocusTarget
		{
			return isFocusInsideMapPanel() ? MAP_FOCUS_TARGET.canvas : null;
		}

		// The exclusive claim takes Escape on the capture phase, ahead of a popup that answers the
		// very same key on its own: without the guard one press would close both. The cross and the
		// button are aimed by the pointer and need no such check.
		// That claim is page-wide, so the press arrives with the focus anywhere on the page: a press
		// from outside the panel moves no focus at all.
		function onEscapeCloseMap(): void
		{
			if (isKeyboardBusyByOverlay())
			{
				return;
			}

			closeMap(isFocusInsideMapPanel() ? MAP_FOCUS_TARGET.canvas : null);
		}

		function onToggleMap(focusTarget: MapFocusTarget = MAP_FOCUS_TARGET.mapButton): void
		{
			if (toValue(isDisabled))
			{
				return;
			}

			if (toValue(isShowMap))
			{
				closeMap(focusTarget);

				return;
			}

			isShowMap.value = true;
			nextTick(() => toValue(canvasMap)?.focus());
		}

		// The panel joins the same last-in-first-out stack of exclusive Escape claims that the catalog
		// and the settings panels hold: a map opened later answers the key before them, and a bubbling
		// handler on the panel would never see the press their capture-phase claim already took.
		// Both halves are idempotent: the bar asks for a key it may already hold and gives up one it
		// may have given up already.
		function claimEscape(): void
		{
			if (unsubscribeEscape === null)
			{
				unsubscribeEscape = inputState.onExclusive(KEY_TOKEN.ESCAPE, onEscapeCloseMap);
			}
		}

		function releaseEscapeClaim(): void
		{
			unsubscribeEscape?.();
			unsubscribeEscape = null;
		}

		// The capture-phase claim reaches past the layers above the canvas, so an open map held it
		// would take Escape from a text field being edited elsewhere on the page - the inline rename
		// of a node first of all, which cancels by the very same key.
		function syncEscapeClaim(): void
		{
			if (toValue(isShowMap) && !isFieldFocused)
			{
				claimEscape();

				return;
			}

			releaseEscapeClaim();
		}

		// `focusout` names where the focus goes next and `focusin` where it landed. Reading
		// `activeElement` instead would miss a focus that fell to the body: no `focusin` follows it.
		function onFocusChanged(event: FocusEvent): void
		{
			isFieldFocused = isFieldElement(
				event.type === 'focusout' ? event.relatedTarget : event.target,
			);
			syncEscapeClaim();
		}

		// The guard is the shortcuts' alone: a click on a button is aimed at it, while a press under a
		// popup belongs to the popup. The browser action goes off only once the press is taken - a
		// press the bar refuses belongs to the browser and to the layers above the canvas.
		function isKeyboardFree(): boolean
		{
			return !isKeyboardBusyByOverlay() && !toValue(isDisabled);
		}

		// The keyboard goes through the handler of the button, so the map is as blocked as the button
		// and the focus travels the same way.
		function toggleMapFromKeyboard(event: KeyboardEvent): void
		{
			if (!isKeyboardFree())
			{
				return;
			}

			event.preventDefault();
			onToggleMap(keyboardFocusTarget());
		}

		// The range is the camera's own business: it clamps on every path, and a second check here
		// would be a second source of truth about the same limits.
		function zoomInFromKeyboard(event: KeyboardEvent): void
		{
			if (!isKeyboardFree())
			{
				return;
			}

			event.preventDefault();
			zoomIn(props.stepZoom);
		}

		function zoomOutFromKeyboard(event: KeyboardEvent): void
		{
			if (!isKeyboardFree())
			{
				return;
			}

			event.preventDefault();
			zoomOut(props.stepZoom);
		}

		watch(isDisabled, (disabled) => {
			if (disabled && toValue(isShowMap))
			{
				closeMap(null);
			}
		});

		watch(isShowMap, syncEscapeClaim);

		onMounted(() => {
			Event.bind(document, 'focusin', onFocusChanged);
			Event.bind(document, 'focusout', onFocusChanged);
		});

		onUnmounted(() => {
			Event.unbind(document, 'focusin', onFocusChanged);
			Event.unbind(document, 'focusout', onFocusChanged);
			releaseEscapeClaim();
		});

		useKeyboardShortcuts([
			{
				actionId: CANVAS_ACTION_ID.TOGGLE_MAP,
				handler: toggleMapFromKeyboard,
				preventDefault: false,
			},
			{
				actionId: CANVAS_ACTION_ID.ZOOM_IN,
				handler: zoomInFromKeyboard,
				preventDefault: false,
			},
			{
				// On the layouts where plus is typed with Shift the modifier joins the combo - a second
				// spelling of the same gesture, not a second action, so it stays a plain record next to
				// the actionId one instead of living in the registry.
				keys: ['Mod', 'Shift', 'Equal'],
				handler: zoomInFromKeyboard,
				preventDefault: false,
			},
			{
				actionId: CANVAS_ACTION_ID.ZOOM_OUT,
				handler: zoomOutFromKeyboard,
				preventDefault: false,
			},
		]);

		// The bar owns the property, the command reads it from the state of the diagram at the moment
		// it runs: the panels of the consumer come and go while the diagram stays mounted.
		watch(() => props.viewportInsets, (insets: DiagramViewportInsets) => {
			viewportInsets.value = insets;
		}, { immediate: true });

		// The panel goes away while the diagram stays: the insets it published leave with it, so the
		// next call of the command measures the free area by what is really on the screen. Only the
		// ones it published itself: the state belongs to the whole application, and a bar that leaves
		// while another one already stands there would otherwise clear edges that are still covered,
		// with no property change left to bring them back.
		onUnmounted(() => {
			// The state hands its value out through a reactive proxy, the property is the bare object.
			if (toRaw(viewportInsets.value) === toRaw(props.viewportInsets))
			{
				viewportInsets.value = { ...NO_VIEWPORT_INSETS };
			}
		});

		// The panel is a surface of its own next to the root: a consumer mounts it beside the diagram
		// rather than inside it. An open menu of the panel takes the press as well - it answers the
		// key by its own typeahead, and a scheme moving under a menu that stays where it was is one
		// press answered twice.
		function canFitToView(): boolean
		{
			return !toValue(isDisabled)
				&& !toValue(isOpenContextMenu)
				&& isFocusOnAnyOf([toValue(root), toValue(blockDiagramRef), toValue(canvasMapRef)]);
		}

		registerFitToViewShortcut(canFitToView, fitToView);

		return {
			iconSet: Outline,
			mapPositionClasses,
			isShowMap,
			isDisabled,
			root,
			mapButton,
			canvasMap,
			canvasMapPanelId,
			closeMapLabel,
			fitToViewKeyshortcuts: useActionKeyshortcuts(CANVAS_ACTION_ID.FIT_TO_VIEW),
			mapKeyshortcuts: useActionKeyshortcuts(CANVAS_ACTION_ID.TOGGLE_MAP),
			zoomInKeyshortcuts: useActionKeyshortcuts(CANVAS_ACTION_ID.ZOOM_IN),
			zoomOutKeyshortcuts: useActionKeyshortcuts(CANVAS_ACTION_ID.ZOOM_OUT),
			onToggleMap,
			onCloseMap,
		};
	},
	template: `
		<div
			ref="root"
			class="ui-block-diagram-canvas-zoom-bar"
			:class="{ '--flat': flat }"
			:aria-keyshortcuts="fitToViewKeyshortcuts"
			:data-test-id="$blockDiagramTestId('zoomBar')"
		>
			<div class="ui-block-diagram-canvas-zoom-bar__locate">
				<CanvasMapBtn
					ref="mapButton"
					:isActive="isShowMap"
					:disabled="isDisabled"
					:aria-expanded="isShowMap"
					:aria-controls="canvasMapPanelId"
					:aria-keyshortcuts="mapKeyshortcuts"
					:data-test-id="$blockDiagramTestId('zoomOpenMapBtn')"
					@click="onToggleMap()"
				/>
				<transition name="editor-large-map-fade" mode="in-out">
					<div
						v-if="isShowMap"
						:id="canvasMapPanelId"
						:data-test-id="$blockDiagramTestId('zoomMapPanel')"
						class="ui-block-diagram-canvas-zoom-bar__map"
						:class="mapPositionClasses"
					>
						<div class="ui-block-diagram-canvas-zoom-bar__map-header">
							<button
								type="button"
								class="ui-block-diagram-canvas-zoom-bar__map-close-button"
								:aria-label="closeMapLabel"
								:data-test-id="$blockDiagramTestId('zoomCloseMapBtn')"
								@click="onCloseMap"
							>
								<BIcon
									:name="iconSet.CROSS_M"
									:size="24"
									aria-hidden="true"
									class="ui-block-diagram-canvas-zoom-bar__map-close-icon"
									color="#2FC6F6"
								/>
							</button>
						</div>
						<CanvasMap
							ref="canvasMap"
							:mapWidth="310"
							:mapHeight="183"
							:blockColors="blockColors"
							:frameColors="frameColors"
						/>
					</div>
				</transition>
			</div>
			<div class="ui-block-diagram-canvas-zoom-bar__separator"/>
			<div class="ui-block-diagram-canvas-zoom-bar__zoom">
				<ZoomBtn
					:stepZoom="stepZoom"
					:disabled="disabled"
					:aria-keyshortcuts="zoomOutKeyshortcuts"
					typeZoom="out"
				/>
				<ZoomPercent :disabled="disabled"/>
				<ZoomBtn
					:stepZoom="stepZoom"
					:disabled="disabled"
					:aria-keyshortcuts="zoomInKeyshortcuts"
					typeZoom="in"
				/>
			</div>
		</div>
	`,
};
