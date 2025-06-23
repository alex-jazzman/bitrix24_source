import './style.css';
import { UserListActionMenu } from 'humanresources.company-structure.structure-components';
import { events } from '../../../consts';
import { EventEmitter } from 'main.core.events';
import type { UserData } from 'humanresources.company-structure.utils';

// @vue/component
export const HeadList = {
	name: 'headList',

	components: {
		UserListActionMenu,
	},

	props: {
		items: {
			type: Array,
			required: false,
			default: () => [],
		},
		title: {
			type: String,
			required: false,
			default: '',
		},
		collapsed: {
			type: Boolean,
			required: false,
			default: false,
		},
		type: {
			type: String,
			required: false,
			default: 'head',
		},
		isTeamEntity: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	data(): Object
	{
		return {
			isCollapsed: false,
			isUpdating: true,
			headsVisible: false,
		};
	},

	computed:
	{
		defaultAvatar(): String
		{
			return '/bitrix/js/humanresources/company-structure/org-chart/src/images/default-user.svg';
		},
		dropdownItems(): Array<UserData>
		{
			return this.items.map((item: UserData): UserData => {
				const workPosition = this.getPositionText(item);

				return { ...item, workPosition };
			});
		},
		titleBar(): string
		{
			return this.type === this.userTypes.deputy
				? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_EMPLOYEE_DEPUTY_TITLE')
				: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_EMPLOYEE_HEAD_TITLE')
			;
		},
	},

	created(): void
	{
		this.userTypes = {
			head: 'head',
			deputy: 'deputy',
		};
	},

	methods:
	{
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		handleUserClick(url: string): void
		{
			BX.SidePanel.Instance.open(url, {
				cacheable: false,
			});
		},
		closeHeadList(): void
		{
			if (this.headsVisible) // to prevent double unsubscription
			{
				this.headsVisible = false;
				EventEmitter.unsubscribe(events.HR_DEPARTMENT_MENU_CLOSE, this.closeHeadList);
				EventEmitter.unsubscribe(events.HR_DRAG_DEPARTMENT, this.closeHeadList);
			}
		},
		openHeadList(): void
		{
			if (!this.headsVisible) // to prevent double subscription
			{
				this.headsVisible = true;
				EventEmitter.subscribe(events.HR_DEPARTMENT_MENU_CLOSE, this.closeHeadList);
				EventEmitter.subscribe(events.HR_DRAG_DEPARTMENT, this.closeHeadList);
			}
		},
		getPositionText(item: UserData): string
		{
			return item.workPosition || this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_HEAD_POSITION');
		},
	},

	template: `
		<div v-if="items.length">
			<p v-if="title" class="humanresources-tree__node_employees-title">
				{{ title }}
			</p>
			<div
				class="humanresources-tree__node_head"
				:class="{ '--collapsed': collapsed }"
				v-for="(item, index) in items.slice(0, 2)"
			>
				<img
					:src="item.avatar ? encodeURI(item.avatar) : defaultAvatar"
					class="humanresources-tree__node_avatar --head"
					:class="{ '--collapsed': collapsed }"
					@click.stop="handleUserClick(item.url)"
				/>
				<div class="humanresources-tree__node_head-text">
					<span
						:bx-tooltip-user-id="item.id"
						bx-tooltip-context="b24"
						class="humanresources-tree__node_head-name"
						@click.stop="handleUserClick(item.url)"
					>
						{{ item.name }}
					</span>
					<span v-if="!collapsed" class="humanresources-tree__node_head-position">
						{{ getPositionText(item) }}
					</span>
				</div>
				<span
					v-if="index === 1 && items.length > 2"
					class="humanresources-tree__node_head-rest"
					:class="{ '--active': headsVisible }"
					:data-test-id="'hr-company-structure_org-chart-tree__node-' + type + '-rest'"
					ref="showMoreHeadList"
					@click.stop="openHeadList"
				>
					{{ '+' + String(items.length - 2) }}
				</span>
			</div>
		</div>
		<UserListActionMenu
			v-if="headsVisible"
			:id="type === userTypes.head ? 'head-list-popup-head' : 'head-list-popup-deputy'"
			:items="dropdownItems"
			:width="228"
			:bindElement="$refs.showMoreHeadList[0]"
			@close="closeHeadList"
			:titleBar="titleBar"
		/>
	`,
};
