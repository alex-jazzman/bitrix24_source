<?
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;
use Bitrix\Main\Config\Option;
use Bitrix\Main\EventManager;
use Bitrix\Main\Application;
use Bitrix\Main\IO\Directory;

class CAW_microservice_activity extends CModule
{
    const REQUIRE_PHP_VERSION = '7.1';

    var $MODULE_ID  = "CAW.microservice.activity";
    var $MODULE_VERSION;
    var $MODULE_VERSION_DATE;
    var $MODULE_NAME;
    var $MODULE_DESCRIPTION;
    var $MODULE_CSS;
    var $MODULE_GROUP_RIGHTS = 'Y';
    var $PARTNER_NAME;
    var $PARTNER_URI;

    //сообщим системе больше информации, о нашем модуле, указав основные свойства
    public function __construct()
    {
        $arModuleVersion = array();
        $path = str_replace("\\", '/', __FILE__);
        Loc::loadLanguageFile($path);
        $path = substr($path, 0, strlen($path) - strlen('/index.php'));
        include($path . '/version.php');
            $this->MODULE_VERSION = $arModuleVersion['VERSION'];
            $this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
            $this->PARTNER_NAME = GetMessage('MAIN_COMPANY_NAME');
            $this->PARTNER_URI = GetMessage('MAIN_COMPANY_URI');
            $this->MODULE_NAME = GetMessage('MAIN_INSTALL_NAME');
            $this->MODULE_DESCRIPTION = GetMessage('MAIN_INSTALL_DESCRIPTION');
    }

    public function DoInstall()
    {
        global $APPLICATION;

            if (PHP_VERSION >= self::REQUIRE_PHP_VERSION) {
                    $this->InstallActivity();
                    $this->InstallComponents();
                    
                    RegisterModule("CAW.microservice.activity");
                    $APPLICATION->IncludeAdminFile(Loc::getMessage('MAIN_INST_INST_TITLE'),
                        $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/CAW.microservice.activity/install/step.php');
        
            } else {

                CAdminMessage::ShowOldStyleError(Loc::getMessage('MAIN_INST_REQUEUE_VERSION_PHP',
                    array('#VERSION#' => self::REQUIRE_PHP_VERSION)));
            }
    }
        //переместить мой кастомный активити в директорию битрикса
    public function InstallActivity()
    {
        return CopyDirFiles(
        $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/' . GetModuleID(__FILE__) . '/install/activity',
        $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/activities/custom',
        true,
        true
        );
    }

    public function InstallComponents()
    {
        CopyDirFiles(
            $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/' . GetModuleID(__FILE__) . "/install/admin",
            $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . "/admin",
            true,
            true
        );
        CopyDirFiles(
            $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/' . GetModuleID(__FILE__) . '/install/components',
            $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/components/mywebstor',
            true,
            true
        );
        return CopyDirFiles(
        $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/' . GetModuleID(__FILE__) . '/install/initComponents',
        $_SERVER['DOCUMENT_ROOT'],
        true,
        true
        );
    }

    public function DoUninstall()
    {
        $this->UnInstallActivity();
        $this->UnInstallComponents();
        $GLOBALS['errors'] = $this->errors;
        UnRegisterModule("CAW.microservice.activity");
        $GLOBALS['APPLICATION']->IncludeAdminFile(Loc::getMessage('MAIN_INST_UNINST_TITLE'),
        $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/CAW.microservice.activity/install/unstep.php');
            
    }
            //удалить мой кастомный активити из директории битрикса
    public function UnInstallActivity()
    {
        if (DeleteDirFilesEx(BX_ROOT . '/activities/custom/informationwithaddition')) {
             return true;
        } else {
            return false;
        }
    
    }

    public function UnInstallComponents()
    {
        if (DeleteDirFilesEx(BX_ROOT . '/components/mywebstor/caw.chang_status_activity') && DeleteDirFilesEx('/CAW') && DeleteDirFilesEx('/admin/CAWSettings.php')) {
             return true;
        } else {
            return false;
        }
    
    }
}