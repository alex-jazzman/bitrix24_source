import { type JsonObject } from 'main.core';
import { Manual } from 'ui.manual';

import { PromoId } from 'im.v2.const';
import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { PromoManager } from 'im.v2.lib.promo';
import { CollabManager } from 'im.v2.lib.collab';

import '../css/collab-helpdesk.css';

const INTRANET_MANUAL_CODE = 'collab';
const COLLABER_MANUAL_CODE = 'collab_guest';

// @vue/component
export const CollabHelpdeskPreview = {
	name: 'CollabHelpdeskPreview',
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			needToShow: false,
		};
	},
	created()
	{
		this.needToShow = this.initShowStatus();
	},
	methods:
	{
		initShowStatus(): boolean
		{
			const isPromoActive = PromoManager.getInstance().needToShow(PromoId.collabHelpdeskSidebar);
			const isCollabV2Available = FeatureManager.isFeatureAvailable(Feature.isCollabV2Available);

			return isPromoActive && !isCollabV2Available;
		},
		close()
		{
			this.needToShow = false;
			void PromoManager.getInstance().markAsWatched(PromoId.collabHelpdeskSidebar);
		},
		openHelpdesk()
		{
			const manualCode = CollabManager.isCurrentUserGuest() ? COLLABER_MANUAL_CODE : INTRANET_MANUAL_CODE;

			const urlParams = {
				utm_source: 'portal',
				utm_content: 'widget',
			};

			Manual.show(manualCode, urlParams);
		},
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div v-if="needToShow" class="bx-im-sidebar-collab-helpdesk__container" @click="openHelpdesk">
			<div class="bx-im-sidebar-collab-helpdesk__icon"></div>
			<div class="bx-im-sidebar-collab-helpdesk__content">
				<div class="bx-im-sidebar-collab-helpdesk__title">
					{{ loc('IM_SIDEBAR_COLLAB_HELPDESK_TITLE') }}
				</div>
				<div class="bx-im-sidebar-collab-helpdesk__description --line-clamp-3">
					{{ loc('IM_SIDEBAR_COLLAB_HELPDESK_DESCRIPTION') }}
				</div>
			</div>
			<div class="bx-im-sidebar-collab-helpdesk__close" @click.stop="close"></div>
		</div>
	`,
};
