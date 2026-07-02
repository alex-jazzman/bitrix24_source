import {
	parseEnrichedAssetSyntax,
	findEnrichedAssetStart,
	parseAllEnrichedAssets,
	parseAttrs,
	splitInlineAssets,
	parseEnrichedAssetCell,
} from '../../src/extensions/attachments/enriched-asset-parser';

describe('enriched-asset-parser', () => {

	// ─── Category 1: parseEnrichedAssetSyntax — basic ────────────────────────

	describe('parseEnrichedAssetSyntax — basic', () => {
		it('should parse standard image syntax', () => {
			const input = '![photo](/api/attachments.redirect?id=abc){fileId=42 type="image"}\n';
			const result = parseEnrichedAssetSyntax(input, 0, 'block');

			assert(result !== null);
			assert(result.isImage === true);
			assert(result.label === 'photo');
			assert(result.url === '/api/attachments.redirect?id=abc');
			assert(result.attrsRaw === 'fileId=42 type="image"');
			assert(result.raw === input);
		});

		it('should parse standard file syntax', () => {
			const input = '[report.pdf](/url){fileId=55 type="file"}\n';
			const result = parseEnrichedAssetSyntax(input, 0, 'block');

			assert(result !== null);
			assert(result.isImage === false);
			assert(result.label === 'report.pdf');
			assert(result.url === '/url');
			assert(result.attrsRaw === 'fileId=55 type="file"');
		});

		it('should parse standard video syntax', () => {
			const input = '![video](/url){fileId=77 type="video"}\n';
			const result = parseEnrichedAssetSyntax(input, 0, 'block');

			assert(result !== null);
			assert(result.isImage === true);
			assert(result.label === 'video');
		});

		it('should accept 1-3 leading spaces in block mode', () => {
			const r1 = parseEnrichedAssetSyntax(' ![a](/u){f=1}\n', 0, 'block');
			assert(r1 !== null);

			const r2 = parseEnrichedAssetSyntax('  ![a](/u){f=1}\n', 0, 'block');
			assert(r2 !== null);

			const r3 = parseEnrichedAssetSyntax('   ![a](/u){f=1}\n', 0, 'block');
			assert(r3 !== null);
		});

		it('should reject 4+ leading spaces in block mode (code block)', () => {
			const result = parseEnrichedAssetSyntax('    ![a](/u){f=1}\n', 0, 'block');
			assert(result === null);
		});

		it('should include leading spaces in raw for block mode', () => {
			const input = '  ![a](/u){f=1}\n';
			const result = parseEnrichedAssetSyntax(input, 0, 'block');

			assert(result !== null);
			assert(result.raw === input);
		});
	});

	// ─── Category 2: nested brackets ──────────────────────────────────────────

	describe('parseEnrichedAssetSyntax — nested brackets', () => {
		it('should handle nested [] in label', () => {
			const input = '![photo [v2]](/url){fileId=1}\n';
			const result = parseEnrichedAssetSyntax(input, 0, 'block');

			assert(result !== null);
			assert(result.label === 'photo [v2]');
		});

		it('should handle deeply nested [] in label', () => {
			const input = '![a[b[c]]](/url){f=1}\n';
			const result = parseEnrichedAssetSyntax(input, 0, 'block');

			assert(result !== null);
			assert(result.label === 'a[b[c]]');
		});

		it('should handle nested () in URL', () => {
			const input = '[file](http://x.com/file(1).pdf){fileId=2}\n';
			const result = parseEnrichedAssetSyntax(input, 0, 'block');

			assert(result !== null);
			assert(result.url === 'http://x.com/file(1).pdf');
		});

		it('should handle nested {} in attrs (quoted value)', () => {
			const input = '[file](/url){name="file{1}.pdf" fileId=1}\n';
			const result = parseEnrichedAssetSyntax(input, 0, 'block');

			assert(result !== null);
			assert(result.attrsRaw === 'name="file{1}.pdf" fileId=1');
		});
	});

	// ─── Category 3: escaped characters ───────────────────────────────────────

	describe('parseEnrichedAssetSyntax — escapes', () => {
		it('should handle escaped \\] in label', () => {
			const input = '![photo\\]name](/url){f=1}\n';
			const result = parseEnrichedAssetSyntax(input, 0, 'block');

			assert(result !== null);
			assert(result.label === 'photo\\]name');
		});

		it('should handle escaped \\) in URL', () => {
			const input = '[file](/path\\)more){f=1}\n';
			const result = parseEnrichedAssetSyntax(input, 0, 'block');

			assert(result !== null);
			assert(result.url === '/path\\)more');
		});

		it('should handle escaped \\} in attrs', () => {
			const input = '[file](/url){name="a\\}b" f=1}\n';
			const result = parseEnrichedAssetSyntax(input, 0, 'block');

			assert(result !== null);
			assert(result.attrsRaw === 'name="a\\}b" f=1');
		});
	});

	// ─── Category 4: block mode specifics ──────────────────────────────────────

	describe('parseEnrichedAssetSyntax — block mode', () => {
		it('should consume trailing newline in raw', () => {
			const input = '![a](/u){f=1}\nmore text';
			const result = parseEnrichedAssetSyntax(input, 0, 'block');

			assert(result !== null);
			assert(result.raw === '![a](/u){f=1}\n');
		});

		it('should match at end of string without trailing newline', () => {
			const input = '![a](/u){f=1}';
			const result = parseEnrichedAssetSyntax(input, 0, 'block');

			assert(result !== null);
			assert(result.raw === '![a](/u){f=1}');
		});

		it('should consume trailing spaces before newline', () => {
			const input = '![a](/u){f=1}  \n';
			const result = parseEnrichedAssetSyntax(input, 0, 'block');

			assert(result !== null);
			assert(result.raw === input);
		});

		it('should reject trailing non-whitespace content after attrs', () => {
			const input = '![a](/u){f=1} extra\n';
			const result = parseEnrichedAssetSyntax(input, 0, 'block');

			assert(result === null);
		});
	});

	// ─── Category 5: inline mode specifics ─────────────────────────────────────

	describe('parseEnrichedAssetSyntax — inline mode', () => {
		it('should not require trailing newline', () => {
			const input = '![a](/u){f=1}';
			const result = parseEnrichedAssetSyntax(input, 0, 'inline');

			assert(result !== null);
			assert(result.raw === '![a](/u){f=1}');
		});

		it('should not consume trailing text', () => {
			const input = '![a](/u){f=1} some text after';
			const result = parseEnrichedAssetSyntax(input, 0, 'inline');

			assert(result !== null);
			assert(result.raw === '![a](/u){f=1}');
		});

		it('should not consume leading spaces in inline mode', () => {
			const input = '  ![a](/u){f=1}';
			const result = parseEnrichedAssetSyntax(input, 2, 'inline');

			assert(result !== null);
			assert(result.raw === '![a](/u){f=1}');
		});

		it('should allow more than 3 leading spaces in inline mode', () => {
			const input = '      ![a](/u){f=1}';
			const result = parseEnrichedAssetSyntax(input, 6, 'inline');

			assert(result !== null);
		});
	});

	// ─── Category 6: rejection cases ──────────────────────────────────────────

	describe('parseEnrichedAssetSyntax — rejection', () => {
		it('should return null for regular markdown link without {attrs}', () => {
			const result = parseEnrichedAssetSyntax('[link](/url)\n', 0, 'block');
			assert(result === null);
		});

		it('should return null for empty URL', () => {
			const result = parseEnrichedAssetSyntax('[name](){f=1}\n', 0, 'block');
			assert(result === null);
		});

		it('should return null for unclosed bracket', () => {
			const result = parseEnrichedAssetSyntax('[name(/url){f=1}\n', 0, 'block');
			assert(result === null);
		});

		it('should return null for unclosed paren', () => {
			const result = parseEnrichedAssetSyntax('[name](/url{f=1}\n', 0, 'block');
			assert(result === null);
		});

		it('should return null for unclosed brace', () => {
			const result = parseEnrichedAssetSyntax('[name](/url){f=1\n', 0, 'block');
			assert(result === null);
		});

		it('should accept empty label', () => {
			const result = parseEnrichedAssetSyntax('[](/url){f=1}\n', 0, 'block');
			assert(result !== null);
			assert(result.label === '');
		});

		it('should return null for gap between ] and (', () => {
			const result = parseEnrichedAssetSyntax('[name] (/url){f=1}\n', 0, 'block');
			assert(result === null);
		});

		it('should return null for gap between ) and {', () => {
			const result = parseEnrichedAssetSyntax('[name](/url) {f=1}\n', 0, 'block');
			assert(result === null);
		});
	});

	// ─── Category 7: findEnrichedAssetStart ──────────────────────────────────

	describe('findEnrichedAssetStart', () => {
		it('should return correct index for match at start', () => {
			const result = findEnrichedAssetStart('![a](/u){f=1}\n');
			assert(result === 0);
		});

		it('should return correct index for match mid-string', () => {
			const input = 'some text\n![a](/u){f=1}\n';
			const result = findEnrichedAssetStart(input);
			assert(result === 10); // index of `!` on second line
		});

		it('should return correct index with leading spaces', () => {
			const input = 'text\n  ![a](/u){f=1}\n';
			const result = findEnrichedAssetStart(input);
			assert(result === 5); // line start (spaces included)
		});

		it('should return -1 for no match', () => {
			const result = findEnrichedAssetStart('just plain text here');
			assert(result === -1);
		});

		it('should skip plain [link](url) without {', () => {
			const result = findEnrichedAssetStart('[link](/url)\nmore text');
			assert(result === -1);
		});

		it('should skip lines with 4+ leading spaces', () => {
			const result = findEnrichedAssetStart('    ![a](/u){f=1}\n');
			assert(result === -1);
		});

		it('should find match after skipping invalid candidates', () => {
			const input = '    [skip](/u){f=1}\n![a](/u){f=1}\n';
			const result = findEnrichedAssetStart(input);
			assert(result === 20); // start of second line
		});
	});

	// ─── Category 8: parseAllEnrichedAssets ───────────────────────────────────

	describe('parseAllEnrichedAssets', () => {
		it('should find single asset', () => {
			const input = '![a](/u){f=1}';
			const results = parseAllEnrichedAssets(input);

			assert(results.length === 1);
			assert(results[0].start === 0);
			assert(results[0].end === input.length);
			assert(results[0].match.label === 'a');
		});

		it('should find two assets with text between', () => {
			const input = '![a](/u1){f=1} text ![b](/u2){f=2}';
			const results = parseAllEnrichedAssets(input);

			assert(results.length === 2);
			assert(results[0].match.label === 'a');
			assert(results[1].match.label === 'b');
		});

		it('should find asset surrounded by text', () => {
			const input = 'prefix ![a](/u){f=1} suffix';
			const results = parseAllEnrichedAssets(input);

			assert(results.length === 1);
			assert(results[0].start === 7);
			assert(results[0].end === 20); // '![a](/u){f=1}'.length === 13, start=7, end=7+13=20
		});

		it('should return empty array for no assets', () => {
			const results = parseAllEnrichedAssets('just plain text [link](url)');
			assert(results.length === 0);
		});

		it('should handle adjacent assets without separator', () => {
			const input = '![a](/u1){f=1}![b](/u2){f=2}';
			const results = parseAllEnrichedAssets(input);

			assert(results.length === 2);
			assert(results[0].end === 14);
			assert(results[1].start === 14);
		});

		it('should correctly report start/end for text slicing', () => {
			const input = 'before ![img](/u){f=1} after';
			const results = parseAllEnrichedAssets(input);

			assert(results.length === 1);
			const textBefore = input.slice(0, results[0].start);
			const textAfter = input.slice(results[0].end);
			assert(textBefore === 'before ');
			assert(textAfter === ' after');
		});
	});

	// ─── Category 9: parseAttrs ──────────────────────────────────────────────

	describe('parseAttrs', () => {
		it('should parse unquoted value', () => {
			const attrs = parseAttrs('fileId=42');
			assert(attrs.fileId === '42');
		});

		it('should parse quoted value', () => {
			const attrs = parseAttrs('type="image"');
			assert(attrs.type === 'image');
		});

		it('should parse multiple attributes', () => {
			const attrs = parseAttrs('fileId=42 documentId=10 type="image" name="photo.jpg"');

			assert(attrs.fileId === '42');
			assert(attrs.documentId === '10');
			assert(attrs.type === 'image');
			assert(attrs.name === 'photo.jpg');
		});

		it('should handle quoted value with spaces', () => {
			const attrs = parseAttrs('name="my photo.jpg"');
			assert(attrs.name === 'my photo.jpg');
		});

		it('should handle mixed quoted and unquoted', () => {
			const attrs = parseAttrs('size=1024 mimeType="image/jpeg"');
			assert(attrs.size === '1024');
			assert(attrs.mimeType === 'image/jpeg');
		});
	});

	// ─── Category 10: parseEnrichedAssetCell (integration) ────────────────────

	describe('parseEnrichedAssetCell', () => {
		it('should parse whole-cell image asset', () => {
			const result = parseEnrichedAssetCell('![photo](/url){fileId=42 documentId=10 type="image" name="photo.jpg" size=1024 mimeType="image/jpeg"}');

			assert(result !== null);
			assert(result.type === 'imageAttachment');
			assert(result.attrs.fileId === 42);
			assert(result.attrs.documentId === 10);
			assert(result.attrs.name === 'photo.jpg');
			assert(result.attrs.size === 1024);
			assert(result.attrs.mimeType === 'image/jpeg');
		});

		it('should parse whole-cell file asset', () => {
			const result = parseEnrichedAssetCell('[report.pdf](/url){fileId=55 documentId=5 type="file" name="report.pdf"}');

			assert(result !== null);
			assert(result.type === 'fileAttachment');
			assert(result.attrs.fileId === 55);
		});

		it('should handle surrounding whitespace', () => {
			const result = parseEnrichedAssetCell('  ![a](/url){fileId=1 type="image"}  ');

			assert(result !== null);
			assert(result.type === 'imageAttachment');
		});

		it('should return null for non-matching cell', () => {
			const result = parseEnrichedAssetCell('just some text');
			assert(result === null);
		});

		it('should return null for plain markdown link without attrs', () => {
			const result = parseEnrichedAssetCell('[link](/url)');
			assert(result === null);
		});

		it('should return null for unknown asset type', () => {
			const result = parseEnrichedAssetCell('![a](/url){fileId=1 type="unknown"}');
			assert(result === null);
		});

		it('should handle nested parens in URL', () => {
			const result = parseEnrichedAssetCell('![a](http://x.com/file(1).pdf){fileId=1 type="image"}');

			assert(result !== null);
			assert(result.type === 'imageAttachment');
		});

		it('should return null for empty string', () => {
			const result = parseEnrichedAssetCell('');
			assert(result === null);
		});

		it('should use label as fallback name', () => {
			const result = parseEnrichedAssetCell('![my-photo](/url){fileId=1 type="image"}');

			assert(result !== null);
			assert(result.attrs.name === 'my-photo');
		});
	});

	// ─── Category 11: splitInlineAssets ───────────────────────────────────────

	describe('splitInlineAssets', () => {
		it('should split text before asset onto separate line', () => {
			const input = 'sad ![img](/url){f=1}';
			const result = splitInlineAssets(input);

			assert(result === 'sad\n\n![img](/url){f=1}');
		});

		it('should split text after asset onto separate line', () => {
			const input = '![img](/url){f=1} text after';
			const result = splitInlineAssets(input);

			assert(result === '![img](/url){f=1}\n\ntext after');
		});

		it('should split text before and after asset', () => {
			const input = 'before ![img](/url){f=1} after';
			const result = splitInlineAssets(input);

			assert(result === 'before\n\n![img](/url){f=1}\n\nafter');
		});

		it('should leave standalone asset unchanged', () => {
			const input = '![img](/url){f=1}';
			const result = splitInlineAssets(input);

			assert(result === '![img](/url){f=1}');
		});

		it('should leave standalone asset with whitespace unchanged', () => {
			const input = '  ![img](/url){f=1}  ';
			const result = splitInlineAssets(input);

			assert(result === '  ![img](/url){f=1}  ');
		});

		it('should leave lines without assets unchanged', () => {
			const input = 'just text\nanother line';
			const result = splitInlineAssets(input);

			assert(result === 'just text\nanother line');
		});

		it('should handle multi-line input with mixed lines', () => {
			const input = 'paragraph one\nsad ![img](/url){f=1}\nparagraph three';
			const result = splitInlineAssets(input);

			assert(result === 'paragraph one\nsad\n\n![img](/url){f=1}\nparagraph three');
		});

		it('should handle real callout body with inline asset', () => {
			const input = 'sad ![dsaddas](/api/url){fileId=6078 documentId=230 type="image" name="photo.jpg" size=101202 mimeType="image/jpeg"}\n\ndsadasd\n\nds';
			const result = splitInlineAssets(input);
			const lines = result.split('\n');

			// "sad" should be on its own line, then empty line, then the asset
			assert(lines[0] === 'sad');
			assert(lines[1] === '');
			assert(lines[2].startsWith('![dsaddas]'));
			// Rest of content preserved
			assert(result.includes('dsadasd'));
			assert(result.includes('ds'));
		});

		it('should handle two assets on one line', () => {
			const input = '![a](/u1){f=1} ![b](/u2){f=2}';
			const result = splitInlineAssets(input);

			assert(result === '![a](/u1){f=1}\n\n![b](/u2){f=2}');
		});
	});
});
