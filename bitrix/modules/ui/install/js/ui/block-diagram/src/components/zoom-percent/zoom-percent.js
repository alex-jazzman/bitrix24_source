import './zoom-percent.css';
import { computed, toValue, ref } from 'ui.vue3';
import {
	useBlockDiagram,
	useContextMenu,
	useCanvas,
	useLoc,
} from '../../composables';

type ZoomPercentSetup = {
	percent: number,
}

const ZOOM_PRESET = [0.5, 0.7, 1, 2];

// @vue/component
export const ZoomPercent = {
	name: 'zoom-percent',
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props): ZoomPercentSetup
	{
		const { zoom, isDisabledBlockDiagram } = useBlockDiagram();
		const { setZoom } = useCanvas();
		const loc = useLoc();

		const percent = computed(() => {
			return ((toValue(zoom) ?? 0) * 100).toFixed(0);
		});
		const { showMenu, isOpen } = useContextMenu();
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
				targetContainer: rootElement.parentElement,
				items: ZOOM_PRESET.map((value) => {
					return {
						text: `${value * 100}%`,
						onclick: () => setZoom(value),
					};
				}),
			};
			showMenu({
				clientX: 0,
				clientY: 0,
			}, options);
		}

		return {
			percent,
			root,
			isOpen,
			isDisabled,
			buttonLabel,
			onOpenZoomPresetMenu,
		};
	},
	template: `
		<button
			type="button"
			:data-test-id="$blockDiagramTestId('zoomPercentBtn')"
			class="ui-block-diagram-percent"
			:class="{ '--selected': isOpen }"
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
