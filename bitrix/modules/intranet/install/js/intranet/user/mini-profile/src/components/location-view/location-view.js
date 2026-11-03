import { Runtime } from 'main.core';

import { LocMixin } from '../../mixins/loc-mixin';

import './style.css';

const LocationBlockExtension = 'stafftrack.profile-location-block';

export const LocationViewState = Object.freeze({
	Loading: 'loading',
	Drawing: 'drawing',
	Ready: 'ready',
	Empty: 'empty',
	Error: 'error',
});

// @vue/component
export const LocationView = {
	name: 'LocationView',
	mixins: [LocMixin],
	props: {
		userId: {
			type: Number,
			required: true,
		},
	},
	emits: ['render', 'empty'],
	data(): Object
	{
		return {
			state: LocationViewState.Loading,
		};
	},
	computed: {
		isLoading(): boolean
		{
			return this.state === LocationViewState.Loading;
		},
		isError(): boolean
		{
			return this.state === LocationViewState.Error;
		},
		errorText(): ?string
		{
			return this.loc('INTRANET_USER_MINI_PROFILE_LOCATION_LOAD_ERROR');
		},
	},
	mounted(): void
	{
		void this.renderLocationBlock();
	},
	methods: {
		async renderLocationBlock(): Promise<void>
		{
			this.state = await this.drawLocationBlock();

			if (this.state === LocationViewState.Empty)
			{
				this.$emit('empty');
			}

			this.$emit('render');
		},
		async drawLocationBlock(): Promise<string>
		{
			const exports = await Runtime.loadExtension(LocationBlockExtension).catch(() => null);
			const ProfileLocationBlock = exports?.ProfileLocationBlock;
			if (!ProfileLocationBlock)
			{
				return LocationViewState.Error;
			}

			this.state = LocationViewState.Drawing;

			try
			{
				const isDrawn = await new ProfileLocationBlock(this.$el, { employeeId: this.userId }).render();

				return isDrawn ? LocationViewState.Ready : LocationViewState.Empty;
			}
			catch
			{
				return LocationViewState.Error;
			}
		},
	},
	template: `
		<div data-test-id="usermp_location-view">
			<div v-if="isLoading"
				class="intranet-user-mini-profile__location-view-placeholder"
				data-test-id="usermp_location-view-placeholder"
			>
				<div class="intranet-user-mini-profile__location-view-placeholder-title"></div>
				<div class="intranet-user-mini-profile__location-view-placeholder-snapshot"></div>
			</div>
			<div v-if="isError"
				class="intranet-user-mini-profile__location-view-error"
				data-test-id="usermp_location-view-error"
			>{{ errorText }}</div>
		</div>
	`,
};
