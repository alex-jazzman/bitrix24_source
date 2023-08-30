<?php if (!check_bitrix_sessid()) {
    return;
}
use \Bitrix\Main\Localization\Loc;
Loc::loadLanguageFile(__FILE__);
?>

<?php if ($errors === false): ?>
    <?= CAdminMessage::ShowNote(Loc::getMessage('SMS4B_MAIN_UNINST_SUCCESS')); ?>
<?php else: ?>
    <?php for ($i = 0; $i < count($errors); $i++) {
        $alErrors .= $errors[$i] . '<br>';
    } ?>
    <?= CAdminMessage::ShowMessage([
        'TYPE' => 'ERROR',
        'MESSAGE' => Loc::getMessage('SMS4B_MAIN_UNINSTALL_ERROR'),
        'DETAILS' => $alErrors,
        'HTML' => true
    ]); ?>
<?php endif; ?>

<form action="<?= $GLOBALS['APPLICATION']->GetCurPage() ?>">
    <input type="hidden" name="lang" value="<?= LANG ?>">
    <input type="submit" name="" value="<?= Loc::getMessage('SMS4B_MAIN_BACK_TO_MOD_LIST') ?>">
</form>
