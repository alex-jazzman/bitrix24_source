<?php

use Bitrix\Main\Application;
use Bitrix\Market\Internal\Services\Mobile\PageResolver;

require($_SERVER['DOCUMENT_ROOT'] . '/mobile/headers.php');
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

/**
 * @var CMain $APPLICATION
 */

$request = Application::getInstance()->getContext()->getRequest();
$pageResolver = new PageResolver(
	(string)$request->getRequestUri(),
	$request->getQueryList()->toArray(),
);

$APPLICATION->IncludeComponent(
	$pageResolver->getComponentName(),
	'mobile',
	$pageResolver->getComponentParams(),
	null,
	[
		'HIDE_ICONS' => 'Y',
	],
);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
