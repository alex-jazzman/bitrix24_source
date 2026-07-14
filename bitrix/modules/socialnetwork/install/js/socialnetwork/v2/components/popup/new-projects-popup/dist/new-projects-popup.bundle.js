/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, main_core, ui_vue3, ui_bannerDispatcher, ui_system_typography_vue, ui_iconSet_api_vue, ui_vue3_components_button, socialnetwork_v2_components_elements_uiPopup, socialnetwork_v2_provider_services_promotionService) {
	'use strict';

	// @vue/component
	const NewProjectsPopup = {
		name: 'NewProjectsPopup',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			Text2Xl: ui_system_typography_vue.Text2Xl,
			UiButton: ui_vue3_components_button.Button,
			UiPopup: socialnetwork_v2_components_elements_uiPopup.UiPopup
		},
		emits: ['close'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Loc: main_core.Loc,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				points: [{
					head: main_core.Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_POINT_HEAD_AI'),
					descr: main_core.Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_POINT_DESCR_AI'),
					icon: ui_iconSet_api_vue.Outline.BITRIX_GPT
				}, {
					head: main_core.Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_POINT_HEAD_CHAT'),
					descr: main_core.Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_POINT_DESCR_CHAT'),
					icon: ui_iconSet_api_vue.Outline.CHATS
				}, {
					head: main_core.Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_POINT_HEAD_UNIFIED'),
					descr: main_core.Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_POINT_DESCR_UNIFIED'),
					icon: ui_iconSet_api_vue.Outline.TASK_LIST
				}]
			};
		},
		computed: {
			videoSrc() {
				return '/bitrix/js/socialnetwork/v2/components/popup/new-projects-popup/videos/chats_hexagon-project.webm';
			},
			optionsPopup() {
				return {
					closeIcon: true,
					targetContainer: document.body,
					fixed: true,
					autoHide: true,
					overlay: true,
					className: 'scn-new-projects-popup'
				};
			}
		},
		async mounted() {
			this.$refs.popup.getPopupInstance().adjustPosition();
			await socialnetwork_v2_provider_services_promotionService.promotionService.setNewProjectsPopupViewed();
		},
		methods: {
			handleClosePopup() {
				this.$emit('close');
			},
			handleClickSubmit() {
				this.$refs.popup.getPopupInstance().close();
			}
		},
		template: `
		<UiPopup
			ref="popup"
			id="scn-new-projects-popup"
			:options="optionsPopup"
			@close="handleClosePopup"
		>
			<div class="scn-new-projects-popup__bg"></div>
			<div class="scn-new-projects-popup__content">
				<div class="scn-new-projects-popup__text">
					<p class="scn-new-projects-popup__head">
						<span class="scn-new-projects-popup__head-pre">{{ Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_HEAD_PRE') }}</span>
						<span class="scn-new-projects-popup__head-main">{{ Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_HEAD_MAIN') }}</span>
					</p>
					<ul class="scn-new-projects-popup__points">
						<li
							v-for="point in points"
							class="scn-new-projects-popup__point"
						>
							<div class="scn-new-projects-popup__point-visual">
								<BIcon
									:name="point.icon"
									class="scn-new-projects-popup__point-icon"
								/>
							</div>
							<div class="scn-new-projects-popup__point-text">
								<p class="scn-new-projects-popup__point-head">{{ point.head }}</p>
								<p class="scn-new-projects-popup__point-descr">{{ point.descr }}</p>
							</div>
						</li>
					</ul>
					<UiButton
						:text="Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_SUBMIT')"
						:size="ButtonSize.EXTRA_LARGE"
						:style="AirButtonStyle.MAIN"
						class="scn-new-projects-popup__submit"
						@click="handleClickSubmit"
					/>
				</div>
				<div class="scn-new-projects-popup__visual">
					<ul class="scn-new-projects-popup__tag-list">
						<li class="scn-new-projects-popup__tag-item">
							<p class="scn-new-projects-popup__tag">
								<span class="scn-new-projects-popup__tag-bg"></span>
								<span
									class="scn-new-projects-popup__tag-text"
								>{{ Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_TAG_GROUP_CHATS') }}</span>
							</p>
						</li>
						<li class="scn-new-projects-popup__tag-item">
							<p class="scn-new-projects-popup__tag">
								<span class="scn-new-projects-popup__tag-bg"></span>
								<span
									class="scn-new-projects-popup__tag-text"
								>{{ Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_TAG_COMMON_CHAT') }}</span>
							</p>
						</li>
						<li class="scn-new-projects-popup__tag-item">
							<p class="scn-new-projects-popup__tag">
								<span class="scn-new-projects-popup__tag-bg"></span>
								<span
									class="scn-new-projects-popup__tag-text"
								>{{ Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_TAG_AI') }}</span>
							</p>
						</li>
					</ul>
					<div class="scn-new-projects-popup__visual-video-container">
						<video
							:src="videoSrc"
							class="scn-new-projects-popup__visual-video"
							muted
							autoplay
							loop
							preload
						/>
					</div>
					<div class="scn-new-projects-popup__visual-img-container">
						<div class="scn-new-projects-popup__visual-img"></div>
					</div>
				</div>
			</div>
		</UiPopup>
	`
	};

	const containerId = 'scn-new-projects-popup-mount-container';
	main_core.Event.ready(() => {
		ui_bannerDispatcher.BannerDispatcher.high.toQueue(onDone => {
			if (document.getElementById(containerId)) {
				return;
			}
			const container = document.createElement('div');
			container.id = containerId;
			document.body.appendChild(container);
			ui_vue3.BitrixVue.createApp({
				components: {
					NewProjectsPopup
				},
				template: '<NewProjectsPopup @close="handleClosePopup"/>',
				methods: {
					handleClosePopup() {
						onDone();
						container.remove();
					}
				}
			}).mount(container);
		});
	});

	exports.NewProjectsPopup = NewProjectsPopup;

})(this.BX.Socialnetwork.V2.Components.Popup = this.BX.Socialnetwork.V2.Components.Popup || {}, BX, BX.Vue3, BX.UI, BX.UI.System.Typography.Vue, BX.UI.IconSet, BX.Vue3.Components, BX.Socialnetwork.V2.Components.Elements, BX.Socialnetwork.V2.Provider.Services);
//# sourceMappingURL=new-projects-popup.bundle.js.map
