<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */
global $APPLICATION;

$APPLICATION->IncludeComponent(
    "mywebstor:hms.clinic.list",
    "",
    array()
);

if ($arResult["TEMPLATE_PAGE"] == "clinic_details") { ?>
    <script>
        BX.ready(() => {
            BX.SidePanel.Instance.open("/hms/config/clinic/details/<?= $arResult["CLINIC_ID"] ?>/" + (window.location.search || ""));
        });
    </script>
<? }
