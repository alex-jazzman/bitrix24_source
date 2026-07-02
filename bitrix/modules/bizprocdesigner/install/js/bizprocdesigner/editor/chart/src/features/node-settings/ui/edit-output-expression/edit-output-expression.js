import './style.css';

import { mapActions, mapState } from 'ui.vue3.pinia';
import { Popup } from 'ui.vue3.components.popup';
import { BIcon } from 'ui.icon-set.api.vue';

import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { useLoc } from '../../../../shared/composables';
import { PORT_TYPES } from '../../../../shared/constants';

import type { Port } from '../../../../shared/types';

const OUTPUT_LABELS = {
	rule: 'E',
	relation: 'NE',
};

// @vue/component
export const EditOutputExpression = {
	name: 'EditOutputExpression',
	components: { BIcon, Popup },
	props:
	{
		/** @type OutputConstruction */
		construction:
		{
			type: Object,
			required: true,
		},
		isScrolling:
		{
			type: Boolean,
			required: true,
		},
	},
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	data(): Object
	{
		return {
			isPopupShown: false,
			allOutputPorts: [],
		};
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['nodeSettings', 'block', 'currentRule']),
		selectedPort:
		{
			get(): string
			{
				const { portId, title } = this.construction.expression;

				return {
					title,
					portId,
				};
			},
			set(output: { portId: string, title: string }): void
			{
				const { portId, title } = output;
				this.changeRuleExpression(this.construction, {
					portId,
					title,
				});
			},
		},
		notSelectedMessage(): string
		{
			return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED');
		},
		popupOptions(): Object
		{
			return {
				id: 'edit-output-expression-popup',
				bindElement: this.$refs.nodeSettingsRuleOutputDropdown,
				minHeight: 100,
				maxHeight: 200,
				padding: 0,
				width: 200,
			};
		},
		portId(): string
		{
			const nextPortNumber = this.allOutputPorts.reduce(
				(acc, currentValue: Port) => Math.max(acc, parseInt(currentValue.portId.slice(1), 10)),
				0,
			) + 1;

			return `o${nextPortNumber}`;
		},
		portTitle(): string
		{
			const lastPort = this.ports[this.ports.length - 1];
			const label = this.portType === PORT_TYPES.output
				? OUTPUT_LABELS.rule
				: OUTPUT_LABELS.relation;
			const num = (lastPort?.title.split(label)[1]) ?? 0;

			return `${label}${Number(num) + 1}`;
		},
		portType(): string
		{
			return this.currentRule.type === PORT_TYPES.input
				? PORT_TYPES.output
				: PORT_TYPES.outputRelation;
		},
		ports(): Array<Port>
		{
			return this.currentRule.type === PORT_TYPES.input
				? this.allOutputPorts.filter((port) => port.type === PORT_TYPES.output)
				: this.allOutputPorts.filter((port) => port.type === PORT_TYPES.outputRelation);
		},
	},
	watch:
	{
		isScrolling(isScrolling: boolean)
		{
			if (isScrolling && this.isPopupShown)
			{
				this.isPopupShown = false;
			}
		},
	},
	created(): void
	{
		this.allOutputPorts = this.block?.ports.reduce((acc, port) => {
			if (port.type === PORT_TYPES.output || port.type === PORT_TYPES.outputRelation)
			{
				acc.push({
					portId: port.id,
					title: port.title,
					type: port.type,
				});
			}

			return acc;
		}, []) ?? [];
		if (this.ports.length === 0)
		{
			this.addNewPort();
		}
	},
	methods: {
		...mapActions(useNodeSettingsStore, ['changeRuleExpression']),
		selectPort(port: Port): void
		{
			this.selectedPort = port;
			this.isPopupShown = false;
		},
		addNewPort(): void
		{
			this.allOutputPorts.push({
				portId: this.portId,
				title: this.portTitle,
				type: this.portType,
			});
		},
		deletePort(portId: string): void
		{
			this.allOutputPorts = this.allOutputPorts.filter((port) => {
				return port.portId !== portId;
			});
			if (portId === this.selectedPort.portId)
			{
				this.selectedPort = {
					portId: null,
					title: null,
				};
			}
		},
		async tryToScrollBottom(): void
		{
			await this.$nextTick();
			const dropDownContent = this.$refs.nodeSettingsRuleOutputDropdownContent;
			const { scrollHeight, clientHeight } = dropDownContent;
			if (scrollHeight > clientHeight)
			{
				dropDownContent.scrollTop = scrollHeight - clientHeight;
			}
		},
		onAddButtonClick(): void
		{
			this.addNewPort();
			this.tryToScrollBottom();
		},
	},
	template: `
		<div class="editor-chart-node-settings-edit-output-expression-form">
			<div class="editor-chart-node-settings-edit-output-expression-form__item">
				<span class="editor-chart-node-settings-edit-output-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_EXPRESSION_NAME') }}
				</span>
				<div class="ui-ctl ui-ctl-textbox">
					<input
						type="text"
						class="ui-ctl-element"
						readonly
						:value="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_OUTPUT_TITLE')"
					/>
				</div>
			</div>
			<div class="editor-chart-node-settings-edit-output-expression-form__item">
				<span class="editor-chart-node-settings-edit-output-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_VALUE') }}
				</span>
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-output-expression-form__dropdown"
					ref="nodeSettingsRuleOutputDropdown"
					@click="isPopupShown = true"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div
						class="ui-ctl-element"
						ref="nodeSettingsRuleOutputDropdownValue"
					>
						{{ selectedPort.title ?? notSelectedMessage }}
					</div>
					<Popup
						v-if="isPopupShown"
						:options="popupOptions"
						@close="isPopupShown = false"
					>
						<div class="editor-chart-node-settings-edit-output-expression-form__dropdown_popup">
							<div
								class="editor-chart-node-settings-edit-output-expression-form__dropdown_popup-content"
								ref="nodeSettingsRuleOutputDropdownContent"
							>
								<div
									v-for="outputPort in ports"
									class="editor-chart-node-settings-edit-output-expression-form__dropdown_popup-item"
									@click="selectPort(outputPort)"
								>
									<span>{{ outputPort.title }}</span>
									<button
										class="ui-btn ui-btn-xss --style-outline-no-accent ui-btn-no-caps --air"
										@click.stop="deletePort(outputPort.portId)"
									>
										{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_OUTPUT_REMOVE') }}
									</button>
								</div>
							</div>
							<div class="editor-chart-node-settings-edit-output-expression-form__dropdown_popup-footer">
								<div
									class="editor-chart-node-settings-edit-output-expression-form__dropdown_popup-footer-content"
									@click="onAddButtonClick"
								>
									<BIcon
										:size="24"
										name="circle-plus"
										color="#0075ff"
										class="editor-chart-node-settings-edit-output-expression-form__dropdown_popup-footer-icon"
									/>
									<span>{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_OUTPUT_ADD') }}</span>
								</div>
							</div>
						</div>
					</Popup>
				</div>
			</div>
		</div>
	`,
};
