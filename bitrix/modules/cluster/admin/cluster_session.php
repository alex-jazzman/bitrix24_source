<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php';
/** @global CUser $USER */
global $USER;
/** @global CMain $APPLICATION */
global $APPLICATION;
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/cluster/prolog.php';
IncludeModuleLangFile(__FILE__);

if (!$USER->isAdmin())
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

if (!CModule::IncludeModule('security'))
{
	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';
	ShowError(GetMessage('CLU_SESSION_NO_SECURITY'));
	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
}

$aTabs = [
	[
		'DIV' => 'savedb',
		'TAB' => GetMessage('CLU_SESSION_SAVEDB_TAB'),
		'ICON' => 'main_user_edit',
		'TITLE' => GetMessage('CLU_SESSION_SAVEDB_TAB_TITLE'),
	],
];
$tabControl = new CAdminTabControl('tabControl', $aTabs);

if (
	$_SERVER['REQUEST_METHOD'] == 'POST'
	&& check_bitrix_sessid()
	&& (
		(isset($_REQUEST['save']) && $_REQUEST['save'] != '')
		|| (isset($_REQUEST['apply']) && $_REQUEST['apply'] != '')
		|| (isset($_REQUEST['db_session_on']) && $_REQUEST['db_session_on'] != '')
		|| (isset($_REQUEST['db_session_off']) && $_REQUEST['db_session_off'] != '')
	)
)
{
	if (isset($_REQUEST['db_session_on']) && $_REQUEST['db_session_on'] != '')
	{
		COption::SetOptionString('security', 'session', 'Y');
		CSecuritySession::Init();
		CAgent::RemoveAgent('CSecuritySession::CleanUpAgent();', 'security');
		CAgent::Add([
			'NAME' => 'CSecuritySession::CleanUpAgent();',
			'MODULE_ID' => 'security',
			'ACTIVE' => 'Y',
			'AGENT_INTERVAL' => 1800,
			'IS_PERIOD' => 'N',
		]);
	}
	elseif (isset($_REQUEST['db_session_off']) && $_REQUEST['db_session_off'] != '')
	{
		COption::SetOptionString('security', 'session', 'N');
		CAgent::RemoveAgent('CSecuritySession::CleanUpAgent();', 'security');
	}

	if ((isset($_REQUEST['save']) && $_REQUEST['save'] != '') && $_GET['return_url'] != '')
	{
		LocalRedirect($_GET['return_url']);
	}
	else
	{
		LocalRedirect('/bitrix/admin/cluster_session.php?lang=' . LANGUAGE_ID . ($_GET['return_url'] ? '&return_url=' . urlencode($_GET['return_url']) : '') . '&' . $tabControl->ActiveTabParam());
	}
}

$APPLICATION->SetTitle(GetMessage('CLU_SESSION_TITLE'));

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';

?>
<form method="POST" action="cluster_session.php?lang=<?php echo LANGUAGE_ID?><?php echo $_GET['return_url'] ? '&amp;return_url=' . urlencode($_GET['return_url']) : ''?>"  enctype="multipart/form-data" name="editform">
<?php
$tabControl->Begin();
$tabControl->BeginNextTab();
?>
<?php if (COption::GetOptionString('security', 'session') == 'Y'):?>
	<tr>
		<td valign="top" colspan="2" align="left">
			<?php echo CAdminMessage::ShowMessage(['TYPE' => 'OK', 'MESSAGE' => GetMessage('CLU_SESSION_DB_ON')])?>
		</td>
	</tr>
	<tr>
		<td valign="top" colspan="2" align="left">
			<input type="submit" name="db_session_off" value="<?php echo GetMessage('CLU_SESSION_DB_BUTTON_OFF')?>">
		</td>
	</tr>
<?php else:?>
	<tr>
		<td valign="top" colspan="2" align="left">
			<?php echo CAdminMessage::ShowMessage(GetMessage('CLU_SESSION_DB_OFF'))?>
		</td>
	</tr>
	<?php if (CSecuritySession::CheckSessionId(session_id())):?>
	<tr>
		<td valign="top" colspan="2" align="left">
			<input type="submit" name="db_session_on" value="<?php echo GetMessage('CLU_SESSION_DB_BUTTON_ON')?>">
		</td>
	</tr>
	<?php else:?>
	<tr>
		<td valign="top" colspan="2" align="left">
			<?php echo CAdminMessage::ShowMessage(GetMessage('CLU_SESSION_SESSID_WARNING'))?>
		</td>
	</tr>
	<?php endif;?>
<?php endif;?>
<tr>
	<td colspan="2">
		<?php echo BeginNote(), GetMessage('CLU_SESSION_DB_WARNING'), EndNote();?>
	</td>
</tr>
<?php
$tabControl->Buttons(
	[
		'back_url' => $_GET['return_url'] ?: 'cluster_session.php?lang=' . LANG,
	]
);
?>
<?php echo bitrix_sessid_post();?>
<input type="hidden" name="lang" value="<?php echo LANG?>">
<?php
$tabControl->End();
?>
</form>
<?php
echo BeginNote(), GetMessage('CLU_SESSION_NOTE'), EndNote();

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
