;(function(global) {
	'use strict';

	var BX = global.BX;
	var SELECTOR_CLASS = 'bx-im-list-container-vibe-code-catalog-button__container';
	var ICON_CLASS = 'bx-im-list-container-vibe-code-catalog-button__icon';
	var COUNTER_CLASS = 'bx-im-list-container-vibe-code-catalog-button__counter';
	var EXTENSION_NAME = 'vibecodeconnector.vibe-code-catalog-button-test';

	var EVENT_REQUEST = 'im:vibe-code-catalog:request';
	var EVENT_STATE_CHANGED = 'im:vibe-code-catalog:state-changed';

	function getSettings()
	{
		return BX.Extension.getSettings(EXTENSION_NAME);
	}

	function buildIcon()
	{
		var span = document.createElement('span');
		span.className = ICON_CLASS;
		span.setAttribute('aria-hidden', 'true');
		span.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>';

		return span;
	}

	var activeButton = null;
	var stateSubscribed = false;

	function applyState(active)
	{
		if (!activeButton)
		{
			return;
		}
		activeButton.setAttribute('aria-pressed', active ? 'true' : 'false');
		activeButton.classList.toggle('--active', active);
	}

	function ensureStateSubscription()
	{
		if (stateSubscribed)
		{
			return;
		}
		BX.Event.EventEmitter.subscribe(EVENT_STATE_CHANGED, function(event) {
			var data = (event && typeof event.getData === 'function') ? event.getData() : {};
			applyState(data && data.active === true);
		});
		stateSubscribed = true;
	}

	function buildButton(label, counter)
	{
		var button = document.createElement('button');
		button.type = 'button';
		button.className = SELECTOR_CLASS;
		button.setAttribute('data-bx-vibe-code-catalog-events', 'true');
		button.setAttribute('aria-label', label);
		button.setAttribute('aria-pressed', 'false');
		button.appendChild(buildIcon());

		if (typeof counter === 'number' && counter > 0)
		{
			var counterEl = document.createElement('span');
			counterEl.className = COUNTER_CLASS;
			counterEl.setAttribute('aria-hidden', 'true');
			counterEl.textContent = counter > 99 ? '99+' : String(counter);
			if (counter > 99)
			{
				counterEl.classList.add('--overflowed');
			}
			button.appendChild(counterEl);
		}

		button.addEventListener('click', function() {
			var willOpen = button.getAttribute('aria-pressed') !== 'true';
			BX.Event.EventEmitter.emit(EVENT_REQUEST, { open: willOpen, node: button });
		});

		return button;
	}

	var VccCatalogButtonTest = {
		mountInto: function(container)
		{
			if (!container)
			{
				return null;
			}
			var settings = getSettings();
			var label = BX.message('VIBECODECONNECTOR_TEST_BUTTON_ARIA_TITLE') || 'Vibe-code catalog';
			var counter = settings.get('counter', 0);
			var btn = buildButton(label, counter);

			container.innerHTML = '';
			container.appendChild(btn);
			activeButton = btn;
			ensureStateSubscription();
			container.dataset.vccTestStatus = settings.get('isAvailable', false) === true
				? 'available'
				: 'preview';

			return btn;
		},
		getPreviewUserId: function()
		{
			var raw = getSettings().get('previewUserId', null);

			return typeof raw === 'number' && raw > 0 ? raw : null;
		},
	};

	BX.namespace('BX.Vibecodeconnector');
	BX.Vibecodeconnector.VccCatalogButtonTest = VccCatalogButtonTest;
})(window);
