import './style.css';

import { MenuManager, type MenuItem } from 'main.popup';

import { BIcon } from 'ui.icon-set.api.vue';

import { mapState, mapActions } from 'ui.vue3.pinia';

import { useNodeSettingsStore } from '../../../../entities/node-settings';

import { PORT_TYPES } from '../../../../shared/constants';

// eslint-disable-next-line no-unused-vars
import type { Block } from '../../../../shared/types';

export const SelectRule = {
	name: 'SelectRule',
	components: { BIcon },
	props:
	{
		/** @type Block */
		block:
		{
			type: Object,
			required: true,
		},
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['currentRule', 'ports']),
		currentRuleTitle(): string
		{
			const { title } = this.ports.find((port) => port.id === this.currentRule.id);

			return title;
		},
		menuItems(): Array<MenuItem>
		{
			const ports = this.currentRule.type === PORT_TYPES.input
				? this.ports.filter((port) => port.type === PORT_TYPES.input)
				: this.ports.filter((port) => port.type === PORT_TYPES.inputRelation)
			;

			return ports
				.map((port) => {
					return {
						id: port.id,
						text: port.title,
						dataset: { testId: `menuItemRule-${port.id}` },
						onclick: () => {
							this.setCurrentRule(port);
							this.menu.close();
						},
					};
				});
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['setCurrentRule']),
		onShowMenu(): void
		{
			this.menu = MenuManager.create(
				'constructions-menu',
				this.$refs.nodeSettingsRulesDropdown,
				this.menuItems,
				{
					width: 100,
					maxHeight: 200,
					closeByEsc: true,
					autoHide: true,
					cacheable: false,
				},
			);
			this.menu.show();
		},
	},
	template: `
		<div
			class="editor-chart-node-settings-rules-dropdown"
			ref="nodeSettingsRulesDropdown"
			:data-test-id="$testId('complexNodeRuleSettingsDropdown')"
			@click="onShowMenu"
		>
			<span class="editor-chart-node-settings-rules-dropdown__value">
				{{ currentRuleTitle }}
			</span>
			<BIcon
				:size="14"
				name="chevron-down"
				color="#525C69"
			/>
		</div>
	`,
};
