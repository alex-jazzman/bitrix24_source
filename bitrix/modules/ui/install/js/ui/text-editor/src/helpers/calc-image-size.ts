export function calcImageSize(
	previewWidth: number,
	previewHeight: number,
	renderWidth: number,
	renderHeight: number,
): [number, number]
{
	const ratioWidth: number = renderWidth / previewWidth;
	const ratioHeight: number = renderHeight / previewHeight;
	const ratio: number = Math.min(ratioWidth, ratioHeight);

	const useOriginalSize = ratio > 1; // image is too small
	const width = useOriginalSize ? previewWidth : previewWidth * ratio;
	const height = useOriginalSize ? previewHeight : previewHeight * ratio;

	return [width, height];
}
