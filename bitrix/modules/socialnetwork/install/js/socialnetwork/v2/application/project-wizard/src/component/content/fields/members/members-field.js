import { Type } from 'main.core';
import { mapWritableState } from 'ui.vue3.pinia';

import { EntitySelectorEntity } from 'socialnetwork.v2.const';
import { UsersSelector, type Item } from 'socialnetwork.v2.components.selectors.users-selector';
import { useProjectStore } from 'socialnetwork.v2.model.project';
import { UiField } from 'socialnetwork.v2.components.elements.ui-field';

import { InjectionKey } from '../../../../const';

// @vue/component
export const MembersField = {
	name: 'ProjectWizardMembersField',
	components: {
		UiField,
	},
	inject: {
		getWizardBodyContainer: { from: InjectionKey.GetWizardBodyContainer },
	},
	computed: {
		...mapWritableState(useProjectStore, ['members']),
	},
	mounted(): void
	{
		this.selector = this.createSelector();
		this.mountSelector();
	},
	beforeUnmount(): void
	{
		this.destroySelector();
	},
	methods: {
		createSelector(): UsersSelector
		{
			return new UsersSelector({
				context: 'socialnetworkProjectWizardMembers',
				multiple: true,
				preselectedItems: this.getPreselectedMembers(),
				entities: [
					EntitySelectorEntity.Department,
				],
				targetContainer: this.getTargetContainer(),
				onSelect: (userId: number, item: Item) => {
					this.select(item.getId(), item.getEntityId());
				},
				onDeselect: (userId: number, item: Item) => {
					this.deselect(item.getId(), item.getEntityId());
				},
			});
		},
		getTargetContainer(): HTMLElement
		{
			return this.getWizardBodyContainer() ?? document.body;
		},
		getPreselectedMembers(): [$Values<typeof EntitySelectorEntity>, number][]
		{
			return this.members.map((p) => {
				return [p.type, this.boxingDepartmentId(p.id, p.type, p.withChildNodes)];
			});
		},
		mountSelector(): void
		{
			this.selector.renderTo(this.$refs.membersSelector);
		},
		destroySelector(): void
		{
			this.selector.destroy();
			this.selector = null;
		},
		select(id: number | string, type: string): void
		{
			const userId = this.unboxingDepartmentId(id, type);
			const withChildNodes = this.isWithChildNodes(id, type);

			if (this.members.some(
				(p) => (
					p.id === userId
					&& p.type === type
					&& (p.withChildNodes ?? false) === withChildNodes
				),
			))
			{
				return;
			}

			this.members.push({
				id: userId,
				type,
				withChildNodes,
			});
		},
		isWithChildNodes(id: number | string, type: typeof EntitySelectorEntity): boolean
		{
			return type === EntitySelectorEntity.Department && Type.isNumber(id);
		},
		deselect(id: number, type: string): void
		{
			const userId = this.unboxingDepartmentId(id, type);
			const withChildNodes = this.isWithChildNodes(id, type);

			this.members = this.members.filter(
				(p) => !(p.id === userId && p.type === type && (p.withChildNodes ?? false) === withChildNodes),
			);
		},
		boxingDepartmentId(id: number, type: number, withChildNodes: boolean): number | string
		{
			if (type !== EntitySelectorEntity.Department)
			{
				return id;
			}

			return withChildNodes ? id : `${id}:F`;
		},
		unboxingDepartmentId(id: number | string, type: number): number
		{
			return (
				type === EntitySelectorEntity.Department
				&& Type.isStringFilled(id)
				&& id.split(':')?.[1] === 'F'
			)
				? parseInt(id, 10)
				: id;
		},
	},
	template: `
		<UiField
			:label="loc('SONET_EXT_PROJECT_WIZARD_MEMBERS_LABEL')"
			labelFor="sonet-project-wizard-members"
		>
			<div
				ref="membersSelector"
				class="sonet--project-wizard--user-selector-wrapper --none-border-outer-container"
			></div>
		</UiField>
	`,
};
