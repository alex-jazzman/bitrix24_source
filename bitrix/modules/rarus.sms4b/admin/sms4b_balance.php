<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php');

use \Bitrix\Main\Localization\Loc;
use \Bitrix\Main\Loader;
use \Rarus\Sms4b\Config;

Loc::loadLanguageFile(__FILE__);

if ($GLOBALS['APPLICATION']->GetGroupRight('rarus.sms4b') < 'R') {
    $GLOBALS['APPLICATION']->AuthForm(Loc::getMessage('SMS4B_MAIN_ACCESS_DENIED'));
}

Loader::includeModule('rarus.sms4b');
/** @var Csms4b $sms4b */
$sms4b = new Csms4b();

$arResult['RESULT_MESSAGE']['TYPE'] = '';

$config = new Config\Service();
try {
    $arResult['Rest'] = $sms4b->getBalance();
    $arResult['RESULT_MESSAGE']['TYPE'] = 'OK';

    $arResult['Login'] = $config->getLogin();
} catch (\Throwable $throwable) {
    $arResult['RESULT_MESSAGE']['TYPE'] = 'ERROR';
    $arResult['RESULT_MESSAGE']['MESSAGE'] = Loc::getMessage('SMS4B_MAIN_ERROR_CONNECTION');
}

require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php');
?>
<form name="form1" method="POST" action="<?= $GLOBALS['APPLICATION']->GetCurPage() ?>">


    <?= bitrix_sessid_post() ?>
    <?php
    $aTabs = [
        [
            'DIV'   => 'edit1',
            'TAB'   => Loc::getMessage('SMS4B_MAIN_SMS_LEFT'),
            'ICON'  => 'sms4b_balance',
            'TITLE' => Loc::getMessage('SMS4B_MAIN_SMS_LEFT')
        ]

    ];
    $tabControl = new CAdminTabControl('tabControl', $aTabs);

    $tabControl->Begin();
    $tabControl->BeginNextTab();

    if ($arResult['RESULT_MESSAGE']['TYPE'] === 'OK') {
        ?>
        <tr>
            <td><?= Loc::getMessage('SMS4B_MAIN_NUMBER_SENDER') ?></td>
            <td>
                <table>
                    <tr>
                        <td align="right"><?= Loc::getMessage('SMS4B_MAIN_LOGIN') ?></td>
                        <td><b><?= $arResult['Login'] ?></b></td>
                    </tr>
                    <tr>
                        <td align="right"><?= Loc::getMessage('SMS4B_MAIN_SMS_CAPT'); ?></td>
                        <td>
                            <b><?= round($arResult['Rest'], 2) ?></b>
                            <?= fmod($arResult['Rest'],
                                1) !== 0 ? Loc::getMessage('SMS4B_MAIN_RUB_PS') : Loc::getMessage('SMS4B_MAIN_SMS_PS'); ?>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <?php
    } else {
        echo '<tr><td colspan="2">' . CAdminMessage::ShowMessage($arResult['RESULT_MESSAGE']['MESSAGE']) . '</td></tr>';
    }
    $disable = true;
    if (($isAdmin || $isDemo) && $isEditMode) {
        $disable = false;
    }
    $tabControl->Buttons();
    ?>
    <input type="submit" value="<?= Loc::getMessage('SMS4B_MAIN_REFRESH') ?>" name="apply">
    <?php
    $tabControl->End();
    ?>
</form>
<?php require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php'); ?>
