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
	});

	describe('ASSET_TYPE_TO_NODE', () => {

		it('maps to ProseMirror node names', () => {
			assert(ASSET_TYPE_TO_NODE.image === 'imageAttachment');
			assert(ASSET_TYPE_TO_NODE.file === 'fileAttachment');
			assert(ASSET_TYPE_TO_NODE.video === 'video');
		});
	});
});
