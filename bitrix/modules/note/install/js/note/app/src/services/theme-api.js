import { ajax } from 'main.core';

export const ThemeApi = {
	async save(theme: string): Promise<void>
	{
		const normalized = theme === 'dark' ? 'dark' : 'light';
		try
		{
			await ajax.runAction('main.userOption.saveOptions', {
				json: {
					newValues: [
						{
							c: 'note',
							n: 'theme',
							v: normalized,
						},
					],
				},
			});
		}
		catch (error)
		{
			// Persistence failure must not break the toggle UX.
			// eslint-disable-next-line no-console
			console.warn('note.app: failed to save theme', error);
		}
	},
};
