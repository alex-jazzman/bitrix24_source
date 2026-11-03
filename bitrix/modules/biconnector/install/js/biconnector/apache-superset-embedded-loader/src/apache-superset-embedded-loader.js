import { Dom, Type, Event, Uri } from 'main.core';
import type { LoaderOption } from './loader-option';
import { Switchboard } from './switchboard';

export type BxAiConfig = {
	version: number,
	enabled: boolean,
	mode: 'analyze' | 'notify',
	labels: { action: string, unavailable: string, busy: string },
};

export type BxAiConfigResult = {
	version: number,
	applied: boolean,
	supportedVersions: number[],
};

export type BxAiState = {
	version: number,
	busyRequestId: string | null,
	doneRequestId?: string,
};

const BX_AI_STATE_TIMEOUT_MS = 3000;

export class ApacheSupersetEmbeddedLoader
{
	static IFRAME_COMMS_MESSAGE_TYPE = '__embedded_comms__';
	static DASHBOARD_UI_FILTER_CONFIG_URL_PARAM_KEY: { [index: string]: any } = {
		visible: 'show_filters',
		expanded: 'expand_filters',
		nativeFiltersKey: 'native_filters_key',
		preselectFilters: 'preselect_filters',
		nativeFilters: 'native_filters',
	};

	#options: LoaderOption;
	#switchboard: ?Switchboard;
	#embedAlive: boolean;
	communicationsChannel: MessageChannel;

	constructor(options: LoaderOption): void
	{
		this.#options = options;
		this.communicationsChannel = new MessageChannel();
		this.#switchboard = null;
		this.#embedAlive = false;
	}

	async embedDashboard(): Promise
	{
		const guestToken = this.#options.fetchGuestToken;
		this.log('embedding');

		const [result]: [Switchboard] = await Promise.all([
			this.mountIframe(),
		]);

		this.#switchboard = result;

		this.#switchboard.emit('guestToken', { guestToken });
		this.log('sent guest token');

		if (this.#options.onTokenExpired)
		{
			this.#switchboard.defineMethod('refreshGuestToken', async () => {
				const newToken = await this.#options.onTokenExpired();

				return { guestToken: newToken };
			});
		}

		const getScrollSize = () => this.#switchboard.get('getScrollSize');
		const getDashboardPermalink = (anchor: string) => this.#switchboard.get('getDashboardPermalink', { anchor });
		const getActiveTabs = () => this.#switchboard.get('getActiveTabs');
		const getScreenshot = () => this.#switchboard.get('getScreenshot');
		const getPdf = () => this.#switchboard.get('getPdf');
		const getDataMask = (signal?: AbortSignal) => this.#switchboard.get('getDataMask', undefined, { signal });
		const observeDataMask = (callback: (dataMask: Object) => void) => {
			this.#switchboard.defineMethod('observeDataMask', callback);
		};

		return {
			getScrollSize,
			getDashboardPermalink,
			getActiveTabs,
			getScreenshot,
			getPdf,
			getDataMask,
			observeDataMask,
		};
	}

	calculateConfig(): number
	{
		let configNumber = 0;
		const dashboardUiConfig = this.#options.dashboardUiConfig;

		if (!dashboardUiConfig)
		{
			return configNumber;
		}

		if (dashboardUiConfig.hideTitle)
		{
			configNumber += 1;
		}

		if (dashboardUiConfig.hideTab)
		{
			configNumber += 2;
		}

		if (dashboardUiConfig.hideChartControls)
		{
			configNumber += 8;
		}

		if (dashboardUiConfig.emitDataMasks)
		{
			configNumber += 16;
		}

		return configNumber;
	}

	async mountIframe(): Promise
	{
		return new Promise((resolve, reject) => {
			const iframe = Dom.create('iframe');
			const id = this.#options.id;
			const dashboardConfig = this.#options.dashboardUiConfig ? `?uiConfig=${this.calculateConfig()}` : '';
			const filterConfig = this.#options.dashboardUiConfig?.filters || {};
			const filterConfigKeys = Object.keys(filterConfig);

			let filterConfigUrlParams = '';
			if (filterConfigKeys.length > 0)
			{
				const stringParams = filterConfigKeys
					.map((key) => `${ApacheSupersetEmbeddedLoader.DASHBOARD_UI_FILTER_CONFIG_URL_PARAM_KEY[key]}=${filterConfig[key]}`)
					.join('&')
				;
				filterConfigUrlParams += `&${stringParams}`;
			}

			const supersetDomain = this.#options.supersetDomain;
			const debug = this.#options.debug;

			if (!ApacheSupersetEmbeddedLoader.#hasAllowedScheme(supersetDomain))
			{
				this.log('superset domain scheme is not allowed, rejecting');
				reject(new Error('Embedded dashboard domain is not allowed'));

				return;
			}

			const onAlive = (event) => {
				if (
					event.source === iframe.contentWindow
					&& typeof event.data === 'object'
					&& event.data.type === ApacheSupersetEmbeddedLoader.IFRAME_COMMS_MESSAGE_TYPE
					&& event.data.handshake === 'alive'
				)
				{
					this.#embedAlive = true;
					iframe.style.visibility = '';
					this.log('received alive signal from embed');
				}
			};

			Event.bind(window, 'message', onAlive);

			iframe.style.visibility = 'hidden';

			if (Type.isStringFilled(this.#options.title))
			{
				Dom.attr(iframe, 'title', this.#options.title);
			}

			// set up the iframe's sandbox configuration
			iframe.sandbox.add('allow-same-origin'); // needed for postMessage to work
			iframe.sandbox.add('allow-scripts'); // obviously the iframe needs scripts
			iframe.sandbox.add('allow-presentation'); // for fullscreen charts
			iframe.sandbox.add('allow-downloads'); // for downloading charts as image
			iframe.sandbox.add('allow-forms'); // for forms to submit
			iframe.sandbox.add('allow-popups'); // for exporting charts as csv
			// add these if it turns out we need them:
			// iframe.sandbox.add("allow-top-navigation");

			Event.bind(iframe, 'load', () => {
				Event.unbind(window, 'message', onAlive);

				if (!this.#embedAlive)
				{
					this.log('embed did not send alive signal, rejecting');
					Dom.remove(iframe);
					reject(new Error('Embedded dashboard is not available'));

					return;
				}

				const commsChannel = this.communicationsChannel;
				const ourPort = commsChannel.port1;
				const theirPort = commsChannel.port2;

				// Send one of the message channel ports to the iframe to initialize embedded comms
				// See https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
				// we know the content window isn't null because we are in the load event handler.

				iframe.contentWindow.postMessage(
					{
						type: ApacheSupersetEmbeddedLoader.IFRAME_COMMS_MESSAGE_TYPE,
						handshake: 'port transfer',
					},
					supersetDomain,
					[theirPort],
				);
				this.log('sent message channel to the iframe');
				// return our port from the promise

				resolve(new Switchboard({ port: ourPort, name: 'superset-embedded-sdk', debug }));
			});

			iframe.src = Uri.addParam(
				`${supersetDomain}/embedded/${id}${dashboardConfig}${filterConfigUrlParams}`,
				this.#options.dashboardUiConfig?.urlParams ?? {}
			);

			if (Type.isDomNode(this.#options.mountPoint))
			{
				Dom.append(iframe, this.#options.mountPoint);
			}

			this.log('placed the iframe');
		});
	}

	static #hasAllowedScheme(domain: string): boolean
	{
		const allowedSchemes = ['http:', 'https:'];

		try
		{
			return allowedSchemes.includes(new URL(domain).protocol);
		}
		catch
		{
			return false;
		}
	}

	// Need patched superset with getScreenshot and getPdf actions - superset-frontend/src/embedded/api.tsx:61
	getScreenshot(): Promise
	{
		return this.#switchboard.get('getScreenshot');
	}

	getPdf(dashboardTitle: string): Promise
	{
		return this.#switchboard.get('getPdf', {
			dashboardTitle,
		});
	}

	/**
	 * Sets locked external filter values for shared dashboards.
	 * These filters will be displayed as read-only with locked values.
	 *
	 * @param lockedFilters Format: {filterId: {value: [...], label: '...'}, ...}
	 * @returns Promise with result
	 */
	setLockedExternalFilters(lockedFilters: { [string]: { value: [], label: string } }): Promise
	{
		if (!this.#switchboard)
		{
			return Promise.reject(new Error('Switchboard not initialized'));
		}

		return this.#switchboard.get('setLockedExternalFilters', { lockedFilters });
	}

	/**
	 * Gets current values of external filters (CompanyStructure, TasksFlow, BPWorkflowTemplate).
	 * Use this to capture filter state when sharing a dashboard.
	 *
	 * @returns Promise with external filter values: {filterId: {value: [...], label: '...', filterType: '...'}, ...}
	 */
	getExternalFilterValues(): Promise
	{
		if (!this.#switchboard)
		{
			return Promise.reject(new Error('Switchboard not initialized'));
		}

		return this.#switchboard.get('getExternalFilterValues');
	}

	defineFrameMethod(name: string, executor: (args: Object) => any): void
	{
		if (!this.#switchboard)
		{
			throw new Error('Switchboard not initialized');
		}

		this.#switchboard.defineMethod(name, executor);
	}

	setBxAiConfig(config: BxAiConfig, signal?: AbortSignal): Promise<BxAiConfigResult>
	{
		if (!this.#switchboard)
		{
			return Promise.reject(new Error('Switchboard not initialized'));
		}

		return this.#switchboard.get('setBxAiConfig', config, { signal });
	}

	/**
	 * Channel errors and timeouts are not rethrown: the frame releases a stale busy state by itself.
	 */
	async setBxAiState(state: BxAiState): Promise<void>
	{
		if (!this.#switchboard)
		{
			return;
		}

		const controller = new AbortController();
		const timerId = setTimeout(() => controller.abort(), BX_AI_STATE_TIMEOUT_MS);
		try
		{
			await this.#switchboard.get('setBxAiState', state, { signal: controller.signal });
		}
		catch (error)
		{
			this.log('setBxAiState failed', error);
		}
		finally
		{
			clearTimeout(timerId);
		}
	}

	log(...info: []): void
	{
		if (this.isDebug())
		{
			console.debug(`[superset-embedded-sdk][dashboard ${this.#options.id}]`, ...info);
		}
	}

	isDebug(): boolean
	{
		return this.#options.debug === true;
	}
}
