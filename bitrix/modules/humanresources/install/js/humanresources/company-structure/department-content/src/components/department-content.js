import { EntityTypes } from 'humanresources.company-structure.utils';
import { UsersTab } from './users/tab';
import { ChatsTab } from './chats/tab';
import { useChartStore } from 'humanresources.company-structure.chart-store';
import { mapState } from 'ui.vue3.pinia';

import '../style.css';

// @vue/component
export const DepartmentContent = {
	name: 'departmentContent',

	components: { UsersTab, ChatsTab },

	props: {
		isCollapsed: Boolean,
	},

	emits: ['showDetailLoader', 'hideDetailLoader', 'editEmployee'],

	data(): Object
	{
		return {
			activeTab: 'usersTab',
			tabs: [
				{ name: 'usersTab', component: 'UsersTab', id: 'users-tab' },
				{ name: 'chatsTab', component: 'ChatsTab', id: 'chats-tab' },
			],
			isDescriptionOverflowed: false,
			isDescriptionExpanded: false,
		};
	},

	computed: {
		...mapState(useChartStore, ['focusedNode', 'departments']),
		activeTabComponent(): UsersTab | ChatsTab | null
		{
			const activeTab = this.tabs.find((tab) => tab.name === this.activeTab);

			return activeTab ? activeTab.component : null;
		},
		usersCount(): Number
		{
			return this.departments.get(this.focusedNode)?.userCount ?? 0;
		},
		chatAndChannelsCount(): Number
		{
			return this.departments.get(this.focusedNode)?.chatAndChannelsCount ?? null;
		},
		tabArray(): Array
		{
			return this.tabs.map((tab) => {
				if (tab.name === 'usersTab')
				{
					return {
						...tab,
						count: this.usersCount,
					};
				}

				if (tab.name === 'chatsTab')
				{
					return {
						...tab,
						count: this.chatAndChannelsCount,
					};
				}

				return tab;
			});
		},
		description(): ?string
		{
			const department = this.departments.get(this.focusedNode);
			if (!department.description)
			{
				return null;
			}

			return department.description;
		},
	},

	watch: {
		description(): void
		{
			this.$nextTick(() => {
				this.isDescriptionOverflowed = this.checkDescriptionOverflowed();
			});
		},
		focusedNode(): void
		{
			this.isDescriptionExpanded = false;
			this.selectTab('usersTab');
		},
		isCollapsed(): void
		{
			this.$nextTick(() => {
				this.isDescriptionOverflowed = this.checkDescriptionOverflowed();
			});
		},
	},

	methods:
	{
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		selectTab(tabName): void
		{
			this.activeTab = tabName;
		},
		getTabLabel(name: string): string
		{
			if (name === 'usersTab')
			{
				return this.departments.get(this.focusedNode)?.entityType === EntityTypes.team
					? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_TEAM_USERS_TITLE')
					: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_TITLE');
			}

			if (name === 'chatsTab')
			{
				return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_TITLE');
			}

			return '';
		},
		toggleDescriptionExpand(): void
		{
			this.isDescriptionExpanded = !this.isDescriptionExpanded;
		},
		checkDescriptionOverflowed(): boolean
		{
			const descriptionContainer = this.$refs.descriptionContainer ?? null;
			if (descriptionContainer)
			{
				return descriptionContainer.scrollHeight > descriptionContainer.clientHeight;
			}

			return false;
		},
		hideDetailLoader(): void
		{
			this.$emit('hideDetailLoader');
			this.$nextTick(() => {
				this.isDescriptionOverflowed = this.checkDescriptionOverflowed();
			});
		},
	},

	template: `
		<div class="hr-department-detail-content hr-department-detail-content__scope">
			<div
				ref="descriptionContainer"
				v-show="description"
				:class="[
					'hr-department-detail-content-description',
					{ '--expanded': isDescriptionExpanded },
					{ '--overflowed': isDescriptionOverflowed},
				]"
				v-on="isDescriptionOverflowed ? { click: toggleDescriptionExpand } : {}"
			>
				{{ description }}
			</div>
			<div class="hr-department-detail-content__tab-list">
				<button
					v-for="tab in tabArray"
					:key="tab.name"
					class="hr-department-detail-content__tab-item"
					:class="[{'--active-tab' : activeTab === tab.name}]"
					@click="selectTab(tab.name)"
					:data-id="tab.id ? 'hr-department-detail-content__' + tab.id + '_button' : null"
				>
					{{ this.getTabLabel(tab.name) }}
					<span
						class="hr-department-detail-content__tab-count"
						:data-id="tab.id ? 'hr-department-detail-content__' + tab.id + '_counter' : null"
					>{{ tab.count }}
					</span>
				</button>
			</div>
			<component
				v-if="activeTab === 'usersTab'"
				:is="activeTabComponent"
				@showDetailLoader="$emit('showDetailLoader')"
				@hideDetailLoader="hideDetailLoader"
			/>
			<component
				v-if="activeTab === 'chatsTab'"
				:is="activeTabComponent"
				@showDetailLoader="$emit('showDetailLoader')"
				@hideDetailLoader="hideDetailLoader"
			/>
		</div>
	`,
};
