import { ajax, Runtime } from 'main.core';
import { type LaunchItemOptions } from 'ui.auto-launch';
import { BannerDispatcher } from 'ui.banner-dispatcher';

import { AiDigestSetup } from './launcher';
import { createOnboardingDialog, type OnboardingDialogModules } from './onboarding-dialog';
import { type AiDigestSetupOptions, type DigestSetupAvailability } from './types';

const CLAIM_ACTION = 'biconnector.dashboard.claimDigestSetupOnboarding';
const QUEUE_ITEM_PREFIX = 'biconnector-ai-digest-onboarding';

export type AiDigestOnboardingOptions = {
	version: 'v1';
	availability: DigestSetupAvailability;
};

type QueueCallback = (onDone: Function) => Object;

// Rendering the dialog is split from showing it: everything that can fail - loading the ui
// extensions and building the dialog - happens before the one-time show is claimed on the server,
// so a failure leaves the claim unspent and the onboarding available on the next visit.
export type ShowDialog = () => void;

export type OnboardingDependencies = {
	toQueue: (callback: QueueCallback, options: { id: string }) => void;
	claim: (version: string) => Promise<boolean>;
	prepareDialog: (onTry: () => void, onClose: () => void) => Promise<ShowDialog>;
	openSetup: (options: AiDigestSetupOptions) => void;
};

// Each name is taken from the extension that owns it: ui.buttons exports the whole BX.UI namespace,
// so merging the modules would let it shadow the names of the other two.
export const pickDialogModules = (
	whatsNew: Record<string, any>,
	buttons: Record<string, any>,
	iconSet: Record<string, any>,
): OnboardingDialogModules => {
	return {
		WhatsNew: whatsNew.WhatsNew,
		WhatsNewSize: whatsNew.WhatsNewSize,
		WhatsNewBackdrop: whatsNew.WhatsNewBackdrop,
		WhatsNewColor: whatsNew.WhatsNewColor,
		Button: buttons.Button,
		AirButtonStyle: buttons.AirButtonStyle,
		ButtonSize: buttons.ButtonSize,
		Outline: iconSet.Outline,
	};
};

const prepareDialog = (onTry: () => void, onClose: () => void): Promise<ShowDialog> => {
	return Promise.all([
		Runtime.loadExtension('ui.system.popups.whats-new'),
		Runtime.loadExtension('ui.buttons'),
		Runtime.loadExtension('ui.icon-set.api.core'),
	]).then(([whatsNew, buttons, iconSet]) => {
		return createOnboardingDialog(pickDialogModules(whatsNew, buttons, iconSet), { onTry, onClose });
	});
};

const defaultDependencies: OnboardingDependencies = {
	toQueue: (callback, options) => BannerDispatcher.normal.toQueue(callback, options as LaunchItemOptions),
	claim: async (version) => {
		const response = await ajax.runAction(CLAIM_ACTION, { data: { version } });

		return response.data?.claimed === true;
	},
	prepareDialog,
	openSetup: (options) => {
		void AiDigestSetup.open(options);
	},
};

export class Onboarding
{
	#dependencies: OnboardingDependencies;

	constructor(dependencies: OnboardingDependencies = defaultDependencies)
	{
		this.#dependencies = dependencies;
	}

	enqueue(options: AiDigestOnboardingOptions): void
	{
		this.#dependencies.toQueue((onDone): Object => {
			void this.#claimAndShow(options, () => onDone());

			return {};
		}, {
			id: `${QUEUE_ITEM_PREFIX}-${options.version}`,
		});
	}

	async #claimAndShow(options: AiDigestOnboardingOptions, onDone: () => void): Promise<void>
	{
		let isCompleted = false;
		const complete = () => {
			if (isCompleted)
			{
				return;
			}

			isCompleted = true;
			onDone();
		};

		try
		{
			const showDialog = await this.#dependencies.prepareDialog(
				() => this.#dependencies.openSetup({ availability: options.availability }),
				complete,
			);

			if (!await this.#dependencies.claim(options.version))
			{
				complete();

				return;
			}

			showDialog();
		}
		catch
		{
			complete();
		}
	}
}
