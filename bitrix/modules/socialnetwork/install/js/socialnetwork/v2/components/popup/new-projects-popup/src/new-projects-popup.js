import { Loc } from 'main.core';
import { Text2Xl } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Button as UiButton, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';

import { UiPopup, type UiPopupOptions } from 'socialnetwork.v2.components.elements.ui-popup';
import { promotionService } from 'socialnetwork.v2.provider.services.promotion-service';

import './new-projects-popup.css';

// @vue/component
export const NewProjectsPopup = {
	name: 'NewProjectsPopup',
	components: {
		BIcon,
		Text2Xl,
		UiButton,
		UiPopup,
	},
	emits: ['close'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			Loc,
			Outline,
		};
	},
	data(): { shownBanner: boolean }
	{
		return {
			points: [
				{
					head: Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_POINT_HEAD_AI'),
					descr: Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_POINT_DESCR_AI'),
					icon: Outline.BITRIX_GPT,
				},
				{
					head: Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_POINT_HEAD_CHAT'),
					descr: Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_POINT_DESCR_CHAT'),
					icon: Outline.CHATS,
				},
				{
					head: Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_POINT_HEAD_UNIFIED'),
					descr: Loc.getMessage('SOCNET_POPUP_NEW_PROJECT_POINT_DESCR_UNIFIED'),
					icon: Outline.TASK_LIST,
				},
			],
		};
	},
	computed: {
		videoSrc(): string
		{
			return '/bitrix/js/socialnetwork/v2/components/popup/new-projects-popup/videos/chats_hexagon-project.webm';
		},
		optionsPopup(): UiPopupOptions
		{
			return {
				closeIcon: true,
				targetContainer: document.body,
				fixed: true,
				autoHide: true,
				overlay: true,
				className: 'scn-new-projects-popup',
			};
		},
	},
	async mounted(): Promise<void>
	{
		this.$refs.popup.getPopupInstance().adjustPosition();
		await promotionService.setNewProjectsPopupViewed();
	},
	methods: {
		handleClosePopup(): void
		{
			this.$emit('close');
		},
		handleClickSubmit(): void
		{
			this.$refs.popup.getPopupInstance().close();
		},
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
	`,
};
