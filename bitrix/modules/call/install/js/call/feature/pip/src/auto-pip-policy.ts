export interface AutoPipPolicyConfig {
	togglePip: (active: boolean) => void;
	isScreenSharing: () => boolean;
	isFolded: () => boolean;
	isVideoconf: () => boolean;
	updateButtons: () => void;
	isConnected: () => boolean;
	isShown: () => boolean;
}

export class AutoPipPolicy
{
	readonly #togglePip;
	readonly #isScreenSharing;
	readonly #isFolded;
	readonly #isVideoconf;
	readonly #updateButtons;
	readonly #isConnected;
	readonly #isShown;
	#enableAutoPip = false;

	constructor(config: AutoPipPolicyConfig)
	{
		this.#togglePip = config.togglePip;
		this.#isScreenSharing = config.isScreenSharing;
		this.#isFolded = config.isFolded;
		this.#isVideoconf = config.isVideoconf;
		this.#updateButtons = config.updateButtons;
		this.#isConnected = config.isConnected;
		this.#isShown = config.isShown;
	}

	get enableAutoPip(): boolean
	{
		return this.#enableAutoPip;
	}

	onDocumentHide(): void
	{
		this.#updateButtons();

		if (this.#isVideoconf() && (!this.#isConnected() || !this.#isShown()))
		{
			return;
		}

		this.#togglePip(true);
		this.#enableAutoPip = true;
	}

	onDocumentShow(): void
	{
		this.#updateButtons();
		this.#enableAutoPip = false;

		if (this.#isScreenSharing())
		{
			return;
		}

		if (this.#isFolded())
		{
			return;
		}

		this.#togglePip(false);
	}

	onFocusHide(): void
	{
		this.#enableAutoPip = true;
		this.#togglePip(true);
	}

	onFocusShow(): void
	{
		this.#enableAutoPip = false;

		if (this.#isScreenSharing())
		{
			return;
		}

		if (this.#isFolded())
		{
			return;
		}

		this.#togglePip(false);
	}

	deactivate(): void
	{
		this.#enableAutoPip = false;
	}
}
