<? if (!check_bitrix_sessid()) return;

use Bitrix\Main\Application;
use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);

$queryList = Application::getInstance()
    ->getContext()
    ->getRequest()
    ->getQueryList()
    ->toArray();
$queryList["step"] = "2";
unset($queryList["sessid"]);

/**
 * @var \CMain $APPLICATION
 * @var \CUser $USER
 * @var \CDatabase $DB
 */
global $APPLICATION, $USER, $DB;
?>
<form action="<?= $APPLICATION->GetCurPage() ?>" method="GET">
    <?= bitrix_sessid_post() ?>
    <? foreach ($queryList as $queryKey => $queryValue) { ?>
        <input type="hidden" name="<?= $queryKey ?>" value="<?= $queryValue ?>" />
    <? } ?>
    <? \CAdminMessage::ShowMessage(Loc::getMessage("MOD_UNINST_WARN")) ?>
    <p><?= Loc::getMessage("MOD_UNINST_SAVE") ?></p>
    <p>
        <input type="checkbox" name="savedata" id="savedata" value="Y" checked>
        <label for="savedata"><?= Loc::getMessage("MOD_UNINST_SAVE_TABLES") ?></label>
    </p>
    <input type="submit" value="<?= Loc::getMessage("MOD_UNINST_DEL") ?>">
</form>
