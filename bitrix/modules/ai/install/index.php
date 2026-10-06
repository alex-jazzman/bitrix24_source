<?php

use Bitrix\AI\Handler\Main;
use Bitrix\AI\Rest;
use Bitrix\AI\Handler\Intranet;
use Bitrix\AI\Handler\Baas;
use Bitrix\AI\Cloud;
use Bitrix\AI\Cloud\Agent;
use Bitrix\AI\Cloud\Scenario\Registration;
use Bitrix\AI\Facade;
use Bitrix\Main\Application;
use Bitrix\Main\EventManager;
use Bitrix\Main\FileTable;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Config\Option;
use Bitrix\Main\ModuleManager;

Loc::loadMessages(__FILE__);

if (class_exists('AI'))
{
	return;
}

class AI extends \CModule
{
	public $MODULE_ID = 'ai';
	public $MODULE_GROUP_RIGHTS = 'Y';
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;

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

		$this->MODULE_NAME = Loc::getMessage('AI_INSTALL_MODULE_NAME');
		$this->MODULE_DESCRIPTION = Loc::getMessage('AI_INSTALL__MODULE_DESCRIPTION');
	}

	public function getDocumentRoot(): string
	{
		$context = Application::getInstance()->getContext();

		return $context->getServer()->getDocumentRoot();
	}

	/**
	 * Call all install methods.
	 * @returm void
	 */
	public function doInstall(): void
	{
		global $APPLICATION, $USER;

		$request = Application::getInstance()->getContext()->getRequest();
		$step = (int)$request->get('step');

		if ($USER->IsAdmin())
		{
			if ($step < 2)
			{
				$APPLICATION->IncludeAdminFile(Loc::getMessage('B24C_INSTALL_TITLE'), $this->getDocumentRoot() . '/bitrix/modules/ai/install/step1.php');
			}
			elseif ($step === 2)
			{
				if (!ModuleManager::isModuleInstalled('ai'))
				{
					$this->InstallDB();
					$this->InstallEvents();
					$this->InstallFiles();
					$GLOBALS['errors'] = $this->errors ?? [];

					$APPLICATION->includeAdminFile(
						Loc::getMessage('AI_INSTALL_INSTALL_TITLE'),
						$this->getDocumentRoot() . '/bitrix/modules/ai/install/step2.php'
					);
				}
			}
		}
	}

	/**
	 * Call all uninstall methods, include several steps.
	 * @returm void
	 */
	public function doUninstall(): void
	{
		global $APPLICATION;

		$request = Application::getInstance()->getContext()->getRequest();
		$step = (int)($request->get('step') ?? 1);

		if ($step < 2)
		{
			$APPLICATION->includeAdminFile(
				Loc::getMessage('AI_INSTALL_UNINSTALL_TITLE'),
				$this->getDocumentRoot() . '/bitrix/modules/ai/install/unstep1.php'
			);
		}
		elseif ($step === 2)
		{
			$params = [];
			$savedata = $request->get('savedata');
			if ($savedata !== null)
			{
				$params['savedata'] = $savedata === 'Y';
			}

			$this->uninstallDB($params);
			$this->uninstallFiles();

			$APPLICATION->includeAdminFile(
				Loc::getMessage('AI_INSTALL_UNINSTALL_TITLE'),
				$this->getDocumentRoot() . '/bitrix/modules/ai/install/unstep2.php'
			);
		}
	}

	/**
	 * Install DB, events, etc.
	 * @return bool
	 */
	public function installDB(): bool
	{
		global $APPLICATION;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
			$APPLICATION->throwException(implode('', $this->errors));
			return false;
		}

		// module
		registerModule('ai');
		$moduleLoaded = Loader::includeModule('ai');

		try
		{
			if ($moduleLoaded && !$this->isCloudInstallation())
			{
				$registration = new Registration('en');
				$autoRegisterResult = $registration->tryAutoRegister();

				if ($autoRegisterResult->isSuccess())
				{
					Application::getInstance()->addBackgroundJob(fn () => Agent\PropertiesSync::retrieveModels());
				}
			}
		}
		catch (\Exception)
		{
		}

		if ($moduleLoaded)
		{
			if ($this->isCloudInstallation())
			{
				$this->configureCloudBitrixGptFeatures();
			}
			else
			{
				$this->addDefaultBitrixEngines();
			}
		}

		return true;
	}

	protected function addDefaultBitrixEngines(): void
	{
		$engineClasses = [
			['CLASS' => 'Bitrix\AI\Engine\Cloud\Bitrix24', 'CATEGORY' => 'text'],
			['CLASS' => 'Bitrix\AI\Engine\Cloud\GigaChat', 'CATEGORY' => 'text'],
			['CLASS' => 'Bitrix\AI\Engine\Cloud\YandexGPT', 'CATEGORY' => 'text'],
			['CLASS' => 'Bitrix\AI\Engine\Cloud\BitrixAudio', 'CATEGORY' => 'audio'],
			['CLASS' => 'Bitrix\AI\Engine\Cloud\Whisper', 'CATEGORY' => 'audio'],
			['CLASS' => 'Bitrix\AI\Engine\Cloud\SaluteSpeech', 'CATEGORY' => 'audio'],
			['CLASS' => 'Bitrix\AI\Engine\Cloud\YandexART', 'CATEGORY' => 'image'],
			['CLASS' => 'Bitrix\AI\Engine\Cloud\Kandinsky', 'CATEGORY' => 'image'],
			['CLASS' => 'Bitrix\AI\Engine\Cloud\Dalle', 'CATEGORY' => 'image'],
			['CLASS' => 'Bitrix\AI\Engine\Cloud\AudioCall', 'CATEGORY' => 'call'],
			['CLASS' => 'Bitrix\AI\Engine\Cloud\BitrixAudioCall', 'CATEGORY' => 'call'],
			['CLASS' => 'Bitrix\AI\Engine\Cloud\Bitrix24VL', 'CATEGORY' => 'vision'],
		];

		if (!in_array(Facade\Portal::getRegion(), ['ru', 'by'], true))
		{
			$engineClasses = array_merge(
				$engineClasses,
				[
					['CLASS' => 'Bitrix\AI\Engine\Cloud\ItSolution', 'CATEGORY' => 'text'],
					['CLASS' => 'Bitrix\AI\Engine\Cloud\ItSolutionAudio', 'CATEGORY' => 'audio'],
					['CLASS' => 'Bitrix\AI\Engine\Cloud\ChatGPT', 'CATEGORY' => 'text'],
				]
			);
		}

		$existingClasses = array_column(
			\Bitrix\AI\Engine\Model\BitrixEngineTable::query()
				->setSelect(['CLASS'])
				->fetchAll(),
			'CLASS'
		);

		$existingClassesMap = array_flip($existingClasses);

		$dataToInsert = array_filter(
			$engineClasses,
			fn($engine) => !isset($existingClassesMap[$engine['CLASS']])
		);

		if (!empty($dataToInsert))
		{
			\Bitrix\AI\Engine\Model\BitrixEngineTable::addMulti($dataToInsert, true);
		}
	}

	/**
	 * Install files.
	 * @return bool
	 */
	public function installFiles(): bool
	{
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/ai/install/components", $_SERVER["DOCUMENT_ROOT"] . "/bitrix/components", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/ai/install/js", $_SERVER["DOCUMENT_ROOT"] . "/bitrix/js", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/ai/install/activities", $_SERVER["DOCUMENT_ROOT"] . "/bitrix/activities", true, true);

		return true;
	}

	/**
	 * Uninstall DB, events, etc.
	 * @param array $arParams Some params.
	 * @return bool
	 */
	public function uninstallDB(array $arParams = []): bool
	{
		global $APPLICATION;

		$dropTables = isset($arParams['savedata']) && !$arParams['savedata'];

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
			$APPLICATION->throwException(implode('', $this->errors));
			return false;
		}

		Option::delete('ai', ['name' => 'prompt_version']);
		Option::delete('ai', ['name' => '~prompts_system_update_format_version']);

		if (Loader::includeModule('ai'))
		{
			$cloudConfiguration = new Cloud\Configuration();
			$cloudConfiguration->resetCloudRegistration();
			\CAdminNotify::DeleteByTag(Registration::NOTIFICATION_TAG);
		}

		$this->unInstallTasks();

		// legacy cleanup: class is no longer present in the module, kept for old portals
		/** @see \Bitrix\AI\Handler\PublicAgreement */
		EventManager::getInstance()->unRegisterEventHandler('main', 'OnPageStart', 'ai', '\\Bitrix\\AI\\Handler\\PublicAgreement', 'onPageStart');

		// module
		unregisterModule('ai');

		// delete files finally
		if ($dropTables)
		{
			$res = FileTable::getList([
				'select' => [
					'ID',
				],
				'filter' => [
					'=MODULE_ID' => 'ai',
				],
				'order' => [
					'ID' => 'desc',
				],
			]);
			while ($row = $res->fetch())
			{
				CFile::delete($row['ID']);
			}
		}

		return true;
	}

	/**
	 * Uninstall files.
	 * @return bool
	 */
	public function uninstallFiles(): bool
	{
		DeleteDirFilesEx("/bitrix/js/ai/");

		return true;
	}

	private function configureCloudBitrixGptFeatures(): void
	{
		\COption::SetOptionString(
			'ai',
			'bitrixgpt_portalSettingsItemsToForceReset',
			json_encode([
				'crm_copilot_fill_item_from_call_engine_text',
				'crm_copilot_call_assessment_engine_code',
				'im_chat_answer_provider',
				'engine_text',
				'resume_transcription',
				'tasks_flows_text_generate_engine',
				'crm_copilot_repeat_sale_engine_code',
				'landing_text_provider',
				'landing_site_text_provider',
			])
		);

		\COption::SetOptionString(
			'ai',
			'bitrixaudio_portalSettingsItemsToForceReset',
			json_encode([
				'crm_copilot_fill_item_from_call_engine_audio',
				'transcribe_track',
				'im_file_transcription_provider'
			])
		);
	}

	private function isCloudInstallation(): bool
	{
		return (defined('BX24_HOST_NAME') && BX24_HOST_NAME !== '');
	}
}
