<?php

if(class_exists("salescenter"))
{
	return;
}

IncludeModuleLangFile(__FILE__);

class salescenter extends CModule
{
	public $MODULE_ID = "salescenter";
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;
	public $MODULE_GROUP_RIGHTS = "Y";

	protected $requiredModules = ['crm', 'sale', 'im', 'imopenlines', 'landing'];

	public function __construct()
	{
		$arModuleVersion = [];

		include(__DIR__.'/version.php');

		if (is_array($arModuleVersion) && array_key_exists("VERSION", $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion["VERSION"];
			$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];
		}

		$this->MODULE_NAME = GetMessage("SALESCENTER_MODULE_NAME_MSGVER_1");
		$this->MODULE_DESCRIPTION = GetMessage("SALESCENTER_MODULE_DESCRIPTION");
	}

	function DoInstall()
	{
		global $APPLICATION, $step;

		$step = intval($step);
		if($step < 2)
		{
			$notInstalledRequiredModules = [];
			foreach($this->requiredModules as $moduleId)
			{
				if(!\Bitrix\Main\ModuleManager::isModuleInstalled($moduleId))
				{
					$notInstalledRequiredModules[] = $moduleId;
				}
			}
			if(!empty($notInstalledRequiredModules))
			{
				$APPLICATION->ThrowException(GetMessage('SALESCENTER_INSTALL_DEPENDENCIES_ERROR', ['#MODULES#' => implode(', ', $notInstalledRequiredModules)]));
			}
			$APPLICATION->IncludeAdminFile(GetMessage("SALESCENTER_INSTALL_TITLE_MSGVER_1"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/step1.php");
		}
		elseif($step == 2)
		{
			$this->InstallDB();
			$this->InstallFiles();

			$APPLICATION->IncludeAdminFile(GetMessage("SALESCENTER_INSTALL_TITLE_MSGVER_1"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/step2.php");
		}
		return true;
	}

	function InstallDB($params = [])
	{
		global $APPLICATION;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode('', $migrationResult->getErrorMessages()));
			return false;
		}

		RegisterModule($this->MODULE_ID);

		$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();
		$shouldInstallApp = $request->get('install_app') === 'Y';
		if ($shouldInstallApp && \Bitrix\Main\Loader::includeModule($this->MODULE_ID))
		{
			\Bitrix\SalesCenter\Integration\ImManager::installApplication();
		}

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

		return true;
	}

	function DoUninstall()
	{
		global $APPLICATION, $step;

		$step = (int)$step;
		if ($step < 2)
		{
			$APPLICATION->IncludeAdminFile(GetMessage("SALESCENTER_UNINSTALL_TITLE_MSGVER_1"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/unstep1.php");
		}
		elseif ($step === 2)
		{
			$this->UnInstallDB(["savedata" => $_REQUEST["savedata"]]);

			UnRegisterModule($this->MODULE_ID);

			$APPLICATION->IncludeAdminFile(GetMessage("SALESCENTER_UNINSTALL_TITLE_MSGVER_1"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/unstep2.php");
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
			$APPLICATION->ThrowException(implode('', $migrationResult->getErrorMessages()));
			return false;
		}

		if (\Bitrix\Main\Loader::includeModule($this->MODULE_ID))
		{
			\Bitrix\SalesCenter\Integration\ImManager::unInstallApplication();
		}

		return true;
	}
}
