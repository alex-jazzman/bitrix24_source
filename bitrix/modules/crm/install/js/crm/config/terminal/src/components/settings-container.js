export const SettingsContainer = {
	props: {
		title: String,
		iconStyle: String,
		collapsed: Boolean,
	},
	methods: {
		onTitleClicked()
		{
			this.$emit('titleClick');
		},
	},

	template: `
	<div class="settings-container">
		<button
			type="button"
			class="ui-slider-heading-4 settings-container-title"
			v-bind:class="{ 'settings-container-title-collapsed': collapsed }"
			v-bind:aria-expanded="collapsed ? 'false' : 'true'"
			v-on:click="onTitleClicked"
		>
			<span :class="iconStyle"></span>
			{{ title }}
		</button>

		<div class="settings-section-list" v-bind:class="{ 'settings-section-list-collapsed': collapsed }" v-bind:inert="collapsed">
			<slot></slot>
		</div>
	</div>
	`,
};
