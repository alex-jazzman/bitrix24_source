import { computed, defineComponent, type PropType } from 'ui.vue3';
import { Runtime, Type } from 'main.core';
import { type SliderOptions } from 'main.sidepanel';

import { CrmSettingsHubConfigSettingView } from '../setting-view/config-setting-view';
import {
	sidePanelOptionsByNavigationId,
	type SidePanelLinkOptions,
} from '../../const/side-panel-options';
import { useNavigationContext } from '../../context/navigation';
import { normalizeSafeUrl, type ConfigTarget } from '../../lib/config-target';
import { type SettingId } from '../../model/types';

type SidePanelExtensionExports = {
	SidePanel: {
		Instance: {
			open: (url: string, options: SliderOptions) => unknown,
		},
	},
};

function sanitizeOptions(options: SidePanelLinkOptions): SliderOptions
{
	const sanitizedOptions: SliderOptions = {};

	if (Type.isBoolean(options.cacheable))
	{
		sanitizedOptions.cacheable = options.cacheable;
	}

	if (Type.isBoolean(options.allowChangeHistory))
	{
		sanitizedOptions.allowChangeHistory = options.allowChangeHistory;
	}

	if (Type.isNumber(options.width))
	{
		sanitizedOptions.width = options.width;
	}

	if (Type.isNumber(options.customLeftBoundary))
	{
		sanitizedOptions.customLeftBoundary = options.customLeftBoundary;
	}

	return sanitizedOptions;
}

export const CrmSettingsHubSidePanelLink = defineComponent({
	name: 'CrmSettingsHubSidePanelLink',
	components: { CrmSettingsHubConfigSettingView },
	props: {
		settingId: {
			type: String as PropType<SettingId>,
			required: true,
		},
		navigationId: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			default: '',
		},
	},
	emits: ['activate'],
	setup(props): Object
	{
		const navigation = useNavigationContext();
		const normalizedUrl = computed((): string | null => {
			const navigationTarget = navigation.get(props.navigationId);

			return navigationTarget?.available === true
				? normalizeSafeUrl(navigationTarget.url)
				: null
			;
		});
		const target = computed((): ConfigTarget => {
			return normalizedUrl.value === null
				? { type: 'unavailable' }
				: { type: 'url', href: normalizedUrl.value };
		});
		const activate = async (): Promise<void> => {
			const url = normalizedUrl.value;
			if (url !== null)
			{
				const exports = await Runtime
					.loadExtension('main.sidepanel')
					.catch(() => null) as Partial<SidePanelExtensionExports> | null
				;

				if (!Type.isFunction(exports?.SidePanel?.Instance?.open))
				{
					return;
				}

				exports.SidePanel.Instance.open(
					url,
					sanitizeOptions(sidePanelOptionsByNavigationId[props.navigationId] ?? {}),
				);
			}
		};

		return { activate, target };
	},
	template: `
		<CrmSettingsHubConfigSettingView
			:data-testid="$attrs['data-testid'] ?? ('crm-settings-hub-application-setting-' + settingId)"
			:setting-id="settingId"
			:title="title"
			:description="description"
			:target="target"
			@activate="activate"
		/>
	`,
});
