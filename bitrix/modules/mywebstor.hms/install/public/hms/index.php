<?
require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/header.php");
/** @var \CMain $APPLICATION */

$APPLICATION->IncludeComponent(
    "mywebstor:hms",
    ""
);

require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/footer.php");
