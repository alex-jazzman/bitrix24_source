import { Text, Type } from 'main.core';
import { type ItemOptions } from 'ui.entity-selector';
import { mapState, mapWritableState } from 'ui.vue3.pinia';

import { Core } from 'socialnetwork.v2.core';
import { EntitySelectorEntity, ProjectMemberType, StructureNodeEntityType } from 'socialnetwork.v2.const';
import {
	UsersSelector,
	type Item,
	type UsersSelectorOptions,
} from 'socialnetwork.v2.components.selectors.users-selector';
import { useProjectStore } from 'socialnetwork.v2.model.project';
import { useInterfaceStore } from 'socialnetwork.v2.model.interface';
import { UiField } from 'socialnetwork.v2.components.elements.ui-field';

import { InjectionKey } from '../../../../const';
import {
	isValidDepartmentSelectorItem,
	mapItemToProjectMember,
	mapProjectMemberToItemOptions,
} from '../user-selector-item';

// selector encodes the scope of an org structure node in its id: the suffix means employees only
const FLAT_NODE_SUFFIX = ':F';

// the org structure provider reports the type of a node in the custom data of its item
const NODE_ENTITY_TYPE_KEY = 'nodeEntityType';

// selector entities and member types are independent contracts, so every pair is spelled out here
const MEMBER_TYPE_BY_ENTITY_ID = new Map([
	[EntitySelectorEntity.User, ProjectMemberType.User],
	[EntitySelectorEntity.Department, ProjectMemberType.Department],
]);

const ENTITY_ID_BY_MEMBER_TYPE = new Map([
	[ProjectMemberType.User, EntitySelectorEntity.User],
	[ProjectMemberType.Department, EntitySelectorEntity.Department],
	[ProjectMemberType.Team, EntitySelectorEntity.StructureNode],
]);

const MEMBER_TYPE_BY_NODE_ENTITY_TYPE = new Map([
	[StructureNodeEntityType.Department, ProjectMemberType.Department],
	[StructureNodeEntityType.Team, ProjectMemberType.Team],
]);

type Member = {
	id: number,
	type: string,
	withChildNodes: ?boolean,
	name?: ?string,
	image?: ?{ src?: ?string },
	selectorItem?: ItemOptions,
};

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
		...mapState(useInterfaceStore, ['isActionUpdate']),
		inputId(): string
		{
			return 'sonet-project-wizard-members';
		},
		inputLabel(): string
		{
			return this.loc('SONET_EXT_PROJECT_WIZARD_MEMBERS_LABEL');
		},
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
			return new UsersSelector(this.getSelectorOptions());
		},
		getSelectorOptions(): UsersSelectorOptions
		{
			return {
				context: 'socialnetworkProjectWizardMembers',
				multiple: true,
				preselectedItems: this.getPreselectedMembers(),
				selectedItems: this.getSelectedMembers(),
				entities: [
					EntitySelectorEntity.Department,
					EntitySelectorEntity.StructureNode,
				],
				isTeamsAvailable: this.isTeamsAvailable(),
				intranetUsersOnly: !this.isActionUpdate && Core.getSettings().isExtranetConfigured === false,
				targetContainer: this.getTargetContainer(),
				inputId: this.inputId,
				inputLabel: this.inputLabel,
				// UiField builds the id of its label from labelFor, so both sides stay in step
				ariaLabelledBy: `${this.inputId}-label`,
				onSelect: (userId: number, item: Item) => {
					this.select(item.getId(), item.getEntityId(), this.getNodeEntityType(item), item);
				},
				onDeselect: (userId: number, item: Item) => {
					this.deselect(item.getId(), item.getEntityId(), this.getNodeEntityType(item));
				},
			};
		},
		isTeamsAvailable(): boolean
		{
			return Core.getSettings().isTeamsAvailable === true;
		},
		getTargetContainer(): HTMLElement
		{
			return this.getWizardBodyContainer() ?? document.body;
		},
		getPreselectedMembers(): [string, number | string][]
		{
			return this.members
				.filter((member) => !this.isRenderedFromStore(member))
				.map((member) => {
					return [this.getEntityId(member.type), this.packMemberId(member)];
				});
		},
		getSelectedMembers(): ItemOptions[]
		{
			return this.members
				.filter((member) => this.isRenderedFromStore(member))
				.map((member) => mapProjectMemberToItemOptions(member));
		},
		// a team never carries a selector item of its own, so the org structure provider resolves it
		isRenderedFromStore(member: Member): boolean
		{
			return member.type === ProjectMemberType.User || isValidDepartmentSelectorItem(member);
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
		select(value: number | string, entityId: string, nodeEntityType: ?string, item: ?Item = null): void
		{
			const member = this.unpackMember(value, entityId, nodeEntityType, item);

			if (this.members.some((current) => this.isSameMember(current, member)))
			{
				return;
			}

			this.members.push(member);
		},
		deselect(value: number | string, entityId: string, nodeEntityType: ?string): void
		{
			const member = this.unpackMember(value, entityId, nodeEntityType);

			this.members = this.members.filter((current) => !this.isSameMember(current, member));
		},
		packMemberId(member: Member): number | string
		{
			if (member.type === ProjectMemberType.User)
			{
				return member.id;
			}

			return member.withChildNodes ? member.id : `${member.id}${FLAT_NODE_SUFFIX}`;
		},
		unpackMember(
			value: number | string,
			entityId: string,
			nodeEntityType: ?string,
			item: ?Item = null,
		): Member
		{
			const type = this.getMemberType(entityId, nodeEntityType);
			const isNode = type !== ProjectMemberType.User;
			const isFlatNode = Type.isStringFilled(value) && value.endsWith(FLAT_NODE_SUFFIX);

			return {
				id: isNode ? Text.toInteger(value) : value,
				type,
				withChildNodes: isNode ? !isFlatNode : false,
				...(item === null ? {} : this.getDisplayData(item)),
			};
		},
		// what the selector already showed, so a remount rebuilds the tag without asking the provider
		getDisplayData(item: Item): Object
		{
			const { name, image, selectorItem } = mapItemToProjectMember(item);

			return {
				name,
				image,
				...(selectorItem ? { selectorItem } : {}),
			};
		},
		isSameMember(member: Member, other: Member): boolean
		{
			return member.id === other.id
				&& member.type === other.type
				&& (member.withChildNodes ?? false) === (other.withChildNodes ?? false);
		},
		getNodeEntityType(item: Item): ?string
		{
			return item.getCustomData?.().get(NODE_ENTITY_TYPE_KEY) ?? null;
		},
		getMemberType(entityId: string, nodeEntityType: ?string): string
		{
			if (entityId === EntitySelectorEntity.StructureNode)
			{
				// teams are the only node type this step asks the provider for
				return MEMBER_TYPE_BY_NODE_ENTITY_TYPE.get(nodeEntityType) ?? ProjectMemberType.Team;
			}

			return MEMBER_TYPE_BY_ENTITY_ID.get(entityId) ?? entityId;
		},
		getEntityId(memberType: string): string
		{
			return ENTITY_ID_BY_MEMBER_TYPE.get(memberType) ?? memberType;
		},
	},
	template: `
		<UiField
			data-testid="project-wizard-members-field"
			:label="inputLabel"
			:labelFor="inputId"
		>
			<div
				ref="membersSelector"
				data-testid="socialnetwork-project-wizard-members"
				class="sonet--project-wizard--user-selector-wrapper --none-border-outer-container"
			></div>
		</UiField>
	`,
};
