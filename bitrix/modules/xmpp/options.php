<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Localization\Loc;

/**
 * @global \CMain $APPLICATION
 * @global \CUser $USER
 * @global string $mid
 * @global string $module_id
 * @global string $TRANS_RIGHT
 */
$module_id = "xmpp";

if (!$USER->isAdmin() && !\Bitrix\Main\Loader::includeModule("xmpp"))
{
	return;
}

$userRights = \CMain::getUserRight($module_id, $USER->getUserGroupArray());
if ($userRights < 'R')
{
	return;
}

$Update = !empty($_REQUEST['Update']) ? 'Y' : '';
$Apply = !empty($_REQUEST['Apply']) ? 'Y' : '';


Loc::loadMessages($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/options.php");
Loc::loadMessages(__FILE__);

\Bitrix\Main\Loader::includeModule('iblock');

if (
	$_SERVER['REQUEST_METHOD'] == 'POST'
	&& $Update. $Apply <> ''
	&& check_bitrix_sessid()
)
{
	Option::set('xmpp', 'domain_name', $_POST['domain_name']);
	Option::set('xmpp', 'listen_domain', $_POST['listen_domain']);
	Option::set('xmpp', 'domain_lang', $_POST['domain_lang']);
	Option::set('xmpp', 'php_path', $_POST['php_path']);
	Option::set('xmpp', 'log_level', $_POST['log_level']);
	Option::set('xmpp', 'start_ssl', mb_strtoupper($_POST['start_ssl']));
	Option::set('xmpp', 'iblock_presence', (int)$_POST['iblock_presence']);
	Option::set('xmpp', 'sonet_sender_type', $_POST['sonet_sender_type']);
	Option::set('xmpp', 'sonet_jid', $_POST['sonet_jid']);
	Option::set('xmpp', 'sonet_uid', $_POST['sonet_uid']);
	Option::set('xmpp', 'name_template', $_POST['name_template']);
}

$aTabs = array(
	array("DIV" => "edit1", "TAB" => Loc::getMessage("MAIN_TAB_SET"), "ICON" => "vote_settings", "TITLE" => Loc::getMessage("MAIN_TAB_TITLE_SET")),
);
if (IsModuleInstalled("socialnetwork"))
	$aTabs[] = array("DIV" => "edit3", "TAB" => Loc::getMessage("XMPP_TAB_SONET"), "ICON" => "vote_settings", "TITLE" => Loc::getMessage("XMPP_TAB_TITLE_SONET"));

$aTabs[] = array("DIV" => "edit2", "TAB" => Loc::getMessage("MAIN_TAB_RIGHTS"), "ICON" => "vote_settings", "TITLE" => Loc::getMessage("MAIN_TAB_TITLE_RIGHTS"));

$tabControl = new CAdminTabControl("tabControl", $aTabs);
?>
<?
$tabControl->Begin();
?><form method="POST" action="<?= $APPLICATION->GetCurPage()?>?mid=<?=htmlspecialcharsbx($mid)?>&lang=<?=LANGUAGE_ID?>" id="FORMACTION"><?
?><?=bitrix_sessid_post()?><?
$tabControl->BeginNextTab();
?>

	<tr>
		<td width="50%"><?= Loc::getMessage("XMPP_OPT_DOMAIN") ?>:</td>
		<td width="50%">
			<?$val = Option::get("xmpp", "domain_name", "");?>
			<input type="text" size="35" maxlength="255" value="<?=htmlspecialcharsbx($val)?>" name="domain_name"></td>
	</tr>
	<tr>
		<td width="50%"><?= Loc::getMessage("XMPP_OPT_LISTEN_DOMAIN") ?><span class="required"><sup>1</sup></span>:</td>
		<td width="50%">
			<?$val = Option::get("xmpp", "listen_domain", "0.0.0.0");?>
			<input type="text" size="35" maxlength="255" value="<?=htmlspecialcharsbx($val)?>" name="listen_domain"></td>
	</tr>
	<tr>
		<td width="50%"><?= Loc::getMessage("XMPP_OPT_LANG") ?>:</td>
		<td width="50%">
			<?$val = Option::get("xmpp", "domain_lang", "en");?>
			<input type="text" size="35" maxlength="255" value="<?=htmlspecialcharsbx($val)?>" name="domain_lang"></td>
	</tr>
	<tr>
		<td width="50%"><?= Loc::getMessage("XMPP_OPT_PHP_PATH") ?>:</td>
		<td width="50%">
			<?$val = Option::get("xmpp", "php_path", (mb_strtoupper(mb_substr(PHP_OS, 0, 3)) === "WIN") ? "../apache/php.exe -c ../apache/php.ini" : "php -c /etc/php.ini");?>
			<input type="text" size="35" maxlength="255" value="<?=htmlspecialcharsbx($val)?>" name="php_path"></td>
	</tr>
	<tr>
		<td width="50%"><?= Loc::getMessage("XMPP_OPT_LOG_LEVEL") ?>:</td>
		<td width="50%">
			<?$val = (int)Option::get("xmpp", "log_level", "4");?>
			<select name="log_level">
				<?for ($i = 0; $i < 11; $i++):?>
					<option value="<?= $i ?>"<?= (($i == $val) ? " selected" : "")?>><?= $i ?></option>
				<?endfor;?>
			</select>
	</tr>
	<tr>
		<td width="50%"><?= Loc::getMessage("XMPP_OPT_SSL") ?><span class="required"><sup>2</sup></span>:</td>
		<td width="50%">
			<? $val = mb_strtoupper(Option::get("xmpp", "start_ssl", "N"));?>
			<select name="start_ssl">
				<option value="N"<?= (("N" === $val) ? " selected" : "")?>><?= Loc::getMessage("XMPP_OPT_NO") ?></option>
				<option value="Y"<?= (("Y" === $val) ? " selected" : "")?>><?= Loc::getMessage("XMPP_OPT_YES") ?></option>
			</select>
	</tr>
	<tr>
		<td width="50%"><?= Loc::getMessage("XMPP_OPT_PRESENCE") ?>:</td>
		<td width="50%">
			<?$val = (int)Option::get("xmpp", "iblock_presence");?>
			<select name="iblock_presence">
				<option value="0"></option>
				<?
				$dbIBlock = CIBlock::GetList(array('NAME' => 'ASC', 'CODE' => 'ASC'), array('ACTIVE' => 'Y'));
				while ($arIBlock = $dbIBlock->Fetch())
				{
					?><option value="<?= htmlspecialcharsbx($arIBlock['ID']) ?>"<?= (($arIBlock['ID'] == $val) ? " selected" : "")?>><?
					echo ($arIBlock['CODE'] ? '['.htmlspecialcharsbx($arIBlock['CODE']).'] ' : '');
					echo htmlspecialcharsbx($arIBlock['NAME']);
					?></option><?
				}
				?>
			</select>
	</tr>
	<tr>
		<td width="50%"><?= Loc::getMessage("XMPP_NAME_TEMPLATE") ?>:</td>
		<td width="50%">
			<?$curVal = str_replace(array("#NOBR#","#/NOBR#"), array("",""), Option::get("xmpp", "name_template", "#LAST_NAME# #NAME#"));?>
			<select name="name_template">
				<?
				$arNameTemplates = CSite::GetNameTemplates();
				foreach ($arNameTemplates as $template => $phrase)
				{
					$template = str_replace(array("#NOBR#","#/NOBR#"), array("",""), $template);
					?><option value="<?= $template?>" <?=(($template == $curVal) ? " selected" : "")?> ><?= $phrase?></option><?
				}
				?>
			</select>
	</tr>
<?$tabControl->BeginNextTab();?>

	<tr>
		<td width="50%"><?= Loc::getMessage("XMPP_OPT_SONET_UID") ?>:</td>
		<td width="50%">
			<?$val = Option::get("xmpp", "sonet_sender_type", "jid");?>
			<input type="radio" name="sonet_sender_type" id="sonet_sender_type_jid" value="jid" OnClick="manageSonetSenderType('jid')"<?=$val==="jid"?" checked":""?>><label for="sonet_sender_type_jid"><?=Loc::getMessage("XMPP_OPT_SONET_TYPE_JID")?></label><br>
			<input type="radio" name="sonet_sender_type" id="sonet_sender_type_uid" value="uid" OnClick="manageSonetSenderType('uid')"<?=$val==="uid"?" checked":""?>><label for="sonet_sender_type_uid"><?=Loc::getMessage("XMPP_OPT_SONET_TYPE_UID")?></label><br>
		</td>
	</tr>	
	<tr>
		<td width="50%"><?= Loc::getMessage("XMPP_OPT_SONET_JID") ?>:</td>
		<td width="50%">
			<?$val = Option::get("xmpp", "sonet_jid", "admin@".$_SERVER["SERVER_NAME"]);?>
			<input type="text" size="35" maxlength="255" value="<?=htmlspecialcharsbx($val)?>" name="sonet_jid" id="sonet_jid"></td>
	</tr>
	<tr>
		<td width="50%"><?= Loc::getMessage("XMPP_OPT_SONET_UID") ?>:</td>
		<td width="50%">
			<?$val = Option::get("xmpp", "sonet_uid", "");?>
			<input type="text" size="5" maxlength="10" value="<?=htmlspecialcharsbx($val)?>" name="sonet_uid" id="sonet_uid"></td>
	</tr>
<?$tabControl->EndTab();?>
	<script language="JavaScript">
		manageSonetSenderType(false);
		function manageSonetSenderType(what)
		{
			var jid = document.getElementsByName('sonet_jid')[0];
			var uid = document.getElementsByName('sonet_uid')[0];
			if(what==false)
			{
				var radio = document.getElementsByName('sonet_sender_type');
				for(var i=0;i<radio.length;i++)
					if(radio[i].checked)
						what=radio[i].value;
			}
			jid.disabled = what != 'jid';
			uid.disabled = what != 'uid';
		}
	</script>
	
<?$tabControl->BeginNextTab();?>
<?require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/admin/group_rights.php");?>
<?$tabControl->Buttons();?>
<input type="hidden" name="Update" value="Y">
<input <?if (!$USER->IsAdmin()) echo "disabled" ?> class="adm-btn-save" type="submit" name="Update" value="<?= Loc::getMessage("XMPP_OPT_ACT_APPLY") ?>">
<input type="reset" name="reset" value="<?= Loc::getMessage("XMPP_OPT_ACT_DEFAULT") ?>">
<?$tabControl->End();?>
</form>

<?= BeginNote();?>
<span class="required"><sup>1</sup></span> <?= Loc::getMessage("XMPP_OPT_NOTE_1")?><br>
<span class="required"><sup>2</sup></span> <?= Loc::getMessage("XMPP_OPT_NOTE_2")?>
<?= EndNote();?>
