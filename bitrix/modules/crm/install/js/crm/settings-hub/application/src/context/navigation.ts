import { inject, type InjectionKey } from 'ui.vue3';

import {
	type NavigationTarget,
	type NavigationTargets,
} from '../infrastructure/service/navigation/types';

export type NavigationContext = Readonly<{
	get: (navigationId: string) => NavigationTarget | null,
}>;

export const navigationContextKey: InjectionKey<NavigationContext> = Symbol('crm-settings-hub-navigation');

export function createNavigationContext(navigation: NavigationTargets): NavigationContext
{
	return {
		get(navigationId: string): NavigationTarget | null
		{
			return Object.hasOwn(navigation, navigationId) ? navigation[navigationId] : null;
		},
	};
}

export function useNavigationContext(): NavigationContext
{
	const context = inject(navigationContextKey, null);
	if (context === null)
	{
		throw new Error('CRM Settings Hub navigation provider is missing');
	}

	return context;
}

export function useNavigationTarget(navigationId: string): NavigationTarget | null
{
	return useNavigationContext().get(navigationId);
}
