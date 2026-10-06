<?php

use Bitrix\Main\Localization\Loc;
Loc::loadMessages(__FILE__);

if (class_exists('bizprocdesigner'))
{
	return;
}

Class bizprocdesigner extends CModule
{
	var $MODULE_ID = "bizprocdesigner";
	var $MODULE_VERSION;
	var $MODULE_VERSION_DATE;
	var $MODULE_NAME;
	var $MODULE_DESCRIPTION;
	var $MODULE_CSS;
	var $MODULE_GROUP_RIGHTS = "Y";

	function __construct()
	{
		$arModuleVersion = array();

		include(__DIR__.'/version.php');

		$this->MODULE_VERSION = $arModuleVersion["VERSION"];
		$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];

		$this->MODULE_NAME = Loc::getMessage("BIZPROCDESIGNER_INSTALL_NAME");
		$this->MODULE_DESCRIPTION = Loc::getMessage("BIZPROCDESIGNER_INSTALL_DESCRIPTION");
	}


	function InstallDB($install_wizard = true)
	{
		global $APPLICATION;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode('', $migrationResult->getErrorMessages()));

			return false;
		}

		RegisterModule("bizprocdesigner");

		return true;
	}

	function UnInstallDB($arParams = Array())
	{
		global $APPLICATION;

		$dropTables = !(isset($arParams['savedata']) && $arParams['savedata'] === 'Y');

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode('', $migrationResult->getErrorMessages()));

			return false;
		}

		UnRegisterModule("bizprocdesigner");

		return true;
	}

	function InstallFiles()
	{
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/bizprocdesigner/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/bizprocdesigner/install/tools", $_SERVER["DOCUMENT_ROOT"]."/bitrix/tools", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/bizprocdesigner/install/components", $_SERVER["DOCUMENT_ROOT"]."/bitrix/components", true, true);
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/bizprocdesigner/install/js',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/js',
			true,
			true,
		);

		return true;
	}

	function InstallPublic()
	{
	}

	function UnInstallFiles()
	{
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/bizprocdesigner/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin");
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/bizprocdesigner/install/tools", $_SERVER["DOCUMENT_ROOT"]."/bitrix/tools");
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/bizprocdesigner/install/components/bitrix", $_SERVER["DOCUMENT_ROOT"]."/bitrix/components/bitrix");
		DeleteDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/bizprocdesigner/install/js',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/js',
		);

		return true;
	}

	function DoInstall()
	{
		global $APPLICATION, $step;

		if (!IsModuleInstalled("bizproc"))
		{
			$this->errors = array(Loc::getMessage("BIZPROC_ERROR_BPM"));
		}
		elseif (!CBXFeatures::IsFeatureEditable("BizProc"))
		{
			$this->errors = array(Loc::getMessage("BIZPROC_ERROR_EDITABLE"));
		}
		else
		{
			$this->InstallDB(false);
			$this->InstallFiles();
			$this->InstallEvents();
			CBXFeatures::SetFeatureEnabled("BizProc", true);
		}

		$GLOBALS["errors"] = $this->errors ?? null;
		$APPLICATION->IncludeAdminFile(Loc::getMessage("BIZPROC_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/bizprocdesigner/install/step2.php");
	}

	function DoUninstall()
	{
		global $APPLICATION, $step;
		$step = intval($step);
		if($step<2)
		{
			$APPLICATION->IncludeAdminFile(Loc::getMessage("BIZPROC_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/bizprocdesigner/install/unstep1.php");
		}
		elseif($step==2)
		{
			$this->UnInstallFiles();
			$this->UnInstallEvents();
			$this->UnInstallDB(false);
			CBXFeatures::SetFeatureEnabled("BizProc", false);
			$GLOBALS["errors"] = $this->errors ?? null;

			$APPLICATION->IncludeAdminFile(Loc::getMessage("BIZPROC_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/bizprocdesigner/install/unstep2.php");
		}
	}

}
?>