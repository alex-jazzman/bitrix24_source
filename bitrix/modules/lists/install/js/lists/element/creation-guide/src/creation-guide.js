import { Type, Uri } from 'main.core';
import 'sidepanel';

type OpenSliderParams = {
	iBlockTypeId: string,
	iBlockId: number,
	fillConstantsUrl?: string,
	onClose?: Function,
};

export class CreationGuide
{
	static open(params: OpenSliderParams)
	{
		if (!Type.isPlainObject(params) || !Type.isStringFilled(params.iBlockTypeId) || !Type.isInteger(params.iBlockId))
		{
			throw new TypeError('invalid params');
		}

		const url = Uri.addParam(
			'/bitrix/components/bitrix/lists.element.creation_guide/',
			{
				iBlockTypeId: encodeURIComponent(params.iBlockTypeId),
				iBlockId: encodeURIComponent(params.iBlockId),
				fillConstantsUrl: encodeURIComponent(this.#getFillConstantsUrl(params)),
			},
		);

		BX.SidePanel.Instance.open(
			url,
			{
				width: 900,
				cacheable: false,
				allowChangeHistory: false,
				events: {
					onCloseComplete: () => {
						if (Type.isFunction(params.onClose))
						{
							params.onClose();
						}
					},
				},
			},
		);
	}

	static #getFillConstantsUrl(params: OpenSliderParams): string
	{
		if (Type.isStringFilled(params.fillConstantsUrl))
		{
			return params.fillConstantsUrl;
		}

		return Uri.addParam('/bizproc/userprocesses/', {
			iBlockId: params.iBlockId,
		});
	}
}
