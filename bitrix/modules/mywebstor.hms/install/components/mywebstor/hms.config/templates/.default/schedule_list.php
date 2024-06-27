<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */
global $APPLICATION;

$APPLICATION->IncludeComponent(
    "mywebstor:hms.schedule.list",
    "",
    array()
);

if ($arResult["TEMPLATE_PAGE"] == "schedule_details") { ?>
    <script>
        BX.ready(() => {
            BX.SidePanel.Instance.open("/hms/config/schedule/details/<?= $arResult["SCHEDULE_ID"] ?>/" + (window.location.search || ""));
        });
    </script>
<? }
