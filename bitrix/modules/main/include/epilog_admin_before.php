<?
/**
 * Bitrix vars
 * @global CUser $USER
 * @global CMain $APPLICATION
 * @global CDatabase $DB
 * @global CUserTypeManager $USER_FIELD_MANAGER
 * @global CCacheManager $CACHE_MANAGER
 */

define("START_EXEC_EPILOG_BEFORE_1", microtime(true));
$GLOBALS["BX_STATE"] = "EB";

if($USER->IsAuthorized() && (!defined("BX_AUTH_FORM") || !BX_AUTH_FORM))
{
	$hkInstance = CHotKeys::getInstance();

	$Execs=$hkInstance->GetCodeByClassName("Global");
	echo $hkInstance->PrintJSExecs($Execs);
	echo $hkInstance->SetTitle("Global");

	$Execs=$hkInstance->GetCodeByUrl($_SERVER["REQUEST_URI"]);

	echo $hkInstance->PrintJSExecs($Execs);
	echo $hkInstance->PrintPhpToJSVars();

	if (!defined('BX_PUBLIC_MODE') || BX_PUBLIC_MODE != 1)
	{
		echo CAdminInformer::PrintHtml();
	}
}

if (!defined('BX_PUBLIC_MODE') || BX_PUBLIC_MODE != 1)
{
	if (!defined("BX_AUTH_FORM") || !BX_AUTH_FORM)
		require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/interface/epilog_main_admin.php");
	else
		require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/interface/epilog_auth_admin.php");
}
else
	require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/interface/epilog_jspopup_admin.php");

?>
