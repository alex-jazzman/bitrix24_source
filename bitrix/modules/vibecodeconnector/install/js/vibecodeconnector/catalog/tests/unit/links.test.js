import { describe, it, beforeEach, afterEach } from 'mocha';
import { assert } from 'chai';
import sinon from 'sinon';
import { Extension, Reflection } from 'main.core';
import { SidePanel } from 'main.sidepanel';

import { openCatalogApp, hasCatalogAppOpenTarget } from '../../src/utils/links';

const DESKTOP_API_CLASS_NAME = 'BX.Messenger.v2.Lib.DesktopApi';
const SETTINGS_EXTENSION_NAME = 'vibecodeconnector.catalog';

const ITEM_ID = 7;
const VIEW_URL = '/marketplace/app/7/';
const EXTERNAL_ID = 'external-7';

describe('utils/links — desktop behaviour', () => {
	/** @type {sinon.SinonStub} */
	let getClassStub;

	/** @type {sinon.SinonStub} */
	let getSettingsStub;

	/** @type {sinon.SinonStub} */
	let windowOpenStub;

	/** @type {sinon.SinonStub} */
	let sidePanelOpenStub;

	/**
	 * Makes Reflection.getClass resolve DesktopApi to a fake with the given isDesktop() answer.
	 * Pass null to simulate an environment without the messenger desktop library.
	 *
	 * @param {boolean | null} isDesktop
	 */
	function mockDesktopApi(isDesktop) {
		getClassStub
			.withArgs(DESKTOP_API_CLASS_NAME)
			.returns(isDesktop === null ? undefined : { isDesktop: () => isDesktop });
	}

	beforeEach(() => {
		getClassStub = sinon.stub(Reflection, 'getClass');
		getClassStub.callThrough();

		getSettingsStub = sinon.stub(Extension, 'getSettings');
		getSettingsStub.callThrough();
		getSettingsStub.withArgs(SETTINGS_EXTENSION_NAME).returns({
			get: (key, defaultValue) => (key === 'openAppInIframe' ? true : defaultValue),
		});

		windowOpenStub = sinon.stub(window, 'open');
		sidePanelOpenStub = sinon.stub(SidePanel.Instance, 'open');
	});

	afterEach(() => {
		getClassStub.restore();
		getSettingsStub.restore();
		windowOpenStub.restore();
		sidePanelOpenStub.restore();
	});

	describe('openCatalogApp', () => {
		it('opens a new tab instead of the slider in desktop even when openAppInIframe is enabled', () => {
			mockDesktopApi(true);

			const result = openCatalogApp(ITEM_ID, VIEW_URL, true, EXTERNAL_ID);

			assert.isFalse(result);
			assert.isTrue(windowOpenStub.calledOnceWith(VIEW_URL, '_blank', 'noopener,noreferrer'));
			assert.isTrue(sidePanelOpenStub.notCalled);
		});

		it('does not open anything in desktop when viewUrl is empty', () => {
			mockDesktopApi(true);

			const result = openCatalogApp(ITEM_ID, null, true, EXTERNAL_ID);

			assert.isFalse(result);
			assert.isTrue(windowOpenStub.notCalled);
			assert.isTrue(sidePanelOpenStub.notCalled);
		});

		it('does not open anything in desktop when viewUrl is undefined or an empty string', () => {
			mockDesktopApi(true);

			assert.isFalse(openCatalogApp(ITEM_ID, undefined, true, EXTERNAL_ID));
			assert.isFalse(openCatalogApp(ITEM_ID, '', true, EXTERNAL_ID));
			assert.isTrue(windowOpenStub.notCalled);
			assert.isTrue(sidePanelOpenStub.notCalled);
		});

		it('keeps opening the slider in browser when isDesktop() is false', () => {
			mockDesktopApi(false);

			const result = openCatalogApp(ITEM_ID, VIEW_URL, true, EXTERNAL_ID);

			assert.isTrue(result);
			assert.isTrue(sidePanelOpenStub.calledOnce);
			assert.isTrue(windowOpenStub.notCalled);
		});

		it('keeps opening the slider when DesktopApi class is not available', () => {
			mockDesktopApi(null);

			const result = openCatalogApp(ITEM_ID, VIEW_URL, true, EXTERNAL_ID);

			assert.isTrue(result);
			assert.isTrue(sidePanelOpenStub.calledOnce);
			assert.isTrue(windowOpenStub.notCalled);
		});
	});

	describe('hasCatalogAppOpenTarget', () => {
		it('returns true in desktop only when viewUrl is filled', () => {
			mockDesktopApi(true);

			assert.isTrue(hasCatalogAppOpenTarget(ITEM_ID, VIEW_URL, true, EXTERNAL_ID));
			assert.isFalse(hasCatalogAppOpenTarget(ITEM_ID, null, true, EXTERNAL_ID));
			assert.isFalse(hasCatalogAppOpenTarget(ITEM_ID, '', true, EXTERNAL_ID));
		});

		it('returns true in browser for an iframe-capable item even without viewUrl', () => {
			mockDesktopApi(false);

			assert.isTrue(hasCatalogAppOpenTarget(ITEM_ID, null, true, EXTERNAL_ID));
		});
	});
});
