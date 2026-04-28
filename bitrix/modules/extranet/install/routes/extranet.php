<?php

use Bitrix\Main\Application;
use Bitrix\Main\Config\Option;
use Bitrix\Main\ModuleManager;
use Bitrix\Main\Routing\Controllers\PublicPageController;
use Bitrix\Main\Routing\RoutingConfigurator;
use Bitrix\Main\SiteTable;

return static function (RoutingConfigurator $routes) {
	$isCloud = ModuleManager::isModuleInstalled('bitrix24');
	$siteDir = '/extranet/';

	if (!$isCloud)
	{
		$request = Application::getInstance()->getContext()->getRequest();
		$site = SiteTable::getByDomain($request->getHttpHost(), $request->getRequestedPageDirectory());

		if (Option::get('extranet', 'extranet_site') === ($site['LID'] ?? ''))
		{
			$siteDir = $site['DIR'] ?? '/extranet/';
		}
		else
		{
			return;
		}
	}
	$globalPrefix = trim($siteDir, '/');

	$routes
		->prefix($globalPrefix)
		->where('any', '.*')
		->group(function (RoutingConfigurator $routes) use ($siteDir) {
			$routes->any('contacts/personal/{any}', new PublicPageController($siteDir . 'contacts/personal.php'));
			$routes->any('workgroups/create/{any}', new PublicPageController($siteDir . 'workgroups/create/index.php'));
			$routes->any('crm/configs/perms/{any}', new PublicPageController($siteDir . 'crm/configs/perms/index.php'));
			$routes->any('crm/configs/bp/{any}', new PublicPageController($siteDir . 'crm/configs/bp/index.php'));
			$routes->any('mobile/webdav{any}', new PublicPageController($siteDir . 'mobile/webdav/index.php'));
			$routes->any('docs/shared{any}', new PublicPageController($siteDir . 'docs/index.php'));
			$routes->any('workgroups/{any}', new PublicPageController($siteDir . 'workgroups/index.php'));
			$routes->any('knowledge/group/{any}', new PublicPageController($siteDir . 'knowledge/group/index.php'));
			$routes->any('marketplace/app/{any}', new PublicPageController($siteDir . 'marketplace/app/index.php'));
			$routes->any('marketplace/{any}', new PublicPageController($siteDir . 'marketplace/index.php'));
			$routes->any('call/detail/{callId}', new PublicPageController($siteDir . 'call/index.php'))
				->where('callId', '[0-9]+')
			;
			$routes->any('call/detail/{callId}/', new PublicPageController($siteDir . 'call/index.php'))
				->where('callId', '[0-9]+')
			;
			$routes->any('mobile/knowledge/group/{any}', new PublicPageController($siteDir . 'mobile/knowledge/group/index.php'));
			$routes->any('kb/group/{any}', new PublicPageController($siteDir . 'kb/group/index.php'));
			$routes->any('task/comments/{taskId}', new PublicPageController($siteDir . 'tasks/comments.php'))->where('taskId', '[0-9]+');
			$routes->any('task/comments/{taskId}/', new PublicPageController($siteDir . 'tasks/comments.php'))->where('taskId', '[0-9]+');
			$routes->any('vote-result/{signedAttachId}', new PublicPageController($siteDir . 'vote-result/index.php'))->where('signedAttachId', '[0-9a-z\.]+');
			$routes->any('vote-result/{signedAttachId}/', new PublicPageController($siteDir . 'vote-result/index.php'))->where('signedAttachId', '[0-9a-z\.]+');
			$routes->any('video/{alias}/{extra}',
				new PublicPageController($siteDir . 'conference/videoconf.php'))
				->where('alias', '[\.\-0-9a-zA-Z]+')
				->where('extra', '.*')
				->default('videoconf', 1)
			;
			$routes->any('video/{alias}',
				new PublicPageController($siteDir . 'conference/videoconf.php'))
				->where('alias', '[\.\-0-9a-zA-Z]+')
				->default('extra', '')
				->default('videoconf', 1)
			;
	})
	;
};
