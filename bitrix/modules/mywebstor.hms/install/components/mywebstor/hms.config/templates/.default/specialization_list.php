<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */
global $APPLICATION;

$APPLICATION->IncludeComponent(
    "mywebstor:hms.specialization.list",
    "",
    array()
);

if ($arResult["TEMPLATE_PAGE"] == "specialization_details") { ?>
    <script>
        BX.ready(() => {
            BX.SidePanel.Instance.open("/hms/config/specialization/details/<?= $arResult["SPECIALIZATION_ID"] ?>/" + (window.location.search || ""));
        });
    </script>
<? }
