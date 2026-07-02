import { describe, it, beforeEach, afterEach } from 'mocha';
import { assert } from 'chai';

import { FocusHistory } from '../../src/focus-monitor/focus-history';

describe('FocusHistory', () => {
	let mount: HTMLElement | null = null;

	beforeEach(() => {
		mount = document.createElement('div');
		document.body.appendChild(mount);
	});

	afterEach(() => {
		mount?.remove();
	});

	function createFocusable(label: string): HTMLElement
	{
		const el = document.createElement('button');
		el.textContent = label;
		mount?.appendChild(el);

		return el;
	}

	describe('#record', () => {
		it('should not record a non-focusable element', () => {
			const history = new FocusHistory(25);
			const div = document.createElement('div');
			mount?.appendChild(div);

			history.record(div);
			assert.equal(history.getLastValid(), null);
		});

		it('should record a focusable element and return it via getLastValid', () => {
			const history = new FocusHistory(25);
			const btn = createFocusable('a');

			history.record(btn);
			assert.equal(history.getLastValid(), btn);
		});

		it('should not duplicate the last recorded element on repeat', () => {
			const history = new FocusHistory(25);
			const a = createFocusable('a');
			const b = createFocusable('b');

			history.record(a);
			history.record(b);
			history.record(b);

			assert.equal(history.getLastValid(), b);

			b.remove();
			assert.equal(history.getLastValid(), a);
		});

		it('should move a middle duplicate to the end of the stack', () => {
			const history = new FocusHistory(25);
			const a = createFocusable('a');
			const b = createFocusable('b');
			const c = createFocusable('c');

			history.record(a);
			history.record(b);
			history.record(c);
			history.record(a); // a moves to the end

			assert.equal(history.getLastValid(), a);

			a.remove();
			assert.equal(history.getLastValid(), c);
		});

		it('should enforce the limit and drop the oldest entries', () => {
			// Limit is 3 — after 5 records, only the 3 newest must remain.
			const history = new FocusHistory(3);
			const elements = ['a', 'b', 'c', 'd', 'e'].map((element) => createFocusable(element));

			for (const el of elements)
			{
				history.record(el);
			}

			// Newest is still last-valid.
			assert.equal(history.getLastValid(), elements[4]);

			// Remove the newest three one by one — after each removal the next newest
			// surviving element must surface. The oldest two ("a", "b") should have
			// been dropped during trim and never surface.
			elements[4].remove();
			assert.equal(history.getLastValid(), elements[3]);

			elements[3].remove();
			assert.equal(history.getLastValid(), elements[2]);

			elements[2].remove();
			assert.equal(history.getLastValid(), null, '"a" and "b" should have been trimmed out');
		});
	});

	describe('#getLastValid', () => {
		it('should return null when the history is empty', () => {
			const history = new FocusHistory(25);
			assert.equal(history.getLastValid(), null);
		});

		it('should skip entries that became non-focusable', () => {
			const history = new FocusHistory(25);
			const a = createFocusable('a');
			const b = createFocusable('b');

			history.record(a);
			history.record(b);

			(b as HTMLButtonElement).disabled = true; // b is no longer focusable
			assert.equal(history.getLastValid(), a);
		});

		it('should return null when every recorded element has been removed', () => {
			const history = new FocusHistory(25);
			const a = createFocusable('a');

			history.record(a);
			a.remove();

			assert.equal(history.getLastValid(), null);
		});
	});
});
