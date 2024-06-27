<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */
global $APPLICATION;

$APPLICATION->IncludeComponent(
    "mywebstor:hms.office.list",
    "",
    array()
);

if ($arResult["TEMPLATE_PAGE"] == "office_details") { ?>
    <script>
        BX.ready(() => {
            BX.SidePanel.Instance.open("/hms/config/office/details/<?= $arResult["OFFICE_ID"] ?>/" + (window.location.search || ""));
        });
    </script>
<? }
