import { EnrichedAssetTokenizer } from '../../src/extensions/attachments/enriched-asset-tokenizer';

// All asset nodes (image/file/video) are block-level, so an enriched image token resolves to a
// bare top-level imageAttachment node — no paragraph wrapping.
describe('enriched-asset-tokenizer — block assets', () => {

	const parse = (attrs) => EnrichedAssetTokenizer.config.parseMarkdown({
		type: 'enrichedAsset',
		raw: '',
		attrs,
	});

	it('parses an image asset as a bare block node', () => {
		const node = parse({ type: 'image', fileId: '42', documentId: '3', name: 'pic', size: '10', mimeType: 'image/png' });
		assert(node.type === 'imageAttachment');
		assert(node.attrs.fileId === 42);
	});

	it('keeps a video asset as a top-level block', () => {
		const node = parse({ type: 'video', fileId: '7', documentId: '3' });
		assert(node.type === 'video');
		assert(node.attrs.fileId === 7);
	});

	it('keeps a file asset as a top-level block', () => {
		const node = parse({ type: 'file', fileId: '9', documentId: '3' });
		assert(node.type === 'fileAttachment');
		assert(node.attrs.fileId === 9);
	});

	it('returns null for an unknown asset type', () => {
		const node = parse({ type: 'bogus', fileId: '1' });
		assert(node === null);
	});
});
