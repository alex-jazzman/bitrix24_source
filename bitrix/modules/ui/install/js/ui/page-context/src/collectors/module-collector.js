/**
 * Maps a portal URL path to the module that is presumed to own its content.
 *
 * Derived from the portal left menu (intranet `.superleft.menu_ext.php`) and the
 * components mounted by the matching public pages. The first matching rule wins,
 * so more specific paths must come before the generic ones.
 */
const MODULE_ROUTE_MAP: Array<[RegExp, string]> = [
	[/^\/company\/personal\/user\/\d+\/tasks(\/|$)/, 'tasks'],
	[/^\/company\/personal\/user\/\d+\/calendar(\/|$)/, 'calendar'],
	[/^\/company\/personal\/user\/\d+\/(disk|files)(\/|$)/, 'disk'],
	[/^\/company\/personal\/bizproc(\/|$)/, 'bizproc'],

	[/^\/shop\/documents(\/|$|-)/, 'catalog'],

	[/^\/stream(\/|$)/, 'socialnetwork'],
	[/^\/tasks(\/|$)/, 'tasks'],
	[/^\/calendar(\/|$)/, 'calendar'],
	[/^\/(docs|disk)(\/|$)/, 'disk'],
	[/^\/crm(\/|$)/, 'crm'],
	[/^\/contact_center(\/|$)/, 'crm'],
	[/^\/booking(\/|$)/, 'booking'],
	[/^\/shop(\/|$)/, 'sale'],
	[/^\/(sites|kb)(\/|$)/, 'landing'],
	[/^\/bi(\/|$)/, 'biconnector'],
	[/^\/note(\/|$)/, 'note'],
	[/^\/marketing(\/|$)/, 'sender'],
	[/^\/(online|desktop_app)(\/|$)/, 'im'],
	[/^\/sign(\/|$)/, 'sign'],
	[/^\/mail(\/|$)/, 'mail'],
	[/^\/workgroups(\/|$)/, 'socialnetwork'],
	[/^\/spaces(\/|$)/, 'socialnetwork'],
	[/^\/bizproc(\/|$)/, 'bizproc'],
	[/^\/automation(\/|$)/, 'bizproc'],
	[/^\/marketplace(\/|$)/, 'rest'],
	[/^\/market(\/|$)/, 'market'],
	[/^\/devops(\/|$)/, 'rest'],
	[/^\/mcp(\/|$)/, 'aiassistant'],
	[/^\/conference(\/|$)/, 'call'],
	[/^\/timeman(\/|$)/, 'timeman'],
	[/^\/settings(\/|$)/, 'intranet'],

	[/^\/company(\/|$)/, 'intranet'],
];

function extractPath(url: string): string
{
	const path = String(url).split('#')[0].split('?')[0];

	return path.startsWith('/') ? path : `/${path}`;
}

export function getModule(url: string = window.location.pathname): string | null
{
	const path = extractPath(url).toLowerCase();

	for (const [pattern, moduleId] of MODULE_ROUTE_MAP)
	{
		if (pattern.test(path))
		{
			return moduleId;
		}
	}

	return null;
}
