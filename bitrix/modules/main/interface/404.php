<?
if($_SERVER["REDIRECT_STATUS"]=="404")
	define("ERROR_404","Y");

define('BX_ADMIN_SECTION_404', 'Y');

if (($pos = mb_strpos($_SERVER["REQUEST_URI"], "?")) !== false)
{
	$params = mb_substr($_SERVER["REQUEST_URI"], $pos + 1);
	parse_str($params, $_GET);
	foreach ($_GET as $key => $val)
	{
		if (!isset($GLOBALS[$key]))
		{
			$GLOBALS[$key] = $val;
		}
	}
}

require_once(__DIR__."/../include/prolog_admin_before.php");
IncludeModuleLangFile(__FILE__);

$APPLICATION->SetTitle(GetMessage("404_title"));
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
?>

<div class="adm-404-block">
	<div class="adm-404-text1">
		<?echo GetMessage("404_header")?>
	</div>
	<div class="adm-404-text2"><?echo GetMessage("404_message")?></div>
	<div class="adm-404-footer"></div>
</div>

<?
require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_admin.php");
?>