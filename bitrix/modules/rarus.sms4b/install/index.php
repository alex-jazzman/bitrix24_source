<?php

use Rarus\Sms4b\Sendings;
use Rarus\Sms4b\Sendings\Transport;
use \Bitrix\Main\IO\File;
use \Bitrix\Main\IO\Directory;

if (class_exists('rarus_sms4b')) {
    return;
}

use \Bitrix\Main\Localization\Loc;

/**
 * Класс установки модуля
 */
class rarus_sms4b extends CModule
{
    /**
     * @const REQUIRE_PHP_VERSION string - минимальная версия PHP, необходимая для установки модуля
     */
    const REQUIRE_PHP_VERSION = '8.1';

    var $MODULE_ID = 'rarus.sms4b';
    var $MODULE_VERSION;
    var $MODULE_VERSION_DATE;
    var $MODULE_NAME;
    var $MODULE_DESCRIPTION;
    var $MODULE_CSS;
    var $MODULE_GROUP_RIGHTS = 'Y';
    var $PARTNER_NAME;

    /**
     * Конструктор
     */
    public function __construct()
    {
        $arModuleVersion = [];
        $path = str_replace("\\", '/', __FILE__);
        Loc::loadLanguageFile($path);
        $path = substr($path, 0, strlen($path) - strlen('/index.php'));
        include($path . '/version.php');

        if (is_array($arModuleVersion) && array_key_exists('VERSION', $arModuleVersion)) {
            $this->MODULE_VERSION = $arModuleVersion['VERSION'];
            $this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
            $this->PARTNER_NAME = GetMessage('SMS4B_MAIN_COMPANY_NAME');
            $this->PARTNER_URI = 'http://rarus-crimea.ru/web/?utm_source=rarus_sms4b&utm_medium=module&utm_campaign=sms4b';
        } else {
            $this->MODULE_VERSION = SMS4B_VERSION;
            $this->MODULE_VERSION_DATE = SMS4B_VERSION_DATE;
        }

        $this->MODULE_NAME = GetMessage('SMS4B_MAIN_INSTALL_NAME');
        $this->MODULE_DESCRIPTION = GetMessage('SMS4B_MAIN_INSTALL_DESCRIPTION');
    }

    public function DoInstall()
    {
        global $APPLICATION, $step;

        $POST_RIGHT = $GLOBALS['APPLICATION']->GetGroupRight($this->MODULE_ID);

        if ($POST_RIGHT === 'W') {
            if (PHP_VERSION >= self::REQUIRE_PHP_VERSION) {
                $step = (int)$step;
                if ($step < 2) {
                    $GLOBALS['APPLICATION']->IncludeAdminFile(Loc::getMessage('SMS4B_MAIN_INST_INST_TITLE'),
                        $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/step1.php');
                } elseif ($step == 2) {
                    $this->InstallDB();
                    $this->InstallEvents();
                    $this->InstallFiles();
                    if (\Bitrix\Main\Loader::includeModule('bizproc')) {
                        $this->InstallActivity();
                    }
                    $this->InstallAgents();
                    $this->deleteUnnecessaryFiles();
                    $APPLICATION->IncludeAdminFile(Loc::getMessage('SMS4B_MAIN_INST_INST_TITLE'),
                        $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/step2.php');
                }
            } else {
                CAdminMessage::ShowOldStyleError(Loc::getMessage('SMS4B_MAIN_INST_REQUEUE_VERSION_PHP',
                    ['#VERSION#' => self::REQUIRE_PHP_VERSION]));
            }
        }
    }

    public function DoUninstall()
    {
        global $step;

        $POST_RIGHT = $GLOBALS['APPLICATION']->GetGroupRight($this->MODULE_ID);
        if ($POST_RIGHT === 'W') {
            $step = (int)$step;
            if ($step < 2) {
                $GLOBALS['APPLICATION']->IncludeAdminFile(Loc::getMessage('SMS4B_MAIN_INST_UNINST_TITLE'),
                    $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/unstep1.php');
            } elseif ($step == 2) {
                $this->UnInstallDB([
                    'save_tables' => $_REQUEST['save_tables']
                ]);
                $this->UnInstallEvents($_REQUEST['save_templates']);
                $this->UnInstallFiles();

                if (\Bitrix\Main\Loader::includeModule('bizproc')) {
                    $this->UnInstallActivity();
                }

                CAgent::RemoveModuleAgents($this->MODULE_ID);

                $GLOBALS['errors'] = $this->errors;

                $GLOBALS['APPLICATION']->IncludeAdminFile(Loc::getMessage('SMS4B_MAIN_INST_UNINST_TITLE'),
                    $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/unstep2.php');
            }
        }
    }

    /**
     * Создание таблиц
     *
     * @param array $arParams - массив параметров
     *
     * @return bool - результат создания таблиц
     */
    public function InstallDB($arParams = [])
    {

        global $DB;
        $this->errors = $DB->RunSQLBatch($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/db/' . strtolower($DB->type) . '/install.sql');

        if ($this->errors !== false) {
            $GLOBALS['APPLICATION']->ThrowException(implode('<br>', $this->errors));
            return false;
        } else {
            RegisterModule($this->MODULE_ID);
            CModule::IncludeModule($this->MODULE_ID);
            return true;
        }
    }

    /**
     * Удаление таблиц
     *
     * @param array $arParams - массив параметров
     *
     * @return bool - результат удаления таблиц
     */
    public function UnInstallDB($arParams = [])
    {
        global $DB;
        $this->errors = false;

        if (!array_key_exists('save_tables', $arParams) || ($arParams['save_tables'] !== 'Y')) {
            //kick current user options
            COption::RemoveOption($this->MODULE_ID, '');
            //drop tables
            $this->errors = $DB->RunSQLBatch($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/db/' . strtolower($DB->type) . '/uninstall.sql');
            //drop files
            $strSql = "SELECT ID FROM b_file WHERE MODULE_ID='" . $this->MODULE_ID . "'";
            $rsFile = $DB->Query($strSql, false, 'File: ' . __FILE__ . '<br>Line: ' . __LINE__);
            while ($arFile = $rsFile->Fetch()) {
                CFile::Delete($arFile['ID']);
            }
        }

        UnRegisterModule($this->MODULE_ID);
        if ($this->errors !== false) {
            $GLOBALS['APPLICATION']->ThrowException(implode('<br>', $this->errors));
            return false;
        }

        return true;
    }

    /**
     * Регистрация обработчиков событий
     *
     * @return bool - результат регистрации обработчиков
     */
    public function InstallEvents()
    {
        RegisterModuleDependences($this->MODULE_ID, 'RejectedPackage', $this->MODULE_ID, Sendings\Service::class, 'processRejectedPackageEvent');
        RegisterModuleDependences($this->MODULE_ID, 'PackageTransferred', $this->MODULE_ID, Sendings\Service::class, 'processPackageTransferredEvent');
        RegisterModuleDependences($this->MODULE_ID, 'NewSending', $this->MODULE_ID, Transport::class, 'processSendingEvent');
        RegisterModuleDependences('main', 'OnBeforeEventAdd', $this->MODULE_ID, 'Csms4b', 'Events');
        RegisterModuleDependences('subscribe', 'BeforePostingSendMail', $this->MODULE_ID, 'Csms4b', 'EventsPosting');
        if (CModule::IncludeModule('sale')) {
            RegisterModuleDependences('main', 'OnAdminListDisplay', $this->MODULE_ID, 'Csms4b',
                'OnAdminListDisplayHandler');
            RegisterModuleDependences('main', 'OnBeforeProlog', $this->MODULE_ID, 'Csms4b', 'OnBeforePrologHandler');
            RegisterModuleDependences('sale', 'OnStatusAdd', $this->MODULE_ID, 'Csms4b',
                'OnStatusAddHandler');
        }
        if (CModule::IncludeModule('tasks')) {
            RegisterModuleDependences('tasks', 'OnTaskAdd', $this->MODULE_ID, 'Csms4b', 'TaskAdded', 10001);
            RegisterModuleDependences('tasks', 'OnTaskUpdate', $this->MODULE_ID, 'Csms4b', 'TaskUpdated', 10001);
            RegisterModuleDependences('tasks', 'OnBeforeTaskDelete', $this->MODULE_ID, 'Csms4b', 'BeforeTaskDeleted',
                10001);
            RegisterModuleDependences('tasks', 'OnAfterCommentAdd', $this->MODULE_ID, 'Csms4b', 'AddNewCommentTask',
                10001,
                false, ['OnAfterCommentAdd', 'new_comment_task']);
        }

        //Регистрируем обработчики для событий модуля CRM
        if (CModule::IncludeModule('crm')) {
            //Обработчик для событий лидов
            RegisterModuleDependences('crm', 'OnAfterCrmLeadAdd', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler', 10001,
                false, ['OnAfterCrmLeadAdd', 'add_lead_crm']);
            RegisterModuleDependences('crm', 'OnAfterCrmLeadUpdate', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                10001,
                false, ['OnAfterCrmLeadUpdate', 'update_lead_crm']);
            RegisterModuleDependences('crm', 'OnBeforeCrmLeadDelete', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                10001, false, ['OnBeforeCrmLeadDelete', 'delete_lead_crm']);


            //Обработчик для событий контактов
            RegisterModuleDependences('crm', 'OnAfterCrmContactAdd', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                10001,
                false, ['OnAfterCrmContactAdd', 'add_contact_crm']);
            RegisterModuleDependences('crm', 'OnAfterCrmContactUpdate', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                10001, false, ['OnAfterCrmContactUpdate', 'update_contact_crm']);
            RegisterModuleDependences('crm', 'OnAfterCrmContactDelete', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                10001, false, ['OnAfterCrmContactDelete', 'remove_contact_crm']);

            //Обработчик для событий сделок
            RegisterModuleDependences('crm', 'OnAfterCrmDealAdd', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler', 10001,
                false, ['OnAfterCrmDealAdd', 'add_deal_crm']);
            RegisterModuleDependences('crm', 'OnAfterCrmDealUpdate', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                10001,
                false, ['OnAfterCrmDealUpdate', 'update_deal_crm']);
            RegisterModuleDependences('crm', 'OnAfterCrmDealDelete', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                10001,
                false, ['OnAfterCrmDealDelete', 'delete_deal_crm']);

            //Обработчик для событий дел
            RegisterModuleDependences('calendar', 'OnRemindEvent', $this->MODULE_ID, 'Csms4b', 'OnRemindEvent', 10001,
                false, ['OnRemindEvent', 'remind_event_crm']);

            //Обработчик событий смены статуса
            RegisterModuleDependences('crm', 'OnBeforeCrmLeadUpdate', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                10001, false, ['OnBeforeCrmLeadUpdate', 'change_stat_lead_crm']);
            RegisterModuleDependences('crm', 'OnBeforeCrmDealUpdate', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                10001, false, ['OnBeforeCrmDealUpdate', 'change_stat_deal_crm']);

        }
        //Регистрируем обработчик для телефонии
        if (CModule::IncludeModule('voximplant')) {
            RegisterModuleDependences('voximplant', 'onCallEnd', $this->MODULE_ID, 'Csms4b', 'AutoAnswering', 100);
        }

        //Регистрируем обработчик для службы сообщений
        if (CModule::IncludeModule('messageservice')) {
            RegisterModuleDependences('messageservice', 'onGetSmsSenders', $this->MODULE_ID, 'Csms4b', 'registerSms4bService', 100);
        }

        //install templates for events
        require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/events.php');
        return true;
    }

    /**
     * Удаление обработчиков событий
     *
     * @param mixed $saveTemplates - флаг удаления шаблонов
     *
     * @return bool - результат удаления обработчиков
     */
    public function UnInstallEvents($saveTemplates = false)
    {
        UnRegisterModuleDependences($this->MODULE_ID, 'RejectedPackage', $this->MODULE_ID, Sendings\Service::class, 'processRejectedPackageEvent');
        UnRegisterModuleDependences($this->MODULE_ID, 'PackageTransferred', $this->MODULE_ID, Sendings\Service::class, 'processPackageTransferredEvent');
        UnRegisterModuleDependences($this->MODULE_ID, 'NewSending', $this->MODULE_ID, Transport::class, 'processSendingEvent');
        UnRegisterModuleDependences('main', 'OnBeforeEventAdd', $this->MODULE_ID, 'Csms4b', 'Events');
        UnRegisterModuleDependences('subscribe', 'BeforePostingSendMail', $this->MODULE_ID, 'Csms4b', 'EventsPosting');

        if (CModule::IncludeModule('sale')) {
            UnRegisterModuleDependences('main', 'OnAdminListDisplay', $this->MODULE_ID, 'Csms4b',
                'OnAdminListDisplayHandler');
            UnRegisterModuleDependences('main', 'OnBeforeProlog', $this->MODULE_ID, 'Csms4b', 'OnBeforePrologHandler');
            UnRegisterModuleDependences('sale', 'OnStatusAdd', $this->MODULE_ID, 'Csms4b',
                'OnStatusAddHandler');
        }
        if (CModule::IncludeModule('tasks')) {
            UnRegisterModuleDependences('tasks', 'OnTaskAdd', $this->MODULE_ID, 'Csms4b', 'TaskAdded');
            UnRegisterModuleDependences('tasks', 'OnTaskUpdate', $this->MODULE_ID, 'Csms4b', 'TaskUpdated');
            UnRegisterModuleDependences('tasks', 'OnBeforeTaskDelete', $this->MODULE_ID, 'Csms4b', 'BeforeTaskDeleted');
            UnRegisterModuleDependences('tasks', 'OnAfterCommentAdd', $this->MODULE_ID, 'Csms4b', 'AddNewCommentTask',
                '',
                ['OnAfterCommentAdd', 'new_comment_task']);
        }

        //Удаляем обработчики для событий модуля CRM
        if (CModule::IncludeModule('crm')) {
            //Обработчик для событий лидов
            UnRegisterModuleDependences('crm', 'OnAfterCrmLeadAdd', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler', '',
                ['OnAfterCrmLeadAdd', 'add_lead_crm']);
            UnRegisterModuleDependences('crm', 'OnAfterCrmLeadUpdate', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                '',
                ['OnAfterCrmLeadUpdate', 'update_lead_crm']);
            UnRegisterModuleDependences('crm', 'OnBeforeCrmLeadDelete', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                '',
                ['OnBeforeCrmLeadDelete', 'delete_lead_crm']);

            //Обработчик для событий контактов
            UnRegisterModuleDependences('crm', 'OnAfterCrmContactAdd', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                '',
                ['OnAfterCrmContactAdd', 'add_contact_crm']);
            UnRegisterModuleDependences('crm', 'OnAfterCrmContactUpdate', $this->MODULE_ID, 'Csms4b',
                'CrmEventsHandler',
                '', ['OnAfterCrmContactUpdate', 'update_contact_crm']);
            UnRegisterModuleDependences('crm', 'OnAfterCrmContactDelete', $this->MODULE_ID, 'Csms4b',
                'CrmEventsHandler',
                '', ['OnAfterCrmContactDelete', 'remove_contact_crm']);

            //Обработчик для событий сделок
            UnRegisterModuleDependences('crm', 'OnAfterCrmDealAdd', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler', '',
                ['OnAfterCrmDealAdd', 'add_deal_crm']);
            UnRegisterModuleDependences('crm', 'OnAfterCrmDealUpdate', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                '',
                ['OnAfterCrmDealUpdate', 'update_deal_crm']);
            UnRegisterModuleDependences('crm', 'OnAfterCrmDealDelete', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                '',
                ['OnAfterCrmDealDelete', 'delete_deal_crm']);

            //Обработчик для событий дел
            UnRegisterModuleDependences('calendar', 'OnRemindEvent', $this->MODULE_ID, 'Csms4b', 'OnRemindEvent', '',
                ['OnRemindEvent', 'remind_event_crm']);

            //Обработчик событий смены статуса
            UnRegisterModuleDependences('crm', 'OnBeforeCrmLeadUpdate', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                '',
                ['OnBeforeCrmLeadUpdate', 'change_stat_lead_crm']);
            UnRegisterModuleDependences('crm', 'OnBeforeCrmDealUpdate', $this->MODULE_ID, 'Csms4b', 'CrmEventsHandler',
                '',
                ['OnBeforeCrmDealUpdate', 'change_stat_deal_crm']);
        }
        if (CModule::IncludeModule('voximplant')) {
            UnRegisterModuleDependences('voximplant', 'onCallEnd', $this->MODULE_ID, 'Csms4b', 'AutoAnswering');
        }

        //Удаление почтовых событий и шаблонов
        if ($saveTemplates !== 'Y') {
            $arRes = CEventType::GetList();
            while ($res = $arRes->Fetch()) {
                if (str_contains($res['EVENT_NAME'], 'SMS4B_')) {
                    CEventType::Delete($res['EVENT_NAME']);
                    $dbEvent = CEventMessage::GetList($b = 'ID', $order = 'ASC',
                        ['EVENT_NAME' => $res['EVENT_NAME']]);
                    while ($arEvent = $dbEvent->Fetch()) {
                        CEventMessage::Delete($arEvent['ID']);
                    }
                }
            }
        }

        return true;
    }

    /**
     * Копирование файлов
     *
     * @param array $arParams - массив параметров
     * @return bool - результат копирования
     */
    public function InstallFiles($arParams = [])
    {
        CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/admin',
            $_SERVER['DOCUMENT_ROOT'] . '/bitrix/admin', true, true);
        CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/images',
            $_SERVER['DOCUMENT_ROOT'] . '/bitrix/images', false, true);
        CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/themes',
            $_SERVER['DOCUMENT_ROOT'] . '/bitrix/themes', false, true);
        CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/js',
            $_SERVER['DOCUMENT_ROOT'] . '/bitrix/js/', false, true);

        if ($_REQUEST['INSTALL_COMPONENTS'] === 'Y') {
            CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/components',
                $_SERVER['DOCUMENT_ROOT'] . '/bitrix/components', false, true);
        }

        if ($_REQUEST['INSTALL_DEMO'] === 'Y') {
            $target = $_SERVER['DOCUMENT_ROOT'] . '/sms4b_demo/';
            CopyDirFiles(
                $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/public',
                $target,
                false,
                true
            );
        }

        if ($_REQUEST['INSTALL_HELP'] === 'Y') {
            CopyDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/help',
                $_SERVER['DOCUMENT_ROOT'] . '/bitrix/help/ru/source/service/rarus.sms4b', false, true);
        }
        return true;
    }

    /**
     * Удаление файлов
     *
     * @return bool - результат удаления
     */
    public function UnInstallFiles()
    {
        //admin files
        DeleteDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/admin',
            $_SERVER['DOCUMENT_ROOT'] . '/bitrix/admin');
        //css
        DeleteDirFiles($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/install/themes/.default',
            $_SERVER['DOCUMENT_ROOT'] . '/bitrix/themes/.default');
        //icons
        DeleteDirFilesEx('/bitrix/themes/.default/icons/rarus.sms4b');
        //images
        DeleteDirFilesEx('/bitrix/images/rarus.sms4b');
        //delete js
        DeleteDirFilesEx('/bitrix/js/rarus.sms4b');
        //COMPONENTS
        if ($_REQUEST['SAVE_COMPONENTS'] !== 'Y') {
            DeleteDirFilesEx('/bitrix/components/rarus.sms4b');
        }
        //delete help
        if ($_REQUEST['SAVE_HELP'] !== 'Y') {
            DeleteDirFilesEx('/bitrix/help/ru/source/service/rarus.sms4b');
        }
        //delete demo public part
        if ($_REQUEST['SAVE_DEMO'] !== 'Y') {
            DeleteDirFilesEx('/sms4b_demo');
        }
        return true;
    }

    /**
     * Удаление не нужных файлов и папок
     *
     * @return bool
     */
    public function deleteUnnecessaryFiles()
    {
        $logFile = $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/log.txt';
        if (File::isFileExists($logFile) && empty(File::getFileContents($logFile))) {
            File::deleteFile($logFile);
        }

        $ideaDirectory = $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/rarus.sms4b/.idea';
        if (Directory::isDirectoryExists($ideaDirectory)) {
            Directory::deleteDirectory($ideaDirectory);
        }

        return true;
    }


    /**
     * Функция добавления activity для БП
     *
     * @return bool - результат добавления
     */
    public function InstallActivity()
    {
        return CopyDirFiles(
            $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/' . GetModuleID(__FILE__) . '/install/activity',
            $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/activities/custom',
            true,
            true
        );
    }

    /**
     * Функция удаления activity для БП
     *
     * @return bool - результат удаления
     */
    public function UnInstallActivity()
    {
        if (DeleteDirFilesEx(BX_ROOT . '/activities/custom/sms4bactivitytouser')
            && DeleteDirFilesEx(BX_ROOT . '/activities/custom/sms4bactivitytophone')
            && DeleteDirFilesEx(BX_ROOT . '/activities/custom/sms4bactivitytocontact')
            && DeleteDirFilesEx(BX_ROOT . '/activities/custom/sms4bactivitytolead')
            && DeleteDirFilesEx(BX_ROOT . '/activities/custom/sms4brobotsenddeferredsms')
            && DeleteDirFilesEx(BX_ROOT . '/activities/custom/sms4brobotsendsms')
        ) {
            return true;
        } else {
            return false;
        }

    }

    public function InstallAgents()
    {
        if (\Bitrix\Main\Loader::includeModule('tasks')) {
            $id = CAgent::AddAgent(
                '\\Rarus\\Sms4b\\Agent::taskDeadline();',
                $this->MODULE_ID,
                'N',
                600,
                '',
                'Y',
                \Bitrix\Main\Type\DateTime::createFromTimestamp(strtotime('+1 minutes'))
            );
            if (!empty($id)) {
                COption::SetOptionString($this->MODULE_ID, 'deadline_agent_id', $id);
            }
        }
        CAgent::AddAgent(
            '\\Rarus\\Sms4b\\Agent::sendSms();',
            $this->MODULE_ID,
            'N',
            300);
        CAgent::AddAgent(
            '\\Rarus\\Sms4b\\Agent::loadStatus();',
            $this->MODULE_ID,
            'N',
            600);
        CAgent::AddAgent(
            '\\Rarus\\Sms4b\\Agent::loadIncoming();',
            $this->MODULE_ID,
            'N',
            900);
        CAgent::AddAgent(
            '\\Rarus\\Sms4b\\Agent::migrationSendingTable(1);',
            $this->MODULE_ID,
            'N',
            300);
        CAgent::AddAgent(
            '\\Rarus\\Sms4b\\Agent::clearSendingQueue();',
            $this->MODULE_ID,
            'N',
            86400);
        CAgent::AddAgent(
            '\\Rarus\\Sms4b\\Agent::smsOnOrdersWithoutPayment();',
            $this->MODULE_ID,
            'N',
            1000);
    }
}
