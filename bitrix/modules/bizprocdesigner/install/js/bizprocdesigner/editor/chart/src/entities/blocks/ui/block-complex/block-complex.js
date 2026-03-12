import { useBlockDiagram, Port } from 'ui.block-diagram';
import { FeatureCode } from 'bizprocdesigner.feature';
import { validationInputOutputRule, normalyzeInputOutputConnection } from '../../utils';
import { useLoc, useFeature } from '../../../../shared/composables';
import { PORT_TYPES } from '../../../../shared/constants';

import './style.css';

import type { Port as TPort } from '../../../../shared/types';

const NOT_REALLY_COMPLEX_BLOCK = new Set(['ForEachActivity', 'IfElseBranchActivity']);

type BlockComplexSetup = {
	updatePortPosition: () => void;
	getMessage: () => string;
};

// @vue/component
export const BlockComplexContent = {
	name: 'BlockComplexContent',
	components: { Port },
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
		const { updatePortPosition, newConnection } = useBlockDiagram();
		const { getMessage } = useLoc();
		const { isFeatureAvailable } = useFeature();

		return {
			updatePortPosition,
			newConnection,
			getMessage,
			isFeatureAvailable,
			normalyzeInputOutputConnection,
			validationInputOutputRule,
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
				&& this.connectionPorts.length > 0;
		},
		isReallyComplexBlock(): boolean
		{
			return !NOT_REALLY_COMPLEX_BLOCK.has(this.block.activity.Type);
		},
	},
	watch:
	{
		inputPortsLength(): void
		{
			this.$nextTick(() => {
				this.inputPorts.forEach((port) => {
					this.updatePortPosition(this.block.id, port.id);
				});
			});
		},
		outputPortsLength(): void
		{
			this.$nextTick(() => {
				this.outputPorts.forEach((port) => {
					this.updatePortPosition(this.block.id, port.id);
				});
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
					<div class="block-complex__content_col">
						<span class="block-complex__content_label">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_INPUT_TITLE') }}
						</span>
						<div
							v-for="port in rulePorts"
							:key="port.id"
							class="block-complex__content_col-value"
						>
							<Port
								:block="block"
								:port="port"
								:disabled="disabled"
								:validationRules="[validationInputOutputRule]"
								:normalyzeConnectionFn="normalyzeInputOutputConnection"
								position="left"
							/>
							<span class="block-complex__content_col-value-text">{{ port.title }}</span>
						</div>
						<div class="block-complex__content_col-value">
							<slot
								v-if="isReallyComplexBlock"
								name="portPlaceholder"
								:ports="rulePorts"
							/>
						</div>
					</div>
					<div class="block-complex__content_col --right">
						<span class="block-complex__content_label">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_OUTPUT_TITLE') }}
						</span>
						<div
							v-for="port in outputPorts"
							:key="port.id"
							class="block-complex__content_col-value"
						>
							<span class="block-complex__content_col-value-text">{{ port.title }}</span>
							<Port
								:block="block"
								:port="port"
								:disabled="disabled"
								:validationRules="[validationInputOutputRule]"
								:normalyzeConnectionFn="normalyzeInputOutputConnection"
								position="right"
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
								v-for="port in connectionPorts"
								:key="port.id"
								class="block-complex__content_col-value"
							>
								<Port
									:block="block"
									:port="port"
									:disabled="disabled"
									position="left"
								/>
								<span class="block-complex__content_col-value-text">{{ port.title }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
};
