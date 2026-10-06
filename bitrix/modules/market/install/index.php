<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

Loc::loadMessages(__FILE__);

if (class_exists('Market'))
{
	return;
}

class Market extends \CModule
{
	public $MODULE_ID = 'market';
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;
	private $MODULE_FOLDER;
	private $errors;

	public function __construct()
	{
		$arModuleVersion = [];

		include __DIR__ . '/version.php';

		if (is_array($arModuleVersion) && array_key_exists('VERSION', $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion['VERSION'];
			$this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
		}

		$this->MODULE_NAME = Loc::getMessage('MARKET_INSTALL_NAME_MSGVER_1');
		$this->MODULE_DESCRIPTION = Loc::getMessage('MARKET_INSTALL_DESCRIPTION_MSGVER_1');
		$this->MODULE_FOLDER = $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID;
	}

	public function installFiles($params = [])
	{
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/market/install/components", $_SERVER["DOCUMENT_ROOT"] . "/bitrix/components", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/market/install/js", $_SERVER["DOCUMENT_ROOT"] . "/bitrix/js", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/market/install/images",  $_SERVER["DOCUMENT_ROOT"] . "/bitrix/images/market", true, true);

		if(ModuleManager::isModuleInstalled('intranet'))
		{
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/market/install/public", $_SERVER["DOCUMENT_ROOT"] . "/", true, true);
		}

		return true;
	}

	public function installDB()
	{
		global $APPLICATION;

		$this->errors = false;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
			$APPLICATION->ThrowException(implode('<br>', $this->errors));

			return false;
		}

		ModuleManager::registerModule($this->MODULE_ID);

		return true;
	}

	public function uninstallDB($arParams = [])
	{
		global $APPLICATION;

		$this->errors = false;
		$dropTables = !array_key_exists('save_tables', $arParams) || $arParams['save_tables'] !== 'Y';

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
			$APPLICATION->ThrowException(implode('<br>', $this->errors));

			return false;
		}

		ModuleManager::unRegisterModule($this->MODULE_ID);

		return true;
	}

	public function uninstallFiles()
	{
		return true;
	}

	public function doInstall()
	{
		global $APPLICATION, $step, $USER;
		if ($USER->isAdmin())
		{
			$step = (int)$step;
			if ($step < 2)
			{
				$APPLICATION->includeAdminFile(
					Loc::getMessage('MARKET_INSTALL_TITLE_MSGVER_1'),
					$this->MODULE_FOLDER . '/install/step1.php',
				);
			}
			elseif ($step == 2)
			{
				if ($this->installDB())
				{
					$this->installFiles(
						[
							'public_dir' => (isset($_REQUEST['install_public']) && $_REQUEST['install_public'] == 'Y') ? 'market' : '',
							'public_rewrite' => (isset($_REQUEST['public_rewrite']) && $_REQUEST['public_rewrite'] == 'Y'),
						],
					);
				}
				$GLOBALS['errors'] = $this->errors;
				$APPLICATION->includeAdminFile(
					Loc::getMessage('MARKET_INSTALL_TITLE_MSGVER_1'),
					$this->MODULE_FOLDER . '/install/step2.php',
				);
			}
		}
	}

	public function doUninstall()
	{
		global $APPLICATION, $step, $USER;
		if ($USER->isAdmin())
		{
			$step = (int)$step;
			if ($step < 2)
			{
				$APPLICATION->includeAdminFile(
					Loc::getMessage('MARKET_UNINSTALL_TITLE_MSGVER_1'),
					$this->MODULE_FOLDER . '/install/unstep1.php',
				);
			}
			elseif ($step == 2)
			{
				$this->unInstallDB([
					'save_tables' => $_REQUEST['save_tables'] ?? null,
				]);
				$this->unInstallFiles();
				$GLOBALS['errors'] = $this->errors;
				$APPLICATION->includeAdminFile(
					Loc::getMessage('MARKET_UNINSTALL_TITLE_MSGVER_1'),
					$this->MODULE_FOLDER . '/install/unstep2.php',
				);
			}
		}
	}
}
