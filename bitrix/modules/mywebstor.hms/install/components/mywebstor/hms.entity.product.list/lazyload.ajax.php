<?php

use Bitrix\Crm;
use Bitrix\Main\Loader;

define('NO_KEEP_STATISTIC', 'Y');
define('NO_AGENT_STATISTIC', 'Y');
define('NO_AGENT_CHECK', true);
define('PUBLIC_AJAX_MODE', true);
define('DisableEventsCheck', true);

$siteID = isset($_REQUEST['site']) ? mb_substr(preg_replace('/[^a-z0-9_]/i', '', $_REQUEST['site']), 0, 2) : '';
if ($siteID !== '') {
    define('SITE_ID', $siteID);
} else die();

require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php');

if (!Loader::includeModule('crm') || !check_bitrix_sessid()) {
    die();
}

if (!CCrmSecurityHelper::IsAuthorized()) {
    die();
}

/** @global \CMain $APPLICATION */
global $APPLICATION;
Header('Content-Type: text/html; charset=' . LANG_CHARSET);
$APPLICATION->ShowAjaxHead();

$componentData = isset($_REQUEST['PARAMS']) && is_array($_REQUEST['PARAMS']) ? $_REQUEST['PARAMS'] : [];
$componentParams = [];
if (isset($componentData['signedParameters'])) {
    $componentParams = \CCrmInstantEditorHelper::unsignComponentParams(
        (string)$componentData['signedParameters'],
        'hms.entity.product.list'
    );
    if (is_null($componentParams)) {
        die();
    }
} elseif (isset($componentData['params']) && is_array($componentData['params'])) {
    ShowError('Component params must be signed');
    die();
}

// Security check
$userPermissions = CCrmPerms::GetCurrentUserPermissions();
$filter = isset($componentParams['INTERNAL_FILTER']) && is_array($componentParams['INTERNAL_FILTER'])
    ? $componentParams['INTERNAL_FILTER'] : [];

//
// For custom reload with params
$ajaxLoaderParams = [
    'url' => Crm\Component\EntityDetails\ProductList::getLoaderUrl(
        [
            'site' => SITE_ID,
        ],
        bitrix_sessid_get()
    ),
    'method' => 'POST',
    'dataType' => 'ajax',
    'data' => [
        'PARAMS' => $componentData,
    ],
];

// Force AJAX mode
$componentParams['AJAX_MODE'] = 'Y';
$componentParams['AJAX_OPTION_JUMP'] = 'N';
$componentParams['AJAX_OPTION_HISTORY'] = 'N';
$componentParams['AJAX_LOADER'] = $ajaxLoaderParams;

// Enable sanitizing
$componentParams['IS_EXTERNAL_CONTEXT'] = 'Y';

$APPLICATION->IncludeComponent(
    'mywebstor:hms.entity.product.list',
    $componentData['template'] ?? '',
    $componentParams,
    false,
    [
        'HIDE_ICONS' => 'Y',
        'ACTIVE_COMPONENT' => 'Y'
    ]
);

CMain::FinalActions();