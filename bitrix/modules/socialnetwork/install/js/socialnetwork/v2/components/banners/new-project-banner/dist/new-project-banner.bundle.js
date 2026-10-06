/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, ui_vue3_components_richLoc, ui_iconSet_api_vue) {
	'use strict';

	const HELPDESK_CODE = '28397818';

	// @vue/component
	const NewProjectBanner = {
		name: 'NewProjectBanner',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			RichLoc: ui_vue3_components_richLoc.RichLoc
		},
		emits: ['close'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		methods: {
			showHelpDesk() {
				top.BX.Helper.show(`redirect=detail&code=${HELPDESK_CODE}`);
			},
			close() {
				this.$emit('close');
			}
		},
		template: `
		<div class="sonet--new-project-banner">
			<div class="sonet--new-project-banner--content">
				<p class="sonet--new-project-banner--title">
					{{ loc('SONET_EXT_NEW_PROJECT_BANNER_TITLE') }}
				</p>
				<div class="sonet--new-project-banner--description">
					<p>
						<RichLoc
							:text="loc('SONET_EXT_NEW_PROJECT_BANNER_DESCRIPTION')"
							:placeholder="['[helpdesklink]', '[nbsp]']"
						>
							<template #helpdesklink="{ text }">
								<button type="button" class="sonet--new-project-banner--link" aria-haspopup="dialog" @click="showHelpDesk">
									{{ text }}
								</button>
							</template>
							<template #nbsp>
								{{ '&nbsp;' }}
							</template>
						</RichLoc>
					</p>
				</div>
			</div>
			<div class="sonet--new-project-banner--close">
				<button
					type="button"
					class="sonet--new-project-banner--close-btn"
					:aria-label="loc('SONET_EXT_NEW_PROJECT_BANNER_CLOSE')"
					@click="close"
				>
					<BIcon :name="Outline.CROSS_L" hoverable/>
				</button>
			</div>
		</div>
	`
	};

	exports.NewProjectBanner = NewProjectBanner;

})(this.BX.Socialnetwork.V2.Components.Banners = this.BX.Socialnetwork.V2.Components.Banners || {}, BX.UI.Vue3.Components, BX.UI.IconSet);
//# sourceMappingURL=new-project-banner.bundle.js.map
