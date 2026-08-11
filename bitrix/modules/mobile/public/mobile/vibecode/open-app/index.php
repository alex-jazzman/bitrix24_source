<?php

use Bitrix\Main\Application;
use Bitrix\Main\Context;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;
use Bitrix\Vibecodeconnector\Infrastructure\Service\Catalog\OpenApp\OpenAppLayoutService;

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php';

if (!Loader::includeModule('vibecodeconnector'))
{
	return;
}

$request = Context::getCurrent()->getRequest();
$catalogItemId = (int)$request->getQuery('catalogItemId');

$openAppLayoutService = ServiceLocator::getInstance()->get(OpenAppLayoutService::class);
$response = $openAppLayoutService->renderPageResponse(
	$catalogItemId,
	(int)CurrentUser::get()->getId(),
);

Application::getInstance()->end(0, $response);
