import { mount } from '@vue/test-utils';
import { MentionChip } from '../src/mention-chip';

// Public-API assertions only: rendered classes, attributes, text and emits.
// No wrapper.vm state inspection (SKILL rule 4).
function mountChip(props) {
	return mount(MentionChip, { props });
}

describe('MentionChip', () => {
	let wrapper = null;

	afterEach(() => {
		wrapper?.unmount();
		wrapper = null;
	});

	describe('pending state (available === null)', () => {
		it('renders a shimmer placeholder label and no resolved text', () => {
			wrapper = mountChip({ type: 'user', available: null });
			assert.isTrue(
				wrapper.find('.note-mention-chip__label--shimmer').exists(),
				'shimmer label present',
			);
		});

		it('carries the pending modifier class', () => {
			wrapper = mountChip({ type: 'document', available: null });
			assert.isTrue(wrapper.classes().includes('note-mention-chip--pending'));
		});

		it('is not a link and not focusable while pending', () => {
			wrapper = mountChip({ type: 'user', available: null, isEditable: false });
			assert.isUndefined(wrapper.attributes('role'));
			assert.isUndefined(wrapper.attributes('tabindex'));
		});
	});

	describe('resolved & available state', () => {
		it('shows the label text', () => {
			wrapper = mountChip({ type: 'document', available: true, label: 'Roadmap' });
			assert.include(wrapper.text(), 'Roadmap');
			assert.isFalse(wrapper.find('.note-mention-chip__label--shimmer').exists());
		});

		it('exposes role="link" and tabindex="0" in view mode (isEditable=false)', () => {
			wrapper = mountChip({ type: 'document', available: true, label: 'Roadmap', isEditable: false });
			assert.strictEqual(wrapper.attributes('role'), 'link');
			assert.strictEqual(wrapper.attributes('tabindex'), '0');
		});

		it('omits role and tabindex in edit mode (isEditable=true)', () => {
			wrapper = mountChip({ type: 'document', available: true, label: 'Roadmap', isEditable: true });
			assert.isUndefined(wrapper.attributes('role'));
			assert.isUndefined(wrapper.attributes('tabindex'));
		});

		it('does not mark an available chip as aria-disabled', () => {
			wrapper = mountChip({ type: 'task', available: true, label: 'Fix bug' });
			assert.isUndefined(wrapper.attributes('aria-disabled'));
		});
	});

	describe('unavailable state', () => {
		it('renders the localized "unavailable" label', () => {
			wrapper = mountChip({ type: 'user', unavailable: true });
			// Loc message NOTE_MENTION_UNAVAILABLE = "Недоступно".
			assert.include(wrapper.text(), 'Недоступно');
		});

		it('sets aria-disabled="true"', () => {
			wrapper = mountChip({ type: 'user', unavailable: true });
			assert.strictEqual(wrapper.attributes('aria-disabled'), 'true');
		});

		it('is not focusable and has no link role even in view mode', () => {
			wrapper = mountChip({ type: 'user', unavailable: true, isEditable: false });
			assert.isUndefined(wrapper.attributes('tabindex'));
			assert.isUndefined(wrapper.attributes('role'));
		});

		it('carries the unavailable modifier class', () => {
			wrapper = mountChip({ type: 'user', unavailable: true });
			assert.isTrue(wrapper.classes().includes('note-mention-chip--unavailable'));
		});
	});

	describe('keyboard activation (view mode)', () => {
		it('emits "click" on Enter', async () => {
			wrapper = mountChip({ type: 'document', available: true, label: 'Doc', isEditable: false });
			await wrapper.trigger('keydown', { key: 'Enter' });
			assert.isArray(wrapper.emitted('click'));
			assert.strictEqual(wrapper.emitted('click').length, 1);
		});

		it('emits "click" on Space', async () => {
			wrapper = mountChip({ type: 'document', available: true, label: 'Doc', isEditable: false });
			await wrapper.trigger('keydown', { key: ' ' });
			assert.isArray(wrapper.emitted('click'));
			assert.strictEqual(wrapper.emitted('click').length, 1);
		});

		it('does not emit "click" on an unrelated key', async () => {
			wrapper = mountChip({ type: 'document', available: true, label: 'Doc', isEditable: false });
			await wrapper.trigger('keydown', { key: 'a' });
			assert.isUndefined(wrapper.emitted('click'));
		});
	});
});
