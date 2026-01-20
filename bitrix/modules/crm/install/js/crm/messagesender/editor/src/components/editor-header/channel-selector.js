import { Selector, type SelectorItem } from 'crm.messagesender.channel-selector';
import 'ui.icon-set.outline';
import { Runtime } from 'main.core';
import { Chip } from 'ui.system.chip.vue';
import { mapGetters, mapState } from 'ui.vue3.vuex';
import { type Channel } from '../../editor';
import 'ui.icon-set.social';
import { type PreferencesService } from '../../service/preferences-service';

// @vue/component
export const ChannelSelector = {
	name: 'ChannelSelector',
	components: {
		Chip,
	},
	selector: null,
	computed: {
		...mapGetters({
			/** @type Channel */
			currentChannel: 'channels/current',
			itemsSort: 'preferences/channelsSortOrDefault',
		}),
		...mapState({
			/** @type Channel[] */
			allChannels: (state) => state.channels.collection,
			promoBanners: (state) => state.application.promoBanners,
		}),
		selectorItems(): SelectorItem[]
		{
			return this.allChannels.map((channel: Channel) => {
				return {
					id: channel.id,
					appearance: channel.appearance,
					onclick: (item: SelectorItem) => {
						this.$store.dispatch('channels/setChannel', { channelId: item.id });

						this.$Bitrix.Data.get('locator').getAnalyticsService().onSelectChannel();

						this.selector?.close();
					},
				};
			});
		},
	},
	watch: {
		allChannels(): void
		{
			this.destroySelector();
		},
		promoBanners(): void
		{
			this.destroySelector();
		},
	},
	beforeUnmount()
	{
		this.destroySelector();
	},
	methods: {
		toggleSelector(): void
		{
			if (this.selector?.isShown())
			{
				this.selector.close();

				return;
			}

			this.selector ??= new Selector({
				bindElement: this.$el,
				items: Runtime.clone(this.selectorItems),
				banners: Runtime.clone(this.promoBanners),
				itemsSort: Runtime.clone(this.itemsSort),
				analytics: Runtime.clone(this.$store.state.analytics.analytics),
				events: {
					onSave: (event) => {
						const { itemsSort } = event.getData();

						if (this.isSortChanged(itemsSort))
						{
							this.$Bitrix.Data.get('locator').getAnalyticsService().onSaveChannelsSort();
						}

						this.getPreferencesService().saveChannelsSort(itemsSort);
					},
					onConnectionsSliderClose: () => {
						this.$Bitrix.Data.get('locator').getAnalyticsService().onAddChannelClick();

						this.$Bitrix.eventEmitter.emit('crm:messagesender:editor:onConnectionsSliderClose');
					},
					onPromoBannerSliderClose: (event: BaseEvent) => {
						const { bannerId, connectStatus } = event.getData();
						this.$Bitrix.Data.get('locator').getAnalyticsService().onBannerConnectClick(bannerId, connectStatus);

						this.$Bitrix.eventEmitter.emit('crm:messagesender:editor:onPromoBannerSliderClose');
					},
					onDestroy: () => {
						this.selector = null;
					},
				},
			});

			this.selector.show();
		},
		isSortChanged(newSort: string[]): boolean
		{
			if (newSort.length !== this.itemsSort.length)
			{
				return true;
			}

			return !this.itemsSort.every((channelId, index) => channelId === newSort[index]);
		},
		destroySelector(): void
		{
			this.selector?.destroy();
			this.selector = null;
		},
		getPreferencesService(): PreferencesService
		{
			return this.$Bitrix.Data.get('locator').getPreferencesService();
		},
	},
	template: `
		<Chip
			:icon="currentChannel.appearance.icon.title"
			:iconColor="currentChannel.appearance.icon.color"
			:iconBackground="currentChannel.appearance.icon.background"
			:dropdown="true"
			:text="currentChannel.appearance.title"
			:trimmable="true"
			data-test-role="channel-selector"
			@click="toggleSelector"
		/>
	`,
};
