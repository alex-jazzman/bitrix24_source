import { DateFormatter, DateTemplate } from 'im.v2.lib.date-formatter';

import { StatusGroup } from 'imopenlines.v2.const';

import { groupByDate, type DateGroup } from '../helpers/group-by-date.js';

import { RecentItem } from './recent-item/recent-item';

// @vue/component
export const RecentDateGroup = {
	name: 'RecentDateGroup',
	components: { RecentItem },
	props: {
		groupItems: {
			type: Array,
			required: true,
		},
		groupName: {
			type: String,
			required: true,
		},
	},
	emits: ['recentClick', 'recentContextMenu'],
	computed: {
		groupTitle(): string
		{
			return this.loc(`IMOL_LIST_STATUS_MESSAGE_${this.groupName.toUpperCase()}`);
		},
		itemsByDate(): DateGroup[]
		{
			const order = this.groupName === StatusGroup.answered ? 'desc' : 'asc';

			return groupByDate(this.groupItems, order).map((group) => ({
				...group,
				title: this.formatDateGroup(group.date),
			}));
		},
	},
	methods: {
		onRecentClick(dialogId: string)
		{
			this.$emit('recentClick', dialogId);
		},
		onContextMenu(dialogId: string, event: PointerEvent)
		{
			this.$emit('recentContextMenu', dialogId, event);
		},
		formatDateGroup(date: Date): string
		{
			return DateFormatter.formatByTemplate(date, DateTemplate.dateGroup);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-imol-list-recent__group-item_container" v-if="groupItems.length !== 0">
			<span
				class="bx-imol-list-recent__group_name"
				:class="'bx-imol-list-recent__group_name_' + groupName.toLowerCase()"
			>
				{{ groupTitle }}
			</span>
			<div v-for="dateGroup in itemsByDate" :key="dateGroup.title">
				<div class="bx-imol-list-recent__date-group_name">{{ dateGroup.title }}</div>
				<RecentItem
					v-for="item in dateGroup.items"
					:item="item"
					:key="item.dialogId"
					@click="onRecentClick(item.dialogId)"
					@contextmenu.prevent="onContextMenu(item.dialogId, $event)"
				/>
			</div>
		</div>
	`,
};
