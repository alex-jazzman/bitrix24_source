import { HomePage } from '../pages/home-page';
import { DocumentPage } from '../pages/document-page';
import { SearchPage } from '../pages/search-page';
import { SharedPage } from '../pages/shared-page';
import { ArchivePage } from '../pages/archive-page';
import { RecycleBinPage } from '../pages/recyclebin-page';
import { WorkspacePage } from '../pages/workspace-page';
import {
	ROUTE_NAME_ARCHIVE,
	ROUTE_NAME_DOCUMENT,
	ROUTE_NAME_HOME,
	ROUTE_NAME_RECYCLE_BIN,
	ROUTE_NAME_SEARCH,
	ROUTE_NAME_SHARED,
	ROUTE_NAME_WORKSPACE,
} from './route-names';

export {
	ROUTE_NAME_ARCHIVE,
	ROUTE_NAME_DOCUMENT,
	ROUTE_NAME_HOME,
	ROUTE_NAME_RECYCLE_BIN,
	ROUTE_NAME_SEARCH,
	ROUTE_NAME_SHARED,
	ROUTE_NAME_WORKSPACE,
};

type RouteConfig = {
	path: string,
	name?: string,
	component?: Object,
	props?: Function,
	redirect?: Function | Object
};

export const routes: RouteConfig[] = [
	{
		path: '/',
		name: ROUTE_NAME_HOME,
		component: HomePage,
	},
	{
		path: '/search/',
		name: ROUTE_NAME_SEARCH,
		component: SearchPage,
		props: (route) => ({ query: String(route.query.q ?? '') }),
	},
	{
		path: '/shared/',
		name: ROUTE_NAME_SHARED,
		component: SharedPage,
	},
	{
		path: '/archive/',
		name: ROUTE_NAME_ARCHIVE,
		component: ArchivePage,
	},
	{
		path: '/recyclebin/',
		name: ROUTE_NAME_RECYCLE_BIN,
		component: RecycleBinPage,
	},
	{
		path: '/document/:id(\\d+)/',
		name: ROUTE_NAME_DOCUMENT,
		component: DocumentPage,
		props: (route) => ({ documentId: Number(route.params.id) }),
	},
	{
		path: '/document/:id(\\d+)',
		redirect: (to) => ({
			name: ROUTE_NAME_DOCUMENT,
			params: { id: to.params.id },
		}),
	},
	{
		path: '/workspace/:id(\\d+)/',
		name: ROUTE_NAME_WORKSPACE,
		component: WorkspacePage,
		props: (route) => ({ collectionId: Number(route.params.id) }),
	},
	{
		path: '/workspace/:id(\\d+)',
		redirect: (to) => ({
			name: ROUTE_NAME_WORKSPACE,
			params: { id: to.params.id },
		}),
	},
	{
		path: '/:pathMatch(.*)*',
		redirect: { name: ROUTE_NAME_HOME },
	},
];
