<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
/** @var \CMain $APPLICATION */
global $APPLICATION;

$APPLICATION->IncludeComponent(
    "mywebstor:hms.vhi.service_type.list",
    "",
    array()
);

if ($arResult["TEMPLATE_PAGE"] == "vhi_service_type_details") { ?>
    <script>
        BX.ready(() => {
            BX.SidePanel.Instance.open("/hms/config/vhi/service_type/details/<?= $arResult["VHI_SERVICE_TYPE_ID"] ?>/" + (window.location.search || ""));
        });
    </script>
<? }
