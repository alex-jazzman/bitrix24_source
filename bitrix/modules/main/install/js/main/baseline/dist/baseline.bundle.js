/* eslint-disable */
(function (exports) {
	'use strict';

	const currentBaseline = {"date":"01.09.2026","versions":{"chrome":109,"edge":109,"firefox":115,"safari":16}};

	const DISMISS_KEY = 'bx-baseline-dismiss';
	const ANALYTICS_KEY = 'bx-baseline-analytics-sent';
	const PLAN_KEY = JSON.stringify(currentBaseline);
	function getSettings() {
		try {
			const script = document.querySelector('script[data-extension="main.baseline"]');
			if (!script) {
				return {
					helpUrl: '',
					helpCode: '',
					collectData: false
				};
			}
			const settings = JSON.parse(script.textContent || '');
			return {
				helpUrl: settings && settings.helpUrl || '',
				helpCode: settings && settings.helpCode || '',
				collectData: Boolean(settings && settings.collectData)
			};
		} catch {
			return {
				helpUrl: '',
				helpCode: '',
				collectData: false
			};
		}
	}
	function msg(key) {
		return typeof BX !== 'undefined' && BX.message && BX.message[key] || '';
	}
	function detect() {
		const uaData = navigator.userAgentData;
		if (uaData && uaData.brands) {
			for (let i = 0; i < uaData.brands.length; i++) {
				if (uaData.brands[i].brand.toLowerCase().includes('chromium')) {
					return {
						name: 'chrome',
						version: Number(uaData.brands[i].version)
					};
				}
			}
		}
		const ua = navigator.userAgent;
		const ieRv = ua.match(/Trident\/.*rv:(\d+)/);
		if (ieRv) {
			return {
				name: 'ie',
				version: Number(ieRv[1])
			};
		}
		const ieMsie = ua.match(/MSIE\s(\d+)/);
		if (ieMsie) {
			return {
				name: 'ie',
				version: Number(ieMsie[1])
			};
		}
		const edgeLegacy = ua.match(/Edge\/(\d+)/);
		if (edgeLegacy && !ua.includes('Edg/')) {
			return {
				name: 'edge_legacy',
				version: Number(edgeLegacy[1])
			};
		}
		const ff = ua.match(/Firefox\/(\d+)/);
		if (ff) {
			return {
				name: 'firefox',
				version: Number(ff[1])
			};
		}
		const fxios = ua.match(/FxiOS\/(\d+)/);
		if (fxios) {
			return {
				name: 'safari',
				version: Number(fxios[1])
			};
		}
		const crios = ua.match(/CriOS\/(\d+)/);
		if (crios) {
			return {
				name: 'safari',
				version: Number(crios[1])
			};
		}
		const isChromiumBased = /Chrome\/|Chromium\//.test(ua);
		if (!isChromiumBased && /Safari\//.test(ua)) {
			const safariVersion = ua.match(/Version\/(\d+)/);
			if (safariVersion) {
				return {
					name: 'safari',
					version: Number(safariVersion[1])
				};
			}
		}
		const chromium = ua.match(/Chrome\/(\d+)/);
		if (chromium) {
			return {
				name: 'chrome',
				version: Number(chromium[1])
			};
		}
		return null;
	}
	function computeStatus(browser) {
		if (!browser) {
			return 'unsupported';
		}
		const versions = currentBaseline && currentBaseline.versions;
		const minVersion = versions && versions[browser.name];
		if (!minVersion || browser.version < minVersion) {
			return 'unsupported';
		}
		return 'supported';
	}
	const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000;
	function isDismissed() {
		try {
			const raw = localStorage.getItem(DISMISS_KEY);
			if (!raw) {
				return false;
			}
			const data = JSON.parse(raw);
			return data.plan === PLAN_KEY && Date.now() - data.ts < DISMISS_TTL;
		} catch {
			return false;
		}
	}
	function dismiss() {
		try {
			localStorage.setItem(DISMISS_KEY, JSON.stringify({
				plan: PLAN_KEY,
				ts: Date.now()
			}));
		} catch {}
	}
	function isAnalyticsSent() {
		try {
			return localStorage.getItem(ANALYTICS_KEY) === '1';
		} catch {
			return false;
		}
	}
	function sendAnalytics(result, settings) {
		if (!settings.collectData || isAnalyticsSent()) {
			return;
		}
		if (typeof navigator.sendBeacon !== 'function') {
			return;
		}
		const params = new URLSearchParams();
		params.set('st[tool]', 'browser_checker');
		params.set('st[event]', 'browser_version');
		params.set('st[category]', 'outdated_browser');
		params.set('st[p1]', result.browser ? result.browser.name : 'unknown');
		params.set('st[p2]', result.browser ? String(result.browser.version) : '0');
		navigator.sendBeacon(`/_analytics/?${params}`);
		try {
			localStorage.setItem(ANALYTICS_KEY, '1');
		} catch {}
	}
	function isWebView() {
		if (typeof window.BXMobileApp !== 'undefined') {
			return true;
		}
		const ua = navigator.userAgent;
		if (ua.includes('BitrixMobile')) {
			return true;
		}
		if (/; wv\)/.test(ua)) {
			return true;
		}
		if (/\bMobile\//.test(ua) && !/Safari\//.test(ua)) {
			return true;
		}
		return false;
	}
	function showBanner(text, settings) {
		if (!text || isDismissed() || isWebView()) {
			return;
		}
		const banner = document.createElement('div');
		banner.style.cssText = ['position:sticky', 'top:0', 'z-index:995', 'padding:12px 48px 12px 16px', 'font:14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', 'color:#611a15', 'background:#fdeded', 'border-bottom:1px solid #f5c6cb'].join(';');
		const textNode = document.createTextNode(`${text} `);
		banner.appendChild(textNode);
		if (settings.helpUrl) {
			const detailsLink = document.createElement('a');
			detailsLink.href = settings.helpUrl;
			detailsLink.target = '_blank';
			detailsLink.rel = 'noopener noreferrer';
			detailsLink.textContent = msg('MAIN_BASELINE_DETAILS');
			detailsLink.style.cssText = 'color:inherit;font-weight:bold';
			if (settings.helpCode) {
				detailsLink.onclick = e => {
					if (typeof BX !== 'undefined' && BX.Helper && BX.Helper.show) {
						e.preventDefault();
						BX.Helper.show(settings.helpCode);
					}
				};
			}
			banner.appendChild(detailsLink);
		}
		const closeBtn = document.createElement('button');
		closeBtn.style.cssText = ['position:absolute', 'top:50%', 'right:12px', 'transform:translateY(-50%)', 'border:none', 'background:none', 'font-size:20px', 'line-height:1', 'cursor:pointer', 'color:inherit', 'opacity:0.7', 'padding:4px 8px'].join(';');
		closeBtn.textContent = '\u00D7';
		closeBtn.title = msg('MAIN_BASELINE_CLOSE');
		closeBtn.onclick = () => {
			dismiss();
			if (banner.parentNode) {
				banner.parentNode.removeChild(banner);
			}
		};
		banner.appendChild(closeBtn);
		if (document.body) {
			document.body.insertBefore(banner, document.body.firstChild);
		} else {
			document.addEventListener('DOMContentLoaded', () => {
				document.body.insertBefore(banner, document.body.firstChild);
			});
		}
	}
	class Baseline {
		static check() {
			const browser = detect();
			const status = computeStatus(browser);
			const result = {
				status,
				browser
			};
			if (result.status === 'unsupported') {
				const settings = getSettings();
				sendAnalytics(result, settings);
				showBanner(msg('MAIN_BASELINE_BROWSER_OUTDATED'), settings);
			}
			return result;
		}
		static isSupported() {
			return computeStatus(detect()) === 'supported';
		}
		static detectBrowser() {
			return detect();
		}
	}
	Baseline.check();

	exports.Baseline = Baseline;

})(this.BX = this.BX || {});
//# sourceMappingURL=baseline.bundle.js.map
