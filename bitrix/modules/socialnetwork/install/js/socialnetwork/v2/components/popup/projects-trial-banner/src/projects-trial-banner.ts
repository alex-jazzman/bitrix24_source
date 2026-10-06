import { Event, Extension, Loc, Type } from 'main.core';
import { type Popup } from 'main.popup';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { Text2Xl, TextXl } from 'ui.system.typography.vue';
import { RichLoc } from 'ui.vue3.components.rich-loc';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { Button as UiButton, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';

import { UiPopup, type UiPopupOptions } from 'socialnetwork.v2.components.elements.ui-popup';

import { getTrialEndDateLabel, type TrialState } from './trial-state-service';

import './style.css';

type Feature = {
	icon: string,
	text: string,
};

type BannerData = {
	isArtVisible: boolean,
	artMediaQuery: MediaQueryList | null,
	videoElement: HTMLVideoElement | null,
	videoLoadedHandler: (() => void) | null,
};

type BannerSettings = {
	assetsPath?: string,
};

const settings = Extension.getSettings('socialnetwork.v2.components.popup.projects-trial-banner') as BannerSettings;
const ASSETS_BASE_URL: string = settings.assetsPath ?? '';

const ART_VISIBLE_MEDIA_QUERY = '(min-width: 1081px)';

function getArtMediaQuery(): MediaQueryList | null
{
	if (!Type.isFunction(window.matchMedia))
	{
		return null;
	}

	return window.matchMedia(ART_VISIBLE_MEDIA_QUERY);
}

// @vue/component
export const ProjectsTrialBanner = defineComponent({
	name: 'SocialnetworkProjectsTrialBanner',
	components: {
		BIcon,
		RichLoc,
		Text2Xl,
		TextXl,
		UiButton,
		UiPopup,
	},
	props: {
		trialState: {
			type: Object as PropType<TrialState | null>,
			default: null,
		},
		trialDays: {
			type: Number,
			default: 0,
		},
		copilotName: {
			type: String,
			default: 'BitrixGPT',
		},
		isChinaZone: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['close'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			Loc,
		};
	},
	data(): BannerData
	{
		const mediaQuery = getArtMediaQuery();

		return {
			isArtVisible: mediaQuery ? mediaQuery.matches : true,
			artMediaQuery: mediaQuery ? markRaw(mediaQuery) : null,
			videoElement: null,
			videoLoadedHandler: null,
		};
	},
	computed: {
		descText(): string
		{
			const key = this.isChinaZone
				? 'SOCNET_POPUP_PROJECTS_TRIAL_DESC_CN'
				: 'SOCNET_POPUP_PROJECTS_TRIAL_DESC';

			return Loc.getMessage(key) ?? '';
		},
		features(): Feature[]
		{
			const teamKey = this.isChinaZone
				? 'SOCNET_POPUP_PROJECTS_TRIAL_FEATURE_TEAM_CN'
				: 'SOCNET_POPUP_PROJECTS_TRIAL_FEATURE_TEAM';

			const aiFeature: Feature = this.isChinaZone
				? {
					icon: Outline.ADD_PERSON,
					text: Loc.getMessage('SOCNET_POPUP_PROJECTS_TRIAL_FEATURE_AI_CN') ?? '',
				}
				: {
					icon: Outline.AI_STARS,
					text: Loc.getMessage('SOCNET_POPUP_PROJECTS_TRIAL_FEATURE_AI', { '#COPILOT_NAME#': this.copilotName }) ?? '',
				};

			return [
				{
					icon: Outline.COLLAB,
					text: Loc.getMessage('SOCNET_POPUP_PROJECTS_TRIAL_FEATURE_PROJECT') ?? '',
				},
				{
					icon: Outline.GROUP,
					text: Loc.getMessage(teamKey) ?? '',
				},
				aiFeature,
			];
		},
		tags(): string[]
		{
			const aiTagKey = this.isChinaZone
				? 'SOCNET_POPUP_PROJECTS_TRIAL_TAG_AI_CN'
				: 'SOCNET_POPUP_PROJECTS_TRIAL_TAG_AI';

			return [
				Loc.getMessage('SOCNET_POPUP_PROJECTS_TRIAL_TAG_GROUP_CHATS') ?? '',
				Loc.getMessage('SOCNET_POPUP_PROJECTS_TRIAL_TAG_COMMON_CHAT') ?? '',
				Loc.getMessage(aiTagKey) ?? '',
			];
		},
		titleText(): string
		{
			return Loc.getMessage('SOCNET_POPUP_PROJECTS_TRIAL_TITLE', { '#DAYS#': String(this.trialDays) }) ?? '';
		},
		endDateLabel(): string | null
		{
			return getTrialEndDateLabel(this.trialState);
		},
		featureIconColor(): string
		{
			return 'var(--ui-color-accent-main-primary)';
		},
		bgSrc(): string
		{
			return `${ASSETS_BASE_URL}/images/bg.png`;
		},
		characterSrc(): string
		{
			return `${ASSETS_BASE_URL}/images/zephyr.png`;
		},
		videoSrc(): string
		{
			return `${ASSETS_BASE_URL}/videos/projects-trial.mp4`;
		},
		popupOptions(): UiPopupOptions
		{
			return {
				closeIcon: true,
				targetContainer: document.body,
				fixed: true,
				autoHide: true,
				closeByEsc: true,
				overlay: true,
				className: 'scn-projects-trial-banner',
			};
		},
	},
	watch: {
		isArtVisible(visible: boolean): void
		{
			if (visible)
			{
				this.$nextTick(() => {
					this.initVideoPlayback();
				});

				return;
			}

			this.stopVideoPlayback();
		},
	},
	created(): void
	{
		if (this.artMediaQuery)
		{
			this.artMediaQuery.addEventListener('change', this.handleArtMediaChange);
		}
	},
	mounted(): void
	{
		this.getPopupInstance().adjustPosition();

		if (this.isArtVisible)
		{
			this.initVideoPlayback();
		}
	},
	beforeUnmount(): void
	{
		this.stopVideoPlayback();
		if (this.artMediaQuery)
		{
			this.artMediaQuery.removeEventListener('change', this.handleArtMediaChange);
		}
	},
	methods: {
		getPopupInstance(): Popup
		{
			return (this.$refs.popup as { getPopupInstance: () => Popup }).getPopupInstance();
		},
		handleArtMediaChange(event: MediaQueryListEvent): void
		{
			this.isArtVisible = event.matches;
		},
		initVideoPlayback(): void
		{
			const video = this.$refs.video as HTMLVideoElement | undefined;
			if (!video)
			{
				return;
			}

			this.stopVideoPlayback();

			const handler = (): void => {
				video.play().catch(() => {});
			};

			this.videoElement = markRaw(video);
			this.videoLoadedHandler = handler;
			Event.bind(video, 'loadeddata', handler);

			video.play()?.catch(() => {});
		},
		stopVideoPlayback(): void
		{
			if (this.videoElement && this.videoLoadedHandler)
			{
				Event.unbind(this.videoElement, 'loadeddata', this.videoLoadedHandler);
			}

			this.videoElement = null;
			this.videoLoadedHandler = null;
		},
		handleClosePopup(): void
		{
			this.$emit('close');
		},
		handleClickSubmit(): void
		{
			this.getPopupInstance().close();
		},
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
	`,
});
