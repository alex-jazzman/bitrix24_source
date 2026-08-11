import { Runtime } from 'main.core';
import { BaseEvent } from 'main.core.events';
import 'ui.icon-set.outline';
import 'ui.icon-set.social';

import { Selector, type SelectorChannel } from 'messageservice.channel.selector';
import { Chip } from 'ui.system.chip.vue';
import { mapGetters, mapState } from 'ui.vue3.vuex';

import { type Channel, type ChannelPosition } from '../../editor';
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
			channelsSort: 'preferences/channelsSortOrDefault',
		}),
		...mapState({
			/** @type Channel[] */
			allChannels: (state) => state.channels.collection,
			promoBanners: (state) => state.application.promoBanners,
		}),
		selectorChannels(): SelectorChannel[]
		{
			return this.allChannels.map((channel: Channel) => {
				return {
					id: channel.id,
					appearance: channel.appearance,
					onclick: (selected: SelectorChannel) => {
						this.$store.dispatch('channels/setChannel', { channelId: selected.id });
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
				channels: Runtime.clone(this.selectorChannels),
				promoBanners: Runtime.clone(this.promoBanners),
				channelsSort: Runtime.clone(this.channelsSort),
				events: {
					onSave: (event) => {
						const { channelsSort } = event.getData();

						if (this.isSortChanged(channelsSort))
						{
							this.$Bitrix.Data.get('locator').getAnalyticsService().onSaveChannelsSort();
						}

						this.getPreferencesService().saveChannelsSort(channelsSort);
					},
					onBeforeAddChannelOpen: (event: BaseEvent) => {
						this.$Bitrix.Data.get('locator').getAnalyticsService().onAddChannelClick();

						const proxyEvent = new BaseEvent();
						this.$Bitrix.Data.get('locator').getEventEmitter().emit('onBeforeAddChannelOpen', proxyEvent);
						if (proxyEvent.isDefaultPrevented())
						{
							event.preventDefault();
						}
					},
					onAfterAddChannelClose: () => {
						this.$Bitrix.Data.get('locator').getEventEmitter().emit('onAfterAddChannelClose');
					},
					onAfterPromoBannerSliderClose: (event: BaseEvent) => {
						const { banner: { id: bannerId }, connectStatus } = event.getData();
						this.$Bitrix.Data.get('locator').getAnalyticsService().onBannerConnectClick(bannerId, connectStatus);

						this.$Bitrix.Data.get('locator').getEventEmitter().emit('onAfterPromoBannerSliderClose');
					},
					onDestroy: () => {
						this.selector = null;
					},
				},
			});

			this.selector.show();
		},
		isSortChanged(newSort: ChannelPosition[]): boolean
		{
			if (newSort.length !== this.channelsSort.length)
			{
				return true;
			}

			return !this.channelsSort.every((channelPosition: ChannelPosition, index) => {
				return (
					channelPosition.channelId === newSort[index]?.channelId
					&& channelPosition.isHidden === newSort[index]?.isHidden
				);
			});
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
