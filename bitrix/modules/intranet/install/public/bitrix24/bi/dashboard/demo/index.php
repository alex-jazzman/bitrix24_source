<?php

use Bitrix\Main\Loader;

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');
global $APPLICATION;

if (Loader::includeModule('biconnector'))
{
	$APPLICATION->IncludeComponent(
		'bitrix:biconnector.apachesuperset.dashboard.demo',
		'',
		[
			'REPORT_CODE' => $_REQUEST['code'] ?? '',
		]
	);
}

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
