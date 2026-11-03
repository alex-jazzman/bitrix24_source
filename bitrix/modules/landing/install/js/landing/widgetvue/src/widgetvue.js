import { WidgetOptions } from './internal/types';
import { Logger } from './logger';
import { A11y } from 'landing.ui.a11y';
import { Dom, Event, Loc, Text, Type, ajax as Ajax } from 'main.core';

import './css/style.css';

const DATA_ANNOUNCE_QUIET_PERIOD = 10000;

export class WidgetVue
{
	static runningAppNodes: Set<HTMLElement> = new Set();

	#rootNode: ?HTMLElement = null;
	#template: string;
	#style: ?string;
	#frameTitle: string;
	#lang: {[key: string]: string} = {};
	#appId: number = 0;
	#appAllowedByTariff: boolean = true;
	#fetchable: boolean = false;
	#clickable: boolean = false;

	/**
	 * Unique string for every widget
	 * @type {string}
	 */
	#uniqueId: string;
	#frame: ?HTMLIFrameElement = null;
	#logger: Logger;

	#demoData: ?{} = null;
	#useDemoData: boolean = false;
	#blockId: number = 0;
	#renderError: ?string = null;
	#errorAnnounced: boolean = false;
	#dataAnnouncedAt: number = 0;

	constructor(options: WidgetOptions): void
	{
		this.#uniqueId = `widget_${Text.getRandom(8)}`;
		this.#logger = new Logger(options.debug || false);

		this.#rootNode = Type.isString(options.rootNode)
			? document.querySelector(options.rootNode)
			: null
		;

		this.#template = Type.isString(options.template) ? options.template : '';

		this.#style = Type.isString(options.style) ? options.style : null;

		// Until the extension is translated the phrase is missing in some languages, and the core
		// answers a missing phrase with an empty string: such a frame is left nameless.
		this.#frameTitle = Type.isStringFilled(options.frameTitle)
			? options.frameTitle
			: Loc.getMessage('LANDING_WIDGETVUE_FRAME_TITLE')
		;

		this.#demoData = Type.isObject(options.demoData) ? options.demoData : null;
		this.#useDemoData = Type.isBoolean(options.useDemoData) ? options.useDemoData : false;

		this.#lang = options.lang || {};
		this.#blockId = options.blockId ? Text.toNumber(options.blockId) : 0;

		this.#appId = options.appId ? Text.toNumber(options.appId) : 0;
		this.#appAllowedByTariff = (this.#appId && Type.isBoolean(options.appAllowedByTariff))
			? options.appAllowedByTariff
			: true
		;

		this.#fetchable = Type.isBoolean(options.fetchable) ? options.fetchable : false;
		const isEditMode = Type.isFunction(BX.Landing.getMode) && BX.Landing.getMode() === 'edit';
		this.#clickable = !isEditMode;
	}

	/**
	 * Create frame with widget content
	 * @returns {Promise|*}
	 */
	mount(): Promise
	{
		return this.#getFrameContent()
			.then((srcDoc) => {
				this.#frame = document.createElement('iframe');
				this.#frame.className = 'landing-widgetvue-iframe';
				this.#frame.dataset.testid = 'mainpage-widget-app-frame';
				this.#frame.title = this.#frameTitle;
				this.#frame.sandbox = 'allow-scripts';
				this.#frame.srcdoc = srcDoc;

				this.#frame.onload = () => {
					this.#message('getSize', {}, this.#frame.contentWindow);
				};

				if (
					this.#blockId > 0
					&& this.#rootNode
					&& !WidgetVue.runningAppNodes.has(this.#rootNode)
				)
				{
					const blockWrapper = this.#rootNode.parentElement;
					Dom.clean(blockWrapper);
					Dom.append(this.#frame, blockWrapper);

					WidgetVue.runningAppNodes.add(this.#rootNode);

					this.#bindEvents();

					if (this.#renderError)
					{
						this.#announceError(this.#renderError);
					}
				}
			})
		;
	}

	/**
	 * Remove frame and release all subscriptions
	 */
	unmount(): void
	{
		Event.unbind(window, 'message', this.#onMessage);
		BX.removeCustomEvent('BX.Landing.Block:remove', this.#onBlockRemove);

		if (this.#frame)
		{
			Dom.remove(this.#frame);
			this.#frame = null;
		}

		WidgetVue.runningAppNodes.delete(this.#rootNode);
	}

	async #getFrameContent(): Promise<string>
	{
		let content = '';

		const core = await this.#getCoreConfigs();
		content += this.#parseExtensionConfig(core.data);

		const assets = await this.#getAssetsConfigs();
		content += this.#parseExtensionConfig(assets.data);

		content += this.#parseExtensionConfig({
			lang_additional: this.#lang,
		});
		if (this.#style)
		{
			content += `<link rel="stylesheet" href="${this.#style}">`;
		}

		const engineParams = await this.#getEngineParams();

		const appInit = `
			<script>
				BX.ready(function() {
					(new BX.Landing.WidgetVue.Engine(
						${JSON.stringify(engineParams)},
					)).render();
				});
			</script>

			<div id="${this.#uniqueId}">${this.#template}</div>
		`;

		content += appInit;

		return content;
	}

	async #getEngineParams(): Promise<Object>
	{
		const engineParams = {
			id: this.#uniqueId,
			origin: window.location.origin,
			fetchable: this.#fetchable,
			clickable: this.#clickable,
		};

		if (this.#appAllowedByTariff)
		{
			if (this.#useDemoData)
			{
				if (!this.#demoData)
				{
					this.#logger.log('Widget haven\'t demo data and can be render correctly');
				}

				engineParams.data = this.#demoData || {};
			}
			else
			{
				try
				{
					engineParams.data = await this.#fetchData();
				}
				catch (error)
				{
					engineParams.error = this.#failureText(error);
				}
			}
		}
		else
		{
			engineParams.error = Loc.getMessage('LANDING_WIDGETVUE_ERROR_PAYMENT_MSGVER_1');
		}

		this.#renderError = engineParams.error ?? null;

		return engineParams;
	}

	async #getCoreConfigs(): Promise<Object>
	{
		return Ajax.runAction('landing.vibe.getCoreConfig');
	}

	async #getAssetsConfigs(): Promise<Object>
	{
		const extCodes = [
			'landing.widgetvue.engine',
		];

		return Ajax.runAction('landing.vibe.getAssetsConfig', {
			data: {
				extCodes,
			},
		});
	}

	#parseExtensionConfig(ext: Object): string
	{
		const domain = `${document.location.protocol}//${document.location.host}`;
		let html = '';

		if (ext.lang_additional !== undefined)
		{
			html += `<script>BX.message(${JSON.stringify(ext.lang_additional)})</script>`;
		}

		(ext.js || []).forEach((js) => {
			html += `<script src="${domain}${js}"></script>`;
		});

		(ext.css || []).forEach((css) => {
			html += `<link href="${domain}${css}" type="text/css" rel="stylesheet" />`;
		});

		return html;
	}

	#fetchData(params = {}): Promise<Object>
	{
		if (!this.#fetchable)
		{
			this.#logger.log('Fetch data is impossible now (haven`t handler)');

			return Promise.resolve({});
		}

		if (this.#useDemoData)
		{
			return Promise.resolve(this.#demoData || {});
		}

		return Ajax.runAction('landing.vibe.fetchData', {
			data: {
				blockId: this.#blockId,
				params,
			},
		})
			.then((jsonData) => {
				const data = JSON.parse(jsonData.data || []);
				if (data.error)
				{
					throw new Error(data.error);
				}

				return data;
			})

			.catch((fail) => {
				const logMessages = [`Fetch data error!\nWidget ID: ${this.#blockId}`];
				if (Object.keys(params) > 0)
				{
					logMessages.push('\nFetch request params:', params);
				}

				if (Type.isString(fail))
				{
					logMessages.push(`\nError in JSON data: ${fail}`);
				}
				else if (
					Type.isObject(fail)
					&& 'errors' in fail
					&& Type.isArray(fail.errors)
				)
				{
					fail.errors.forEach(error => {
						if (error.message !== undefined)
						{
							logMessages.push(`\nJavaScript error: ${error.message}`);
						}
					});
				}

				this.#logger.log(...logMessages);
				throw new Error(Loc.getMessage('LANDING_WIDGETVUE_ERROR_FETCH'));
			});
	}

	/**
	 * What a failure is shown and announced as. A rejection is not always an `Error` - a reason of
	 * another shape carries no message of its own - and the phrase of the extension is what stands
	 * in its place: an English word left over from a fallback is a word the reader is read out.
	 */
	#failureText(reason: mixed): string
	{
		return Type.isStringFilled(reason?.message)
			? reason.message
			: Loc.getMessage('LANDING_WIDGETVUE_ERROR_FETCH')
		;
	}

	/**
	 * The name of the frame opens what the reader hears and tells one widget of the page from
	 * another. A frame left nameless, or a prefix phrase the language of the portal has no
	 * translation of, leaves the text to stand on its own: a phrase opening with a colon names
	 * nothing, and a phrase that is missing is an empty string and not a nil, so the fallback is
	 * taken on a phrase that came back filled.
	 *
	 * @returns {boolean} whether the reader was told anything
	 */
	#announce(text: ?string, politeness: string): boolean
	{
		if (!Type.isStringFilled(text))
		{
			return false;
		}

		const named = Type.isStringFilled(this.#frameTitle)
			? Loc.getMessage('LANDING_WIDGETVUE_ANNOUNCE_WITH_WIDGET_NAME', {
				'#WIDGET#': this.#frameTitle,
				'#TEXT#': text,
			})
			: null
		;

		A11y.announce(Type.isStringFilled(named) ? named : text, politeness);

		return true;
	}

	/**
	 * The reason is announced as the frame writes it: an expired subscription and a handler that is
	 * down are two different things to do about.
	 *
	 * A handler that is down answers a polling frame the same way every time, and interrupting the
	 * reader with a failure they have already heard makes the page unusable. Only the first one is
	 * announced; a reply that carries data opens the announcement again.
	 *
	 * What closes the announcement is an announcement that was made: a failure carrying no text
	 * reaches no reader, and the failure behind it is still news.
	 */
	#announceError(error: ?string): void
	{
		if (this.#errorAnnounced)
		{
			return;
		}

		this.#errorAnnounced = this.#announce(error, 'assertive');

		if (this.#errorAnnounced)
		{
			// a failure the reader was told about ends the quiet period of the updates: the reader
			// is left with the failure until the recovery is announced, and inside the quiet period
			// it would not be
			this.#dataAnnouncedAt = 0;
		}
	}

	/**
	 * An application asks for data whenever it likes, and one asking on a timer would turn every
	 * reply into a phrase the reader has to sit through. The first update is announced, and the
	 * replies that follow it inside the quiet period are not: the reader keeps the announcement of
	 * a change and loses the drumming of a poll. A reply that carries data also ends the failure
	 * the reader was told about, whether or not the update itself is announced.
	 *
	 * What closes the quiet period is an announcement that was made: an update carrying no text
	 * reaches no reader, and the update behind it is still news.
	 */
	#announceDataUpdate(): void
	{
		this.#errorAnnounced = false;

		const now = Date.now();
		if (now - this.#dataAnnouncedAt < DATA_ANNOUNCE_QUIET_PERIOD)
		{
			return;
		}

		if (this.#announce(Loc.getMessage('LANDING_WIDGETVUE_ANNOUNCE_DATA_UPDATED'), 'polite'))
		{
			this.#dataAnnouncedAt = now;
		}
	}

	#message(name: string, params: {} = {}, target: Window = window)
	{
		target.postMessage(
			{
				name,
				params,
				origin: this.#uniqueId,
			},
			'*',
		);
	}

	#bindEvents()
	{
		Event.bind(window, 'message', this.#onMessage);
		BX.addCustomEvent('BX.Landing.Block:remove', this.#onBlockRemove);
	}

	#onBlockRemove = (event) => {
		if (this.#blockId > 0 && event?.blockId === this.#blockId)
		{
			this.unmount();
		}
	};

	#onMessage = (event) => {
		// Frame is sandboxed without allow-same-origin, its origin is opaque - the sender is checked by window reference
		if (!this.#frame || event.source !== this.#frame.contentWindow)
		{
			return;
		}

		if (
			event.data
			&& event.data.origin
			&& event.data.name
			&& event.data.params
			&& Type.isObject(event.data.params)
		)
		{
			if (event.data.origin !== this.#uniqueId)
			{
				return;
			}

			if (event.data.name === 'fetchData')
			{
				this.#fetchData(event.data.params)
					.then((data) => {
						this.#message('setData', {data}, event.source);
						this.#announceDataUpdate();
					})

					.catch((error) => {
						this.#message('setError', {error}, event.source);
						this.#announceError(this.#failureText(error));
					})
				;
			}

			if (
				event.data.name === 'setSize'
				&& event.data.params.size !== undefined
			)
			{
				this.#frame.height = parseInt(event.data.params.size, 10);
			}

			if (
				event.data.name === 'openApplication'
				&& this.#appId > 0
			)
			{
				const params = Type.isObject(event.data.params) ? event.data.params : {};
				BX.rest.AppLayout.openApplication(
					this.#appId,
					params,
				);
			}

			if (
				event.data.name === 'openPath'
				&& Type.isString(event.data.params.path)
			)
			{
				BX.rest.AppLayout.openPath(
					this.#appId,
					{
						path: event.data.params.path,
					},
				);
			}
		}
	};
}
