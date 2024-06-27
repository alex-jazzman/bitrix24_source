<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Localization\Loc;

/**
 * @var \CMain $APPLICATION
 * @var \CUser $USER
 * @var \CDatabase $DB
 * @var \CBitrixComponent $component
 * @var \CBitrixComponentTemplate $this
 * @var array $arParams
 * @var array $arResult
 * @var array $templateData
 * @var string $templateFolder
 * @var string $parentTemplateFolder
 * @var string $templateName
 * @var string $componentPath
 */
global $APPLICATION, $USER, $DB;

Loc::loadMessages(__DIR__);

$mainUiGridComponent = new \CBitrixComponent();
$mainUiGridComponent->initComponent("bitrix:main.ui.grid");
$mainUiGridComponent->initComponentTemplate();
$mainUiGridComponent
    ->getTemplate()
    ->__IncludeJSFile();

$toolbarManager = \Bitrix\UI\Toolbar\Manager::getInstance();
$toolbar = $toolbarManager->getToolbarById(\Bitrix\UI\Toolbar\Facade\Toolbar::DEFAULT_ID)
    ?: $toolbarManager->createToolbar(\Bitrix\UI\Toolbar\Facade\Toolbar::DEFAULT_ID, array());

$toolbar->deleteFavoriteStar();
$removeButton = new \Bitrix\UI\Buttons\Button();
$removeButton
    ->setText(Loc::getMessage("HMS_APPOINTMENT_BUTTON_DELETE"))
    ->setColor(\Bitrix\UI\Buttons\Color::LIGHT_BORDER)
    ->bindEvent("click", new \Bitrix\UI\Buttons\JsCode(
        "BX.MyWebstor.HMS.Appointment.Details.Instance.delete();"
    ));
$startReceiveButton = new \Bitrix\UI\Buttons\Button();
$startReceiveButton
    ->setText(Loc::getMessage("HMS_APPOINTMENT_BUTTON_START_RECEIVE"))
    ->setColor(\Bitrix\UI\Buttons\Color::PRIMARY)
    ->bindEvent("click", new \Bitrix\UI\Buttons\JsCode(
        "BX.MyWebstor.HMS.Appointment.Details.Instance.startReceive();"
    ));

$docgenButton = new \Bitrix\UI\Buttons\Button(array(
    "text" => Loc::getMessage('HMS_APPOINTMENT_BUTTON_COMMON_DOCUMENT'),
    "baseClassName" => "ui-btn",
    "classList" => array("ui-btn-md", "ui-btn-light-border", "ui-btn-dropdown", "hms-btn-dropdown-document")
));
$docgenButton->getAttributeCollection()["id"] = "hms-document-button";

if ($arResult["ID"] > 0) {
    if ($arResult["ENTITY_DATA"]["CAN_RECEIVE_START"]) {
        $toolbar->addButton($startReceiveButton);

        if (!$arResult["ENTITY_DATA"]["SPECIALIZATION_ID"]) {
            $startReceiveButton
                ->setDisabled()
                ->addAttribute("data-hint", Loc::getMessage("HMS_APPOINTMENT_RECEIVE_START_HINT_SPECIALIZATION"))
                ->addAttribute("data-hint-no-icon", "");
        }
    }

    $toolbar->addButton($docgenButton);
    $toolbar->addButton($removeButton);
}

\Bitrix\Main\UI\Extension::load(array(
    "mywebstor.hms.entity-editor-fields",
    "mywebstor.hms.entity-selector",
    "mywebstor.hms.entity-tab-manager",
    "calendar.controls",
    "documentpreview",
    "ui.hint",
));

?>
<div class="catalog-entity-section catalog-entity-section-tabs ui-entity-stream-section-planned-above-overlay">
    <ul id="<?= htmlspecialcharsbx($arResult["TABS_CONFIG"]["TAB_MENU_CONTAINER_ID"]) ?>" class="catalog-entity-section-tabs-container">
        <? foreach ($arResult["TABS_CONFIG"]["TABS"] as $tab) {
            $classNames = ['catalog-entity-section-tab'];

            if (isset($tab['active']) && $tab['active']) {
                $classNames[] = 'catalog-entity-section-tab-current';
            } elseif (isset($tab['enabled']) && !$tab['enabled']) {
                $classNames[] = 'catalog-entity-section-tab-disabled';
            } ?>
            <li data-tab-id="<?= htmlspecialcharsbx($tab['id']) ?>" class="<?= implode(' ', $classNames) ?>">
                <a class="catalog-entity-section-tab-link" href="#"><?= htmlspecialcharsbx($tab['name']) ?></a>
            </li>
        <? } ?>
    </ul>
</div>
<div id="<?= htmlspecialcharsbx($arResult["TABS_CONFIG"]["TAB_CONTAINER_ID"]) ?>" style="position:relative;">
    <?
    foreach ($arResult["TABS_CONFIG"]["TABS"] as $tab) {
    ?>
        <div data-tab-id="<?= htmlspecialcharsbx($tab["id"]) ?>" class="" <?= ($tab['active'] ?? null) !== true ? " style=\"display:none;\"" : "" ?>>
            <?
            if ($tab["id"] !== "main") {
                if (isset($tab["html"])) echo $tab["html"];
            } else {
            ?><div class="ui-entity-editor-container-wrapper">
                    <? $APPLICATION->IncludeComponent(
                        "bitrix:ui.form",
                        "",
                        array(
                            "ENTITY_TYPE_NAME" => $arResult["ENTITY_TYPE_NAME"],
                            "ENTITY_ID" => $arResult["ID"],
                            "GUID" => $arResult["GUID"],
                            "READ_ONLY" => false,
                            "ENABLE_BOTTOM_PANEL" => true,
                            "ENABLE_FIELDS_CONTEXT_MENU" => false,
                            "ENABLE_PAGE_TITLE_CONTROLS" => true,
                            "ENABLE_SECTION_EDIT" => false,
                            "ENABLE_SECTION_CREATION" => false,
                            "ENABLE_SETTINGS_FOR_ALL" => true,
                            "ENABLE_SECTION_DRAG_DROP" => false,
                            "ENABLE_FIELD_DRAG_DROP" => false,
                            "ENABLE_CONFIGURATION_UPDATE" => false,
                            "ENABLE_COMMON_CONFIGURATION_UPDATE" => true,
                            "ENABLE_PERSONAL_CONFIGURATION_UPDATE" => true,
                            "ENABLE_CONFIG_CONTROL" => false,
                            "ENABLE_CONFIG_SCOPE_TOGGLE" => false,
                            "FORCE_DEFAULT_CONFIG" => true,
                            "INITIAL_MODE" => $arResult["INITIAL_MODE"],
                            "ENTITY_FIELDS" => $arResult["ENTITY_FIELDS"],
                            "ENTITY_CONFIG" => $arResult["ENTITY_CONFIG"],
                            "ENTITY_CONFIG_OPTIONS" => $arResult["ENTITY_CONFIG_OPTIONS"],
                            "ENTITY_DATA" => $arResult["ENTITY_DATA"],
                            "ENTITY_CONTROLLERS" => $arResult["ENTITY_CONTROLLERS"],
                            "COMPONENT_AJAX_DATA" => $arResult["COMPONENT_AJAX_DATA"]
                        )
                    );
                    ?>
                </div>
                <div class="ui-entity-additional-wrapper">
                    <div class="ui-entity-product-wrapper">
                        <?
                        if (!$arResult["ENTITY_DATA"]["DISABLE_PRODUCT_LIST"])
                            $APPLICATION->IncludeComponent(
                                "mywebstor:hms.entity.product.list",
                                "",
                                $arResult["ENTITY_DATA"]["PRODUCT_LIST_UNSIGNED_PARAMETERS"],
                                array(
                                    "HIDE_ICONS" => "Y",
                                    "ACTIVE_COMPONENT" => "Y"
                                )
                            );
                        ?>
                    </div>
                    <div class="ui-entity-vhi-wrapper">
                        <?
                        $APPLICATION->IncludeComponent(
                            "mywebstor:hms.vhi.appointment",
                            "",
                            $arResult["ENTITY_DATA"]["VHI_CLIENT_INFO"],
                            array(
                                "HIDE_ICONS" => "Y",
                                "ACTIVE_COMPONENT" => "Y"
                            )
                        );
                        ?>
                    </div>
                </div>
            <? } ?>
        </div>
    <? } ?>
</div>

<script>
    BX.Crm.EntityEditorClientSearchBox.messages = {
        contactToCreateTag: "<?= Loc::getMessage('CRM_ENTITY_ED_NEW_CONTACT') ?>",
        companyToCreateTag: "<?= Loc::getMessage('CRM_ENTITY_ED_NEW_COMPANY') ?>",
        contactToCreateLegend: "<?= Loc::getMessage('CRM_ENTITY_ED_NEW_CONTACT_LEGEND') ?>",
        companyToCreateLegend: "<?= Loc::getMessage('CRM_ENTITY_ED_NEW_COMPANY_LEGEND') ?>",
        contactChangeButtonHint: "<?= Loc::getMessage('CRM_ENTITY_ED_CONTACT_CHANGE_BUTTON_HINT') ?>",
        companyChangeButtonHint: "<?= Loc::getMessage('CRM_ENTITY_ED_COMPANY_CHANGE_BUTTON_HINT') ?>",
        entityEditTag: "<?= Loc::getMessage('CRM_ENTITY_ED_EDIT_TAG') ?>",
        notFound: "<?= Loc::getMessage('CRM_ENTITY_ED_NOT_FOUND') ?>",
        unnamed: "<?= CUtil::JSEscape(\CCrmContact::GetDefaultName()) ?>",
        untitled: "<?= CUtil::JSEscape(\CCrmCompany::GetDefaultTitle()) ?>"
    };

    BX.addCustomEvent("BX.UI.EntityEditorControllerFactory:onInitialize", function(factory, config) {
        config.methods["product_list"] = function(type, controllerId, settings) {
            BX.MyWebstor.HMS.Fields.initCrutches(settings.editor);

            return BX.Crm.EntityProductListController.create(controllerId, settings);
        }
    });

    BX.addCustomEvent("EntityProductListController", function(event) {
        const controller = event.getData()[0];
        const entityUpdateFunction = function(event) {
            if (controller.isChanged()) {
                controller.setGridChanged(false);
                controller.reloadGrid(false);
            }
        };

        BX.Event.EventEmitter.unsubscribe(
            "onEntityUpdate",
            entityUpdateFunction
        );
        BX.Event.EventEmitter.subscribe(
            "onEntityUpdate",
            entityUpdateFunction
        );
    });

    BX.ready(function() {
        var appointmentDetails = BX.MyWebstor.HMS.Appointment.Details.getInstance(
            <?= \CUtil::PhpToJSObject(array(
                "entityEditorID" => $arResult["GUID"],
                "appointmentID" => $arResult["ID"],
                "tabs" => $arResult["TABS_CONFIG"]["TABS"],
                "tabContainerId" => htmlspecialcharsbx($arResult["TABS_CONFIG"]["TAB_CONTAINER_ID"]),
                "tabMenuContainerId" => htmlspecialcharsbx($arResult["TABS_CONFIG"]["TAB_MENU_CONTAINER_ID"]),
                "docgenButtonParameters" => $arResult["DOCGEN_BUTTON_PARAMS"],
            )) ?>
        );
    });
</script>
