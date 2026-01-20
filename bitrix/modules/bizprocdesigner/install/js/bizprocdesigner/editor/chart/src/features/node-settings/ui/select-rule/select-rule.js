import './style.css';

import { MenuManager, type MenuItem } from 'main.popup';

import { BIcon } from 'ui.icon-set.api.vue';

import { mapState, mapActions } from 'ui.vue3.pinia';

import { useNodeSettingsStore } from '../../../../entities/node-settings';

// eslint-disable-next-line no-unused-vars
import type { Block } from '../../../../shared/types';

export const SelectRule = {
	name: 'select-rule',
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
		...mapState(useNodeSettingsStore, ['currentRuleId']),
		currentRuleTitle(): string
		{
			const ports = this.block.ports.input;
			const { title } = ports.find((port) => port.id === this.currentRuleId);

			return title;
		},
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['setCurrentRuleId']),
		getMenuItems(): Array<MenuItem>
		{
			return this.block.ports.input.map((port) => {
				return {
					id: port.id,
					text: port.title,
					dataset: { testId: `menuItemRule-${port.id}` },
					onclick: () => {
						this.setCurrentRuleId(port.id);
						this.menu.close();
					},
				};
			});
		},
		onShowMenu(): void
		{
			this.menu = MenuManager.create(
				'constructions-menu',
				this.$refs.nodeSettingsRulesDropdown,
				this.getMenuItems(),
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
			class="node-settings-rules-dropdown"
			ref="nodeSettingsRulesDropdown"
			:data-test-id="$testId('complexNodeRuleSettingsDropdown')"
			@click="onShowMenu"
		>
			<span class="node-settings-rules-dropdown__value">
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
