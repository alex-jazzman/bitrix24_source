<?php

use Bitrix\Main\Config\Configuration;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

Loc::loadMessages(__FILE__);

if (class_exists('vibecodeconnector'))
{
	return;
}

class Vibecodeconnector extends CModule
{
	private const ROUTE_FILE = 'vibecodeconnector.php';
	private const PREVIEW_ROUTES = [
		'/vibecode/app/#catalogItemId#/',
		'/vibecode/app/#catalogItemId#',
	];
	private const PREVIEW_ROUTE_HANDLER =
		'\Bitrix\Vibecodeconnector\Internal\Integration\Main\UrlPreview\CatalogItemUrlPreview';
	private const PREVIEW_ROUTE_PARAMETERS = ['catalogItemId' => '$catalogItemId'];

	public $MODULE_ID = 'vibecodeconnector';
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;
	public $MODULE_GROUP_RIGHTS = 'N';

	public function __construct()
	{
		$arModuleVersion = [];
		include __DIR__ . '/version.php';
		$this->MODULE_VERSION = $arModuleVersion['VERSION'];
		$this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
		$this->MODULE_NAME = Loc::getMessage('VIBECODECONNECTOR_INSTALL_MODULE_NAME_V2');
		$this->MODULE_DESCRIPTION = Loc::getMessage('VIBECODECONNECTOR_INSTALL_MODULE_DESCRIPTION_V2');
	}

	public function DoInstall(): void
	{
		global $APPLICATION, $USER;

		$request = \Bitrix\Main\Context::getCurrent()->getRequest();
		$interactive = $request->get('id') === $this->MODULE_ID;

		if ($interactive)
		{
			$step = (int)$request->getPost('step');
			if ($step < 2)
			{
				$APPLICATION->IncludeAdminFile(
					Loc::getMessage('VIBECODECONNECTOR_INSTALL_BETA_STEP_TITLE'),
					__DIR__ . '/step1.php'
				);

				return;
			}

			if ($request->getPost('beta_accept') !== 'Y')
			{
				$APPLICATION->ThrowException(Loc::getMessage('VIBECODECONNECTOR_INSTALL_BETA_ERROR_NOT_ACCEPTED'));
				$APPLICATION->IncludeAdminFile(
					Loc::getMessage('VIBECODECONNECTOR_INSTALL_BETA_STEP_TITLE'),
					__DIR__ . '/step1.php'
				);

				return;
			}

			$userId = (isset($USER) && is_object($USER)) ? (string)$USER->GetID() : '';
			Option::set('vibecodeconnector', 'beta_accepted', 'Y');
			Option::set('vibecodeconnector', 'beta_accepted_by', $userId);
			Option::set('vibecodeconnector', 'beta_accepted_at', date('Y-m-d H:i:s'));
		}

		if ($this->InstallDB() === false)
		{
			return;
		}

		$this->InstallFiles();

		if ($interactive)
		{
			$APPLICATION->IncludeAdminFile(
				Loc::getMessage('VIBECODECONNECTOR_INSTALL_DONE_HEADING'),
				__DIR__ . '/step2.php'
			);
		}
	}

	public function DoUninstall(): void
	{
		global $APPLICATION;

		$request = \Bitrix\Main\Context::getCurrent()->getRequest();

		if ($this->isRegisteredWithPlatform())
		{
			$APPLICATION->ThrowException(Loc::getMessage('VIBECODECONNECTOR_UNINSTALL_PLATFORM_STILL_REGISTERED'));

			if ($request->get('id') === $this->MODULE_ID)
			{
				$APPLICATION->IncludeAdminFile(
					Loc::getMessage('VIBECODECONNECTOR_UNINSTALL_TITLE'),
					__DIR__ . '/unstep1.php'
				);
			}

			return;
		}

		$this->removeModuleAfterAppChatCleanup();
	}

	protected function removeModuleAfterAppChatCleanup(): void
	{
		global $APPLICATION;

		try
		{
			$this->cleanupAppChatsBeforeUninstall();
		}
		catch (\Throwable $exception)
		{
			\AddMessage2Log(
				'Vibecodeconnector uninstall was stopped before app-chat cleanup completed: '
					. $exception->getMessage(),
				$this->MODULE_ID,
			);
			$APPLICATION->ThrowException(
				Loc::getMessage('VIBECODECONNECTOR_UNINSTALL_ERROR') . ': ' . $exception->getMessage(),
			);

			return;
		}

		$this->UninstallFiles();
		$this->UnInstallDB();
	}

	protected function cleanupAppChatsBeforeUninstall(): void
	{
		if (!\Bitrix\Main\Loader::includeModule($this->MODULE_ID))
		{
			throw new \RuntimeException('The vibecodeconnector module could not be loaded for app-chat cleanup');
		}

		(new \Bitrix\Vibecodeconnector\Internal\Service\Catalog\AppChat\AppChatUninstallService())->cleanup();
	}

	private function isRegisteredWithPlatform(): bool
	{
		if (!\Bitrix\Main\Loader::includeModule($this->MODULE_ID))
		{
			return false;
		}

		return \Bitrix\Main\DI\ServiceLocator::getInstance()
			->get(\Bitrix\Vibecodeconnector\Internal\Service\Registration\RegistrationService::class)
			->isRegistered();
	}

	public function InstallFiles(): void
	{
		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/vibecodeconnector/install/js',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/js',
			true,
			true,
		);

		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/vibecodeconnector/install/admin',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/admin',
			true,
		);

		CopyDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/vibecodeconnector/install/routes',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/routes',
			true,
		);

		$this->registerRouteFile();
	}

	public function UninstallFiles(): void
	{
		DeleteDirFilesEx('/bitrix/js/vibecodeconnector/');

		DeleteDirFiles(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/vibecodeconnector/install/admin',
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/admin',
		);

		$this->unregisterRouteFile();
		@unlink($_SERVER['DOCUMENT_ROOT'] . '/bitrix/routes/' . self::ROUTE_FILE);
	}

	private function registerRouteFile(): void
	{
		$routesConfig = $this->routesConfig();
		if ($routesConfig === null)
		{
			return;
		}

		$config = $routesConfig->get('routing')['config'] ?? [];

		if (!in_array(self::ROUTE_FILE, $config, true))
		{
			$config[] = self::ROUTE_FILE;
			$routesConfig->add('routing', ['config' => $config]);
			$routesConfig->saveConfiguration();
		}
	}

	private function unregisterRouteFile(): void
	{
		$routesConfig = $this->routesConfig();
		if ($routesConfig === null)
		{
			return;
		}

		$config = $routesConfig->get('routing')['config'] ?? [];

		$filtered = array_values(array_filter(
			$config,
			static fn ($file) => $file !== self::ROUTE_FILE,
		));

		if ($filtered !== $config)
		{
			$routesConfig->add('routing', ['config' => $filtered]);
			$routesConfig->saveConfiguration();
		}
	}

	private function routesConfig(): ?Configuration
	{
		if (!method_exists(Configuration::class, 'getInstanceByPath'))
		{
			return null;
		}

		return Configuration::getInstanceByPath(
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/routes/.settings.php',
		);
	}

	function InstallDB($registerModule = true)
	{
		global $APPLICATION;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode('<br>', $migrationResult->getErrorMessages()));

			return false;
		}

		if ($registerModule !== false)
		{
			ModuleManager::registerModule($this->MODULE_ID);
		}

		if ($this->isDefaultVisibilityAllowed())
		{
			Option::set('vibecodeconnector', 'is_ready', 'Y');
			Option::set('vibecodeconnector', 'open_app_in_iframe', 'Y');
			Option::set('immobile', 'is_vibecode_button_available', 'Y');
		}

		foreach (self::PREVIEW_ROUTES as $previewRoute)
		{
			\Bitrix\Main\UrlPreview\Router::setRouteHandler(
				$previewRoute,
				$this->MODULE_ID,
				self::PREVIEW_ROUTE_HANDLER,
				self::PREVIEW_ROUTE_PARAMETERS,
			);
		}

		return true;
	}

	private function isDefaultVisibilityAllowed(): bool
	{
		if (!\Bitrix\Main\Loader::includeModule('bitrix24'))
		{
			return false;
		}

		return in_array(\CBitrix24::getPortalZone(), ['ru', 'by', 'kz', 'uz']);
	}

	function UnInstallDB()
	{
		global $APPLICATION;

		$dropTables = true;

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode('<br>', $migrationResult->getErrorMessages()));

			return false;
		}

		ModuleManager::unRegisterModule($this->MODULE_ID);

		return true;
	}

	function InstallEvents()
	{
		\RegisterModuleDependences(
			'main',
			'OnEpilog',
			$this->MODULE_ID,
			\Bitrix\Vibecodeconnector\Infrastructure\Integration\Main\EventHandler::class,
			'onEpilog',
			101
		);

		return true;
	}
}
