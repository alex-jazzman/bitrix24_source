<?php

use Bitrix\Main\Localization\Loc;

class messageservice extends \CModule
{
	public $MODULE_ID = "messageservice";
	public $MODULE_GROUP_RIGHTS = "Y";

	private $errors = [];

	public function __construct()
	{
		$arModuleVersion = [];

		include(__DIR__.'/version.php');

		$this->MODULE_VERSION = $arModuleVersion["VERSION"];
		$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];

		$this->MODULE_NAME = Loc::getMessage("MESSAGESERVICE_INSTALL_NAME");
		$this->MODULE_DESCRIPTION = Loc::getMessage("MESSAGESERVICE_INSTALL_DESCRIPTION");
	}


	public function InstallDB($install_wizard = true)
	{
		global $APPLICATION;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode("", $migrationResult->getErrorMessages()));
			return false;
		}

		\Bitrix\Main\ModuleManager::registerModule('messageservice');

		\Bitrix\Main\Config\Option::set('messageservice', 'clean_up_period', '14');

		/** @see \Bitrix\MessageService\Providers\Edna\RegionHelper::REGION_RU */
		$region = \Bitrix\Main\Application::getInstance()->getLicense()->getRegion();
		if (!in_array($region, ['ru', 'by'], true))
		{
			\Bitrix\Main\Config\Option::set('messageservice', 'disable_international', 'Y');
		}

		if (\Bitrix\Main\Loader::includeModule('messageservice'))
		{
			\Bitrix\MessageService\Converter::onInstallModule();
		}

		return true;
	}

	function UnInstallDB($arParams = Array())
	{
		global $APPLICATION;

		$dropTables = array_key_exists("savedata", $arParams) && $arParams["savedata"] != "Y";

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode("", $migrationResult->getErrorMessages()));
			return false;
		}

		if ($dropTables)
		{
			\Bitrix\Main\Config\Option::delete($this->MODULE_ID);
		}

		\Bitrix\Main\ModuleManager::unRegisterModule('messageservice');

		return true;
	}

	public function InstallFiles()
	{
		\CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/messageservice/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin", true);
		\CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/messageservice/install/components", $_SERVER["DOCUMENT_ROOT"]."/bitrix/components", true, true);
		\CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/messageservice/install/tools", $_SERVER["DOCUMENT_ROOT"]."/bitrix/tools", true, true);
		\CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/messageservice/install/js', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/js', true, true);

		return true;
	}

	public function UnInstallFiles()
	{
		\DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/messageservice/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin");
		\DeleteDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/messageservice/install/js', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/js');

		if (is_dir($p = $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/messageservice/install/components/bitrix"))
		{
			foreach (scandir($p) as $item)
			{
				if ($item == '..' || $item == '.')
				{
					continue;
				}

				\DeleteDirFilesEx('/bitrix/components/bitrix/'.$item);
			}
		}
		\DeleteDirFilesEx("/bitrix/tools/messageservice");

		return true;
	}

	public function DoInstall()
	{
		global $APPLICATION;

		$this->errors = [];

		$this->InstallFiles();
		$this->InstallDB(false);

		$GLOBALS["errors"] = $this->errors;
		$APPLICATION->IncludeAdminFile(Loc::getMessage("MESSAGESERVICE_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/messageservice/install/step1.php");
	}

	public function DoUninstall()
	{
		global $APPLICATION;

		$this->errors = [];

		$step = (int)($_REQUEST['step'] ?? 1);
		if ($step < 2)
		{
			$GLOBALS["messageservice_installer_errors"] = $this->errors;
			$APPLICATION->IncludeAdminFile(Loc::getMessage("MESSAGESERVICE_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/messageservice/install/unstep1.php");
		}
		elseif ($step==2)
		{
			$this->UnInstallDB(array(
				'savedata' => ($_REQUEST['savedata'] ?? 'N')
			));
			$this->UnInstallFiles();

			$GLOBALS["messageservice_installer_errors"] = $this->errors;
			$APPLICATION->IncludeAdminFile(Loc::getMessage("MESSAGESERVICE_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/messageservice/install/unstep2.php");
		}
	}
}
