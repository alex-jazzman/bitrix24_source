import { SignatureImageError, SignatureImageVariant } from '../../../const/signature-image';

export type SignatureImageContentType = 'image/jpeg' | 'image/png' | 'image/gif';

export type SignatureImageVariantName = (
	typeof SignatureImageVariant
)[keyof typeof SignatureImageVariant];

export type SignatureImageVariants = Record<SignatureImageVariantName, number>;

export type SignatureImageDto = {
	id: string,
	src: string,
	contentType: SignatureImageContentType,
	width: number,
	height: number,
	size: number,
	animated: boolean,
	variants: SignatureImageVariants,
};

export type SignatureImageUploadRequest = {
	uploadId: string,
};

export type SignatureImageCopyRequest = {
	objectId: number,
};

export type SignatureImageResponseData = {
	image: SignatureImageDto,
};

export type SignatureImageErrorCode = (
	typeof SignatureImageError
)[keyof typeof SignatureImageError];

export type SignatureImageServiceError = {
	code: SignatureImageErrorCode | null,
	message: string,
};
