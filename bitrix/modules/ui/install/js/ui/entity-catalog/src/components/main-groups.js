import { Loc } from 'main.core';
import { GroupList } from './group-list';

import { type GroupData } from '../types/group';

import '../css/main-groups.css';

export const MainGroups = {
	emits: ['groupSelected'],

	name: 'ui-entity-catalog-main-groups',
	components: {
		GroupList,
	},
	props: {
		groups: {
			/** @type Array<Array<GroupData>> */
			type: Array,
			required: true,
		},
		searching: {
			type: Boolean,
			default: false,
		},
		selectedGroup: {
			/** @type GroupData */
			type: Object,
			default: null,
		},
	},
	computed: {
		groupsRegionName(): string
		{
			return Loc.getMessage('UI_JS_ENTITY_CATALOG_GROUPS_ARIA');
		},
		processedGroups()
		{
			const selectedGroupId = this.searching ? null : (this.selectedGroup ? this.selectedGroup.id : null);

			const groupsClone = BX.Runtime.clone(this.groups);

			groupsClone.forEach(groupList => {
				groupList.forEach(group => {
					group.selected = (group.id === selectedGroupId);
				});
			});

			return groupsClone;
		},
		headerLists(): Array<Array<GroupData>>
		{
			return this.processedGroups
				.map(list => list.filter(g => g.isHeaderGroup))
				.filter(list => list.length > 0);
		},
		mainLists(): Array<Array<GroupData>>
		{
			return this.processedGroups
				.map(list => list.filter(g => !g.isHeaderGroup))
				.filter(list => list.length > 0);
		},
	},
	data()
	{
		return { groupsScrollable: false };
	},
	mounted()
	{
		this.updateScrollableRegion();
		this.groupsResizeObserver = new ResizeObserver(() => this.updateScrollableRegion());
		this.groupsResizeObserver.observe(this.$refs.groupsContent);
	},
	updated()
	{
		this.updateScrollableRegion();
	},
	beforeUnmount()
	{
		this.groupsResizeObserver?.disconnect();
	},
	methods: {
		updateScrollableRegion()
		{
			const content = this.$refs.groupsContent;
			this.groupsScrollable = content && content.scrollHeight > content.clientHeight;
		},
		handleGroupSelected(group: GroupData, activatedByKeyboard: boolean = false)
		{
			this.$emit('groupSelected', group, activatedByKeyboard);
		},
		handleGroupUnselected()
		{
			this.$emit('groupSelected', null);
		},
	},
	template: `
		<div class="ui-entity-catalog__main-groups">
			<div class="ui-entity-catalog__main-groups-head">
				<slot name="group-list-header"/>
			</div>
			<div
				class="ui-entity-catalog__header-groups-content"
				v-if="headerLists && headerLists.length"
			>
				<GroupList
					:groups="headerLists"
					@groupSelected="handleGroupSelected"
					@groupUnselected="handleGroupUnselected"
				>
					<template #group="groupSlotProps">
						<slot
							name="group"
							v-bind:groupData="groupSlotProps.groupData"
							v-bind:handleClick="groupSlotProps.handleClick"
						/>
					</template>
				</GroupList>
			</div>
			<div
				class="ui-entity-catalog__main-groups-content"
				data-testid="entity-catalog-groups-region"
				ref="groupsContent"
				role="region"
				:aria-label="groupsRegionName"
				:tabindex="groupsScrollable ? 0 : undefined"
			>
				<GroupList
					:groups="mainLists"
					@groupSelected="handleGroupSelected"
					@groupUnselected="handleGroupUnselected"
				>
					<template #group="groupSlotProps">
						<slot
							name="group"
							v-bind:groupData="groupSlotProps.groupData"
							v-bind:handleClick="groupSlotProps.handleClick"
						/>
					</template>
				</GroupList>
			</div>
			<div class="ui-entity-catalog__main-groups-footer">
				<slot name="group-list-footer"/>
			</div>
		</div>
	`,
};
