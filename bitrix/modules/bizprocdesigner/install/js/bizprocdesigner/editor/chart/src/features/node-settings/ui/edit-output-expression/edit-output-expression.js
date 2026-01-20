import './style.css';

import { mapActions, mapState } from 'ui.vue3.pinia';
import { Popup } from 'ui.vue3.components.popup';
import { BIcon } from 'ui.icon-set.api.vue';

import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { useLoc } from '../../../../shared/composables';

import type { Port } from '../../../../shared/types';

// @vue/component
export const EditOutputExpression = {
	name: 'edit-output-expression',
	components: { BIcon, Popup },
	props:
	{
		/** @type OutputConstruction */
		construction:
		{
			type: Object,
			required: true,
		},
		scrolling:
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
			changedOutputPorts: [],
		};
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['nodeSettings', 'block']),
		savedOutputPorts(): Array
		{
			return this.block?.ports.output.map((port) => ({
				portId: port.id,
				title: port.title,
			})) ?? [];
		},
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
	},
	watch:
	{
		scrolling(scrolling: boolean)
		{
			if (scrolling && this.isPopupShown)
			{
				this.isPopupShown = false;
			}
		},
	},
	created(): void
	{
		this.changedOutputPorts = [...this.savedOutputPorts];
		if (this.changedOutputPorts.length === 0)
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
			const lastPort = this.changedOutputPorts[this.changedOutputPorts.length - 1] ?? null;
			const lastPortIdNumber = lastPort ? parseInt(lastPort.portId.replace('o', ''), 10) : 0;
			this.changedOutputPorts.push({
				portId: `o${lastPortIdNumber + 1}`,
				title: `E${lastPortIdNumber + 1}`,
			});
		},
		deletePort(portId: string): void
		{
			this.changedOutputPorts = this.changedOutputPorts.filter((port) => {
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
		<div class="edit-output-expression-form">
			<div class="edit-output-expression-form__item">
				<span class="edit-output-expression-form__label">
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
			<div class="edit-output-expression-form__item">
				<span class="edit-output-expression-form__label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_VALUE') }}
				</span>
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown edit-output-expression-form__dropdown"
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
						<div class="edit-output-expression-form__dropdown_popup">
							<div
								class="edit-output-expression-form__dropdown_popup-content"
								ref="nodeSettingsRuleOutputDropdownContent"
							>
								<div
									v-for="outputPort in changedOutputPorts"
									class="edit-output-expression-form__dropdown_popup-item"
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
							<div class="edit-output-expression-form__dropdown_popup-footer">
								<div
									class="edit-output-expression-form__dropdown_popup-footer-content"
									@click="onAddButtonClick"
								>
									<BIcon
										:size="24"
										name="circle-plus"
										color="#0075ff"
										class="edit-output-expression-form__dropdown_popup-footer-icon"
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
