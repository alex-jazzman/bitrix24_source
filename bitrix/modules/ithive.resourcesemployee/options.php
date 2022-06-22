<?php

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__FILE__);
$moduleId = GetModuleID(__FILE__);

Loader::includeModule('main');
Loader::includeModule($moduleId);

$aTabs = array(
	array('DIV' => 'options', 'TAB' => Loc::Getmessage('TAB_TITLE'), 'ICON' => '', 'TITLE' => Loc::Getmessage('TAB_TITLE')),
);
$tabControl = new CAdminTabControl('tabControl', $aTabs);
$optionsInt = [
	'use_projects',
	'work_hours',
	'show_title',
	'remove_closed',
	'end_date_change_setting',
    'required_fields',
    'hidden_without_time',
    'iblock_absence',
];
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_REQUEST['save'] !== '' || $_REQUEST['apply'] !== '') && check_bitrix_sessid())
{
    foreach ($optionsInt as $option){
		COption::SetOptionInt($moduleId, $option, $_POST[$option]);
    }

	if ($_REQUEST['save'] != '' && $_GET['return_url'] != '')
	{
		LocalRedirect($_GET['return_url']);
	}
	LocalRedirect('/bitrix/admin/settings.php?mid=' . $moduleId . '&mid_menu=1&lang=' . LANGUAGE_ID . ($_GET['return_url'] ? '&return_url=' . urlencode($_GET['return_url']) : '') . '&' . $tabControl->ActiveTabParam());

}
foreach ($optionsInt as $option){
	$$option = COption::GetOptionInt($moduleId, $option);
}
$end_date_change_setting_array = [
	1 => Loc::getMessage("END_DATE_CHANGE_SETTING_1"),
	2 => Loc::getMessage("END_DATE_CHANGE_SETTING_2"),
	3 => Loc::getMessage("END_DATE_CHANGE_SETTING_3"),
	4 => Loc::getMessage("END_DATE_CHANGE_SETTING_4")
];
?>
<form method="POST"
      action="/bitrix/admin/settings.php?mid=<?= $moduleId ?>&mid_menu=1&lang=<? echo LANGUAGE_ID ?><? echo $_GET['return_url'] ? '&amp;return_url=' . urlencode($_GET['return_url']) : '' ?>">
	<?
	$tabControl->Begin();
	$tabControl->BeginNextTab();
	?>
    <tr>
        <td valign="top" width="40%"><?= Loc::Getmessage('USE_PROJECTS') ?></td>
        <td valign="middle"><input type="checkbox" value=1
                                   name="use_projects" <? if ($use_projects) echo 'checked="checked"' ?>></td>
    </tr>
    <tr>
        <td valign="top" width="40%"><?= Loc::Getmessage('SHOW_TITLE') ?></td>
        <td valign="middle"><input type="checkbox" value=1
                                   name="show_title" <? if ($show_title) echo 'checked="checked"' ?>></td>
    </tr>
    <tr>
        <td valign="top" width="40%"><?= Loc::Getmessage('WORK_HOURS') ?></td>
        <td valign="middle"><input type="number" min='0' name="work_hours" value="<?= $work_hours ?>"></td>
    </tr>
    <tr>
        <td valign="top" width="40%"><?= Loc::Getmessage('REMOVE_CLOSED') ?></td>
        <td valign="middle"><input type="checkbox" value=1
                                   name="remove_closed" <? if ($remove_closed) echo 'checked="checked"' ?>></td>
    </tr>
    <tr>
        <td valign="top" width="40%"><?= Loc::Getmessage('END_DATE_CHANGE_SETTING') ?></td>
        <td valign="middle">
			<? foreach ($end_date_change_setting_array as $value => $label): ?>
                <div>
                    <input
                            type="radio"
                            value=<?= $value ?>
                            name="end_date_change_setting"
                            id="end_date_change_setting_<?= $value ?>"
							<? if ($value === $end_date_change_setting): ?>checked<? endif; ?>
                    >
                    <label for="end_date_change_setting_<?= $value ?>"><?= $label ?></label>
                </div>
			<? endforeach; ?>
        </td>
    </tr>
    <tr>
        <td valign="top" width="40%"><?= Loc::Getmessage('REQUIRED_FIELDS') ?></td>
        <td valign="middle"><input type="checkbox" value=1
                                   name="required_fields" <? if ($required_fields) echo 'checked="checked"' ?>></td>
    </tr>
    <tr>
        <td valign="top" width="40%"><?= Loc::Getmessage('HIDDEN_WITHOUT_TIME') ?></td>
        <td valign="middle"><input type="checkbox" value=1
                                   name="hidden_without_time" <? if ($hidden_without_time) echo 'checked="checked"' ?>></td>
    </tr>
    <tr class="selectib">
        <td><?= Loc::getMessage("IBLOCK_ABSENCE") ?></td>
        <td valign="middle"><?
			echo GetIBlockDropDownList(
				$iblock_absence,
				"IBLOCK_TYPE_ID[]",
				'iblock_absence',
				"",
				'class="adm-detail-iblock-types"',
				'class="adm-detail-iblock-list"'
			); ?></td>
    </tr>
	<?
	$tabControl->EndTab();
	$tabControl->Buttons(array(
		'btnApply' => false,
		'back_url' => $_GET['return_url'] ?: '/bitrix/admin/settings.php?mid=' . $moduleId . '&mid_menu=1&lang=' . LANGUAGE_ID,
	));
	?>
	<? echo bitrix_sessid_post(); ?>
    <input type="hidden" name="lang" value="<? echo LANGUAGE_ID ?>">
	<?
	$tabControl->End();
	?>
</form>