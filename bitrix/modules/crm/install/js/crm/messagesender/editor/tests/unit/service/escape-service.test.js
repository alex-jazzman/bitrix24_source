import { describe, it } from 'mocha';
import { assert } from 'chai';
import { EscapeService } from '../../../src/service/escape-service';

describe('crm.messagesender.editor: EscapeService', () => {
	const service = new EscapeService();

	describe('encode', () => {
		it('encodes { and } as HTML numeric entities', () => {
			assert.strictEqual(service.encode('{foo}'), '\u0026#123;foo\u0026#125;');
		});

		it('leaves plain text untouched', () => {
			assert.strictEqual(service.encode('Hello, world!'), 'Hello, world!');
		});

		it('encodes multiple braces', () => {
			assert.strictEqual(
				service.encode('a {x} b {y} c'),
				'a \u0026#123;x\u0026#125; b \u0026#123;y\u0026#125; c',
			);
		});

		it('returns empty string as-is', () => {
			assert.strictEqual(service.encode(''), '');
		});

		it('returns empty string when input is not a string', () => {
			assert.strictEqual(service.encode(null), '');
			assert.strictEqual(service.encode(undefined), '');
			assert.strictEqual(service.encode(123), '');
		});

		it('does not touch [placeholder] BB tag body — only the literal braces', () => {
			const bb = '[placeholder code="DealId"]ID сделки[/placeholder] hello {foo}';
			assert.strictEqual(
				service.encode(bb),
				'[placeholder code="DealId"]ID сделки[/placeholder] hello \u0026#123;foo\u0026#125;',
			);
		});
	});

	describe('encode with known placeholder codes', () => {
		it('keeps a known placeholder token unescaped', () => {
			assert.strictEqual(service.encode('{Title}', ['Title']), '{Title}');
		});

		it('escapes unknown braces while keeping known placeholders', () => {
			assert.strictEqual(
				service.encode('Hi {Title}, code {Unknown} and a lone {', ['Title']),
				'Hi {Title}, code &#123;Unknown&#125; and a lone &#123;',
			);
		});

		it('keeps several distinct known placeholders', () => {
			assert.strictEqual(
				service.encode('{Title} / {DealId}', ['Title', 'DealId']),
				'{Title} / {DealId}',
			);
		});

		it('escapes everything when keepCodes is empty (blanket default)', () => {
			assert.strictEqual(service.encode('{Title}', []), '&#123;Title&#125;');
			assert.strictEqual(service.encode('{Title}'), '&#123;Title&#125;');
		});

		it('ignores empty / non-string codes in keepCodes', () => {
			assert.strictEqual(
				service.encode('{Title}', ['', null, undefined]),
				'&#123;Title&#125;',
			);
		});

		it('encode(body, keepCodes) → decode is identity', () => {
			const original = 'Hi {Title}, junk {Unknown}';
			assert.strictEqual(service.decode(service.encode(original, ['Title'])), original);
		});
	});

	describe('decode', () => {
		it('decodes &#123; / &#125; back to { / }', () => {
			assert.strictEqual(service.decode('\u0026#123;foo\u0026#125;'), '{foo}');
		});

		it('leaves plain text with raw braces untouched', () => {
			assert.strictEqual(service.decode('Hello, {foo}!'), 'Hello, {foo}!');
		});

		it('returns empty string as-is', () => {
			assert.strictEqual(service.decode(''), '');
		});

		it('returns empty string when input is not a string', () => {
			assert.strictEqual(service.decode(null), '');
			assert.strictEqual(service.decode(undefined), '');
		});
	});

	describe('round-trip', () => {
		it('encode → decode is identity for mixed text', () => {
			const original = 'Привет {FakeOne}, ваш ID: [placeholder code="DealId"]ID[/placeholder]';
			assert.strictEqual(service.decode(service.encode(original)), original);
		});

		it('encode(decode(encoded)) equals encoded', () => {
			const once = service.encode('{foo}');
			assert.strictEqual(service.encode(service.decode(once)), once);
		});
	});
});
