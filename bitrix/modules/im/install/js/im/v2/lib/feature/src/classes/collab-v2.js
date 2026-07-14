import { FeaturePromoter } from 'ui.info-helper';

import { SliderCode } from 'im.v2.const';
import { Core } from 'im.v2.application.core';

export const CollabV2Manager = {
	isAvailable(): boolean
	{
		return Core.getStore().getters['application/tariffRestrictions/isCollabV2Available'];
	},
	isCopyAvailable(): boolean
	{
		return Core.getStore().getters['application/tariffRestrictions/isCollabV2CopyAvailable'];
	},
	openCopyFeatureSlider()
	{
		const promoter = new FeaturePromoter({ featureId: SliderCode.collabV2CopyDisabled });
		promoter.show();
	},
	openFeatureSlider()
	{
		const promoter = new FeaturePromoter({ featureId: SliderCode.collabV2Disabled });
		promoter.show();
	},
};
