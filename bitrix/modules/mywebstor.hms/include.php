<?

use Bitrix\Crm\ContactTable;
use Bitrix\Crm\IBlockElementProxyTable;
use Bitrix\Crm\ProductRowTable;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Entity\ExpressionField;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\Entity\StringField;
use Bitrix\Main\Localization\Loc;
use MyWebstor\Hms\AppointmentTable;

/**
 * @var \CMain $APPLICATION
 * @var \CUser $USER
 * @var \CDatabase $DB
 * @var \CUserTypeManager $USER_FIELD_MANAGER
 */
global $APPLICATION, $USER, $DB, $USER_FIELD_MANAGER;

if (!defined("LOG_FILENAME"))
    define("LOG_FILENAME", __DIR__ . "/logs/" . date("Y-m-d") . ".log");

Loc::loadMessages(__FILE__);

//Include Modules
$modules = array(
    "ui",
    "crm",
    "catalog",
    "calendar",
    "documentgenerator",
);

foreach ($modules as $module) {
    if (!\Bitrix\Main\Loader::includeModule($module)) {
        ShowError("Module \"{$module}\" not found.");
        return false;
    }
}

\CModule::AddAutoloadClasses(
    "mywebstor.hms",
    array(
        "MyWebstorHmsEvents" => "classes/general/events.php",
        "MyWebstorHmsHelper" => "classes/general/helper.php"
    )
);

ProductRowTable::getEntity()
    ->addField(
        new ReferenceField(
            'APPOINTMENT_OWNER',
            AppointmentTable::class,
            Join::on('this.OWNER_ID', 'ref.ID')
                ->where('this.OWNER_TYPE', 'HMS')
        )
    );

IBlockElementProxyTable::getEntity()
    ->addField(
        new StringField("XML_ID")
    );

ContactTable::getEntity()
    ->addField(
        new ExpressionField(
            "INITIALS",
            'CONCAT_WS(
                " ", 
                IF(LENGTH(%s), %s, NULL), 
                IF(LENGTH(%s), CONCAT(UPPER(LEFT(%s, 1)), "."), NULL), 
                IF(LENGTH(%s), CONCAT(UPPER(LEFT(%s, 1)), "."), NULL)
            )',
            array(
                'LAST_NAME',
                'LAST_NAME',
                'NAME',
                'NAME',
                'SECOND_NAME',
                'SECOND_NAME',
            )
        )
    );
?><? ?>