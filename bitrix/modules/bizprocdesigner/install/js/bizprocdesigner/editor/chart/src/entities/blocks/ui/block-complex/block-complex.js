import { useBlockDiagram } from 'ui.block-diagram';
import { FeatureCode } from 'bizprocdesigner.feature';
import { useLoc, useFeature } from '../../../../shared/composables';
import { PORT_TYPES, COMPLEX_NODE_PORT_LABELS } from '../../../../shared/constants';
import { createUniqueId, parsePortTitle } from '../../../../shared/utils';

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

// @vue/component
export const BlockComplexContent = {
	name: 'BlockComplexContent',
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
		inputPorts(): Array<TPort>
		{
			return this.ports
				.filter((port) => port.type === PORT_TYPES.input);
		},
		outputPorts(): Array<TPort>
		{
			return this.ports
				.filter((port) => port.type === PORT_TYPES.output);
		},
		rulePorts(): Array<TPort>
		{
			return this.inputPorts.filter((port) => !port.isConnectionPort);
		},
		connectionPorts(): Array<TPort>
		{
			return this.inputPorts.filter((port) => port.isConnectionPort);
		},
		inputPortsLength(): number
		{
			return this.inputPorts.length;
		},
		outputPortsLength(): number
		{
			return this.outputPorts.length;
		},
		areConnectionsAvailable(): boolean
		{
			return this.isFeatureAvailable(FeatureCode.complexNodeConnections)
				&& this.isReallyComplexBlock;
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
		connectionPlaceholder(): Placeholder
		{
			const connection = this.connectionPorts[this.connectionPorts.length - 1];
			const { label, id } = parsePortTitle(connection?.title) ?? { label: COMPLEX_NODE_PORT_LABELS.connection, id: 0 };
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
	},
	template: `
		<div class="block-complex">
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
					v-if="areConnectionsAvailable"
					class="block-complex__content_connections"
				>
					<span class="block-complex__content_label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_CONNECTIONS_TITLE') }}
					</span>
					<div class="block-complex__content_row">
						<div class="block-complex__content_col">
							<div
								v-for="(port, index) in connectionPorts"
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
								:key="connectionPlaceholder.id"
							>
								<slot
									name="portPlaceholder"
									:item="connectionPlaceholder"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
};
