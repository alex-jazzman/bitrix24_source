import './style.css';

import { mapActions, mapState } from 'ui.vue3.pinia';
import { Popup } from 'ui.vue3.components.popup';
import { BIcon } from 'ui.icon-set.api.vue';

import { Text } from 'ui.system.typography.vue';

import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { useLoc } from '../../../../shared/composables';
import { PORT_TYPES } from '../../../../shared/constants';

import type { Port } from '../../../../shared/types';

const AUX_PORT_LABEL = 'T';
const MAX_AUX_PORTS = 5;

type AuxPortItem = {
	portId: string,
	title: string,
	type: string,
	isActive: boolean,
};

function parseAuxPortIndex(title: ?string): number
{
	if (!title)
	{
		return Number.MAX_SAFE_INTEGER;
	}

	const parts = title.split(AUX_PORT_LABEL);
	if (parts.length < 2)
	{
		return Number.MAX_SAFE_INTEGER;
	}

	const num = Number(parts[1]);

	return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
}

// @vue/component
export const EditAuxPortSelector = {
	name: 'EditAuxPortSelector',
	components: { BIcon, Popup, BxText: Text },
	props:
	{
		/** @type Construction */
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
	data(): { isPopupShown: boolean, allAuxPorts: Array<AuxPortItem> }
	{
		return {
			isPopupShown: false,
			allAuxPorts: [],
		};
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['nodeSettings', 'block', 'currentRule']),
		selectedPort:
		{
			get(): { portId: ?string, title: ?string }
			{
				const { auxPortId, auxPortTitle } = this.construction.expression;
				let title = auxPortTitle ?? null;

				if (auxPortId && !title)
				{
					const matchedPort = this.auxPorts.find((p) => p.portId === auxPortId);
					title = matchedPort?.title ?? null;
				}

				return {
					portId: auxPortId ?? null,
					title,
				};
			},
			set(port: { portId: ?string, title: ?string }): void
			{
				this.changeRuleExpression(this.construction, {
					auxPortId: port.portId,
					auxPortTitle: port.title,
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
				id: 'edit-aux-port-selector-popup',
				bindElement: this.$refs.auxPortDropdown,
				minHeight: 100,
				maxHeight: 145,
				padding: 0,
				width: 200,
			};
		},
		nextPortId(): string
		{
			const usedNumbers = new Set(
				this.allAuxPorts.map((port) => parseInt(port.portId.slice(1), 10)),
			);

			for (let i = 0; ; i++)
			{
				if (!usedNumbers.has(i))
				{
					return `a${i}`;
				}
			}
		},
		nextPortTitle(): string
		{
			const usedNumbers = new Set(
				this.allAuxPorts.map((port) => {
					const parts = port.title.split(AUX_PORT_LABEL);

					return parts.length > 1 ? Number(parts[1]) : 0;
				}),
			);

			for (let i = 1; ; i++)
			{
				if (!usedNumbers.has(i))
				{
					return `${AUX_PORT_LABEL}${i}`;
				}
			}
		},
		auxPorts(): Array<AuxPortItem>
		{
			return this.allAuxPorts.filter((port) => port.isActive !== false);
		},
		canAddPort(): boolean
		{
			return this.auxPorts.length < MAX_AUX_PORTS;
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
		this.allAuxPorts = this.block.ports.reduce((acc, port: Port) => {
			if (port.type === PORT_TYPES.aux)
			{
				acc.push({
					portId: port.id,
					title: port.title,
					type: port.type,
					isActive: port.isActive !== false,
				});
			}

			return acc;
		}, []);

		this.ensureDefaultPort();
	},
	methods: {
		...mapActions(useNodeSettingsStore, {
			changeRuleExpression: 'changeRuleExpression',
			storeDeletePort: 'deletePort',
			storeActivatePort: 'activatePort',
		}),
		selectPort(port: AuxPortItem): void
		{
			this.selectedPort = { portId: port.portId, title: port.title };
			this.isPopupShown = false;
		},
		ensureDefaultPort(): void
		{
			if (this.auxPorts.length > 0)
			{
				return;
			}

			const inactive = this.allAuxPorts
				.filter((port) => port.isActive === false)
				.sort((a, b) => parseAuxPortIndex(a.title) - parseAuxPortIndex(b.title))[0]
			;

			if (inactive)
			{
				inactive.isActive = true;

				return;
			}

			this.allAuxPorts.push({
				portId: this.nextPortId,
				title: this.nextPortTitle,
				type: PORT_TYPES.aux,
				isActive: true,
			});
		},
		addNewPort(): void
		{
			if (this.auxPorts.length >= MAX_AUX_PORTS)
			{
				return;
			}

			const inactive = this.allAuxPorts
				.filter((port) => port.isActive === false)
				.sort((a, b) => parseAuxPortIndex(a.title) - parseAuxPortIndex(b.title))[0]
			;

			if (inactive)
			{
				inactive.isActive = true;
				this.storeActivatePort(inactive.portId);

				return;
			}

			this.allAuxPorts.push({
				portId: this.nextPortId,
				title: this.nextPortTitle,
				type: PORT_TYPES.aux,
				isActive: true,
			});
		},
		deletePort(portId: string): void
		{
			const targetPort = this.allAuxPorts.find((port) => port.portId === portId);
			if (!targetPort)
			{
				return;
			}

			targetPort.isActive = false;

			if (portId === this.selectedPort.portId)
			{
				this.selectedPort = {
					portId: null,
					title: null,
				};
			}

			this.storeDeletePort(portId);
		},
		async tryToScrollBottom(): void
		{
			await this.$nextTick();
			const dropDownContent = this.$refs.auxPortDropdownContent;
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
		<div class="editor-chart-node-settings-edit-aux-port-selector-form">
			<div class="editor-chart-node-settings-edit-aux-port-selector-form__item">
				<BxText
					size="xs"
					tag="span"
					className="editor-chart-node-settings-edit-aux-port-selector-form__label"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_AUX_PORT_TITLE') }}
				</BxText>
				<div
					class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown editor-chart-node-settings-edit-aux-port-selector-form__dropdown"
					ref="auxPortDropdown"
					@click="isPopupShown = true"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div class="ui-ctl-element">
						{{ selectedPort.title ?? notSelectedMessage }}
					</div>
					<Popup
						v-if="isPopupShown"
						:options="popupOptions"
						@close="isPopupShown = false"
					>
						<div class="editor-chart-node-settings-edit-aux-port-selector-form__dropdown_popup">
							<div
								class="editor-chart-node-settings-edit-aux-port-selector-form__dropdown_popup-content"
								ref="auxPortDropdownContent"
							>
								<div
									v-for="port in auxPorts"
									class="editor-chart-node-settings-edit-aux-port-selector-form__dropdown_popup-item"
									@click="selectPort(port)"
								>
									<BxText size="xs" tag="span">{{ port.title }}</BxText>
									<button
										class="ui-btn ui-btn-xss --style-outline-no-accent ui-btn-no-caps --air"
										@click.stop="deletePort(port.portId)"
									>
										{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_AUX_PORT_REMOVE') }}
									</button>
								</div>
							</div>
							<div v-if="canAddPort" class="editor-chart-node-settings-edit-aux-port-selector-form__dropdown_popup-footer">
								<div
									class="editor-chart-node-settings-edit-aux-port-selector-form__dropdown_popup-footer-content"
									@click="onAddButtonClick"
								>
									<BIcon
										:size="24"
										name="circle-plus"
										color="#0075ff"
										class="editor-chart-node-settings-edit-aux-port-selector-form__dropdown_popup-footer-icon"
									/>
									<BxText size="xs" tag="span">{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_AUX_PORT_ADD') }}</BxText>
								</div>
							</div>
						</div>
					</Popup>
				</div>
			</div>
		</div>
	`,
};
