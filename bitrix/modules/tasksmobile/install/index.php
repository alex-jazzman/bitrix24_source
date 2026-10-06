<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

Loc::loadMessages(__FILE__);

class TasksMobile extends CModule
{
	public $MODULE_ID = 'tasksmobile';
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;

	public function __construct()
	{
		$arModuleVersion = [];
		include(__DIR__ . '/version.php');

		if (is_array($arModuleVersion) && $arModuleVersion['VERSION'] && $arModuleVersion['VERSION_DATE'])
		{
			$this->MODULE_VERSION = $arModuleVersion['VERSION'];
			$this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
		}

		$this->MODULE_NAME = Loc::getMessage('TASKSMOBILE_MODULE_NAME');
		$this->MODULE_DESCRIPTION = Loc::getMessage('TASKSMOBILE_MODULE_DESCRIPTION');
	}

	public function installDB()
	{
		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();

			return false;
		}

		ModuleManager::registerModule($this->MODULE_ID);

		return true;
	}

	public function uninstallDB($arParams = [])
	{
		$migrationResult = $this->uninstallMigrations(false);
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
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/tasksmobile/install/mobileapp/',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/mobileapp/',
			true,
			true,
		);
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/tasksmobile/install/components/',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/components',
			true,
			true,
		);
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/tasksmobile/install/js/',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/js/',
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

		if ($this->installDB())
		{
			$this->installFiles();
			$this->installEvents();
			$this->installDependencies();
		}
		else
		{
			$APPLICATION->ThrowException(implode('<br>', $this->errors));
		}

		$APPLICATION->IncludeAdminFile(
			Loc::getMessage('TASKSMOBILE_INSTALL_TITLE'),
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/step.php',
		);
	}

	public function doUninstall()
	{
		global $USER, $APPLICATION, $step;

		if (!$USER->isAdmin())
		{
			return;
		}

		$step = (int)$step;
		if ($step < 2)
		{
			$APPLICATION->IncludeAdminFile(
				Loc::getMessage('TASKSMOBILE_UNINSTALL_TITLE'),
				$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/unstep1.php',
			);
		}
		elseif ($step === 2)
		{
			if ($this->uninstallDB())
			{
				$this->uninstallFiles();
				$this->uninstallEvents();
			}
			else
			{
				$APPLICATION->ThrowException(implode('<br>', $this->errors));
			}

			$APPLICATION->IncludeAdminFile(
				Loc::getMessage('TASKSMOBILE_UNINSTALL_TITLE'),
				$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/unstep2.php',
			);
		}
	}
}
