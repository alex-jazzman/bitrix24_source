import { Reflection } from 'main.core';

export const helpDesk = (sliderCode, widthCode = false) => {
	if (!sliderCode)
	{
		return;
	}

	if (widthCode)
	{
		const Helper = Reflection.getClass('top.BX.Helper');
		if (Helper)
		{
			Helper.show(`redirect=detail&code=${sliderCode}`);
		}

		return;
	}

	const InfoHelper = Reflection.getClass('top.BX.UI.InfoHelper')
		|| Reflection.getClass('BX.UI.InfoHelper');

	if (InfoHelper)
	{
		InfoHelper.show(sliderCode);
	}
};
