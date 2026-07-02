import { describe, it, beforeEach, afterEach } from 'mocha';
import { assert } from 'chai';

import { InteractivityChecker } from '../../src/interactivity-checker/interactivity-checker';

describe('InteractivityChecker', () => {
	let mount: HTMLElement | null = null;

	beforeEach(() => {
		mount = document.createElement('div');
		document.body.appendChild(mount);
	});

	afterEach(() => {
		mount?.remove();
	});

	describe('isDisabled', () => {
		it('should return false for a plain button', () => {
			const el = document.createElement('button');
			assert.equal(InteractivityChecker.isDisabled(el), false);
		});

		it('should return true for a button with [disabled]', () => {
			const el = document.createElement('button');
			el.disabled = true;
			assert.equal(InteractivityChecker.isDisabled(el), true);
		});

		it('should return true for [aria-disabled="true"]', () => {
			const el = document.createElement('button');
			el.setAttribute('aria-disabled', 'true');
			assert.equal(InteractivityChecker.isDisabled(el), true);
		});

		it('should return false for [aria-disabled="false"]', () => {
			const el = document.createElement('button');
			el.setAttribute('aria-disabled', 'false');
			assert.equal(InteractivityChecker.isDisabled(el), false);
		});
	});

	describe('hasNegativeTabIndex', () => {
		it('should return false without tabindex', () => {
			const el = document.createElement('div');
			assert.equal(InteractivityChecker.hasNegativeTabIndex(el), false);
		});

		it('should return true for tabindex="-1"', () => {
			const el = document.createElement('div');
			el.setAttribute('tabindex', '-1');
			assert.equal(InteractivityChecker.hasNegativeTabIndex(el), true);
		});

		it('should return false for tabindex="0"', () => {
			const el = document.createElement('div');
			el.setAttribute('tabindex', '0');
			assert.equal(InteractivityChecker.hasNegativeTabIndex(el), false);
		});
	});

	describe('isVisible', () => {
		it('should return true for a button attached to the DOM', () => {
			const el = document.createElement('button');
			el.textContent = 'X';
			mount?.appendChild(el);
			assert.equal(InteractivityChecker.isVisible(el), true);
		});

		it('should return false for display:none', () => {
			const el = document.createElement('button');
			el.style.display = 'none';
			mount?.appendChild(el);
			assert.equal(InteractivityChecker.isVisible(el), false);
		});

		it('should return false for visibility:hidden', () => {
			const el = document.createElement('button');
			el.style.visibility = 'hidden';
			mount?.appendChild(el);
			assert.equal(InteractivityChecker.isVisible(el), false);
		});

		it('should return false for a disconnected node', () => {
			const el = document.createElement('button');
			assert.equal(InteractivityChecker.isVisible(el), false);
		});
	});

	describe('isFocusable', () => {
		it('should be true for a visible, enabled button', () => {
			const el = document.createElement('button');
			el.textContent = 'X';
			mount?.appendChild(el);
			assert.equal(InteractivityChecker.isFocusable(el), true);
		});

		it('should be false for a disabled button', () => {
			const el = document.createElement('button');
			el.disabled = true;
			el.textContent = 'X';
			mount?.appendChild(el);
			assert.equal(InteractivityChecker.isFocusable(el), false);
		});

		it('should be false for a plain div without tabindex', () => {
			const el = document.createElement('div');
			mount?.appendChild(el);
			assert.equal(InteractivityChecker.isFocusable(el), false);
		});

		it('should be true for a div[tabindex="0"]', () => {
			const el = document.createElement('div');
			el.setAttribute('tabindex', '0');
			el.textContent = 'X';
			mount?.appendChild(el);
			assert.equal(InteractivityChecker.isFocusable(el), true);
		});

		it('should be false when an ancestor is [inert]', () => {
			const inertWrapper = document.createElement('div');
			inertWrapper.setAttribute('inert', '');
			const el = document.createElement('button');
			el.textContent = 'X';
			inertWrapper.appendChild(el);
			mount?.appendChild(inertWrapper);
			assert.equal(InteractivityChecker.isFocusable(el), false);
		});
	});

	describe('isTabbable', () => {
		it('should be true for a focusable button without tabindex', () => {
			const el = document.createElement('button');
			el.textContent = 'X';
			mount?.appendChild(el);
			assert.equal(InteractivityChecker.isTabbable(el), true);
		});

		it('should be false for a focusable button with tabindex="-1"', () => {
			const el = document.createElement('button');
			el.textContent = 'X';
			el.setAttribute('tabindex', '-1');
			mount?.appendChild(el);
			assert.equal(InteractivityChecker.isTabbable(el), false);
		});

		it('should be false for a non-focusable element', () => {
			const el = document.createElement('div');
			mount?.appendChild(el);
			assert.equal(InteractivityChecker.isTabbable(el), false);
		});
	});
});
