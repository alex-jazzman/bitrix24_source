import { createRouter, createWebHistory } from 'ui.vue3.router';
import { routes } from './routes';

const DEFAULT_BASE = '/note/';

export function createNoteRouter(): Object
{
	return createRouter({
		history: createWebHistory(DEFAULT_BASE),
		routes,
	});
}
