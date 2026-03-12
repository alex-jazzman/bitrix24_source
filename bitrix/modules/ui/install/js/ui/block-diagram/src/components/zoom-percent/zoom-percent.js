import './zoom-percent.css';
import { computed, toValue, ref } from 'ui.vue3';
import { useBlockDiagram, useContextMenu, useCanvas } from '../../composables';

type ZoomPercentSetup = {
	percent: number,
}

const ZOOM_PRESET = [0.5, 0.7, 1, 2];

// @vue/component
export const ZoomPercent = {
	name: 'zoom-percent',
	setup(props): ZoomPercentSetup
	{
		const { zoom, isDisabledBlockDiagram } = useBlockDiagram();

		const { setZoom } = useCanvas();

		const { showMenu, isOpen } = useContextMenu();

		const percent = computed(() => {
			return ((toValue(zoom) ?? 0) * 100).toFixed(0);
		});

		const root = ref(null);

		function onOpenZoomPresetMenu(): void
		{
			if (toValue(isDisabledBlockDiagram))
			{
				return;
			}

			const options = {
				className: 'ui-block-diagram-percent-menu',
				minWidth: 106,
				targetContainer: root.value.parentElement,
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
			onOpenZoomPresetMenu,
		};
	},
	template: `
		<span
			class="ui-block-diagram-percent"
			:class="{ '--selected': isOpen }"
			ref="root"
			@click="onOpenZoomPresetMenu"
		>
			{{ percent }}
		</span>
	`,
};
