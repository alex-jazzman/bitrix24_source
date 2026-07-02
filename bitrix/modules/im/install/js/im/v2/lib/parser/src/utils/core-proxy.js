import { Extension } from 'main.core';

const settings = Extension.getSettings('im.v2.lib.parser');
const v2 = settings.get('v2');

const CoreProxy = {
	getCore()
	{
		return v2 ? BX.Messenger.v2.Application.Core : BX.Messenger.Embedding.Application.Core;
	},
	getUtils()
	{
		return v2 ? BX.Messenger.v2.Lib.Utils : BX.Messenger.Embedding.Lib.Utils;
	},
	getLogger()
	{
		return v2 ? BX.Messenger.v2.Lib.Logger : BX.Messenger.Embedding.Lib.Logger;
	},
	getConst()
	{
		return v2 ? BX.Messenger.v2.Const : BX.Messenger.Embedding.Const;
	},
	getSmileManager()
	{
		return v2 ? BX.Messenger.v2.Lib.SmileManager : BX.Messenger.Embedding.Lib.SmileManager;
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
};

const getCore = () => CoreProxy.getCore();
const getUtils = () => CoreProxy.getUtils();
const getLogger = () => CoreProxy.getLogger();
const getConst = () => CoreProxy.getConst();
const getSmileManager = () => CoreProxy.getSmileManager();
const getBigSmileOption = () => CoreProxy.getBigSmileOption();

export { CoreProxy, getCore, getUtils, getLogger, getConst, getSmileManager, getBigSmileOption };

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