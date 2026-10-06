import { Type, Uri } from 'main.core';
import { BitrixVue } from 'ui.vue3';

import { BridgeManager } from 'market.mobile.bridge';
import { Detail } from 'market.mobile.detail';

import './application.css';

const DETAIL_PAGE_CODE = 'detail';
const THEME_QUERY_PARAM = 'mobileThemeId';
const LIGHT_THEME_ID = 'light';
const DARK_THEME_ID = 'dark';
const LIGHT_CONTEXT_CLASS = '--ui-context-content-light';
const DARK_CONTEXT_CLASS = '--ui-context-content-dark';

export class Application
{
	constructor(options = {})
	{
		this.params = Type.isPlainObject(options.params) ? options.params : {};
		this.result = Type.isPlainObject(options.result) ? options.result : {};
		this.rootNode = document.getElementById('market-wrapper-vue');
		this.themeObserver = null;

		if (!this.rootNode)
		{
			return;
		}

		this.bridgeManager = new BridgeManager({
			page: DETAIL_PAGE_CODE,
			getUrl: () => this.getCurrentPageUrl(),
			getTitle: () => this.getToolbarTitle(),
			onInstallComplete: (data) => {
				this.handleInstallComplete(data);
			},
		});

		this.syncThemeContext();
		this.observeThemeContext();
		this.mountVueApp();
		this.bridgeManager.init();
	}

	getCurrentPageUrl(): string
	{
		return String(window.location.href || '').trim();
	}

	getToolbarTitle(): string
	{
		const app = Type.isPlainObject(this.result.APP) ? this.result.APP : {};
		const title = this.result.TITLE || app.NAME;

		if (!Type.isString(title))
		{
			return '';
		}

		return title.trim();
	}

	handleInstallComplete(): void
	{
		window.location.reload();
	}

	syncThemeContext(): void
	{
		if (!this.rootNode)
		{
			return;
		}

		const themeClass = this.resolveThemeId() === DARK_THEME_ID
			? DARK_CONTEXT_CLASS
			: LIGHT_CONTEXT_CLASS;

		this.rootNode.classList.remove(LIGHT_CONTEXT_CLASS, DARK_CONTEXT_CLASS);
		this.rootNode.classList.add(themeClass);
	}

	observeThemeContext(): void
	{
		if (
			this.themeObserver
			|| Type.isUndefined(window.MutationObserver)
			|| !document.documentElement
		)
		{
			return;
		}

		this.themeObserver = new MutationObserver(() => {
			this.syncThemeContext();
		});

		this.themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class'],
		});
	}

	resolveThemeId(): string
	{
		const themeIdFromQuery = this.resolveThemeIdFromQuery();

		if (themeIdFromQuery !== '')
		{
			return themeIdFromQuery;
		}

		const themeIdFromDocument = this.resolveThemeIdFromDocument();

		return themeIdFromDocument || LIGHT_THEME_ID;
	}

	resolveThemeIdFromQuery(): string
	{
		try
		{
			const currentUrl = new Uri(this.getCurrentPageUrl());

			return this.normalizeThemeId(currentUrl.getQueryParam(THEME_QUERY_PARAM));
		}
		catch
		{
			return '';
		}
	}

	resolveThemeIdFromDocument(): string
	{
		const rootElement = document.documentElement;

		return this.normalizeThemeId(rootElement ? rootElement.className : '');
	}

	normalizeThemeId(themeId): string
	{
		const preparedThemeId = Type.isString(themeId)
			? themeId.trim().toLowerCase()
			: '';

		if (preparedThemeId.includes(DARK_THEME_ID))
		{
			return DARK_THEME_ID;
		}

		if (preparedThemeId.includes(LIGHT_THEME_ID))
		{
			return LIGHT_THEME_ID;
		}

		return '';
	}

	mountVueApp()
	{
		const application = this;

		this.app = BitrixVue.createApp({
			name: 'MarketMobileApplication',
			components: {
				Detail,
			},
			data: () => ({
				params: application.params,
				result: application.result,
			}),
			methods: {
				handleMobileUiUpdate(payload): void
				{
					application.bridgeManager.applyMobileUi(
						Type.isPlainObject(payload) ? payload : {},
					);
				},
			},
			template: `
				<div class="market-mobile-application">
					<Detail
						:params="params"
						:result="result"
						@mobile-ui-update="handleMobileUiUpdate"
					/>
				</div>
			`,
		});

		this.app.mount(this.rootNode);
	}
}
