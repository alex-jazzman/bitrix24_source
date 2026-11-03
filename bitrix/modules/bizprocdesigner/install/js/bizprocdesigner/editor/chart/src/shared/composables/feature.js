import { Feature, FeatureCode, type FeatureCodeType } from 'bizprocdesigner.feature';

export type UseFeature = {
	isFeatureAvailable: (featureCode: FeatureCodeType) => boolean,
	isFeatureLocked: (featureCode: FeatureCodeType) => boolean,
};

export function useFeature(): UseFeature
{
	return {
		isFeatureAvailable: (featureCode: FeatureCodeType): boolean => {
			return Feature.instance().isAvailable(featureCode);
		},
		isFeatureLocked: (featureCode: FeatureCodeType): boolean => {
			return Feature.instance().isLocked(featureCode);
		},
	};
}

// The editing lease and everything that hangs on it — the draft revision in the write request, the
// busy bar, the menu item — are switched by one flag, so every check of it goes through one place.
// With the flag off the editor behaves exactly as it did before the lease existed.
export function isTemplateEditLockAvailable(): boolean
{
	return Feature.instance().isAvailable(FeatureCode.templateEditLock);
}
