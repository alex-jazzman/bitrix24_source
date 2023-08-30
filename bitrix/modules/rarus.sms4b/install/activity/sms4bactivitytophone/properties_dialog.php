<?php if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use \Bitrix\Main\Localization\Loc;
Loc::loadLanguageFile(__FILE__);

?>

<tr>
    <td align="right" width="40%"><span class="adm-required-field"><?= Loc::getMessage('SMS4B_MAIN_BPMA_PD_TO') ?>
            :</span></td>
    <td width="60%">
        <input type="text" name="sms_user_to" id="id_sms_user_to"
               value="<?= htmlspecialcharsbx($arCurrentValues['sms_user_to']) ?>" size="50">
        <input type="button" value="..." onclick="BPAShowSelector('id_sms_user_to', 'string');">
    </td>
</tr>
<tr>
    <td align="right" width="40%" valign="top"><span
            class="adm-required-field"><?= Loc::getMessage('SMS4B_MAIN_BPMA_PD_BODY') ?>
            :</span></td>
    <td width="60%">
        <textarea name="sms_text" id="id_sms_text" rows="7"
                  cols="40"><?= htmlspecialcharsbx($arCurrentValues['sms_text']) ?></textarea>
        <input type="button" value="..." onclick="BPAShowSelector('id_sms_text', 'string');">
    </td>

</tr>