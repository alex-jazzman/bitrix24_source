import { Core } from 'im.v2.application.core';

export const Feature = {
	chatV2: 'chatV2',
	chatDepartments: 'chatDepartments',
	copilot: 'copilot',
	sidebarLinks: 'sidebarLinks',
	sidebarFiles: 'sidebarFiles',
	sidebarBriefs: 'sidebarBriefs',
	zoomActive: 'zoomActive',
	zoomAvailable: 'zoomAvailable',
	giphyAvailable: 'giphyAvailable',
};

export const FeatureManager = {
	isFeatureAvailable(featureName: $Values<typeof Feature>): boolean
	{
		const { featureOptions = {} } = Core.getApplicationData();

		return featureOptions[featureName] ?? false;
	},
};
