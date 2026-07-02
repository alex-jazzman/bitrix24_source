import {
	useTemplateRef,
	computed,
	toValue,
	onMounted,
	onUnmounted,
} from 'ui.vue3';
import { usePortState, useNewConnection } from '../../composables';
import {
	PORT_POSITION,
	SOURCE_PORT_STUB_TELEPORT_NAME,
	TARGET_PORT_STUB_TELEPORT_NAME,
} from '../../constants';
import './port.css';

type PortSetup = {
	isSourcePort: boolean,
	isTargetPort: boolean,
	isActive: boolean,
	isDisabled: boolean,
	isValid: boolean,
	isIncludedPortInSelectedBlock: boolean,
	isIncludedPortInMovingBlock: boolean,
	portClassNames: { [string]: boolean },
	onMouseDownPort: (event: MouseEvent) => void;
};

const PORT_CLASS_NAMES = {
	base: 'ui-block-diagram-port',
	disabled: '--disabled',
	active: '--active',
	error: '--error',
	hasView: '--has-view',
};

export const SOURCE_PORT_STUB_SLOT_NAME = 'sourcePortStub';
export const TARGET_PORT_STUB_SLOT_NAME = 'targetPortStub';

// @vue/component
export const Port = {
	name: 'DiagramPort',
	props: {
		/** @type DiagramBlock */
		block: {
			type: Object,
			required: true,
		},
		/** @type DiagramPort */
		port: {
			type: Object,
			required: true,
		},
		/** @type DiagramPortPosition */
		position: {
			type: String,
			required: true,
			validator(position): boolean
			{
				return Object.values(PORT_POSITION).includes(position);
			},
		},
		index: {
			type: Number,
			required: true,
		},
		/** @type Array<DiagramValidationPortRuleFn> */
		validationRules: {
			type: Array,
			default: () => ([]),
		},
		/** @type DiagramNormalyzeConnectionFn | null */
		normalyzeConnectionFn: {
			type: Function,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { slots }): PortSetup
	{
		const {
			isDisabled,
			isMaybePortForNewConnection,
			isIncludedPortInSelectedBlock,
			isIncludedPortInMovingBlock,
			onMountedPort,
			onUnmountedPort,
		} = usePortState({
			portRef: useTemplateRef('port'),
			block: props.block,
			port: props.port,
			position: props.position,
			validationRules: props.validationRules,
			index: props.index,
		});
		const {
			isSourcePort,
			isTargetPort,
			onMouseDownPort,
		} = useNewConnection({
			block: props.block,
			port: props.port,
			position: props.position,
			index: props.index,
			normalyzeConnectionFn: props.normalyzeConnectionFn,
		});

		const isActive = computed((): boolean => {
			return (
				toValue(isSourcePort)
				|| toValue(isMaybePortForNewConnection)
				|| toValue(isTargetPort)
				|| toValue(isIncludedPortInSelectedBlock)
			) && !toValue(isIncludedPortInMovingBlock);
		});

		const portClassNames = computed((): { [string]: boolean } => ({
			[PORT_CLASS_NAMES.base]: true,
			[PORT_CLASS_NAMES.active]: toValue(isSourcePort) || toValue(isMaybePortForNewConnection),
			[PORT_CLASS_NAMES.disabled]: toValue(isDisabled),
		}));

		onMounted(() => {
			onMountedPort();
		});

		onUnmounted(() => {
			onUnmountedPort();
		});

		return {
			sourcePortStubTeleportName: `#${SOURCE_PORT_STUB_TELEPORT_NAME}`,
			targetPortStubTeleportName: `#${TARGET_PORT_STUB_TELEPORT_NAME}`,
			sourcePortStubSlotName: SOURCE_PORT_STUB_SLOT_NAME,
			targetPortStubSlotName: TARGET_PORT_STUB_SLOT_NAME,
			isSourcePort,
			isTargetPort,
			isActive,
			isDisabled,
			isIncludedPortInSelectedBlock,
			isIncludedPortInMovingBlock,
			portClassNames,
			onMouseDownPort,
		};
	},
	template: `
		<div
			ref="port"
			:class="portClassNames"
			:data-test-id="$blockDiagramTestId('port', port.id)"
			@mousedown="onMouseDownPort"
		>
			<slot
				:isActive="isActive"
				:isDisabled="isDisabled"
				name="port"
			/>

			<teleport
				v-if="isSourcePort"
				:to="sourcePortStubTeleportName"
			>
				<slot :name="sourcePortStubSlotName">
					<div class="ui-block-diagram-port__stub"/>
				</slot>
			</teleport>

			<teleport
				v-if="isTargetPort"
				:to="targetPortStubTeleportName"
			>
				<slot :name="targetPortStubSlotName">
					<div class="ui-block-diagram-port__stub"/>
				</slot>
			</teleport>
		</div>
	`,
};
