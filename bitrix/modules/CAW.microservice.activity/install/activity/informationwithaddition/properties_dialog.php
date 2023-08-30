<?php if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use \Bitrix\Main\Localization\Loc;
Loc::loadLanguageFile(__FILE__);
?>

<tr>
    <td align="right" width="40%">
        <span class="adm-required-field"><?=Loc::getMessage('INPUT_COORDINATING')?>:</span></td>
    <td width="60%">
        <select name="coordinating">
            <option value=""><?= Loc::getMessage('coordinating') ?></option>
            <? foreach ($arCurrentValues['coordinating_items'] as $index): ?>
                <option
                    value="<?= $index ?>"<?= ($index == $arCurrentValues['coordinating'] ? " selected=\"selected\"" : '') ?>><?= $index ?></option>
            <? endforeach; ?>
        </select>
    </td>
</tr>

<tr>
    <td align="right" width="40%">
    <span class="adm-required-field"><?= Loc::getMessage('INPUT_TASKNAME') ?>:</span></td>
    <td width="60%">
        <input type="text" name="taskname" id="id_taskname"
               value="<?= htmlspecialcharsbx($arCurrentValues['taskname']) ?>" size="50">
        <input type="button" value="..." onclick="BPAShowSelector('id_taskname', 'string');">
    </td>
</tr>

<tr>
    <td align="right" width="40%">
    <span class="adm-required-field"><?= Loc::getMessage('INPUT_TASKDESC') ?>:</span></td>
    <td width="60%">
    <textarea style="resize:none" name="taskdesc" id="id_taskdesc" rows="5" cols="52"><?=htmlspecialcharsbx($arCurrentValues['taskdesc'])?></textarea>
        <input type="button" value="..." onclick="BPAShowSelector('id_taskdesc', 'string');">
    </td>
</tr>

<tr>
    <td align="right" width="40%">
    <span class="adm-required-field"><?= Loc::getMessage('INPUT_AGREE') ?>:</span></td>
    <td width="60%">
        <input type="text" name="agree" id="id_agree"
               value="<?= htmlspecialcharsbx($arCurrentValues['agree']) ?>" size="50">
        <input type="button" value="..." onclick="BPAShowSelector('id_agree', 'string');">
    </td>
</tr>

<tr>
    <td align="right" width="40%">
        <span class="adm-required-field"><?=Loc::getMessage('INPUT_SETHEADER')?>:</span></td>
    <td width="60%">
        <select name="setheader">
            <? foreach ($arCurrentValues['YesNo'] as $index): ?>
                <option
                    value="<?= $index ?>"<?= ($index == $arCurrentValues['setheader'] ? " selected=\"selected\"" : '') ?>><?= $index ?></option>
            <? endforeach; ?>
        </select>
    </td>
</tr>

<tr>
    <td align="right" width="40%">
    <span class="adm-required-field"><?= Loc::getMessage('INPUT_TEXTHEADER') ?>:</span></td>
    <td width="60%">
        <input type="text" name="textheader" id="id_textheader"
               value="<?= htmlspecialcharsbx($arCurrentValues['textheader']) ?>" size="50">
        <input type="button" value="..." onclick="BPAShowSelector('id_textheader', 'string');">
    </td>
</tr>

<tr>
<tr>