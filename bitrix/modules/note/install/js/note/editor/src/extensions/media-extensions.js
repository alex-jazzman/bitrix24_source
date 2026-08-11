import { Image } from '@tiptap/extension-image';
import { sanitizeUrl } from '../utils/url';
import { FileAttachment, ImageAttachment, UploadAsset, Video } from './attachments';

function createSafeImageExtension(): Object
{
	return Image.extend({
		addAttributes()
		{
			return {
				...this.parent?.(),
				src: {
					default: null,
					parseHTML: (element) => sanitizeUrl(element.getAttribute('src')),
					renderHTML: (attrs) => {
						const safeSrc = sanitizeUrl(attrs.src);

						return safeSrc ? { src: safeSrc } : {};
					},
				},
			};
		},
	});
}

export function createMediaExtensions(uploadService: Object | null = null): Object[]
{
	// SafeImage handles raw markdown `![](url)` images only; inline so they coexist with text in a
	// paragraph and keep the lexer's inline image tokens schema-legal. imageAttachment/video are block.
	const SafeImage = createSafeImageExtension().configure({ inline: true });

	return [
		SafeImage,
		UploadAsset,
		FileAttachment,
		// uploadService powers the in-place "replace image" action in the node-view overlay.
		ImageAttachment.configure({ uploadService }),
		Video,
	];
}
