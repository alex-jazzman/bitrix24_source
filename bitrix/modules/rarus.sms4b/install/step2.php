<?php require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php');

if (!check_bitrix_sessid()) {
    return;
}
    use \Bitrix\Main\Localization\Loc;
    Loc::loadLanguageFile(__FILE__);
 ?>

<?php if (is_array($errors) && count($errors) > 0): ?>
    <?php foreach ($errors as $val): ?>
        <?php $alErrors .= $val . '<br>'; ?>
    <?php endforeach; ?>
    <?= CAdminMessage::ShowMessage([
        'TYPE' => 'ERROR',
        'MESSAGE' => Loc::getMessage('SMS4B_MAIN_ERR_INST'),
        'DETAILS' => $alErrors,
        'HTML' => true
    ]); ?>
<?php else: ?>
    <?= CAdminMessage::ShowNote(Loc::getMessage('SMS4B_MAIN_SUCC_INST')); ?>

    <p><?= Loc::getMessage('SMS4B_MAIN_HELP_MESS_3') ?></p>

    <form>
        <input type="button" onclick="location.href = '/bitrix/admin/settings.php?mid=rarus.sms4b';"
               value="<?= Loc::getMessage('SMS4B_MAIN_LOAD_SETTINGS') ?>"/>
    </form>

    <p><?= Loc::getMessage('SMS4B_MAIN_INSTALLED') ?></p>
    <ul>
        <?php if ($_REQUEST['INSTALL_COMPONENTS'] == 'Y'): ?>
            <li><b><?= Loc::getMessage('SMS4B_MAIN_INST_COMP') ?></b></li>
        <?php endif; ?>
        <?php if ($_REQUEST['INSTALL_DEMO'] == 'Y'): ?>
            <li><b><?= Loc::getMessage('SMS4B_MAIN_INST_PUB') ?><a href="/sms4b_demo/" target="_blank"><b><?= Loc::getMessage('SMS4B_MAIN_HERE') ?></b></a>;
            </li>
        <?php endif; ?>
        <?php if ($_REQUEST['INSTALL_HELP'] == 'Y'): ?>
            <li> <?= Loc::getMessage('SMS4B_MAIN_INST_HELP') ?> </li>
        <?php endif; ?>
    </ul>
<?php endif; ?>

<form action="<?= $GLOBALS['APPLICATION']->GetCurPage() ?>">
    <input type="hidden" name="lang" value="<?= LANG ?>">
    <input type="submit" name="" value="<?= Loc::getMessage('SMS4B_MAIN_BACK_TO_LIST') ?>">
</form>