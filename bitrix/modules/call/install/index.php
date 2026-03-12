<?php

if (class_exists('call'))
{
	return;
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Call\EventHandler;
use Bitrix\Call\Integration;

class call extends \CModule
{
	public $MODULE_ID = 'call';

	private const EVENTS = [
		'call' => [
			'onCallAiTask' => [[Integration\AI\EventService::class, 'onCallAiTaskStart']],
			'onCallAiOutcome' => [[Integration\AI\EventService::class, 'onCallAiTaskComplete']],
			'onCallAiFailed' => [[Integration\AI\EventService::class, 'onCallAiTaskFailed']],
			'onCallFinished' => [
				[Integration\AI\EventService::class, 'onCallFinished'],
				[EventHandler::class, 'onCallFinished'],
			],
		],
		'im' => [
			'OnChatUserDelete' => [[EventHandler::class, 'onChatUserLeave']],
			'OnChatUserAdd' => [[EventHandler::class, 'onChatUserAdd']],
			'OnCallUserStateChange' => [[EventHandler::class, 'onCallUserStateChange']],
			'OnChangeUserRoles' => [[EventHandler::class, 'onChangeUserRoles']],
		],
		'mobile' => [
			'onGetMobileCounterTypes' => [[\Bitrix\Call\Counter::class, 'onGetMobileCounterTypes']],
			'onGetMobileCounter' => [[\Bitrix\Call\Counter::class, 'onGetMobileCounter']],
		],
		'ai' => [
			'onQueueJobExecute' => [[Integration\AI\CallAIService::class, 'onQueueTaskExecute']],
			'onQueueJobFail' => [[Integration\AI\CallAIService::class, 'onQueueTaskFail']],
			'onTuningLoad' => [[Integration\AI\CallAISettings::class, 'onTuningLoad']],
		],
		'voximplant' => [
			'OnAfterStatisticAdd' => [[Integration\Voximplant\EventHandler::class, 'onAfterStatisticAdd']],
			'onConferenceFinished' => [[\Bitrix\Call\Call::class, 'onVoximplantConferenceFinished']]
		],
		'bitrix24' => [
			'onDomainChange' => [[EventHandler::class, 'onPortalDomainChange']],
		],
		'rest' => [
			'onRestCheckAuth' => [[\Bitrix\Call\Rest\Auth::class, 'onRestCheckAuth']],
			'OnRestServiceBuildDescription' => [[\Bitrix\Call\Rest\Handler::class, 'onRestServiceBuildDescription']],
		],
		'main' => [
			'OnAfterSetOption_~controller_group_name' => [[EventHandler::class, 'onControllerGroupNameChange']],
		],
	];


	public function __construct()
	{
		$arModuleVersion = [];

		include(__DIR__.'/version.php');

		if (is_array($arModuleVersion) && array_key_exists('VERSION', $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion['VERSION'];
			$this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
		}

		$this->MODULE_NAME = Loc::getMessage('CALL_MODULE_NAME');
		$this->MODULE_DESCRIPTION = Loc::getMessage('CALL_MODULE_DESCRIPTION');
	}

	public function doInstall()
	{
		global $APPLICATION;
		$this->installFiles();
		$this->installDB();

		$APPLICATION->includeAdminFile(
			Loc::getMessage('CALL_INSTALL_TITLE'),
			$_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/call/install/step1.php'
		);
	}

	public function installDB()
	{
		global $APPLICATION, $DB;

		$connection = \Bitrix\Main\Application::getConnection();

		$APPLICATION->resetException();
		$errors = $DB->RunSQLBatch($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/call/install/db/' . $connection->getType() . '/install.sql');
		if (!empty($errors))
		{
			$APPLICATION->throwException(implode('', $errors));
			return false;
		}
		else
		{
			$DB->RunSQLBatch($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/call/install/db/' . $connection->getType() . '/install_ft.sql');
		}
		if (!empty($errors))
		{
			$APPLICATION->throwException(implode('', $errors));
		}

		\Bitrix\Main\ModuleManager::registerModule('call');

		if (\Bitrix\Main\ORM\Fields\CryptoField::cryptoAvailable())
		{
			\Bitrix\Main\ORM\Data\DataManager::enableCrypto('PASSWORD', 'b_call_conference');
		}

		$this->installEventHandlers();
		$this->installAgents();
		$this->installTemplateRules();

		return true;
	}

	public function installFiles()
	{
		\CopyDirFiles($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/call/install/js', $_SERVER['DOCUMENT_ROOT'].'/bitrix/js', true, true);
		\CopyDirFiles($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/call/install/components', $_SERVER['DOCUMENT_ROOT'].'/bitrix/components', true, true);
		\CopyDirFiles($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/call/install/images', $_SERVER['DOCUMENT_ROOT'].'/bitrix/images', true, true);
		\CopyDirFiles($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/call/install/templates', $_SERVER['DOCUMENT_ROOT'].'/bitrix/templates', true, true);
		\CopyDirFiles($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/call/install/activities', $_SERVER['DOCUMENT_ROOT'].'/bitrix/activities', true, true);

		if (
			!\Bitrix\Main\ModuleManager::isModuleInstalled('bitrix24')
			&& \Bitrix\Main\ModuleManager::isModuleInstalled('intranet')
		)
		{
			$defaultSiteId = \CSite::GetDefSite();
			if ($defaultSiteId)
			{
				$site = \Bitrix\Main\SiteTable::getRow(["filter" => ["=LID" => $defaultSiteId]]);
				$docRoot = $site["DOC_ROOT"];
				if (!empty($docRoot))
				{
					$docRoot = \Bitrix\Main\IO\Path::normalize($docRoot);
				}
				else
				{
					$docRoot = $_SERVER['DOCUMENT_ROOT'];
				}
				if (!is_link($docRoot . "/urlrewrite.php"))
				{
					\Bitrix\Main\UrlRewriter::add(
						$defaultSiteId,
						[
							'CONDITION' => '#^/call/detail/([0-9]+)#',
							'RULE' => "callId=\$1",
							'PATH' => '/call/index.php',
							'ID' => 'bitrix:call',
						]
					);
					\Bitrix\Main\UrlRewriter::add(
						$defaultSiteId,
						[
							"CONDITION" => "#^/video/([\\.\\-0-9a-zA-Z]+)(/?)([^/]*)#",
							"RULE" => "alias=\$1&videoconf",
							"PATH" => "/conference/videoconf.php",
							"ID" => "bitrix:conference",
						]
					);
				}
			}
			if (\Bitrix\Main\Loader::includeModule('extranet'))
			{
				$extranetSiteId = \CExtranet::GetExtranetSiteID();
				if ($extranetSiteId)
				{
					$extranetSite = \Bitrix\Main\SiteTable::getRow(["filter" => ["=LID" => $defaultSiteId]]);
					$extranetDocRoot = $extranetSite["DOC_ROOT"];
					if (!empty($extranetDocRoot))
					{
						$extranetDocRoot = \Bitrix\Main\IO\Path::normalize($extranetDocRoot);
					}
					else
					{
						$extranetDocRoot = $_SERVER['DOCUMENT_ROOT'];
					}
					if (!is_link($extranetDocRoot . "/urlrewrite.php"))
					{
						\Bitrix\Main\UrlRewriter::add(
							$extranetSiteId,
							[
								"CONDITION" => "#^/extranet/video/([\\.\\-0-9a-zA-Z]+)(/?)([^/]*)#",
								"RULE" => "alias=\$1&videoconf",
								"PATH" => "/conference/videoconf.php",
								"ID" => "bitrix:conference",
							]
						);
						\Bitrix\Main\UrlRewriter::add(
							$extranetSiteId,
							[
								'CONDITION' => '#^/extranet/call/detail/([0-9]+)#',
								'RULE' => "callId=\$1",
								'PATH' => '/extranet/call/index.php',
								'ID' => 'bitrix:call',
							]
						);
					}
				}
			}
		}

		/** @global \CMain */
		global $APPLICATION;
		$APPLICATION->setFileAccessPermission('/video/', ["*" => "R"]);
		$APPLICATION->setFileAccessPermission('/conference/videoconf.php', ["*" => "R"]);

		return true;
	}

	public function installTemplateRules(): void
	{
		$defaultSiteId = \CSite::GetDefSite();
		if ($defaultSiteId)
		{
			$callAppFound = false;
			$arCallTemplate = [
				'SORT' => 50,
				'CONDITION' => 'preg_match("#^/video/([\.\-0-9a-zA-Z]+)(/?)([^/]*)#", $GLOBALS[\'APPLICATION\']->GetCurPage(0))',
				'TEMPLATE' => 'call_app'
			];

			$callExtranetAppFound = false;
			$arCallExtranetTemplate = [
				'SORT' => 55,
				'CONDITION' => 'preg_match("#^/extranet/video/([\.\-0-9a-zA-Z]+)(/?)([^/]*)#", $GLOBALS[\'APPLICATION\']->GetCurPage(0))',
				'TEMPLATE' => 'call_app'
			];

			$callDesktopAppFound = false;
			$arCallTemplateForDesktop = [
				'SORT' => 60,
				'CONDITION' => 'preg_match("#^/desktop_app/router.php\?alias=([\.\-0-9a-zA-Z]+)&videoconf#", $GLOBALS[\'APPLICATION\']->GetCurPage(0))',
				'TEMPLATE' => 'call_app'
			];

			$conferenceFound = false;
			$conferenceTemplate = [
				'SORT' => 60,
				'CONDITION' => 'preg_match("#^/conference/videoconf.php\?alias=([\.\-0-9a-zA-Z]+)&videoconf#", $GLOBALS[\'APPLICATION\']->GetCurPage(0))',
				'TEMPLATE' => 'call_app'
			];

			$checkDubles = [];
			$arFields = ['TEMPLATE' => []];
			$dbTemplates = \CSite::GetTemplateList($defaultSiteId);
			while ($template = $dbTemplates->Fetch())
			{
				$checkCondition = $template['TEMPLATE']. ', '. $template['CONDITION'];

				if ($checkCondition == $arCallTemplate['TEMPLATE'].', '.$arCallTemplate['CONDITION'])
				{
					$callAppFound = true;
					$template = $arCallTemplate;
				}
				elseif ($checkCondition == $arCallExtranetTemplate['TEMPLATE'].', '.$arCallExtranetTemplate['CONDITION'])
				{
					$callExtranetAppFound = true;
					$template = $arCallExtranetTemplate;
				}
				elseif ($checkCondition == $arCallTemplateForDesktop['TEMPLATE'].', '.$arCallTemplateForDesktop['CONDITION'])
				{
					$callDesktopAppFound = true;
					$template = $arCallTemplateForDesktop;
				}
				elseif ($checkCondition == $conferenceTemplate['TEMPLATE'].', '.$conferenceTemplate['CONDITION'])
				{
					$conferenceFound = true;
					$template = $conferenceTemplate;
				}
				if (!in_array($checkCondition, $checkDubles))
				{
					$checkDubles[] = $checkCondition;
					$arFields['TEMPLATE'][] = [
						'SORT' => $template['SORT'],
						'CONDITION' => $template['CONDITION'],
						'TEMPLATE' => $template['TEMPLATE'],
					];
				}
			}
			if (!$callDesktopAppFound)
			{
				$arFields['TEMPLATE'][] = $arCallTemplateForDesktop;
			}
			if (!$callAppFound)
			{
				$arFields['TEMPLATE'][] = $arCallTemplate;
			}
			if (!$callExtranetAppFound)
			{
				$arFields['TEMPLATE'][] = $arCallExtranetTemplate;
			}
			if (!$conferenceFound)
			{
				$arFields['TEMPLATE'][] = $conferenceTemplate;
			}

			$obSite = new \CSite;
			$arFields['LID'] = $defaultSiteId;
			$obSite->Update($defaultSiteId, $arFields);
		}
	}

	public function doUninstall()
	{
		global $APPLICATION;

		$step = (int)($_REQUEST['step'] ?? 1);
		$saveData = ($_REQUEST['savedata'] ?? 'N') == 'Y';
		if ($step < 2)
		{
			$APPLICATION->includeAdminFile(
				Loc::getMessage('CALL_UNINSTALL_TITLE'),
				$_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/call/install/unstep1.php'
			);
		}
		elseif ($step == 2)
		{
			$this->unInstallDB($saveData);
			$this->unInstallFiles();

			$APPLICATION->includeAdminFile(
				Loc::getMessage('CALL_UNINSTALL_TITLE'),
				$_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/call/install/unstep2.php'
			);
		}
	}

	public function unInstallDB(bool $saveData = true)
	{
		global $APPLICATION, $DB;

		if (\Bitrix\Main\Loader::includeModule('call'))
		{
			if (\Bitrix\Call\Settings::isNewCallsEnabled())
			{
				\Bitrix\Call\JwtCall::unregisterPortal();
			}

			if (\Bitrix\Main\Loader::includeModule('imbot'))
			{
				\Bitrix\Call\Integration\Im\CallFollowupBot::unRegister();
			}
		}

		$connection = \Bitrix\Main\Application::getConnection();
		$errors = [];
		if (!$saveData)
		{
			$APPLICATION->resetException();
			$errors = $DB->RunSQLBatch($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/call/install/db/' . $connection->getType() . '/uninstall.sql');
		}

		if (!empty($errors))
		{
			$APPLICATION->throwException(implode('', $errors));
			return false;
		}

		$this->unInstallEventHandlers();
		$this->unInstallAgents();

		\CAdminNotify::DeleteByTag('call_registration');/** @see \Bitrix\Call\NotifyService::ADMIN_NOTIFICATION_TAG */

		\Bitrix\Main\ModuleManager::unRegisterModule('call');

		return true;
	}

	/**
	 * Uninstall files.
	 */
	public function uninstallFiles()
	{
		$dir = new \Bitrix\Main\IO\File($_SERVER['DOCUMENT_ROOT'].'/bitrix/js/call');
		if (is_link($dir->getPath()))
		{
			$dir->delete();
		}
		else
		{
			\DeleteDirFilesEx('/bitrix/js/call/');
		}
		$dir = new \Bitrix\Main\IO\File($_SERVER['DOCUMENT_ROOT'].'/bitrix/images/call');
		if (is_link($dir->getPath()))
		{
			$dir->delete();
		}
		else
		{
			\DeleteDirFilesEx('/bitrix/images/call/');
		}
	}

	public function installEventHandlers(): void
	{
		$eventManager = \Bitrix\Main\EventManager::getInstance();
		foreach (self::EVENTS as $module => $events)
		{
			foreach ($events as $eventCode => $handlers)
			{
				foreach ($handlers as $callback)
				{
					[$class, $method] = $callback;
					$eventManager->registerEventHandler($module, $eventCode, 'call', $class, $method);
				}
			}
		}
	}

	public function unInstallEventHandlers(): void
	{
		$connection = \Bitrix\Main\Application::getConnection();
		$eventManager = \Bitrix\Main\EventManager::getInstance();
		$res = $connection->query("SELECT * FROM b_module_to_module WHERE FROM_MODULE_ID='call' OR TO_MODULE_ID='call'");
		while ($row = $res->fetch())
		{
			$eventManager->unRegisterEventHandler(
				$row['FROM_MODULE_ID'],
				$row['MESSAGE_ID'],
				$row['TO_MODULE_ID'],
				$row['TO_CLASS'],
				$row['TO_METHOD']
			);
		}
	}

	public function installAgents(): void
	{
		/** @see \Bitrix\Call\Integration\AI\CallAIService::finishTasks */
		\CAgent::AddAgent(
			'Bitrix\Call\Integration\AI\CallAIService::finishTasks();',
			'call',
			'N',
			86400,
			'',
			'Y',
			\ConvertTimeStamp(time()+\CTimeZone::GetOffset() + rand(4320, 86400), 'FULL')
		);

		/** @see \Bitrix\Call\Recent::finishOldCallsAgent */
		\CAgent::AddAgent(
			'Bitrix\Call\Recent::finishOldCallsAgent();',
			'call',
			'N',
			3600,
			'',
			'Y',
			\ConvertTimeStamp(time()+\CTimeZone::GetOffset() + rand(4320, 86400), 'FULL')
		);

		/** @see \Bitrix\Call\JwtCall::registerPortalAgent */
		\CAgent::AddAgent(
			'Bitrix\Call\JwtCall::registerPortalAgent();',
			'call',
			'N',
			300,
			'',
			'Y',
			\ConvertTimeStamp(time()+\CTimeZone::GetOffset() + rand(100, 500), 'FULL')
		);

		/** @see \Bitrix\Call\Conference::removeTemporaryAliases */
		\CAgent::AddAgent(
			'Bitrix\Call\Conference::removeTemporaryAliases();',
			'call',
			"N",
			86400
		);

		/** @see \Bitrix\Call\Integration\Im\CallFollowupBot::delayRegister */
		\CAgent::AddAgent(
			'Bitrix\Call\Integration\Im\CallFollowupBot::delayRegister();',
			'call',
			'N',
			100,
			'',
			'Y',
			\ConvertTimeStamp(time() + \CTimeZone::GetOffset() + \rand(600, 900), 'FULL')
		);
	}

	public function unInstallAgents(): void
	{
		\CAgent::RemoveModuleAgents('call');
	}
}
