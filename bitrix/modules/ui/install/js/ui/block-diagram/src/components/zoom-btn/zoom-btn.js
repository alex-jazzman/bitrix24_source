import './zoom-btn.css';
import { computed, toValue, toRefs } from 'ui.vue3';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { useBlockDiagram, useCanvas, useLoc } from '../../composables';

type ZoomType = 'in' | 'out';

const ZOOM_TYPES = {
	in: 'in',
	out: 'out',
};

// @vue/component
export const ZoomBtn = {
	name: 'zoom-btn',
	components: {
		BIcon,
	},
	props: {
		stepZoom: {
			type: Number,
			default: 0.2,
		},
		/** @type ZoomType */
		typeZoom: {
			type: String,
			default: ZOOM_TYPES.in,
			validator(value): boolean
			{
				return value === ZOOM_TYPES.in || value === ZOOM_TYPES.out;
			},
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['zoom-change'],
	setup(props, { emit }): {...}
	{
		const { isDisabledBlockDiagram } = useBlockDiagram();
		const { zoomIn, zoomOut } = useCanvas();
		const loc = useLoc();

		const {
			stepZoom,
			typeZoom,
		} = toRefs(props);
		const isDisabled = computed(() => props.disabled || toValue(isDisabledBlockDiagram));
		const ariaLabel = computed(() => {
			const messageId = toValue(typeZoom) === ZOOM_TYPES.in
				? 'UI_BLOCK_DIAGRAM_ZOOM_IN'
				: 'UI_BLOCK_DIAGRAM_ZOOM_OUT';

			return loc.getMessage(messageId);
		});

		function onZoom()
		{
			if (toValue(isDisabled))
			{
				return;
			}

			if (toValue(typeZoom) === ZOOM_TYPES.in)
			{
				zoomIn(toValue(stepZoom));
			}
			else if (toValue(typeZoom) === ZOOM_TYPES.out)
			{
				zoomOut(toValue(stepZoom));
			}
		}

		return {
			iconSet: Outline,
			zoomTypes: ZOOM_TYPES,
			ariaLabel,
			isDisabled,
			onZoom,
		};
	},
	template: `
		<button
			type="button"
			:data-test-id="$blockDiagramTestId(typeZoom === zoomTypes.in ? 'zoomInBtn' : 'zoomOutBtn')"
			class="ui-block-diagram-control-btn__btn"
			:aria-label="ariaLabel"
			:disabled="isDisabled"
			@click="onZoom"
		>
			<BIcon
				v-if="typeZoom === zoomTypes.in"
				:name="iconSet.PLUS_M"
				:size="22"
				aria-hidden="true"
				class="ui-block-diagram-control-btn__icon"
			/>
			<BIcon
				v-else
				:name="iconSet.MINUS_M"
				:size="22"
				aria-hidden="true"
				class="ui-block-diagram-control-btn__icon"
			/>
		</button>
	`,
};
