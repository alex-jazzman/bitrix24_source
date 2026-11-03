import { Dom, Event, Loc, Tag, Type, ajax } from 'main.core';
import { SidePanel } from 'main.sidepanel';
import { Lottie } from 'ui.lottie';

import { ApacheSupersetEmbeddedLoader } from 'biconnector.apache-superset-embedded-loader';
import { SkeletonRenderer, type SkeletonAnimationHandle } from 'biconnector.apache-superset-dashboard-skeleton';
import DemoLoadingAnimation from './demo-loading.json';
import './demo.css';

const CREDENTIALS_ACTION = 'biconnector.dashboard.getDemoEmbeddedCredentials';
const HIDDEN_CLASS = '--hidden';
const LOG_PREFIX = 'BIConnector demo:';
const INFO_SLIDER_URL = '/bitrix/components/bitrix/biconnector.apachesuperset.dashboard.detail.info/slider.php';
const INFO_SLIDER_WIDTH = 860;

const InternalFailure = Object.freeze({
	Start: 'DEMO_INTERNAL_START_FAILED',
	Request: 'DEMO_INTERNAL_REQUEST_FAILED',
	Mount: 'DEMO_INTERNAL_MOUNT_FAILED',
	Embed: 'DEMO_INTERNAL_EMBED_FAILED',
	Render: 'DEMO_INTERNAL_RENDER_FAILED',
});

const INTERNAL_FAILURE_CODES: ReadonlyArray<string> = Object.freeze(Object.values(InternalFailure));

const INTERNAL_FAILURE_TEXT = 'BICONNECTOR_SUPERSET_DASHBOARD_DEMO_INTERNAL_FAILURE_TEXT';

const DemoState = Object.freeze({
	Ready: 'READY',
	NotReady: 'NOT_READY',
	RateLimited: 'RATE_LIMITED',
	Unavailable: 'UNAVAILABLE',
});

type StateMessageKeys = {
	title: string,
	text: string,
};

const StateMessage: Readonly<{ [state: string]: StateMessageKeys }> = Object.freeze({
	[DemoState.NotReady]: {
		title: 'BICONNECTOR_SUPERSET_DASHBOARD_DEMO_NOT_READY_TITLE',
		text: 'BICONNECTOR_SUPERSET_DASHBOARD_DEMO_NOT_READY_TEXT',
	},
	[DemoState.RateLimited]: {
		title: 'BICONNECTOR_SUPERSET_DASHBOARD_DEMO_RATE_LIMITED_TITLE',
		text: 'BICONNECTOR_SUPERSET_DASHBOARD_DEMO_RATE_LIMITED_TEXT',
	},
	[DemoState.Unavailable]: {
		title: 'BICONNECTOR_SUPERSET_DASHBOARD_DEMO_UNAVAILABLE_TITLE',
		text: 'BICONNECTOR_SUPERSET_DASHBOARD_DEMO_UNAVAILABLE_TEXT',
	},
});

type ServerErrorResponse = {
	errors?: Array<{ code?: string }>,
};

export type DemoCredentials = {
	uuid: string,
	guestToken: string,
	supersetDomain: string,
};

export type DemoCredentialsData = {
	state: string,
	credentials: DemoCredentials | null,
};

type CredentialsRequestResult = {
	data: DemoCredentialsData | null,
	errorCode: string | null,
};

export type DemoConfig = {
	containerId: string,
	reportCode: string,
	title: string,
	dashboardId: number,
};

export class DemoInstance
{
	#reportCode: string;
	#title: string;
	#dashboardId: number;
	#containerNode: HTMLElement | null;
	#skeletonNode: HTMLElement | null;
	#frameNode: HTMLElement | null;
	#stateNode: HTMLElement | null;
	#infoButtonNode: HTMLElement | null;
	#skeletonAnimation: SkeletonAnimationHandle | null = null;
	#stateAnimation: SkeletonAnimationHandle | null = null;

	constructor(config: DemoConfig)
	{
		const container: HTMLElement | null = document.getElementById(config.containerId);

		this.#reportCode = config.reportCode;
		this.#title = config.title;
		this.#dashboardId = config.dashboardId;
		this.#containerNode = container;
		this.#skeletonNode = container?.querySelector('[data-role="demo-skeleton"]') ?? null;
		this.#frameNode = container?.querySelector('[data-role="demo-frame"]') ?? null;
		this.#stateNode = container?.querySelector('[data-role="demo-state"]') ?? null;
		this.#infoButtonNode = container?.querySelector('[data-role="demo-info"]') ?? null;

		if (container === null)
		{
			DemoInstance.#logInternalFailure(
				InternalFailure.Mount,
				new Error(`Demo container "${config.containerId}" is missing`),
			);
		}

		this.#bindInfoButton();

		this.#start().catch((error: unknown): void => this.#failInternally(InternalFailure.Start, error));
	}

	#bindInfoButton(): void
	{
		if (this.#infoButtonNode === null || this.#dashboardId <= 0)
		{
			return;
		}

		Event.bind(this.#infoButtonNode, 'click', this.#handleInfoClick);
	}

	#handleInfoClick = (): void => {
		SidePanel.Instance.open(`${INFO_SLIDER_URL}?dashboard_id=${this.#dashboardId}`, {
			width: INFO_SLIDER_WIDTH,
			allowChangeHistory: false,
			cacheable: false,
		});
	};

	async #start(): Promise<void>
	{
		this.#renderSkeleton();

		const result: CredentialsRequestResult = await this.#requestCredentials();
		const credentials: DemoCredentials | null = DemoInstance.#extractReadyCredentials(result.data);

		if (credentials === null)
		{
			this.#showState(result.data?.state ?? DemoState.Unavailable, result.errorCode);

			return;
		}

		this.#mountDashboard(credentials);
	}

	async #requestCredentials(): Promise<CredentialsRequestResult>
	{
		try
		{
			const response = await ajax.runAction(CREDENTIALS_ACTION, {
				data: { reportCode: this.#reportCode },
			});

			return { data: response?.data ?? null, errorCode: null };
		}
		catch (error)
		{
			const errorCode: string | null = DemoInstance.#extractErrorCode(error);
			if (errorCode === null)
			{
				DemoInstance.#logInternalFailure(InternalFailure.Request, error);

				return { data: null, errorCode: InternalFailure.Request };
			}

			return { data: null, errorCode };
		}
	}

	static #extractErrorCode(error: unknown): string | null
	{
		const code: string = (error as ServerErrorResponse | null | undefined)?.errors?.[0]?.code ?? '';

		return Type.isStringFilled(code) ? code : null;
	}

	static #extractReadyCredentials(data: DemoCredentialsData | null): DemoCredentials | null
	{
		if (data?.state !== DemoState.Ready)
		{
			return null;
		}

		return data.credentials;
	}

	#mountDashboard(credentials: DemoCredentials): void
	{
		const frameNode: HTMLElement | null = this.#frameNode;
		if (frameNode === null)
		{
			this.#failInternally(InternalFailure.Mount, new Error('Demo frame node is missing'));

			return;
		}

		this.#dropState();
		this.#show(frameNode);

		const loader = new ApacheSupersetEmbeddedLoader({
			id: credentials.uuid,
			supersetDomain: credentials.supersetDomain,
			mountPoint: frameNode,
			fetchGuestToken: credentials.guestToken,
			debug: false,
			title: this.#title,
			dashboardUiConfig: {
				hideTitle: true,
				hideTab: true,
				hideChartControls: true,
				urlParams: {},
			},
			onTokenExpired: (): Promise<string> => this.#refreshGuestToken(),
		});

		loader.embedDashboard()
			.then(
				(): void => {
					this.#clearBusy();
					this.#destroySkeleton();
					this.#hide(this.#skeletonNode);
				},
				(error: unknown): void => this.#failInternally(InternalFailure.Embed, error),
			)
			.catch((error: unknown): void => {
				DemoInstance.#logInternalFailure(InternalFailure.Render, error);
				this.#stopLoadingIndication();
			})
		;
	}

	async #refreshGuestToken(): Promise<string>
	{
		const result: CredentialsRequestResult = await this.#requestCredentials();
		const credentials: DemoCredentials | null = DemoInstance.#extractReadyCredentials(result.data);

		if (credentials === null)
		{
			try
			{
				this.#showState(result.data?.state ?? DemoState.Unavailable, result.errorCode);
			}
			catch (error)
			{
				DemoInstance.#logInternalFailure(InternalFailure.Render, error);
				this.#stopLoadingIndication();
			}

			return '';
		}

		return credentials.guestToken;
	}

	#renderSkeleton(): void
	{
		if (this.#skeletonNode === null)
		{
			return;
		}

		this.#skeletonAnimation = SkeletonRenderer.render(this.#skeletonNode);
		this.#show(this.#skeletonNode);
	}

	#destroySkeleton(): void
	{
		this.#skeletonAnimation?.destroy();
		this.#skeletonAnimation = null;
	}

	#destroyStateAnimation(): void
	{
		this.#stateAnimation?.destroy();
		this.#stateAnimation = null;
	}

	#stopLoadingIndication(): void
	{
		this.#clearBusy();
		this.#hide(this.#skeletonNode);
	}

	#failInternally(failureCode: string, error: unknown): void
	{
		DemoInstance.#logInternalFailure(failureCode, error);

		try
		{
			this.#showState(DemoState.Unavailable, failureCode);
		}
		catch (renderError)
		{
			DemoInstance.#logInternalFailure(InternalFailure.Render, renderError);
			this.#stopLoadingIndication();
		}
	}

	static #logInternalFailure(failureCode: string, error: unknown): void
	{
		console.error(LOG_PREFIX, failureCode, DemoInstance.#describeError(error));
	}

	static #isInternalFailure(errorCode: string | null): boolean
	{
		return errorCode !== null && INTERNAL_FAILURE_CODES.includes(errorCode);
	}

	static #describeError(error: unknown): string
	{
		if (error instanceof Error)
		{
			return `${error.name}: ${error.message}`;
		}

		return Type.isStringFilled(error) ? String(error) : 'non-error rejection';
	}

	#showState(state: string, errorCode: string | null = null): void
	{
		this.#clearBusy();
		this.#destroySkeleton();
		this.#hide(this.#skeletonNode);

		const stateNode: HTMLElement | null = this.#stateNode;
		if (stateNode !== null)
		{
			const resolvedState: string = Object.hasOwn(StateMessage, state) ? state : DemoState.Unavailable;
			const keys: StateMessageKeys = StateMessage[resolvedState];
			const textKey: string = DemoInstance.#isInternalFailure(errorCode) ? INTERNAL_FAILURE_TEXT : keys.text;
			const title: string = Loc.getMessage(keys.title) ?? '';
			const text: string = Loc.getMessage(textKey) ?? '';

			this.#dropState();
			Dom.append(this.#renderStateVisual(resolvedState), stateNode);
			Dom.append(
				Tag.render`<h2 class="biconnector-demo__state-title" data-testid="dashboard-demo-state-title">${title}</h2>`,
				stateNode,
			);
			Dom.append(Tag.render`<div class="biconnector-demo__state-text">${text}</div>`, stateNode);
			Dom.attr(stateNode, 'data-state', resolvedState);
			Dom.attr(stateNode, 'data-error-code', errorCode);
			this.#show(stateNode);
			this.#moveFocusFromFrame(stateNode);
		}

		this.#dropFrame();
	}

	#dropState(): void
	{
		if (this.#stateNode === null)
		{
			return;
		}

		this.#destroyStateAnimation();
		this.#hide(this.#stateNode);
		Dom.clean(this.#stateNode);
		Dom.attr(this.#stateNode, 'data-state', null);
		Dom.attr(this.#stateNode, 'data-error-code', null);
	}

	#dropFrame(): void
	{
		if (this.#frameNode === null)
		{
			return;
		}

		this.#hide(this.#frameNode);
		Dom.clean(this.#frameNode);
	}

	#moveFocusFromFrame(target: HTMLElement): void
	{
		if (this.#frameNode !== null && this.#frameNode.contains(document.activeElement))
		{
			target.focus();
		}
	}

	#clearBusy(): void
	{
		Dom.attr(this.#containerNode, 'aria-busy', null);
	}

	#renderStateVisual(state: string): HTMLElement
	{
		if (state !== DemoState.NotReady)
		{
			return Tag.render`<div class="biconnector-demo__state-icon"></div>`;
		}

		const animationNode: HTMLElement = Tag.render`<div class="biconnector-demo__state-animation" aria-hidden="true"></div>`;
		const prefersReducedMotion: boolean = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		this.#stateAnimation = Lottie.loadAnimation({
			container: animationNode,
			renderer: 'svg',
			loop: !prefersReducedMotion,
			autoplay: true,
			animationData: DemoLoadingAnimation,
		});

		return animationNode;
	}

	#show(node: HTMLElement | null): void
	{
		if (node !== null)
		{
			Dom.removeClass(node, HIDDEN_CLASS);
		}
	}

	#hide(node: HTMLElement | null): void
	{
		if (node !== null)
		{
			Dom.addClass(node, HIDDEN_CLASS);
		}
	}
}
