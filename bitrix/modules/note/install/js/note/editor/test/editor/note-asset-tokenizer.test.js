import { NoteAssetTokenizer } from '../../src/extensions/attachments/note-asset-tokenizer';
import { ImageAttachment } from '../../src/extensions/attachments/image';
import { Video } from '../../src/extensions/attachments/video';

// The block tokenizer handles all asset types (image/file/video), each owning its own line and
// producing a bare top-level block node. Images are block nodes again — no paragraph wrapping,
// no separate inline tokenizer.
describe('note-asset-tokenizer — block image/file/video', () => {

	const tokenize = (src) => NoteAssetTokenizer.config.markdownTokenizer.tokenize(src);
	const parse = (attrs) => NoteAssetTokenizer.config.parseMarkdown({
		type: 'noteAsset',
		raw: '',
		attrs,
	});

	it('tokenizes an image token as a block', () => {
		const token = tokenize('[[image fileId=42]]\n');
		assert(token !== null);
		assert(token.attrs.assetType === 'image');
		assert(token.attrs.fileId === 42);
	});

	it('carries image width and align on the token', () => {
		const token = tokenize('[[image fileId=42 width=50 align=left]]\n');
		assert(token.attrs.width === 50);
		assert(token.attrs.align === 'left');
	});

	it('clamps width over 100 (legacy px) down to 100', () => {
		const token = tokenize('[[image fileId=42 width=280]]\n');
		assert(token.attrs.width === 100);
	});

	it('tokenizes a video token as a block', () => {
		const token = tokenize('[[video fileId=7]]\n');
		assert(token !== null);
		assert(token.attrs.assetType === 'video');
		assert(token.attrs.fileId === 7);
	});

	it('tokenizes a file token as a block', () => {
		const token = tokenize('[[file fileId=9]]\n');
		assert(token !== null);
		assert(token.attrs.assetType === 'file');
	});

	it('does not tokenize an image not on its own line', () => {
		assert(tokenize('[[image fileId=42]]rest') === null);
	});

	it('parses an image asset as a bare block node with width/align', () => {
		const node = parse({ assetType: 'image', fileId: 42, width: 300, align: 'left' });
		assert(node.type === 'imageAttachment');
		assert(node.attrs.fileId === 42);
		assert(node.attrs.width === 300);
		assert(node.attrs.align === 'left');
	});

	it('defaults image width/align to null when absent', () => {
		const node = parse({ assetType: 'image', fileId: 42 });
		assert(node.attrs.width === null);
		assert(node.attrs.align === null);
	});

	it('keeps a video asset as a top-level block', () => {
		const node = parse({ assetType: 'video', fileId: 7 });
		assert(node.type === 'video');
		assert(node.attrs.fileId === 7);
	});

	it('carries video width and align (resizable media)', () => {
		const node = parse({ assetType: 'video', fileId: 7, width: 60, align: 'right' });
		assert(node.type === 'video');
		assert(node.attrs.width === 60);
		assert(node.attrs.align === 'right');
	});

	it('does not carry width/align onto a file asset', () => {
		const node = parse({ assetType: 'file', fileId: 9, width: 60, align: 'right' });
		assert(node.attrs.width === undefined);
		assert(node.attrs.align === undefined);
	});

	it('keeps a file asset as a top-level block', () => {
		const node = parse({ assetType: 'file', fileId: 9 });
		assert(node.type === 'fileAttachment');
		assert(node.attrs.fileId === 9);
	});

	it('returns null for an unknown asset type', () => {
		assert(parse({ assetType: 'bogus', fileId: 1 }) === null);
	});
});

describe('imageAttachment — renderMarkdown round-trip', () => {

	const render = (attrs) => ImageAttachment.config.renderMarkdown({ attrs });

	it('serializes fileId without width', () => {
		assert(render({ fileId: 42, width: null }) === '[[image fileId=42]]');
	});

	it('serializes width (percent) when set', () => {
		assert(render({ fileId: 42, width: 50 }) === '[[image fileId=42 width=50]]');
	});

	it('omits width when zero or invalid', () => {
		assert(render({ fileId: 42, width: 0 }) === '[[image fileId=42]]');
	});

	it('omits width above 100 (percent out of range)', () => {
		assert(render({ fileId: 42, width: 420 }) === '[[image fileId=42]]');
	});

	it('serializes align when left/right', () => {
		assert(render({ fileId: 42, width: null, align: 'right' }) === '[[image fileId=42 align=right]]');
	});

	it('serializes width and align together', () => {
		assert(render({ fileId: 42, width: 60, align: 'left' }) === '[[image fileId=42 width=60 align=left]]');
	});

	it('omits align when null or center', () => {
		assert(render({ fileId: 42, width: null, align: null }) === '[[image fileId=42]]');
		assert(render({ fileId: 42, width: null, align: 'center' }) === '[[image fileId=42]]');
	});

	it('returns empty string without a valid fileId', () => {
		assert(render({ fileId: 0, width: 100 }) === '');
	});
});

describe('video — renderMarkdown round-trip', () => {

	const render = (attrs) => Video.config.renderMarkdown({ attrs });

	it('serializes width and align for video', () => {
		assert(render({ fileId: 7, width: 60, align: 'right' }) === '[[video fileId=7 width=60 align=right]]');
	});

	it('serializes fileId only when no presentation attrs', () => {
		assert(render({ fileId: 7, width: null, align: null }) === '[[video fileId=7]]');
	});
});
