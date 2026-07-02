/**
 * Checks whether the current browser meets the baseline requirements.
 *
 * Minimum browser versions are computed from the transition plan (baseline.plan.ts)
 * and injected at build time via the Rollup plugin.
 *
 * If the browser is below the baseline, a sticky banner is shown at the top of the page.
 * The user can dismiss it; the dismiss state is stored in localStorage
 * and auto-invalidates when the baseline is updated.
 */

// @ts-ignore — virtual module generated at build time
// eslint-disable-next-line @bitrix24/bitrix24-rules/need-alias
import { currentBaseline } from 'virtual:browser-versions';

declare const BX: { message: Record<string, string>; Helper?: { show?: (code: string) => void } };

export type BaselineStatus = 'supported' | 'unsupported';

export interface BrowserInfo
{
	name: string;
	version: number;
}

export interface CheckResult
{
	status: BaselineStatus;
	browser: BrowserInfo | null;
}

const DISMISS_KEY = 'bx-baseline-dismiss';
const ANALYTICS_KEY = 'bx-baseline-analytics-sent';
const PLAN_KEY = JSON.stringify(currentBaseline);

function getSettings(): { helpUrl: string; helpCode: string; collectData: boolean }
{
	try
	{
		const script = document.querySelector('script[data-extension="main.baseline"]');
		if (!script)
		{
			return { helpUrl: '', helpCode: '', collectData: false };
		}

		const settings = JSON.parse(script.textContent || '');

		return {
			helpUrl: (settings && settings.helpUrl) || '',
			helpCode: (settings && settings.helpCode) || '',
			collectData: Boolean(settings && settings.collectData),
		};
	}
	catch
	{
		return { helpUrl: '', helpCode: '', collectData: false };
	}
}

function msg(key: string): string
{
	// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx-message
	return (typeof BX !== 'undefined' && BX.message && BX.message[key]) || '';
}

/**
 * Detects browser name and major version from User-Agent.
 *
 * Strategy:
 * 1. Use navigator.userAgentData if available (modern Chromium) — most reliable
 * 2. Check for IE (unique UA format: Trident/rv or MSIE)
 * 3. Legacy Edge (EdgeHTML): "Edge/XX" — must check before generic Chrome
 * 4. Firefox desktop
 * 5. FxiOS / CriOS — iOS browsers using WebKit under the hood
 * 6. Real Safari: has "Safari/" but no Chromium markers
 * 7. All Chromium-based browsers (Chrome, Edge, Opera, Samsung, Yandex, etc.)
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
function detect(): BrowserInfo | null
{
	const uaData = (navigator as any).userAgentData;
	if (uaData && uaData.brands)
	{
		for (let i = 0; i < uaData.brands.length; i++)
		{
			if (uaData.brands[i].brand.toLowerCase().includes('chromium'))
			{
				return { name: 'chrome', version: Number(uaData.brands[i].version) };
			}
		}
	}

	const ua = navigator.userAgent;

	// IE 11: "Trident/7.0; rv:11.0"
	const ieRv = ua.match(/Trident\/.*rv:(\d+)/);
	if (ieRv)
	{
		return { name: 'ie', version: Number(ieRv[1]) };
	}

	// IE 10 and below: "MSIE 10.0"
	const ieMsie = ua.match(/MSIE\s(\d+)/);
	if (ieMsie)
	{
		return { name: 'ie', version: Number(ieMsie[1]) };
	}

	// Legacy Edge (EdgeHTML): has "Edge/XX" (not "Edg/") — must check before Chrome
	const edgeLegacy = ua.match(/Edge\/(\d+)/);
	if (edgeLegacy && !ua.includes('Edg/'))
	{
		return { name: 'edge_legacy', version: Number(edgeLegacy[1]) };
	}

	// Firefox
	const ff = ua.match(/Firefox\/(\d+)/);
	if (ff)
	{
		return { name: 'firefox', version: Number(ff[1]) };
	}

	// Firefox on iOS (FxiOS) — uses WebKit, extract FxiOS version
	const fxios = ua.match(/FxiOS\/(\d+)/);
	if (fxios)
	{
		return { name: 'safari', version: Number(fxios[1]) };
	}

	// Chrome on iOS (CriOS) — uses WebKit, extract CriOS version
	const crios = ua.match(/CriOS\/(\d+)/);
	if (crios)
	{
		return { name: 'safari', version: Number(crios[1]) };
	}

	// Real Safari: has "Safari/" but no Chromium markers
	const isChromiumBased = /Chrome\/|Chromium\//.test(ua);
	if (!isChromiumBased && /Safari\//.test(ua))
	{
		const safariVersion = ua.match(/Version\/(\d+)/);
		if (safariVersion)
		{
			return { name: 'safari', version: Number(safariVersion[1]) };
		}
	}

	// All Chromium-based browsers
	const chromium = ua.match(/Chrome\/(\d+)/);
	if (chromium)
	{
		return { name: 'chrome', version: Number(chromium[1]) };
	}

	return null;
}

function computeStatus(browser: BrowserInfo | null): BaselineStatus
{
	if (!browser)
	{
		return 'unsupported';
	}

	const versions = currentBaseline && currentBaseline.versions;
	const minVersion = versions && versions[browser.name];
	if (!minVersion || browser.version < minVersion)
	{
		return 'unsupported';
	}

	return 'supported';
}

const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000;

function isDismissed(): boolean
{
	try
	{
		const raw = localStorage.getItem(DISMISS_KEY);
		if (!raw)
		{
			return false;
		}

		const data = JSON.parse(raw);

		return data.plan === PLAN_KEY && (Date.now() - data.ts) < DISMISS_TTL;
	}
	catch
	{
		return false;
	}
}

function dismiss(): void
{
	try
	{
		localStorage.setItem(DISMISS_KEY, JSON.stringify({ plan: PLAN_KEY, ts: Date.now() }));
	}
	catch
	{ /* empty */ }
}

function isAnalyticsSent(): boolean
{
	try
	{
		return localStorage.getItem(ANALYTICS_KEY) === '1';
	}
	catch
	{
		return false;
	}
}

function sendAnalytics(result: CheckResult, settings: { collectData: boolean }): void
{
	if (!settings.collectData || isAnalyticsSent())
	{
		return;
	}

	if (typeof navigator.sendBeacon !== 'function')
	{
		return;
	}

	const params = new URLSearchParams();
	params.set('st[tool]', 'browser_checker');
	params.set('st[event]', 'browser_version');
	params.set('st[category]', 'outdated_browser');
	params.set('st[p1]', result.browser ? result.browser.name : 'unknown');
	params.set('st[p2]', result.browser ? String(result.browser.version) : '0');

	navigator.sendBeacon(`/_analytics/?${params}`);

	try
	{
		localStorage.setItem(ANALYTICS_KEY, '1');
	}
	catch
	{ /* empty */ }
}

function isWebView(): boolean
{
	if (typeof (window as any).BXMobileApp !== 'undefined')
	{
		return true;
	}

	const ua = navigator.userAgent;

	// Bitrix24 mobile app: "BitrixMobile" in the UA string
	if (ua.includes('BitrixMobile'))
	{
		return true;
	}

	// Android WebView marker: "; wv)" in the UA string
	if (/; wv\)/.test(ua))
	{
		return true;
	}

	// iOS in-app WebView: has "Mobile/" but no "Safari/" token
	if (/\bMobile\//.test(ua) && !/Safari\//.test(ua))
	{
		return true;
	}

	return false;
}

function showBanner(text: string, settings: ReturnType<typeof getSettings>): void
{
	if (!text || isDismissed() || isWebView())
	{
		return;
	}

	const banner = document.createElement('div');
	banner.style.cssText = [
		'position:sticky',
		'top:0',
		'z-index:995',
		'padding:12px 48px 12px 16px',
		'font:14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
		'color:#611a15',
		'background:#fdeded',
		'border-bottom:1px solid #f5c6cb',
	].join(';');

	const textNode = document.createTextNode(`${text} `);
	banner.appendChild(textNode);

	if (settings.helpUrl)
	{
		const detailsLink = document.createElement('a');
		detailsLink.href = settings.helpUrl;
		detailsLink.target = '_blank';
		detailsLink.rel = 'noopener noreferrer';
		detailsLink.textContent = msg('MAIN_BASELINE_DETAILS');
		detailsLink.style.cssText = 'color:inherit;font-weight:bold';
		if (settings.helpCode)
		{
			detailsLink.onclick = (e: MouseEvent) => {
				if (typeof BX !== 'undefined' && BX.Helper && BX.Helper.show)
				{
					e.preventDefault();
					BX.Helper.show(settings.helpCode);
				}
			};
		}
		banner.appendChild(detailsLink);
	}

	const closeBtn = document.createElement('button');
	closeBtn.style.cssText = [
		'position:absolute',
		'top:50%',
		'right:12px',
		'transform:translateY(-50%)',
		'border:none',
		'background:none',
		'font-size:20px',
		'line-height:1',
		'cursor:pointer',
		'color:inherit',
		'opacity:0.7',
		'padding:4px 8px',
	].join(';');
	closeBtn.textContent = '\u00D7';
	closeBtn.title = msg('MAIN_BASELINE_CLOSE');
	closeBtn.onclick = () => {
		dismiss();
		if (banner.parentNode)
		{
			banner.parentNode.removeChild(banner);
		}
	};

	banner.appendChild(closeBtn);

	if (document.body)
	{
		document.body.insertBefore(banner, document.body.firstChild);
	}
	else
	{
		document.addEventListener('DOMContentLoaded', () => {
			document.body.insertBefore(banner, document.body.firstChild);
		});
	}
}

export class Baseline
{
	static check(): CheckResult
	{
		const browser = detect();
		const status = computeStatus(browser);
		const result: CheckResult = { status, browser };

		if (result.status === 'unsupported')
		{
			const settings = getSettings();
			sendAnalytics(result, settings);
			showBanner(msg('MAIN_BASELINE_BROWSER_OUTDATED'), settings);
		}

		return result;
	}

	static isSupported(): boolean
	{
		return computeStatus(detect()) === 'supported';
	}

	static detectBrowser(): BrowserInfo | null
	{
		return detect();
	}
}

Baseline.check();
