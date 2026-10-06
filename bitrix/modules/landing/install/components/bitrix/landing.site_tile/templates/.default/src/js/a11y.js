import { Runtime } from 'main.core';

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

	createFocusTrap(container, options = {})
	{
		if (!container)
		{
			return Promise.resolve(null);
		}

		return loadA11y().then(({ FocusTrap }) => new FocusTrap(container, options));
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
