import { Runtime, Type } from 'main.core';

export type LimitParams = {
	featureId: string,
	code?: string,
	bindElement?: HTMLElement,
	analytics?: Object,
	limitAnalyticsLabels?: Object,
}

export const showLimit = (limitParams: LimitParams): Promise<void> => {
	if (!Type.isStringFilled(limitParams.featureId) && !Type.isStringFilled(limitParams.code))
	{
		throw new Error("Either the 'code' parameter or the 'featureId' parameter is required");
	}

	const featureId: string = limitParams.featureId;
	const code: string = Type.isStringFilled(limitParams.code) ? limitParams.code : `limit_${featureId}`;
	const bindElement: ?HTMLElement = Type.isElementNode(limitParams.bindElement) ? limitParams.bindElement : null;
	const analytics: Object = limitParams.analytics || {};

	let limitAnalyticsLabels: Object = {};
	if (Type.isPlainObject(limitParams.limitAnalyticsLabels))
	{
		limitAnalyticsLabels = { module: 'tasks', ...limitParams.limitAnalyticsLabels };
	}

	return new Promise((resolve, reject) => {
		Runtime.loadExtension('ui.info-helper')
			.then(({ FeaturePromotersRegistry }) => {
				if (FeaturePromotersRegistry)
				{
					FeaturePromotersRegistry.getPromoter({
						featureId,
						code,
						bindElement,
						analytics,
					}).show();
				}
				else
				{
					BX.UI.InfoHelper.show(code, {
						limitAnalyticsLabels,
						isLimit: true,
					});
				}

				resolve();
			})
			.catch((error) => {
				reject(error);
			})
		;
	});
};
