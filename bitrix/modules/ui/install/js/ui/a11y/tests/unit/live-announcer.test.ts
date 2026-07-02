import { describe, it, beforeEach, afterEach } from 'mocha';
import { assert } from 'chai';

import { LiveAnnouncer, type LiveAnnouncerOptions } from '../../src/live-announcer/live-announcer';

function rafTick(): Promise<void>
{
	return new Promise((resolve) => {
		requestAnimationFrame(() => resolve());
	});
}

function wait(ms: number): Promise<void>
{
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

describe('LiveAnnouncer', () => {
	let mount: HTMLElement | null = null;
	let announcer: LiveAnnouncer | null = null;

	beforeEach(() => {
		mount = document.createElement('div');
		document.body.appendChild(mount);
	});

	afterEach(() => {
		announcer?.destroy();
		announcer = null;
		mount?.remove();
	});

	function createAnnouncer(extra: Partial<LiveAnnouncerOptions> = {}): LiveAnnouncer
	{
		announcer = new LiveAnnouncer({
			container: mount!,
			baseDelay: 0,
			charDelay: 0,
			maxDelay: 0,
			...extra,
		});

		return announcer;
	}

	function region(): HTMLElement
	{
		const el = mount?.querySelector<HTMLElement>('[aria-live]');
		assert.ok(el, 'live region should be rendered inside the test container');

		return el as HTMLElement;
	}

	it('should mount a hidden live region with aria-live and aria-atomic', () => {
		createAnnouncer();
		const el = region();

		assert.equal(el.getAttribute('aria-live'), 'polite');
		assert.equal(el.getAttribute('aria-atomic'), 'true');
		assert.equal(el.getAttribute('data-a11y-ignore-inert'), 'true');
	});

	it('should ignore empty messages', async () => {
		createAnnouncer();
		announcer!.announce('');
		await rafTick();
		await rafTick();
		await wait(5);

		assert.equal(region().textContent, '');
	});

	it('should ignore whitespace-only messages', async () => {
		createAnnouncer();
		announcer!.announce('   \n\t ');
		await rafTick();
		await rafTick();
		await wait(5);

		assert.equal(region().textContent, '');
	});

	it('should announce the first message after the ready frame', async () => {
		createAnnouncer();
		announcer!.announce('first');

		// Before the ready frame fires the region stays empty — this is the fix
		// for "the first announcement is silently dropped".
		assert.equal(region().textContent, '');

		await rafTick(); // ready frame
		await rafTick(); // RAF inside #process that sets textContent

		assert.equal(region().textContent, 'first');
	});

	it('should promote assertive messages to the front of the queue', async () => {
		createAnnouncer();
		announcer!.announce('polite-1', 'polite');
		announcer!.announce('polite-2', 'polite');
		announcer!.announce('urgent', 'assertive');

		await rafTick();
		await rafTick();

		assert.equal(region().textContent, 'urgent');
		assert.equal(region().getAttribute('aria-live'), 'assertive');
	});

	it('should truncate messages longer than maxMessageLength with an ellipsis', async () => {
		createAnnouncer({ maxMessageLength: 10 });
		announcer!.announce('abcdefghijklmnopqrstuvwxyz');

		await rafTick();
		await rafTick();

		const text = region().textContent ?? '';
		assert.ok(text.length <= 10, `expected <= 10 chars, got "${text}" (${text.length})`);
		assert.ok(text.endsWith('\u2026'), `expected ellipsis suffix, got "${text}"`);
	});

	it('should cancel pending announcement and detach the region on destroy', async () => {
		createAnnouncer();
		announcer!.announce('will-not-be-heard');
		announcer!.destroy();
		announcer = null; // prevent afterEach double-destroy

		await rafTick();
		await rafTick();
		await wait(5);

		assert.equal(mount?.querySelector('[aria-live]'), null);
	});
});
