import { Extension } from 'main.core';
import { BitrixVue } from 'ui.vue3';

import { ProjectsTrialBanner } from './projects-trial-banner';
import { trialStateService, type TrialState } from './trial-state-service';

type BannerSettings = {
	trialDays?: number,
	copilotName?: string,
	isChinaZone?: boolean,
};

const DEFAULT_TRIAL_DAYS = 15;
const DEFAULT_COPILOT_NAME = 'BitrixGPT';

const settings = Extension.getSettings('socialnetwork.v2.components.popup.projects-trial-banner') as BannerSettings;
const parsedTrialDays: number = Number(settings.trialDays);
const TRIAL_DAYS: number = Number.isFinite(parsedTrialDays) ? parsedTrialDays : DEFAULT_TRIAL_DAYS;
const COPILOT_NAME: string = settings.copilotName ?? DEFAULT_COPILOT_NAME;
const IS_CHINA_ZONE: boolean = settings.isChinaZone === true;

export type ShowProjectsTrialBannerOptions = {
	onClose?: () => void,
};

let isShowing = false;

export function showProjectsTrialBanner(options: ShowProjectsTrialBannerOptions = {}): Promise<void>
{
	return new Promise((resolve) => {
		if (isShowing)
		{
			resolve();

			return;
		}

		isShowing = true;

		void (async () => {
			const trialState: TrialState | null = await trialStateService.getTrialState();
			if (trialState?.isActive !== true)
			{
				isShowing = false;
				resolve();

				return;
			}

			const container = document.createElement('div');
			let app: ReturnType<typeof BitrixVue.createApp> | null = null;
			let isFinished = false;
			const finish = (): void => {
				if (isFinished)
				{
					return;
				}
				isFinished = true;

				app?.unmount();
				container.remove();
				isShowing = false;
				options.onClose?.();
				resolve();
			};

			try
			{
				document.body.append(container);

				app = BitrixVue.createApp({
					components: { ProjectsTrialBanner },
					data: () => ({ trialState, trialDays: TRIAL_DAYS, copilotName: COPILOT_NAME, isChinaZone: IS_CHINA_ZONE }),
					template: '<ProjectsTrialBanner :trial-state="trialState" :trial-days="trialDays" :copilot-name="copilotName" :is-china-zone="isChinaZone" @close="handleClosePopup"/>',
					methods: {
						handleClosePopup: finish,
					},
				});
				app.mount(container);
			}
			catch (error)
			{
				console.error(error);
				finish();
			}
		})();
	});
}
