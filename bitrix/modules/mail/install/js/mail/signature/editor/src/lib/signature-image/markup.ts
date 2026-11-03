import { SignatureImageVariant } from '../../const/signature-image';
import {
	type SignatureImageDto,
	type SignatureImageVariantName,
} from '../../infrastructure/service/signature-image/types';

const UUID_PATTERN = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const SIGNATURE_IMAGE_VIEW_PATH = '/bitrix/services/main/ajax.php';
const SIGNATURE_IMAGE_VIEW_ACTION = 'mail.api.signatureimage.view';

export function buildSignatureImageMarker(
	image: SignatureImageDto,
	variant: SignatureImageVariantName = SignatureImageVariant.Original,
): HTMLImageElement
{
	if (!UUID_PATTERN.test(image.id) || !Object.values(SignatureImageVariant).includes(variant))
	{
		throw new TypeError('Invalid signature image marker data.');
	}

	const expectedSrc = `${SIGNATURE_IMAGE_VIEW_PATH}?action=${SIGNATURE_IMAGE_VIEW_ACTION}&id=${image.id}`;
	if (image.src !== expectedSrc)
	{
		throw new TypeError('Invalid signature image marker source.');
	}

	const variantWidth = image.variants[variant];
	if (!Number.isInteger(image.width) || image.width <= 0 || !Number.isInteger(variantWidth) || variantWidth <= 0)
	{
		throw new TypeError('Invalid signature image marker dimensions.');
	}

	const marker = document.createElement('img');
	marker.setAttribute('src', image.src);
	marker.setAttribute('data-bx-mail-signature-image', image.id);
	marker.setAttribute('data-bx-mail-signature-image-size', variant);
	marker.setAttribute('width', String(Math.min(image.width, variantWidth)));

	return marker;
}
