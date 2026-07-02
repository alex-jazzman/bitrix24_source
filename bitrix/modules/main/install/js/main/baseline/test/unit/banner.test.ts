import { describe, it, beforeEach, afterEach } from 'mocha';
import { assert } from 'chai';

import { withUserAgent } from './helpers';

function findBanner(): HTMLElement | null
{
	const children = document.body.children;
	for (const child of children)
	{
		const el = child as HTMLElement;
		if (el.style && el.style.position === 'sticky')
		{
			return el;
		}
	}

	return null;
}

function removeBanners(): void
{
	let banner = findBanner();
	while (banner)
	{
		banner.remove();
		banner = findBanner();
	}
}

const outdatedUA = 'Mozilla/5.0 (Windows NT 6.1; rv:52.0) Gecko/20100101 Firefox/52.0';

describe('baseline/banner', () => {
	before(() => {
		(BX as any).message = (BX as any).message || {};
		BX.message.MAIN_BASELINE_BROWSER_OUTDATED = 'Your browser is outdated.';
		BX.message.MAIN_BASELINE_DETAILS = 'Learn more';
		BX.message.MAIN_BASELINE_CLOSE = 'Close';
	});

	beforeEach(() => {
		localStorage.clear();
		removeBanners();
	});

	afterEach(() => {
		localStorage.clear();
		removeBanners();
	});

	it('should show banner for unsupported browser', () => {
		withUserAgent(outdatedUA, () => {
			BX.Baseline.check();
		});

		const banner = findBanner();
		assert.isNotNull(banner);
	});

	it('should not show banner for supported browser', () => {
		BX.Baseline.check();
		assert.isNull(findBanner());
	});

	it('should contain a close button', () => {
		withUserAgent(outdatedUA, () => {
			BX.Baseline.check();
		});

		const banner = findBanner();
		assert.isNotNull(banner);
		const btn = banner!.querySelector('button');
		assert.isNotNull(btn);
		assert.equal(btn?.textContent, '\u00D7');
	});

	it('should remove banner on close click', () => {
		withUserAgent(outdatedUA, () => {
			BX.Baseline.check();
		});

		const banner = findBanner();
		assert.isNotNull(banner);
		banner!.querySelector('button')?.click();

		assert.isFalse(document.body.contains(banner));
	});

	it('should not show banner again after dismiss', () => {
		withUserAgent(outdatedUA, () => {
			BX.Baseline.check();
		});

		findBanner()!.querySelector('button')?.click();

		withUserAgent(outdatedUA, () => {
			BX.Baseline.check();
		});

		assert.isNull(findBanner());
	});

	it('should not show banner in Android WebView', () => {
		const androidWebViewUA = 'Mozilla/5.0 (Linux; Android 13; SM-A536B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/50.0.0.0 Mobile Safari/537.36';
		withUserAgent(androidWebViewUA, () => {
			BX.Baseline.check();
		});

		assert.isNull(findBanner());
	});

	it('should not show banner in Bitrix24 mobile app (iOS)', () => {
		const bitrixMobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) WKWebView/BitrixMobile/Version=57';
		withUserAgent(bitrixMobileUA, () => {
			BX.Baseline.check();
		});

		assert.isNull(findBanner());
	});

	it('should not show banner when BXMobileApp is present', () => {
		(window as any).BXMobileApp = {};
		try
		{
			withUserAgent(outdatedUA, () => {
				BX.Baseline.check();
			});

			assert.isNull(findBanner());
		}
		finally
		{
			delete (window as any).BXMobileApp;
		}
	});

	it('should show banner again after localStorage.clear()', () => {
		withUserAgent(outdatedUA, () => {
			BX.Baseline.check();
		});

		findBanner()!.querySelector('button')?.click();
		localStorage.clear();

		withUserAgent(outdatedUA, () => {
			BX.Baseline.check();
		});

		assert.isNotNull(findBanner());
	});
});
