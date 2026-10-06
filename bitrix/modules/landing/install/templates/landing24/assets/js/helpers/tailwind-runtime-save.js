(function() {
	'use strict';

	const RUNTIME_KEY = '__landingTailwindRuntime';
	const SEND_DELAY_MS = 10000;
	const runtime = window[RUNTIME_KEY] || (window[RUNTIME_KEY] = {});
	let cachedCss = '';

	if (runtime.isTailwindRuntimeSaveInitialized)
	{
		return;
	}

	runtime.isTailwindRuntimeSaveInitialized = true;

	function getCssFromDom()
	{
		const style = document.querySelector('style[landing-tailwind-runtime]');

		return style ? String(style.textContent || '').trim() : '';
	}

	function sendLatest()
	{
		if (!document.querySelector('main.landing-edit-mode'))
		{
			return;
		}

		const BX = window.BX;
		const Type = BX && BX.Type;

		if (!(BX && BX.ajax && Type && Type.isFunction(BX.ajax.runAction)))
		{
			return;
		}

		const landingId = parseInt(window.landingParams && window.landingParams.LANDING_ID, 10) || 0;

		if (!landingId)
		{
			return;
		}

		const css = String(getCssFromDom() || cachedCss || '').trim();

		if (!css)
		{
			return;
		}

		cachedCss = css;

		BX.ajax.runAction('landing.tailwind.saveCss', {
			data: {
				landingId,
				css,
			},
		});
	}

	runtime.onCssReady = function()
	{
		if (document.querySelector('main.landing-edit-mode'))
		{
			cachedCss = getCssFromDom() || cachedCss;
		}
	};

	function scheduleSend()
	{
		setTimeout(sendLatest, SEND_DELAY_MS);
	}

	if (document.readyState === 'complete')
	{
		scheduleSend();
	}
	else
	{
		const BX = window.BX;
		const Type = BX && BX.Type;
		const Event = BX && BX.Event;

		if (Event && Type && Type.isFunction(Event.bind) && Type.isFunction(Event.unbind))
		{
			const onLoad = function() {
				Event.unbind(window, 'load', onLoad);

				scheduleSend();
			};

			Event.bind(window, 'load', onLoad);
		}
	}
})();
