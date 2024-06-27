<?

define('NO_KEEP_STATISTIC', 'Y');
define('NO_AGENT_STATISTIC', 'Y');
define('NO_AGENT_CHECK', true);
define('PUBLIC_AJAX_MODE', true);
define('DisableEventsCheck', true);

/**
 * @var \CMain $APPLICATION
 * @var \CUser $USER
 * @var \CDatabase $DB
 */
global $APPLICATION, $USER, $DB;

$siteID = isset($_REQUEST['site']) ? mb_substr(preg_replace('/[^a-z0-9_]/i', '', $_REQUEST['site']), 0, 2) : '';
if ($siteID !== '') {
    define('SITE_ID', $siteID);
}

require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php');
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) {
    die();
}

if (!CModule::IncludeModule('mywebstor.hms') || !CCrmSecurityHelper::IsAuthorized() || !check_bitrix_sessid()) {
    die();
}

Header('Content-Type: text/html; charset=' . LANG_CHARSET);
$APPLICATION->ShowAjaxHead();

$componentData = isset($_REQUEST['PARAMS']) && is_array($_REQUEST['PARAMS']) ? $_REQUEST['PARAMS'] : [];
$componentParams = [];
if (isset($componentData['signedParameters'])) {
    $componentParams = \Bitrix\Main\Component\ParameterSigner::unsignParameters(
        "mywebstor:hms.reception",
        (string)$componentData['signedParameters']
    );
    if (is_null($componentParams)) {
        die();
    }
} elseif (isset($componentData['params']) && is_array($componentData['params'])) {
    ShowError('Component params must be signed');
    die();
}

echo '<div id="calendar-content"><div class="calendar-content-paddings">';

$APPLICATION->IncludeComponent(
    'mywebstor:hms.reception',
    isset($componentData['template']) ? $componentData['template'] : '',
    $componentParams,
    false,
    array('HIDE_ICONS' => 'Y', 'ACTIVE_COMPONENT' => 'Y')
);

echo "</div></div>";

require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_after.php');
die();
