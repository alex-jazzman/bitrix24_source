import { Reflection, Runtime } from 'main.core';

// Where the bundle of ui.a11y publishes its exports; `Runtime.loadExtension` resolves to a copy
// of this very namespace, so reading it directly gives the same thing without the wait.
const A11Y_NAMESPACE = 'BX.UI.Accessibility';

let extensionPromise = null;

const loadA11y = () => {
	if (!extensionPromise)
	{
		extensionPromise = Runtime.loadExtension('ui.a11y').catch((error) => {
			extensionPromise = null;
			throw error;
		});
	}

	return extensionPromise;
};

export const A11y = {
	load()
	{
		return loadA11y();
	},

	/**
	 * The exports of ui.a11y when it is already on the page, for callers that cannot afford to
	 * wait for load(): what they measure - the focus above all - is gone by the time a promise
	 * resolves. Returns null while the extension is not there, and the caller falls back.
	 * @return {?Object}
	 */
	getLoaded(): ?Object
	{
		return Reflection.getClass(A11Y_NAMESPACE);
	},

	createFocusTrap(container, options = {})
	{
		if (!container)
		{
			return Promise.resolve(null);
		}

		return loadA11y().then(({ FocusTrap, AccessibilitySettings }) => {
			const mergedOptions = {
				looped: AccessibilitySettings.useFocusTrapInDialogs(),
				isolateOutside: AccessibilitySettings.useFocusTrapInDialogs(),
				...options,
			};

			return new FocusTrap(container, mergedOptions);
		});
	},

	announce(message, politeness = 'polite')
	{
		if (!message)
		{
			return Promise.resolve();
		}

		return loadA11y()
			.then(({ LiveAnnouncer }) => {
				LiveAnnouncer.announce(message, politeness);
			})
			.catch(() => {});
	},

	setHidden(container, hidden)
	{
		if (!container)
		{
			return;
		}

		container.setAttribute('aria-hidden', hidden ? 'true' : 'false');
		if (hidden)
		{
			container.setAttribute('inert', '');

			return;
		}

		container.removeAttribute('inert');
	},
};
