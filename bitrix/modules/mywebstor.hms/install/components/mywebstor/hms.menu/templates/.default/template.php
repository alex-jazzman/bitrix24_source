<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */

$isBitrix24 = SITE_TEMPLATE_ID === "bitrix24";
if ($isBitrix24) $this->SetViewTarget("above_pagetitle");
$APPLICATION->IncludeComponent(
    "bitrix:main.interface.buttons",
    "",
    array(
        "ID" => "hms_menu",
        "ITEMS" => $arResult["ITEMS"]
    )
);
if ($isBitrix24) $this->EndViewTarget();
