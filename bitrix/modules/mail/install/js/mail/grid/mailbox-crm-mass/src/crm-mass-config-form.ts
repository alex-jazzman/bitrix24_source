import './css/crm-mass-config-form.css';

import { Dom, Loc } from 'main.core';
import { BitrixVue, defineComponent, ref, type Ref } from 'ui.vue3';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { CrmIntegration } from 'mail.connecting.crm-integration';
import type { CrmIntegrationSettingsType, SettingOption } from 'mail.connecting.crm-integration';
import { mapSettingsConfigToState } from 'mail.connecting.settings-config';
import type { RawSettingsConfig } from 'mail.connecting.settings-config';
import { buildCrmOptions } from './build-crm-options';
import { buildMassCrmSettings } from './build-mass-crm-settings';

type SidePanelSlider = {
	setCacheable(cacheable: boolean): void;
	close(): void;
};

type SidePanelInstance = {
	getSliderByWindow?(targetWindow: Window): SidePanelSlider | null;
	getTopSlider?(): SidePanelSlider | null;
	postMessage?(sourceWindow: Window, eventId: string, data?: unknown): void;
};

type RootBX = {
	SidePanel?: {
		Instance?: SidePanelInstance;
	};
};

type TopWindow = Window & {
	BX?: RootBX;
};

function getTopSidePanel(): SidePanelInstance | undefined
{
	const topWindow = (window.top ?? window) as TopWindow;

	return topWindow.BX?.SidePanel?.Instance;
}

type InitialData = {
	mailboxIds: number[];
	settingsConfig: RawSettingsConfig & {
		crmAvailable?: boolean;
		canEditCrmIntegration?: boolean;
	};
};

type CrmMassConfigFormOptions = {
	containerId?: string;
	initialData?: InitialData;
};

type ButtonPanelButton = {
	TYPE?: string;
	ID?: string;
};

export class CrmMassConfigForm
{
	#containerId: string;
	#initialData: InitialData;
	#app: ReturnType<typeof BitrixVue.createApp> | null = null;
	#crmSettingsRef: Ref<CrmIntegrationSettingsType> | null = null;
	#mailboxIds: number[] = [];
	#buttonPanelHandler: ((button: ButtonPanelButton) => void) | null = null;

	constructor(options: CrmMassConfigFormOptions = {})
	{
		this.#containerId = options.containerId ?? 'mail-mailbox-crm-mass-config-container';
		this.#initialData = options.initialData ?? { mailboxIds: [], settingsConfig: {} };
	}

	start(): void
	{
		const container = document.getElementById(this.#containerId);
		if (!container)
		{
			return;
		}

		const rawConfig: RawSettingsConfig = this.#initialData.settingsConfig ?? {};
		const mapped = mapSettingsConfigToState(rawConfig);
		this.#mailboxIds = this.#initialData.mailboxIds ?? [];

		const defaultCrmSettings: CrmIntegrationSettingsType = buildMassCrmSettings(mapped);

		this.#crmSettingsRef = ref({ ...defaultCrmSettings });

		const crmSettingsRef = this.#crmSettingsRef;

		const syncPeriodOptions: SettingOption[] = mapped.crmSyncOptions;
		const entityOptions: SettingOption[] = mapped.crmEntityOptions;
		const sourceOptions: SettingOption[] = mapped.crmSourceOptions;
		const canEditCrmIntegration: boolean = rawConfig.canEditCrmIntegration ?? false;

		const CrmMassApp = defineComponent({
			components: { CrmIntegration },

			setup()
			{
				return {
					crmSettings: crmSettingsRef,
					syncPeriodOptions,
					entityOptions,
					sourceOptions,
					canEditCrmIntegration,
				};
			},

			// language=Vue
			template: `
				<div class="mail-crm-mass-config-form" data-testid="mail-crm-mass-config-form">
					<CrmIntegration
						v-model="crmSettings"
						:syncPeriodOptions="syncPeriodOptions"
						:entityOptions="entityOptions"
						:sourceOptions="sourceOptions"
						:canEditCrmIntegration="canEditCrmIntegration"
						:isEditMode="false"
						:showVcfOption="true"
						:showEnableSwitcher="false"
						data-testid="mail-crm-mass-config-crm-integration"
					/>
				</div>
			`,
		});

		this.#app = BitrixVue.createApp(CrmMassApp);
		this.#app.mount(container);

		document.getElementById('mail-crm-mass-apply')?.setAttribute('data-testid', 'mail-crm-mass-config-save-btn');

		const localBX = (window as unknown as { BX?: { UI?: { ButtonPanel?: object; addCustomEvent?: Function }; addCustomEvent?: Function } }).BX;
		if (localBX?.UI?.ButtonPanel)
		{
			this.#buttonPanelHandler = (button: ButtonPanelButton) =>
			{
				if (button.TYPE === 'apply' || button.ID === 'mail-crm-mass-apply')
				{
					this.#handleApply();
				}
			};

			localBX.addCustomEvent?.(localBX.UI.ButtonPanel, 'button-click', this.#buttonPanelHandler);
		}
	}

	#handleApply(): void
	{
		if (!this.#crmSettingsRef)
		{
			return;
		}

		const messageBox = MessageBox.create({
			message: Loc.getMessage('MAIL_MAILBOX_CRM_MASS_APPLY_CONFIRM'),
			okCaption: Loc.getMessage('MAIL_MAILBOX_CRM_MASS_APPLY_CONFIRM_OK'),
			cancelCaption: Loc.getMessage('MAIL_MAILBOX_CRM_MASS_APPLY_CONFIRM_CANCEL'),
			buttons: MessageBoxButtons.OK_CANCEL,
			onOk: () =>
			{
				messageBox.close();
				this.#applySettings();
			},
			onCancel: () =>
			{
				messageBox.close();
				this.#resetApplyButtonWait();
			},
		});

		messageBox.show();

		const popup = (messageBox as unknown as { getPopupWindow?: () => { getPopupContainer?: () => HTMLElement | null } | null }).getPopupWindow?.();
		const popupContainer = popup?.getPopupContainer?.();
		if (popupContainer)
		{
			popupContainer.dataset.testid = 'mail-crm-mass-apply-confirm-dialog';
		}
	}

	#applySettings(): void
	{
		if (!this.#crmSettingsRef)
		{
			return;
		}

		const crmOptions = buildCrmOptions(this.#crmSettingsRef.value, true);
		const topPanel = getTopSidePanel();

		topPanel?.postMessage?.(window, 'mail-mass-crm-config-apply', {
			mailboxIds: this.#mailboxIds,
			crmOptions,
		});

		const slider = topPanel?.getSliderByWindow?.(window)
			?? topPanel?.getTopSlider?.();

		if (slider)
		{
			slider.setCacheable(false);
			slider.close();
		}
	}

	#resetApplyButtonWait(): void
	{
		const applyBtn = document.getElementById('mail-crm-mass-apply');
		if (applyBtn)
		{
			Dom.removeClass(applyBtn, 'ui-btn-wait');
		}
	}
}
