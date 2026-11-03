import { Runtime } from 'main.core';
import { type SetupTemplateData } from 'bizproc.setup-template';

const SETUP_TEMPLATE_EXTENSION = 'bizproc.setup-template';

type SetupTemplateExports = {
	SetupTemplate?: {
		showSidePanel: (data: SetupTemplateData) => void,
	},
};

type SetupTemplateApi = NonNullable<SetupTemplateExports['SetupTemplate']>;

type LoadSetupTemplate = () => Promise<SetupTemplateExports>;

// The wizard weighs far more than this extension, so it is fetched only once a click needs it.
export class SetupTemplateOpener
{
	#loadSetupTemplate: LoadSetupTemplate;
	#loading: Promise<SetupTemplateApi> | null = null;

	constructor(
		loadSetupTemplate: LoadSetupTemplate = () => (
			Runtime.loadExtension(SETUP_TEMPLATE_EXTENSION) as unknown as Promise<SetupTemplateExports>
		),
	)
	{
		this.#loadSetupTemplate = loadSetupTemplate;
	}

	preload(): void
	{
		void this.#load();
	}

	async open(data: SetupTemplateData): Promise<void>
	{
		const setupTemplate = await this.#load();
		setupTemplate.showSidePanel(data);
	}

	#load(): Promise<SetupTemplateApi>
	{
		if (!this.#loading)
		{
			const loading = this.#loadSetupTemplate().then(({ SetupTemplate }) => {
				if (!SetupTemplate)
				{
					throw new Error(`${SETUP_TEMPLATE_EXTENSION} is not available`);
				}

				return SetupTemplate;
			});
			// A failed load is forgotten so that the next click retries it.
			loading.catch(() => {
				if (this.#loading === loading)
				{
					this.#loading = null;
				}
			});
			this.#loading = loading;
		}

		return this.#loading;
	}
}

export const setupTemplateOpener = new SetupTemplateOpener();
