/**
 * @module market/mobile/src/pages/list/tab-mode
 */
jn.define('market/mobile/src/pages/list/tab-mode', (require, exports, module) => {
	class MarketListTabMode
	{
		static NAVIGATE = 'navigate';
		static SWITCH = 'switch';

		static getValues()
		{
			return [
				MarketListTabMode.NAVIGATE,
				MarketListTabMode.SWITCH,
			];
		}

		static isSupported(mode)
		{
			return MarketListTabMode.getValues().includes(mode);
		}

		static resolve(mode, fallback = MarketListTabMode.NAVIGATE)
		{
			return MarketListTabMode.isSupported(mode) ? mode : fallback;
		}
	}

	module.exports = {
		MarketListTabMode,
	};
});
