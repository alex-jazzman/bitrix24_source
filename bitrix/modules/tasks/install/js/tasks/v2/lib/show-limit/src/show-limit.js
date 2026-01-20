import { Runtime, Type } from 'main.core';

export type LimitParams = {
	featureId: string,
	code?: string,
	bindElement?: HTMLElement,
	limitAnalyticsLabels?: Object,
}

export const showLimit = (limitParams: LimitParams): Promise<void> => {
	if (!Type.isStringFilled(limitParams.featureId))
	{
		throw new Error('featureId is required');
	}

	const featureId: string = limitParams.featureId;
	const code: string = Type.isStringFilled(limitParams.code) ? limitParams.code : `limit_${featureId}`;
	const bindElement: ?HTMLElement = Type.isElementNode(limitParams.bindElement) ? limitParams.bindElement : null;

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
