<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

Loc::loadMessages(__FILE__);

if (class_exists('crm'))
{
	return;
}

class crm extends CModule
{
	var $MODULE_ID = 'crm';
	var $MODULE_VERSION;
	var $MODULE_VERSION_DATE;
	var $MODULE_NAME;
	var $MODULE_DESCRIPTION;
	var $MODULE_CSS;
	var $MODULE_GROUP_RIGHTS = 'Y';
	var $errors = '';

	function __construct()
	{
		$arModuleVersion = [];

		include(__DIR__ . '/version.php');

		if (is_array($arModuleVersion) && array_key_exists('VERSION', $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion['VERSION'];
			$this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
		}

		$this->MODULE_NAME = Loc::getMessage('CRM_INSTALL_NAME');
		$this->MODULE_DESCRIPTION = Loc::getMessage('CRM_INSTALL_DESCRIPTION');
	}

	public static function installUserFields($moduleId = 'all')
	{
		global $APPLICATION;
		global $USER_FIELD_MANAGER;

		$USER_FIELD_MANAGER->CleanCache();

		$errors = null;

		AddEventHandler("main", "OnUserTypeBuildList", ["CUserTypeCrm", "GetUserTypeDescription"]);
		require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/lib/userfield/types/elementtype.php');
		require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/crm/classes/general/crm_usertypecrm.php");

		$arMess = self::__GetMessagesForAllLang(__FILE__, ['CRM_UF_NAME', 'CRM_UF_NAME_CAL', 'CRM_UF_NAME_LF_TYPE', 'CRM_UF_NAME_LF_ID']);

		if ('all' == $moduleId)
		{
			// add CRM userfield for CTask
			$rsUserType = CUserTypeEntity::GetList(
				[],
				[
					'ENTITY_ID' => 'TASKS_TASK',
					'FIELD_NAME' => 'UF_CRM_TASK',
				]
			);
			if (!$rsUserType->Fetch())
			{
				$arFields = [];
				$arFields['ENTITY_ID'] = 'TASKS_TASK';
				$arFields['FIELD_NAME'] = 'UF_CRM_TASK';
				$arFields['USER_TYPE_ID'] = 'crm';
				$arFields['SETTINGS']['LEAD'] = 'Y';
				$arFields['SETTINGS']['CONTACT'] = 'Y';
				$arFields['SETTINGS']['COMPANY'] = 'Y';
				$arFields['SETTINGS']['DEAL'] = 'Y';
				$arFields['SETTINGS']['ORDER'] = 'Y';
				$arFields['MULTIPLE'] = 'Y';

				if (!empty($arMess['CRM_UF_NAME']))
				{
					$arFields['EDIT_FORM_LABEL'] = $arMess['CRM_UF_NAME'];
					$arFields['LIST_COLUMN_LABEL'] = $arMess['CRM_UF_NAME'];
					$arFields['LIST_FILTER_LABEL'] = $arMess['CRM_UF_NAME'];
				}

				$CAllUserTypeEntity = new CUserTypeEntity();
				$intID = $CAllUserTypeEntity->Add($arFields, false);
				if (!$intID)
				{
					if ($strEx = $APPLICATION->GetException())
					{
						$errors[] = $strEx->GetString();
					}
				}
			}

			// add CRM userfield for CUser
			$rsUserType = CUserTypeEntity::GetList(
				[],
				[
					'ENTITY_ID' => 'USER',
					'FIELD_NAME' => 'UF_USER_CRM_ENTITY',
				]
			);
			if (!$rsUserType->Fetch())
			{
				$arFields = [];
				$arFields['ENTITY_ID'] = 'USER';
				$arFields['FIELD_NAME'] = 'UF_USER_CRM_ENTITY';
				$arFields['USER_TYPE_ID'] = 'crm';
				$arFields['SETTINGS']['LEAD'] = 'Y';
				$arFields['SETTINGS']['CONTACT'] = 'Y';
				$arFields['SETTINGS']['COMPANY'] = 'Y';
				$arFields['MULTIPLE'] = 'N';

				if (!empty($arMess['CRM_UF_NAME']))
				{
					$arFields['EDIT_FORM_LABEL'] = $arMess['CRM_UF_NAME'];
					$arFields['LIST_COLUMN_LABEL'] = $arMess['CRM_UF_NAME'];
					$arFields['LIST_FILTER_LABEL'] = $arMess['CRM_UF_NAME'];
				}

				$CAllUserTypeEntity = new CUserTypeEntity();
				$intID = $CAllUserTypeEntity->Add($arFields, false);
				if (!$intID)
				{
					if ($strEx = $APPLICATION->GetException())
					{
						$errors[] = $strEx->GetString();
					}
				}
			}

			// add CRM userfield for CTaskTemplates
			$rsUserType = CUserTypeEntity::GetList(
				[],
				[
					'ENTITY_ID' => 'TASKS_TASK_TEMPLATE',
					'FIELD_NAME' => 'UF_CRM_TASK',
				]
			);
			if (!$rsUserType->Fetch())
			{
				$arFields = [];
				$arFields['ENTITY_ID'] = 'TASKS_TASK_TEMPLATE';
				$arFields['FIELD_NAME'] = 'UF_CRM_TASK';
				$arFields['USER_TYPE_ID'] = 'crm';
				$arFields['SETTINGS']['LEAD'] = 'Y';
				$arFields['SETTINGS']['CONTACT'] = 'Y';
				$arFields['SETTINGS']['COMPANY'] = 'Y';
				$arFields['SETTINGS']['DEAL'] = 'Y';
				$arFields['SETTINGS']['ORDER'] = 'Y';
				$arFields['MULTIPLE'] = 'Y';

				if (!empty($arMess['CRM_UF_NAME']))
				{
					$arFields['EDIT_FORM_LABEL'] = $arMess['CRM_UF_NAME'];
					$arFields['LIST_COLUMN_LABEL'] = $arMess['CRM_UF_NAME'];
					$arFields['LIST_FILTER_LABEL'] = $arMess['CRM_UF_NAME'];
				}

				$CAllUserTypeEntity = new CUserTypeEntity();
				$intID = $CAllUserTypeEntity->Add($arFields, false);
				if (!$intID)
				{
					if ($strEx = $APPLICATION->GetException())
					{
						$errors[] = $strEx->GetString();
					}
				}
			}

			$rsUserType = CUserTypeEntity::GetList(
				[],
				[
					'ENTITY_ID' => 'CALENDAR_EVENT',
					'FIELD_NAME' => 'UF_CRM_CAL_EVENT',
				]
			);
			if (!$rsUserType->Fetch())
			{
				$arFields = [];
				$arFields['ENTITY_ID'] = 'CALENDAR_EVENT';
				$arFields['FIELD_NAME'] = 'UF_CRM_CAL_EVENT';
				$arFields['USER_TYPE_ID'] = 'crm';
				$arFields['SETTINGS']['LEAD'] = 'Y';
				$arFields['SETTINGS']['CONTACT'] = 'Y';
				$arFields['SETTINGS']['COMPANY'] = 'Y';
				$arFields['SETTINGS']['DEAL'] = 'Y';
				$arFields['MULTIPLE'] = 'Y';

				if (!empty($arMess['CRM_UF_NAME_CAL']))
				{
					$arFields['EDIT_FORM_LABEL'] = $arMess['CRM_UF_NAME_CAL'];
					$arFields['LIST_COLUMN_LABEL'] = $arMess['CRM_UF_NAME_CAL'];
					$arFields['LIST_FILTER_LABEL'] = $arMess['CRM_UF_NAME_CAL'];
				}

				$CAllUserTypeEntity = new CUserTypeEntity();
				$intID = $CAllUserTypeEntity->Add($arFields, false);
				if (!$intID)
				{
					if ($strEx = $APPLICATION->GetException())
					{
						$errors[] = $strEx->GetString();
					}
				}
			}
		}

		if (in_array($moduleId, ['all', 'disk']) && isModuleInstalled('disk'))
		{
			$rsUserType = CUserTypeEntity::GetList(
				[],
				[
					'ENTITY_ID' => 'CRM_TIMELINE',
					'FIELD_NAME' => 'UF_CRM_COMMENT_FILES',
				]
			);
			if (!$rsUserType->Fetch())
			{
				$CAllUserTypeEntity = new CUserTypeEntity();
				$intID = $CAllUserTypeEntity->Add([
					'ENTITY_ID' => 'CRM_TIMELINE',
					'FIELD_NAME' => 'UF_CRM_COMMENT_FILES',
					'USER_TYPE_ID' => 'disk_file',
					'XML_ID' => 'CRM_COMMENT_FILES',
					'MULTIPLE' => 'Y',
					'MANDATORY' => null,
					'SHOW_FILTER' => 'N',
					'SHOW_IN_LIST' => null,
					'EDIT_IN_LIST' => null,
					'IS_SEARCHABLE' => null,
					'SETTINGS' => [
						'IBLOCK_TYPE_ID' => '0',
						'IBLOCK_ID' => '',
						'UF_TO_SAVE_ALLOW_EDIT' => '',
					],
					'EDIT_FORM_LABEL' => [
						'en' => 'Load files',
						'ru' => 'Load files',
						'de' => 'Load files',
					],
				]);
				if (!$intID)
				{
					if ($strEx = $APPLICATION->GetException())
					{
						$errors[] = $strEx->GetString();
					}
				}
			}

			$rsUserType = CUserTypeEntity::getList(
				[],
				[
					'ENTITY_ID' => 'CRM_MAIL_TEMPLATE',
					'FIELD_NAME' => 'UF_ATTACHMENT',
				]
			);
			if (!$rsUserType->fetch())
			{
				$CAllUserTypeEntity = new CUserTypeEntity();
				$intID = $CAllUserTypeEntity->add([
					'ENTITY_ID' => 'CRM_MAIL_TEMPLATE',
					'FIELD_NAME' => 'UF_ATTACHMENT',
					'USER_TYPE_ID' => 'disk_file',
					'XML_ID' => '',
					'SORT' => 100,
					'MULTIPLE' => 'Y',
					'MANDATORY' => 'N',
					'SHOW_FILTER' => 'N',
					'SHOW_IN_LIST' => 'N',
					'EDIT_IN_LIST' => 'N',
					'IS_SEARCHABLE' => 'N',
				]);
				if (!$intID)
				{
					if ($strEx = $APPLICATION->getException())
					{
						$errors[] = $strEx->getString();
					}
				}
			}
		}

		if (in_array($moduleId, ['all', 'mail']) && isModuleInstalled('mail'))
		{
			$rsUserType = CUserTypeEntity::getList(
				[],
				[
					'ENTITY_ID' => 'CRM_ACTIVITY',
					'FIELD_NAME' => 'UF_MAIL_MESSAGE',
				]
			);
			if (!$rsUserType->fetch())
			{
				$CAllUserTypeEntity = new CUserTypeEntity();
				$intID = $CAllUserTypeEntity->add([
					'ENTITY_ID' => 'CRM_ACTIVITY',
					'FIELD_NAME' => 'UF_MAIL_MESSAGE',
					'USER_TYPE_ID' => 'mail_message',
					'XML_ID' => '',
					'SORT' => 100,
					'MULTIPLE' => 'N',
					'MANDATORY' => 'N',
					'SHOW_FILTER' => 'N',
					'SHOW_IN_LIST' => 'N',
					'EDIT_IN_LIST' => 'N',
					'IS_SEARCHABLE' => 'N',
				]);
				if (!$intID)
				{
					if ($strEx = $APPLICATION->getException())
					{
						$errors[] = $strEx->getString();
					}
				}
			}
		}

		return $errors;
	}

	function InstallDB()
	{
		global $DB, $APPLICATION;
		$this->errors = false;

		RegisterModule('crm');
		\Bitrix\Main\Loader::includeModule('crm');

		$isFreshInstall = !$DB->TableExists('b_crm_lead');

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
			$GLOBALS['errors'] = $this->errors;
			$APPLICATION->ThrowException(implode(' ', $this->errors));

			return false;
		}

		if ($isFreshInstall)
		{
			COption::SetOptionString('crm', '~crm_install_time', time());

			CCrmStatus::InstallDefault('STATUS');
			CCrmStatus::InstallDefault('SOURCE');
			CCrmStatus::InstallDefault('CONTACT_TYPE');
			CCrmStatus::InstallDefault('COMPANY_TYPE');
			CCrmStatus::InstallDefault('EMPLOYEES');
			CCrmStatus::InstallDefault('CALL_LIST');

			// Create default industry  list
			$CCrmStatus = new CCrmStatus('INDUSTRY');
			$arAdd = [
				[
					'NAME' => Loc::getMessage('CRM_INDUSTRY_IT'),
					'STATUS_ID' => 'IT',
					'SORT' => 10,
					'SYSTEM' => 'N',
				],
				[
					'NAME' => Loc::getMessage('CRM_INDUSTRY_TELECOM'),
					'STATUS_ID' => 'TELECOM',
					'SORT' => 20,
					'SYSTEM' => 'N',
				],
				[
					'NAME' => Loc::getMessage('CRM_INDUSTRY_MANUFACTURING'),
					'STATUS_ID' => 'MANUFACTURING',
					'SORT' => 30,
					'SYSTEM' => 'N',
				],
				[
					'NAME' => Loc::getMessage('CRM_INDUSTRY_BANKING'),
					'STATUS_ID' => 'BANKING',
					'SORT' => 40,
					'SYSTEM' => 'N',
				],
				[
					'NAME' => Loc::getMessage('CRM_INDUSTRY_CONSULTING'),
					'STATUS_ID' => 'CONSULTING',
					'SORT' => 50,
					'SYSTEM' => 'N',
				],
				[
					'NAME' => Loc::getMessage('CRM_INDUSTRY_FINANCE'),
					'STATUS_ID' => 'FINANCE',
					'SORT' => 60,
					'SYSTEM' => 'N',
				],
				[
					'NAME' => Loc::getMessage('CRM_INDUSTRY_GOVERNMENT'),
					'STATUS_ID' => 'GOVERNMENT',
					'SORT' => 70,
					'SYSTEM' => 'N',
				],
				[
					'NAME' => Loc::getMessage('CRM_INDUSTRY_DELIVERY'),
					'STATUS_ID' => 'DELIVERY',
					'SORT' => 80,
					'SYSTEM' => 'N',
				],
				[
					'NAME' => Loc::getMessage('CRM_INDUSTRY_ENTERTAINMENT'),
					'STATUS_ID' => 'ENTERTAINMENT',
					'SORT' => 90,
					'SYSTEM' => 'N',
				],
				[
					'NAME' => Loc::getMessage('CRM_INDUSTRY_NOTPROFIT'),
					'STATUS_ID' => 'NOTPROFIT',
					'SORT' => 100,
					'SYSTEM' => 'N',
				],
				[
					'NAME' => Loc::getMessage('CRM_INDUSTRY_OTHER'),
					'STATUS_ID' => 'OTHER',
					'SORT' => 110,
					'SYSTEM' => 'Y',
				],
			];
			foreach ($arAdd as $ar)
				$CCrmStatus->Add($ar);

			// Create default deal type list
			$CCrmStatus = new CCrmStatus('DEAL_TYPE');
			$arAdd = [
				[
					'NAME' => Loc::getMessage('CRM_DEAL_TYPE_SALE'),
					'STATUS_ID' => 'SALE',
					'SORT' => 10,
					'SYSTEM' => 'Y',
				],
				[
					'NAME' => Loc::getMessage('CRM_DEAL_TYPE_COMPLEX'),
					'STATUS_ID' => 'COMPLEX',
					'SORT' => 20,
					'SYSTEM' => 'N',
				],
				[
					'NAME' => Loc::getMessage('CRM_DEAL_TYPE_GOODS'),
					'STATUS_ID' => 'GOODS',
					'SORT' => 30,
					'SYSTEM' => 'N',
				],
				[
					'NAME' => Loc::getMessage('CRM_DEAL_TYPE_SERVICES'),
					'STATUS_ID' => 'SERVICES',
					'SORT' => 40,
					'SYSTEM' => 'N',
				],
				[
					'NAME' => Loc::getMessage('CRM_DEAL_TYPE_SERVICE'),
					'STATUS_ID' => 'SERVICE',
					'SORT' => 50,
					'SYSTEM' => 'N',
				],
			];
			foreach ($arAdd as $ar)
				$CCrmStatus->Add($ar);

			CCrmStatus::InstallDefault('DEAL_STAGE');

			// Create default deal state list
			$CCrmStatus = new CCrmStatus('DEAL_STATE');
			$arAdd = [
				[
					'NAME' => Loc::getMessage('CRM_DEAL_STATE_PLANNED'),
					'STATUS_ID' => 'PLANNED',
					'SORT' => 10,
					'SYSTEM' => 'N',
				],
				[
					'NAME' => Loc::getMessage('CRM_DEAL_STATE_PROCESS'),
					'STATUS_ID' => 'PROCESS',
					'SORT' => 20,
					'SYSTEM' => 'Y',
				],
				[
					'NAME' => Loc::getMessage('CRM_DEAL_STATE_COMPLETE'),
					'STATUS_ID' => 'COMPLETE',
					'SORT' => 30,
					'SYSTEM' => 'Y',
				],
				[
					'NAME' => Loc::getMessage('CRM_DEAL_STATE_CANCELED'),
					'STATUS_ID' => 'CANCELED',
					'SORT' => 40,
					'SYSTEM' => 'Y',
				],
			];
			foreach ($arAdd as $ar)
				$CCrmStatus->Add($ar);

			// Create default event type
			$CCrmStatus = new CCrmStatus('EVENT_TYPE');
			$arAdd = [
				[
					'NAME' => Loc::getMessage('CRM_EVENT_TYPE_INFO'),
					'STATUS_ID' => 'INFO',
					'SORT' => 10,
					'SYSTEM' => 'Y',
				],
				[
					'NAME' => Loc::getMessage('CRM_EVENT_TYPE_PHONE'),
					'STATUS_ID' => 'PHONE',
					'SORT' => 20,
					'SYSTEM' => 'Y',
				],
				[
					'NAME' => Loc::getMessage('CRM_EVENT_TYPE_MESSAGE'),
					'STATUS_ID' => 'MESSAGE',
					'SORT' => 30,
					'SYSTEM' => 'Y',
				],
			];
			foreach ($arAdd as $ar)
				$CCrmStatus->Add($ar);

			CCrmStatus::InstallDefault('QUOTE_STATUS');
			CCrmStatus::InstallDefault('INVOICE_STATUS');

			\Bitrix\Crm\Honorific::installDefault();

			if (!$this->isDistrInstallation())
			{
				\Bitrix\Crm\Security\Role\RolePreset::installDefaultRoles();
			}

			(new \Bitrix\Crm\Copilot\CallAssessment\FillPreliminaryCallAssessments())->execute();
		}

		\Bitrix\Crm\Model\ItemCategoryTable::installBundledCategoriesIfNotExists();

		$this->InstallUserFields();

		//region BUSINESS TYPES
		$arResult = $DB->Query("SELECT COUNT(*) AS QTY FROM b_crm_biz_type")->Fetch();
		$qty = (is_array($arResult) && isset($arResult["QTY"])) ? intval($arResult["QTY"]) : 0;
		if ($qty === 0)
		{
			$allLangIDs = [];
			$langEntity = new CLanguage();
			$dbLangs = $langEntity->GetList();
			while ($lang = $dbLangs->Fetch())
			{
				if (isset($lang['LID']))
				{
					$allLangIDs[] = $lang['LID'];
				}
			}

			foreach ($allLangIDs as $langID)
			{
				$langFile = $_SERVER["DOCUMENT_ROOT"] . '/bitrix/modules/crm/lang/' . $langID . "/lib/businesstype.php";
				if (!file_exists($langFile))
				{
					continue;
				}

				//include($langFile);
				$messages = __IncludeLang($langFile, true);
				$s = isset($messages["CRM_BIZ_TYPE_DEFAULT"]) ? trim($messages["CRM_BIZ_TYPE_DEFAULT"]) : "";
				if ($s === ' ' || $s === '-')
				{
					continue;
				}

				foreach (explode('|', $s) as $slug)
				{
					$ary = explode(';', $slug);
					if (count($ary) < 2)
					{
						continue;
					}

					$code = $DB->ForSql($ary[0]);
					if (is_array($DB->Query("SELECT 'X' from b_crm_biz_type where CODE = '{$code}'")->Fetch()))
					{
						continue;
					}

					$name = $DB->ForSql($ary[1]);
					$lang = isset($ary[2]) ? $DB->ForSql($ary[2]) : '';
					$DB->Query("INSERT INTO b_crm_biz_type(CODE, NAME, LANG) VALUES('{$code}', '{$name}', '{$lang}')");
				}
			}
		}
		//endregion

		\Bitrix\Main\Config\Option::set('crm', 'enable_slider', 'Y');
		\Bitrix\Main\Config\Option::set('crm', 'enable_order_deal_create', 'Y');

		\Bitrix\Crm\Settings\Crm::setLiveFeedRecordsGenerationEnabled(false);
		\Bitrix\Crm\Settings\LiveFeedSettings::getCurrent()->enableLiveFeedMerge(false);
		\Bitrix\Crm\Integration\Socialnetwork\Livefeed\AvailabilityHelper::setAvailable(false);

		\Bitrix\Crm\Settings\ActivitySettings::setValue(
			\Bitrix\Crm\Settings\ActivitySettings::ENABLE_CALENDAR_EVENTS_SETTINGS,
			false,
		);

		\Bitrix\Main\Config\Option::set('crm', 'repeat_sale_segment_initialization', 'Y');
		(new \Bitrix\Crm\Copilot\CallAssessment\FillPreliminaryCallAssessments())->execute();

		\Bitrix\Crm\EntityRequisite::installDefaultPresets();

		// Adjust default address zone
		\Bitrix\Crm\EntityAddress::getZoneId();

		\Bitrix\Crm\Attribute\Entity\FieldAttributeTable::add([
			'ENTITY_TYPE_ID' => CCrmOwnerType::Contact,
			'ENTITY_SCOPE' => '',
			'TYPE_ID' => \Bitrix\Crm\Attribute\FieldAttributeType::REQUIRED,
			'FIELD_NAME' => 'NAME',
			'CREATED_TIME' => new \Bitrix\Main\Type\DateTime(),
			'START_PHASE' => '',
			'FINISH_PHASE' => '',
			'PHASE_GROUP_TYPE_ID' => \Bitrix\Crm\Attribute\FieldAttributePhaseGroupType::ALL,
			'IS_CUSTOM_FIELD' => false,
		]);
		\Bitrix\Crm\Attribute\Entity\FieldAttributeTable::add([
			'ENTITY_TYPE_ID' => CCrmOwnerType::Company,
			'ENTITY_SCOPE' => '',
			'TYPE_ID' => \Bitrix\Crm\Attribute\FieldAttributeType::REQUIRED,
			'FIELD_NAME' => 'TITLE',
			'CREATED_TIME' => new \Bitrix\Main\Type\DateTime(),
			'START_PHASE' => '',
			'FINISH_PHASE' => '',
			'PHASE_GROUP_TYPE_ID' => \Bitrix\Crm\Attribute\FieldAttributePhaseGroupType::ALL,
			'IS_CUSTOM_FIELD' => false,
		]);

		$existedSequenceRecord = $DB->Query("select SEQUENCE_NAME from b_crm_sequences where SEQUENCE_NAME='dynamic_type_id'")->Fetch();
		if (!$existedSequenceRecord)
		{
			$DB->Query("insert into b_crm_sequences (SEQUENCE_NAME, SEQUENCE_VALUE) VALUES ('dynamic_type_id', 1030);");
		}

		if (\Bitrix\Main\Loader::includeModule('intranet'))
		{
			CIntranetUtils::clearMenuCache();
		}

		if (is_array($this->errors))
		{
			$GLOBALS['errors'] = $this->errors;
			$APPLICATION->ThrowException(implode(' ', $this->errors));

			return false;
		}

		return true;
	}

	function UnInstallDB($arParams = [])
	{
		global $DB, $APPLICATION, $CACHE_MANAGER, $stackCacheManager, $USER_FIELD_MANAGER;
		$connection = \Bitrix\Main\Application::getConnection();
		$this->errors = false;

		$dropTables = !array_key_exists('savedata', $arParams) || $arParams['savedata'] != 'Y';

		// register types factories before deleting events.
		\Bitrix\Main\UserField\Internal\Registry::getInstance();

		if ($dropTables)
		{
			// delete extra fields for all entities
			$arEntityIds = CCrmFields::GetEntityTypes();
			foreach ($arEntityIds as $entityId => $ar)
			{
				$CCrmFields = new CCrmFields($USER_FIELD_MANAGER, $entityId);
				$arFields = $CCrmFields->GetFields();
				foreach ($arFields as $arField)
				{
					$CCrmFields->DeleteField($arField['ID']);
				}
			}

			$userFieldEntity = new CUserTypeEntity;
			$userField = CUserTypeEntity::getList(
				[],
				[
					'ENTITY_ID' => 'CRM_ACTIVITY',
					'FIELD_NAME' => 'UF_MAIL_MESSAGE',
				]
			)->fetch();
			if ($userField)
			{
				$userFieldEntity->delete($userField['ID']);
			}

			$typeFactory = \Bitrix\Main\DI\ServiceLocator::getInstance()->get('crm.type.factory');
			$types = \Bitrix\Crm\Model\Dynamic\TypeTable::getList()->fetchCollection();
			$tableNamesToDelete = [];
			foreach ($types as $type)
			{
				$factory = \Bitrix\Crm\Service\Container::getInstance()->getFactory($type->getEntityTypeId());
				if ($factory)
				{
					$connection = \Bitrix\Main\Application::getConnection();
					foreach($factory->getUserFields() as $userField)
					{
						try
						{
							$userFieldEntity->delete($userField['ID']);
						}
						catch(\Bitrix\Main\DB\SqlQueryException)
						{
							// do nothing
						}
					}
				}

				$tableNamesToDelete[] = $type->getTableName();
				$tableNamesToDelete[] = $typeFactory->getItemIndexDataClass($type)::getTableName();
				$tableNamesToDelete[] = $typeFactory->getItemFieldsContextDataClass($type)::getTableName();
				$tableNamesToDelete[] = \Bitrix\Crm\Security\AccessAttribute\Manager::getEntity(CCrmOwnerType::ResolveName($type->getEntityTypeId()))->getDBTableName();
			}

			foreach ($tableNamesToDelete as $tableName)
			{
				if ($connection->isTableExists($tableName))
				{
					$connection->dropTable($tableName);
				}
			}

			\Bitrix\Crm\Service\Container::getInstance()->getDynamicTypesMap()->invalidateTypesCollectionCache();

			if (CModule::IncludeModule('socialnetwork'))
			{
				$dbRes = CSocNetLog::GetList(
					[],
					["ENTITY_TYPE" => CCrmLiveFeedEntity::GetAll()],
					false,
					false,
					["ID"]
				);

				if ($dbRes)
				{
					while ($arRes = $dbRes->Fetch())
					{
						CSocNetLog::Delete($arRes["ID"]);
					}
				}
			}

			$DB->Query("DELETE FROM b_user_counter WHERE CODE LIKE 'crm_%'");
			$CACHE_MANAGER->CleanDir("user_counter");

			COption::RemoveOption('crm');
		}

		$stackCacheManager->Clear('b_crm_status');
		$stackCacheManager->Clear('b_crm_perms');

		if (CModule::IncludeModule('search'))
		{
			CSearch::DeleteIndex('crm');
		}

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
		}

		UnRegisterModule('crm');

		if (is_array($this->errors))
		{
			$APPLICATION->ThrowException(implode('<br />', $this->errors));

			return false;
		}

		return true;
	}

	function InstallEvents()
	{
		global $DB;

		$res = $DB->query("SELECT COUNT(*) CNT FROM b_event_type WHERE EVENT_NAME IN ('CRM_EMAIL_CONFIRM')")->fetch();
		if ($res['CNT'] > 0)
		{
			return true;
		}

		$langs = CLanguage::getList('', '');
		while ($lang = $langs->fetch())
		{
			$lid = $lang['LID'];
			includeModuleLangFile(__FILE__, $lid);

			$eventTypes = [
				[
					'LID' => $lid,
					'EVENT_NAME' => 'CRM_EMAIL_CONFIRM',
					'NAME' => Loc::getMessage('CRM_EMAIL_CONFIRM_TYPE_NAME'),
					'DESCRIPTION' => Loc::getMessage('CRM_EMAIL_CONFIRM_TYPE_DESC'),
					'SORT' => 1,
				],
			];

			$type = new CEventType;
			foreach ($eventTypes as $item)
				$type->add($item);

			$sitesIds = [];
			$sites = CSite::getList('', '', ['LANGUAGE_ID' => $lid]);
			while ($item = $sites->fetch())
				$sitesIds[] = $item['LID'];

			if (count($sitesIds) > 0)
			{
				$eventMessages = [
					[
						'ACTIVE' => 'Y',
						'EVENT_NAME' => 'CRM_EMAIL_CONFIRM',
						'LID' => $sitesIds,
						'EMAIL_FROM' => '#DEFAULT_EMAIL_FROM#',
						'EMAIL_TO' => '#EMAIL#',
						'SUBJECT' => Loc::getMessage('CRM_EMAIL_CONFIRM_EVENT_NAME'),
						'MESSAGE' => Loc::getMessage('CRM_EMAIL_CONFIRM_EVENT_DESC'),
						'BODY_TYPE' => 'html',
						'SITE_TEMPLATE_ID' => 'mail_join',
					],
				];

				$message = new CEventMessage;
				foreach ($eventMessages as $item)
					$message->add($item);
			}
		}

		return true;
	}

	function UnInstallEvents()
	{
		global $DB;

		$DB->query("DELETE FROM b_event_type WHERE EVENT_NAME in ('CRM_EMAIL_CONFIRM')");
		$DB->query("DELETE FROM b_event_message WHERE EVENT_NAME in ('CRM_EMAIL_CONFIRM')");

		return true;
	}

	function InstallFiles($arParams = [])
	{
		CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/install/components', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/components', true, true);
		CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/install/gadgets', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/gadgets', true, true);
		CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/install/js', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/js', true, true);
		CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/install/admin', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/admin', true, true);
		CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/install/tools/', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/tools', true, true);
		CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/install/activities/', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/activities', true, true);
		CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/install/themes/', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/themes', true, true);
		CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/install/services/', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/services', true, true);
		CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/install/images', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/images', true, true);

		//[COPY CUSTOMIZED PAY SYSTEM ACTION FILES]-->
		$customPaySystemPath = IsModuleInstalled('sale') ? COption::GetOptionString('sale', 'path2user_ps_files', '') : '';
		if ($customPaySystemPath === '')
		{
			$customPaySystemPath = BX_ROOT . '/php_interface/include/sale_payment/';
		}

		$sort = 'sort';
		$order = 'asc';
		$langEntity = new CLanguage();
		$dbLangs = $langEntity->GetList($sort, $order);
		while ($lang = $dbLangs->Fetch())
		{
			$langSrcPaySystemPath = $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/crm/install/integration/sale.paysystems/' . $lang['LID'] . '/';
			if (!file_exists($langSrcPaySystemPath))
			{
				continue;
			}

			CopyDirFiles(
				$langSrcPaySystemPath,
				$_SERVER['DOCUMENT_ROOT'] . $customPaySystemPath,
				true,
				true
			);
		}
		//<--[COPY CUSTOMIZED PAY SYSTEM ACTION FILES]BX_ROOT

		global $APPLICATION;

		//HACK: bizproc crutch to enable user read only access to service files
		$APPLICATION->SetFileAccessPermission('/bitrix/admin/crm_bizproc_activity_settings.php', ['2' => 'R']);
		$APPLICATION->SetFileAccessPermission('/bitrix/admin/crm_bizproc_selector.php', ['2' => 'R']);
		$APPLICATION->SetFileAccessPermission('/bitrix/admin/crm_bizproc_wf_settings.php', ['2' => 'R']);

		\Bitrix\Crm\Preview\Route::setCrmRoutes();

		return true;
	}

	function UnInstallFiles()
	{
		DeleteDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/install/js', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/js');
		DeleteDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/install/themes', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/themes');
		DeleteDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/install/gadgets', $_SERVER['DOCUMENT_ROOT'] . '/bitrix/gadgets');

		return true;
	}

	function DoInstall()
	{
		global $step;
		$step = intval($step);

		if (!CBXFeatures::IsFeatureEditable('crm'))
		{
			$this->errors = Loc::getMessage('MAIN_FEATURE_ERROR_EDITABLE');
			$this->showInstallStep(3);
		}
		elseif (!IsModuleInstalled('sale'))
		{
			$this->errors = Loc::getMessage('CRM_UNINS_MODULE_SALE');
			$this->showInstallStep(3);
		}
		elseif ($step < 2)
		{
			$this->showInstallStep(1);
		}
		elseif ($step == 2)
		{
			$this->InstallDB();
			$this->InstallFiles();
			CBXFeatures::SetFeatureEnabled('crm');
			$this->showInstallStep(3);
		}
	}

	protected function showInstallStep(int $step)
	{
		global $APPLICATION;

		if ($this->errors !== false)
		{
			$GLOBALS['errors'] = (array)$this->errors;
		}

		$APPLICATION->IncludeAdminFile(
			Loc::getMessage('CRM_INSTALL_TITLE'),
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/install/step' . $step . '.php');
	}

	function DoUninstall()
	{
		global $APPLICATION, $step;
		$step = intval($step);

		if (ModuleManager::isModuleInstalled('crmmobile'))
		{
			$APPLICATION->throwException(Loc::getMessage('CRM_MODULE_UNINSTALL_ERROR_CRMMOBILE'));
		}

		if ($step < 2)
		{
			$APPLICATION->IncludeAdminFile(Loc::getMessage('CRM_UNINSTALL_TITLE'), $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/install/unstep1.php');
		}
		elseif ($step == 2)
		{
			\Bitrix\Main\Loader::includeModule('crm');

			$this->UnInstallDB([
				'savedata' => $_REQUEST['savedata'],
			]);

			$this->UnInstallFiles();
			CBXFeatures::SetFeatureEnabled('crm', false);
			$GLOBALS['errors'] = $this->errors;
			$APPLICATION->IncludeAdminFile(Loc::getMessage('CRM_UNINSTALL_TITLE'), $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/crm/install/unstep2.php');
		}
	}

	private static function __GetMessagesForAllLang($file, $MessID, $strDefMess = false, $arLangList = [])
	{
		$arResult = false;

		if (empty($MessID))
		{
			return $arResult;
		}
		if (!is_array($MessID))
		{
			$MessID = [$MessID];
		}

		if (empty($arLangList))
		{
			$rsLangs = CLanguage::GetList("LID", "ASC", ["ACTIVE" => "Y"]);
			while ($arLang = $rsLangs->Fetch())
			{
				$arLangList[] = $arLang['LID'];
			}
		}
		foreach ($arLangList as $strLID)
		{
			$MESS = Loc::loadLanguageFile($file, $strLID);
			foreach ($MessID as $strMessID)
			{
				if ($strMessID == '')
				{
					continue;
				}
				$arResult[$strMessID][$strLID] = (isset($MESS[$strMessID]) ? $MESS[$strMessID] : $strDefMess);
			}
		}

		return $arResult;
	}

	private function isDistrInstallation(): bool
	{
		return defined('BX_PRODUCT_INSTALLATION') && BX_PRODUCT_INSTALLATION;
	}
}
