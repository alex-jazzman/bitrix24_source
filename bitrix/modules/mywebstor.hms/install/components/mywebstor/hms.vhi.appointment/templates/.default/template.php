<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * @var \CMain $APPLICATION
 * @var \CUser $USER
 * @var \CDatabase $DB
 * @var \HmsVhiAppointmentComponent $component
 * @var \CBitrixComponentTemplate $this
 * @var array $arParams
 * @var array $arResult
 * @var array $templateData
 * @var string $templateFolder
 * @var string $parentTemplateFolder
 * @var string $templateName
 * @var string $componentPath
 */

use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

\Bitrix\Main\UI\Extension::load(array(
    "ui.alerts"
));

$vhiArray = $component->vhiArray;

?>
<div id="hms_vhi" class="ui-entity-editor-section">
    <div class="ui-entity-editor-section-header">
        <div class="ui-entity-editor-header-title">
            <span class="ui-entity-editor-header-title-text"><?= Loc::getMessage("HMS_VHI_APPOINTMENT_BLOCK_TITLE") ?> "<?= $component->contact["FULL_NAME"] ?>"</span>
        </div>
        <div class="ui-entity-editor-header-actions"></div>
    </div>
    <div class="ui-entity-editor-section-content">
        <? if (empty($vhiArray)) { ?>
            <div class="ui-alert ui-alert-primary">
                <span class="ui-alert-message"><strong><?= Loc::getMessage("HMS_VHI_APPOINTMENT_EMPTY") ?></strong></span>
            </div>
            <? } else {
            foreach ($vhiArray as $vhi) {
            ?>
                <div class="ui-alert">
                    <div class="ui-alert-message">
                        <span><?= Loc::getMessage("HMS_VHI_APPOINTMENT_VHI_TITLE") ?></span>
                        <strong><?= $vhi->getNumber() ?>. </strong>
                        <? if ($vhi->getDateEnd()) { ?><span><?= Loc::getMessage("HMS_VHI_APPOINTMENT_VHI_UNTIL_DATE", array("#DATE_END#" => $vhi->getDateEnd()->toString())) ?>. </span><? } ?>
                        <? if ($vhi->getVhiType()) { ?><?= Loc::getMessage("HMS_VHI_APPOINTMENT_VHI_TYPE") ?> "<?= $vhi->getVhiType()->getTitle() ?>"<? } ?>
                    </div>
                    <? if ($vhi->getVhiType() && $vhi->getVhiType()->getServiceType()) { ?>
                        <ul class="ui-alert-vhi-list">
                            <? foreach ($vhi->getVhiType()->getServiceType()->getAll() as $vhiBind) { ?>
                                <li class="<?= $vhiBind->getActive() ? "active" : "inactive" ?>"><?= $vhiBind->getVhiServiceType()->getTitle() ?></li>
                            <? } ?>
                        </ul>
                    <? } ?>
                </div>
        <?
            }
        } ?>
    </div>
</div>
