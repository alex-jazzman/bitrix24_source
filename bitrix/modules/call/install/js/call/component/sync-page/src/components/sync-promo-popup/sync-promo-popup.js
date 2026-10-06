import { CallPopupContainer } from 'call.component.elements';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import './sync-promo-popup.css';

type PromoFeature = {
	id: string,
	titleCode: string,
	descCode: string,
};

type PromoBadge = {
	id: string,
	locCode: string,
};

const ILLUSTRATION_BASE_PATH = '/bitrix/js/call/component/sync-page/src/components/sync-promo-popup';

const PROMO_FEATURES: Array<PromoFeature> = [
	{
		id: 'guest',
		titleCode: 'CALL_SYNC_PROMO_POPUP_FEATURE_GUEST_TITLE',
		descCode: 'CALL_SYNC_PROMO_POPUP_FEATURE_GUEST_DESC',
	},
	{
		id: 'schedule',
		titleCode: 'CALL_SYNC_PROMO_POPUP_FEATURE_SCHEDULE_TITLE',
		descCode: 'CALL_SYNC_PROMO_POPUP_FEATURE_SCHEDULE_DESC',
	},
	{
		id: 'link',
		titleCode: 'CALL_SYNC_PROMO_POPUP_FEATURE_LINK_TITLE',
		descCode: 'CALL_SYNC_PROMO_POPUP_FEATURE_LINK_DESC',
	},
];

const PROMO_BADGES: Array<PromoBadge> = [
	{ id: 'guest-access', locCode: 'CALL_SYNC_PROMO_POPUP_BADGE_GUEST_ACCESS' },
	{ id: 'no-registration', locCode: 'CALL_SYNC_PROMO_POPUP_BADGE_NO_REGISTRATION' },
	{ id: 'meeting-chat', locCode: 'CALL_SYNC_PROMO_POPUP_BADGE_MEETING_CHAT' },
	{ id: 'cloud-record', locCode: 'CALL_SYNC_PROMO_POPUP_BADGE_CLOUD_RECORD' },
];

const POPUP_ID = 'call-sync-promo-popup';

// width is intentionally not set: main.popup forces inline overflow-x on the content
// container for fixed-width popups, which would clip the mascot panel sticking out
const POPUP_CONFIG = {
	padding: 0,
	overlay: true,
	autoHide: true,
	closeByEsc: true,
	closeIcon: true,
	focusTrap: true,
	ariaLabelledBy: 'call-sync-promo-popup-title',
	contentBorderRadius: '32px',
	angle: false,
	className: 'call-sync-promo-popup-wrapper',
};

// @vue/component
export const SyncPromoPopup = {
	name: 'SyncPromoPopup',
	components: {
		CallPopupContainer,
		UiButton,
	},
	emits: ['close'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			features: PROMO_FEATURES,
			badges: PROMO_BADGES,
			illustrationVideoSrc: `${ILLUSTRATION_BASE_PATH}/videos/call-sync-page-promo-illustration.mp4`,
			illustrationPosterSrc: `${ILLUSTRATION_BASE_PATH}/images/call-sync-page-promo-illustration.webp`,
			popupId: POPUP_ID,
			popupConfig: POPUP_CONFIG,
		};
	},
	mounted(): void
	{
		// WCAG 2.2.2: do not auto-play the looped decorative video for users with reduced motion
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
		{
			this.$refs.illustrationVideo?.pause();
		}
	},
	methods:
	{
		onClose(): void
		{
			this.$emit('close');
		},
	},
	template: /* HTML */`
		<CallPopupContainer :config="popupConfig" :id="popupId" @close="onClose">
			<div class="call-sync-promo-popup --ui-context-content-light" data-testid="sync-promo-popup">
				<div class="call-sync-promo-popup__content">
					<div id="call-sync-promo-popup-title" class="call-sync-promo-popup__title">
						{{ $Bitrix.Loc.getMessage('CALL_SYNC_PROMO_POPUP_TITLE') }}
					</div>
					<div class="call-sync-promo-popup__features">
						<div
							v-for="feature in features"
							:key="feature.id"
							class="call-sync-promo-popup__feature"
						>
							<div class="call-sync-promo-popup__feature-icon" :class="\`--\${feature.id}\`"></div>
							<div class="call-sync-promo-popup__feature-body">
								<div class="call-sync-promo-popup__feature-title">
									{{ $Bitrix.Loc.getMessage(feature.titleCode) }}
								</div>
								<div class="call-sync-promo-popup__feature-desc">
									{{ $Bitrix.Loc.getMessage(feature.descCode) }}
								</div>
							</div>
						</div>
					</div>
					<div class="call-sync-promo-popup__footer">
						<UiButton
							:text="$Bitrix.Loc.getMessage('CALL_SYNC_PROMO_POPUP_BUTTON_OK')"
							:style="AirButtonStyle.FILLED"
							:size="ButtonSize.EXTRA_LARGE"
							:dataset="{ autofocus: '', testid: 'sync-promo-popup-ok-button' }"
							@click="onClose"
						/>
					</div>
				</div>
				<div class="call-sync-promo-popup__illustration" aria-hidden="true">
					<div class="call-sync-promo-popup__illustration-panel">
						<video
							ref="illustrationVideo"
							class="call-sync-promo-popup__illustration-video"
							:src="illustrationVideoSrc"
							:poster="illustrationPosterSrc"
							autoplay
							loop
							muted
							playsinline
						></video>
					</div>
					<div
						v-for="badge in badges"
						:key="badge.id"
						class="call-sync-promo-popup__badge"
						:class="\`--\${badge.id}\`"
					>
						{{ $Bitrix.Loc.getMessage(badge.locCode) }}
					</div>
				</div>
			</div>
		</CallPopupContainer>
	`,
};
