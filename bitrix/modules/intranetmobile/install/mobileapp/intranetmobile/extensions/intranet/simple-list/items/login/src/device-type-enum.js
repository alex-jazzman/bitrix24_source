/**
 * @module intranet/simple-list/items/login/src/device-type-enum
 */
jn.define('intranet/simple-list/items/login/src/device-type-enum', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');
	const { Loc } = require('loc');

	/**
	 * @class DeviceType
	 * @extends {BaseEnum<DeviceType>}
	 */
	class DeviceType extends BaseEnum
	{
		static UNKNOWN = new DeviceType('UNKNOWN', {
			phrase: Loc.getMessage('M_INTRANET_LOGIN_ITEM_DEVICE_TYPE_UNKNOWN'),
		});

		static DESKTOP = new DeviceType('DESKTOP', {
			phrase: Loc.getMessage('M_INTRANET_LOGIN_ITEM_DEVICE_TYPE_DESKTOP'),
		});

		static MOBILE = new DeviceType('MOBILE', {
			phrase: Loc.getMessage('M_INTRANET_LOGIN_ITEM_DEVICE_TYPE_MOBILE'),
		});

		static TABLET = new DeviceType('TABLET', {
			phrase: Loc.getMessage('M_INTRANET_LOGIN_ITEM_DEVICE_TYPE_TABLET'),
		});

		static TV = new DeviceType('TV', {
			phrase: Loc.getMessage('M_INTRANET_LOGIN_ITEM_DEVICE_TYPE_TV'),
		});

		getPhrase()
		{
			return this.getValue().phrase;
		}
	}

	module.exports = { DeviceType };
});
