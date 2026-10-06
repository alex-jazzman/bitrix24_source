import './zoom-bar.css';
import { Text } from 'main.core';
import {
	computed,
	nextTick,
	ref,
	toValue,
	watch,
} from 'ui.vue3';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { ZoomBtn } from '../zoom-btn/zoom-btn';
import { ZoomPercent } from '../zoom-percent/zoom-percent';
import { CanvasMap } from '../canvas-map/canvas-map';
import { CanvasMapBtn } from '../canvas-map-btn/canvas-map-btn';
import { useBlockDiagram, useLoc } from '../../composables';

type ZoomBarSetup = {
	iconSet: { [string]: string };
	mapPositionClasses: { [string]: boolean };
	isShowMap: boolean;
	isDisabled: boolean;
	canvasMapPanelId: string;
	closeMapLabel: string;
	onToggleMap: () => void,
	onCloseMap: () => void,
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
			default: () => {},
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
	setup(props): ZoomBarSetup
	{
		const loc = useLoc();
		const { isDisabledBlockDiagram } = useBlockDiagram();
		const isShowMap = ref(false);
		const mapButton = ref(null);
		const canvasMap = ref(null);
		const canvasMapPanelId = `ui-block-diagram-canvas-map-${Text.getRandom()}`;
		const closeMapLabel = loc.getMessage('UI_BLOCK_DIAGRAM_CANVAS_MAP_CLOSE');
		const isDisabled = computed(() => props.disabled || toValue(isDisabledBlockDiagram));

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

		function closeMap(restoreFocus: boolean): void
		{
			isShowMap.value = false;

			if (restoreFocus)
			{
				nextTick(focusMapButton);
			}
		}

		function onCloseMap(): void
		{
			closeMap(true);
		}

		function onToggleMap(): void
		{
			if (toValue(isDisabled))
			{
				return;
			}

			if (toValue(isShowMap))
			{
				closeMap(true);

				return;
			}

			isShowMap.value = true;
			nextTick(() => toValue(canvasMap)?.focus());
		}

		watch(isDisabled, (disabled) => {
			if (disabled && toValue(isShowMap))
			{
				closeMap(false);
			}
		});

		return {
			iconSet: Outline,
			mapPositionClasses,
			isShowMap,
			isDisabled,
			mapButton,
			canvasMap,
			canvasMapPanelId,
			closeMapLabel,
			onToggleMap,
			onCloseMap,
		};
	},
	template: `
		<div
			class="ui-block-diagram-canvas-zoom-bar"
			:class="{ '--flat': flat }"
			:data-test-id="$blockDiagramTestId('zoomBar')"
		>
			<div class="ui-block-diagram-canvas-zoom-bar__locate">
				<CanvasMapBtn
					ref="mapButton"
					:isActive="isShowMap"
					:disabled="isDisabled"
					:aria-expanded="isShowMap"
					:aria-controls="canvasMapPanelId"
					:data-test-id="$blockDiagramTestId('zoomOpenMapBtn')"
					@click="onToggleMap"
				/>
				<transition name="editor-large-map-fade" mode="in-out">
					<div
						v-if="isShowMap"
						:id="canvasMapPanelId"
						:data-test-id="$blockDiagramTestId('zoomMapPanel')"
						class="ui-block-diagram-canvas-zoom-bar__map"
						:class="mapPositionClasses"
						@keydown.esc.stop.prevent="onCloseMap"
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
							:mapSize="310"
							:blockColors="blockColors"
						/>
					</div>
				</transition>
			</div>
			<div class="ui-block-diagram-canvas-zoom-bar__separator"/>
			<div class="ui-block-diagram-canvas-zoom-bar__zoom">
				<ZoomBtn
					:stepZoom="stepZoom"
					:disabled="disabled"
					typeZoom="out"
				/>
				<ZoomPercent :disabled="disabled"/>
				<ZoomBtn
					:stepZoom="stepZoom"
					:disabled="disabled"
					typeZoom="in"
				/>
			</div>
		</div>
	`,
};
