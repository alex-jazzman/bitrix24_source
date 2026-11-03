import { getArrayBuffer } from '../get-array-buffer';
import { compareBuffers } from './compare-buffers';
import { convertStringToBuffer } from './convert-string-to-buffer';
import { ImageFormats, type ImageFormat } from './image-format';

type SignaturePart = {
	offset: number;
	bytes: ArrayLike<number>;
};

type FormatSignature = {
	format: ImageFormat;
	parts: SignaturePart[];
};

// Every part is matched at a fixed offset from the start of the file. A search through the content
// would take a tiff with a jpeg embedded at offset 8 for a jpeg file.
const formatSignatures: FormatSignature[] = [
	{ format: ImageFormats.Gif, parts: [{ offset: 0, bytes: convertStringToBuffer('GIF87a') }] },
	{ format: ImageFormats.Gif, parts: [{ offset: 0, bytes: convertStringToBuffer('GIF89a') }] },
	{ format: ImageFormats.Png, parts: [{ offset: 0, bytes: convertStringToBuffer('\x89PNG\r\n\x1A\n') }] },
	{ format: ImageFormats.Bmp, parts: [{ offset: 0, bytes: convertStringToBuffer('BM') }] },
	{ format: ImageFormats.Jpeg, parts: [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }] },
	{
		format: ImageFormats.Webp,
		parts: [
			{ offset: 0, bytes: convertStringToBuffer('RIFF') },
			{ offset: 8, bytes: convertStringToBuffer('WEBP') },
		],
	},
];

const HEADER_LENGTH = Math.max(
	...formatSignatures.flatMap(({ parts }: FormatSignature): number[] => {
		return parts.map(({ offset, bytes }: SignaturePart): number => {
			return offset + bytes.length;
		});
	}),
);

const matchesSignature = (view: DataView, parts: SignaturePart[]): boolean => {
	return parts.every(({ offset, bytes }: SignaturePart): boolean => {
		return offset + bytes.length <= view.byteLength && compareBuffers(view, bytes, offset);
	});
};

export const detectImageFormat = async (file: File): Promise<ImageFormat | null> => {
	const buffer = await getArrayBuffer(file.slice(0, HEADER_LENGTH));
	const view = new DataView(buffer);

	const signature = formatSignatures.find(({ parts }: FormatSignature): boolean => {
		return matchesSignature(view, parts);
	});

	return signature?.format ?? null;
};
