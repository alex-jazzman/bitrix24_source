import { computed, toValue } from 'ui.vue3';
import {
	useConnectionState,
	useContextMenu,
	useBlockDiagram,
	useLoc,
} from '../../composables';
import './connection.css';
import type { UseConnectionState } from '../../composables';

type ConnectionSetup = {
	connectionPathInfo: Pick<UseConnectionState, 'connectionPathInfo'>;
	targetConnectionClasses: { [string]: boolean };
	barStyle: { [string]: string };
	onOpenContextMenu: () => void;
}

const CONNECTION_CLASS_NAME = {
	base: 'ui-block-diagram-connection',
	active: '--active',
};

const TARGET_CONNECTION_CLASS_NAMES = {
	base: 'ui-block-diagram-connection__target',
	active: '--active',
};

// @vue/component
export const Connection = {
	name: 'diagram-connection',
	props: {
		/** @type DiagramConnection */
		connection: {
			type: Object,
			required: true,
		},
		barWidth: {
			type: Number,
			default: 22,
		},
		barHeight: {
			type: Number,
			default: 22,
		},
		contextMenuItems: {
			type: Array,
			default: () => ([]),
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props): ConnectionSetup
	{
		const {
			connectionPathInfo,
			isDisabled,
		} = useConnectionState(props.connection);
		const { deleteConnectionById } = useBlockDiagram();
		const loc = useLoc();
		const { isOpen, showMenu } = useContextMenu();

		const preparedContextMenuItems = computed(() => {
			const defaultItems = [
				{
					id: 'deleteConnection',
					text: loc.getMessage('UI_BLOCK_DIAGRAM_DELETE_CONNECTION_CONTEXT_MENU_ITEM'),
					onclick: () => {
						deleteConnectionById(props.connection.id);
					},
				},
			];

			if (props.contextMenuItems.length > 0)
			{
				return props.contextMenuItems;
			}

			return defaultItems;
		});

		const connectionClassNames = computed((): { [string]: boolean } => {
			return {
				[CONNECTION_CLASS_NAME.base]: true,
				[CONNECTION_CLASS_NAME.active]: toValue(isOpen),
			};
		});

		const targetConnectionClasses = computed((): { [string]: boolean } => ({
			[TARGET_CONNECTION_CLASS_NAMES.base]: true,
			[TARGET_CONNECTION_CLASS_NAMES.active]: toValue(isOpen),
		}));

		const barPosition = computed((): { [string]: number } => {
			const { x: centerX = 0, y: centerY = 0 } = toValue(connectionPathInfo).center ?? {};

			return {
				x: centerX - (props.barWidth / 2),
				y: centerY - (props.barHeight / 2),
			};
		});

		function onOpenContextMenu(event: MouseEvent): void
		{
			if (toValue(isDisabled) || props.disabled)
			{
				return;
			}

			event.preventDefault();
			showMenu(
				event,
				{ items: toValue(preparedContextMenuItems) },
			);
		}

		return {
			isDisabled,
			connectionPathInfo,
			connectionClassNames,
			targetConnectionClasses,
			barPosition,
			onOpenContextMenu,
			loc,
			deleteConnectionById,
		};
	},
	template: `
		<svg :class="connectionClassNames">
			<g class="ui-block-diagram-connection__group">
				<path
					:d="connectionPathInfo.path"
					:class="targetConnectionClasses"
					:data-test-id="$blockDiagramTestId('connectionLine', connection.id)"
				/>
				<path
					:d="connectionPathInfo.path"
					:data-test-id="$blockDiagramTestId('connectionHoveredLine', connection.id)"
					class="ui-block-diagram-connection__hovered"
					stroke="transparent"
					fill="transparent"
					@contextmenu.stop="onOpenContextMenu"
				/>
				<foreignObject
					:x="barPosition.x"
					:y="barPosition.y"
					:width="barWidth"
					:height="barHeight"
					class="ui-block-diagram-connection__bar"
				>
					<slot :isDisabled="isDisabled || disabled" />
				</foreignObject>
			</g>
		</svg>
	`,
};
