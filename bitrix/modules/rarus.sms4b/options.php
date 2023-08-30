<?php
use \Bitrix\Main\Localization\Loc;
use Rarus\Sms4b\RemoteService;
use Rarus\Sms4b\Forgottenbaskets\Service as Forgottenbaskets;
IncludeModuleLangFile(__FILE__);

if (!function_exists('curl_exec')) {
    echo '<a href=\'http://php.net/manual/ru/book.curl.php\'> ' . Loc::getMessage('SMS4B_MAIN_CURL_LIB_EN') . '</a> '
        . Loc::getMessage('SMS4B_MAIN_CURL_LIB_NOT_INSTALL_EN') . '<br />';
    echo '<a href=\'http://php.net/manual/ru/book.curl.php\'> ' . Loc::getMessage('SMS4B_MAIN_CURL_LIB') . '</a> '
        . Loc::getMessage('SMS4B_MAIN_CURL_LIB_NOT_INSTALL');
    die();
}

//only $module_id otherwise the access setting doesn't work
$module_id = 'rarus.sms4b';
Bitrix\Main\Loader::includeModule($module_id);

$APPLICATION->AddHeadScript('/bitrix/js/' . $module_id . '/jquery.js');
$APPLICATION->AddHeadScript('/bitrix/js/' . $module_id . '/jquery.dataTables.js');
$APPLICATION->SetAdditionalCSS('/bitrix/js/' . $module_id . '/css/styles.css');
CUtil::InitJSCore(['ajax', 'popup']);


$siteList = [];
$rsSites = CSite::GetList($by = 'sort', $order = 'asc', []);
while ($arRes = $rsSites->GetNext()) {
    $siteList[] = ['ID' => $arRes['ID'], 'NAME' => $arRes['NAME']];
}
$siteCount = count($siteList);
$groupRight = $APPLICATION->GetGroupRight($module_id);

if ($groupRight >= 'R'):

    $sms4b = new Csms4b();
    $config = new \Rarus\Sms4b\Config\Service();
    $debugService = new \Rarus\Sms4b\Debug\Service();
    $forgottenbaskets = new Forgottenbaskets();
    $gmt = $sms4b::getTimeZone();
    try {
        $login = $config->getLogin();
        $pass = $config->getPassword();
        $arDefaultSender = [];
        if (!empty($login) && !empty($pass)) {
            $arDefaultSender = array_unique((array)$sms4b->getAllSenders());
        }
        $arSonetGroups = $sms4b->GetSonetGroups();
        $person = $sms4b->GetPersonTypes();
        $orderProps = $sms4b->GetSaleOrderProps();
    } catch (\Throwable $t) {
        $debugService->writeToLogFile($t->getMessage());
    }
    $customUserTemplates = $sms4b->GetAllSmsTemplates('SMS4B_USER_LIST_CUSTOM_EVENT');

    $arAllOptions = [
        ['module_enabled', Loc::getMessage('SMS4B_MAIN_OPT_MODULE_ENABLED'), '', ['checkbox', 'Y']],
        [
            'login',
            Loc::getMessage('SMS4B_MAIN_OPT_LOGIN') . (empty($arDefaultSender[0]) ? Loc::getMessage('SMS4B_MAIN_REGISTER') : ''),
            '',
            ['text', 35]
        ],
        ['password', Loc::getMessage('SMS4B_MAIN_OPT_PASSWORD'), '', ['text', 35]],
        ['gmt', Loc::getMessage('SMS4B_MAIN_OPT_GMT'), 3, ['selectbox', $gmt]],
        ['send_email', Loc::getMessage('SMS4B_MAIN_SEND_EMAIL'), 3, ['checkbox', 'y']],

    ];
    $clearSendingQueueDefCode = 1;
    $arParamsSendOption = [
        ['send_on_agent', Loc::getMessage('SMS4B_MAIN_OPT_SEND_ON_AGENT'), 'N', ['checkbox', 'Y']],
        ['amount_for_send_at_once', Loc::getMessage('SMS4B_MAIN_OPT_AMOUNT_FOR_SEND_AT_ONCE'), '20', ['text', 35]],
        ['processing_old_events', Loc::getMessage('SMS4B_MAIN_OPT_PROCESSING_OLD_EVENTS'), 'Y', ['checkbox', 'y']],
        ['clear_sending_queue', Loc::getMessage('SMS4B_MAIN_OPT_CLEAR_SENDING_QUEUE'), $clearSendingQueueDefCode, ['selectbox', [1, 7, 30, 120]]],
    ];

    $aTabs = [];
    $aTabs[] = [
        'DIV' => 'edit0',
        'TAB' => Loc::getMessage('SMS4B_MAIN_TAB_PARAM'),
        'ICON' => 'sms4b_settings',
        'TITLE' => Loc::getMessage('SMS4B_MAIN_TAB_TITLE_PARAM')
    ];
    $aTabs[] = [
        'DIV' => 'edit1',
        'TAB' => Loc::getMessage('SMS4B_MAIN_TAB_SITE'),
        'ICON' => 'sms4b_settings',
        'TITLE' => Loc::getMessage('SMS4B_MAIN_TAB_TITLE_SITE')
    ];
    $aTabs[] = [
        'DIV' => 'edit2',
        'TAB' => Loc::getMessage('SMS4B_MAIN_TAB_TEMPLATES'),
        'ICON' => 'sms4b_settings',
        'TITLE' => Loc::getMessage('SMS4B_MAIN_TAB_TITLE_TEMPLATES')
    ];
    $aTabs[] = [
        'DIV' => 'edit3',
        'TAB' => Loc::getMessage('SMS4B_MAIN_TAB_API'),
        'ICON' => 'sms4b_settings',
        'TITLE' => Loc::getMessage('SMS4B_MAIN_TAB_TITLE_API')
    ];
    $aTabs[] = [
        'DIV' => 'edit4',
        'TAB' => Loc::getMessage('SMS4B_MAIN_TAB_HELP'),
        'ICON' => 'sms4b_settings',
        'TITLE' => Loc::getMessage('SMS4B_MAIN_TAB_TITLE_HELP')
    ];
    $aTabs[] = [
        'DIV' => 'edit5',
        'TAB' => Loc::getMessage('SMS4B_MAIN_TAB_SUPPORT'),
        'ICON' => 'sms4b_settings',
        'TITLE' => Loc::getMessage('SMS4B_MAIN_TAB_TITLE_SUPPORT')
    ];
    $aTabs[] = [
        'DIV' => 'edit6',
        'TAB' => Loc::getMessage('SMS4B_MAIN_TAB_RIGHTS'),
        'ICON' => 'sms4b_settings',
        'TITLE' => Loc::getMessage('SMS4B_MAIN_TAB_TITLE_RIGHTS')
    ];
    $aTabs[] = [
        'DIV' => 'edit7',
        'TAB' => Loc::getMessage('SMS4B_MAIN_TAB_LOG'),
        'ICON' => 'sms4b_settings',
        'TITLE' => Loc::getMessage('SMS4B_MAIN_TAB_TITLE_LOG')
    ];

    $tabControl = new CAdminTabControl('tabControl', $aTabs);
    if ($groupRight >= 'W' && $REQUEST_METHOD === 'POST' && strlen($Update . $RestoreDefaults) > 0 && check_bitrix_sessid()) {

        if (strlen($RestoreDefaults) > 0) {
            //хак, при очистке данных модуля нельзя удалять ID агента (ссылка на него не сможет формироваться),
            //а отдельных методов для исключения нет
            $agentID = $sms4b->GetCurrentOption('deadline_agent_id', SITE_ID);
            $lastLoadSms = $sms4b->GetCurrentOption('load_incoming_from');
            $clearSendingQueue = $sms4b->GetCurrentOption('clear_sending_queue');

            COption::RemoveOption($module_id);
            $obGroups = CGroup::GetList($by = 'id', $order = 'asc', ['ACTIVE' => 'Y', 'ADMIN' => 'N']);
            while ($arGroup = $obGroups->Fetch()) {
                $APPLICATION->DelGroupRight($module_id, [$arGroup['ID']]);
            }
            $arDefaultSender = [];
            COption::SetOptionString($module_id, 'deadline_agent_id', $agentID);
            COption::SetOptionString($module_id, 'load_incoming_from', $lastLoadSms);

            $result = CAgent::GetList([], ['MODULE_ID' => 'rarus.sms4b', 'NAME' => '\Rarus\Sms4b\Agent::clearSendingQueue();']);
            if($arRes = $result->Fetch()) {
                $interval = 3600 * 24 * $arParamsSendOption[3][3][1][$clearSendingQueueDefCode];
                CAgent::Update($arRes['ID'], ['AGENT_INTERVAL' => $interval]);
            }
        } else {
            foreach ($arAllOptions as $arOption) {
                $name = $arOption[0];
                $val = $_REQUEST[$name];
                if ($val !== 'Y' && $arOption[2][0] === 'checkbox') {
                    $val = 'N';
                }
                COption::SetOptionString($module_id, $name, $val, $arOption[1]);
            }
            foreach ($arParamsSendOption as $arOption) {
                $name = $arOption[0];
                $val = $_REQUEST[$name];
                if($name === 'amount_for_send_at_once') {
                    if(!is_numeric($val)) {
                        $val = '20';
                    }
                }
                if ($val !== 'Y' && $arOption[2][0] === 'checkbox') {
                    $val = 'N';
                }
                if ($name === 'clear_sending_queue') {
                    $result = CAgent::GetList([], ['MODULE_ID' => 'rarus.sms4b', 'NAME' => '\Rarus\Sms4b\Agent::clearSendingQueue();']);
                    if($arRes = $result->Fetch()) {
                        $interval = 3600 * 24 * $arOption[3][1][$val];
                        CAgent::Update($arRes['ID'], ['AGENT_INTERVAL' => $interval]);
                    }
                }
                COption::SetOptionString($module_id, $name, $val, $arOption[1]);
            }

            try {
                $remoteService = new RemoteService\Service();
                $remoteService->closeConnect();

                $sms4b = new Csms4b();
                $arDefaultSender = [];
                $login = $config->getLogin();
                $pass = $config->getPassword();
                if (!empty($login) && !empty($pass)) {
                    $arDefaultSender = $sms4b->getAllSenders();
                }
            } catch (\Throwable $t) {
                $debugService->writeToLogFile($t->getMessage());
            }

            if (Bitrix\Main\Loader::includeModule('sale')) {
                $arStatus = $sms4b->GetSaleStatus();
                $arSaleStatus = [];
                $arAdminStatus = [];
                foreach ($arStatus as $status) {
                    $arSaleStatus[] = 'event_sale_status_' . $status['ID'];
                    $arAdminStatus[] = 'admin_event_sale_status_' . $status['ID'];
                }
            }

            for ($i = 0; $i < $siteCount; $i++) {
                if (empty($_REQUEST['defsender'][$siteList[$i]['ID']])) {
                    $_REQUEST['defsender'][$siteList[$i]['ID']] = $arDefaultSender[0];
                }
                COption::SetOptionString($module_id, 'log_enable', trim($_REQUEST['log_enable']),
                    Loc::getMessage('SMS4B_MAIN_LOG_ENABLE'), $siteList[$i]['ID']);
                COption::SetOptionString($module_id, 'use_translit',
                    trim($_REQUEST['use_translit'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_USE_TRANSLIT'),
                    $siteList[$i]['ID']);
                if (in_array(trim($_REQUEST['defsender'][$siteList[$i]['ID']]), $arDefaultSender)) {
                    COption::SetOptionString($module_id, 'defsender', trim($_REQUEST['defsender'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_OPT_DEFSENDER'), $siteList[$i]['ID']);
                } else {
                    COption::SetOptionString($module_id, 'defsender', $arDefaultSender[0], Loc::getMessage('SMS4B_MAIN_OPT_DEFSENDER'),
                        $siteList[$i]['ID']);
                }

                COption::SetOptionString($module_id, 'phone_number_code',
                    trim($_REQUEST['phone_number_code'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_PHONE_NUMBER_CODE'),
                    $siteList[$i]['ID']);
                COption::SetOptionString($module_id, 'user_property_phone',
                    trim($_REQUEST['user_property_phone'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_USER_PHONE'),
                    $siteList[$i]['ID']);

                COption::SetOptionString($module_id, 'restricted_time',
                    trim($_REQUEST['DATE_FROM_NS_' . $siteList[$i]['ID']] . $_REQUEST['DATE_TO_NS_' . $siteList[$i]['ID']]),
                    Loc::getMessage('SMS4B_MAIN_RESTRICTED_TIME'), $siteList[$i]['ID']);

                if (IsModuleInstalled('subscribe')) {
                    COption::SetOptionString($module_id, 'event_subscribe_confirm',
                        trim($_REQUEST['event_subscribe_confirm'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_OPT_SUBSCRIBE_CONFIRM'), $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_event_subscribe_confirm',
                        trim($_REQUEST['admin_event_subscribe_confirm'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_OPT_SUBSCRIBE_CONFIRM'), $siteList[$i]['ID']);
                }

                if (IsModuleInstalled('im')) {
                    COption::SetOptionString($module_id, 'event_autoanswer',
                        trim($_REQUEST['event_autoanswer'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_OPT_AUTOANSWER'), $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'event_missed_call',
                        trim($_REQUEST['event_missed_call'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_OPT_MISSING_CALL'), $siteList[$i]['ID']);
                }

                COption::SetOptionString($module_id, 'admin_phone', trim($_REQUEST['admin_phone'][$siteList[$i]['ID']]),
                    Loc::getMessage('SMS4B_MAIN_ADMIN_PHONE'), $siteList[$i]['ID']);


                if (IsModuleInstalled('tasks')) {
                    if (empty($_REQUEST['workGroups_' . $siteList[$i]['ID']])) {
                        foreach ($sms4b->GetSonetGroups() as $val) {
                            $_REQUEST['workGroups_' . $siteList[$i]['ID']][] = $val['ID'];
                        }
                    }
                    COption::SetOptionString($module_id, 'serialize_work_groups', serialize($_REQUEST['workGroups_' . $siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_WG_ID'), $siteList[$i]['ID']);
                }

                if (IsModuleInstalled('sale')) {
                    COption::SetOptionString($module_id, 'event_sale_new_order',
                        trim($_REQUEST['event_sale_new_order'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_OPT_NEW_ORDER'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'event_sale_order_paid',
                        trim($_REQUEST['event_sale_order_paid'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_OPT_ORDER_PAID'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'event_sale_order_cancel',
                        trim($_REQUEST['event_sale_order_cancel'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_OPT_ORDER_CANCEL'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'event_sale_order_delivery',
                        trim($_REQUEST['event_sale_order_delivery'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_OPT_ORDER_DELIVERY'), $siteList[$i]['ID']);

                    COption::SetOptionString($module_id, 'admin_event_sale_new_order',
                        trim($_REQUEST['admin_event_sale_new_order'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_OPT_NEW_ORDER'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_event_sale_order_paid',
                        trim($_REQUEST['admin_event_sale_order_paid'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_OPT_ORDER_PAID'), $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_event_sale_order_cancel',
                        trim($_REQUEST['admin_event_sale_order_cancel'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_OPT_ORDER_CANCEL'), $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_event_sale_order_delivery',
                        trim($_REQUEST['admin_event_sale_order_delivery'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_OPT_ORDER_DELIVERY'), $siteList[$i]['ID']);

                }

                if (IsModuleInstalled('support')) {
                    COption::SetOptionString($module_id, 'admin_event_ticket_new_for_techsupport',
                        trim($_REQUEST['admin_event_ticket_new_for_techsupport'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_OPT_TICKET_NEW_FOR_TECHSUPPORT'), $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'event_ticket_new_for_techsupport',
                        trim($_REQUEST['event_ticket_new_for_techsupport'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_OPT_TICKET_NEW_FOR_TECHSUPPORT'), $siteList[$i]['ID']);
                }
                if (IsModuleInstalled('tasks')) {
                    COption::SetOptionString($module_id, 'add_low_task',
                        trim($_REQUEST['add_low_task'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_ADD_LOW_TASK'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'add_middle_task',
                        trim($_REQUEST['add_middle_task'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_ADD_MIDDLE_TASK'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'add_hight_task',
                        trim($_REQUEST['add_hight_task'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_ADD_HIGHT_TASK'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'update_low_task',
                        trim($_REQUEST['update_low_task'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_UPDATE_LOW_TASK'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'update_middle_task',
                        trim($_REQUEST['update_middle_task'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_UPDATE_MIDDLE_TASK'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'update_hight_task',
                        trim($_REQUEST['update_hight_task'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_UPDATE_HIGHT_TASK'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'delete_low_task',
                        trim($_REQUEST['delete_low_task'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_DELETE_LOW_TASK'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'delete_middle_task',
                        trim($_REQUEST['delete_middle_task'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_DELETE_MIDDLE_TASK'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'delete_hight_task',
                        trim($_REQUEST['delete_hight_task'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_DELETE_HIGHT_TASK'),
                        $siteList[$i]['ID']);

                    COption::SetOptionString($module_id, 'intercept_deadline',
                        trim($_REQUEST['intercept_deadline'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_INTERCEPT_DEADLINE'), $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'new_comment_task',
                        trim($_REQUEST['new_comment_task'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_NEW_COMM_FROM_TASK'), $siteList[$i]['ID']);

                    if (empty($_REQUEST['intercept_deadline'][$siteList[$i]['ID']])) {
                        COption::SetOptionString($module_id, 'deadline_date', '',
                            Loc::getMessage('SMS4B_MAIN_INTERCEPT_DEADLINE'));
                    }

                    COption::SetOptionString($module_id, 'admin_add_low_task',
                        trim($_REQUEST['admin_add_low_task'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_ADD_LOW_TASK'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_add_middle_task',
                        trim($_REQUEST['admin_add_middle_task'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_ADD_MIDDLE_TASK'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_add_hight_task',
                        trim($_REQUEST['admin_add_hight_task'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_ADD_HIGHT_TASK'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_update_low_task',
                        trim($_REQUEST['admin_update_low_task'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_UPDATE_LOW_TASK'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_update_middle_task',
                        trim($_REQUEST['admin_update_middle_task'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_UPDATE_MIDDLE_TASK'), $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_update_hight_task',
                        trim($_REQUEST['admin_update_hight_task'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_UPDATE_HIGHT_TASK'), $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_delete_low_task',
                        trim($_REQUEST['admin_delete_low_task'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_DELETE_LOW_TASK'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_delete_middle_task',
                        trim($_REQUEST['admin_delete_middle_task'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_DELETE_MIDDLE_TASK'), $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_delete_hight_task',
                        trim($_REQUEST['admin_delete_hight_task'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_DELETE_HIGHT_TASK'), $siteList[$i]['ID']);
                }

                if (Bitrix\Main\Loader::includeModule('crm')) {
                    /* Отправка пользователю */

                    //Контакты
                    COption::SetOptionString($module_id, 'add_contact_crm',
                        trim($_REQUEST['add_contact_crm'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_ADD_CONTACT_CRM'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'update_contact_crm',
                        trim($_REQUEST['update_contact_crm'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_CHANGE_CONTACT_CRM'), $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'remove_contact_crm',
                        trim($_REQUEST['remove_contact_crm'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_DEL_CONTACT_CRM'),
                        $siteList[$i]['ID']);
                    //Дела
                    COption::SetOptionString($module_id, 'remind_event_crm',
                        trim($_REQUEST['remind_event_crm'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_REMIND_EVENT_CRM'),
                        $siteList[$i]['ID']);
                    //Лид
                    COption::SetOptionString($module_id, 'add_lead_crm',
                        trim($_REQUEST['add_lead_crm'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_ADD_LEAD_CRM'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'update_lead_crm',
                        trim($_REQUEST['update_lead_crm'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_CHANGE_LEAD_CRM'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'delete_lead_crm',
                        trim($_REQUEST['delete_lead_crm'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_DEL_LEAD_CRM'),
                        $siteList[$i]['ID']);

                    foreach (CCrmStatus::GetStatusListEx('STATUS') as $id => $title) {
                        COption::SetOptionString($module_id, 'change_stat_lead_crm_' . $id,
                            trim($_REQUEST['change_stat_lead_crm_' . $id][$siteList[$i]['ID']]),
                            Loc::getMessage('SMS4B_MAIN_CH_STATUS_LEAD_CRM'), $siteList[$i]['ID']);
                    }

                    //Сделка
                    COption::SetOptionString($module_id, 'add_deal_crm',
                        trim($_REQUEST['add_deal_crm'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_ADD_DEAL_CRM'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'update_deal_crm',
                        trim($_REQUEST['update_deal_crm'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_CHANGE_DEAL_CRM'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'delete_deal_crm',
                        trim($_REQUEST['delete_deal_crm'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_DEL_DEAL_CRM'),
                        $siteList[$i]['ID']);

                    foreach (CCrmStatus::GetStatusListEx('DEAL_STAGE') as $id => $title) {
                        COption::SetOptionString($module_id, 'change_stat_deal_crm_' . $id,
                            trim($_REQUEST['change_stat_deal_crm_' . $id][$siteList[$i]['ID']]),
                            Loc::getMessage('SMS4B_MAIN_CH_STATUS_DEAL_CRM'), $siteList[$i]['ID']);
                    }

                    /* Отправка администратору */

                    //Контакты
                    COption::SetOptionString($module_id, 'admin_add_contact_crm',
                        trim($_REQUEST['admin_add_contact_crm'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_ADD_CONTACT_CRM'), $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_update_contact_crm',
                        trim($_REQUEST['admin_update_contact_crm'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_CHANGE_CONTACT_CRM'), $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_remove_contact_crm',
                        trim($_REQUEST['admin_remove_contact_crm'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_DEL_CONTACT_CRM'), $siteList[$i]['ID']);
                    //Дела
                    COption::SetOptionString($module_id, 'admin_remind_event_crm',
                        trim($_REQUEST['admin_remind_event_crm'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_REMIND_EVENT_CRM'), $siteList[$i]['ID']);
                    //Лид
                    COption::SetOptionString($module_id, 'admin_add_lead_crm',
                        trim($_REQUEST['admin_add_lead_crm'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_ADD_LEAD_CRM'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_update_lead_crm',
                        trim($_REQUEST['admin_update_lead_crm'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_CHANGE_LEAD_CRM'), $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_delete_lead_crm',
                        trim($_REQUEST['admin_delete_lead_crm'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_DEL_LEAD_CRM'),
                        $siteList[$i]['ID']);

                    foreach (CCrmStatus::GetStatusListEx('STATUS') as $id => $title) {
                        COption::SetOptionString($module_id, 'admin_change_stat_lead_crm_' . $id,
                            trim($_REQUEST['admin_change_stat_lead_crm_' . $id][$siteList[$i]['ID']]),
                            Loc::getMessage('SMS4B_MAIN_CH_STATUS_LEAD_CRM'), $siteList[$i]['ID']);
                    }

                    //Сделка
                    COption::SetOptionString($module_id, 'admin_add_deal_crm',
                        trim($_REQUEST['admin_add_deal_crm'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_ADD_DEAL_CRM'),
                        $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_update_deal_crm',
                        trim($_REQUEST['admin_update_deal_crm'][$siteList[$i]['ID']]),
                        Loc::getMessage('SMS4B_MAIN_CHANGE_DEAL_CRM'), $siteList[$i]['ID']);
                    COption::SetOptionString($module_id, 'admin_delete_deal_crm',
                        trim($_REQUEST['admin_delete_deal_crm'][$siteList[$i]['ID']]), Loc::getMessage('SMS4B_MAIN_DEL_DEAL_CRM'),
                        $siteList[$i]['ID']);

                    foreach (CCrmStatus::GetStatusListEx('DEAL_STAGE') as $id => $title) {
                        COption::SetOptionString($module_id, 'admin_change_stat_deal_crm_' . $id,
                            trim($_REQUEST['admin_change_stat_deal_crm_' . $id][$siteList[$i]['ID']]),
                            Loc::getMessage('SMS4B_MAIN_CH_STATUS_DEAL_CRM'), $siteList[$i]['ID']);
                    }
                }

                foreach ($arSaleStatus as $option) {
                    COption::SetOptionString($module_id, $option, trim($_REQUEST[$option][$siteList[$i]['ID']]), $option,
                        $siteList[$i]['ID']);
                }
                foreach ($arAdminStatus as $option) {
                    COption::SetOptionString($module_id, $option, trim($_REQUEST[$option][$siteList[$i]['ID']]), $option,
                        $siteList[$i]['ID']);
                }

                if(!is_numeric(trim($_REQUEST['quantity_send'][$siteList[$i]['ID']]))) {
                    $quantity_send = '5';
                } else {
                    $quantity_send = trim($_REQUEST['quantity_send'][$siteList[$i]['ID']]);
                }

                COption::SetOptionString($module_id, 'contacts_company' , trim($_REQUEST['contacts_company'][$siteList[$i]['ID']]),  GetMessage('SMS4B_CONTACTS_COMPANY'), $siteList[$i]['ID']);
                COption::SetOptionString($module_id, 'quantity_send'    , $quantity_send,  GetMessage('SMS4B_QUANTITY_SEND'), $siteList[$i]['ID']);
                COption::SetOptionString($module_id, 'the_button_label' , trim($_REQUEST['the_button_label'][$siteList[$i]['ID']]),  GetMessage('SMS4B_THE_BUTTON_LABEL'), $siteList[$i]['ID']);
                COption::SetOptionString($module_id, 'exceptions_numbers' , trim($_REQUEST['exceptions_numbers'][$siteList[$i]['ID']]),  GetMessage('SMS4B_EXCEPTIONS_NUMBERS'), $siteList[$i]['ID']);

                foreach ($_REQUEST as $optionKey => $arOption) {
                    if (str_contains($optionKey, 'send_forgotten_baskets_minutes_')
                        && isset($arOption[$siteList[$i]['ID']])) {

                        COption::SetOptionString(
                            $module_id,
                            $optionKey,
                            trim($arOption[$siteList[$i]['ID']]),
                            Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_MINUTES_NUMBER'),
                            $siteList[$i]['ID']);
                        $number = str_replace('send_forgotten_baskets_minutes_', '', $optionKey);
                        COption::SetOptionString(
                            $module_id,
                            'send_forgotten_baskets_active_' . $number,
                            trim($_REQUEST['send_forgotten_baskets_active_' . $number][$siteList[$i]['ID']]),
                            Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_ACTIVE_NUMBER'),
                            $siteList[$i]['ID']
                        );

                    }
                }
            }
        }
    }

    $tabControl->Begin(); ?>
    <form method='post'
          action='<?= $APPLICATION->GetCurPage() ?>?mid=<?= urlencode($mid) ?>&amp;lang=<?= LANGUAGE_ID ?>'>
        <?php
        if (empty($login) && empty($pass)) {
            $message = new CAdminMessage([
                'MESSAGE' => Loc::getMessage('SMS4B_MAIN_NO_LOG_AND_PASS') . '<br>' . Loc::getMessage('SMS4B_MAIN_REGISTRY_INFORMATION'),
                'TYPE'    => 'ERROR',
                'HTML'    => true
            ]);
        } elseif (empty($arDefaultSender[0])) {
            $message = new CAdminMessage([
                'MESSAGE' => Loc::getMessage('SMS4B_MAIN_NONE_CONNECT') . '<br>' . Loc::getMessage('SMS4B_MAIN_REGISTRY_INFORMATION'),
                'TYPE'    => 'ERROR',
                'HTML'    => true
            ]);
        } elseif (!(COption::GetOptionString($module_id, 'module_enabled') === 'Y')) {
            $message = new CAdminMessage([
                'MESSAGE' => Loc::getMessage('SMS4B_MAIN_NO_MODULE_ENABLED'),
                'TYPE'    => 'ERROR',
                'HTML'    => true
            ]);
        } else {
            $messageOk = new CAdminMessage([
                'MESSAGE' => Loc::getMessage('SMS4B_MAIN_SUCCESS_CONNECT'),
                'TYPE'    => 'OK',
                'HTML'    => true
            ]);
        }

        if (COption::GetOptionString($module_id, 'send_on_agent') === 'Y' && (COption::GetOptionString('main',
                    'agents_use_crontab', 'N') !== 'N' || COption::GetOptionString('main', 'check_agents', 'Y'))) {
            $noAgentOnCron = new CAdminMessage([
                'MESSAGE' => Loc::getMessage('SMS4B_MAIN_NO_AGENT_ON_CRON'),
                'TYPE'    => 'ERROR',
                'HTML'    => true
            ]);
        }

        if(!class_exists('SoapClient'))
        {
            $soapNoEnable = new CAdminMessage([
                'MESSAGE' => Loc::getMessage('SMS4B_MAIN_SOAP_NOT_EXIST'),
                'TYPE' => 'ERROR',
                'HTML' => true
            ]);
        }

        ?>
        <div class='adm-detail-content'>
            <?php
            if (!empty($messageOk)) {
                echo $messageOk->Show();
            }
            if (!empty($soapNoEnable)) {
                echo $soapNoEnable->Show();
            } elseif (!empty($message)) {
                echo $message->Show();
            } elseif (!empty($noAgentOnCron)) {
                echo $noAgentOnCron->Show();
            }
            ?>
        </div>
        <?php

        $tabControl->BeginNextTab();
        foreach ($arAllOptions as $arOption):
            __AdmSettingsDrawRow($module_id, $arOption);
        endforeach;

        if (empty($login) && empty($pass)) {
            echo "<script>$(\"input[name='login']\").focus();</script>";
        } ?>
        <tr class='heading'>
            <td colspan='2'><?= Loc::getMessage('SMS4B_MAIN_TAB_PARAMS_SEND') ?></td>
        </tr>
        <?
        foreach ($arParamsSendOption as $arOption):
            __AdmSettingsDrawRow($module_id, $arOption);
        endforeach;
        $tabControl->BeginNextTab();
        ?>
        <tr>
            <td colspan='2' valign='top'>
                <?php
                $aTabs3 = [];
                foreach ($siteList as $val) {
                    $aTabs3[] = [
                        'DIV' => 'options' . $val['ID'],
                        'TAB' => '[' . $val['ID'] . '] ' . $val['NAME'],
                        'TITLE' => Loc::getMessage('SMS4B_MAIN_SITE_TITLE') . '[' . $val['ID'] . '] ' . $val['NAME']
                    ];
                }
                $tabControl3 = new CAdminViewTabControl('tabControl3', $aTabs3);
                $tabControl3->Begin();

                for ($i = 0; $i < $siteCount; $i++):
                    $tabControl3->BeginNextTab();


                    $defsender = COption::GetOptionString($module_id, 'defsender', '', $siteList[$i]['ID']);
                    $allTemplates = $sms4b->GetAllSmsTemplates(false, $siteList[$i]['ID']);
                    $customOrderTemplates = $sms4b->GetAllSmsTemplates('SMS4B_USER_CUSTOM_EVENT', $siteList[$i]['ID']);
                    $useTranslit = COption::GetOptionString($module_id, 'use_translit', '', $siteList[$i]['ID']);
                    $admin_phone = COption::GetOptionString($module_id, 'admin_phone', '', $siteList[$i]['ID']);
                    $defUserProperty = COption::GetOptionString($module_id, 'user_property_phone', false,
                        $siteList[$i]['ID']);
                    $log_enable = COption::GetOptionString($module_id, 'log_enable', '', $siteList[$i]['ID']);
                    $restrictedTime = COption::GetOptionString($module_id, 'restricted_time', '', $siteList[$i]['ID']);

                    global $USER;
                    $rsUser = CUser::GetList($by = 'ID', $order = 'desc', ['ID' => 1],
                        ['SELECT' => ['UF_*']]);
                    $arUser = $rsUser->Fetch();
                    $arUserPhone[] = '';
                    foreach ($arUser as $index => $value) {
                        $pattern = '/(PERSONAL|WORK|UF|^LOGIN$)/';

                        if (preg_match($pattern, $index)) {
                            $arUserPhone[] = $index;
                        }
                    }

                    if (Bitrix\Main\Loader::includeModule('subscribe')) {
                        $event_subscribe_confirm = COption::GetOptionString($module_id, 'event_subscribe_confirm', '',
                            $siteList[$i]['ID']);
                        $admin_event_subscribe_confirm = COption::GetOptionString($module_id,
                            'admin_event_subscribe_confirm', '', $siteList[$i]['ID']);
                    }

                    if (IsModuleInstalled('im')) {
                        $event_autoanswer = COption::GetOptionString($module_id, 'event_autoanswer', '', $siteList[$i]['ID']);
                        $event_missed_call = COption::GetOptionString($module_id, 'event_missed_call', '', $siteList[$i]['ID']);
                    }

                    if (Bitrix\Main\Loader::includeModule('sale')) {
                        $event_sale_new_order = COption::GetOptionString($module_id, 'event_sale_new_order', '',
                            $siteList[$i]['ID']);
                        $event_sale_order_paid = COption::GetOptionString($module_id, 'event_sale_order_paid', '',
                            $siteList[$i]['ID']);
                        $event_sale_order_delivery = COption::GetOptionString($module_id, 'event_sale_order_delivery',
                            '', $siteList[$i]['ID']);
                        $event_sale_order_cancel = COption::GetOptionString($module_id, 'event_sale_order_cancel', '',
                            $siteList[$i]['ID']);

                        $admin_event_sale_new_order = COption::GetOptionString($module_id, 'admin_event_sale_new_order',
                            '', $siteList[$i]['ID']);
                        $admin_event_sale_order_paid = COption::GetOptionString($module_id,
                            'admin_event_sale_order_paid', '', $siteList[$i]['ID']);
                        $admin_event_sale_order_delivery = COption::GetOptionString($module_id,
                            'admin_event_sale_order_delivery', '', $siteList[$i]['ID']);
                        $admin_event_sale_order_cancel = COption::GetOptionString($module_id,
                            'admin_event_sale_order_cancel', '', $siteList[$i]['ID']);

                        $orderPhoneCode = COption::GetOptionString($module_id, 'phone_number_code', false,
                            $siteList[$i]['ID']);

                        $arSaleStatus = $arAdminStatus = [];
                        foreach((array)$sms4b->GetSaleStatus() as $status){
                            $arSaleStatus[$status['TYPE']][] = [
                                'event_sale_status_' . $status['ID'] => COption::GetOptionString($module_id,
                                    'event_sale_status_' . $status['ID'], '', $siteList[$i]['ID']),
                                'NAME' => $status['NAME'],
                                'ID' => $status['ID']
                            ];

                            $arAdminStatus[$status['TYPE']][] = [
                                'admin_event_sale_status_' . $status['ID'] => COption::GetOptionString($module_id,
                                    'admin_event_sale_status_' . $status['ID'], '', $siteList[$i]['ID']),
                                'NAME' => $status['NAME'],
                                'ID' => $status['ID']
                            ];
                        }

                        $arForgottenBaskets = $forgottenbaskets->getArForgottenBasketsAll($siteList[$i]['ID']);
                    }
                    if (Bitrix\Main\Loader::includeModule('tasks')) {
                        $add_low_task = COption::GetOptionString($module_id, 'add_low_task', '', $siteList[$i]['ID']);
                        $add_middle_task = COption::GetOptionString($module_id, 'add_middle_task', '',
                            $siteList[$i]['ID']);
                        $add_hight_task = COption::GetOptionString($module_id, 'add_hight_task', '',
                            $siteList[$i]['ID']);
                        $update_low_task = COption::GetOptionString($module_id, 'update_low_task', '',
                            $siteList[$i]['ID']);
                        $update_middle_task = COption::GetOptionString($module_id, 'update_middle_task', '',
                            $siteList[$i]['ID']);
                        $update_hight_task = COption::GetOptionString($module_id, 'update_hight_task', '',
                            $siteList[$i]['ID']);
                        $delete_low_task = COption::GetOptionString($module_id, 'delete_low_task', '',
                            $siteList[$i]['ID']);
                        $delete_middle_task = COption::GetOptionString($module_id, 'delete_middle_task', '',
                            $siteList[$i]['ID']);
                        $delete_hight_task = COption::GetOptionString($module_id, 'delete_hight_task', '',
                            $siteList[$i]['ID']);

                        $intercept_deadline = COption::GetOptionString($module_id, 'intercept_deadline', '',
                            $siteList[$i]['ID']);
                        $new_comment_task = COption::GetOptionString($module_id, 'new_comment_task', '',
                            $siteList[$i]['ID']);

                        $admin_add_low_task = COption::GetOptionString($module_id, 'admin_add_low_task', '',
                            $siteList[$i]['ID']);
                        $admin_add_middle_task = COption::GetOptionString($module_id, 'admin_add_middle_task', '',
                            $siteList[$i]['ID']);
                        $admin_add_hight_task = COption::GetOptionString($module_id, 'admin_add_hight_task', '',
                            $siteList[$i]['ID']);
                        $admin_update_low_task = COption::GetOptionString($module_id, 'admin_update_low_task', '',
                            $siteList[$i]['ID']);
                        $admin_update_middle_task = COption::GetOptionString($module_id, 'admin_update_middle_task', '',
                            $siteList[$i]['ID']);
                        $admin_update_hight_task = COption::GetOptionString($module_id, 'admin_update_hight_task', '',
                            $siteList[$i]['ID']);
                        $admin_delete_low_task = COption::GetOptionString($module_id, 'admin_delete_low_task', '',
                            $siteList[$i]['ID']);
                        $admin_delete_middle_task = COption::GetOptionString($module_id, 'admin_delete_middle_task', '',
                            $siteList[$i]['ID']);
                        $admin_delete_hight_task = COption::GetOptionString($module_id, 'admin_delete_hight_task', '',
                            $siteList[$i]['ID']);
                    }

                    if (IsModuleInstalled('tasks')) {

                        $arUnserWG = unserialize(COption::GetOptionString($module_id, 'serialize_work_groups', '',
                            $siteList[$i]['ID']));
                        foreach ($arSonetGroups as $key => $group) {
                            if (in_array($group['ID'], (array)$arUnserWG)) {
                                $arSonetGroups[$key]['ENABLE'] = true;
                            }
                            else
                            {
                                unset($arSonetGroups[$key]['ENABLE']);
                            }
                        }
                    }

                    if (IsModuleInstalled('crm')) {
                        /* Отправка пользователю */

                        //Контакты
                        $add_contact_crm = COption::GetOptionString($module_id, 'add_contact_crm', '',
                            $siteList[$i]['ID']);
                        $update_contact_crm = COption::GetOptionString($module_id, 'update_contact_crm', '',
                            $siteList[$i]['ID']);
                        //Дела
                        $remind_event_crm = COption::GetOptionString($module_id, 'remind_event_crm', '',
                            $siteList[$i]['ID']);
                        //Лид
                        $add_lead_crm = COption::GetOptionString($module_id, 'add_lead_crm', '', $siteList[$i]['ID']);
                        $update_lead_crm = COption::GetOptionString($module_id, 'update_lead_crm', '',
                            $siteList[$i]['ID']);
                        $delete_lead_crm = COption::GetOptionString($module_id, 'delete_lead_crm', '',
                            $siteList[$i]['ID']);

                        foreach (CCrmStatus::GetStatusListEx('STATUS') as $id => $title) {
                            $change_stat_lead_crm[$id] = COption::GetOptionString($module_id,
                                'change_stat_lead_crm_' . $id,
                                '', $siteList[$i]['ID']);
                        }


                        //Сделка
                        $add_deal_crm = COption::GetOptionString($module_id, 'add_deal_crm', '', $siteList[$i]['ID']);
                        $update_deal_crm = COption::GetOptionString($module_id, 'update_deal_crm', '',
                            $siteList[$i]['ID']);

                        foreach (CCrmStatus::GetStatusListEx('DEAL_STAGE') as $id => $title) {
                            $change_stat_deal_crm[$id] = COption::GetOptionString($module_id,
                                'change_stat_deal_crm_' . $id,
                                '', $siteList[$i]['ID']);
                        }

                        /* Отправка администратору */

                        //Контакты
                        $admin_add_contact_crm = COption::GetOptionString($module_id, 'admin_add_contact_crm', '',
                            $siteList[$i]['ID']);
                        $admin_update_contact_crm = COption::GetOptionString($module_id, 'admin_update_contact_crm', '',
                            $siteList[$i]['ID']);
                        $admin_remove_contact_crm = COption::GetOptionString($module_id, 'admin_remove_contact_crm', '',
                            $siteList[$i]['ID']);
                        //Дела
                        $admin_remind_event_crm = COption::GetOptionString($module_id, 'admin_remind_event_crm', '',
                            $siteList[$i]['ID']);
                        //Лид
                        $admin_add_lead_crm = COption::GetOptionString($module_id, 'admin_add_lead_crm', '',
                            $siteList[$i]['ID']);
                        $admin_update_lead_crm = COption::GetOptionString($module_id, 'admin_update_lead_crm', '',
                            $siteList[$i]['ID']);
                        $admin_delete_lead_crm = COption::GetOptionString($module_id, 'admin_delete_lead_crm', '',
                            $siteList[$i]['ID']);

                        foreach (CCrmStatus::GetStatusListEx('STATUS') as $id => $title) {
                            $admin_change_stat_lead_crm[$id] = COption::GetOptionString($module_id,
                                'admin_change_stat_lead_crm_' . $id, '', $siteList[$i]['ID']);
                        }
                        //Сделка
                        $admin_add_deal_crm = COption::GetOptionString($module_id, 'admin_add_deal_crm', '',
                            $siteList[$i]['ID']);
                        $admin_update_deal_crm = COption::GetOptionString($module_id, 'admin_update_deal_crm', '',
                            $siteList[$i]['ID']);
                        $admin_delete_deal_crm = COption::GetOptionString($module_id, 'admin_delete_deal_crm', '',
                            $siteList[$i]['ID']);

                        foreach (CCrmStatus::GetStatusListEx('DEAL_STAGE') as $id => $title) {
                            $admin_change_stat_deal_crm[$id] = COption::GetOptionString($module_id,
                                'admin_change_stat_deal_crm_' . $id, '', $siteList[$i]['ID']);
                        }

                    }

                    if (Bitrix\Main\Loader::includeModule('support')) {
                        $event_ticket_new_for_techsupport = COption::GetOptionString($module_id,
                            'event_ticket_new_for_techsupport', '', $siteList[$i]['ID']);
                        $admin_event_ticket_new_for_techsupport = COption::GetOptionString($module_id,
                            'admin_event_ticket_new_for_techsupport', '', $siteList[$i]['ID']);
                    }

                    $contacts_company  = COption::GetOptionString($module_id, 'contacts_company' , '', $siteList[$i]['ID']);
                    $quantity_send     = COption::GetOptionString($module_id, 'quantity_send'    , '5', $siteList[$i]['ID']);
                    $the_button_label  = COption::GetOptionString($module_id, 'the_button_label' , GetMessage('SMS4B_THE_BUTTON_LABEL_DEF'), $siteList[$i]['ID']);
                    $exceptions_numbers= COption::GetOptionString($module_id, 'exceptions_numbers', '', $siteList[$i]['ID']);

                    ?>
                    <table cellpadding='2' cellspacing='2' border='0' width='100%' align='center'>


                        <tr>
                            <td align='center' colspan='2'>

                                <?php
                                $arTabsEvents = [
                                    [
                                        'DIV' => 'edit_event0_' . $siteList[$i]['ID'],
                                        'TAB' => Loc::getMessage('SMS4B_MAIN_SUB_TAB_TITLE_ALL')
                                    ]
                                ];
                                if (IsModuleInstalled('sale')) {
                                    $arTabsEvents[] = [
                                        'DIV' => 'edit_event1_' . $siteList[$i]['ID'],
                                        'TAB' => Loc::getMessage('SMS4B_MAIN_SUB_TAB_TITLE_SALE')
                                    ];
                                }
                                if (IsModuleInstalled('tasks')) {
                                    $arTabsEvents[] = [
                                        'DIV' => 'edit_event2_' . $siteList[$i]['ID'],
                                        'TAB' => Loc::getMessage('SMS4B_MAIN_SUB_TAB_TITLE_TASKS')
                                    ];
                                }
                                if (IsModuleInstalled('crm')) {
                                    $arTabsEvents[] = [
                                        'DIV' => 'edit_event3_' . $siteList[$i]['ID'],
                                        'TAB' => Loc::getMessage('SMS4B_MAIN_SUB_TAB_TITLE_CRM')
                                    ];
                                }
                                if (IsModuleInstalled('voximplant')) {
                                    $arTabsEvents[] = [
                                        'DIV' => 'edit_event4_' . $siteList[$i]['ID'],
                                        'TAB' => Loc::getMessage('SMS4B_MAIN_SUB_TAB_TITLE_IM')
                                    ];
                                }
                                $arTabsEvents[] = [
                                    'DIV' => 'edit_event5_' . $siteList[$i]['ID'],
                                    'TAB' => Loc::getMessage('SMS4B_MAIN_SUB_TAB_TITLE_STANDART')
                                ];
                                $arTabsEvents[] = [
                                    'DIV' => 'edit_event6_' . $siteList[$i]['ID'],
                                    'TAB' => Loc::getMessage('SMS4B_MAIN_SUB_TAB_TITLE_SMS_CONTACT')
                                ];
                                $arTabsEvents[] = [
                                    'DIV' => 'edit_event7_' . $siteList[$i]['ID'],
                                    'TAB' => Loc::getMessage('SMS4B_MAIN_SUB_TAB_TITLE_FORGOTTEN_BASKETS')
                                ];

                                $tabEventsControl = new CAdminTabControl('tabEventsControl_' . $siteList[$i]['ID'], $arTabsEvents, false);
                                $tabEventsControl->Begin(); ?>
                                <?php $tabEventsControl->BeginNextTab(); ?>

                        <tr class='heading'>
                            <td colspan='2'><?= Loc::getMessage('SMS4B_MAIN_TAB_SEND') ?></td>
                        </tr>
                        <tr>
                            <td valign='center' align='right'><?php echo Loc::getMessage('SMS4B_MAIN_USE_TRANSLIT'); ?></td>
                            <td valign='top'><input type='checkbox' name='use_translit[<?= $siteList[$i]['ID'] ?>]'
                                                    value='Y'<?= ($useTranslit === 'Y' ? " checked = \"checked\" " : '') ?>/>
                            </td>
                        </tr>

                        <tr>
                            <td valign='center' align='right' width='50%'><?php echo Loc::getMessage('SMS4B_MAIN_OPT_DEFSENDER'); ?></td>
                            <td valign='top'>
                                <select name='defsender[<?= $siteList[$i]['ID'] ?>]'>
                                    <?php foreach ($arDefaultSender as $sender): ?>
                                        <option
                                            value='<?= $sender ?>'<?= ($sender === $defsender ? " selected=\"selected\"" : '') ?>><?= $sender ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <td valign='center' align='right'><?php echo Loc::getMessage('SMS4B_MAIN_USER_PHONE'); ?></td>
                            <td valign='top'>
                                <select name='user_property_phone[<?= $siteList[$i]['ID'] ?>]'>

                                    <?php foreach ($arUserPhone as $value): ?>
                                        <?php if (!empty($value)): ?>
                                            <option
                                                value='<?= $value ?>'<?= ($value === $defUserProperty ? " selected=\"selected\"" : '') ?>><?= $value ?></option>
                                        <?php endif; ?>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <input type='checkbox' id='ACTIVE_NIGHT_TIME_NS_<?= $siteList[$i]['ID'] ?>' name='ACTIVE_NIGHT_TIME_NS[<?= $siteList[$i]['ID'] ?>]' value='Y'
                                    <?php if (!empty($restrictedTime)): ?> checked <?php endif; ?> />
                                <label for='ACTIVE_NIGHT_TIME_NS_<?= $siteList[$i]['ID'] ?>'><?= Loc::getMessage('SMS4B_MAIN_NIGHT_TIME_NS') ?></label>
                            </td>
                            <script>
                                $('#ACTIVE_NIGHT_TIME_NS_<?= $siteList[$i]['ID'] ?>').click(function () {
                                    if ($(this).is(':checked') == true) {
                                        $('#DATE_FROM_NS_<?= $siteList[$i]['ID'] ?>').removeAttr('disabled');
                                        $('#DATE_TO_NS_<?= $siteList[$i]['ID'] ?>').removeAttr('disabled');
                                    }
                                    else {
                                        $('#DATE_FROM_NS_<?= $siteList[$i]['ID'] ?>').attr('disabled', true);
                                        $('#DATE_TO_NS_<?= $siteList[$i]['ID'] ?>').attr('disabled', true);
                                    }
                                });
                            </script>
                            <td>
                                <select id='DATE_FROM_NS_<?= $siteList[$i]['ID'] ?>'
                                        name='DATE_FROM_NS_<?= $siteList[$i]['ID'] ?>' <?php if (empty($restrictedTime)): ?> disabled <?php endif; ?>>
                                    <?php for ($s = 0; $s < 24; $s++): ?>
                                        <option
                                            value='<?= chr(65 + $s) ?>' <?php if (chr(65 + $s) == $restrictedTime[0]): ?> selected <?php endif; ?> >
                                            <?= $s ?>:00
                                        </option>
                                    <?php endfor; ?>
                                </select>
                                <?= Loc::getMessage('SMS4B_MAIN_NIGHT_TIME_TO') ?>
                                <select id='DATE_TO_NS_<?= $siteList[$i]['ID'] ?>'
                                        name='DATE_TO_NS_<?= $siteList[$i]['ID'] ?>' <?php if (empty($restrictedTime)): ?> disabled <?php endif; ?> >
                                    <?php for ($s = 0; $s < 24; $s++): ?>
                                        <option
                                            value='<?= chr(65 + $s) ?>' <?php if (chr(65 + $s) == $restrictedTime[1]): ?> selected <?php endif; ?> >
                                            <?= $s ?>:59
                                        </option>
                                    <?php endfor; ?>
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <td valign='top' align='right'><?php echo Loc::getMessage('SMS4B_MAIN_ADMIN_PHONE'); ?></td>
                            <td valign='top'><textarea name='admin_phone[<?= $siteList[$i]['ID'] ?>]' cols='20'
                                                       rows='3'><?= $admin_phone ?></textarea></td>
                        </tr>

                        <?php if (IsModuleInstalled('sale')): ?>
                            <?php $tabEventsControl->BeginNextTab(); ?>
                            <tr>
                                <td valign='center' align='right'><?php echo Loc::getMessage('SMS4B_MAIN_PHONE_NUMBER_CODE_SALE'); ?></td>
                                <td valign='top'>
                                    <select name='phone_number_code[<?= $siteList[$i]['ID'] ?>]'>
                                        <?php foreach ($orderProps as $code => $arProps): ?>
                                            <option
                                                value='<?= $code ?>'<?= ($code === $orderPhoneCode ? " selected=\"selected\"" : '') ?>>
                                                <?= $arProps[0]['NAME'] . (count($arProps) === 1 ? ' (' . $person[$arProps[0]['PERSON_TYPE_ID']] . ')' : '') ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                </td>
                            </tr>
                            <tr class='heading'>
                                <td align='center' colspan='2'><?= Loc::getMessage('SMS4B_MAIN_TAB_EVENTS_USER') ?></td>
                            </tr>
                            <tr>
                                <td align='center' colspan='2'>
                                    <table class='displayEvAdmin'>
                                        <tr>
                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'><?= Loc::getMessage('SMS4B_MAIN_TITLE_SALE') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_OPT_NEW_ORDER'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='event_sale_new_order[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($event_sale_new_order === 'Y' ? " checked = \"checked\" " : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_SALE_NEW_ORDER'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_OPT_ORDER_PAID'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='event_sale_order_paid[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($event_sale_order_paid === 'Y' ? " checked = \"checked\" " : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_SALE_ORDER_PAID'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_OPT_ORDER_DELIVERY'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='event_sale_order_delivery[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($event_sale_order_delivery === 'Y' ? " checked = \"checked\" " : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_SALE_ORDER_DELIVERY'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_OPT_ORDER_CANCEL'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='event_sale_order_cancel[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($event_sale_order_cancel === 'Y' ? " checked = \"checked\" " : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_SALE_ORDER_CANCEL'][0]['ID'] ?>
                                                                target=' _blank'
                                                            title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                </table>
                                            </td>

                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'><?= Loc::getMessage('SMS4B_MAIN_CH_STATUSES_SALE') ?></td>
                                                    </tr>
                                                    <?php foreach ($arSaleStatus['O'] as $status): ?>
                                                        <tr>
                                                            <td align='left'><?= $status['NAME'] ?></td>
                                                            <td><input type='checkbox'
                                                                       name='<?= key($status); ?>[<?= $siteList[$i]['ID'] ?>]'
                                                                       value='Y'<?= ($status[key($status)] === 'Y' ? " checked = \"checked\" " : '') ?>/>
                                                            </td>
                                                            <td valign='top'><a
                                                                    href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_SALE_STATUS_CHANGED_' . $status['ID']][0]['ID'] ?>'
                                                                    target='_blank'
                                                                    title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                        src='/bitrix/images/fileman/edit_text.gif'></a>
                                                            </td>
                                                        </tr>
                                                    <?php endforeach; ?>
                                                    </td></tr>
                                                </table>
                                            </td>

                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'><?= Loc::getMessage('SMS4B_MAIN_CH_STATUSES_SALE_DELIVERY') ?></td>
                                                    </tr>
                                                    <?php foreach ($arSaleStatus['D'] as $status): ?>
                                                        <tr>
                                                            <td align='left'><?= $status['NAME'] ?></td>
                                                            <td><input type='checkbox'
                                                                       name='<?= key($status); ?>[<?= $siteList[$i]['ID'] ?>]'
                                                                       value='Y'<?= ($status[key($status)] === 'Y' ? " checked = \"checked\" " : '') ?>/>
                                                            </td>
                                                            <td valign='top'><a
                                                                    href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_SALE_STATUS_CHANGED_' . $status['ID']][0]['ID'] ?>'
                                                                    target='_blank'
                                                                    title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                        src='/bitrix/images/fileman/edit_text.gif'></a>
                                                            </td>
                                                        </tr>
                                                    <?php endforeach; ?>
                                                    </td></tr>
                                                </table>
                                            </td>

                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr class='heading'>
                                <td colspan='2'><?= Loc::getMessage('SMS4B_MAIN_TAB_EVENTS_SHOP') ?></td>
                            </tr>
                            <tr>
                                <td align='center' colspan='2'>
                                    <table class='displayEvAdmin'>
                                        <tr>
                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'><?= Loc::getMessage('SMS4B_MAIN_TITLE_SALE') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_OPT_NEW_ORDER'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_event_sale_new_order[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_event_sale_new_order === 'Y' ? " checked = \"checked\" " : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_SALE_NEW_ORDER'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_OPT_ORDER_PAID'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_event_sale_order_paid[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_event_sale_order_paid === 'Y' ? " checked = \"checked\" " : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_SALE_ORDER_PAID'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_OPT_ORDER_DELIVERY'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_event_sale_order_delivery[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_event_sale_order_delivery === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_SALE_ORDER_DELIVERY'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_OPT_ORDER_CANCEL'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_event_sale_order_cancel[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_event_sale_order_cancel === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_SALE_ORDER_CANCEL'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                </table>
                                            </td>

                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'><?= Loc::getMessage('SMS4B_MAIN_CH_STATUSES_SALE') ?></td>
                                                    </tr>
                                                    <?php foreach ($arAdminStatus['O'] as $status): ?>
                                                        <tr>
                                                            <td align='left'><?= $status['NAME'] ?></td>
                                                            <td><input type='checkbox'
                                                                       name='<?= key($status); ?>[<?= $siteList[$i]['ID'] ?>]'
                                                                       value='Y'<?= ($status[key($status)] === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                            </td>
                                                            <td valign='top'><a
                                                                    href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_SALE_STATUS_CHANGED_' . $status['ID']][0]['ID'] ?>'
                                                                    target='_blank'
                                                                    title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                        src='/bitrix/images/fileman/edit_text.gif'></a>
                                                            </td>
                                                        </tr>
                                                    <?php endforeach; ?>
                                                    </td></tr>
                                                </table>
                                            </td>

                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'><?= Loc::getMessage('SMS4B_MAIN_CH_STATUSES_SALE_DELIVERY') ?></td>
                                                    </tr>
                                                    <?php foreach ($arAdminStatus['D'] as $status): ?>
                                                        <tr>
                                                            <td align='left'><?= $status['NAME'] ?></td>
                                                            <td><input type='checkbox'
                                                                       name='<?= key($status); ?>[<?= $siteList[$i]['ID'] ?>]'
                                                                       value='Y'<?= ($status[key($status)] === 'Y' ? " checked = \"checked\" " : '') ?>/>
                                                            </td>
                                                            <td valign='top'><a
                                                                        href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_SALE_STATUS_CHANGED_' . $status['ID']][0]['ID'] ?>'
                                                                        target='_blank'
                                                                        title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                            src='/bitrix/images/fileman/edit_text.gif'></a>
                                                            </td>
                                                        </tr>
                                                    <?php endforeach; ?>
                                                    </td></tr>
                                                </table>
                                            </td>

                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr class='heading'>
                                <td colspan='2'><?= Loc::getMessage('SMS4B_MAIN_TAB_CUSTOM_TEMPLATES') ?></td>
                            </tr>
                            <tr>
                                <td align='center' valign='top' colspan='2'>
                                    <table width='240px'>
                                        <tr class='heading'>
                                            <td colspan='3'><?= Loc::getMessage('SMS4B_MAIN_CUSTOM_TEMPLATES') ?></td>
                                        </tr>

                                        <script>
                                            $(function () {
                                                $('#createSms4bUserTemplateButton_<?=$siteList[$i]['ID']?>').click(function () {

                                                    BX.ajax({
                                                        method: 'POST',
                                                        url: '/bitrix/admin/sms4b_addTemplate.php',
                                                        data: {
                                                            text: '<?=Loc::getMessage('SMS4B_MAIN_USER_CUSTOM_TEMPLATE_TEXT')?>',
                                                            subject: '<?=Loc::getMessage('SMS4B_MAIN_USER_CUSTOM_TEMPLATE_SUBJECT')?>',
                                                            emailFrom: '<?=Loc::getMessage('SMS4B_MAIN_USER_CUSTOM_TEMPLATE_EMAIL_FROM')?>',
                                                            emailTo: '<?=Loc::getMessage('SMS4B_MAIN_USER_CUSTOM_TEMPLATE_EMAIL_TO')?>',
                                                            eventType: 'USER_CUSTOM_EVENT',
                                                            site: '<?=$siteList[$i]['ID']?>'
                                                        },
                                                        onsuccess: function (id) {
                                                            if (id > 0) {
                                                                $('#addOrderTemplateButton_<?=$siteList[$i]['ID']?>').before('<tr id="customTemplate' + id + '"><td valign="top" align="left"><?=Loc::getMessage('SMS4B_MAIN_USER_CUSTOM_TEMPLATE_TEXT')?></td>' +
                                                                    '<td valign="top"><a href="/bitrix/admin/message_edit.php?ID=' + id + '" target="_blank" title="<?=Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK')?>"><img src="/bitrix/images/fileman/edit_text.gif"></a></td>' +
                                                                    '<td valign="top"><a href="javascript:void(0);" id=\'' + id + '\' class=\'deleteSms4bTemplateButton\' title="<?=Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_DEL_LINK')?>"><img src="/bitrix/images/main/del.gif"></a></td></tr>'
                                                                );
                                                            }
                                                        }
                                                    })
                                                })

                                                $('body').on('click', '.deleteSms4bTemplateButton', function () {
                                                    var id = $(this).get(0).id;

                                                    BX.ajax({
                                                        method: 'POST',
                                                        url: '/bitrix/admin/sms4b_delTemplate.php',
                                                        data: {templateId: id},
                                                        onsuccess: function () {
                                                            $("#customTemplate" + id).remove();
                                                        }
                                                    })
                                                })
                                            })
                                        </script>
                                        <?php foreach ((array)$customOrderTemplates['SMS4B_USER_CUSTOM_EVENT'] as $val): ?>
                                            <tr id='customTemplate<?= $val['ID'] ?>'>
                                                <td valign='top' align='left'><?= $val['NAME']; ?></td>
                                                <td valign='top'><a
                                                        href='/bitrix/admin/message_edit.php?ID=<?= $val['ID'] ?>'
                                                        target='_blank'
                                                        title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                            src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                <td valign='top'><a href='javascript:void(0);' id='<?= $val['ID'] ?>'
                                                                    class='deleteSms4bTemplateButton'
                                                                    title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_DEL_LINK') ?>'><img
                                                            src='/bitrix/images/main/del.gif'></a></td>
                                            </tr>
                                        <?php endforeach; ?>

                                        <tr id='addOrderTemplateButton_<?=$siteList[$i]['ID']?>'>
                                            <td align='center' colspan='3'>
                                                <a id='createSms4bUserTemplateButton_<?=$siteList[$i]['ID']?>' hidefocus='true'
                                                   class='adm-btn'><?= Loc::getMessage('SMS4B_MAIN_ADD_CUSTOM_TEMPLATE') ?></a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>


                        <?php endif; ?>

                        <?php if (IsModuleInstalled('tasks')): ?>
                            <?php $tabEventsControl->BeginNextTab(); ?>
                            <?php if (!empty($arSonetGroups)): ?>
                            <tr>
                                <td valign='center' align='right'><?php echo Loc::getMessage('SMS4B_MAIN_WORK_GROUP_TASKS'); ?></td>
                                <td valign='top'>
                                    <select id='sms4b_wg_ids_<?= $siteList[$i]['ID'] ?>' size='4' multiple='multiple' name='workGroups_<?= $siteList[$i]['ID'] ?>[]'>
                                        <?php foreach ($arSonetGroups as $group): ?>
                                                <option <?= (!empty($group['ENABLE']) ? ' selected=\'selected\'' : '') ?>
                                                    value='<?= $group['ID'] ?>'><?= $group['NAME'] ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                    <a id='sms4b_wg_ch_all_<?= $siteList[$i]['ID'] ?>'
                                       style='cursor: default'><?= Loc::getMessage('SMS4B_MAIN_CH_ALL') ?></a>
                                </td>
                            </tr>

                            <script>
                                $(document).ready(function () {
                                    $('#sms4b_wg_ch_all_<?= $siteList[$i]['ID'] ?>').click(function () {
                                        $('#sms4b_wg_ids_<?= $siteList[$i]['ID'] ?> option').each(function () {
                                            this.selected = true;
                                        });
                                    });
                                });
                            </script>
                        <?php endif;
                        ?>

                            <tr class='heading'>
                                <td align='center' colspan='2'><?= Loc::getMessage('SMS4B_MAIN_TAB_EVENTS_USER') ?></td>
                            </tr>
                            <tr>
                                <td align='center' colspan='2'>
                                    <table class='displayEvAdmin'>
                                        <tr>
                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_ADD_TASK') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_LOW_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='add_low_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($add_low_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_TASK_ADD'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_MIDDLE_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='add_middle_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($add_middle_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_TASK_ADD'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_HIGHT_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='add_hight_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($add_hight_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_TASK_ADD'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                </table>
                                            </td>

                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'
                                                            align='center'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_UPDATE_TASK') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_LOW_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='update_low_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($update_low_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_TASK_UPDATE'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_MIDDLE_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='update_middle_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($update_middle_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_TASK_UPDATE'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_HIGHT_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='update_hight_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($update_hight_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_TASK_UPDATE'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                </table>
                                            </td>

                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'
                                                            align='center'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_DELETE_TASK') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_LOW_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='delete_low_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($delete_low_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_TASK_DELETE'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_MIDDLE_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='delete_middle_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($delete_middle_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_TASK_DELETE'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_HIGHT_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='delete_hight_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($delete_hight_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_TASK_DELETE'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                </table>
                                            </td>

                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'
                                                            align='center'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_TASK_HANDLER') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_INTERCEPT_DEADLINE'); ?>
                                                            <a href='/bitrix/admin/agent_edit.php?ID=<?= $sms4b->GetCurrentOption('deadline_agent_id'); ?>'
                                                               target='_blank'>
                                                                <mark title='<?= Loc::getMessage('SMS4B_MAIN_INTERCEPT_HELP') ?>'>
                                                                    [?]
                                                                </mark>
                                                            </a></td>

                                                        <td valign='top'><input type='checkbox'
                                                                                name='intercept_deadline[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($intercept_deadline === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_TASK_INTERCEPT_DEADLINE'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_NEW_COMM_FROM_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='new_comment_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($new_comment_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_NEW_COMMENT_TASK'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr class='heading'>
                                <td colspan='2'><?= Loc::getMessage('SMS4B_MAIN_TAB_EVENTS_SHOP') ?></td>
                            </tr>
                            <tr>
                                <td align='center' colspan='2'>
                                    <table class='displayEvAdmin'>
                                        <tr>
                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_ADD_TASK') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_LOW_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_add_low_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_add_low_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_TASK_ADD'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_MIDDLE_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_add_middle_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_add_middle_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_TASK_ADD'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_HIGHT_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_add_hight_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_add_hight_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_TASK_ADD'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                </table>
                                            </td>

                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'
                                                            align='center'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_UPDATE_TASK') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_LOW_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_update_low_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_update_low_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_TASK_UPDATE'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_MIDDLE_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_update_middle_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_update_middle_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_TASK_UPDATE'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_HIGHT_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_update_hight_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_update_hight_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_TASK_UPDATE'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                </table>
                                            </td>

                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'
                                                            align='center'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_DELETE_TASK') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_LOW_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_delete_low_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_delete_low_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_TASK_DELETE'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_MIDDLE_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_delete_middle_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_delete_middle_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_TASK_DELETE'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_HIGHT_TASK'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_delete_hight_task[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_delete_hight_task === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_TASK_DELETE'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        <?php endif; ?>

                        <?php if (IsModuleInstalled('crm')): ?>
                            <?php $tabEventsControl->BeginNextTab(); ?>
                            <tr class='heading'>
                                <td align='center' colspan='2'><?= Loc::getMessage('SMS4B_MAIN_TAB_EVENTS_USER') ?></td>
                            </tr>
                            <tr>
                                <td align='center' colspan='2'>
                                    <table class='displayEvAdmin'>
                                        <tr>
                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_LEAD_CRM') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?= Loc::getMessage('SMS4B_MAIN_ADD_LEAD_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='add_lead_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($add_lead_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADD_LEAD_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?= Loc::getMessage('SMS4B_MAIN_CHANGE_LEAD_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='update_lead_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($update_lead_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_UPDATE_LEAD_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?= Loc::getMessage('SMS4B_MAIN_DEL_LEAD_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='delete_lead_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($delete_lead_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_DELETE_LEAD_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr class='heading'>
                                                        <td colspan='3'
                                                            align='center'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_DEAL_CRM') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_ADD_DEAL_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='add_deal_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($add_deal_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADD_DEAL_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_CHANGE_DEAL_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='update_deal_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($update_deal_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_UPDATE_DEAL_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                </table>
                                            </td>
                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'
                                                            align='center'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_CHANGE_LEAD_STATUS_CRM') ?></td>
                                                    </tr>
                                                    <?php foreach (CCrmStatus::GetStatusListEx('STATUS') as $id => $title): ?>
                                                        <tr>
                                                            <td valign='top' align='left'><?= $title; ?></td>
                                                            <td valign='top'><input type='checkbox'
                                                                                    name='change_stat_lead_crm_<?= $id ?>[<?= $siteList[$i]['ID'] ?>]'
                                                                                    value='Y'<?= ($change_stat_lead_crm[$id] === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                            </td>
                                                            <td valign='top'><a
                                                                    href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_CHANGE_STAT_LEAD_CRM_' . $id][0]['ID'] ?>'
                                                                    target='_blank'
                                                                    title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                        src='/bitrix/images/fileman/edit_text.gif'></a>
                                                            </td>
                                                        </tr>
                                                    <?php endforeach; ?>
                                                </table>
                                            </td>
                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'
                                                            align='center'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_CHANGE_DEAL_STATUS_CRM') ?></td>
                                                    </tr>
                                                    <?php foreach (CCrmStatus::GetStatusListEx('DEAL_STAGE') as $id => $title): ?>
                                                        <tr>
                                                            <td valign='top' align='left'><?= $title; ?></td>
                                                            <td valign='top'><input type='checkbox'
                                                                                    name='change_stat_deal_crm_<?= $id ?>[<?= $siteList[$i]['ID'] ?>]'
                                                                                    value='Y'<?= ($change_stat_deal_crm[$id] === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                            </td>
                                                            <td valign='top'><a
                                                                    href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_CHANGE_STAT_DEAL_CRM_' . $id][0]['ID'] ?>'
                                                                    target='_blank'
                                                                    title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                        src='/bitrix/images/fileman/edit_text.gif'></a>
                                                            </td>
                                                        </tr>
                                                    <?php endforeach; ?>
                                                </table>
                                            </td>
                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_CONTACT_CRM') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?= Loc::getMessage('SMS4B_MAIN_ADD_CONTACT_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='add_contact_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($add_contact_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADD_CONTACT_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?= Loc::getMessage('SMS4B_MAIN_CHANGE_CONTACT_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='update_contact_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($update_contact_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_UPDATE_CONTACT_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>

                                                    <tr class='heading'>
                                                        <td colspan='3'
                                                            align='center'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_ACTIVITY_CRM') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_REMIND_EVENT_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='remind_event_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($remind_event_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_REMIND_EVENT_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr class='heading'>
                                <td colspan='2'><?= Loc::getMessage('SMS4B_MAIN_TAB_EVENTS_SHOP') ?></td>
                            </tr>
                            <tr>
                                <td align='center' colspan='2'>
                                    <table class='displayEvAdmin'>
                                        <tr>
                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_LEAD_CRM') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?= Loc::getMessage('SMS4B_MAIN_ADD_LEAD_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_add_lead_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_add_lead_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_ADD_LEAD_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?= Loc::getMessage('SMS4B_MAIN_CHANGE_LEAD_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_update_lead_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_update_lead_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_UPDATE_LEAD_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?= Loc::getMessage('SMS4B_MAIN_DEL_LEAD_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_delete_lead_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_delete_lead_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_DELETE_LEAD_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr class='heading'>
                                                        <td colspan='3'
                                                            align='center'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_DEAL_CRM') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_ADD_DEAL_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_add_deal_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_add_deal_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_ADD_DEAL_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_CHANGE_DEAL_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_update_deal_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_update_deal_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_UPDATE_DEAL_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                </table>
                                            </td>
                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'
                                                            align='center'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_CHANGE_LEAD_STATUS_CRM') ?></td>
                                                    </tr>
                                                    <?php foreach (CCrmStatus::GetStatusListEx('STATUS') as $id => $title): ?>
                                                        <tr>
                                                            <td valign='top' align='left'><?= $title; ?></td>
                                                            <td valign='top'><input type='checkbox'
                                                                                    name='admin_change_stat_lead_crm_<?= $id ?>[<?= $siteList[$i]['ID'] ?>]'
                                                                                    value='Y'<?= ($admin_change_stat_lead_crm[$id] === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                            </td>
                                                            <td valign='top'><a
                                                                    href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_CHANGE_STAT_LEAD_CRM_' . $id][0]['ID'] ?>'
                                                                    target='_blank'
                                                                    title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                        src='/bitrix/images/fileman/edit_text.gif'></a>
                                                            </td>
                                                        </tr>
                                                    <?php endforeach; ?>
                                                </table>
                                            </td>
                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'
                                                            align='center'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_CHANGE_DEAL_STATUS_CRM') ?></td>
                                                    </tr>
                                                    <?php foreach (CCrmStatus::GetStatusListEx('DEAL_STAGE') as $id => $title): ?>
                                                        <tr>
                                                            <td valign='top' align='left'><?= $title; ?></td>
                                                            <td valign='top'><input type='checkbox'
                                                                                    name='admin_change_stat_deal_crm_<?= $id ?>[<?= $siteList[$i]['ID'] ?>]'
                                                                                    value='Y'<?= ($admin_change_stat_deal_crm[$id] === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                            </td>
                                                            <td valign='top'><a
                                                                    href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_CHANGE_STAT_DEAL_CRM_' . $id][0]['ID'] ?>'
                                                                    target='_blank'
                                                                    title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                        src='/bitrix/images/fileman/edit_text.gif'></a>
                                                            </td>
                                                        </tr>
                                                    <?php endforeach; ?>
                                                </table>
                                            </td>
                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_CONTACT_CRM') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?= Loc::getMessage('SMS4B_MAIN_ADD_CONTACT_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_add_contact_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_add_contact_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_ADD_CONTACT_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?= Loc::getMessage('SMS4B_MAIN_CHANGE_CONTACT_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_update_contact_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_update_contact_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_UPDATE_CONTACT_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>

                                                    <tr class='heading'>
                                                        <td colspan='3'
                                                            align='center'><?= Loc::getMessage('SMS4B_MAIN_TAB_TITLE_ACTIVITY_CRM') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_REMIND_EVENT_CRM'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_remind_event_crm[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_remind_event_crm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_REMIND_EVENT_CRM'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        <?php endif; ?>

                        <?php if (IsModuleInstalled('voximplant')): ?>
                            <?php $tabEventsControl->BeginNextTab(); ?>
                            <tr class='heading'>
                                <td align='center' colspan='2'><?= Loc::getMessage('SMS4B_MAIN_TAB_EVENTS_IM') ?></td>
                            </tr>
                            <tr>
                                <td align='center' colspan='2'>
                                    <table class='displayEvAdmin'>
                                        <tr>
                                            <td valign='top'>
                                                <table width='240px'>
                                                    <tr class='heading'>
                                                        <td colspan='3'><?= Loc::getMessage('SMS4B_MAIN_TITLE_IM') ?></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_OPT_AUTOANSWER'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='event_autoanswer[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($event_autoanswer === 'Y' ? " checked = \"checked\" " : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_AUTOANSWER'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_OPT_MISSED_CALL_NOTIFICATION'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='event_missed_call[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($event_missed_call === 'Y' ? " checked = \"checked\" " : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_MISSED_CALL'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                        <?php endif; ?>

                        <?php $tabEventsControl->BeginNextTab(); ?>
                        <tr class='heading'>
                            <td align='center' colspan='2'><?= Loc::getMessage('SMS4B_MAIN_TAB_EVENTS_USER') ?></td>
                        </tr>
                        <tr>
                            <td align='center' colspan='2'>
                                <table class='displayEvAdmin'>
                                    <tr>
                                        <td valign='top'>
                                            <table width='240px'>
                                                <tr class='heading'>
                                                    <td colspan='4'><?= Loc::getMessage('SMS4B_MAIN_TITLE_OTHER') ?></td>
                                                </tr>
                                                <tr>
                                                    <td valign='top'
                                                        align='left'><?php echo Loc::getMessage('SMS4B_MAIN_OPT_SUBSCRIBE_CONFIRM'); ?></td>
                                                    <td valign='top'>
                                                        <input type='checkbox'
                                                               name='event_subscribe_confirm[<?= $siteList[$i]['ID'] ?>]'
                                                               value='Y'<?= ($event_subscribe_confirm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                    </td>
                                                    <td valign='top'><a
                                                            href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_SUBSCRIBE_CONFIRM'][0]['ID'] ?>'
                                                            target='_blank'
                                                            title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                </tr>
                                                <?php if (IsModuleInstalled('support')): ?>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_OPT_TICKET_NEW_FOR_TECHSUPPORT'); ?></td>
                                                        <td valign='top'>
                                                            <input type='checkbox'
                                                                   name='event_ticket_new_for_techsupport[<?= $siteList[$i]['ID'] ?>]'
                                                                   value='Y'<?= ($event_ticket_new_for_techsupport === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_TICKET_NEW_FOR_TECHSUPPORT'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_TICKET_CHANGE_FOR_TECHSUPPORT'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                <?php endif; ?>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr class='heading'>
                            <td colspan='2'><?= Loc::getMessage('SMS4B_MAIN_TAB_EVENTS_SHOP') ?></td>
                        </tr>
                        <tr>
                            <td align='center' colspan='2'>
                                <table class='displayEvAdmin'>
                                    <tr>
                                        <td valign='top'>
                                            <table width='240px'>
                                                <tr class='heading'>
                                                    <td colspan='4'><?= Loc::getMessage('SMS4B_MAIN_TITLE_OTHER') ?></td>
                                                </tr>
                                                <tr>
                                                    <td valign='top'
                                                        align='left'><?php echo Loc::getMessage('SMS4B_MAIN_OPT_SUBSCRIBE_CONFIRM'); ?></td>
                                                    <td valign='top'><input type='checkbox'
                                                                            name='admin_event_subscribe_confirm[<?= $siteList[$i]['ID'] ?>]'
                                                                            value='Y'<?= ($admin_event_subscribe_confirm === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                    </td>
                                                    <td valign='top'><a
                                                            href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_SUBSCRIBE_CONFIRM'][0]['ID'] ?>'
                                                            target='_blank'
                                                            title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                </tr>

                                                <?php if (IsModuleInstalled('support')): ?>
                                                    <tr>
                                                        <td valign='top'
                                                            align='left'><?php echo Loc::getMessage('SMS4B_MAIN_OPT_TICKET_NEW_FOR_TECHSUPPORT'); ?></td>
                                                        <td valign='top'><input type='checkbox'
                                                                                name='admin_event_ticket_new_for_techsupport[<?= $siteList[$i]['ID'] ?>]'
                                                                                value='Y'<?= ($admin_event_ticket_new_for_techsupport === 'Y' ? ' checked = \'checked\' ' : '') ?>/>
                                                        </td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_TICKET_NEW_FOR_TECHSUPPORT'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                        <td valign='top'><a
                                                                href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_ADMIN_TICKET_CHANGE_FOR_TECHSUPPORT'][0]['ID'] ?>'
                                                                target='_blank'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                                    src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                                    </tr>
                                                <?php endif; ?>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <tr class='heading'>
                            <td colspan='2'><?= Loc::getMessage('SMS4B_MAIN_TAB_CUSTOM_USER_TEMPLATES') ?></td>
                        </tr>
                        <tr>
                            <td align='center' valign='top' colspan='2'>
                                <table width='240px'>
                                    <tr class='heading'>
                                        <td colspan='3'><?= Loc::getMessage('SMS4B_MAIN_CUSTOM_TEMPLATES') ?></td>
                                    </tr>

                                    <script>
                                        $(function () {
                                            $('#createSms4bTemplateButton_<?=$siteList[$i]['ID']?>').click(function () {
                                                BX.ajax({
                                                    method: 'POST',
                                                    url: '/bitrix/admin/sms4b_addTemplate.php',
                                                    data: {
                                                        text: '<?=Loc::getMessage('SMS4B_MAIN_USER_CUSTOM_TEMPLATE_TEXT')?>',
                                                        subject: '<?=Loc::getMessage('SMS4B_MAIN_USER_CUSTOM_TEMPLATE_SUBJECT')?>',
                                                        emailFrom: '<?=Loc::getMessage('SMS4B_MAIN_USER_CUSTOM_TEMPLATE_EMAIL_FROM')?>',
                                                        emailTo: '<?=Loc::getMessage('SMS4B_MAIN_USER_CUSTOM_TEMPLATE_EMAIL_TO')?>',
                                                        eventType: 'USER_LIST_CUSTOM_EVENT',
                                                        site: '<?=$siteList[$i]['ID']?>'
                                                    },
                                                    onsuccess: function (id) {
                                                        if (id > 0) {
                                                            $('.addUserTemplateButton').before('<tr id="customTemplate' + id + '"><td valign="top" align="left"><?=Loc::getMessage('SMS4B_MAIN_USER_CUSTOM_TEMPLATE_TEXT')?></td>' +
                                                                '<td valign="top"><a href="/bitrix/admin/message_edit.php?ID=' + id + '" target="_blank" title="<?=Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK')?>"><img src="/bitrix/images/fileman/edit_text.gif"></a></td>' +
                                                                '<td valign="top"><a href="javascript:void(0);" id=\'' + id + '\' class=\'deleteSms4bTemplateButton\' title="<?=Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_DEL_LINK')?>"><img src="/bitrix/images/main/del.gif"></a></td></tr>'
                                                            );
                                                        }
                                                    }
                                                })
                                            })

                                            $('body').on('click', '.deleteSms4bTemplateButton', function () {
                                                var id = $(this).get(0).id;

                                                BX.ajax({
                                                    method: 'POST',
                                                    url: '/bitrix/admin/sms4b_delTemplate.php',
                                                    data: {templateId: id},
                                                    onsuccess: function () {
                                                        $("#customTemplate" + id).remove();
                                                    }
                                                })
                                            })
                                        })
                                    </script>
                                    <?php foreach ((array)$customUserTemplates['SMS4B_USER_LIST_CUSTOM_EVENT'] as $val): ?>
                                        <tr id='customTemplate<?= $val['ID'] ?>'>
                                            <td valign='top' align='left'><?= $val['NAME']; ?></td>
                                            <td valign='top'><a
                                                    href='/bitrix/admin/message_edit.php?ID=<?= $val['ID'] ?>'
                                                    target='_blank'
                                                    title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_LINK') ?>'><img
                                                        src='/bitrix/images/fileman/edit_text.gif'></a></td>
                                            <td valign='top'><a href='javascript:void(0);' id='<?= $val['ID'] ?>'
                                                                class='deleteSms4bTemplateButton'
                                                                title='<?= Loc::getMessage('SMS4B_MAIN_TITLE_HANDLER_DEL_LINK') ?>'><img
                                                        src='/bitrix/images/main/del.gif'></a></td>
                                        </tr>
                                    <?php endforeach; ?>

                                    <tr class='addUserTemplateButton'>
                                        <td align='center' colspan='3'>
                                            <a id='createSms4bTemplateButton_<?=$siteList[$i]['ID']?>' hidefocus='true'
                                               class='adm-btn'><?= Loc::getMessage('SMS4B_MAIN_ADD_CUSTOM_TEMPLATE') ?></a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <?php $tabEventsControl->BeginNextTab(); ?>

                        <tr class='heading'>
                            <td colspan="2"><?= GetMessage('SMS4B_TAB_SEND') ?></td>
                        </tr>

                        <tr>
                            <td valign='center' align='right' width="50%"><?echo GetMessage('SMS4B_CONTACTS_COMPANY');?></td>
                            <td valign='top'><textarea name="contacts_company[<?=$siteList[$i]['ID']?>]" cols="20" style="width: 350px; height: 100px;"><?=$contacts_company?></textarea></td>
                        </tr>
                        <tr>
                            <td valign='top' align='right'><?echo GetMessage('SMS4B_THE_BUTTON_LABEL');?></td>
                            <td valign='top'><input type="text" name="the_button_label[<?=$siteList[$i]['ID']?>]" value="<?=$the_button_label?>" style="width: 350px;"></td>
                        </tr>
                        <tr>
                            <td valign='top' align='right'><?echo GetMessage('SMS4B_QUANTITY_SEND');?></td>
                            <td valign='top'><input type="text" name="quantity_send[<?=$siteList[$i]['ID']?>]" value="<?=$quantity_send?>"></td>
                        </tr>
                        <tr>
                            <td valign='top' align='right'><?echo GetMessage('SMS4B_EXCEPTIONS_NUMBERS');?></td>
                            <td valign='top'><textarea name="exceptions_numbers[<?=$siteList[$i]['ID']?>]" cols="20" style="width: 350px; height: 70px;"><?=$exceptions_numbers?></textarea></td>
                        </tr>

                        <?php if (IsModuleInstalled('sale')):

                            $tabEventsControl->BeginNextTab(); ?>

                            <?php foreach($arForgottenBaskets as $number => $options): ?>

                                <tr class='heading'>
                                    <td colspan="2"><?= GetMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS').$number ?></td>
                                </tr>

                                <tr>
                                    <td valign='center' align='right'>
                                        <?php echo Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_ACTIVE'); ?>
                                    </td>
                                    <td valign='top'>
                                        <input type='checkbox'
                                               name='send_forgotten_baskets_active_<?=$number?>[<?= $siteList[$i]['ID'] ?>]'
                                               value='Y'<?= ($options['active'] === 'Y' ? " checked = \"checked\" " : '') ?>
                                        />
                                    </td>
                                </tr>

                                <tr>
                                    <td valign='top' align='right'>
                                        <?php echo GetMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_MINUTES'); ?>
                                    </td>
                                    <td valign='top'>
                                        <input type="text"
                                               name="send_forgotten_baskets_minutes_<?=$number?>[<?= $siteList[$i]['ID'] ?>]"
                                               value="<?php echo $options['minutes']; ?>"
                                               style="width: 350px;">
                                    </td>
                                </tr>

                                <tr>
                                    <td valign='top' align='left'>
                                        <?php echo Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE'); ?>
                                    </td>
                                    <td valign='top' align='left'>
                                        <a
                                            href='/bitrix/admin/message_edit.php?ID=<?= $allTemplates['SMS4B_SEND_FORGOTTEN_BASKETS_'.$number][0]['ID'] ?>'
                                            target='_blank'
                                            title='<?= Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE') ?>'><img
                                                src='/bitrix/images/fileman/edit_text.gif'>
                                        </a>
                                    </td>
                                </tr>

                        <?php endforeach;?>

                        <?php endif; ?>

                        <?php $tabEventsControl->End(); ?>
                    </table>
                    <?php
                endfor;
                $tabControl3->End();
                ?>
            </td>
        </tr><?php
        //sms event
        $tabControl->BeginNextTab(); ?>
        <?php
        //now only ro russia
        $arFilter = [
            'LID' => 'ru'
        ];
        $obEvents = CEventType::GetList($arFilter);
        while ($arEvent = $obEvents->Fetch()) {
            if (strstr($arEvent['EVENT_NAME'], 'SMS4B')  //all events sms4b
                //skip events that are already customised by module
                || $arEvent['EVENT_NAME'] === 'SALE_ORDER_PAID'
                || $arEvent['EVENT_NAME'] === 'SALE_ORDER_DELIVERY'
                || $arEvent['EVENT_NAME'] === 'SALE_ORDER_CANCEL'
                || $arEvent['EVENT_NAME'] === 'SALE_NEW_ORDER'
                || strstr($arEvent['EVENT_NAME'], 'SALE_STATUS_CHANGED')
                || strstr($arEvent['EVENT_NAME'], 'SUBSCRIBE_CONFIRM')
                || strstr($arEvent['EVENT_NAME'], 'TICKET_NEW_FOR_TECHSUPPORT')
                || strstr($arEvent['EVENT_NAME'], 'TICKET_CHANGE_FOR_TECHSUPPORT')
            ) {
                $eventTypes[] = $arEvent['EVENT_NAME'];
                if (strstr($arEvent['EVENT_NAME'], 'SMS4B')) {
                    $sms4bEvents[] = $arEvent['EVENT_NAME'];
                }
            } else {
                $arEvents[] = $arEvent;
            }
        }
        /* Find all events*/
        foreach ($siteList as $val) {
            $arFilter = [
                'SITE_ID' => $val['ID'],
                'ACTIVE' => 'Y',
            ];
            $dbMess = CEventMessage::GetList($by = 'site_id', $order = 'desc', $arFilter);
            while ($arMessage = $dbMess->Fetch()) {
                $arTemplateEvent[$val['ID']][] = $arMessage['EVENT_NAME'];
            }
            $arTemplateEvent[$val['ID']] = array_unique($arTemplateEvent[$val['ID']]);
        }

        ?>
        <tr>
            <td>
                <?php
                $aTabs2 = [];
                foreach ($siteList as $val) {
                    $aTabs2[] = [
                        'DIV' => 'template' . $val['ID'],
                        'TAB' => '[' . $val['ID'] . '] ' . $val['NAME'],
                        'TITLE' => Loc::getMessage('SMS4B_MAIN_TAB_TITLE_EMAIL_EVENTS') . ' [' . $val['ID'] . '] ' . $val['NAME']
                    ];
                }
                $tabControl2 = new CAdminViewTabControl('tabControl2', $aTabs2);
                $tabControl2->Begin();

                foreach ($siteList as $val) {
                    $tabControl2->BeginNextTab();

                    ?>
                    <div class='site' data-site='<?= $val['ID'] ?>'>
                        <table class='display' width='100%'>
                            <thead align='left'>
                            <th width='5%'><?= Loc::getMessage('SMS4B_MAIN_TABLE_EMAIL_SMS') ?></th>
                            <th width='30%'><?= Loc::getMessage('SMS4B_MAIN_TABLE_EMAIL_TYPE') ?></th>
                            <th><?= Loc::getMessage('SMS4B_MAIN_TABLE_EMAIL_NAME') ?></th>
                            </thead>
                            <?php foreach ($arEvents as $event): ?>
                                <tr class='gradeU'>
                                    <td align='center'>
                                        <?php if (in_array('SMS4B_' . $event['EVENT_NAME'],
                                            $arTemplateEvent[$val['ID']])): ?>
                                            <img src='/bitrix/images/workflow/green.gif' width='14' height='14'
                                                 border='0' alt='<?= Loc::getMessage('SMS4B_MAIN_TABLE_EMAIL_SMS_EXISTS') ?>'
                                                 title='<?= Loc::getMessage('SMS4B_MAIN_TABLE_EMAIL_SMS_EXISTS') ?>'>
                                            <?php
                                        else: ?>
                                        <?php endif; ?>
                                    </td>
                                    <td><a href='#' class='click' data-event='<?= $event['ID'] ?>'
                                           title='<?= Loc::getMessage('SMS4B_MAIN_TABLE_EMAIL_SMS_CLICK') ?>'><?= $event['EVENT_NAME'] ?></a>
                                    </td>
                                    <td><a href='#' class='click' data-event='<?= $event['ID'] ?>'
                                           title='<?= Loc::getMessage('SMS4B_MAIN_TABLE_EMAIL_SMS_CLICK') ?>'><?= $event['NAME'] ?></a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </table>
                    </div>
                <?php } ?>

            </td>
        </tr>
        <?php
        $tabControl2->End();
        ?>
        <div id='ajax-add-answer'></div>
        <script>
            $(document).ready(function () {
                $('.display').dataTable({
                    'bPaginate': false,
                    'bLengthChange': false,
                    'bFilter': true,
                    'bSort': true,
                    'aaSorting': [[1, 'asc']],
                    'bInfo': false,
                    'bAutoWidth': false,
                    'oLanguage': {
                        'sZeroRecords': '<?=Loc::getMessage('SMS4B_MAIN_TABLE_EMAIL_NO_ELEMENTS')?>',
                        'sSearch': '<?=Loc::getMessage('SMS4B_MAIN_TABLE_EMAIL_SEARCH')?>'
                    }
                });
               //@todo todo window modal and center it
                $('.click').click(function (e) {
                    var windowId = $(this).data('event');
                    e.preventDefault();

                    var addTemplate = '';

                    var addTemplate = BX.PopupWindowManager.create(windowId, this, {
                        content   : BX('ajax-add-answer'),
                        closeIcon : {right: '20px', top: '10px'},
                        titleBar  : {
                            content: BX.create('span', {
                                html   : '<b><?=Loc::getMessage('SMS4B_MAIN_TABLE_EMAIL_POPUP_TITLE')?></b>',
                                'props': {'className': 'access-title-bar'}
                            })
                        },
                        zIndex    : 0,
                        offsetLeft: 0,
                        offsetTop : 0,
                        draggable : {restrict: true},
                        buttons   : [
                            new BX.PopupWindowButton({
                                text     : '<?=Loc::getMessage('SMS4B_MAIN_TABLE_EMAIL_SAVE')?>',
                                className: 'popup-window-button-accept',
                                id       : 'sms4b-popup-window-button-accept',
                                events   : {
                                    click: function () {
                                        BX.ajax.submit(BX('myForm'), function (data) {
                                            BX('ajax-add-answer').innerHTML = data;
                                        });
                                        $('#sms4b-popup-window-button-accept').hide();
                                    }
                                }
                            }),
                            new BX.PopupWindowButton({
                                text     : '<?=Loc::getMessage('SMS4B_MAIN_TABLE_EMAIL_CLOSE')?>',
                                className: 'webform-button-link-cancel',
                                events   : {
                                    click: function () {
                                        this.popupWindow.close();
                                    }
                                }
                            })
                        ]
                    });

                    var addlink = '/bitrix/admin/sms4b_main_addtemplate.php?eventID=' + $(this).data('event') + '&site=' + $(this).parents('div.site').data('site');
                    BX.ajax.insertToNode(addlink, BX('ajax-add-answer'));
                    addTemplate.show();
                });
            });
        </script>
        <?php $tabControl->BeginNextTab(); ?>
        <?php echo Loc::getMessage('SMS4B_MAIN_TAB_API_DATA'); ?>
        <?php $tabControl->BeginNextTab(); ?>
        <?php echo Loc::getMessage('SMS4B_MAIN_HELP'); ?>

        <?php $tabControl->BeginNextTab(); ?>
        <?php if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_REQUEST['submit_button'] && $_REQUEST['ticket_text']) {
            $info = CModule::CreateModuleObject($module_id);

            $text = $_REQUEST['ticket_text'] . PHP_EOL . PHP_EOL;

            $text .= Loc::getMessage('SMS4B_MAIN_SERVER') . ': ' . $_SERVER['HTTP_HOST'] . PHP_EOL .
                Loc::getMessage('SMS4B_MAIN_SENDER') . ': ' . $_REQUEST['email'] . PHP_EOL .
                Loc::getMessage('SMS4B_MAIN_MODULE_ID') . ': ' . $module_id . PHP_EOL .
                Loc::getMessage('SMS4B_MAIN_VERSION') . ': ' . $info->MODULE_VERSION . PHP_EOL .
                Loc::getMessage('SMS4B_MAIN_INFO_PRODUCT') . ': ' . Loc::getMessage('SMS4B_MAIN_INFO_PRODUCT_NAME_'
                    . COption::GetOptionString('main', 'vendor', '1c_bitrix')) . PHP_EOL .
                Loc::getMessage('SMS4B_MAIN_LOGIN') . ': ' . COption::GetOptionString($module_id, 'login') . PHP_EOL;

            if (mail('info@sms4b.ru', Loc::getMessage('SMS4B_MAIN_EMAIL_SUBJECT') . $_SERVER['HTTP_HOST'], $text)) {
                $message = new CAdminMessage([
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_SEND_MAIL_TO_SUPPORT_SUCCESS'),
                    'TYPE' => 'OK',
                    'HTML' => true
                ]);
            } else {
                $message = new CAdminMessage([
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_SEND_MAIL_TO_SUPPORT_FAIL'),
                    'TYPE' => 'ERROR',
                    'HTML' => true
                ]);
            }
            echo $message->Show();
        }

        ?>
        <tr>
            <td align='right' width='30%'><span class='required'>*</span><?= Loc::getMessage('SMS4B_MAIN_NAME') ?></td>
            <td><input type='text' name='fio'/></td>
        </tr>
        <tr>
            <td align='right' width='30%'><span class='required'>*</span><?= Loc::getMessage('SMS4B_MAIN_EMAIL') ?></td>
            <td><input type='text' name='email' value='<?= COption::GetOptionString('main', 'email_from') ?>'/></td>
        </tr>
        <tr>
            <td align='right' width='30%'><span class='required'>*</span><?= Loc::getMessage('SMS4B_MAIN_ABOUT') ?><br>
                <small><?= Loc::getMessage('SMS4B_MAIN_ERROR') ?></small>
            </td>
            <td><textarea name='ticket_text' rows='6' cols='60'></textarea></td>
        </tr>
        <tr>
            <td></td>
            <td><input type='submit' name='submit_button' value='<?= Loc::getMessage('SMS4B_MAIN_SUBMIT'); ?>'></td>
        </tr>

        <?php $tabControl->BeginNextTab(); ?>
        <?php require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/admin/group_rights.php'); ?>

        <?php $tabControl->BeginNextTab(); ?>
        <?php if ($REQUEST_METHOD === 'POST' && strlen($_REQUEST['clean_log']) > 0 && check_bitrix_sessid()) {
            $debugService->cleanLogFile();
        }

        if ($log_enable === 'Y') {
            $message = new CAdminMessage([
                'MESSAGE' => Loc::getMessage('SMS4B_MAIN_LOG_ENABLE'),
                'TYPE' => 'OK',
                'HTML' => true
            ]);
        } else {
            $message = new CAdminMessage([
                'MESSAGE' => Loc::getMessage('SMS4B_MAIN_LOG_DISABLE'),
                'TYPE' => 'ERROR',
                'HTML' => true
            ]);
        }
        echo $message->Show();
        ?>

        <p><textarea id='logData' name='logData' cols='200' rows='40'><?= $debugService->getLogData(); ?></textarea></p>
        <p><input type='checkbox' name='log_enable'
                  value='Y' <?= ($log_enable === 'Y' ? 'checked' : '') ?>><?php echo Loc::getMessage('SMS4B_MAIN_TAB_ENABLE_LOG'); ?>
            <br>
        <p>
            <input type='submit' name='clean_log' value='<?= Loc::getMessage('SMS4B_MAIN_CLEAN_LOG') ?>'
                   title='<?= Loc::getMessage('SMS4B_MAIN_CLEAN_LOG_DESC') ?>'>
            <input type='submit' name='update_log' value='<?= Loc::getMessage('SMS4B_MAIN_UP_LOG') ?>'
                   title='<?= Loc::getMessage('SMS4B_MAIN_UP_LOG_DESC') ?>'>
        </p>

        <?php $tabControl->Buttons(); ?>
        <input <?php if ($groupRight < 'W') echo 'disabled' ?> type='submit' name='Update'
                                                            value='<?= GetMessage('MAIN_SAVE') ?>'
                                                            title='<?= GetMessage('MAIN_OPT_SAVE_TITLE') ?>'>
        <?php if (strlen($_REQUEST['back_url_settings']) > 0): ?>
            <input type='button' name='Cancel' value='<?= GetMessage('MAIN_OPT_CANCEL') ?>'
                   title='<?= GetMessage('MAIN_OPT_CANCEL_TITLE') ?>'
                   onclick='window.location='<?= htmlspecialchars(CUtil::addslashes($_REQUEST['back_url_settings'])) ?>''>
            <input type='hidden' name='back_url_settings'
                   value='<?= htmlspecialchars($_REQUEST['back_url_settings']) ?>'>
        <?php endif ?>
        <input <?php if ($groupRight < 'W') echo 'disabled' ?> type='submit' name='RestoreDefaults'
                                                            title='<?= GetMessage('MAIN_HINT_RESTORE_DEFAULTS') ?>'
                                                            OnClick='confirm('<?= AddSlashes(GetMessage('MAIN_HINT_RESTORE_DEFAULTS_WARNING')) ?>
        ')'
        value='<?= Loc::getMessage('SMS4B_MAIN_RESTORE_DEFAULTS') ?>'>
        <?= bitrix_sessid_post(); ?>
        <?php $tabControl->End(); ?>

    </form>
    <?php
else:?>
    <?= CAdminMessage::ShowMessage(Loc::getMessage('SMS4B_MAIN_NO_RIGHTS_FOR_VIEWING')); ?>
<?php endif;
?>