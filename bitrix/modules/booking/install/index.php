<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\EventManager;

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
	 * @returm void
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
				Loc::getMessage('BOOKIN_UNINSTALL_TITLE'),
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

		$connection = \Bitrix\Main\Application::getConnection();

		// db
		$errors = $DB->runSQLBatch(
			$this->getDocumentRoot().'/bitrix/modules/booking/install/db/' . $connection->getType() . '/install.sql'
		);
		if ($errors !== false)
		{
			$APPLICATION->throwException(implode('', $errors));

			return false;
		}

		// module
		registerModule($this->MODULE_ID);
		$this->InstallEvents();
		$this->InstallAgents();
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
		CopyDirFiles($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/booking/install/js', $_SERVER['DOCUMENT_ROOT'].'/bitrix/js', true, true);
		CopyDirFiles($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/booking/install/components', $_SERVER['DOCUMENT_ROOT'].'/bitrix/components', true, true);
		CopyDirFiles($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/booking/install/templates', $_SERVER['DOCUMENT_ROOT'].'/bitrix/templates', true, true);

		return true;
	}

	/**
	 * Uninstalls DB, events, etc.
	 * @param array $arParams Some params.
	 * @return bool
	 */
	public function UninstallDB(array $arParams = [])
	{
		global $APPLICATION, $DB;
		$connection = \Bitrix\Main\Application::getConnection();

		$errors = false;

		// db
		if (isset($arParams['savedata']) && !$arParams['savedata'])
		{
			$errors = $DB->runSQLBatch(
				$this->getDocumentRoot().'/bitrix/modules/booking/install/db/' . $connection->getType() . '/uninstall.sql'
			);
		}
		if ($errors !== false)
		{
			$APPLICATION->throwException(implode('', $errors));
			return false;
		}

		$this->UnInstallEvents();
		$this->deleteTemplateRules();

		// module
		unregisterModule($this->MODULE_ID);

		return true;
	}

	public function UnInstallFiles()
	{
		DeleteDirFilesEx('/bitrix/js/booking/');

		return true;
	}

	public function InstallEvents(): void
	{
		EventManager::getInstance()->registerEventHandler(
			'crm',
			'OnAfterCrmContactDelete',
			'booking',
			'\Bitrix\Booking\Internals\Integration\Crm\EventsHandler',
			'onContactDelete'
		);

		EventManager::getInstance()->registerEventHandler(
			'crm',
			'OnAfterCrmCompanyDelete',
			'booking',
			'\Bitrix\Booking\Internals\Integration\Crm\EventsHandler',
			'onCompanyDelete'
		);

		EventManager::getInstance()->registerEventHandler(
			'crm',
			'OnAfterCrmDealDelete',
			'booking',
			'\Bitrix\Booking\Internals\Integration\Crm\EventsHandler',
			'onDealDelete'
		);

		EventManager::getInstance()->registerEventHandler(
			'crm',
			'OnCrmBookingFormSubmitted',
			'booking',
			'\Bitrix\Booking\Internals\Integration\Crm\EventsHandler',
			'onCrmBookingFormFilled'
		);

		EventManager::getInstance()->registerEventHandler(
			'crm',
			'onCrmDynamicItemDelete',
			'booking',
			'\Bitrix\Booking\Internals\Integration\Crm\EventsHandler',
			'onDynamicItemDelete'
		);
	}

	public function InstallAgents(): void
	{
		\CAgent::AddAgent(
			name: '\\Bitrix\\Booking\\Internals\\Service\\Notifications\\Agent\\NotificationAgent::execute();',
			module: 'booking',
			interval: 60,
			next_exec: ConvertTimeStamp(time() + \CTimeZone::GetOffset() + 60, 'FULL'),
			existError: false
		);

		\CAgent::AddAgent(
			name: '\\Bitrix\\Booking\\Internals\\Service\\Notifications\\Agent\\ConfirmationCounterAgent::execute();',
			module: 'booking',
			interval: 60,
			next_exec: ConvertTimeStamp(time() + \CTimeZone::GetOffset() + 60, 'FULL'),
			existError: false
		);

		\CAgent::AddAgent(
			name: '\\Bitrix\\Booking\\Internals\\Service\\Notifications\\Agent\\DelayedCounterAgent::execute();',
			module: 'booking',
			interval: 60,
			next_exec: ConvertTimeStamp(time() + CTimeZone::GetOffset() + 60, 'FULL'),
			existError: false
		);

		\CAgent::AddAgent(
			name: '\\Bitrix\\Booking\\Internals\\Service\\Agent\\ClearOldCountersAgent::execute();',
			module: 'booking',
			interval: 60 * 60, // 1 hour
			next_exec: ConvertTimeStamp(time() + \CTimeZone::GetOffset() + 12 * 60 * 60, 'FULL'),
			existError: false
		);

		\CAgent::AddAgent(
			name: '\\Bitrix\\Booking\\Internals\\Service\\InstallAgent::execute();',
			module: 'booking',
			interval: 60,
			next_exec: ConvertTimeStamp(time() + CTimeZone::GetOffset() + 60, 'FULL'),
			existError: false
		);
	}

	public function UnInstallEvents(): void
	{
		EventManager::getInstance()->unRegisterEventHandler(
			'crm',
			'OnAfterCrmContactDelete',
			'booking',
			'\Bitrix\Booking\Internals\Integration\Crm\EventsHandler',
			'onContactDelete'
		);

		EventManager::getInstance()->unRegisterEventHandler(
			'crm',
			'OnAfterCrmCompanyDelete',
			'booking',
			'\Bitrix\Booking\Internals\Integration\Crm\EventsHandler',
			'onCompanyDelete'
		);

		EventManager::getInstance()->unRegisterEventHandler(
			'crm',
			'OnAfterCrmDealDelete',
			'booking',
			'\Bitrix\Booking\Internals\Integration\Crm\EventsHandler',
			'onDealDelete'
		);

		EventManager::getInstance()->unRegisterEventHandler(
			'crm',
			'OnCrmBookingFormSubmitted',
			'booking',
			'\Bitrix\Booking\Internals\Integration\Crm\EventsHandler',
			'onCrmBookingFormFilled'
		);

		EventManager::getInstance()->unRegisterEventHandler(
			'crm',
			'onCrmDynamicItemDelete',
			'booking',
			'\Bitrix\Booking\Internals\Integration\Crm\EventsHandler',
			'onDynamicItemDelete'
		);
	}
}
