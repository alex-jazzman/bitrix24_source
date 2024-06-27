<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */
global $APPLICATION;

$APPLICATION->IncludeComponent(
    "mywebstor:hms.vhi.type.list",
    "",
    array()
);

if ($arResult["TEMPLATE_PAGE"] == "vhi_type_details") { ?>
    <script>
        BX.ready(() => {
            BX.SidePanel.Instance.open("/hms/config/vhi/type/details/<?= $arResult["VHI_TYPE_ID"] ?>/" + (window.location.search || ""));
        });
    </script>
<? }
