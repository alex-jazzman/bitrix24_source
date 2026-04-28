import { Menu, MenuManager } from 'main.popup';
import { BIcon as Icon, Outline } from 'ui.icon-set.api.vue';

import { Utils } from 'booking.lib.utils';
import { Model } from 'booking.const';
import { UiResourceWizardItem } from 'booking.component.ui-resource-wizard-item';
import { mainPageService } from 'booking.provider.service.main-page-service';

import './timezone.css';

// @vue/component
export const YandexIntegrationWizardTimeZone = {
	name: 'YandexIntegrationWizardTimeZone',
	components: {
		UiResourceWizardItem,
		Icon,
	},
	inject: ['menuTimeZoneContainerClass'],
	setup(): { Outline: typeof Outline }
	{
		return {
			Outline,
		};
	},
	data(): { timezones: any[] }
	{
		return {
			timezones: [],
		};
	},
	computed: {
		popupId(): string
		{
			return 'booking-yiw-timezone-menu';
		},
		timezoneId: {
			get(): string
			{
				return this.$store.getters[`${Model.YandexIntegrationWizard}/getTimezone`];
			},
			set(timezone: string): void
			{
				this.$store.dispatch(`${Model.YandexIntegrationWizard}/setTimezone`, { timezone });
			},
		},
		selectedTimezoneTitle(): string
		{
			const selected = this.timezones.find((tz) => tz.timezoneId === this.timezoneId);

			return selected ? selected.title : Utils.time.getDefaultUTCTimezone(this.timezoneId);
		},
	},
	async created(): Promise<void>
	{
		this.timezones = await mainPageService.getTimezones();
	},
	methods: {
		openTimezoneSelector(): void
		{
			if (this.menuPopup?.popupWindow?.isShown())
			{
				this.destroy();

				return;
			}

			const menuButton = this.$refs['menu-button'];

			this.menuPopup = MenuManager.create(
				this.popupId,
				menuButton,
				this.getMenuItems(),
				{
					className: 'booking-yiw-timezone-menu',
					closeByEsc: true,
					maxHeight: 300,
					offsetTop: 0,
					offsetLeft: 40,
					angle: true,
					cacheable: true,
					targetContainer: document.querySelector(`.${this.menuTimeZoneContainerClass}`),
					events: {
						onClose: () => this.destroy(),
						onDestroy: () => this.destroy(),
					},
				},
			);

			this.menuPopup.show();
		},
		getMenuItems(): Array
		{
			return this.timezones.map((timezone) => ({
				text: timezone.title,
				onclick: (): void => {
					this.timezoneId = timezone.timezoneId;
					this.destroy();
				},
			}));
		},
		destroy(): void
		{
			MenuManager.destroy(this.popupId);
			this.menuPopup = null;
		},
	},
	template: `
		<UiResourceWizardItem
			:iconType="Outline.LOCATION_TIME"
			:title="loc('YANDEX_WIZARD_TIMEZONE_TITLE')"
			:description="loc('YANDEX_WIZARD_TIMEZONE_DESCRIPTION')"
		>
			<div class="booking-yiw-timezone__content">
				<div class="booking-yiw-timezone__input-label">
					{{ loc('YANDEX_TIMEZONE_LINK_INPUT_LABEL') }}
				</div>
				<div
					class="ui-ctl ui-ctl-dropdown ui-ctl-w100"
					data-id="booking-yiw-settings-timezone-input"
					id="booking-yiw-settings-timezone"
					@click="openTimezoneSelector()"
					ref="menu-button"
				>
					<div class="ui-ctl-element">{{ selectedTimezoneTitle }}</div>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				</div>
			</div>
		</UiResourceWizardItem>
	`,
};
