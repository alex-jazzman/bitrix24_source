import { Text } from 'ui.system.typography.vue';
import { useBlockDiagram } from 'ui.block-diagram';
import { FeatureCode } from 'bizprocdesigner.feature';
import { useLoc, useFeature } from '../../../../shared/composables';
import { PORT_TYPES, COMPLEX_NODE_PORT_LABELS } from '../../../../shared/constants';
import { createUniqueId, parsePortTitle } from '../../../../shared/utils';
import { normalyzeAuxConnection } from '../../utils';

import './style.css';

import type { Port as TPort } from '../../../../shared/types';

const NOT_REALLY_COMPLEX_BLOCK = new Set([
	'ForEachActivity',
	'IfElseBranchActivity',
	'IfElseActivity',
	'WhileActivity',
	'ApproveActivity',
	'RequestInformationOptionalActivity',
	'ListenActivity',
]);
const MAX_AUX_COUNT = 5;
const MIN_RULE_ITEMS_COUNT = 5;
const RESERVED_INPUT_RULES_TITLES = Array.from({ length: MIN_RULE_ITEMS_COUNT }, (_, i) => {
	return `${COMPLEX_NODE_PORT_LABELS.inputRule}${i + 1}`;
});
const RESERVED_OUTPUT_RULES_TITLES = Array.from({ length: MIN_RULE_ITEMS_COUNT }, (_, i) => {
	return `${COMPLEX_NODE_PORT_LABELS.outputRule}${i + 1}`;
});

type BlockComplexSetup = {
	updatePort: () => void;
	getMessage: () => string;
};

type Placeholder = {
	id: string;
	title: string;
};

type RuleType = {
	id: string;
	label: string;
	items: Array<TPort | Placeholder>;
	position: string;
	classList: Array<string>;
};

const BLOCK_COMPLEX_CLASS_NAMES = {
	base: 'block-complex',
	deactivated: '--deactivated',
};

// @vue/component
export const BlockComplexContent = {
	name: 'BlockComplexContent',
	components: {
		BxText: Text,
	},
	props:
	{
		/** @type Block */
		block:
		{
			type: Object,
			required: true,
		},
		/** @type Array<TPort> */
		ports:
		{
			type: Array,
			required: true,
		},
		title:
		{
			type: String,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		deactivated: {
			type: Boolean,
			default: false,
		},
	},
	setup(): BlockComplexSetup
	{
		const { updatePort, newConnection, addConnection } = useBlockDiagram();
		const { getMessage } = useLoc();
		const { isFeatureAvailable } = useFeature();

		return {
			updatePort,
			newConnection,
			addConnection,
			getMessage,
			isFeatureAvailable,
		};
	},
	computed:
	{
		blockComplexClassNames(): { [string]: boolean }
		{
			return {
				[BLOCK_COMPLEX_CLASS_NAMES.base]: true,
				[BLOCK_COMPLEX_CLASS_NAMES.deactivated]: this.deactivated,
			};
		},
		inputPorts(): Array<TPort>
		{
			return this.ports
				.filter((port) => port.type === PORT_TYPES.input || port.type === PORT_TYPES.inputRelation);
		},
		outputPorts(): Array<TPort>
		{
			return this.ports
				.filter((port) => port.type === PORT_TYPES.output);
		},
		rulePorts(): Array<TPort>
		{
			return this.ports.filter((port) => port.type === PORT_TYPES.input);
		},
		relationPorts(): Array<TPort>
		{
			return this.ports.filter((port) => port.type === PORT_TYPES.inputRelation);
		},
		inputPortsLength(): number
		{
			return this.inputPorts.length;
		},
		outputPortsLength(): number
		{
			return this.outputPorts.length;
		},
		auxPorts(): Array<TPort>
		{
			return this.block.ports.filter((port) => port.type === PORT_TYPES.aux);
		},
		auxPortsLength(): number
		{
			return this.auxPorts.length;
		},
		auxPortItems(): Array<TPort | Placeholder>
		{
			if (this.block.node?.shouldShowAuxPorts !== true)
			{
				return [];
			}

			const realPorts = this.auxPorts;
			const items = [];
			for (let i = 1; i <= MAX_AUX_COUNT; i++)
			{
				const title = `${COMPLEX_NODE_PORT_LABELS.aux}${i}`;
				const port = realPorts.find((p) => p.title === title);
				items.push(port ?? { id: createUniqueId(), title });
			}

			return items;
		},
		showRelationSection(): boolean
		{
			return this.isRelationFeatureAvailable
				&& this.block.node?.shouldShowAuxPorts !== true;
		},
		showAuxSection(): boolean
		{
			return this.block.node?.shouldShowAuxPorts === true;
		},
		isRelationFeatureAvailable(): boolean
		{
			return this.isFeatureAvailable(FeatureCode.complexNodeConnections)
				&& this.isReallyComplexBlock
			;
		},
		isReallyComplexBlock(): boolean
		{
			return !NOT_REALLY_COMPLEX_BLOCK.has(this.block.activity.Type);
		},
		reservedInputRules(): Array<TPort | Placeholder>
		{
			return RESERVED_INPUT_RULES_TITLES.map((title) => {
				const port = this.rulePorts.find((p) => p.title === title);
				if (port)
				{
					return port;
				}

				return {
					id: createUniqueId(),
					title,
				};
			});
		},
		restInputRules(): Array<TPort>
		{
			return this.rulePorts.filter((p) => {
				return !RESERVED_INPUT_RULES_TITLES.includes(p.title);
			});
		},
		lastInputRulePlaceholder(): Placeholder
		{
			let lastRule = null;
			if (this.restInputRules.length > 0)
			{
				lastRule = this.restInputRules[this.restInputRules.length - 1];
			}
			else if (this.reservedInputRules[this.reservedInputRules.length - 1].type)
			{
				lastRule = this.reservedInputRules[this.reservedInputRules.length - 1];
			}

			if (!lastRule)
			{
				return null;
			}

			const { label, id } = parsePortTitle(lastRule.title);
			const title = `${label}${id + 1}`;

			return {
				id: createUniqueId(),
				title,
			};
		},
		allInputRules(): Array<TPort | Placeholder>
		{
			if (!this.isReallyComplexBlock)
			{
				return this.rulePorts;
			}

			return this.lastInputRulePlaceholder
				? [...this.reservedInputRules, ...this.restInputRules, this.lastInputRulePlaceholder]
				: [...this.reservedInputRules, ...this.restInputRules];
		},
		relationPlaceholder(): Placeholder
		{
			const lastRelationPort = this.relationPorts[this.relationPorts.length - 1];
			const { label, id } = parsePortTitle(lastRelationPort?.title)
				?? { label: COMPLEX_NODE_PORT_LABELS.relation, id: 0 };
			const title = `${label}${id + 1}`;

			return {
				id: createUniqueId(),
				title,
			};
		},
		reservedOutputRules(): Array<TPort | Placeholder>
		{
			return RESERVED_OUTPUT_RULES_TITLES.map((title) => {
				const port = this.outputPorts.find((p) => p.title === title);
				if (port)
				{
					return port;
				}

				return {
					id: createUniqueId(),
					title,
				};
			});
		},
		restOutputRules(): Array<TPort>
		{
			return this.outputPorts.filter((p) => {
				return !RESERVED_OUTPUT_RULES_TITLES.includes(p.title);
			});
		},
		lastOutputRulePlaceholder(): Placeholder
		{
			let lastRule = null;
			if (this.restOutputRules.length > 0)
			{
				lastRule = this.restOutputRules[this.restOutputRules.length - 1];
			}
			else if (this.reservedOutputRules[this.reservedOutputRules.length - 1].type)
			{
				lastRule = this.reservedOutputRules[this.reservedOutputRules.length - 1];
			}

			if (!lastRule)
			{
				return null;
			}

			const { label, id } = parsePortTitle(lastRule.title);
			const title = `${label}${id + 1}`;

			return {
				id: createUniqueId(),
				title,
			};
		},
		allOutputRules(): Array<TPort | Placeholder>
		{
			if (!this.isReallyComplexBlock)
			{
				return this.outputPorts;
			}

			return this.lastOutputRulePlaceholder
				? [...this.reservedOutputRules, ...this.restOutputRules, this.lastOutputRulePlaceholder]
				: [...this.reservedOutputRules, ...this.restOutputRules];
		},
		ruleTypes(): Array<RuleType>
		{
			return [
				{
					id: 'input-rules',
					items: this.allInputRules,
					label: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_INPUT_TITLE'),
					position: 'left',
				},
				{
					id: 'output-rules',
					items: this.allOutputRules,
					label: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_OUTPUT_TITLE'),
					position: 'right',
					classList: ['--right'],
				},
			];
		},
	},
	watch:
	{
		inputPortsLength(): void
		{
			this.$nextTick(() => {
				this.inputPorts.forEach((port, index) => {
					this.updatePort(this.block.id, port.id, index);
				});
			});
		},
		outputPortsLength(): void
		{
			this.$nextTick(() => {
				this.outputPorts.forEach((port, index) => {
					this.updatePort(this.block.id, port.id, index);
				});
			});
		},
		inputPorts(newInputPorts: Array<TPort>, oldInputPorts: Array<TPort>): void
		{
			if (!this.newConnection)
			{
				return;
			}

			const oldPortsIds = new Set(oldInputPorts.map((port) => port.id));
			const addedPort = newInputPorts.find((port) => !oldPortsIds.has(port.id));
			if (!addedPort)
			{
				return;
			}

			this.addConnection({
				...this.newConnection,
				targetBlockId: this.block.id,
				targetPort: addedPort,
				targetPortId: addedPort.id,
			});
		},
		auxPortsLength(): void
		{
			this.$nextTick(() => {
				this.auxPorts.forEach((port, index) => {
					this.updatePort(this.block.id, port.id, index);
				});
			});
		},
		auxPorts(newAuxPorts: Array<TPort>, oldAuxPorts: Array<TPort>): void
		{
			if (!this.newConnection)
			{
				return;
			}

			const oldPortsIds = new Set(oldAuxPorts.map((port) => port.id));
			const addedPort = newAuxPorts.find((port) => !oldPortsIds.has(port.id));
			if (addedPort)
			{
				this.addConnection(normalyzeAuxConnection({
					...this.newConnection,
					targetBlockId: this.block.id,
					targetPort: addedPort,
					targetPortId: addedPort.id,
				}));
			}
		},
	},
	template: `
		<div :class="blockComplexClassNames">
			<slot
				name="header"
				:title="title"
			/>
			<div class="block-complex__content">
				<div class="block-complex__content_row block-complex__content_rules">
					<div
						v-for="ruleType in ruleTypes"
						:key="ruleType.id"
						class="block-complex__content_col"
						:class="ruleType.classList"
					>
						<span class="block-complex__content_label">
							{{ ruleType.label }}
						</span>
						<div
							v-for="(item, index) in ruleType.items"
							:key="item.id"
							class="block-complex__content_col-value"
						>
							<slot
								:name="item.type ? 'port' : 'portPlaceholder'"
								:item="item"
								:index="index"
								:disabled="disabled"
								:position="ruleType.position"
								:isOutput="ruleType.id === 'output-rules'"
							/>
						</div>
					</div>
				</div>
				<div
					v-if="showRelationSection"
					class="block-complex__content_connections"
				>
					<span class="block-complex__content_label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_CONNECTIONS_TITLE') }}
					</span>
					<div class="block-complex__content_row">
						<div class="block-complex__content_col">
							<div
								v-for="(port, index) in relationPorts"
								:key="port.id"
								class="block-complex__content_col-value"
							>
								<slot
									name="port"
									:item="port"
									:index="index"
									:disabled="disabled"
									position="left"
								/>
							</div>
							<div
								class="block-complex__content_col-value"
								:key="relationPlaceholder.id"
							>
								<slot
									name="portPlaceholder"
									:item="relationPlaceholder"
								/>
							</div>
						</div>
					</div>
				</div>
				<div
					v-if="showAuxSection"
					class="block-complex__aux-section"
				>
					<slot name="auxSectionLabel" />
					<div class="block-complex__aux-ports">
						<div
							v-for="(item, index) in auxPortItems"
							:key="item.id"
							class="block-complex__aux-port-item"
							:class="{ '--inactive': !item.type || item.isActive === false }"
						>
							<BxText
								size='sm'
								class="block-complex__aux-port-title"
							>
								{{ item.title }}
							</BxText>
							<div class="block-complex__aux-port-point">
								<slot
									:name="item.type ? 'auxPort' : 'auxPortPlaceholder'"
									:item="item"
									:index="index"
									:disabled="disabled"
									:isActive="item.isActive !== false"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
};
