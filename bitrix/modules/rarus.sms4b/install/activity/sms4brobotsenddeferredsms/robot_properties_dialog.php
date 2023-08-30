<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}
use \Bitrix\Main\Localization\Loc;
use Bitrix\Main\Loader;

Loc::loadLanguageFile(__FILE__);

/** @var \Bitrix\Bizproc\Activity\PropertiesDialog $dialog */

$map = $dialog->getMap();
$messageText = $map['MessageText'];
$dateFields = $map['dateFields'];
?>

<div class="crm-automation-popup-settings">
	<textarea name="<?= htmlspecialcharsbx($messageText['FieldName']) ?>"
              class="crm-automation-popup-textarea"
              placeholder="<?= htmlspecialcharsbx($messageText['Name']) ?>"
              data-role="inline-selector-target"
    ><?= htmlspecialcharsbx($dialog->getCurrentValue($messageText['FieldName'], '')) ?></textarea>


    <br><span class="crm-automation-popup-settings-title"><?= Loc::getMessage('SMS4B_SEND') ?></span>

    <div class="popup-window-content">
        <div class="crm-automation-popup-select-item">
            <input class="crm-automation-popup-select-input" id="sms4b_after_radio" type="radio" value="after"
                   name="<?= htmlspecialcharsbx($map['radioButton']['FieldName']) ?>"
                <?= ('after' === $dialog->getCurrentValue($map['radioButton']['FieldName'])) ? ' checked="checked"' : '' ?>>
            <label class="crm-automation-popup-select-wrapper" for="sms4b_after_radio">
                <span class="crm-automation-popup-settings-title"><?= Loc::getMessage('SMS4B_AFTER') ?></span>
                <input type="text" name="sms4b_value_after"
                       value="<?= $dialog->getCurrentValue($map['valAfter']['FieldName'], 0) ?>"
                       class="crm-automation-popup-settings-input">
                <input type="radio" name="sms4b_value_type_after" value="M" id="sms4b_after_min"
                       class="crm-automation-popup-select-input"
                    <?= ('M' === $dialog->getCurrentValue($map['valTypeAfter']['FieldName'])) ? ' checked="checked"' : '' ?>>
                <label class="crm-automation-popup-settings-link"
                       for="sms4b_after_min"><?= Loc::getMessage('SMS4B_MINUTES') ?></label>
                <input type="radio" name="sms4b_value_type_after" value="H" id="sms4b_after_hr"
                       class="crm-automation-popup-select-input"
                    <?= ('H' === $dialog->getCurrentValue($map['valTypeAfter']['FieldName'])) ? ' checked="checked"' : '' ?>>
                <label class="crm-automation-popup-settings-link"
                       for="sms4b_after_hr"><?= Loc::getMessage('SMS4B_HOURS') ?></label>
            </label>
        </div>
        <div class="crm-automation-popup-select-item">
            <input class="crm-automation-popup-select-input" id="sms4b_before_radio" type="radio" value="before"
                   name="<?= htmlspecialcharsbx($map['radioButton']['FieldName']) ?>"
                <?= ('before' === $dialog->getCurrentValue($map['radioButton']['FieldName'])) ? ' checked="checked"' : '' ?>>
            <label class="crm-automation-popup-select-wrapper" for="sms4b_before_radio">
                <span class="crm-automation-popup-settings-title"><?= Loc::getMessage('SMS4B_BEFORE') ?></span>
                <input type="text" name="sms4b_value_before"
                       value="<?= $dialog->getCurrentValue($map['valBefore']['FieldName'], 0) ?>"
                       class="crm-automation-popup-settings-input">
                <input type="radio" name="sms4b_value_type_before" value="M" id="sms4b_before_min"
                       class="crm-automation-popup-select-input"
                    <?= ('M' === $dialog->getCurrentValue($map['valTypeBefore']['FieldName'])) ? ' checked="checked"' : '' ?>>
                <label class="crm-automation-popup-settings-link"
                       for="sms4b_before_min"><?= Loc::getMessage('SMS4B_MINUTES') ?></label>
                <input type="radio" name="sms4b_value_type_before" value="H" id="sms4b_before_hr"
                       class="crm-automation-popup-select-input"
                    <?= ('H' === $dialog->getCurrentValue($map['valTypeBefore']['FieldName'])) ? ' checked="checked"' : '' ?>>
                <label class="crm-automation-popup-settings-link"
                       for="sms4b_before_hr"><?= Loc::getMessage('SMS4B_HOURS') ?></label>
                <span class="crm-automation-popup-settings-title"><?= Loc::getMessage('SMS4B_FROM_DATE') ?></span>


                <select class="crm-automation-popup-settings-dropdown"
                        name="<?= htmlspecialcharsbx($dateFields['FieldName']) ?>">
                    <?php foreach ($dateFields['Options'] as $value => $optionLabel): ?>
                        <option value="<?= htmlspecialcharsbx($value) ?>"
                            <?= ($value == $dialog->getCurrentValue($dateFields['FieldName'])) ? ' selected' : '' ?>
                        ><?= htmlspecialcharsbx($optionLabel['Name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </label>
        </div>
    </div>
</div>