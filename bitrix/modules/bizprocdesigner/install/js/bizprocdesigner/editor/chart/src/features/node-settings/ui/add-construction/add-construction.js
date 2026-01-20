import './style.css';

import { MenuManager, type MenuItem } from 'main.popup';
import { BIcon } from 'ui.icon-set.api.vue';
import { mapActions } from 'ui.vue3.pinia';

import { useLoc } from '../../../../shared/composables';

// eslint-disable-next-line no-unused-vars
import { CONSTRUCTION_TYPES, useNodeSettingsStore, type TRuleCard } from '../../../../entities/node-settings';

// @vue/component
export const AddConstruction = {
	name: 'add-construction',
	components: { BIcon },
	props:
	{
		/** @type TRuleCard */
		ruleCard:
		{
			type: [Object, null],
			default: null,
		},
		position:
		{
			type: [Number, undefined],
			default: undefined,
		},
	},
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['addConstruction', 'addRuleCard']),
		onShowMenu(): void
		{
			this.menu = MenuManager.create(
				'constructions-menu',
				this.$refs.constructionsMenu,
				this.getMenuItems(),
				{
					closeByEsc: true,
					autoHide: true,
					cacheable: false,
					offsetLeft: -50,
					offsetTop: 7,
				},
			);
			this.menu.show();
		},
		getMenuItems(): Array<MenuItem>
		{
			// temporary
			const isActionCardExists = (this.ruleCard?.constructions ?? []).some(
				(construction) => construction.type === CONSTRUCTION_TYPES.ACTION,
			);

			return [
				{
					id: CONSTRUCTION_TYPES.AND_CONDITION,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BOOLEAN_MENU_ITEM'),
					onclick: this.onClickMenuItem,
					dataset: { testId: 'complexNodeRuleSettingsMenuItemConstructionAnd' },
					disabled: this.isIfConditionNotExist(this.ruleCard),
				},
				{
					id: CONSTRUCTION_TYPES.IF_CONDITION,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_CONDITION_MENU_ITEM'),
					dataset: { testId: 'complexNodeRuleSettingsMenuItemConstructionIf' },
					onclick: this.onClickMenuItem,
				},
				{
					id: CONSTRUCTION_TYPES.ACTION,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ACTION_MENU_ITEM'),
					dataset: { testId: 'complexNodeRuleSettingsMenuItemConstructionAction' },
					onclick: this.onClickMenuItem,
					disabled: isActionCardExists,
				},
				{
					id: CONSTRUCTION_TYPES.OUTPUT,
					text: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_OUTPUT_MENU_ITEM'),
					dataset: { testId: 'complexNodeRuleSettingsMenuItemConstructionOutput' },
					onclick: this.onClickMenuItem,
				},
			];
		},
		onClickMenuItem(...args): void
		{
			const [, menuItem] = args;
			const ruleCard = this.ruleCard ?? this.addRuleCard();
			this.addConstruction(ruleCard, menuItem.id, this.position);
			this.menu.close();
		},
		isIfConditionNotExist(ruleCard: TRuleCard): boolean
		{
			if (!ruleCard)
			{
				return true;
			}

			return ruleCard.constructions.every((construction) => {
				return construction.type === CONSTRUCTION_TYPES.ACTION;
			});
		},
	},
	template: `
		<div
			class="add-construction"
			@click="onShowMenu"
		>
			<BIcon
				name="plus-m"
				:size="20"
				color="#828b95"
			/>
			<span ref="constructionsMenu">
				<slot>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_CONSTRUCTION_LABEL') }}
				</slot>
			</span>
		</div>
	`,
};
