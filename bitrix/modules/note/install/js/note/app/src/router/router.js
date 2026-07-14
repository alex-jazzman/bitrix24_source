import { createRouter, createWebHistory } from 'ui.vue3.router';
import { routes } from './routes';

const DEFAULT_BASE = '/note/';

export function createNoteRouter(): Object
{
	return createRouter({
		history: createWebHistory(DEFAULT_BASE),
		routes,
		scrollBehavior(to, from, savedPosition)
		{
			if (savedPosition)
			{
				return savedPosition;
			}

			// Hash scrolling is owned by the document page: the target heading may
			// not exist yet (async load) and can live inside a collapsed section
			// that has to be expanded first. See feature.scrollToAnchor().
			if (to.hash)
			{
				return false;
			}

			if (!from || to.path !== from.path)
			{
				// The app's scrollable surface is <main class="content">, not the
				// window — Vue Router's { top: 0 } only resets window scroll, which
				// leaves a previously-scrolled .content stuck on the new page.
				const content = document.querySelector('main.content');
				if (content instanceof HTMLElement)
				{
					content.scrollTop = 0;
				}

				return { top: 0 };
			}

			return false;
		},
	});
}
