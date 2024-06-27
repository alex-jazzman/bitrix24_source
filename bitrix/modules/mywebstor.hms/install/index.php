<?

use Bitrix\Crm\Relation;
use Bitrix\Crm\RelationIdentifier;
use Bitrix\Crm\Service\Container;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\SystemException;
use Bitrix\Main\UrlRewriter;

Loc::loadMessages(__FILE__);

class mywebstor_hms extends CModule {
    public $MODULE_ID = "mywebstor.hms";
    public $errors = '';
    static $events = array(
        array(
            "FROM_MODULE" => "perfmon",
            "FROM_EVENT" => "OnGetTableSchema",
            "TO_CLASS" => "MyWebstorHmsEvents",
            "TO_FUNCTION" => "PerfmonOnGetTableSchema",
            "VERSION" => "1"
        ),
        array(
            "FROM_MODULE" => "crm",
            "FROM_EVENT" => "TypeOnBeforeDelete",
            "TO_CLASS" => "MyWebstorHmsEvents",
            "TO_FUNCTION" => "addDynamicDeleteCheck",
            "VERSION" => "1"
        ),
        array(
            "FROM_MODULE" => "main",
            "FROM_EVENT" => "OnEpilog",
            "TO_CLASS" => "MyWebstorHmsEvents",
            "TO_FUNCTION" => "addAnchors",
            "VERSION" => "1"
        ),
        array(
            "FROM_MODULE" => "crm",
            "FROM_EVENT" => "onEntityDetailsTabsInitialized",
            "TO_CLASS" => "MyWebstorHmsEvents",
            "TO_FUNCTION" => "addEntityDetailsTabs",
            "VERSION" => "2"
        ),
        array(
            "FROM_MODULE" => "documentgenerator",
            "FROM_EVENT" => "onGetDataProviderList",
            "TO_CLASS" => "MyWebstorHmsEvents",
            "TO_FUNCTION" => "getDataProviders",
            "VERSION" => "2"
        )
    );

    public static function getFields() {
        return array(
            array(
                "ENTITY_ID" => \CCrmContact::USER_FIELD_ENTITY_ID,
                "FIELD_NAME" => "UF_CRM_GENDER",
                "USER_TYPE_ID" => "enumeration",
                "CATEGORY_ID" => 0,
                "SORT" => "100",
                "MULTIPLE" => "N",
                "MANDATORY" => "N",
                "SHOW_FILTER" => "N",
                "SHOW_IN_LIST" => "N",
                "LIST_FILTER_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_GENDER"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_GENDER"),
                ),
                "LIST_COLUMN_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_GENDER"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_GENDER"),
                ),
                "EDIT_FORM_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_GENDER"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_GENDER"),
                ),
                "SETTINGS" => array(
                    "DISPLAY" => "UI",
                    "LIST_HEIGHT" => "1",
                    "CAPTION_NO_VALUE" => "",
                ),
                "LIST" => array(
                    "n0" => array(
                        "DEF" => "N",
                        "VALUE" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_GENDER_MALE"),
                        "XML_ID" => "M",
                        "SORT" => "10"
                    ),
                    "n1" => array(
                        "DEF" => "N",
                        "VALUE" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_GENDER_FEMALE"),
                        "XML_ID" => "F",
                        "SORT" => "20"
                    ),
                ),
            ),
            array(
                "ENTITY_ID" => \CCrmContact::USER_FIELD_ENTITY_ID,
                "FIELD_NAME" => "UF_CRM_REPRESENTATIVE",
                "USER_TYPE_ID" => "crm",
                "CATEGORY_ID" => 0,
                "SORT" => "100",
                "MULTIPLE" => "N",
                "MANDATORY" => "N",
                "SHOW_FILTER" => "N",
                "SHOW_IN_LIST" => "N",
                "LIST_FILTER_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_REPRESENTATIVE"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_REPRESENTATIVE"),
                ),
                "LIST_COLUMN_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_REPRESENTATIVE"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_REPRESENTATIVE"),
                ),
                "EDIT_FORM_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_REPRESENTATIVE"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_REPRESENTATIVE"),
                ),
                "SETTINGS" => array(
                    "CONTACT" => "Y",
                ),
            ),
            array(
                "ENTITY_ID" => \CCrmContact::USER_FIELD_ENTITY_ID,
                "FIELD_NAME" => "UF_CRM_SNILS",
                "USER_TYPE_ID" => "string",
                "CATEGORY_ID" => 0,
                "SORT" => "100",
                "MULTIPLE" => "N",
                "MANDATORY" => "N",
                "SHOW_FILTER" => "N",
                "SHOW_IN_LIST" => "N",
                "LIST_FILTER_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_SNILS"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_SNILS"),
                ),
                "LIST_COLUMN_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_SNILS"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_SNILS"),
                ),
                "EDIT_FORM_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_SNILS"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_SNILS"),
                ),
                "SETTINGS" => array(
                    "DEFAULT_VALUE" => "",
                    "ROWS" => "1",
                    "REGEXP" => ""
                ),
            ),
            array(
                "ENTITY_ID" => \CCrmContact::USER_FIELD_ENTITY_ID,
                "FIELD_NAME" => "UF_CRM_INN",
                "USER_TYPE_ID" => "string",
                "CATEGORY_ID" => 0,
                "SORT" => "100",
                "MULTIPLE" => "N",
                "MANDATORY" => "N",
                "SHOW_FILTER" => "N",
                "SHOW_IN_LIST" => "N",
                "LIST_FILTER_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_INN"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_INN"),
                ),
                "LIST_COLUMN_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_INN"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_INN"),
                ),
                "EDIT_FORM_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_INN"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_CONTACT_FIELD_INN"),
                ),
                "SETTINGS" => array(
                    "DEFAULT_VALUE" => "",
                    "ROWS" => "1",
                    "REGEXP" => ""
                ),
            ),
        );
    }

    public function __construct() {
        $this->MODULE_GROUP_RIGHTS = "N";
        $this->MODULE_NAME = Loc::getMessage("HMS_MODULE_NAME");
        $this->MODULE_DESCRIPTION = Loc::getMessage("HMS_MODULE_DESCRIPTION");
        $this->PARTNER_NAME = Loc::getMessage("HMS_PARTNER_NAME");
        $this->PARTNER_URI = Loc::getMessage("HMS_PARTNER_URI");

        $arModuleVersion = array();

        include __DIR__ . "/version.php";

        if (
            is_array($arModuleVersion)
            && array_key_exists("VERSION", $arModuleVersion)
            && array_key_exists("VERSION_DATE", $arModuleVersion)
        ) {
            $this->MODULE_VERSION = $arModuleVersion["VERSION"];
            $this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];
        }
    }

    public function DoInstall() {
        /**
         * @var \CMain $APPLICATION
         * @var \CUser $USER
         * @var \CDatabase $DB
         * @var \CUserTypeManager $USER_FIELD_MANAGER
         */
        global $APPLICATION, $USER, $DB, $USER_FIELD_MANAGER;

        try {
            $this->InstallDB();
            $this->InstallUrlRewrites();
            $this->InstallFiles();
            $this->InstallMenuItem();
            $this->InstallEvents();
            $this->checkIblockDuration();
            $this->checkDynamicAgreement();
            $this->InstallFields();

            \Bitrix\Main\ModuleManager::registerModule($this->MODULE_ID);

            if ($this->IncludeModule($this->MODULE_ID))
                foreach (array_keys(\MyWebstorHmsHelper::getStatusEntityTypes()) as $entityID) {
                    \CCrmStatus::BulkCreate($entityID, \MyWebstorHmsHelper::getDefaultStatuses($entityID));
                }
        } catch (\Exception $e) {
            $APPLICATION->ThrowException($e->getMessage());
            return false;
        }

        return true;
    }

    public function DoUninstall() {
        /**
         * @var \CMain $APPLICATION
         * @var \CUser $USER
         * @var \CDatabase $DB
         * @var null|string|int $step
         */
        global $APPLICATION, $USER, $DB, $step;
        $step = intval($step);

        if ($step < 2) {
            $APPLICATION->IncludeAdminFile(Loc::getMessage("HMS_UNINSTALL_TITLE", array("#MODULE_NAME#" => $this->MODULE_NAME)), __DIR__ . "/unstep1.php");
        } elseif ($step == 2) {
            try {
                if (!array_key_exists('savedata', $_REQUEST) || $_REQUEST['savedata'] != 'Y')
                    $this->UnInstallDB();

                $integrationModule = $this->MODULE_ID . "_integration";
                if (
                    \Bitrix\Main\ModuleManager::isModuleInstalled($integrationModule)
                    && ($moduleObject = \CModule::CreateModuleObject($integrationModule))
                ) $moduleObject->DoUninstall();

                $this->UnInstallFiles();
                $this->UnInstallMenuItem();
                $this->UnInstallEvents();

                \Bitrix\Main\ModuleManager::unRegisterModule($this->MODULE_ID);
            } catch (\Exception $e) {
                $APPLICATION->ThrowException($e->getMessage());
                return false;
            }

            return true;
        }
    }

    public function InstallDB() {
        /** @var \CMain $APPLICATION */
        /** @var \CDatabase $DB */
        global $DB, $APPLICATION;
        $this->errors = $DB->RunSQLBatch(__DIR__ . '/db/install.sql');
        if (is_array($this->errors)) {
            throw new \Exception(implode("<br />", $this->errors));
            return false;
        }

        if (!unserialize(Option::get($this->MODULE_ID, "hms_rights", serialize(array()))))
            Option::set($this->MODULE_ID, "hms_rights", serialize(array("AU")));

        return true;
    }

    public function UnInstallDB() {
        /** @var \CMain $APPLICATION */
        /** @var \CDatabase $DB */
        global $DB, $APPLICATION;
        $this->errors = $DB->RunSQLBatch(__DIR__ . '/db/uninstall.sql');
        if (is_array($this->errors)) {
            throw new \Exception(implode('<br />', $this->errors));
            return false;
        }

        if ($this->IncludeModule($this->MODULE_ID))
            foreach (array_keys(\MyWebstorHmsHelper::getStatusEntityTypes()) as $entityID) {
                $CCrmStatus = new \CCrmStatus($entityID);
                $CCrmStatus->DeleteAll();
            }

        \CUserOptions::DeleteOptionsByName($this->MODULE_ID, "reception_filters");

        return true;
    }

    public function InstallEvents() {
        $eventManager = \Bitrix\Main\EventManager::getInstance();
        foreach (static::$events as $event)
            switch ($event["VERSION"]) {
                case "2":
                    $eventManager->registerEventHandler($event["FROM_MODULE"], $event["FROM_EVENT"], $this->MODULE_ID, $event["TO_CLASS"], $event["TO_FUNCTION"]);
                    break;
                case "1":
                default:
                    $eventManager->registerEventHandlerCompatible($event["FROM_MODULE"], $event["FROM_EVENT"], $this->MODULE_ID, $event["TO_CLASS"], $event["TO_FUNCTION"]);
                    break;
            }

        return true;
    }

    public function checkIblockDuration() {
        if (!\Bitrix\Main\Loader::includeModule("crm")) return;

        $iblockID = \CCrmCatalog::EnsureDefaultExists();
        $CIBlockProperty = new \CIBlockProperty;
        $iblockProperty = $CIBlockProperty::GetByID("HMS_DURATION", $iblockID)->Fetch();
        if (
            $iblockProperty
            && $iblockProperty["ID"] > 0
        ) return;

        $iblockPropertyFields = array(
            "IBLOCK_ID" => $iblockID,
            "NAME" => Loc::getMessage("HMS_IBLOCK_PROPERTY_HMS_DURATION_NAME"),
            "ACTIVE" => "Y",
            "SORT" => "500",
            "CODE" => "HMS_DURATION",
            "DEFAULT_VALUE" => "",
            "PROPERTY_TYPE" => "N",
            "ROW_COUNT" => "1",
            "COL_COUNT" => "30",
            "LIST_TYPE" => "L",
            "MULTIPLE" => "N",
            "XML_ID" => NULL,
            "FILE_TYPE" => "",
            "MULTIPLE_CNT" => "5",
            "TMP_ID" => NULL,
            "LINK_IBLOCK_ID" => "0",
            "WITH_DESCRIPTION" => "N",
            "SEARCHABLE" => "N",
            "FILTRABLE" => "N",
            "IS_REQUIRED" => "N",
            "VERSION" => "1",
            "USER_TYPE" => NULL,
            "USER_TYPE_SETTINGS" => NULL,
            "HINT" => "",
        );
        $CIBlockProperty->Add($iblockPropertyFields);
    }

    public function UnInstallEvents() {
        $eventManager = \Bitrix\Main\EventManager::getInstance();
        foreach (static::$events as $event)
            $eventManager->unRegisterEventHandler($event["FROM_MODULE"], $event["FROM_EVENT"], $this->MODULE_ID, $event["TO_CLASS"], $event["TO_FUNCTION"]);

        return true;
    }

    public function InstallUrlRewrites() {
        $urlRewrites = array(
            array(
                "CONDITION" => "#^/hms/#",
                "RULE" => "",
                "ID" => "mywebstor:hms",
                "PATH" => "/hms/index.php"
            )
        );

        foreach ($urlRewrites as $urlRewrite)
            UrlRewriter::add(\CSite::getDefSite() ?: "s1", $urlRewrite);
    }

    public function InstallFiles() {
        CopyDirFiles(__DIR__ . "/components", \Bitrix\Main\Application::getDocumentRoot() . "/bitrix/components/", true, true);
        CopyDirFiles(__DIR__ . "/js", \Bitrix\Main\Application::getDocumentRoot() . "/bitrix/js/", true, true);
        CopyDirFiles(__DIR__ . "/public/hms",  \Bitrix\Main\Application::getDocumentRoot() . "/hms/", true, true);
        return true;
    }

    public function UnInstallFiles() {
        $directoryObject = new \Bitrix\Main\IO\Directory(__DIR__ . "/components/mywebstor");
        foreach ($directoryObject->getChildren() as $componentDirectory) {
            if (!($componentDirectory instanceof \Bitrix\Main\IO\Directory)) continue;

            \Bitrix\Main\IO\Directory::deleteDirectory(
                \Bitrix\Main\Application::getDocumentRoot() . "/bitrix/components/mywebstor/" . $componentDirectory->getName()
            );
        }

        $directoryObject = new \Bitrix\Main\IO\Directory(__DIR__ . "/js/mywebstor/hms");
        foreach ($directoryObject->getChildren() as $componentDirectory) {
            if (!($componentDirectory instanceof \Bitrix\Main\IO\Directory)) continue;

            \Bitrix\Main\IO\Directory::deleteDirectory(
                \Bitrix\Main\Application::getDocumentRoot() . "/bitrix/js/mywebstor/hms/" . $componentDirectory->getName()
            );
        }

        \Bitrix\Main\IO\Directory::deleteDirectory(\Bitrix\Main\Application::getDocumentRoot() . "/hms/");
        return true;
    }

    public function InstallMenuItem() {
        if (
            !\Bitrix\Main\ModuleManager::isModuleInstalled("fileman")
            || !\Bitrix\Main\Loader::includeModule("fileman")
        ) throw new SystemException("Module \"fileman\" not found");

        $leftMenuFile = "/.top.menu.php";
        $leftMenu = \CFileMan::GetMenuArray(\Bitrix\Main\Application::getDocumentRoot() . $leftMenuFile);

        $leftMenuItems = $leftMenu["aMenuLinks"];
        $leftMenuTemplate = $leftMenu["sMenuTemplate"];

        if (!count(array_values(array_filter(
            $leftMenuItems,
            function ($item) {
                return $item["1"] == "/hms/";
            }
        )))) {
            $leftMenuItems[] = array(
                Loc::getMessage("HMS_MENU_NAME"),
                "/hms/",
                array(),
                array(
                    "menu_item_id" => "hms"
                ),
                ""
            );

            \CFileMan::SaveMenu(array(\CSite::getDefSite() ?: "s1", $leftMenuFile), $leftMenuItems, $leftMenuTemplate);
        }
    }

    public function UnInstallMenuItem() {
        if (
            !\Bitrix\Main\ModuleManager::isModuleInstalled("fileman")
            || !\Bitrix\Main\Loader::includeModule("fileman")
        ) throw new SystemException("Module \"fileman\" not found");

        $leftMenuFile = "/.top.menu.php";
        $leftMenu = \CFileMan::GetMenuArray(\Bitrix\Main\Application::getDocumentRoot() . $leftMenuFile);

        $leftMenuItems = $leftMenu["aMenuLinks"];
        $leftMenuTemplate = $leftMenu["sMenuTemplate"];

        $hmsMenuItemIndex = current(array_keys(array_filter(
            $leftMenuItems,
            function ($item) {
                return $item["1"] == "/hms/";
            }
        )));

        if (is_numeric($hmsMenuItemIndex)) {
            array_splice($leftMenuItems, $hmsMenuItemIndex, 1);

            \CFileMan::SaveMenu(array(\CSite::getDefSite() ?: "s1", $leftMenuFile), $leftMenuItems, $leftMenuTemplate);
        }
    }

    public function InstallFields() {
        /**
         * @var \CMain $APPLICATION
         * @var \CUser $USER
         * @var \CDatabase $DB
         * @var \CUserTypeManager $USER_FIELD_MANAGER
         */
        global $APPLICATION, $USER, $DB, $USER_FIELD_MANAGER;
        if (!Loader::includeModule("crm")) return;

        foreach (static::getFields() as $field) {
            $entityID = $field["ENTITY_ID"];
            $fieldName = $field["FIELD_NAME"];

            $isExists = (bool)(\CUserTypeEntity::GetList(array(), array(
                "ENTITY_ID" => $entityID,
                "FIELD_NAME" => $fieldName,
            ))->Fetch());

            if ($isExists) continue;

            (new \CCrmFields(
                $USER_FIELD_MANAGER,
                $entityID
            ))->AddField($field);
        }
    }

    public function checkDynamicAgreement() {
        /**
         * @var \CMain $APPLICATION
         * @var \CUser $USER
         * @var \CDatabase $DB
         * @var \CUserTypeManager $USER_FIELD_MANAGER
         */
        global $APPLICATION, $USER, $DB, $USER_FIELD_MANAGER;

        if (!\Bitrix\Main\Loader::includeModule("crm"))
            throw new SystemException("Module \"crm\" not found");

        $container = Container::getInstance();
        $dynamicTypeClass = $container->getDynamicTypeDataClass();
        $dynamicTypeCode = "HMS_AGREEMENT";

        $dynamicTypeObject = $dynamicTypeClass::getList(array(
            "filter" => array(
                "CODE" => $dynamicTypeCode
            )
        ))->fetchObject();
        if (isset($dynamicTypeObject)) return;

        $fields = array(
            "CODE" => $dynamicTypeCode,
            "TITLE" => Loc::getMessage("HMS_AGREEMENT_DYNAMIC_TITLE"),
            "NAME" => "HMS_AGREEMENT",
            "IS_CATEGORIES_ENABLED" => "N",
            "IS_STAGES_ENABLED" => "N",
            "IS_BEGIN_CLOSE_DATES_ENABLED" => "Y",
            "IS_CLIENT_ENABLED" => "Y",
            "IS_USE_IN_USERFIELD_ENABLED" => "N",
            "IS_LINK_WITH_PRODUCTS_ENABLED" => "N",
            "IS_CRM_TRACKING_ENABLED" => "N",
            "IS_MYCOMPANY_ENABLED" => "N",
            "IS_DOCUMENTS_ENABLED" => "Y",
            "IS_SOURCE_ENABLED" => "N",
            "IS_OBSERVERS_ENABLED" => "N",
            "IS_RECYCLEBIN_ENABLED" => "N",
            "IS_AUTOMATION_ENABLED" => "Y",
            "IS_BIZ_PROC_ENABLED" => "Y",
            "IS_SET_OPEN_PERMISSIONS" => "N",
            "IS_PAYMENTS_ENABLED" => "N",
            "IS_COUNTERS_ENABLED" => "N"
        );
        $entityTypeID = $dynamicTypeClass::getNextAvailableEntityTypeId();
        if (!$entityTypeID)
            throw new SystemException("Dynamic type limit exceeded");

        $dynamicTypeObject = $dynamicTypeClass::createObject();
        $dynamicTypeObject->set("ENTITY_TYPE_ID", $entityTypeID);

        foreach ($fields as $fieldName => $fieldValue)
            if ($dynamicTypeObject->sysGetEntity()->hasField($fieldName))
                $dynamicTypeObject->set($fieldName, $fieldValue);

        $dynamicSaveResult = $dynamicTypeObject->save();
        if (!$dynamicSaveResult->isSuccess())
            throw new SystemException(join(";" . PHP_EOL, $dynamicSaveResult->getErrorMessages()));

        $dynamicTypeID = $dynamicTypeObject->getId();

        $userFields = array(
            array(
                "ENTITY_ID" => "CRM_" . $dynamicTypeID,
                "FIELD_NAME" => "UF_CRM_" . $dynamicTypeID . "_NUMBER",
                "USER_TYPE_ID" => "string",
                "XML_ID" => "HMS_AGREEMENT_FIELD_NUMBER",
                "SORT" => 500,
                "MULTIPLE" => "N",
                "MANDATORY" => "N",
                "SHOW_FILTER" => "N",
                "SHOW_IN_LIST" => "",
                "EDIT_IN_LIST" => "",
                "IS_SEARCHABLE" => "N",
                "EDIT_FORM_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_FIELD_NUMBER_LABEL"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_FIELD_NUMBER_LABEL", null, "en"),
                ),
                "LIST_COLUMN_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_FIELD_NUMBER_LABEL"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_FIELD_NUMBER_LABEL", null, "en"),
                ),
                "LIST_FILTER_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_FIELD_NUMBER_LABEL"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_FIELD_NUMBER_LABEL", null, "en"),
                ),
                "SETTINGS" => array(
                    "DEFAULT_VALUE" => "",
                    "ROWS" => 1
                )
            ),
            array(
                "ENTITY_ID" => "CRM_" . $dynamicTypeID,
                "FIELD_NAME" => "UF_CRM_" . $dynamicTypeID . "_TYPE",
                "USER_TYPE_ID" => "enumeration",
                "XML_ID" => "HMS_AGREEMENT_FIELD_TYPE",
                "SORT" => 500,
                "MULTIPLE" => "N",
                "MANDATORY" => "N",
                "SHOW_FILTER" => "N",
                "SHOW_IN_LIST" => "",
                "EDIT_IN_LIST" => "",
                "IS_SEARCHABLE" => "N",
                "EDIT_FORM_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_FIELD_TYPE_LABEL"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_FIELD_TYPE_LABEL", null, "en"),
                ),
                "LIST_COLUMN_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_FIELD_TYPE_LABEL"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_FIELD_TYPE_LABEL", null, "en"),
                ),
                "LIST_FILTER_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_FIELD_TYPE_LABEL"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_FIELD_TYPE_LABEL", null, "en"),
                ),
                "SETTINGS" => array(
                    "DISPLAY" => "LIST",
                    "LIST_HEIGHT" => 5,
                    "CAPTION_NO_VALUE" => ""
                ),
            ),
            array(
                "ENTITY_ID" => "CRM_" . $dynamicTypeID,
                "FIELD_NAME" => "UF_CRM_" . $dynamicTypeID . "_FORM",
                "USER_TYPE_ID" => "enumeration",
                "XML_ID" => "HMS_AGREEMENT_FIELD_FORM",
                "SORT" => 500,
                "MULTIPLE" => "N",
                "MANDATORY" => "N",
                "SHOW_FILTER" => "N",
                "SHOW_IN_LIST" => "",
                "EDIT_IN_LIST" => "",
                "IS_SEARCHABLE" => "N",
                "EDIT_FORM_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_FIELD_FORM_LABEL"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_FIELD_FORM_LABEL", null, "en"),
                ),
                "LIST_COLUMN_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_FIELD_FORM_LABEL"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_FIELD_FORM_LABEL", null, "en"),
                ),
                "LIST_FILTER_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_FIELD_FORM_LABEL"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_FIELD_FORM_LABEL", null, "en"),
                ),
                "SETTINGS" => array(
                    "DISPLAY" => "LIST",
                    "LIST_HEIGHT" => 5,
                    "CAPTION_NO_VALUE" => ""
                ),
            ),
            array(
                "ENTITY_ID" => "CRM_" . $dynamicTypeID,
                "FIELD_NAME" => "UF_CRM_" . $dynamicTypeID . "_ACTIVE",
                "USER_TYPE_ID" => "boolean",
                "XML_ID" => "HMS_AGREEMENT_FIELD_ACTIVE",
                "SORT" => 500,
                "MULTIPLE" => "N",
                "MANDATORY" => "N",
                "SHOW_FILTER" => "N",
                "SHOW_IN_LIST" => "",
                "EDIT_IN_LIST" => "",
                "IS_SEARCHABLE" => "N",
                "EDIT_FORM_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_FIELD_ACTIVE_LABEL"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_FIELD_ACTIVE_LABEL", null, "en"),
                ),
                "LIST_COLUMN_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_FIELD_ACTIVE_LABEL"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_FIELD_ACTIVE_LABEL", null, "en"),
                ),
                "LIST_FILTER_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_FIELD_ACTIVE_LABEL"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_FIELD_ACTIVE_LABEL", null, "en"),
                ),
                "SETTINGS" => array(
                    "LABEL" => array(
                        Loc::getMessage("HMS_AGREEMENT_FIELD_ACTIVE_NO_LABEL"),
                        Loc::getMessage("HMS_AGREEMENT_FIELD_ACTIVE_YES_LABEL")
                    ),
                    "DEFAULT_VALUE" => 1,
                    "DISPLAY" => "CHECKBOX"
                ),
            ),
            array(
                "ENTITY_ID" => "CRM_" . $dynamicTypeID,
                "FIELD_NAME" => "UF_CRM_" . $dynamicTypeID . "_FILES",
                "USER_TYPE_ID" => "file",
                "XML_ID" => "HMS_AGREEMENT_FIELD_FILES",
                "SORT" => 500,
                "MULTIPLE" => "Y",
                "MANDATORY" => "N",
                "SHOW_FILTER" => "N",
                "SHOW_IN_LIST" => "",
                "EDIT_IN_LIST" => "",
                "IS_SEARCHABLE" => "N",
                "EDIT_FORM_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_FIELD_FILES_LABEL"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_FIELD_FILES_LABEL", null, "en"),
                ),
                "LIST_COLUMN_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_FIELD_FILES_LABEL"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_FIELD_FILES_LABEL", null, "en"),
                ),
                "LIST_FILTER_LABEL" => array(
                    "ru" => Loc::getMessage("HMS_AGREEMENT_FIELD_FILES_LABEL"),
                    "en" => Loc::getMessage("HMS_AGREEMENT_FIELD_FILES_LABEL", null, "en"),
                ),
                "SETTINGS" => array(
                    "SIZE" => 0,
                    "LIST_WIDTH" => 0,
                    "LIST_HEIGHT" => 0,
                    "MAX_SHOW_SIZE" => 0,
                    "MAX_ALLOWED_SIZE" => 0,
                    "EXTENSIONS" => "",
                    "TARGET_BLANK" => "Y",
                ),
            ),
        );

        $userTypeEntity = new \CUserTypeEntity();
        foreach ($userFields as $userField)
            if ($userTypeEntity->Add($userField) === false)
                throw new SystemException($APPLICATION->GetException());
    }
}
