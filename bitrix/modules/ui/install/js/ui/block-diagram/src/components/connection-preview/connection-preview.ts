import { computed, defineComponent, toValue } from 'ui.vue3';
import { useBlockDiagram } from '../../composables';
import { createConnectionsOffsetMap } from '../../composables/actions';
import { resolveRenderedConnectionRoute } from '../../utils';
import './connection-preview.css';

const MARKER_RADIUS = 4;

function isFiniteNumber(value)
{
	return typeof value === 'number' && Number.isFinite(value);
}

function resolvePortCenter(marker, portsRectMap)
{
	const rect = portsRectMap?.[marker.blockId]?.[marker.portId];

	if (rect === null || typeof rect !== 'object')
	{
		return null;
	}

	const { x, y, width, height } = rect;
	if (![x, y, width, height].every(isFiniteNumber) || width < 0 || height < 0)
	{
		return null;
	}

	const center = {
		x: x + (width / 2),
		y: y + (height / 2),
	};

	return [center.x, center.y].every(isFiniteNumber) ? center : null;
}

function isValidPath(path)
{
	return typeof path === 'string'
		&& path.trim() !== ''
		&& !/(?:NaN|Infinity)/.test(path);
}

export function createConnectionPreviewRender(
	{
		connectionPreview,
		portsRectMap,
		connectionOffset,
		connectionBendOffset,
		connectionBorderRadius,
	},
	createOffsetMap = createConnectionsOffsetMap,
)
{
	const previewOffsets = computed(() => {
		const preview = toValue(connectionPreview);
		const offset = toValue(connectionOffset);
		const bendOffset = toValue(connectionBendOffset);

		if (preview === null || ![offset, bendOffset].every(isFiniteNumber))
		{
			return null;
		}

		return {
			activationKey: preview.activationKey,
			connectionsOffsetMap: createOffsetMap(
				preview.routingConnections,
				offset,
				bendOffset,
			),
			offset,
			bendOffset,
		};
	});

	return computed(() => {
		const preview = toValue(connectionPreview);
		const currentPortsRectMap = toValue(portsRectMap);
		const borderRadius = toValue(connectionBorderRadius);
		const offsets = previewOffsets.value;

		if (
			preview === null
			|| offsets === null
			|| preview.activationKey !== offsets.activationKey
			|| !isFiniteNumber(borderRadius)
		)
		{
			return null;
		}

		const {
			connectionsOffsetMap,
			offset,
			bendOffset,
		} = offsets;
		const [firstRoute, secondRoute] = preview.temporaryConnections.map((connection) => {
			return resolveRenderedConnectionRoute({
				connection,
				portsRectMap: currentPortsRectMap,
				connectionsOffsetMap,
				bendOffset,
				offset,
				borderRadius,
			});
		});
		const [firstMarker, secondMarker] = preview.portMarkers.map((marker) => {
			return resolvePortCenter(marker, currentPortsRectMap);
		});

		if (
			firstRoute === null
			|| secondRoute === null
			|| !isValidPath(firstRoute.path)
			|| !isValidPath(secondRoute.path)
			|| firstMarker === null
			|| secondMarker === null
		)
		{
			return null;
		}

		return {
			activationKey: preview.activationKey,
			paths: [firstRoute.path, secondRoute.path],
			markers: [firstMarker, secondMarker],
		};
	});
}

// @vue/component
export const ConnectionPreview = defineComponent({
	name: 'UiBlockDiagramConnectionPreview',
	setup()
	{
		const {
			connectionPreview,
			portsRectMap,
			connectionOffset,
			connectionBendOffset,
			connectionBorderRadius,
		} = useBlockDiagram();
		const previewRender = createConnectionPreviewRender({
			connectionPreview,
			portsRectMap,
			connectionOffset,
			connectionBendOffset,
			connectionBorderRadius,
		});

		return {
			previewRender,
			markerRadius: MARKER_RADIUS,
		};
	},
	template: `
		<svg
			v-if="previewRender"
			class="ui-block-diagram-connection-preview"
			:data-test-id="$blockDiagramTestId('connectionPreview')"
			aria-hidden="true"
			focusable="false"
		>
			<g
				:key="previewRender.activationKey"
				class="ui-block-diagram-connection-preview__group"
			>
				<path
					v-for="(path, index) in previewRender.paths"
					:key="'path-' + index"
					:d="path"
					class="ui-block-diagram-connection-preview__path"
				/>
				<circle
					v-for="(marker, index) in previewRender.markers"
					:key="'marker-' + index"
					:cx="marker.x"
					:cy="marker.y"
					:r="markerRadius"
					class="ui-block-diagram-connection-preview__marker"
				/>
			</g>
		</svg>
	`,
});
