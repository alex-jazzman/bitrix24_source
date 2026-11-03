;(function() {
	'use strict';

	BX.namespace('BX');

	var deprecationNotified = false;

	/**
	 * @deprecated
	 * @use window.ResizeObserver
	 * @param {function} callback
	 * @constructor
	 */
	BX.ResizeObserver = function(callback)
	{
		if (!deprecationNotified)
		{
			deprecationNotified = true;
			// eslint-disable-next-line no-console
			console.warn('BX.ResizeObserver is deprecated. Use window.ResizeObserver instead.');
		}

		return Reflect.construct(window.ResizeObserver, arguments, window.ResizeObserver);
	};
})();