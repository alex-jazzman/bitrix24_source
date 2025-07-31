import { BIcon } from 'ui.icon-set.api.vue';
import { BMenu, type MenuOptions } from 'ui.vue3.components.menu';
import { RichMenuPopup } from 'ui.vue3.components.rich-menu';
import { Avatar } from 'ui.vue3.components.avatar';

import { ChatService } from '../../classes/chat-service';
import { OpenActionService } from '../../classes/open-action-service';
import { IconSetMixin } from '../../mixins/icon-set-mixin';
import { LocMixin } from '../../mixins/loc-mixin';
import { PopupPrefixId } from '../../user-mini-profile';
import { UserRole } from './components/user-role/user-role';
import { UserStatusIcon } from './components/user-status-icon/user-status-icon';
import { UserStatusDescription } from './components/user-status-description/user-status-description';
import { UserTime } from './components/user-time/user-time';
import { UserAvatarTypeByRole } from './const';
import { UserStatus as UserStatusDict } from '../../type';

import type { UserBaseInfoDataType } from './type';

import './style.css';

// @vue/component
export const UserBaseInfo = {
	name: 'UserBaseInfo',
	components: {
		BIcon,
		UserRole,
		UserStatusIcon,
		UserStatusDescription,
		RichMenuPopup,
		UserTime,
		Avatar,
		BMenu,
	},
	mixins: [LocMixin, IconSetMixin],
	props: {
		isShowExpand: {
			type: Boolean,
			default: false,
		},
		isExpanded: {
			type: Boolean,
			required: true,
		},
		userId: {
			type: Number,
			required: true,
		},
		info: {
			/** @type UserMiniProfileData['baseInfo'] */
			type: Object,
			required: true,
		},
		canChat: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['expand'],
	data(): UserBaseInfoDataType
	{
		return {
			isShowCallMenu: false,
		};
	},
	computed: {
		callMenuPopupOptions(): MenuOptions
		{
			return {
				id: `${PopupPrefixId}call-menu`,
				autoHide: true,
				bindElement: this.$refs.callActionMenu,
				bindOptions: { forceBindPosition: true },
				minWidth: 190,
				width: 190,
				items: [
					{
						title: this.loc('INTRANET_USER_MINI_PROFILE_ACTION_CALL_WITH_VIDEO'),
						icon: this.outlineSet.RECORD_VIDEO,
						onClick: () => this.onCallMenuItemClick(),
					},
					{
						title: this.loc('INTRANET_USER_MINI_PROFILE_ACTION_CALL'),
						icon: this.outlineSet.HEADSET,
						onClick: () => this.onCallMenuItemClick(false),
					},
				],
			};
		},
		shouldShowUserTime(): boolean
		{
			return [UserStatusDict.Online, UserStatusDict.DoNotDisturb].includes(this.info.status.code);
		},
		avatarType(): string
		{
			return UserAvatarTypeByRole[this.info.role] ?? 'round';
		},
	},
	methods: {
		openChat(): void
		{
			ChatService.openMessenger(this.userId);
		},
		call(withVideo: boolean = true): void
		{
			ChatService.call(this.userId, withVideo);
		},
		onCallMenuItemClick(withVideo: boolean = true): void
		{
			this.isShowCallMenu = false;
			this.call(withVideo);
		},
		openProfile(): void
		{
			OpenActionService.openUserProfile(this.info.url);
		},
	},
	template: `
		<div class="intranet-user-mini-profile__base-info">
			<div class="intranet-user-mini-profile__base-info__user">
				<div class="intranet-user-mini-profile__base-info__user-avatar-wrapper">
					<div 
						class="intranet-user-mini-profile__base-info__user-avatar"
						@click="openProfile"
					>
						<Avatar 
							:type="avatarType"
							:options="{
								userName: info.name, 
								size: 72, 
								title: info.name, 
								picPath: info.avatar ? encodeURI(info.avatar) : undefined,
							}"
						/>
					</div>
					<UserStatusIcon v-if="info.status" 
						:status="info.status.code"
					/>
				</div>
				<div class="intranet-user-mini-profile__base-info__user-data">
					<div class="intranet-user-mini-profile__base-info__user-data__name"
						 :title="info.name"
						 @click="openProfile"
					>
						{{ info.name }}
					</div>
					<div class="intranet-user-mini-profile__base-info__user-data__position"
						 :title="info.workPosition"
					>
						{{ info.workPosition }}
					</div>
					<div class="intranet-user-mini-profile__base-info__user-data__status">
						<UserStatusDescription v-if="info.status"
							:status="info.status"
						/>
						<UserTime v-if="shouldShowUserTime" 
							:utcOffset="info.utcOffset"
						/>
					</div>
				</div>
			</div>
			<div v-if="canChat"
				class="intranet-user-mini-profile__base-info__actions"
			>
				<div class="intranet-user-mini-profile__base-info__action">
					<button
						class="ui-btn ui-btn-sm ui-btn-no-caps --air --wide --style-outline-accent-2"
						@click="openChat"
					>
					<span class="ui-btn-text">
						{{ loc('INTRANET_USER_MINI_PROFILE_ACTION_CHAT') }}
					</span>
					</button>
				</div>
				<div class="intranet-user-mini-profile__base-info__action">
					<div class="ui-btn-split --air ui-btn-sm --style-filled ui-btn-no-caps">
						<button
							class="ui-btn-main --air"
							@click="call()"
						>
							<span class="ui-btn-text">
								{{ loc('INTRANET_USER_MINI_PROFILE_ACTION_CALL_WITH_VIDEO') }}
							</span>
						</button>
						<button
							ref="callActionMenu"
							class="ui-btn-menu"
							@click="isShowCallMenu = !isShowCallMenu"
						>
							<BMenu v-if="isShowCallMenu"
								:options="callMenuPopupOptions"
								@close="isShowCallMenu = false"
							/>
						</button>
					</div>
				</div>
			</div>
			<div v-if="isShowExpand"
				class="intranet-user-mini-profile__expand"
				@click="() => $emit('expand')"
			>
				<BIcon :name="!isExpanded ? outlineSet.OPEN_CHAT : outlineSet.CLOSE_CHAT"/>
			</div>
			<div class="intranet-user-mini-profile__base-info__role">
				<UserRole 
					:role="info.role"
				/>
			</div>
		</div>
	`,
};
