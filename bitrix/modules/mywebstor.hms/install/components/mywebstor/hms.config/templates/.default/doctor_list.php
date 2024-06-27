<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */
global $APPLICATION;

$APPLICATION->IncludeComponent(
    "mywebstor:hms.doctor.list",
    "",
    array()
);

if ($arResult["TEMPLATE_PAGE"] == "doctor_details") { ?>
    <script>
        BX.ready(() => {
            BX.SidePanel.Instance.open("/hms/config/doctor/details/<?= $arResult["DOCTOR_ID"] ?>/" + (window.location.search || ""));
        });
    </script>
<? }
