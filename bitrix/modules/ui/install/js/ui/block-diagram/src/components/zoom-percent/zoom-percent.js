import { vBTooltip } from 'ui.system.tooltip.vue';
import {
	computed,
	getCurrentInstance,
	onUnmounted,
	ref,
	toValue,
} from 'ui.vue3';

import {
	useActionShortcut,
	useBlockDiagram,
	useContextMenu,
	useCanvas,
	useLoc,
} from '../../composables';
import { CANVAS_ACTION_ID, TOOLTIP_SHOW_DELAY, withShortcut } from '../../utils';

import './zoom-percent.css';

type ZoomPercentSetup = {
	percent: number,
}

const ZOOM_PRESET = [0.5, 0.7, 1, 2];

// Passed on purpose: without it `Menu` applies an `offsetTop` default of its own. Zero adds nothing
// to the lift a popup opened above its bind element already gets from `positionTopXOffset`.
const ZOOM_PRESET_MENU_OFFSET_TOP = 0;
const ZOOM_PRESET_MENU_OFFSET_LEFT = 15;

const FIT_TO_VIEW_MENU_ITEM_TEST_ID = 'zoomFitToViewMenuItem';
const ZOOM_PRESET_MENU_ITEM_TEST_ID = 'zoomPresetMenuItem';

// @vue/component
export const ZoomPercent = {
	name: 'zoom-percent',
	directives: {
		'b-tooltip': vBTooltip,
	},
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props): ZoomPercentSetup
	{
		const { zoom, isDisabledBlockDiagram } = useBlockDiagram();
		const { setZoom, fitToView } = useCanvas();
		const loc = useLoc();
		// The fit is an action of the canvas, so the keys named in its item are the ones the registry
		// holds for it - a personal binding included. The menu is built anew on every opening, so the
		// caption is read at that moment and needs no watcher of its own.
		const fitToViewShortcut = useActionShortcut(CANVAS_ACTION_ID.FIT_TO_VIEW);
		// The items of the menu are built in code rather than in the template, so the label of the
		// extension is taken straight from the global the templates spell it with.
		const testId = getCurrentInstance().appContext.app.config.globalProperties.$blockDiagramTestId;

		const percent = computed(() => {
			return ((toValue(zoom) ?? 0) * 100).toFixed(0);
		});
		const { showMenu, isOpen, closeContextMenu } = useContextMenu();
		const isDisabled = computed(() => props.disabled || toValue(isDisabledBlockDiagram));
		const buttonLabel = computed(() => {
			return `${loc.getMessage('UI_BLOCK_DIAGRAM_ZOOM_PRESET_BUTTON')}: ${toValue(percent)}%`;
		});
		const root = ref(null);

		function onOpenZoomPresetMenu(): void
		{
			const rootElement = toValue(root);
			if (toValue(isDisabled) || !rootElement)
			{
				return;
			}

			const options = {
				className: 'ui-block-diagram-percent-menu',
				minWidth: 106,
				bindElement: rootElement,
				// The zoom panel stands in a corner of the canvas, and a popup fits itself into
				// its target container: anything but the document leaves the menu cut off.
				targetContainer: document.body,
				bindOptions: { position: 'top' },
				offsetTop: ZOOM_PRESET_MENU_OFFSET_TOP,
				offsetLeft: ZOOM_PRESET_MENU_OFFSET_LEFT,
				items: [
					// The fit names no scale of its own: it is a command over all the fixed values
					// rather than one of them, so it opens the list apart from them. The click carries
					// the point of the menu, and the command takes settings - it is called without
					// arguments on purpose.
					{
						text: withShortcut(
							loc.getMessage('UI_BLOCK_DIAGRAM_ZOOM_FIT_TO_VIEW'),
							toValue(fitToViewShortcut),
						),
						dataset: { testId: testId(FIT_TO_VIEW_MENU_ITEM_TEST_ID) },
						onclick: () => fitToView(),
					},
					...ZOOM_PRESET.map((value) => {
						const percentValue = `${value * 100}`;

						return {
							text: `${percentValue}%`,
							dataset: { testId: testId(ZOOM_PRESET_MENU_ITEM_TEST_ID, percentValue) },
							onclick: () => setZoom(value),
						};
					}),
				],
			};
			showMenu({
				clientX: 0,
				clientY: 0,
			}, options);
		}

		// The popup lives in `document.body` now and no longer goes away with the component. The
		// menu instance is shared across the diagram, so close it only while this button owns it.
		onUnmounted(() => {
			if (toValue(isOpen))
			{
				closeContextMenu();
			}
		});

		return {
			percent,
			root,
			isOpen,
			isDisabled,
			buttonLabel,
			// The tooltip names the tool, so it stays the bare phrase while the accessible name carries
			// the current percent on top of it.
			tooltip: {
				content: loc.getMessage('UI_BLOCK_DIAGRAM_ZOOM_PRESET_BUTTON'),
				showDelay: TOOLTIP_SHOW_DELAY,
			},
			onOpenZoomPresetMenu,
		};
	},
	template: `
		<button
			type="button"
			:data-test-id="$blockDiagramTestId('zoomPercentBtn')"
			class="ui-block-diagram-percent"
			:class="{ '--selected': isOpen }"
			v-b-tooltip="tooltip"
			:aria-label="buttonLabel"
			aria-haspopup="menu"
			:aria-expanded="isOpen"
			:disabled="isDisabled"
			ref="root"
			@click="onOpenZoomPresetMenu"
		>
			{{ percent }}
		</button>
	`,
};
