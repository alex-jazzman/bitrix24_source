import {
	findCalloutStart,
	parseCalloutBlock,
	dedentBody,
} from '../../src/extensions/callout-parser';

describe('callout-parser', () => {

	// ─── findCalloutStart ────────────────────────────────────────────────

	describe('findCalloutStart', () => {
		it('should find :::info at the start of string', () => {
			assert.strictEqual(findCalloutStart(':::info\ntext\n:::\n'), 0);
		});

		it('should find :::warning after other text', () => {
			assert.strictEqual(findCalloutStart('Some text\n:::warning\nbody\n:::\n'), 10);
		});

		it('should find indented :::tip', () => {
			assert.strictEqual(findCalloutStart('text\n    :::tip\nbody\n    :::\n'), 5);
		});

		it('should return -1 for unknown type', () => {
			assert.strictEqual(findCalloutStart(':::other\ntext\n:::\n'), -1);
		});

		it('should return -1 for no callout', () => {
			assert.strictEqual(findCalloutStart('just some text\nno callouts here\n'), -1);
		});

		it('should not match :::infos (type not terminated)', () => {
			assert.strictEqual(findCalloutStart(':::infos\n'), -1);
		});

		it('should match :::info with trailing space', () => {
			assert.strictEqual(findCalloutStart(':::info \ntext\n:::\n'), 0);
		});

		it('should find :::success', () => {
			assert.strictEqual(findCalloutStart(':::success\ntext\n:::\n'), 0);
		});

		it('should find all four types', () => {
			for (const type of ['info', 'success', 'warning', 'tip'])
			{
				assert(findCalloutStart(`:::${type}\ntext\n:::\n`) >= 0, `should find :::${type}`);
			}
		});
	});

	// ─── parseCalloutBlock ───────────────────────────────────────────────

	describe('parseCalloutBlock — basic', () => {
		it('should parse simple callout', () => {
			const result = parseCalloutBlock(':::info\nSome text\n:::\n');
			assert(result !== null);
			assert.strictEqual(result.calloutType, 'info');
			assert.strictEqual(result.body, 'Some text');
			assert.strictEqual(result.raw, ':::info\nSome text\n:::\n');
			assert.strictEqual(result.indent, '');
		});

		it('should parse callout with empty body', () => {
			const result = parseCalloutBlock(':::tip\n:::\n');
			assert(result !== null);
			assert.strictEqual(result.calloutType, 'tip');
			assert.strictEqual(result.body, '');
		});

		it('should parse callout with multiple body lines', () => {
			const result = parseCalloutBlock(':::warning\nLine 1\nLine 2\nLine 3\n:::\n');
			assert(result !== null);
			assert.strictEqual(result.calloutType, 'warning');
			assert.strictEqual(result.body, 'Line 1\nLine 2\nLine 3');
		});

		it('should parse callout with blank line in body', () => {
			const result = parseCalloutBlock(':::info\nBefore\n\nAfter\n:::\n');
			assert(result !== null);
			assert.strictEqual(result.body, 'Before\n\nAfter');
		});

		it('should not consume text after closing :::', () => {
			const src = ':::info\nContent\n:::\nAfter text\n';
			const result = parseCalloutBlock(src);
			assert(result !== null);
			const remaining = src.slice(result.raw.length);
			assert.strictEqual(remaining, 'After text\n');
		});

		it('should not consume blank lines after closing :::', () => {
			const src = ':::info\nContent\n:::\n\nNext paragraph\n';
			const result = parseCalloutBlock(src);
			assert(result !== null);
			const remaining = src.slice(result.raw.length);
			assert.strictEqual(remaining, '\nNext paragraph\n');
		});
	});

	describe('parseCalloutBlock — indentation', () => {
		it('should parse callout with indented closing ::: and dedent body', () => {
			const result = parseCalloutBlock(':::warning\n    Problem text\n    :::\n');
			assert(result !== null);
			assert.strictEqual(result.calloutType, 'warning');
			assert.strictEqual(result.body, 'Problem text');
		});

		it('should parse fully indented callout and dedent body', () => {
			const result = parseCalloutBlock('    :::warning\n    Body text\n    :::\n');
			assert(result !== null);
			assert.strictEqual(result.indent, '    ');
			assert.strictEqual(result.calloutType, 'warning');
			assert.strictEqual(result.body, 'Body text');
		});

		it('should dedent multi-line body with consistent indent', () => {
			const result = parseCalloutBlock('    :::info\n    Line 1\n    Line 2\n    :::\n');
			assert(result !== null);
			assert.strictEqual(result.body, 'Line 1\nLine 2');
		});

		it('should preserve lines with less indent than opening', () => {
			const result = parseCalloutBlock('    :::info\n    Indented\nNot indented\n    :::\n');
			assert(result !== null);
			assert.strictEqual(result.body, 'Indented\nNot indented');
		});

		it('should handle tab indent', () => {
			const result = parseCalloutBlock('\t:::tip\n\tBody\n\t:::\n');
			assert(result !== null);
			assert.strictEqual(result.indent, '\t');
			assert.strictEqual(result.body, 'Body');
		});
	});

	describe('parseCalloutBlock — edge cases', () => {
		it('should return null for unknown type', () => {
			assert.strictEqual(parseCalloutBlock(':::danger\ntext\n:::\n'), null);
		});

		it('should return null for unclosed callout', () => {
			assert.strictEqual(parseCalloutBlock(':::info\ntext without closing\n'), null);
		});

		it('should return null for empty input', () => {
			assert.strictEqual(parseCalloutBlock(''), null);
		});

		it('should not match closing ::: with text after it', () => {
			const result = parseCalloutBlock(':::info\nBody\n:::not-closing\nMore body\n:::\n');
			assert(result !== null);
			assert.strictEqual(result.body, 'Body\n:::not-closing\nMore body');
		});

		it('should match closing ::: at end of string without trailing newline', () => {
			const result = parseCalloutBlock(':::info\nBody\n:::');
			assert(result !== null);
			assert.strictEqual(result.body, 'Body');
			assert.strictEqual(result.raw, ':::info\nBody\n:::');
		});

		it('should parse callout with markdown formatting in body', () => {
			const result = parseCalloutBlock(':::info\n**Bold** and *italic*\n:::\n');
			assert(result !== null);
			assert.strictEqual(result.body, '**Bold** and *italic*');
		});

		it('should handle callout type with trailing space on opening line', () => {
			const result = parseCalloutBlock(':::info   \nBody\n:::\n');
			assert(result !== null);
			assert.strictEqual(result.calloutType, 'info');
			assert.strictEqual(result.body, 'Body');
		});

		it('should handle closing ::: with trailing spaces', () => {
			const result = parseCalloutBlock(':::info\nBody\n:::   \n');
			assert(result !== null);
			assert.strictEqual(result.body, 'Body');
		});
	});

	describe('parseCalloutBlock — real-world documents', () => {
		it('should parse callout followed by heading', () => {
			const src = ':::info\nОсновной показатель **28.7%**.\n\n:::\n\n### Топ-3\n';
			const result = parseCalloutBlock(src);
			assert(result !== null);
			assert.strictEqual(result.calloutType, 'info');
			const remaining = src.slice(result.raw.length);
			assert(remaining.includes('### Топ-3'), 'heading should remain after callout');
		});

		it('should parse callout inside list item and dedent body', () => {
			const src = ':::warning\n    На момент написания документации есть проблема.\n\n    :::\n';
			const result = parseCalloutBlock(src);
			assert(result !== null);
			assert.strictEqual(result.calloutType, 'warning');
			assert.strictEqual(result.body, 'На момент написания документации есть проблема.\n');
		});

		it('should parse deeply indented callout', () => {
			const src = '       :::warning\n       Это обязательно.\n\n       :::\n';
			const result = parseCalloutBlock(src);
			assert(result !== null);
			assert.strictEqual(result.calloutType, 'warning');
			assert.strictEqual(result.body, 'Это обязательно.\n');
		});

		it('should not swallow content between two callouts', () => {
			const src = ':::info\nFirst callout\n:::\n\nParagraph between\n\n:::tip\nSecond callout\n:::\n';
			const result = parseCalloutBlock(src);
			assert(result !== null);
			assert.strictEqual(result.calloutType, 'info');
			assert.strictEqual(result.body, 'First callout');
			const remaining = src.slice(result.raw.length);
			assert(remaining.includes('Paragraph between'), 'text between callouts must survive');
			assert(remaining.includes(':::tip'), 'second callout must survive');
		});

		it('should dedent body from real document — ::: at col 0, body indented 4 spaces', () => {
			const src = ':::warning\n    На момент написания документации есть проблема с дублированием пакета копилота на год. Из двух вариантов `[COPILOT_BOX_Q1000_P12]` и `[COPILOT_Q1000_P12]` нужно выбрать с **BOX** \n\n    :::\n';
			const result = parseCalloutBlock(src);
			assert(result !== null);
			// Body must NOT have 4-space indent (would become code block in marked)
			assert(!result.body.startsWith('    '), 'body must not start with 4 spaces');
			assert(result.body.startsWith('На момент'), 'body starts with dedented text');
		});
	});

	// ─── dedentBody ──────────────────────────────────────────────────────

	describe('dedentBody', () => {
		it('should strip common 4-space indent', () => {
			assert.strictEqual(dedentBody('    line1\n    line2'), 'line1\nline2');
		});

		it('should not strip when no common indent', () => {
			assert.strictEqual(dedentBody('line1\n    line2'), 'line1\n    line2');
		});

		it('should skip empty lines for indent calculation', () => {
			assert.strictEqual(dedentBody('    line1\n\n    line2'), 'line1\n\nline2');
		});

		it('should return unchanged when no indent', () => {
			assert.strictEqual(dedentBody('line1\nline2'), 'line1\nline2');
		});

		it('should handle single line', () => {
			assert.strictEqual(dedentBody('    hello'), 'hello');
		});

		it('should handle tab indent', () => {
			assert.strictEqual(dedentBody('\tline1\n\tline2'), 'line1\nline2');
		});

		it('should handle empty string', () => {
			assert.strictEqual(dedentBody(''), '');
		});

		it('should handle mixed indent — use minimum', () => {
			assert.strictEqual(dedentBody('    line1\n        line2'), 'line1\n    line2');
		});
	});
});
