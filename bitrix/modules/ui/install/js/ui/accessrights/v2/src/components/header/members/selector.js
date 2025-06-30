import { Type } from 'main.core';
import { Dialog, type EntityOptions, type Item, type ItemId } from 'ui.entity-selector';
import { mapState } from 'ui.vue3.vuex';
import { EntitySelectorContext } from '../../../integration/entity-selector/dictionary';

export const Selector = {
	name: 'Selector',
	emits: ['close'],
	props: {
		userGroup: {
			/** @type UserGroup */
			type: Object,
			required: true,
		},
		bindNode: {
			type: HTMLElement,
			required: true,
		},
	},
	computed: {
		selectedItems(): ItemId[] {
			const result = [];
			for (const accessCode of this.userGroup.members.keys())
			{
				result.push(this.getItemIdByAccessCode(accessCode));
			}

			return result;
		},
		...mapState({
			options: (state) => state.application.options,
			addUserGroupsProviderTab: (state) => state.application.options.additionalMembersParams.addUserGroupsProviderTab,
			addProjectsProviderTab: (state) => state.application.options.additionalMembersParams.addProjectsProviderTab,
			addStructureTeamsProviderTab: (state) => state.application.options.additionalMembersParams.addStructureTeamsProviderTab,
		}),
	},
	mounted()
	{
		const entities = this.getEntities();

		(new Dialog({
			enableSearch: true,
			context: EntitySelectorContext.MEMBER,
			alwaysShowLabels: true,
			entities,
			targetNode: this.bindNode,
			preselectedItems: this.selectedItems,
			cacheable: false,
			events: {
				'Item:onSelect': this.onMemberAdd,
				'Item:onDeselect': this.onMemberRemove,
				onHide: () => {
					this.$emit('close');
				},
			},
		})).show();
	},
	methods: {
		// eslint-disable-next-line sonarjs/cognitive-complexity
		getItemIdByAccessCode(accessCode: string): ItemId {
			if (/^I?U(\d+)$/.test(accessCode))
			{
				const match = accessCode.match(/^I?U(\d+)$/) || null;
				const userId = match ? match[1] : null;

				return ['user', userId];
			}

			if (/^DR(\d+)$/.test(accessCode))
			{
				const match = accessCode.match(/^DR(\d+)$/) || null;
				const departmentId = match ? match[1] : null;

				return ['department', departmentId];
			}

			if (/^D(\d+)$/.test(accessCode))
			{
				const match = accessCode.match(/^D(\d+)$/) || null;
				const departmentId = match ? match[1] : null;

				return ['department', `${departmentId}:F`];
			}

			if (/^G(\d+)$/.test(accessCode))
			{
				const match = accessCode.match(/^G(\d+)$/) || null;
				const groupId = match ? match[1] : null;

				return ['site-groups', groupId];
			}

			if (accessCode.at(0) === 'A')
			{
				return ['user-groups', accessCode];
			}

			if (/^SG(\d+)_([AEK])$/.test(accessCode))
			{
				return ['project-access-codes', accessCode];
			}

			if (/^SNT(\d+)$/.test(accessCode))
			{
				const match = accessCode.match(/^SNT(\d+)$/) || null;
				const structureNodeId = match ? match[1] : null;

				return ['structure-node', `${structureNodeId}:F`];
			}

			if (/^SNTR(\d+)$/.test(accessCode))
			{
				const match = accessCode.match(/^SNTR(\d+)$/) || null;
				const structureNodeId = match ? match[1] : null;

				return ['structure-node', structureNodeId];
			}

			return ['unknown', accessCode];
		},
		onMemberAdd(event: BaseEvent): void {
			const member = this.getMemberFromEvent(event);

			this.$store.dispatch('userGroups/addMember', {
				userGroupId: this.userGroup.id,
				accessCode: member.id,
				member,
			});
		},
		onMemberRemove(event: BaseEvent): void {
			const member = this.getMemberFromEvent(event);

			this.$store.dispatch('userGroups/removeMember', {
				userGroupId: this.userGroup.id,
				accessCode: member.id,
			});
		},
		getMemberFromEvent(event: BaseEvent): ?Member {
			const { item } = event.getData();

			return {
				id: this.getAccessCodeByItem(item),
				type: this.getMemberTypeByItem(item),
				name: item.title.text,
				avatar: Type.isStringFilled(item.avatar) ? item.avatar : null,
			};
		},
		// eslint-disable-next-line sonarjs/cognitive-complexity
		getAccessCodeByItem(item: Item): string {
			const entityId = item.entityId;

			if (entityId === 'user')
			{
				return `U${item.id}`;
			}

			if (entityId === 'department')
			{
				if (Type.isString(item.id) && item.id.endsWith(':F'))
				{
					const match = item.id.match(/^(\d+):F$/);
					const originalId = match ? match[1] : null;

					// only members of the department itself
					return `D${originalId}`;
				}

				// whole department recursively
				return `DR${item.id}`;
			}

			if (entityId === 'structure-node')
			{
				if (Type.isString(item.id) && item.id.endsWith(':F'))
				{
					const match = item.id.match(/^(\d+):F$/);
					const originalId = match ? match[1] : null;

					return `SNT${originalId}`;
				}

				return `SNTR${item.id}`;
			}

			if (entityId === 'site-groups')
			{
				return `G${item.id}`;
			}

			if (entityId === 'user-groups')
			{
				return item.id;
			}

			if (entityId === 'project-access-codes')
			{
				return item.id;
			}

			return '';
		},
		getMemberTypeByItem(item: Item): string {
			switch (item.entityId)
			{
				case 'user':
					return 'users';
				case 'intranet':
				case 'department':
					return 'departments';
				case 'socnetgroup':
				case 'project-access-codes':
					return 'sonetgroups';
				case 'group':
					return 'groups';
				case 'structure-node':
					return 'structureteams';
				case 'site-groups':
				case 'user-groups':
					return 'usergroups';
				default:
					return '';
			}
		},
		getEntities(): EntityOptions[] {
			const entities: EntityOptions[] = [
				{
					id: 'user',
					options: {
						intranetUsersOnly: true,
						emailUsers: false,
						inviteEmployeeLink: false,
						inviteGuestLink: false,
					},
				},
				{
					id: 'department',
					options: {
						selectMode: 'usersAndDepartments',
						allowSelectRootDepartment: true,
						allowFlatDepartments: true,
					},
				},
				{
					id: 'site-groups',
					dynamicLoad: true,
					dynamicSearch: true,
				},
			];

			if (this.addStructureTeamsProviderTab)
			{
				entities.push({
					id: 'structure-node',
					options: {
						selectMode: 'usersAndDepartments',
						allowSelectRootDepartment: true,
						allowFlatDepartments: true,
						includedNodeEntityTypes: ['team'],
						useMultipleTabs: true,
						visual: {
							avatarMode: 'node',
							tagStyle: 'none',
						},
					},
				});
			}

			if (this.addProjectsProviderTab)
			{
				entities.push({
					id: 'project-access-codes',
				});
			}

			if (this.addUserGroupsProviderTab)
			{
				entities.push({
					id: 'user-groups',
					dynamicLoad: true,
					options: {},
				});
			}

			return entities;
		},
	},
	// just a template stub
	template: '<div hidden></div>',
};
