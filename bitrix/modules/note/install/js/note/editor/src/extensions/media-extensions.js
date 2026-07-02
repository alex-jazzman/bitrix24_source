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

export function createMediaExtensions(): Object[]
{
	const SafeImage = createSafeImageExtension();

	return [
		SafeImage,
		UploadAsset,
		FileAttachment,
		ImageAttachment,
		Video,
	];
}
