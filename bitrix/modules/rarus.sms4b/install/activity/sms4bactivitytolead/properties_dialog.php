<?php if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use \Bitrix\Main\Localization\Loc;
Loc::loadLanguageFile(__FILE__);
?>

<tr>
    <td align="right" width="40%"><span class="adm-required-field"><?= Loc::getMessage('SMS4B_MAIN_BPMA_PD_TO') ?>
            <mark title="<?= Loc::getMessage('SMS4B_MAIN_BPMA_HELP_TO') ?>">[?]</mark>:</span></td>
    <td width="60%">
        <input type="text" name="sms_user_to" id="id_sms_user_to"
               value="<?= htmlspecialcharsbx($arCurrentValues['sms_user_to']) ?>" size="50">
        <input type="button" value="..." onclick="BPAShowSelector('id_sms_user_to', 'string');">
    </td>
</tr>
<tr>
    <td align="right" width="40%"><span class="adm-required-field"><?= Loc::getMessage('SMS4B_MAIN_BPMA_PD_PROP') ?>
            <mark title="<?= Loc::getMessage('SMS4B_MAIN_BPMA_HELP_PROP') ?>">[?]</mark>:</span></td>
    <td width="60%">
        <select name="user_property_phone">
            <option value=""><?= Loc::getMessage('SMS4B_MAIN_NOT_DETERMINED') ?></option>
            <?php foreach ($arCurrentValues['CONTACT_PROPS'] as $index): ?>
                <option
                    value="<?= $index ?>"<?= ($index == $arCurrentValues['user_property_phone'] ? " selected=\"selected\"" : '') ?>><?= $index ?></option>
            <?php endforeach; ?>
        </select>
    </td>
</tr>

<tr>
    <td align="right" width="40%"><span class="adm-required-field"><?= Loc::getMessage('SMS4B_MAIN_BPMA_PD_ONE_ALL') ?>
            <mark title="<?= Loc::getMessage('SMS4B_MAIN_BPMA_HELP_ONE_ALL') ?>">[?]</mark>:</span></td>
    <td width="60%">
        <input type="radio" name="radio_param"
               value="one" <?= ('one' == $arCurrentValues['radio_param'] ? ' checked' : '') ?>><?= Loc::getMessage('SMS4B_MAIN_BPMA_PD_ONE') ?>
        <Br>
        <input type="radio" name="radio_param"
               value="all" <?= ('all' == $arCurrentValues['radio_param'] ? ' checked' : '') ?>><?= Loc::getMessage('SMS4B_MAIN_BPMA_PD_ALL') ?>
        <Br>
    </td>
</tr>

<tr>
    <td align="right" width="40%" valign="top"><span class="adm-required-field"><?= Loc::getMessage('SMS4B_MAIN_BPMA_PD_BODY') ?>
            :</span></td>
    <td width="60%">
        <textarea name="sms_text" id="id_sms_text" rows="7"
                  cols="40"><?= htmlspecialcharsbx($arCurrentValues['sms_text']) ?></textarea>
        <input type="button" value="..." onclick="BPAShowSelector('id_sms_text', 'string');">
    </td>
</tr>