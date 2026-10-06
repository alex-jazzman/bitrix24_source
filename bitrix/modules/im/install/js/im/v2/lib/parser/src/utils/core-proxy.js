import { Extension } from 'main.core';

const settings = Extension.getSettings('im.v2.lib.parser');
const v2 = settings.get('v2');

// Prefer the namespace the v2 flag selects, but fall back to whichever is actually present, so
// the extension does not throw if it is evaluated before the selected namespace is set up.
const resolveNamespace = () => {
	const messenger = BX.Messenger ?? {};

	return (v2 ? messenger.v2 : messenger.Embedding) ?? messenger.v2 ?? messenger.Embedding ?? {};
};

const CoreProxy = {
	getCore()
	{
		return resolveNamespace().Application?.Core;
	},
	getUtils()
	{
		return resolveNamespace().Lib?.Utils;
	},
	getLogger()
	{
		return resolveNamespace().Lib?.Logger;
	},
	getConst()
	{
		return resolveNamespace().Const ?? {};
	},
	getSmileManager()
	{
		return resolveNamespace().Lib?.SmileManager;
	},
	getBigSmileOption()
	{
		if (v2)
		{
			const settingName = BX.Messenger.v2.Const.Settings.message.bigSmiles;

			return CoreProxy.getCore().getStore().getters['application/settings/get'](settingName);
		}

		return CoreProxy.getCore().getStore().getters['application/getOption']('bigSmileEnable');
	},

	// Read the Markdown feature flag straight from the Core application data the
	// parser already reaches for everything else, instead of pulling the heavier
	// im.v2.lib.feature extension into every parser consumer just for this boolean
	// (FeatureManager.isFeatureAvailable resolves the same featureOptions value).
	isMarkdownFeatureEnabled()
	{
		const applicationData = CoreProxy.getCore().getApplicationData?.() ?? {};
		const { featureOptions = {} } = applicationData;

		return featureOptions.isMarkdownAvailable ?? false;
	},
};

const getCore = () => CoreProxy.getCore();
const getUtils = () => CoreProxy.getUtils();
const getLogger = () => CoreProxy.getLogger();
const getConst = () => CoreProxy.getConst();
const getSmileManager = () => CoreProxy.getSmileManager();
const getBigSmileOption = () => CoreProxy.getBigSmileOption();
const isMarkdownFeatureEnabled = () => CoreProxy.isMarkdownFeatureEnabled();

export {
	CoreProxy,
	getCore,
	getUtils,
	getLogger,
	getConst,
	getSmileManager,
	getBigSmileOption,
	isMarkdownFeatureEnabled,
};

export type Smile = {
	id: string;
	setId: string;
	name: string;
	image: string;
	typing: string;
	alternative: boolean;
	width: number;
	height: number;
	definition: string;
};