<?
define('NOT_CHECK_PERMISSIONS', true);
require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/prolog_before.php");

/**
 * @var \CMain $APPLICATION
 * @var \CUser $USER
 * @var \CDatabase $DB
 */
global $APPLICATION, $USER, $DB;

$APPLICATION->IncludeComponent(
    "mywebstor:caw.chang_status_activity",
    ""
);

require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/epilog_after.php");