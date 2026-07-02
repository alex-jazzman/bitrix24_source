<?php

use Bitrix\Main\Application;
use Bitrix\Main\Web\Json;
use Bitrix\Main\Config\Configuration;
use Bitrix\Main\Data\Cache;
use Bitrix\Main\Loader;
use Bitrix\Landing\Block;
use Bitrix\Main\Composite\Helper;
use Bitrix\Main\Composite\Page;
use Bitrix\Main\ModuleManager;

if(
	isset($_SERVER["REQUEST_METHOD"]) && $_SERVER["REQUEST_METHOD"] == "POST"
	&& isset($_REQUEST["ajax"]) && $_REQUEST["ajax"]=="y"
	&& isset($_REQUEST["clearcache"]) && $_REQUEST["clearcache"] == "Y"
)
{
	define("STOP_STATISTICS", true);
}

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
define("HELP_FILE", "settings/settings/cache.php");

/**
 * @global CUser $USER
 * @global CMain $APPLICATION
 * @global CCacheManager $CACHE_MANAGER
 * @global CStackCacheManager $stackCacheManager
 */

$isAdmin = $USER->CanDoOperation('cache_control');

$cachetype = $_REQUEST["cachetype"] ?? null;

IncludeModuleLangFile(__FILE__);

if (
	$_SERVER["REQUEST_METHOD"] == "POST"
	&& isset($_REQUEST["ajax"])
	&& $_REQUEST["ajax"]=="y"
	&& isset($_REQUEST["clearcache"])
	&& $_REQUEST["clearcache"] == "Y"
)
{
	require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_js.php");

	if(!check_bitrix_sessid() || !$isAdmin)
	{
		?>
		<script>
			window.location = '/bitrix/admin/cache.php?lang=<?= LANGUAGE_ID?>&tabControl_active_tab=fedit2';
		</script>
		<?php
		require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_admin_js.php");
	}

	$obCacheCleaner = null;
	$filesEngine = (Cache::getCacheEngineType() == "cacheenginefiles");

	$rootDir = $_SERVER["DOCUMENT_ROOT"];
	if ($cachetype !== "html" && $filesEngine)
	{
		$config = Configuration::getValue('cache');
		if (!empty($config['root_directory']))
		{
			$rootDir = $config['root_directory'];
		}
	}

	$curentTime = time();
	$endTime = $curentTime + 5;

	if ($cachetype == "landing" && Loader::includeModule("landing"))
	{
		Block::clearRepositoryCache();
		CAdminMessage::ShowMessage(array(
			"MESSAGE" => GetMessage("main_cache_finished"),
			"HTML" => true,
			"TYPE" => "OK",
		));
		?>
		<script>
			CloseWaitWindow();
			EndClearCache();
		</script>
		<?php
		require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_admin_js.php");
	}
	elseif ($cachetype === "html" || $filesEngine)
	{
		if (!empty($_POST["path"]) && is_string($_POST["path"]))
		{
			$path = $_POST["path"];
		}
		else
		{
			$path = "";
			$session["CACHE_STAT"] = [];
		}

		$obCacheCleaner = new CFileCacheCleaner($cachetype, $rootDir);

		if (!$obCacheCleaner->InitPath($path))
		{
			ShowError(GetMessage("main_cache_wrong_cache_path"));
			?>
			<script>
				CloseWaitWindow();
			</script>
			<?php
			require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_admin_js.php");
		}
	}

	$session = Application::getInstance()->getSession();

	if ($cachetype === "html")
	{
		$obCacheCleaner->Start();
		$space_freed = 0;
		while ($file = $obCacheCleaner->GetNextFile())
		{
			if (
				is_string($file)
				&& !preg_match("/(\\.enabled|\\.size|.config\\.php)\$/", $file)
			)
			{
				$file_size = filesize($file);

				$session["CACHE_STAT"]["scanned"] = ($session["CACHE_STAT"]["scanned"] ?? 0) + 1;
				$session["CACHE_STAT"]["space_total"] = ($session["CACHE_STAT"]["space_total"] ?? 0) + $file_size;

				if (@unlink($file))
				{
					$session["CACHE_STAT"]["deleted"] = ($session["CACHE_STAT"]["deleted"] ?? 0) + 1;
					$session["CACHE_STAT"]["space_freed"] = ($session["CACHE_STAT"]["space_freed"] ?? 0) + $file_size;
					$space_freed += $file_size;
				}
				else
				{
					$session["CACHE_STAT"]["errors"] = ($session["CACHE_STAT"]["errors"] ?? 0) + 1;
				}

				if (time() >= $endTime)
				{
					break;
				}
			}
		}
		Helper::updateCacheFileSize(-$space_freed);
	}
	elseif ($filesEngine)
	{
		$bDoNotCheckExpiredDate = (
			$cachetype === "all"
			|| $cachetype === "menu"
			|| $cachetype === "managed"
		);
		$obCacheCleaner->Start();
		while ($file = $obCacheCleaner->GetNextFile())
		{
			if (is_string($file))
			{
				$date_expire = $obCacheCleaner->GetFileExpiration($file);
				if ($date_expire)
				{
					$file_size = filesize($file);

					$session["CACHE_STAT"]["scanned"] = ($session["CACHE_STAT"]["scanned"] ?? 0) + 1;
					$session["CACHE_STAT"]["space_total"] = ($session["CACHE_STAT"]["space_total"] ?? 0) + $file_size;

					if ($bDoNotCheckExpiredDate || ($date_expire < $curentTime))
					{
						if (@unlink($file))
						{
							$session["CACHE_STAT"]["deleted"] = ($session["CACHE_STAT"]["deleted"] ?? 0) + 1;
							$session["CACHE_STAT"]["space_freed"] = ($session["CACHE_STAT"]["space_freed"] ?? 0) + $file_size;
						}
						else
						{
							$session["CACHE_STAT"]["errors"] = ($session["CACHE_STAT"]["errors"] ?? 0) + 1;
						}
					}
				}

				if (time() >= $endTime)
				{
					break;
				}
			}
		}
	}
	else
	{
		$file = false;
		$session["CACHE_STAT"] = array();
	}

	if (is_string($file))
	{
		$currentFile = mb_substr($file, mb_strlen($rootDir));
		$currentPath = $currentFile;
		CFileTree::ExtractFileFromPath($currentPath);
		CAdminMessage::ShowMessage(array(
			"MESSAGE" => GetMessage("main_cache_in_progress"),
			"DETAILS" => GetMessage("main_cache_files_scanned_count", array("#value#" => "<b>".intval($session["CACHE_STAT"]["scanned"])."</b>"))."<br>"
				.GetMessage("main_cache_files_scanned_size", array("#value#" => "<b>".CFile::FormatSize($session["CACHE_STAT"]["space_total"])."</b>"))."<br>"
				.GetMessage("main_cache_files_deleted_count", array("#value#" => "<b>".intval($session["CACHE_STAT"]["deleted"])."</b>"))."<br>"
				.GetMessage("main_cache_files_deleted_size", array("#value#" => "<b>".CFile::FormatSize($session["CACHE_STAT"]["space_freed"])."</b>"))."<br>"
				.GetMessage("main_cache_files_delete_errors", array("#value#" => "<b>".intval($session["CACHE_STAT"]["errors"])."</b>"))."<br>"
				.GetMessage("main_cache_files_last_path", array("#value#" => "<b>".htmlspecialcharsbx($currentPath)."</b>"))."<br>"
			,
			"HTML"=>true,
			"TYPE"=>"OK",
		));
		?>
		<script>
			CloseWaitWindow();
			DoNext(<?= Json::encode($currentFile) ?>);
		</script>
		<?php
	}
	else
	{
		if ($cachetype == "menu")
		{
			$CACHE_MANAGER->CleanDir("menu");
			CBitrixComponent::clearComponentCache("bitrix:menu");
		}
		elseif ($cachetype == "managed")
		{
			$CACHE_MANAGER->CleanAll();
			$stackCacheManager->CleanAll();
		}
		elseif ($cachetype == "html")
		{
			$page = Page::getInstance();
			$page->deleteAll();
		}
		elseif ($cachetype == "all")
		{
			$taggedCache = Application::getInstance()->getTaggedCache();
			$taggedCache->deleteAllTags();

			BXClearCache(true);

			$CACHE_MANAGER->CleanAll();
			$stackCacheManager->CleanAll();

			$page = Page::getInstance();
			$page->deleteAll();
		}

		if ($session["CACHE_STAT"])
		{
			CAdminMessage::ShowMessage(array(
				"MESSAGE"=>GetMessage("main_cache_finished"),
				"DETAILS"=> ""
					.GetMessage("main_cache_files_scanned_count", array("#value#" => "<b>".intval($session["CACHE_STAT"]["scanned"] ?? 0)."</b>"))."<br>"
					.GetMessage("main_cache_files_scanned_size", array("#value#" => "<b>".CFile::FormatSize($session["CACHE_STAT"]["space_total"] ?? 0)."</b>"))."<br>"
					.GetMessage("main_cache_files_deleted_count", array("#value#" => "<b>".intval($session["CACHE_STAT"]["deleted"] ?? 0)."</b>"))."<br>"
					.GetMessage("main_cache_files_deleted_size", array("#value#" => "<b>".CFile::FormatSize($session["CACHE_STAT"]["space_freed"] ?? 0)."</b>"))."<br>"
					.GetMessage("main_cache_files_delete_errors", array("#value#" => "<b>".intval($session["CACHE_STAT"]["errors"] ?? 0)."</b>"))."<br>"
				,
				"HTML"=>true,
				"TYPE"=>"OK",
			));
			$session["CACHE_STAT"] = [];
		}
		else
		{
			CAdminMessage::ShowMessage(array(
				"MESSAGE"=>GetMessage("main_cache_finished"),
				"HTML"=>true,
				"TYPE"=>"OK",
			));
		}
		?>
		<script>
			CloseWaitWindow();
			EndClearCache();
		</script>
		<?php
	}

	require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_admin_js.php");
}
else
{

if(!$USER->CanDoOperation('cache_control') && !$USER->CanDoOperation('view_other_settings'))
{
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
}

$errorMessage = "";
$okMessage = "";

$cache_on = $_REQUEST['cache_on'] ?? null;
if ($_SERVER['REQUEST_METHOD'] == "POST" && ($cache_on=="Y" || $cache_on=="N") && check_bitrix_sessid() && $isAdmin)
{
	if(COption::GetOptionString("main", "component_cache_on", "Y")=="Y")
	{
		if ($cache_on=="N")
		{
			COption::SetOptionString("main", "component_cache_on", "N");
			$okMessage .= GetMessage("MAIN_OPTION_CACHE_SUCCESS").". ";
		}
	}
	else
	{
		if ($cache_on=="Y")
		{
			COption::SetOptionString("main", "component_cache_on", "Y");
			$okMessage .= GetMessage("MAIN_OPTION_CACHE_SUCCESS").". ";
		}
	}
}

$managed_cache_on = $_REQUEST['managed_cache_on'] ?? null;
if($_SERVER['REQUEST_METHOD'] == "POST" && ($managed_cache_on=="Y" || $managed_cache_on=="N") && check_bitrix_sessid() && $isAdmin)
{
	COption::SetOptionString("main", "component_managed_cache_on", $managed_cache_on);
	if($managed_cache_on == "N")
	{
		$taggedCache = Application::getInstance()->getTaggedCache();
		$taggedCache->clearByTag(true);
	}
	LocalRedirect($APPLICATION->GetCurPage()."?lang=".LANGUAGE_ID."&tabControl_active_tab=fedit4&res=managed_saved");
}
if (isset($_REQUEST["res"]) && $_REQUEST["res"] == "managed_saved")
{
	$okMessage .= GetMessage("main_cache_managed_saved");
}

$APPLICATION->SetTitle(GetMessage("MCACHE_TITLE"));
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
?>

<?php
if($errorMessage <> '')
	CAdminMessage::ShowMessage(Array("DETAILS"=>$errorMessage, "TYPE"=>"ERROR", "MESSAGE"=>GetMessage("SAE_ERROR"), "HTML"=>true));
if($okMessage <> '')
	CAdminMessage::ShowNote($okMessage);
?>

<script>
var stop;
var last_path;
var cache_types_cnt = 0;

function StartClearCache()
{
	stop=false;
	document.getElementById('clear_result_div').innerHTML='';
	document.getElementById('stop_button').disabled=false;
	document.getElementById('start_button').disabled=true;
	document.getElementById('continue_button').disabled=true;
	for(var i=1;i<=cache_types_cnt;i++)
		document.getElementById('cachetype'+i).disabled=true;

	DoNext('');
}
function DoNext(path)
{
	var queryString = 'ajax=y'
		+ '&clearcache=Y'
		+ '&lang=<?= htmlspecialcharsbx(LANGUAGE_ID)?>'
		+ '&<?= bitrix_sessid_get()?>'
	;

	var cachetype = '';
	for(var i=1;i<=cache_types_cnt;i++)
	{
		var radio = document.getElementById('cachetype'+i);
		if(radio.checked)
			cachetype = radio.value;
	}

	last_path = path;

	if(!stop)
	{
		ShowWaitWindow();
		BX.ajax.post(
			'cache.php?'+queryString,
			{'path': path, 'cachetype': cachetype},
			function(result){
				document.getElementById('clear_result_div').innerHTML = result;
				CloseWaitWindow();
			}
		);
	}

	return false;
}
function StopClearCache()
{
	stop=true;
	document.getElementById('stop_button').disabled=true;
	document.getElementById('start_button').disabled=false;
	document.getElementById('continue_button').disabled=false;
	for(var i=1;i<=cache_types_cnt;i++)
		document.getElementById('cachetype'+i).disabled=false;
}
function ContinueClearCache()
{
	stop=false;
	document.getElementById('stop_button').disabled=false;
	document.getElementById('start_button').disabled=true;
	document.getElementById('continue_button').disabled=true;
	for(var i=1;i<=cache_types_cnt;i++)
		document.getElementById('cachetype'+i).disabled=true;
	DoNext(last_path);
}
function EndClearCache()
{
	stop=true;
	document.getElementById('stop_button').disabled=true;
	document.getElementById('start_button').disabled=false;
	document.getElementById('continue_button').disabled=true;
	for(var i=1;i<=cache_types_cnt;i++)
		document.getElementById('cachetype'+i).disabled=false;
}
</script>

<div id="clear_result_div" style="margin:0">
</div>

<?php
$aTabs = array(
	array(
		"DIV" => "fedit1",
		"TAB" => GetMessage("MAIN_TAB_4"),
		"ICON" => "main_settings",
		"TITLE" => GetMessage("MAIN_OPTION_PUBL"),
	),
	array(
		"DIV" => "fedit4",
		"TAB" => GetMessage("main_cache_managed"),
		"ICON" => "main_settings",
		"TITLE" => GetMessage("main_cache_managed_sett"),
	),
);

$aTabs[] = array(
	"DIV" => "fedit2",
	"TAB" => GetMessage("MAIN_TAB_3"),
	"ICON" => "main_settings",
	"TITLE" => GetMessage("MAIN_OPTION_CLEAR_CACHE"),
);

$tabControl = new CAdminTabControl("tabControl", $aTabs, true, true);

$tabControl->Begin();
?>
<form method="POST" action="<?= $APPLICATION->GetCurPage()?>?lang=<?= LANGUAGE_ID?>">
<?=bitrix_sessid_post()?>
<?php $tabControl->BeginNextTab();?>
<tr>
	<td valign="top" colspan="2" align="left">
		<?php if(COption::GetOptionString("main", "component_cache_on", "Y")=="Y"):?>
			<span style="color:green;"><b><?= GetMessage("MAIN_OPTION_CACHE_ON")?>.</b></span>
		<?php else:?>
			<span style="color:red;"><b><?= GetMessage("MAIN_OPTION_CACHE_OFF")?>.</b></span>
		<?php endif?>
		<br><br>
	</td>
</tr>
<tr>
	<td valign="top" colspan="2" align="left">
		<?php if(COption::GetOptionString("main", "component_cache_on", "Y")=="Y"):?>
			<input type="hidden" name="cache_on" value="N">
			<input type="submit" name="cache_siteb" value="<?= GetMessage("MAIN_OPTION_CACHE_BUTTON_OFF")?>"<?php if(!$isAdmin) echo " disabled"?>>
		<?php else:?>
			<input type="hidden" name="cache_on" value="Y">
			<input type="submit" name="cache_siteb" value="<?= GetMessage("MAIN_OPTION_CACHE_BUTTON_ON")?>"<?php if(!$isAdmin) echo " disabled"?> class="adm-btn-save">
		<?php endif?>
	</td>
</tr>
<tr>
	<td colspan="2">
		<?= BeginNote();?><?= GetMessage("cache_admin_note1")?>
		<?= EndNote(); ?>
	</td>
</tr>
</form>

<?php $tabControl->EndTab()?>
<?php $tabControl->BeginNextTab()?>

<form method="POST" action="<?= $APPLICATION->GetCurPage()?>?lang=<?= LANGUAGE_ID?>&amp;tabControl_active_tab=fedit4">
<?=bitrix_sessid_post()?>

<?php
	$component_managed_cache = COption::GetOptionString("main", "component_managed_cache_on", "Y");
?>
<tr>
	<td valign="top" colspan="2" align="left">
		<?php if($component_managed_cache <> "N" || defined("BX_COMP_MANAGED_CACHE")):?>
			<span style="color:green;"><b><?= GetMessage("main_cache_managed_on")?></b></span>
		<?php else:?>
			<span style="color:red;"><b><?= GetMessage("main_cache_managed_off")?></b></span>
		<?php endif?>
		<br><br>
	</td>
</tr>
<tr>
	<td valign="top" colspan="2" align="left">
		<?php if($component_managed_cache <> "N" || defined("BX_COMP_MANAGED_CACHE")):?>
			<input type="hidden" name="managed_cache_on" value="N">
			<input type="submit" name="" value="<?= GetMessage("main_cache_managed_turn_off")?>"<?php if(!$isAdmin || $component_managed_cache == "N") echo " disabled"?>>
			<?php if($component_managed_cache == "N"):?><br><br><?= GetMessage("main_cache_managed_const")?><?php endif?>
		<?php else:?>
			<input type="hidden" name="managed_cache_on" value="Y">
			<input type="submit" name="" value="<?= GetMessage("main_cache_managed_turn_on")?>"<?php if(!$isAdmin) echo " disabled"?> class="adm-btn-save">
		<?php endif?>
	</td>
</tr>
<tr>
	<td colspan="2">
		<?= BeginNote();?>
		<?= GetMessage("main_cache_managed_note")?>
		<?= EndNote(); ?>
	</td>
</tr>
</form>
<?php $tabControl->EndTab()?>
<?php $tabControl->BeginNextTab(); ?>
<form method="POST" action="<?= $APPLICATION->GetCurPage()?>?lang=<?= LANGUAGE_ID?>">
<?=bitrix_sessid_post()?>
<tr>
	<td colspan="2" valign="top" align="left">
		<input type="hidden" name="clearcache" value="Y">
		<input type="radio" class="cache-types" name="cachetype" id="cachetype1" value="expired"<?php if($cachetype!="all" && $cachetype!="menu" && $cachetype!="managed")echo " checked"?>> <label for="cachetype1"><?= GetMessage("MAIN_OPTION_CLEAR_CACHE_OLD")?></label><br>
		<input type="radio" class="cache-types" name="cachetype" id="cachetype2" value="all"<?php if($cachetype=="all")echo " checked"?>> <label for="cachetype2"><?= GetMessage("MAIN_OPTION_CLEAR_CACHE_ALL")?></label><br>
		<input type="radio" class="cache-types" name="cachetype" id="cachetype3" value="menu"<?php if($cachetype=="menu")echo " checked"?>> <label for="cachetype3"><?= GetMessage("MAIN_OPTION_CLEAR_CACHE_MENU")?></label><br>
		<input type="radio" class="cache-types" name="cachetype" id="cachetype4" value="managed"<?php if($cachetype=="managed")echo " checked"?>> <label for="cachetype4"><?= GetMessage("MAIN_OPTION_CLEAR_CACHE_MANAGED")?></label><br>
		<input type="radio" class="cache-types" name="cachetype" id="cachetype5" value="html"<?php if($cachetype=="html")echo " checked"?>> <label for="cachetype5"><?= GetMessage("MAIN_OPTION_CLEAR_CACHE_STATIC")?></label><br>
		<?php if (ModuleManager::isModuleInstalled("landing")):?>
		<input type="radio" class="cache-types" name="cachetype" id="cachetype6" value="landing"<?php if($cachetype=="landing")echo " checked"?>> <label for="cachetype6"><?= GetMessage("MAIN_OPTION_CLEAR_CACHE_LANDING")?></label><br>
		<?php endif;?>
		<br>
		<script>
			cache_types_cnt = document.getElementsByClassName('cache-types').length;
		</script>
	</td>
</tr>
<tr>
	<td valign="top" colspan="2" align="left">
		<input type="button" id="start_button" value="<?= GetMessage("main_cache_files_start")?>" OnClick="StartClearCache();"<?php if(!$isAdmin) echo " disabled"?> class="adm-btn-save">
		<input type="button" id="stop_button" value="<?= GetMessage("main_cache_files_stop")?>" OnClick="StopClearCache();" disabled>
		<input type="button" id="continue_button" value="<?= GetMessage("main_cache_files_continue")?>" OnClick="ContinueClearCache();" disabled>
	</td>
</tr>
<tr>
	<td colspan="2">
		<?= BeginNote();?>
		<?= GetMessage("cache_admin_note2")?>
		<?= EndNote(); ?>
	</td>
</tr>
</form>
<?php $tabControl->End();?>
<?php
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
}
