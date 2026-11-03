<?php

use Bitrix\Main\ModuleManager;
use Bitrix\Main\Routing\RoutingConfigurator;
use Bitrix\Vibecodeconnector\Infrastructure\Controller\App;

return static function (RoutingConfigurator $routes) {
	if (!ModuleManager::isModuleInstalled('vibecodeconnector'))
	{
		return;
	}

	$appController = [App::class, 'show'];

	$routes->get('/vibecode/app/{id}/', $appController)
		->where('id', '[0-9]+')
	;

	$routes->get('/vibecode/app/{id}', $appController)
		->where('id', '[0-9]+')
	;
};
