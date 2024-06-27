<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */
global $APPLICATION;
include __DIR__ . "/include/menu.php";

$APPLICATION->IncludeComponent(
    "mywebstor:hms.appointment.list",
    "",
    array()
);
