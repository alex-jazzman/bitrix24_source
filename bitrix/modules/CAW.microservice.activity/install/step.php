<?require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php');

if (!check_bitrix_sessid()) {
    return;
}
    use \Bitrix\Main\Localization\Loc;
    Loc::loadLanguageFile(__FILE__);
 ?>

<? if (is_array($errors) && count($errors) > 0): ?>
    <? foreach ($errors as $val): ?>
        <? $alErrors .= $val . '<br>'; ?>
    <? endforeach; ?>
    <?= CAdminMessage::ShowMessage(Array(
        'TYPE' => 'ERROR',
        'MESSAGE' => Loc::getMessage('MAIN_ERR_INST'),
        'DETAILS' => $alErrors,
        'HTML' => true
    )); ?>
<? else: ?>
    <?= CAdminMessage::ShowNote(Loc::getMessage('MAIN_SUCC_INST')); ?>
<? endif; ?>

<form action="<?= $GLOBALS['APPLICATION']->GetCurPage() ?>">
    <input type="hidden" name="lang" value="<?= LANG ?>">
    <input type="submit" name="" value="<?= Loc::getMessage('MAIN_BACK_TO_LIST') ?>">
</form>