/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_iconSet_api_vue, ui_vue3, im_v2_const, im_v2_lib_analytics, im_v2_lib_feature, im_v2_lib_layout) {
	'use strict';

	const ICON_NAME = ui_iconSet_api_vue.Outline.SETTINGS_L;
	const SettingsButton = ui_vue3.defineComponent({
		name: 'ImListContainerSettingsButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		computed: {
			ICON_NAME: () => ICON_NAME,
			isAvailable() {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isChatShellNavigationWebAvailable);
			}
		},
		methods: {
			handleClick() {
				im_v2_lib_analytics.Analytics.getInstance().settings.onOpenFromListHeader();
				void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
					name: im_v2_const.Layout.settings
				});
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<button
			v-if="isAvailable"
			type="button"
			class="bx-im-list-container-settings-button__container --focus-visible"
			data-testid="im-list-settings-btn"
			:aria-label="loc('IM_LIST_CONTAINER_SETTINGS_BUTTON_ARIA')"
			@click="handleClick"
		>
			<BIcon
				class="bx-im-list-container-settings-button__icon"
				:name="ICON_NAME"
				:aria-hidden="true"
			/>
		</button>
	`
	});

	exports.SettingsButton = SettingsButton;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.UI.IconSet, BX.Vue3, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=settings-button.bundle.js.map
