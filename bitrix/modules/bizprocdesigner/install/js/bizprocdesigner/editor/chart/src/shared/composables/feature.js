import { Feature, type FeatureCodeType } from 'bizprocdesigner.feature';

export type UseFeature = {
	isFeatureAvailable: (featureCode: FeatureCodeType) => boolean,
};

export function useFeature(): UseFeature
{
	return {
		isFeatureAvailable: (featureCode: FeatureCodeType): boolean => {
			return Feature.instance().isAvailable(featureCode);
		},
	};
}
