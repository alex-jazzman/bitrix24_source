import { AutoPipPolicy, type AutoPipPolicyConfig } from './auto-pip-policy';
import { DocumentVisibilityAdapter } from './adapters/document-visibility-adapter';
import { WindowFocusVisibilityAdapter } from './adapters/window-focus-visibility-adapter';

interface PipCoordinatorConfig extends AutoPipPolicyConfig {
	isMacDesktop: boolean;
}

export class PipCoordinator
{
	readonly #policy: AutoPipPolicy;
	readonly #docAdapter: DocumentVisibilityAdapter;
	readonly #focusAdapter: WindowFocusVisibilityAdapter | null;

	constructor(config: PipCoordinatorConfig)
	{
		this.#policy = new AutoPipPolicy(config);

		this.#docAdapter = new DocumentVisibilityAdapter({
			onHide: () => this.#policy.onDocumentHide(),
			onShow: () => this.#policy.onDocumentShow(),
		});

		this.#focusAdapter = config.isMacDesktop
			? new WindowFocusVisibilityAdapter({
				onHide: () => this.#policy.onFocusHide(),
				onShow: () => this.#policy.onFocusShow(),
			})
			: null;
	}

	get enableAutoPip(): boolean
	{
		return this.#policy.enableAutoPip;
	}

	isHidden(): boolean
	{
		return this.#docAdapter.isHidden();
	}

	deactivate(): void
	{
		this.#policy.deactivate();
	}

	start(): void
	{
		this.#docAdapter.start();
		this.#focusAdapter?.start();
	}

	stop(): void
	{
		this.#docAdapter.stop();
		this.#focusAdapter?.stop();
	}
}
