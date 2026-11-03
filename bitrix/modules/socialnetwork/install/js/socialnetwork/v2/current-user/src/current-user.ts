import { Extension } from 'main.core';

export type CurrentUserSettings = {
	id: number;
	name: string;
	image: { src: string } | null;
};

export function getCurrentUserSettings(): CurrentUserSettings
{
	const settings = Extension.getSettings('socialnetwork.v2.current-user');

	return {
		id: settings.get('id'),
		name: settings.get('name'),
		image: settings.get('image'),
	};
}
