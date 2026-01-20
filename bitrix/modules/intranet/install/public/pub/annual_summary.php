<?php

use Bitrix\Main\Application;

define('SKIP_TEMPLATE_AUTH_ERROR', true);
define('NOT_CHECK_PERMISSIONS', true);

require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/header.php");

global $APPLICATION;

$APPLICATION->IncludeComponent(
	'bitrix:intranet.annual.summary',
	'',
	[
		'SIGNED_USER_ID' => Application::getInstance()->getContext()->getRequest()->get('signedId'),
		'SIGNED_TYPE' => Application::getInstance()->getContext()->getRequest()->get('signedType'),
		'SHORT_CODE' => Application::getInstance()->getContext()->getRequest()->get('shortCode'),
	],
);

require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/footer.php");
