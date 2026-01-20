import { useBlockDiagram, Port } from 'ui.block-diagram';
import { FeatureCode } from 'bizprocdesigner.feature';
// eslint-disable-next-line no-unused-vars
import { validationInputOutputRule, normalyzeInputOutputConnection } from '../../utils';
import { useLoc, useFeature } from '../../../../shared/composables';
import './style.css';
import type { Port as TPort } from '../../../../shared/types';

type BlockComplexSetup = {
	updatePortPosition: () => void;
	getMessage: () => string;
};

// @vue/component
export const BlockComplexContent = {
	name: 'block-complex',
	components: { Port },
	props:
	{
		/** @type Block */
		block:
		{
			type: Object,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(): BlockComplexSetup
	{
		const { updatePortPosition } = useBlockDiagram();
		const { getMessage } = useLoc();
		const { isFeatureAvailable } = useFeature();

		return {
			updatePortPosition,
			getMessage,
			isFeatureAvailable,
			normalyzeInputOutputConnection,
			validationInputOutputRule,
		};
	},
	computed:
	{
		rulePorts(): Array<TPort>
		{
			return this.block.ports.input.filter((port) => !port.isConnectionPort);
		},
		connectionPorts(): Array<TPort>
		{
			return this.block.ports.input.filter((port) => port.isConnectionPort);
		},
		inputPortsLength(): number
		{
			return this.block.ports.input.length;
		},
		outputPortsLength(): number
		{
			return this.block.ports.output.length;
		},
		areConnectionsAvailable(): boolean
		{
			return this.isFeatureAvailable(FeatureCode.complexNodeConnections)
				&& this.connectionPorts.length > 0;
		},
	},
	watch:
	{
		inputPortsLength(): void
		{
			this.$nextTick(() => {
				this.block.ports.input.forEach((port) => {
					this.updatePortPosition(this.block.id, port.id);
				});
			});
		},
		outputPortsLength(): void
		{
			this.$nextTick(() => {
				this.block.ports.output.forEach((port) => {
					this.updatePortPosition(this.block.id, port.id);
				});
			});
		},
	},
	template: `
		<div class="block-complex">
			<slot name="header" />
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
						<slot name="addPortPoint" position="left" />
					</div>
					<div class="block-complex__content_col --right">
						<span class="block-complex__content_label">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BLOCK_RULES_OUTPUT_TITLE') }}
						</span>
						<div
							v-for="port in block.ports.output"
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
						<slot name="addPortPoint" position="right" />
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
							<slot name="addPortPoint" position="left" />
						</div>
						<div class="block-complex__content_col --right">
							<slot name="addPortPoint" position="right" />
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
};
