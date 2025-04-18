<?
define('NO_KEEP_STATISTIC', 'Y');
define('NO_AGENT_STATISTIC', 'Y');
require($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_before.php');

if (!CModule::IncludeModule('crm'))
	die();

if (
	!\Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->isCrmAdmin()
	&& !\Bitrix\Crm\Service\Container::getInstance()->getUserPermissions()->entityType()->canReadItemsInCategory(CCrmOwnerType::Deal, 0)
)
{
	die("Permission denied");
}

if (\Bitrix\Crm\Restriction\RestrictionManager::getIntegrationShopRestriction()->isExceeded())
{
	echo '<script>'.\Bitrix\Crm\Restriction\RestrictionManager::getIntegrationShopRestriction()->prepareInfoHelperScript().'</script>';
}
else
{
	$i = new CCrmExternalSaleImport($_REQUEST["id"]);
	if(!$i->IsInitialized())
	{
		$str = '';
		foreach ($i->GetErrors() as $arError)
			$str .= sprintf("[%s] %s", $arError[0], htmlspecialcharsbx($arError[1]))."<br>";
		echo CUtil::PhpToJSObject(array("result" => CCrmExternalSaleImport::SyncStatusError, "errors" => $str));
	}
	else
	{
		$r = $i->SyncOrderData($_REQUEST["skip_bp"] == "Y", $_REQUEST["skip_notify"] == "Y");
		if ($r != CCrmExternalSaleImport::SyncStatusError)
		{
			echo CUtil::PhpToJSObject(array("result" => $r, "details" => $i->GetImportResult()->ToArray()));
		}
		else
		{
			$str = '';
			foreach ($i->GetErrors() as $arError)
				$str .= sprintf("[%s] %s", $arError[0], htmlspecialcharsbx($arError[1]))."<br>";
			echo CUtil::PhpToJSObject(array("result" => CCrmExternalSaleImport::SyncStatusError, "errors" => $str));
		}
	}
}


require($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/epilog_after.php');
?>