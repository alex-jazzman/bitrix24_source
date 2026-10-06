<?php

if(class_exists("documentgenerator"))
{
	return;
}

IncludeModuleLangFile(__FILE__);

class documentgenerator extends CModule
{
	public $MODULE_ID = "documentgenerator";
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;
	public $MODULE_GROUP_RIGHTS = "Y";

	public function __construct()
	{
		$arModuleVersion = [];

		include(__DIR__.'/version.php');

		if (is_array($arModuleVersion) && array_key_exists("VERSION", $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion["VERSION"];
			$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];
		}

		$this->MODULE_NAME = GetMessage("DOCUMENTGENERATOR_MODULE_NAME");
		$this->MODULE_DESCRIPTION = GetMessage("DOCUMENTGENERATOR_MODULE_DESCRIPTION");
	}

	function DoInstall()
	{
		global $APPLICATION, $step;
		$step = intval($step);
		if($step < 2)
		{
			if(!class_exists('\DOMDocument') || !class_exists('\ZipArchive'))
			{
				$APPLICATION->ThrowException(GetMessage('DOCUMENTGENERATOR_INSTALL_DEPENDENCIES_ERROR'));
			}

			if (!IsModuleInstalled('humanresources'))
			{
				$APPLICATION->ThrowException(GetMessage('DOCUMENTGENERATOR_INSTALL_HUMANRESOURCES_NOT_INSTALLED_ERROR'));
			}

			$APPLICATION->IncludeAdminFile(GetMessage("DOCUMENTGENERATOR_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/step1.php");
		}
		elseif($step == 2)
		{
			$this->InstallDB();
			$this->InstallFiles();

			$APPLICATION->IncludeAdminFile(GetMessage("DOCUMENTGENERATOR_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/step2.php");
		}
		return true;
	}

	function InstallDB($params = [])
	{
		global $APPLICATION;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode("", $migrationResult->getErrorMessages()));
			return false;
		}

		RegisterModule($this->MODULE_ID);

		return true;
	}

	function InstallFiles()
	{
		CopyDirFiles(
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/components",
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/components",
			true, true
		);

		CopyDirFiles(
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/js",
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/js",
			true, true
		);

		CopyDirFiles(
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/admin",
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/admin",
			true, true
		);

		return true;
	}

	function DoUninstall()
	{
		global $APPLICATION, $step;
		$step = intval($step);
		if($step<2)
		{
			$APPLICATION->IncludeAdminFile(GetMessage("DOCUMENTGENERATOR_UNINSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/unstep1.php");
		}
		elseif($step==2)
		{
			$this->UnInstallDB(["savedata" => $_REQUEST["savedata"]]);

			$APPLICATION->IncludeAdminFile(GetMessage("DOCUMENTGENERATOR_UNINSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/unstep2.php");
		}

		return true;
	}

	function UnInstallDB($params = [])
	{
		global $APPLICATION;

		$dropTables = !isset($params['savedata']) || $params['savedata'] !== "Y";

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode("", $migrationResult->getErrorMessages()));
			return false;
		}

		UnRegisterModule($this->MODULE_ID);
		return true;
	}
}
