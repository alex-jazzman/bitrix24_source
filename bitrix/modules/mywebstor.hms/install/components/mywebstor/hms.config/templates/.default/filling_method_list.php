<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */
global $APPLICATION;

$APPLICATION->IncludeComponent(
    "mywebstor:hms.filling_method.list",
    "",
    array()
);

if ($arResult["TEMPLATE_PAGE"] == "filling_method_details") { ?>
    <script>
        BX.ready(() => {
            BX.SidePanel.Instance.open("/hms/config/filling_method/details/<?= $arResult["FILLING_METHOD_ID"] ?>/" + (window.location.search || ""));
        });
    </script>
<? }
