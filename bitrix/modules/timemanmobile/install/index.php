<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

Loc::loadMessages(__FILE__);

class TimemanMobile extends CModule
{
	public $MODULE_ID = 'timemanmobile';
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;
	public array $errors = [];

	public function __construct()
	{
		$arModuleVersion = [];
		include(__DIR__ . '/version.php');

		if (is_array($arModuleVersion) && $arModuleVersion['VERSION'] && $arModuleVersion['VERSION_DATE'])
		{
			$this->MODULE_VERSION = $arModuleVersion['VERSION'];
			$this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
		}

		$this->MODULE_NAME = Loc::getMessage('TIMEMANMOBILE_MODULE_NAME');
		$this->MODULE_DESCRIPTION = Loc::getMessage('TIMEMANMOBILE_MODULE_DESCRIPTION');
	}

	public function installDB()
	{
		ModuleManager::registerModule($this->MODULE_ID);

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();

			return false;
		}

		return true;
	}

	public function uninstallDB($arParams = [])
	{
		$dropTables = false;

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();

			return false;
		}

		ModuleManager::unRegisterModule($this->MODULE_ID);

		return true;
	}

	public function installFiles()
	{
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/timemanmobile/install/mobileapp/',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/mobileapp/',
			true,
			true,
		);

		return true;
	}

	public function uninstallFiles(): void
	{
		DeleteDirFilesEx('/bitrix/mobileapp/' . $this->MODULE_ID);
	}

	public function installEvents()
	{

	}

	public function uninstallEvents()
	{

	}

	private function installDependencies()
	{
		$pathToMobileApp = $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/mobileapp/install/index.php';

		if (!ModuleManager::isModuleInstalled('mobile') && file_exists($pathToMobileApp))
		{
			include_once($pathToMobileApp);

			$mobile = new mobile();
			$mobile->InstallFiles();
			$mobile->InstallDB();
		}
	}

	public function doInstall()
	{
		global $USER, $APPLICATION;

		if (!$USER->isAdmin())
		{
			return;
		}

		if (!ModuleManager::isModuleInstalled('timeman'))
		{
			$APPLICATION->throwException(Loc::getMessage('TIMEMANMOBILE_MODULE_INSTALL_ERROR_TIMEMAN'));
			$this->showInstallStep(1);
		}
		else
		{
			$this->installDB();
			$this->installFiles();
			$this->installEvents();
			$this->installDependencies();

			$this->showInstallStep(2);
		}
	}

	protected function showInstallStep(int $step): void
	{
		global $APPLICATION;

		$APPLICATION->IncludeAdminFile(
			Loc::getMessage('TIMEMANMOBILE_INSTALL_TITLE'),
			"{$_SERVER['DOCUMENT_ROOT']}/bitrix/modules/$this->MODULE_ID/install/step$step.php",
		);
	}

	public function doUninstall()
	{
		global $USER, $step;

		if (!$USER->isAdmin())
		{
			return;
		}

		$step = (int)$step;
		if ($step < 2)
		{
			$this->showUninstallStep(1);
		}
		elseif ($step === 2)
		{
			$this->uninstallDB();
			$this->uninstallFiles();
			$this->uninstallEvents();

			$this->showUninstallStep(2);
		}
	}

	protected function showUninstallStep(int $step): void
	{
		global $APPLICATION;

		$APPLICATION->IncludeAdminFile(
			Loc::getMessage('TIMEMANMOBILE_UNINSTALL_TITLE'),
			"{$_SERVER['DOCUMENT_ROOT']}/bitrix/modules/$this->MODULE_ID/install/unstep$step.php",
		);
	}
}
