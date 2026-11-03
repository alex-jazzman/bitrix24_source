import { Loc, Runtime } from 'main.core';

import { setupTemplateOpener } from './setup-template-opener';
import { type DigestSetupAvailability, type DigestSetupResult } from './types';

const ERROR_MESSAGE_CODE = 'BICONNECTOR_AI_DIGEST_SETUP_ERROR';

type ResultHandlerDependencies = {
	openPromoter: (code: string) => void,
	showError: () => void,
	openSetup: (data: NonNullable<DigestSetupResult['setupTemplateData']>) => Promise<void> | void,
};

type InfoHelperExports = {
	InfoHelper: { show: (code: string) => void },
};

type NotificationExports = {
	Center: { notify: (options: { content: string }) => void },
};

const defaultDependencies: ResultHandlerDependencies = {
	openPromoter: (code) => {
		const loading = Runtime.loadExtension('ui.info-helper') as unknown as Promise<InfoHelperExports>;
		void loading.then(({ InfoHelper }) => InfoHelper.show(code));
	},
	showError: () => {
		const loading = Runtime.loadExtension('ui.notification') as unknown as Promise<NotificationExports>;
		void loading.then(({ Center }) => Center.notify({
			content: Loc.getMessage(ERROR_MESSAGE_CODE) ?? '',
		}));
	},
	openSetup: (data) => setupTemplateOpener.open(data),
};

export class ResultHandler
{
	#dependencies: ResultHandlerDependencies;

	constructor(dependencies: ResultHandlerDependencies = defaultDependencies)
	{
		this.#dependencies = dependencies;
	}

	canStart(availability: DigestSetupAvailability): boolean
	{
		if (availability.state === 'ready')
		{
			return true;
		}

		if (availability.state === 'subscription_required')
		{
			this.#showPromoter(availability.promoterCode);
		}

		return false;
	}

	async handle(result: DigestSetupResult): Promise<void>
	{
		if (result.state === 'ready' && result.setupTemplateData)
		{
			await this.#dependencies.openSetup(result.setupTemplateData);

			return;
		}

		if (result.state === 'subscription_required' && this.#showPromoter(result.promoterCode))
		{
			return;
		}

		this.#dependencies.showError();
	}

	handleFailure(): void
	{
		this.#dependencies.showError();
	}

	#showPromoter(code?: string): boolean
	{
		if (!code)
		{
			this.#dependencies.showError();

			return false;
		}

		this.#dependencies.openPromoter(code);

		return true;
	}
}

export const resultHandler = new ResultHandler();
