/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, main_core, ui_vue3, ui_system_typography_vue, ui_vue3_components_richLoc, ui_iconSet_api_vue, ui_iconSet_outline, ui_vue3_components_button, socialnetwork_v2_components_elements_uiPopup, main_date) {
	'use strict';

	class TrialStateService {
		async getTrialState() {
			try {
				const response = await main_core.ajax.runAction('socialnetwork.api.workgroup.getProjectsTrialState');
				return response.data;
			} catch (error) {
				console.error(error);
				return null;
			}
		}
	}
	const trialStateService = new TrialStateService();
	function getTrialEndDateLabel(trialState) {
		if (!trialState?.isActive || !main_core.Type.isNumber(trialState.endTs)) {
			return null;
		}
		const formattedDate = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('LONG_DATE_FORMAT'), trialState.endTs);
		return main_core.Loc.getMessage('SOCNET_POPUP_PROJECTS_TRIAL_END_DATE', {
			'#DATE#': formattedDate
		}) ?? null;
	}

	const settings$1 = main_core.Extension.getSettings('socialnetwork.v2.components.popup.projects-trial-banner');
	const ASSETS_BASE_URL = settings$1.assetsPath ?? '';
	const ART_VISIBLE_MEDIA_QUERY = '(min-width: 1081px)';
	function getArtMediaQuery() {
		if (!main_core.Type.isFunction(window.matchMedia)) {
			return null;
		}
		return window.matchMedia(ART_VISIBLE_MEDIA_QUERY);
	}
	const ProjectsTrialBanner = ui_vue3.defineComponent({
		name: 'SocialnetworkProjectsTrialBanner',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			RichLoc: ui_vue3_components_richLoc.RichLoc,
			Text2Xl: ui_system_typography_vue.Text2Xl,
			TextXl: ui_system_typography_vue.TextXl,
			UiButton: ui_vue3_components_button.Button,
			UiPopup: socialnetwork_v2_components_elements_uiPopup.UiPopup
		},
		props: {
			trialState: {
				type: Object,
				default: null
			},
			trialDays: {
				type: Number,
				default: 0
			},
			copilotName: {
				type: String,
				default: 'BitrixGPT'
			},
			isChinaZone: {
				type: Boolean,
				default: false
			}
		},
		emits: ['close'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Loc: main_core.Loc
			};
		},
		data() {
			const mediaQuery = getArtMediaQuery();
			return {
				isArtVisible: mediaQuery ? mediaQuery.matches : true,
				artMediaQuery: mediaQuery ? ui_vue3.markRaw(mediaQuery) : null,
				videoElement: null,
				videoLoadedHandler: null
			};
		},
		computed: {
			descText() {
				const key = this.isChinaZone ? 'SOCNET_POPUP_PROJECTS_TRIAL_DESC_CN' : 'SOCNET_POPUP_PROJECTS_TRIAL_DESC';
				return main_core.Loc.getMessage(key) ?? '';
			},
			features() {
				const teamKey = this.isChinaZone ? 'SOCNET_POPUP_PROJECTS_TRIAL_FEATURE_TEAM_CN' : 'SOCNET_POPUP_PROJECTS_TRIAL_FEATURE_TEAM';
				const aiFeature = this.isChinaZone ? {
					icon: ui_iconSet_api_vue.Outline.ADD_PERSON,
					text: main_core.Loc.getMessage('SOCNET_POPUP_PROJECTS_TRIAL_FEATURE_AI_CN') ?? ''
				} : {
					icon: ui_iconSet_api_vue.Outline.AI_STARS,
					text: main_core.Loc.getMessage('SOCNET_POPUP_PROJECTS_TRIAL_FEATURE_AI', {
						'#COPILOT_NAME#': this.copilotName
					}) ?? ''
				};
				return [{
					icon: ui_iconSet_api_vue.Outline.COLLAB,
					text: main_core.Loc.getMessage('SOCNET_POPUP_PROJECTS_TRIAL_FEATURE_PROJECT') ?? ''
				}, {
					icon: ui_iconSet_api_vue.Outline.GROUP,
					text: main_core.Loc.getMessage(teamKey) ?? ''
				}, aiFeature];
			},
			tags() {
				const aiTagKey = this.isChinaZone ? 'SOCNET_POPUP_PROJECTS_TRIAL_TAG_AI_CN' : 'SOCNET_POPUP_PROJECTS_TRIAL_TAG_AI';
				return [main_core.Loc.getMessage('SOCNET_POPUP_PROJECTS_TRIAL_TAG_GROUP_CHATS') ?? '', main_core.Loc.getMessage('SOCNET_POPUP_PROJECTS_TRIAL_TAG_COMMON_CHAT') ?? '', main_core.Loc.getMessage(aiTagKey) ?? ''];
			},
			titleText() {
				return main_core.Loc.getMessage('SOCNET_POPUP_PROJECTS_TRIAL_TITLE', {
					'#DAYS#': String(this.trialDays)
				}) ?? '';
			},
			endDateLabel() {
				return getTrialEndDateLabel(this.trialState);
			},
			featureIconColor() {
				return 'var(--ui-color-accent-main-primary)';
			},
			bgSrc() {
				return `${ASSETS_BASE_URL}/images/bg.png`;
			},
			characterSrc() {
				return `${ASSETS_BASE_URL}/images/zephyr.png`;
			},
			videoSrc() {
				return `${ASSETS_BASE_URL}/videos/projects-trial.mp4`;
			},
			popupOptions() {
				return {
					closeIcon: true,
					targetContainer: document.body,
					fixed: true,
					autoHide: true,
					closeByEsc: true,
					overlay: true,
					className: 'scn-projects-trial-banner'
				};
			}
		},
		watch: {
			isArtVisible(visible) {
				if (visible) {
					this.$nextTick(() => {
						this.initVideoPlayback();
					});
					return;
				}
				this.stopVideoPlayback();
			}
		},
		created() {
			if (this.artMediaQuery) {
				this.artMediaQuery.addEventListener('change', this.handleArtMediaChange);
			}
		},
		mounted() {
			this.getPopupInstance().adjustPosition();
			if (this.isArtVisible) {
				this.initVideoPlayback();
			}
		},
		beforeUnmount() {
			this.stopVideoPlayback();
			if (this.artMediaQuery) {
				this.artMediaQuery.removeEventListener('change', this.handleArtMediaChange);
			}
		},
		methods: {
			getPopupInstance() {
				return this.$refs.popup.getPopupInstance();
			},
			handleArtMediaChange(event) {
				this.isArtVisible = event.matches;
			},
			initVideoPlayback() {
				const video = this.$refs.video;
				if (!video) {
					return;
				}
				this.stopVideoPlayback();
				const handler = () => {
					video.play().catch(() => {});
				};
				this.videoElement = ui_vue3.markRaw(video);
				this.videoLoadedHandler = handler;
				main_core.Event.bind(video, 'loadeddata', handler);
				video.play()?.catch(() => {});
			},
			stopVideoPlayback() {
				if (this.videoElement && this.videoLoadedHandler) {
					main_core.Event.unbind(this.videoElement, 'loadeddata', this.videoLoadedHandler);
				}
				this.videoElement = null;
				this.videoLoadedHandler = null;
			},
			handleClosePopup() {
				this.$emit('close');
			},
			handleClickSubmit() {
				this.getPopupInstance().close();
			}
		},
		template: `
		<UiPopup
			ref="popup"
			id="scn-projects-trial-banner"
			:options="popupOptions"
			@close="handleClosePopup"
		>
			<div class="scn-projects-trial-banner__card" data-testid="projects-demo-mode-banner-card">
				<div class="scn-projects-trial-banner__content" data-testid="projects-demo-mode-banner-content">
					<h2 class="scn-projects-trial-banner__title" data-testid="projects-demo-mode-banner-title">
						<RichLoc :text="titleText" placeholder="[accent]" tag="span">
							<template #accent="{ text }">
								<span class="scn-projects-trial-banner__title-accent">{{ text }}</span>
							</template>
						</RichLoc>
					</h2>
					<TextXl
						v-if="endDateLabel"
						tag="p"
						className="scn-projects-trial-banner__date"
						data-testid="projects-demo-mode-banner-date"
					>{{ endDateLabel }}</TextXl>
					<Text2Xl
						tag="p"
						className="scn-projects-trial-banner__desc"
						data-testid="projects-demo-mode-banner-desc"
					>{{ descText }}</Text2Xl>
					<ul class="scn-projects-trial-banner__feature-list" data-testid="projects-demo-mode-banner-feature-list">
						<li
							v-for="(feature, index) in features"
							:key="feature.icon"
							class="scn-projects-trial-banner__feature"
							:data-testid="'projects-demo-mode-banner-feature-' + index"
						>
							<BIcon
								:name="feature.icon"
								:size="24"
								:color="featureIconColor"
								class="scn-projects-trial-banner__feature-icon"
								:data-testid="'projects-demo-mode-banner-feature-icon-' + index"
							/>
							<TextXl
								:accent="true"
								className="scn-projects-trial-banner__feature-text"
								:data-testid="'projects-demo-mode-banner-feature-text-' + index"
							>{{ feature.text }}</TextXl>
						</li>
					</ul>
					<UiButton
						:text="Loc.getMessage('SOCNET_POPUP_PROJECTS_TRIAL_SUBMIT')"
						:size="ButtonSize.EXTRA_LARGE"
						:style="AirButtonStyle.FILLED_SUCCESS"
						class="scn-projects-trial-banner__submit"
						:dataset="{ testid: 'projects-demo-mode-banner-cta-btn' }"
						@click="handleClickSubmit"
					/>
				</div>
				<div
					v-if="isArtVisible"
					class="scn-projects-trial-banner__art"
					data-testid="projects-demo-mode-banner-art"
				>
					<img
						class="scn-projects-trial-banner__bg-img"
						:src="bgSrc"
						alt=""
						aria-hidden="true"
						data-testid="projects-demo-mode-banner-bg-img"
					>
					<div class="scn-projects-trial-banner__tag-list" data-testid="projects-demo-mode-banner-tag-list">
						<span
							v-for="(tag, index) in tags"
							:key="index"
							class="scn-projects-trial-banner__tag"
							:data-testid="'projects-demo-mode-banner-tag-' + index"
						>{{ tag }}</span>
					</div>
					<video
						ref="video"
						class="scn-projects-trial-banner__video"
						data-testid="projects-demo-mode-banner-video"
						muted
						autoplay
						loop
						playsinline
						preload="auto"
					>
						<source :src="videoSrc" type="video/mp4">
					</video>
					<img
						class="scn-projects-trial-banner__character-img"
						:src="characterSrc"
						alt=""
						aria-hidden="true"
						data-testid="projects-demo-mode-banner-character-img"
					>
				</div>
			</div>
		</UiPopup>
	`
	});

	const DEFAULT_TRIAL_DAYS = 15;
	const DEFAULT_COPILOT_NAME = 'BitrixGPT';
	const settings = main_core.Extension.getSettings('socialnetwork.v2.components.popup.projects-trial-banner');
	const parsedTrialDays = Number(settings.trialDays);
	const TRIAL_DAYS = Number.isFinite(parsedTrialDays) ? parsedTrialDays : DEFAULT_TRIAL_DAYS;
	const COPILOT_NAME = settings.copilotName ?? DEFAULT_COPILOT_NAME;
	const IS_CHINA_ZONE = settings.isChinaZone === true;
	let isShowing = false;
	function showProjectsTrialBanner(options = {}) {
		return new Promise(resolve => {
			if (isShowing) {
				resolve();
				return;
			}
			isShowing = true;
			void (async () => {
				const trialState = await trialStateService.getTrialState();
				if (trialState?.isActive !== true) {
					isShowing = false;
					resolve();
					return;
				}
				const container = document.createElement('div');
				let app = null;
				let isFinished = false;
				const finish = () => {
					if (isFinished) {
						return;
					}
					isFinished = true;
					app?.unmount();
					container.remove();
					isShowing = false;
					options.onClose?.();
					resolve();
				};
				try {
					document.body.append(container);
					app = ui_vue3.BitrixVue.createApp({
						components: {
							ProjectsTrialBanner
						},
						data: () => ({
							trialState,
							trialDays: TRIAL_DAYS,
							copilotName: COPILOT_NAME,
							isChinaZone: IS_CHINA_ZONE
						}),
						template: '<ProjectsTrialBanner :trial-state="trialState" :trial-days="trialDays" :copilot-name="copilotName" :is-china-zone="isChinaZone" @close="handleClosePopup"/>',
						methods: {
							handleClosePopup: finish
						}
					});
					app.mount(container);
				} catch (error) {
					console.error(error);
					finish();
				}
			})();
		});
	}

	exports.showProjectsTrialBanner = showProjectsTrialBanner;

})(this.BX.Socialnetwork.V2.Components.Popup = this.BX.Socialnetwork.V2.Components.Popup || {}, BX, BX.Vue3, BX.UI.System.Typography.Vue, BX.UI.Vue3.Components, BX.UI.IconSet, window, BX.Vue3.Components, BX.Socialnetwork.V2.Components.Elements, BX.Main);
//# sourceMappingURL=projects-trial-banner.bundle.js.map
