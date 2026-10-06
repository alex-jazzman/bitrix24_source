import { SyncPageBlock } from './components/sync-page-block/sync-page-block';
import { SyncPageService } from './service/sync-page-service';
import { JoinMeetingPopup } from './components/join-meeting-popup/join-meeting-popup';
import { Analytics } from 'call.lib.analytics';
import { SyncPromoPopup } from './components/sync-promo-popup/sync-promo-popup';
import { isGuestCallLink } from './lib/guest-link';

import './css/sync-page.css';

// @vue/component
export const SyncPage = {
	name: 'SyncPage',
	components: {
		SyncPageBlock,
		JoinMeetingPopup,
		SyncPromoPopup,
	},
	setup()
	{
		// non-reactive service instance, assigned in created()
		return {
			syncPageService: null,
		};
	},
	data()
	{
		return {
			showJoinMeetingPopup: false,
			showPromoPopup: false,
		};
	},
	computed: {
		scheduleMeetingDesc()
		{
			return this.$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_SCHEDULE_MEETING_DESC', { '#BR#': '\n' });
		},
		joinMeetingDesc()
		{
			return this.$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_JOIN_MEETING_DESC', { '#BR#': '\n' });
		},
	},
	created()
	{
		this.syncPageService = new SyncPageService();
	},
	mounted()
	{
		Analytics.getInstance().sync.onOpenSection();
		void this.syncPageService.initPromo(() =>
		{
			this.showPromoPopup = true;
		});
	},
	methods: {
		onBlockClick(blockType)
		{
			// opening the join popup is local UI state, so the component owns it;
			// the service only routes analytics and side-effect actions
			if (blockType === 'join-meeting')
			{
				this.showJoinMeetingPopup = true;
			}

			this.syncPageService.handleBlockAction(blockType);
		},
		onJoinMeetingPopupClose()
		{
			this.showJoinMeetingPopup = false;
		},
		onPromoPopupClose()
		{
			this.syncPageService.closePromo();
			this.showPromoPopup = false;
		},
		onJoinMeeting(meetingInput)
		{
			// security guard at the sink: never open an arbitrary URL even if the emitter changes
			if (!isGuestCallLink(meetingInput))
			{
				return;
			}

			Analytics.getInstance().sync.onJoinCall();
			this.showJoinMeetingPopup = false;
			window.open(meetingInput, '_blank', 'noopener,noreferrer');
		},
	},
	template: /* HTML */`
		<div class="call-sync-page">
			<div class="call-sync-page__container">
				<div class="call-sync-page__row">
					<SyncPageBlock
						size="large"
						action-type="start-call"
						:title="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_START_CALL_TITLE')"
						:description="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_START_CALL_DESC')"
						:cta-label="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_START_CALL_BUTTON')"
						@click="onBlockClick"
					/>
				</div>
				<div class="call-sync-page__row">
					<SyncPageBlock
						size="medium"
						action-type="schedule-meeting"
						icon="schedule-meeting"
						:title="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_SCHEDULE_MEETING_TITLE')"
						:description="scheduleMeetingDesc"
						@click="onBlockClick"
					/>
					<SyncPageBlock
						size="medium"
						action-type="join-meeting"
						icon="join-meeting"
						:title="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_JOIN_MEETING_TITLE')"
						:description="joinMeetingDesc"
						@click="onBlockClick"
					/>
				</div>
				<div class="call-sync-page__row">
					<SyncPageBlock
						size="small"
						action-type="free-slots"
						icon="free-slots"
						:title="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_FREE_SLOTS_TITLE')"
						:description="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_FREE_SLOTS_DESC')"
						@click="onBlockClick"
					/>
					<SyncPageBlock
						size="small"
						action-type="call-with-me"
						icon="call-with-me"
						:title="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_CALL_WITH_ME_TITLE')"
						:description="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_CALL_WITH_ME_DESC')"
						:badge="$Bitrix.Loc.getMessage('CALL_SYNC_PAGE_BLOCK_BADGE_SOON')"
						:disabled="true"
						@click="onBlockClick"
					/>
				</div>
			</div>
			<JoinMeetingPopup
				v-if="showJoinMeetingPopup"
				@close="onJoinMeetingPopupClose"
				@join="onJoinMeeting"
			/>
			<SyncPromoPopup
				v-if="showPromoPopup"
				@close="onPromoPopupClose"
			/>
		</div>
	`,
};
