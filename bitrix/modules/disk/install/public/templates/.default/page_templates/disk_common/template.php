<?
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
	die();

CPageTemplate::IncludeLangFile(__FILE__);

class CDiskCommonStoragePageTemplate
{
	public static function getDescription()
	{
		return array(
			"name"=>GetMessage("disk_common_wizard_name"),
			"description"=>GetMessage("disk_common_wizard_title"),
			"icon"=>"/bitrix/templates/.default/page_templates/disk_common/images/icon_webdav.gif",
			"modules"=>array("disk",),
			"type"=>"section",
		);
	}
	
	public static function getFormHtml()
	{
		if(!CModule::IncludeModule('disk'))
		{
			return false;
		}

		//name

		$libNameTpl = GetMessage("disk_common_wizard_lib_name_val");
		$libSearchVal = -1;
		do {
			$libSearchVal++;
			$libName = $libNameTpl;
			if ($libSearchVal > 0) 
				$libName .= " (" . $libSearchVal . ")";
			$dbRes = Bitrix\Disk\Storage::getList(array("filter"=>array("NAME" => $libName, "=ENTITY_TYPE" => Bitrix\Disk\ProxyType\Common::className())));
		} while (($dbRes && $arResLibName = $dbRes->Fetch()));

		$s = '
<tr class="section">
	<td colspan="2">'.GetMessage("disk_common_wizard_settings").'</td>
</tr>
<tr>
	<td class="bx-popup-label bx-width30">'.GetMessage("disk_common_wizard_lib_name").'</td>
	<td>
		<input type="text" maxlength="100" name="library_TITLE" value="'.$libName.'" '.( 'onkeyup="library_CheckIBlockName(this)"' ).' style="width:90%"><div class="errortext"></div>
	</td>
	<script>
	window.library_CheckIBlockName = function(el)
	{
		var excludeChars = new RegExp("[\\\\\\\\{}/:\\*\\?|%&~]");
		var res = ""; 
		if (el.value)
		{
			if (el.value.search(excludeChars) != -1)
			{
				res = "'.CUtil::JSEscape(GetMessage("disk_common_wizard_name_error1")).'";
			}
		}
		el.nextSibling.innerHTML = res;

		BX("btn_popup_next").disabled = (res.length > 0);
		BX("btn_popup_finish").disabled = (res.length > 0);
	}
	</script>
</tr>
';
		return $s;
	}

	public static function getContent($arParams)
	{
		if(!CModule::IncludeModule('disk'))
		{
			return false;
		}
		$driver = \Bitrix\Disk\Driver::getInstance();
		$title = $_POST['library_TITLE'];
		$mountPoint = \Bitrix\Disk\Integration\Fileman\CommonStoragePathNormalizer::normalizeCommonStorageMountPoint(
			(string)$arParams['path'],
			(string)($arParams['siteDir'] ?? '/'),
			(bool)($arParams['allowLegacyDuplicateCollapse'] ?? false),
		);
		$pieces = explode('/', trim($mountPoint, '/'));
		$entityId = array_pop($pieces);
		$storageEntityId = mb_substr($entityId.'_'.$arParams['site'], 0, 32);
		$commonStorageCreation = $driver->addCommonStorageWithCreationStatus(array(
			'NAME' => $title,
			'ENTITY_ID' => $storageEntityId,
			'SITE_ID' => $arParams['site'],
		), array());
		if(!$commonStorageCreation || !$commonStorageCreation['storage'])
		{
			return false;
		}
		$commonStorage = $commonStorageCreation['storage'];
		if(!$commonStorage->changeBaseUrl($mountPoint))
		{
			if($commonStorageCreation['created'])
			{
				$commonStorage->delete(\Bitrix\Disk\SystemUser::SYSTEM_USER_ID);
			}

			return false;
		}
		if($commonStorageCreation['created'])
		{
			\Bitrix\Disk\Integration\Fileman\CommonStorageCreationContext::remember(
				(int)$commonStorage->getId(),
				$commonStorage->getProxyType()->getStorageBaseUrl(),
			);
		}

		return '<?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");
IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/intranet/public/docs/shared/index.php");
$APPLICATION->SetTitle("'.EscapePHPString($title).'");
$APPLICATION->AddChainItem($APPLICATION->GetTitle(), "'.EscapePHPString($mountPoint).'");
?>
<?$APPLICATION->IncludeComponent("bitrix:disk.common", ".default", Array(
		"SEF_MODE" => "Y",
		"SEF_FOLDER" => "'.EscapePHPString($mountPoint).'",
		"STORAGE_ID" => "'.$commonStorage->getId().'",
	)
);?>
<?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php");?>
		';
	}
}

$pageTemplate = new CDiskCommonStoragePageTemplate;
?>
