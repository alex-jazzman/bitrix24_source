<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Config\Option;

Loc::loadMessages(__FILE__);

if (class_exists('booking'))
{
	return;
}

class booking extends CModule
{
	public $MODULE_ID = 'booking';
	public $MODULE_GROUP_RIGHTS = 'N';
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;

	private const SITE_TEMPLATE_CODE = 'booking_pub';

	/**
	 * Constructor.
	 */
	public function __construct()
	{
		$arModuleVersion = [];

		include(__DIR__ . '/version.php');

		if (is_array($arModuleVersion) && array_key_exists('VERSION', $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion['VERSION'];
			$this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
		}

		$this->MODULE_NAME = Loc::getMessage('BOOKING_MODULE_NAME');
		$this->MODULE_DESCRIPTION = Loc::getMessage('BOOKING_MODULE_DESCRIPTION');
	}

	private function getDocumentRoot(): string
	{
		$context =
			\Bitrix\Main\Application::getInstance()
				->getContext()
		;

		return $context ? $context->getServer()
			->getDocumentRoot() : $_SERVER['DOCUMENT_ROOT'];
	}

	/**
	 * Calls all install methods.
	 * @return void
	 */
	public function doInstall()
	{
		global $APPLICATION;

		$this->InstallFiles();
		$this->InstallDB();

		$APPLICATION->includeAdminFile(
			Loc::getMessage('BOOKING_INSTALL_TITLE'),
			$this->getDocumentRoot() . '/bitrix/modules/booking/install/step1.php'
		);
	}

	/**
	 * Calls all uninstall methods, include several steps.
	 * @returm void
	 */
	public function doUninstall()
	{
		global $APPLICATION;

		$step = isset($_GET['step']) ? intval($_GET['step']) : 1;
		if ($step < 2)
		{
			$APPLICATION->includeAdminFile(
				Loc::getMessage('BOOKING_UNINSTALL_TITLE'),
				$this->getDocumentRoot() . '/bitrix/modules/booking/install/unstep1.php'
			);
		}
		elseif ($step === 2)
		{
			$params = [];
			if (isset($_GET['savedata']))
			{
				$params['savedata'] = $_GET['savedata'] == 'Y';
			}
			$this->UninstallDB($params);
			$this->UninstallFiles();
			$APPLICATION->includeAdminFile(
				Loc::getMessage('BOOKING_UNINSTALL_TITLE'),
				$this->getDocumentRoot() . '/bitrix/modules/booking/install/unstep2.php'
			);
		}
	}

	/**
	 * Installs DB, events, etc.
	 * @return bool
	 */
	public function InstallDB()
	{
		global $DB, $APPLICATION;

		if (!$DB->Query('SELECT 1 FROM b_booking_scorer WHERE 1=0', true))
		{
			$this->cleanCounters();
		}

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$errors = $migrationResult->getErrorMessages();
			$APPLICATION->throwException(implode('', $errors));

			return false;
		}

		registerModule($this->MODULE_ID);
		$this->installTemplateRules();

		return true;
	}

	private function installTemplateRules(): void
	{
		$this->deleteTemplateRules();

		$siteId = CSite::GetDefSite();
		if ($siteId)
		{
			$bookingTemplate = [
				'SORT' => 0,
				'SITE_ID' => $siteId,
				'CONDITION' => "CSite::InDir('/pub/booking/confirmation/')",
				'TEMPLATE' => self::SITE_TEMPLATE_CODE,
			];

			\Bitrix\Main\SiteTemplateTable::add($bookingTemplate);
		}
	}

	private function deleteTemplateRules(): void
	{
		\Bitrix\Main\SiteTemplateTable::deleteByFilter([
			'=TEMPLATE' => self::SITE_TEMPLATE_CODE,
		]);
	}

	/**
	 * Installs files.
	 * @return bool
	 */
	public function InstallFiles()
	{
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/booking/install/js',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/js',
			true,
			true,
		);
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/booking/install/components',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/components',
			true,
			true,
		);
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/booking/install/templates',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/templates',
			true,
			true,
		);
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/booking/install/activities',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/activities',
			true,
			true,
		);

		return true;
	}

	/**
	 * Uninstalls DB, events, etc.
	 * @param array $arParams Some params.
	 * @return bool
	 */
	public function UninstallDB(array $arParams = [])
	{
		global $APPLICATION;

		$dropTables = isset($arParams['savedata']) && !$arParams['savedata'];

		if ($dropTables)
		{
			$this->cleanCounters();
		}

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$errors = $migrationResult->getErrorMessages();
			$APPLICATION->throwException(implode('', $errors));

			return false;
		}

		if ($dropTables)
		{
			Option::delete($this->MODULE_ID);
		}

		$this->deleteTemplateRules();

		unregisterModule($this->MODULE_ID);

		return true;
	}

	public function UnInstallFiles()
	{
		DeleteDirFilesEx('/bitrix/js/booking/');

		return true;
	}

	private function cleanCounters(): void
	{
		global $DB, $CACHE_MANAGER;

		$DB->Query("DELETE FROM b_user_counter WHERE CODE = 'booking_total'");
		$CACHE_MANAGER->CleanDir('user_counter');
	}
}
