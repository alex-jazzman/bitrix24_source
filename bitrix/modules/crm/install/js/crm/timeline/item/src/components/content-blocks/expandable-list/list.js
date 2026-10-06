import { FocusNavigator } from 'ui.a11y';
import ListItem from './list-item';

export default {
	props: {
		listItems: {
			type: Array,
			required: true,
			default: [],
		},
		title: {
			type: String,
			required: false,
			default: '',
		},
		showMoreEnabled: {
			type: Boolean,
			required: true,
		},
		showMoreCnt: {
			type: Number,
			required: false,
		},
		showMoreText: {
			type: String,
			required: false,
		},
	},

	data()
	{
		return {
			isShortList: this.showMoreEnabled,
			shortListItemsCnt: this.showMoreCnt,
		};
	},
	components: {
		ListItem,
	},
	methods: {
		handleShowMore()
		{
			this.isShortList = false;

			this.$nextTick(() => {
				const listContainer = this.$el.querySelector('.crm-entity-stream-advice-list');
				const items = listContainer
					? listContainer.querySelectorAll('.crm-entity-stream-advice-list-item')
					: [];
				const firstRevealed = items[this.showMoreCnt] ?? null;

				const moved = firstRevealed ? FocusNavigator.focusFirst(firstRevealed) : null;
				if (moved === null && listContainer)
				{
					FocusNavigator.focusContainer(listContainer);
				}
			});
		},
		isItemVisible(index)
		{
			return !this.isShortList || index < this.showMoreCnt;
		},
	},
	computed: {
		isShowMoreVisible()
		{
			return this.isShortList && this.listItems.length > this.shortListItemsCnt;
		},
		ariaExpanded()
		{
			return String(!this.isShortList);
		},
	},
	// language=Vue
	template: `
		<div>
			<div v-if="title" class="crm-entity-stream-advice-title">
				{{title}}
			</div>
			<transition-group class="crm-entity-stream-advice-list" name="list" tag="ul">
				<ListItem
					v-for="(item, index) in listItems"
					v-show="isItemVisible(index)"
					:key="item.id"
					v-bind="item.properties"
				></ListItem>
			</transition-group>
			<button
				v-if="isShowMoreVisible"
				type="button"
				data-testid="timeline-expandable-list-show-more"
				:aria-expanded="ariaExpanded"
				@click="handleShowMore"
				class="crm-entity-stream-advice-link"
			>
				{{showMoreText}}
			</button>
		</div>
	`
}
