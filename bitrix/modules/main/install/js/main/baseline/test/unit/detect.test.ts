import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';

import { withUserAgent } from './helpers';

const userAgents = {
	chrome126: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
	chrome90: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
	firefox115: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0',
	firefox52: 'Mozilla/5.0 (Windows NT 6.1; rv:52.0) Gecko/20100101 Firefox/52.0',
	safari17: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
	safari13: 'Mozilla/5.0 (iPad; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Mobile/15E148 Safari/604.1',
	ie11: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
	ie10: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)',
	ie9: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
	edgeChromium120: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
	opera100: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 OPR/100.0.0.0',
	samsung23: 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
	yandex24: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 YaBrowser/24.1.0.0 Safari/537.36',
	criosiOS: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1',
	ucbrowser: 'Mozilla/5.0 (Linux; U; Android 8.1.0; en-US; Redmi 5 Build/OPR1.170623.027) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.0.0 UCBrowser/1.11.0.0 Mobile Safari/537.36',

	// Mobile OS
	chromeAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
	chromeAndroid4: 'Mozilla/5.0 (Linux; Android 4.4.2; Nexus 5 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.76 Mobile Safari/537.36',
	safariIPhone17: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
	safariIPhone14: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
	safariIPadOS17: 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
	fxiOS: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/120.0 Mobile/15E148 Safari/605.1.15',
	androidWebView: 'Mozilla/5.0 (Linux; Android 13; SM-A536B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.144 Mobile Safari/537.36',
	miuiBrowser: 'Mozilla/5.0 (Linux; U; Android 12; en-us; M2102J20SG Build/SKQ1.211006.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/100.0.4896.127 Mobile Safari/537.36 XiaoMi/MiuiBrowser/17.5.4',
	huaweiBrowser: 'Mozilla/5.0 (Linux; Android 12; NOH-AN00 Build/HUAWEINOH-AN00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.196 Mobile Safari/537.36 HuaweiBrowser/15.0.3.331',

	// Desktop OS variants
	chromeLinux: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
	chromeMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
	firefoxLinux: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
	firefoxMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0',
	chromeWinXP: 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36',
	chromeWinVista: 'Mozilla/5.0 (Windows NT 6.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36',
	edgeLegacy: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/18.17763',
	chromeCrOS: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

	// In-app WebViews
	facebookAndroid: 'Mozilla/5.0 (Linux; Android 13; SM-G991B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.144 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/445.0.0.34.118;]',
};

describe('baseline/detect', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe('Chrome', () => {
		it('should detect Chrome 126', () => {
			withUserAgent(userAgents.chrome126, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 126);
			});
		});

		it('should detect Chrome 90', () => {
			withUserAgent(userAgents.chrome90, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 90);
			});
		});
	});

	describe('Firefox', () => {
		it('should detect Firefox 115', () => {
			withUserAgent(userAgents.firefox115, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'firefox');
				assert.equal(result.browser?.version, 115);
			});
		});

		it('should detect Firefox 52', () => {
			withUserAgent(userAgents.firefox52, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'firefox');
				assert.equal(result.browser?.version, 52);
			});
		});
	});

	describe('Safari', () => {
		it('should detect Safari 17', () => {
			withUserAgent(userAgents.safari17, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'safari');
				assert.equal(result.browser?.version, 17);
			});
		});

		it('should detect Safari 13', () => {
			withUserAgent(userAgents.safari13, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'safari');
				assert.equal(result.browser?.version, 13);
			});
		});
	});

	describe('Internet Explorer', () => {
		it('should detect IE 11', () => {
			withUserAgent(userAgents.ie11, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'ie');
				assert.equal(result.browser?.version, 11);
			});
		});

		it('should detect IE 10', () => {
			withUserAgent(userAgents.ie10, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'ie');
				assert.equal(result.browser?.version, 10);
			});
		});

		it('should detect IE 9', () => {
			withUserAgent(userAgents.ie9, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'ie');
				assert.equal(result.browser?.version, 9);
			});
		});
	});

	describe('Edge', () => {
		it('should detect Chromium Edge as chrome', () => {
			withUserAgent(userAgents.edgeChromium120, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 120);
			});
		});
	});

	describe('Chromium-based browsers', () => {
		it('should detect Opera as chrome', () => {
			withUserAgent(userAgents.opera100, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 114);
			});
		});

		it('should detect Samsung Internet as chrome', () => {
			withUserAgent(userAgents.samsung23, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 115);
			});
		});

		it('should detect Yandex Browser as chrome', () => {
			withUserAgent(userAgents.yandex24, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 120);
			});
		});

		it('should detect UCBrowser as chrome', () => {
			withUserAgent(userAgents.ucbrowser, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 146);
			});
		});
	});

	describe('Chrome on iOS', () => {
		it('should detect CriOS as safari', () => {
			withUserAgent(userAgents.criosiOS, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'safari');
				assert.equal(result.browser?.version, 120);
			});
		});
	});

	describe('Mobile browsers', () => {
		it('should detect Chrome on Android', () => {
			withUserAgent(userAgents.chromeAndroid, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 124);
			});
		});

		it('should detect Chrome on old Android 4.4', () => {
			withUserAgent(userAgents.chromeAndroid4, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 46);
			});
		});

		it('should detect Safari on iPhone', () => {
			withUserAgent(userAgents.safariIPhone17, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'safari');
				assert.equal(result.browser?.version, 17);
			});
		});

		it('should detect Safari 14 on iPhone', () => {
			withUserAgent(userAgents.safariIPhone14, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'safari');
				assert.equal(result.browser?.version, 14);
			});
		});

		it('should detect Safari on iPadOS', () => {
			withUserAgent(userAgents.safariIPadOS17, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'safari');
				assert.equal(result.browser?.version, 17);
			});
		});

		it('should detect Firefox on iOS (FxiOS) as safari', () => {
			withUserAgent(userAgents.fxiOS, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'safari');
				assert.equal(result.browser?.version, 120);
			});
		});

		it('should detect Android WebView as chrome', () => {
			withUserAgent(userAgents.androidWebView, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 120);
			});
		});

		it('should detect MIUI Browser as chrome', () => {
			withUserAgent(userAgents.miuiBrowser, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 100);
			});
		});

		it('should detect Huawei Browser as chrome', () => {
			withUserAgent(userAgents.huaweiBrowser, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 114);
			});
		});
	});

	describe('Desktop OS variants', () => {
		it('should detect Chrome on Linux', () => {
			withUserAgent(userAgents.chromeLinux, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 125);
			});
		});

		it('should detect Chrome on macOS', () => {
			withUserAgent(userAgents.chromeMac, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 125);
			});
		});

		it('should detect Firefox on Linux', () => {
			withUserAgent(userAgents.firefoxLinux, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'firefox');
				assert.equal(result.browser?.version, 125);
			});
		});

		it('should detect Firefox on macOS', () => {
			withUserAgent(userAgents.firefoxMac, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'firefox');
				assert.equal(result.browser?.version, 125);
			});
		});

		it('should detect Chrome on Windows XP', () => {
			withUserAgent(userAgents.chromeWinXP, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 49);
			});
		});

		it('should detect Chrome on Windows Vista', () => {
			withUserAgent(userAgents.chromeWinVista, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 49);
			});
		});

		it('should detect Legacy Edge (EdgeHTML)', () => {
			withUserAgent(userAgents.edgeLegacy, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'edge_legacy');
				assert.equal(result.browser?.version, 18);
			});
		});

		it('should detect Chrome on ChromeOS', () => {
			withUserAgent(userAgents.chromeCrOS, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 120);
			});
		});
	});

	describe('In-app WebViews', () => {
		it('should detect Facebook in-app browser as chrome', () => {
			withUserAgent(userAgents.facebookAndroid, () => {
				const result = BX.Baseline.check();
				assert.equal(result.browser?.name, 'chrome');
				assert.equal(result.browser?.version, 120);
			});
		});

	});
});
