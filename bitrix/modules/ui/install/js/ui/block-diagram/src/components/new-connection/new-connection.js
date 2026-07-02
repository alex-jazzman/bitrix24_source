import {
	computed,
	toValue,
	watch,
	useTemplateRef,
	onMounted,
} from 'ui.vue3';
import { useNewConnectionState, useBlockDiagram } from '../../composables';
import { SOURCE_PORT_STUB_TELEPORT_NAME, TARGET_PORT_STUB_TELEPORT_NAME } from '../../constants';
import type { UseNewConnectionState, DiagramNewConnection } from '../../composables';
import type { Point, Rect } from '../../types';
import './new-connection.css';

type CircleCenterPosition = {
	cx: number;
	cy: number;
};

type PortStubContainerStyle = {
	width: string;
	height: string;
};

type NewConnectionProps = {
	stubSize: number;
	duration: number;
};

type NewConnectionSetup = {
	sourcePortStubTeleportName: string;
	targetPortStubTeleportName: string;
	hasNewConnection: boolean;
	hasSourcePort: Pick<UseNewConnectionState, 'hasSourcePort'>;
	hasTargetPort: Pick<UseNewConnectionState, 'hasTargetPort'>;
	sourcePortLayoutRect: Pick<UseNewConnectionState, 'sourcePortLayoutRect'>;
	targetPortLayoutRect: Pick<UseNewConnectionState, 'targetPortLayoutRect'>;
	newConnectionPathInfo: Pick<UseNewConnectionState, 'newConnectionPathInfo'>;
	newTmpConnectionPathInfo: Pick<UseNewConnectionState, 'newConnectionPathInfo'>;
	newConnectionClassNames: { [string]: boolean };
	sourcePortStubContainerStyle: PortStubContainerStyle;
	targetPortStubContainerStyle: PortStubContainerStyle;
	circleCenterPosition: CircleCenterPosition;
};

const NEW_CONNECTION_CLASS_NAME = {
	base: 'ui-block-diagram-new-connection',
	up: '--up',
};

// @vue/component
export const NewConnection = {
	name: 'NewConnection',
	props: {
		stubSize: {
			type: Number,
			default: 50,
		},
		duration: {
			type: Number,
			default: 3000,
		},
	},
	// eslint-disable-next-line max-lines-per-function
	setup(props: NewConnectionProps): NewConnectionSetup
	{
		const { zoom } = useBlockDiagram();
		const {
			hasNewConnection,
			hasSourcePort,
			hasTargetPort,
			sourcePortLayoutRect,
			targetPortLayoutRect,
			hasTmpConnection,
			newConnectionPathInfo,
			newTmpConnectionPathInfo,
			newConnection,
		} = useNewConnectionState();
		const tmpPathRef = useTemplateRef('tmpPath');
		let animateTmpPath = null;

		const newConnectionClassNames = computed((): { [string]: boolean } => {
			return {
				[NEW_CONNECTION_CLASS_NAME.base]: true,
				[NEW_CONNECTION_CLASS_NAME.up]: toValue(hasNewConnection),
			};
		});

		const sourceForeignObjectPosition = computed((): Point => {
			return getForeignObjectPosition(sourcePortLayoutRect);
		});

		const targetForeignObjectPosition = computed((): Point => {
			return getForeignObjectPosition(targetPortLayoutRect);
		});

		const stubContainerStyle = computed((): PortStubContainerStyle => {
			return {
				width: `${props.stubSize / toValue(zoom)}px`,
				height: `${props.stubSize / toValue(zoom)}px`,
			};
		});

		const circleCenterPosition = computed((): CircleCenterPosition => {
			return {
				cx: toValue(newConnection)?.center?.x ?? 0,
				cy: toValue(newConnection)?.center?.y ?? 0,
			};
		});

		const hasConnectionEndPoint = computed((): boolean => {
			return toValue(newConnection)?.end !== null;
		});

		watch(hasConnectionEndPoint, () => {
			animateTmpPath?.cancel();
			animateTmpPath?.play();
		});

		onMounted(() => {
			initAnimateTmpPath();
		});

		function initAnimateTmpPath(): void
		{
			animateTmpPath = toValue(tmpPathRef)?.animate(
				[
					{
						strokeDasharray: '5, 5',
						strokeDashoffset: '100',
					},
					{
						strokeDasharray: '5, 5',
						strokeDashoffset: '0',
					},
				],
				{
					duration: props.duration,
					easing: 'linear',
					iterations: Infinity,
				},
			);
		}

		function getForeignObjectPosition(rect: Rect): Point
		{
			const { x, y, width, height } = toValue(rect);

			const centerPoint = {
				x: x + (width / 2),
				y: y + (height / 2),
			};

			return {
				x: centerPoint.x - (props.stubSize / toValue(zoom) / 2),
				y: centerPoint.y - (props.stubSize / toValue(zoom) / 2),
			};
		}

		return {
			SOURCE_PORT_STUB_TELEPORT_NAME,
			TARGET_PORT_STUB_TELEPORT_NAME,
			hasNewConnection,
			hasSourcePort,
			hasTargetPort,
			sourcePortLayoutRect,
			targetPortLayoutRect,
			hasTmpConnection,
			newConnectionPathInfo,
			newTmpConnectionPathInfo,
			newConnectionClassNames,
			sourceForeignObjectPosition,
			targetForeignObjectPosition,
			stubContainerStyle,
			circleCenterPosition,
		};
	},
	template: `
		<svg :class="newConnectionClassNames">
			<g
				v-show="hasNewConnection"
				stroke="none"
				stroke-width="1"
				fill="none"
				fill-rule="evenodd"
			>
				<path
					:d="newConnectionPathInfo.path"
					class="ui-block-diagram-new-connection__path"
				/>

				<path
					ref="tmpPath"
					:d="newTmpConnectionPathInfo.path"
					class="ui-block-diagram-new-connection__tmp-path"
				/>

				<circle
					:cx="circleCenterPosition.cx"
					:cy="circleCenterPosition.cy"
					:r="4"
					class="ui-block-diagram-new-connection__cursor"
				/>
			</g>

			<foreignObject
				:x="sourceForeignObjectPosition.x"
				:y="sourceForeignObjectPosition.y"
				:width="stubSize"
				:height="stubSize"
			>
				<div
					:style="stubContainerStyle"
					:id="SOURCE_PORT_STUB_TELEPORT_NAME"
					class="ui-block-diagram-new-connection__port-stub-container"
				/>
			</foreignObject>

			<foreignObject
				:x="targetForeignObjectPosition.x"
				:y="targetForeignObjectPosition.y"
				:width="stubSize"
				:height="stubSize"
			>
				<div
					:style="stubContainerStyle"
					:id="TARGET_PORT_STUB_TELEPORT_NAME"
					class="ui-block-diagram-new-connection__port-stub-container"
				/>
			</foreignObject>
		</svg>
	`,
};
