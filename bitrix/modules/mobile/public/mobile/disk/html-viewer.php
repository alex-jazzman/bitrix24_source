<?php

use Bitrix\Disk\Public\Service\UnifiedLink\Render\MobileUnifiedLinkRenderer;
use Bitrix\Main\Context;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;

require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php');
require($_SERVER['DOCUMENT_ROOT'] . '/mobile/headers.php');

/**
 * The page the app opens an html file of a unified link by: the app webview carries the mobile session and
 * no portal one, so only pages under /mobile/ are served to it.
 */

if (!Loader::includeModule('disk') || !Loader::includeModule('mobile'))
{
	return;
}

$request = Context::getCurrent()->getRequest();
$uniqueCode = (string)$request->get('uniqueCode');

if ($uniqueCode === '')
{
	CHTTP::SetStatus('404 Not Found');

	return;
}

$result = MobileUnifiedLinkRenderer::renderHtmlViewerByUniqueCode($uniqueCode, CurrentUser::get());

// the status goes through CHTTP because this page ends without an epilog: the response object is never
// sent for it
$statusLines = [
	403 => '403 Forbidden',
	500 => '500 Internal Server Error',
];
$statusLine = $statusLines[$result->getStatus()] ?? null;

if ($statusLine !== null)
{
	CHTTP::SetStatus($statusLine);
}

echo $result->getContent();
