<?php

use Bitrix\Main\Component\ParameterSigner;
use Bitrix\Main\Context;
use Bitrix\Main\Loader;
use Bitrix\Main\Web\PostDecodeFilter;

/**
 * @var \CMain $APPLICATION
 * @var \CUser $USER
 * @var \CDatabase $DB
 * @var \CUserTypeManager $USER_FIELD_MANAGER
 */
global $APPLICATION, $USER, $DB, $USER_FIELD_MANAGER;

define('NO_KEEP_STATISTIC', 'Y');
define('NO_AGENT_STATISTIC', 'Y');
define('NO_AGENT_CHECK', true);
define('PUBLIC_AJAX_MODE', true);
define('DisableEventsCheck', true);

$siteID = isset($_REQUEST['site']) ? mb_substr(preg_replace('/[^a-z0-9_]/i', '', $_REQUEST['site']), 0, 2) : '';
if ($siteID !== '') {
    define('SITE_ID', $siteID);
}

require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php');
Header('Content-Type: text/html; charset=' . LANG_CHARSET);

global $APPLICATION;
$APPLICATION->ShowAjaxHead();
CUtil::JSPostUnescape();

$componentName = 'mywebstor:hms.receive';
$request = Context::getCurrent()->getRequest();
$request->addFilter(new PostDecodeFilter);

$params = $request->get("PARAMS");

$arParams = [
    "ID" => $params["id"],
    "GUID" => $params["guid"]
];

$APPLICATION->IncludeComponent(
    $componentName,
    '.default',
    $arParams,
    null,
    [
        'HIDE_ICONS' => 'Y'
    ]
);

CMain::FinalActions();
die();
