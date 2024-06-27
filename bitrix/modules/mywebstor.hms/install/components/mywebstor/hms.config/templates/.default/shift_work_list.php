<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */
global $APPLICATION;

$APPLICATION->IncludeComponent(
    "mywebstor:hms.shift_work.list",
    "",
    array()
);

if ($arResult["TEMPLATE_PAGE"] == "shift_work_details") { ?>
    <script>
        BX.ready(() => {
            BX.SidePanel.Instance.open("/hms/config/shift_work/details/<?= $arResult["SHIFT_WORK_ID"] ?>/" + (window.location.search || ""));
        });
    </script>
<? }
