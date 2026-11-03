import { Loc } from 'main.core';
import { Center as NotificationCenter } from 'ui.notification';
import { Text as TypographyText } from 'ui.system.typography.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Avatar } from 'ui.vue3.components.avatar';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { Logger } from 'im.v2.lib.logger';
import { runAction } from 'im.v2.lib.rest';
import { type ImModelNotification } from 'im.v2.model';

import { BaseNotificationItem } from '../base/base-item';

import '../../elements/css/item.css';
import '../../elements/css/market-app-install-item.css';

const MARKET_APP_INSTALL_STATE = Object.freeze({
	pending: 'pending',
	rejected: 'rejected',
	installed: 'installed',
});

const MARKET_APP_INSTALL_ROLE = Object.freeze({
	admin: 'admin',
	user: 'user',
});

const RestAction = Object.freeze({
	approve: 'rest.v2.Application.AppInstallRequest.approve',
	reject: 'rest.v2.Application.AppInstallRequest.reject',
});

// @vue/component
export const MarketAppInstallNotificationItem = {
	name: 'MarketAppInstallNotificationItem',
	components: {
		BIcon,
		Avatar,
		UiButton,
		BaseNotificationItem,
		TypographyText,
	},
	props: {
		notification: {
			type: Object,
			required: true,
		},
	},
	data()
	{
		return {
			dismissed: false,
			isRejecting: false,
		};
	},
	computed: {
		ButtonSize: () => ButtonSize,
		AirButtonStyle: () => AirButtonStyle,
		notificationItem(): ImModelNotification
		{
			return this.notification;
		},
		componentParams(): ?Object
		{
			return this.notificationItem.params?.componentParams ?? null;
		},
		role(): string
		{
			return this.componentParams?.role ?? MARKET_APP_INSTALL_ROLE.user;
		},
		state(): string
		{
			return this.componentParams?.state ?? MARKET_APP_INSTALL_STATE.pending;
		},
		requestId(): number
		{
			return this.componentParams?.requestId ?? 0;
		},
		appName(): string
		{
			return this.componentParams?.appName ?? '';
		},
		appIconUrl(): string
		{
			return this.componentParams?.appIconUrl ?? '';
		},
		avatarOptions(): { picPath: string, title: string, size: number }
		{
			return {
				picPath: this.appIconUrl,
				title: this.appName,
				size: 48,
			};
		},
		installUrl(): string
		{
			return this.componentParams?.installUrl ?? '';
		},
		openUrl(): string
		{
			return this.componentParams?.openUrl ?? '';
		},
		footerText(): string
		{
			return this.componentParams?.footerText ?? '';
		},
		hasFooterText(): boolean
		{
			return this.footerText.length > 0;
		},
		status(): { text: string, icon: string, color: string }
		{
			if (this.state === MARKET_APP_INSTALL_STATE.installed)
			{
				return {
					text: Loc.getMessage('IM_NOTIFICATIONS_MARKET_APP_INSTALL_STATUS_INSTALLED'),
					icon: OutlineIcons.CIRCLE_CHECK,
					color: 'var(--ui-color-accent-main-success)',
				};
			}

			if (this.state === MARKET_APP_INSTALL_STATE.rejected)
			{
				return {
					text: Loc.getMessage('IM_NOTIFICATIONS_MARKET_APP_INSTALL_STATUS_REJECTED'),
					icon: OutlineIcons.CIRCLE_CROSS,
					color: 'var(--ui-color-accent-main-alert)',
				};
			}

			return {
				text: this.role === MARKET_APP_INSTALL_ROLE.admin
					? Loc.getMessage('IM_NOTIFICATIONS_MARKET_APP_INSTALL_STATUS_PENDING_ADMIN')
					: Loc.getMessage('IM_NOTIFICATIONS_MARKET_APP_INSTALL_STATUS_PENDING_USER'),
				icon: OutlineIcons.CLOCK,
				color: 'var(--ui-color-accent-main-primary)',
			};
		},
		showInstallButtons(): boolean
		{
			return this.role === MARKET_APP_INSTALL_ROLE.admin
				&& this.state === MARKET_APP_INSTALL_STATE.pending;
		},
		showOpenButton(): boolean
		{
			return this.role === MARKET_APP_INSTALL_ROLE.user
				&& this.state === MARKET_APP_INSTALL_STATE.installed;
		},
		actionButtons(): Array
		{
			if (this.showInstallButtons)
			{
				return [
					{
						text: Loc.getMessage('IM_NOTIFICATIONS_MARKET_APP_INSTALL_BTN_GO_TO_INSTALL'),
						style: AirButtonStyle.FILLED,
						handler: this.onGoToInstallClick,
						disabled: this.isRejecting,
						testId: 'im-content-notification-market-app-install__go-to-install-button',
					},
					{
						text: Loc.getMessage('IM_NOTIFICATIONS_MARKET_APP_INSTALL_BTN_REJECT'),
						style: AirButtonStyle.OUTLINE_NO_ACCENT,
						handler: this.onRejectClick,
						disabled: this.isRejecting,
						loading: this.isRejecting,
						testId: 'im-content-notification-market-app-install__reject-button',
					},
				];
			}

			if (this.showOpenButton)
			{
				return [
					{
						text: Loc.getMessage('IM_NOTIFICATIONS_MARKET_APP_INSTALL_BTN_OPEN'),
						style: AirButtonStyle.FILLED,
						handler: this.onOpenClick,
						testId: 'im-content-notification-market-app-install__open-button',
					},
				];
			}

			return [];
		},
	},
	methods: {
		onGoToInstallClick(): void
		{
			if (this.isRejecting)
			{
				return;
			}

			if (this.installUrl)
			{
				BX.SidePanel.Instance.open(this.installUrl);
			}

			if (this.requestId && !this.dismissed)
			{
				runAction(RestAction.approve, {
					data: { requestId: this.requestId },
				}).then(() => {
					this.dismissed = true;
				}).catch((error) => {
					Logger.error('MarketAppInstall: approve failed', error);
				});
			}
		},
		onRejectClick(): void
		{
			if (this.isRejecting)
			{
				return;
			}

			this.isRejecting = true;

			runAction(RestAction.reject, {
				data: { requestId: this.requestId },
			}).then(() => {
				this.$store.dispatch('notifications/delete', { id: this.notificationItem.id });
			}).catch((error) => {
				this.isRejecting = false;
				Logger.error('MarketAppInstall: reject failed', error);
				NotificationCenter.notify({
					content: Loc.getMessage('IM_NOTIFICATIONS_MARKET_APP_INSTALL_REJECT_ERROR'),
					autoHideDelay: 5000,
				});
			});
		},
		onOpenClick(): void
		{
			if (this.openUrl)
			{
				BX.SidePanel.Instance.open(this.openUrl);
			}
		},
	},
	template: `
		<BaseNotificationItem :notification="notificationItem">
			<template #content>
				<div class="bx-im-content-notification-market-app-install__tile" data-test-id="im-content-notification-market-app-install">
					<Avatar
						class="bx-im-content-notification-market-app-install__tile-icon"
						aria-hidden="true"
						type="square"
						:options="avatarOptions"
					/>
					<div class="bx-im-content-notification-market-app-install__tile-info">
						<TypographyText size="sm" accent>{{ appName }}</TypographyText>
						<div class="bx-im-content-notification-market-app-install__tile-status" data-test-id="im-content-notification-market-app-install__status">
							<BIcon
								aria-hidden="true"
								:name="status.icon"
								:size="18"
								:color="status.color"
							/>
							<TypographyText size="xs">{{ status.text }}</TypographyText>
						</div>
					</div>
				</div>
				<div v-if="hasFooterText" class="bx-im-content-notification-market-app-install__footer-text">
					<TypographyText size="sm">{{ footerText }}</TypographyText>
				</div>
				<div
					v-if="actionButtons.length > 0"
					class="bx-im-content-notification-market-app-install__buttons"
				>
					<UiButton
						v-for="(button, index) in actionButtons"
						:key="index"
						:text="button.text"
						:style="button.style"
						:size="ButtonSize.SMALL"
						:disabled="button.disabled"
						:loading="button.loading"
						:dataset="{ testId: button.testId }"
						class="--air"
						@click="button.handler"
					/>
				</div>
			</template>
		</BaseNotificationItem>
	`,
};
