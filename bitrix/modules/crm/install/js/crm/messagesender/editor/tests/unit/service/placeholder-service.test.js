import { describe, it } from 'mocha';
import { assert } from 'chai';
import { PlaceholderService } from '../../../src/service/placeholder-service';
import { EscapeService } from '../../../src/service/escape-service';

describe('crm.messagesender.editor: PlaceholderService', () => {
	const service = new PlaceholderService();

	describe('getKnownCodes', () => {
		it('keeps codes of selector-filled placeholders (FIELD_NAME)', () => {
			const state = { template: { FILLED_PLACEHOLDERS: [{ FIELD_NAME: 'Title' }, { FIELD_NAME: 'DealId' }] } };
			assert.deepStrictEqual(service.getKnownCodes(state), ['Title', 'DealId']);
		});

		it('drops manually-filled placeholders (FIELD_VALUE, no FIELD_NAME)', () => {
			const state = {
				template: {
					FILLED_PLACEHOLDERS: [
						{ FIELD_NAME: 'Title' },
						{ FIELD_VALUE: 'hand-typed value' },
						{ FIELD_NAME: '' },
					],
				},
			};
			assert.deepStrictEqual(service.getKnownCodes(state), ['Title']);
		});

		it('returns [] when there is no template (custom-text message)', () => {
			assert.deepStrictEqual(service.getKnownCodes({ message: { body: 'x' } }), []);
			assert.deepStrictEqual(service.getKnownCodes(null), []);
			assert.deepStrictEqual(service.getKnownCodes(undefined), []);
		});

		it('returns [] for empty / missing FILLED_PLACEHOLDERS', () => {
			assert.deepStrictEqual(service.getKnownCodes({ template: {} }), []);
			assert.deepStrictEqual(service.getKnownCodes({ template: { FILLED_PLACEHOLDERS: [] } }), []);
		});
	});

	describe('production regression path (state → codes → encode)', () => {
		const escapeService = new EscapeService();

		const encodeFromState = (state) => {
			return escapeService.encode(state.message.body, service.getKnownCodes(state));
		};

		it('keeps the selector placeholder, escapes the unknown one', () => {
			const state = {
				template: { FILLED_PLACEHOLDERS: [{ FIELD_NAME: 'Title' }] },
				message: { body: 'Hi {Title}, {Unknown}' },
			};
			assert.strictEqual(encodeFromState(state), 'Hi {Title}, &#123;Unknown&#125;');
		});

		it('escapes everything for a custom-text message (no template)', () => {
			const state = { message: { body: 'Hi {Title}, {Unknown}' } };
			assert.strictEqual(encodeFromState(state), 'Hi &#123;Title&#125;, &#123;Unknown&#125;');
		});

		it('does not keep a code that was only filled manually', () => {
			const state = {
				template: { FILLED_PLACEHOLDERS: [{ FIELD_NAME: 'Title' }, { FIELD_VALUE: 'Deal' }] },
				message: { body: '{Title} {Deal}' },
			};
			assert.strictEqual(encodeFromState(state), '{Title} &#123;Deal&#125;');
		});
	});
});
