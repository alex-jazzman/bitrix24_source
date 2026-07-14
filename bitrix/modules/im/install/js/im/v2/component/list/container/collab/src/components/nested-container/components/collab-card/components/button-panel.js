import { type JsonObject } from 'main.core';

import { type ImModelCollabInfo } from 'im.v2.model';
import { CollabEntityType } from 'im.v2.const';

import { createFeatureMenu, type FeatureMenuInstance } from '../helpers/feature-menu.js';
import { CollabCardButton } from './card-button';

type CollabEntityTypeItem = $Values<typeof CollabEntityType>;

type CollabButtonConfig = {
	[CollabEntityTypeItem]: {
		title: string,
		url: string,
		counter: number,
	},
};

// @vue/component
export const CollabCardButtonPanel = {
	name: 'CollabCardButtonPanel',
	components: { CollabCardButton },
	props: {
		parentChatId: {
			type: Number,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			isFeatureMenuLoading: false,
		};
	},
	computed: {
		buttonConfig(): CollabButtonConfig
		{
			const { entities }: ImModelCollabInfo = this.$store.getters['chats/collabs/getByChatId'](this.parentChatId);

			return {
				[CollabEntityType.tasks]: {
					title: this.loc('IM_LIST_CONTAINER_COLLAB_CARD_BUTTON_TASKS'),
					url: entities.tasks.url,
					counter: entities.tasks.counter,
				},
				[CollabEntityType.files]: {
					title: this.loc('IM_LIST_CONTAINER_COLLAB_CARD_BUTTON_FILES'),
					url: entities.files.url,
					counter: entities.files.counter,
				},
				[CollabEntityType.calendar]: {
					title: this.loc('IM_LIST_CONTAINER_COLLAB_CARD_BUTTON_CALENDAR'),
					url: entities.calendar.url,
					counter: entities.calendar.counter,
				},
			};
		},
	},
	methods: {
		async onMoreClick()
		{
			this.isFeatureMenuLoading = true;
			try
			{
				const menu: FeatureMenuInstance = await createFeatureMenu(this.$refs['button-more-container'], this.parentChatId);
				await menu.showFeatures();
			}
			finally
			{
				this.isFeatureMenuLoading = false;
			}
		},
		openEntitySlider(url: string)
		{
			BX.SidePanel.Instance.open(url, {
				cacheable: false,
				customLeftBoundary: 0,
			});
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-nested-list-collab-card__buttons">
			<CollabCardButton
				v-for="({title, counter, url}, type) in buttonConfig"
				:key="type"
				:title="title"
				:counter="counter"
				@click="openEntitySlider(url)"
			/>
			<div ref="button-more-container">
				<CollabCardButton
					:isLoading="isFeatureMenuLoading"
					:title="loc('IM_LIST_CONTAINER_COLLAB_CARD_BUTTON_MORE')"
					:withIcon="true"
					@click="onMoreClick"
				/>
			</div>
		</div>
	`,
};
