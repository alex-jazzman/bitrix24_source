import { Loc } from 'main.core';
import { Filter, UploaderError, type UploaderFile } from 'ui.uploader.core';

const WEBP_MIME_TYPE = 'image/webp';
const WEBP_MAX_SIZE = 1024 * 500; // 500 KB
const WEBP_MAX_RESOLUTION = 512; // 512 px

export class UploaderFilter extends Filter
{
	apply(file: UploaderFile): Promise
	{
		return new Promise((resolve, reject) => {
			if (this.#isValid(file))
			{
				resolve();
			}
			else
			{
				reject(new UploaderError('UPLOADING_ERROR', Loc.getMessage('IM_STICKER_PACK_FORM_UPLOADING_LIMITS_WEBP')));
			}
		});
	}

	#isValid(file: UploaderFile): boolean
	{
		if (file.getType() !== WEBP_MIME_TYPE)
		{
			return true;
		}

		if (file.isAnimated())
		{
			return false;
		}

		const isAllowedSize = file.getSize() <= WEBP_MAX_SIZE;
		const isAllowedResolution = file.getWidth() <= WEBP_MAX_RESOLUTION && file.getHeight() <= WEBP_MAX_RESOLUTION;

		return isAllowedSize && isAllowedResolution;
	}
}
