import {
	parseNoteAssetSyntax,
	findNoteAssetStart,
	ASSET_TYPE_TO_NODE,
} from '../../src/extensions/attachments/note-asset-parser';

describe('note-asset-parser', () => {

	describe('parseNoteAssetSyntax — accepts canonical form', () => {

		it('parses image', () => {
			const result = parseNoteAssetSyntax('[[image fileId=42]]\n', 0);
			assert(result !== null);
			assert(result.assetType === 'image');
			assert(result.fileId === 42);
			assert(result.raw === '[[image fileId=42]]\n');
		});

		it('parses file', () => {
			const result = parseNoteAssetSyntax('[[file fileId=7]]\n', 0);
			assert(result !== null);
			assert(result.assetType === 'file');
			assert(result.fileId === 7);
		});

		it('parses video', () => {
			const result = parseNoteAssetSyntax('[[video fileId=100]]\n', 0);
			assert(result !== null);
			assert(result.assetType === 'video');
			assert(result.fileId === 100);
		});

		it('parses at end-of-file without trailing newline', () => {
			const result = parseNoteAssetSyntax('[[image fileId=1]]', 0);
			assert(result !== null);
			assert(result.fileId === 1);
		});

		it('accepts trailing spaces/tabs before newline', () => {
			const result = parseNoteAssetSyntax('[[image fileId=42]]  \n', 0);
			assert(result !== null);
			assert(result.fileId === 42);
		});

		it('accepts up to 3 leading spaces', () => {
			const result = parseNoteAssetSyntax('   [[image fileId=42]]\n', 0);
			assert(result !== null);
			assert(result.fileId === 42);
		});

		it('parses optional width attribute (percent)', () => {
			const result = parseNoteAssetSyntax('[[image fileId=42 width=50]]\n', 0);
			assert(result !== null);
			assert(result.fileId === 42);
			assert(result.width === 50);
		});

		it('clamps width over 100 (legacy px) down to 100', () => {
			const result = parseNoteAssetSyntax('[[image fileId=42 width=420]]\n', 0);
			assert(result !== null);
			assert(result.width === 100);
		});

		it('width is null when omitted', () => {
			const result = parseNoteAssetSyntax('[[image fileId=42]]\n', 0);
			assert(result !== null);
			assert(result.width === null);
		});

		it('parses optional align attribute', () => {
			const result = parseNoteAssetSyntax('[[image fileId=42 align=left]]\n', 0);
			assert(result !== null);
			assert(result.align === 'left');
		});

		it('parses width and align together', () => {
			const result = parseNoteAssetSyntax('[[image fileId=42 width=60 align=right]]\n', 0);
			assert(result !== null);
			assert(result.width === 60);
			assert(result.align === 'right');
		});

		it('align is null when omitted', () => {
			const result = parseNoteAssetSyntax('[[image fileId=42]]\n', 0);
			assert(result !== null);
			assert(result.align === null);
		});

		it('normalizes align=center to null (default, never serialized)', () => {
			const result = parseNoteAssetSyntax('[[image fileId=42 align=center]]\n', 0);
			assert(result !== null);
			assert(result.align === null);
		});
	});

	describe('parseNoteAssetSyntax — align rejection', () => {

		it('rejects unknown align value', () => {
			assert(parseNoteAssetSyntax('[[image fileId=42 align=top]]\n', 0) === null);
		});

		it('rejects empty align value', () => {
			assert(parseNoteAssetSyntax('[[image fileId=42 align=]]\n', 0) === null);
		});
	});

	describe('parseNoteAssetSyntax — width rejection', () => {

		it('rejects zero width', () => {
			assert(parseNoteAssetSyntax('[[image fileId=42 width=0]]\n', 0) === null);
		});

		it('rejects negative width', () => {
			assert(parseNoteAssetSyntax('[[image fileId=42 width=-5]]\n', 0) === null);
		});

		it('rejects non-numeric width', () => {
			assert(parseNoteAssetSyntax('[[image fileId=42 width=abc]]\n', 0) === null);
		});

		it('rejects unknown attribute alongside fileId', () => {
			assert(parseNoteAssetSyntax('[[image fileId=42 height=10]]\n', 0) === null);
		});
	});

	describe('parseNoteAssetSyntax — rejection', () => {

		it('rejects CamelCase type', () => {
			assert(parseNoteAssetSyntax('[[Image fileId=1]]\n', 0) === null);
		});

		it('rejects unknown type', () => {
			assert(parseNoteAssetSyntax('[[audio fileId=1]]\n', 0) === null);
		});

		it('rejects extra attribute', () => {
			assert(parseNoteAssetSyntax('[[image fileId=1 alt="x"]]\n', 0) === null);
		});

		it('rejects non-numeric fileId', () => {
			assert(parseNoteAssetSyntax('[[image fileId=abc]]\n', 0) === null);
		});

		it('rejects zero fileId', () => {
			assert(parseNoteAssetSyntax('[[image fileId=0]]\n', 0) === null);
		});

		it('rejects negative fileId', () => {
			assert(parseNoteAssetSyntax('[[image fileId=-5]]\n', 0) === null);
		});

		it('rejects inline form (text before, no newline before)', () => {
			assert(parseNoteAssetSyntax('text [[image fileId=1]]\n', 0) === null);
		});

		it('rejects inline form (text after on same line)', () => {
			assert(parseNoteAssetSyntax('[[image fileId=1]] text\n', 0) === null);
		});

		it('rejects multiple spaces between tokens', () => {
			assert(parseNoteAssetSyntax('[[image  fileId=1]]\n', 0) === null);
		});
	});

	describe('findNoteAssetStart', () => {

		it('returns 0 for line-start asset', () => {
			assert(findNoteAssetStart('[[image fileId=1]]\n') === 0);
		});

		it('finds asset on second line', () => {
			const src = 'hello\n[[file fileId=2]]\n';
			assert(findNoteAssetStart(src) === 6);
		});

		it('returns -1 when no [[ present', () => {
			assert(findNoteAssetStart('plain text') === -1);
		});

		it('skips non-line-start [[ occurrences', () => {
			// "x[[image fileId=1]]" should be skipped because previous char is not \n
			assert(findNoteAssetStart('x[[image fileId=1]]') === -1);
		});

		it('tolerates up to 3 leading spaces and returns the line start', () => {
			assert(findNoteAssetStart('   [[image fileId=1]]\n') === 0);
			const src = 'hello\n  [[file fileId=2]]\n';
			assert(findNoteAssetStart(src) === 6);
		});

		it('rejects 4+ leading spaces (indented code block)', () => {
			assert(findNoteAssetStart('    [[image fileId=1]]\n') === -1);
		});
	});

	describe('ASSET_TYPE_TO_NODE', () => {

		it('maps to ProseMirror node names', () => {
			assert(ASSET_TYPE_TO_NODE.image === 'imageAttachment');
			assert(ASSET_TYPE_TO_NODE.file === 'fileAttachment');
			assert(ASSET_TYPE_TO_NODE.video === 'video');
		});
	});
});
