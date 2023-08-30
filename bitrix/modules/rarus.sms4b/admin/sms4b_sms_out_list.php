<?php
require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php');

use \Bitrix\Main\Localization\Loc;
use Bitrix\Main\Application;
use Rarus\Sms4b\Tables\SendingsTable;
use Rarus\Sms4b\Sendings\Messages\Status;

Loc::loadLanguageFile(__FILE__);

if (!CModule::IncludeModule('rarus.sms4b')) {
    $error = Loc::getMessage('SMS4B_MAIN_CHECK_MODULE_OPT');
} else {
    if ($GLOBALS['APPLICATION']->GetGroupRight('rarus.sms4b') < 'R') {
        $error = Loc::getMessage('SMS4B_MAIN_CHECK_MODULE_OPT');
    }
}

if (!empty($error)) {
    require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php');

    $GLOBALS['APPLICATION']->SetTitle(Loc::getMessage('SMS4B_MAIN_SMS4B_TITLE'));
    echo '<tr><td colspan="2">' . CAdminMessage::ShowMessage($error) . '</td></tr>';
    return;
}

$sTableID = 'tbl_sms_list_outgoing';
$oSort = new CAdminSorting($sTableID, SendingsTable::DATE_START_FOR_USER, 'desc');
$lAdmin = new CAdminList($sTableID, $oSort);
$requestData = Application::getInstance()->getContext()->getRequest();
/**
 * Возвращает результат фильтрации (успешно\нет)
 *
 * @return bool - результат фильтрации (успешно\нет)
 */
function checkFilter(): bool
{
    global $filterArr, $lAdmin;
    foreach ($filterArr as $f) {
        global $f;
    }

    return count($lAdmin->arFilterErrors) === 0;
}

$filterArr = [
    'find_id',
    'find_GUID',
    'find_SenderName',
    'find_Destination',
    'find_StartSend_from',
    'find_StartSend_to',
    'find_LastModified_from',
    'find_LastModified_to',
    'find_DateActual_from',
    'find_DateActual_to',
    'find_TextMessage',
    'find_Status',
    'find_Entity_Id',
    'find_Source_Id',
    'find_Events'
];

$lAdmin->InitFilter($filterArr);

$arFilter = ['*'];

if (checkFilter() && $requestData->getQuery('del_filter') !== 'Y') {
    $arFilter = [
        SendingsTable::MESSAGE_ID                 => $find_id,
        SendingsTable::GUID                       => $find_GUID,
        SendingsTable::SENDER                     => $find_SenderName,
        SendingsTable::DESTINATION                => $find_Destination,
        '>=' . SendingsTable::DATE_START_FOR_USER => $find_StartSend_from,
        '<=' . SendingsTable::DATE_START_FOR_USER => $find_StartSend_to,
        '>=' . SendingsTable::LAST_MODIFIED       => $find_LastModified_from,
        '<=' . SendingsTable::LAST_MODIFIED       => $find_LastModified_to,
        '>=' . SendingsTable::DATE_ACTUAL         => $find_DateActual_from,
        '<=' . SendingsTable::DATE_ACTUAL         => $find_DateActual_to,
        SendingsTable::TEXT                       => $find_TextMessage,
        SendingsTable::STATUS                     => $find_Status,
        SendingsTable::ENTITY_ID                  => $find_Entity_Id,
        SendingsTable::SOURCE_ID                  => $find_Source_Id,
        SendingsTable::MAIL_EVENT                 => $find_Events
    ];

    //хак, orm не умеет искать string в int поле => выдает все результаты сразу
    foreach ($arFilter as $key => $val) {
        if (($key === 'ENTITY_ID'
                || $key === 'STATUS'
                || $key === 'ID'
                || $key === 'SOURCE_ID')
            && !is_numeric($val)
            && $val !== null
        ) {
            $arFilter[$key] = [];
        } else {
            if ($val === null || $val === '') {
                unset($arFilter[$key]);
            }
        }
    }
}


$lAdmin->AddHeaders([
        ['id' => SendingsTable::ID, 'content' => 'ID', 'sort' => SendingsTable::ID, 'default' => false],
        [
            'id'      => SendingsTable::GUID,
            'content' => Loc::getMessage('SMS4B_MAIN_SMS_GUID'),
            'sort'    => SendingsTable::GUID,
            'default' => false
        ],
        [
            'id'      => SendingsTable::SENDER,
            'content' => Loc::getMessage('SMS4B_MAIN_SMS_SENDERNAME'),
            'sort'    => SendingsTable::SENDER,
            'default' => true
        ],
        [
            'id'      => SendingsTable::DESTINATION,
            'content' => Loc::getMessage('SMS4B_MAIN_SMS_DESTINATION'),
            'sort'    => SendingsTable::DESTINATION,
            'align'   => 'right',
            'default' => true
        ],
        [
            'id'      => SendingsTable::DATE_START_FOR_USER,
            'content' => Loc::getMessage('SMS4B_MAIN_SMS_STARTSEND'),
            'sort'    => SendingsTable::DATE_START_FOR_USER,
            'default' => true
        ],
        [
            'id'      => SendingsTable::LAST_MODIFIED,
            'content' => Loc::getMessage('SMS4B_MAIN_SMS_LASTMODIFIED'),
            'sort'    => SendingsTable::LAST_MODIFIED,
            'default' => true
        ],
        [
            'id'      => SendingsTable::DATE_ACTUAL,
            'content' => Loc::getMessage('SMS4B_MAIN_SMS_DATE_ACTUAL'),
            'sort'    => SendingsTable::DATE_ACTUAL,
            'default' => false
        ],
        [
            'id'      => SendingsTable::TEXT,
            'content' => Loc::getMessage('SMS4B_MAIN_SMS_TEXTMESSAGE'),
            'sort'    => SendingsTable::TEXT,
            'default' => true
        ],
        [
            'id'      => SendingsTable::STATUS,
            'content' => Loc::getMessage('SMS4B_MAIN_SMS_STATUS'),
            'sort'    => SendingsTable::STATUS,
            'default' => true
        ],
        [
            'id'      => SendingsTable::ENTITY_ID,
            'content' => Loc::getMessage('SMS4B_MAIN_SMS_ENTITY_ID'),
            'sort'    => SendingsTable::ENTITY_ID,
            'default' => true
        ],
        [
            'id'      => SendingsTable::SOURCE_ID,
            'content' => Loc::getMessage('SMS4B_MAIN_SMS_SOURCE'),
            'sort'    => SendingsTable::SOURCE_ID,
            'default' => true
        ],
        [
            'id'      => SendingsTable::MAIL_EVENT,
            'content' => Loc::getMessage('SMS4B_MAIN_SMS_EVENTS'),
            'sort'    => SendingsTable::MAIL_EVENT,
            'default' => true
        ],
        [
            'id'      => SendingsTable::RESULT,
            'content' => Loc::getMessage('SMS4B_MAIN_SMS_RESULT'),
            'sort'    => SendingsTable::RESULT,
            'default' => true
        ]
    ]
);
$sendingService = new \Rarus\Sms4b\Sendings\Service();
$nav = new Bitrix\Main\UI\AdminPageNavigation('out');
$nav->initFromUri();
try {
    $sendings = $sendingService->getSendingsByFilter($arFilter, $nav, [$by => strtoupper($order)]);
    $encodingService = new \Rarus\Sms4b\Encoding\Service();

    $rowsCount = 0;

    foreach ($sendings as $sending) {
        foreach ($sending->getMessages() as $item) {
            /**
             * @var \Rarus\Sms4b\Sendings\Messages\Message $item
             */
            $row =& $lAdmin->AddRow($item->getId());
            $row->AddViewField(SendingsTable::ID, $item->getId());
            $row->AddViewField(SendingsTable::GUID, $item->getGuid());
            $row->AddViewField(SendingsTable::SENDER, $sending->getSender());
            $row->AddViewField(SendingsTable::DESTINATION, $item->getDestination());
            $row->AddViewField(SendingsTable::DATE_START_FOR_USER,
                \Rarus\Sms4b\DateTimeConverter::dateTimeForUser($sending->getDateStartForUser()));
            $row->AddViewField(SendingsTable::LAST_MODIFIED,
                \Rarus\Sms4b\DateTimeConverter::dateTimeForUser($item->getLastModified()));
            $row->AddViewField(SendingsTable::DATE_ACTUAL,
                \Rarus\Sms4b\DateTimeConverter::dateTimeForUser($sending->getDateActual()));
            $row->AddViewField(SendingsTable::TEXT, $encodingService->decodeMessage($item->getText(),
                \Rarus\Sms4b\Encoding\Encoding::createInstanceByEncodingCode($item->getEncoding())));
            $row->AddViewField(SendingsTable::STATUS, Status::getStatusDescription($item->getStatus()->getStatus()));
            $row->AddViewField(SendingsTable::ENTITY_ID, $item->getEntityId());
            $row->AddViewField(SendingsTable::SOURCE_ID, $sending->getSource()->getDescriptionForUser());
            $row->AddViewField(SendingsTable::MAIL_EVENT, $sending->getEvent());
            $row->AddViewField(SendingsTable::RESULT, $item->getResult());
            $rowsCount++;
        }
    }
} catch (\Rarus\Sms4b\Exceptions\Sms4bException $e) {
    $message = new CAdminMessage([
        'MESSAGE' => Loc::getMessage('SMS4B_SENDINGS_GET_ERROR'),
        'TYPE'    => 'ERROR',
        'HTML'    => true
    ]);
}
$lAdmin->setNavigation($nav, Loc::getMessage('SMS4B_MAIN_SMS_NAV'));
$lAdmin->AddFooter(
    [
        [
            'title' => Loc::getMessage('SMS4B_MAIN_MAIN_ADMIN_LIST_SELECTED'),
            'value' => $rowsCount
        ],
        ['counter' => true, 'title' => Loc::getMessage('SMS4B_MAIN_MAIN_ADMIN_LIST_CHECKED'), 'value' => '0']
    ]
);

$lAdmin->AddAdminContextMenu();

$lAdmin->CheckListMode();

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php');

$GLOBALS['APPLICATION']->SetTitle(Loc::getMessage('SMS4B_MAIN_SMS4B_TITLE'));

$oFilter = new CAdminFilter(
    $sTableID . '_filter',
    [
        Loc::getMessage('SMS4B_MAIN_SMS_F_GUID'),
        Loc::getMessage('SMS4B_MAIN_SMS_F_SENDERNAME'),
        Loc::getMessage('SMS4B_MAIN_SMS_F_DESTINATION'),
        Loc::getMessage('SMS4B_MAIN_SMS_F_STARTSEND_FROM'),
        Loc::getMessage('SMS4B_MAIN_SMS_F_LASTMODIFIED_FROM'),
        Loc::getMessage('SMS4B_MAIN_SMS_F_DATEACTUAL_FROM'),
        Loc::getMessage('SMS4B_MAIN_SMS_F_STATUS'),
        Loc::getMessage('SMS4B_MAIN_SMS_F_SOURCE'),
        Loc::getMessage('SMS4B_MAIN_SMS_F_ENTITY_ID'),
        Loc::getMessage('SMS4B_MAIN_SMS_F_EVENTS')
    ]
);
?>

<form name="find_form" method="get" action="<?php echo $GLOBALS['APPLICATION']->GetCurPage(); ?>">
    <?php $oFilter->Begin(); ?>
    <tr>
        <td>ID</td>
        <td>
            <input type="text" name="find_id" size="47" value="<?php echo htmlspecialchars($find_id) ?>">
        </td>
    </tr>
    <tr>
        <td>GUID</td>
        <td>
            <input type="text" name="find_GUID" size="47" value="<?php echo htmlspecialchars($find_GUID) ?>">
        </td>
    </tr>
    <tr>
        <td><?= Loc::getMessage('SMS4B_MAIN_SMS_F_SENDERNAME') . ':' ?></td>
        <td><input type="text" name="find_SenderName" size="47"
                   value="<?php echo htmlspecialchars($find_SenderName) ?>">
        </td>
    </tr>
    <tr>
        <td><?= Loc::getMessage('SMS4B_MAIN_SMS_F_DESTINATION') . ':' ?></td>
        <td><input type="text" name="find_Destination" size="47"
                   value="<?php echo htmlspecialchars($find_Destination) ?>">
        </td>
    </tr>
    <tr>
        <td>
            <?php echo Loc::getMessage('SMS4B_MAIN_SMS_F_STARTSEND')
                . ' (' . CLang::GetDateFormat('FULL') . '):' ?>
        </td>
        <td><?php echo CalendarPeriod('find_StartSend_from', htmlspecialcharsEx($find_StartSend_from),
                'find_StartSend_to',
                htmlspecialcharsEx($find_StartSend_to),
                'find_form') ?></td>
    </tr>
    <tr>
        <td>
            <?php echo Loc::getMessage('SMS4B_MAIN_SMS_F_LASTMODIFIED')
                . ' (' . CLang::GetDateFormat('FULL') . '):' ?>
        </td>
        <td><?php echo CalendarPeriod('find_LastModified_from', htmlspecialcharsEx($find_LastModified_from),
                'find_LastModified_to', htmlspecialcharsEx($find_LastModified_to),
                'find_form') ?></td>
    </tr>
    <tr>
        <td>
            <?php echo Loc::getMessage('SMS4B_MAIN_SMS_F_DATE_ACTUAL')
                . ' (' . CLang::GetDateFormat('FULL') . '):' ?>
        </td>
        <td><?php echo CalendarPeriod('find_DateActual_from', htmlspecialcharsEx($find_DateActual_from),
                'find_DateActual_to',
                htmlspecialcharsEx($find_DateActual_to),
                'find_form') ?></td>
    </tr>

    <tr>
        <td><?= Loc::getMessage('SMS4B_MAIN_SMS_F_STATUS') . ':' ?></td>
        <td>
            <select name="find_Status">
                <option <?php if (Status::CREATE === (int)$find_Status): ?>selected="selected"<?php endif; ?>
                        value="<?= Status::CREATE ?>"><?= Status::getStatusDescription(Status::CREATE) ?>
                </option>
                <option <?php if (Status::IN_PROCESS === (int)$find_Status): ?>selected="selected"<?php endif; ?>
                        value="<?= Status::IN_PROCESS ?>"><?= Status::getStatusDescription(Status::IN_PROCESS) ?>
                </option>
                <option <?php if (Status::STATUS_SEND === (int)$find_Status): ?>selected="selected"<?php endif; ?>
                        value="<?= Status::STATUS_SEND ?>"><?= Status::getStatusDescription(Status::STATUS_SEND) ?>
                </option>
                <option <?php if (Status::NOT_SEND === (int)$find_Status): ?>selected="selected"<?php endif; ?>
                        value="<?= Status::NOT_SEND ?>"><?= Status::getStatusDescription(Status::NOT_SEND) ?></option>
                <option <?php if (Status::STATUS_REJECTED === (int)$find_Status): ?>selected="selected"<?php endif; ?>
                        value="<?= Status::STATUS_REJECTED ?>"
                ><?= Status::getStatusDescription(Status::STATUS_REJECTED) ?>
                </option>
            </select>
        </td>
    </tr>
    <tr>
        <td><?= Loc::getMessage('SMS4B_MAIN_SMS_F_SOURCE') . ':' ?></td>
        <td><input type="text" name="find_Source_Id" size="47" value="<?php echo htmlspecialchars($find_Source_Id) ?>">
        </td>
    </tr>
    <tr>
        <td><?= Loc::getMessage('SMS4B_MAIN_SMS_F_ENTITY_ID') . ':' ?></td>
        <td><input type="text" name="find_Entity_Id" size="47"
                   value="<?php echo htmlspecialchars($find_Entity_Id) ?>">
        </td>
    </tr>
    <tr>
        <td><?= Loc::getMessage('SMS4B_MAIN_SMS_F_EVENTS') . ':' ?></td>
        <td><input type="text" name="find_Events" size="47" value="<?php echo htmlspecialchars($find_Events) ?>"></td>
    </tr>
    <?php
    $oFilter->Buttons([
        'table_id' => $sTableID,
        'url'      => $GLOBALS['APPLICATION']->GetCurPage(),
        'form'     => 'find_form'
    ]);
    $oFilter->End();
    ?>
</form>

<?php
if(!empty($message)) {
    echo $message->Show();
}
$lAdmin->DisplayList();
?>

<?php require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php'); ?>
