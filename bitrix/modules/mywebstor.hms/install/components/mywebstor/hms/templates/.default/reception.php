<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */
include __DIR__ . "/include/menu.php";

$APPLICATION->IncludeComponent(
    "mywebstor:hms.reception",
    "",
    array(),
    $component
);

if ($arResult["TEMPLATE_PAGE"] == "appointment_details") { ?>
    <script>
        BX.ready(() => {
            BX.SidePanel.Instance.open("/hms/reception/appointment/details/<?= $arResult["APPOINTMENT_ID"] ?>/" + (window.location.search || ""));
            BX.SidePanel.Instance.pageUrl = "/hms/reception/";
        });
    </script>
<? }
