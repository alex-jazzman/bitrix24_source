<?php
use \Bitrix\Main\Localization\Loc;
use \Rarus\Sms4b\Order;
use \Rarus\Sms4b\Crm;
use \Rarus\Sms4b\Forgottenbaskets\Service as Forgottenbaskets;

Loc::loadLanguageFile(__FILE__);

CModule::IncludeModule('rarus.sms4b');

$orderService = new Order\Service();
$crmService = new Crm\Service();

if (IsModuleInstalled('crm')) {
    //Выбрать все статусы для лидов
    $arLeadStatus = CCrmStatus::GetStatusListEx('STATUS');

    //Выбрать все стадии для сделок
    $arDealStage = CCrmStatus::GetStatusListEx('DEAL_STAGE');
}

if (IsModuleInstalled('sale')) {
    //Выбрать все статусы (заказы и отгрузки)
    $arSaleStatus = $orderService->GetSaleStatus();
}

$dbEvent = CEventMessage::GetList($b = 'ID', $order = 'ASC', ['EVENT_NAME' => 'SMS4B_SALE_NEW_ORDER']);
if (!($dbEvent->Fetch())) {
    $langs = CLanguage::GetList(($b = ''), ($o = ''));
    while ($lang = $langs->Fetch()) {
        $lid = $lang['LID'];
        IncludeModuleLangFile(__FILE__, $lid);

        CEventType::Add([
            'LID' => $lid,
            'EVENT_NAME' => 'SMS4B_ADMIN_SEND',
            'NAME' => Loc::getMessage('SMS4B_MAIN_ADMIN_SEND_NAME'),
            'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_ADMIN_SEND_DESC')
        ]);

        CEventType::Add([
            'LID' => $lid,
            'EVENT_NAME' => 'SMS4B_USER_LIST_CUSTOM_EVENT',
            'NAME' => Loc::getMessage('SMS4B_MAIN_USER_LIST_CUSTOM_EVENT_NAME'),
            'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_USER_LIST_CUSTOM_EVENT_DESC')
        ]);

        // Модуль задач
        if (IsModuleInstalled('tasks')) {
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_TASK_ADD',
                'NAME' => Loc::getMessage('SMS4B_MAIN_ADMIN_TASK_ADD_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_ADMIN_TASK_ADD_DESC')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_TASK_UPDATE',
                'NAME' => Loc::getMessage('SMS4B_MAIN_ADMIN_TASK_UPDATE_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_ADMIN_TASK_UPDATE_DESC')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_TASK_DELETE',
                'NAME' => Loc::getMessage('SMS4B_MAIN_ADMIN_TASK_DELETE_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_ADMIN_TASK_DELETE_DESC')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_TASK_ADD',
                'NAME' => Loc::getMessage('SMS4B_MAIN_TASK_ADD_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_TASK_ADD_DESC')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_TASK_UPDATE',
                'NAME' => Loc::getMessage('SMS4B_MAIN_TASK_UPDATE_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_TASK_UPDATE_DESC')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_TASK_DELETE',
                'NAME' => Loc::getMessage('SMS4B_MAIN_TASK_DELETE_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_TASK_DELETE_DESC')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_TASK_INTERCEPT_DEADLINE',
                'NAME' => Loc::getMessage('SMS4B_MAIN_INTERCEPT_DEADLINE_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_INTERCEPT_DEADLINE_DESC')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_NEW_COMMENT_TASK',
                'NAME' => Loc::getMessage('SMS4B_MAIN_NEW_COMM_FROM_TASK_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_NEW_COMM_FROM_TASK_DESC')
            ]);
        }

        if (IsModuleInstalled('support')) {
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_TICKET_NEW_FOR_TECHSUPPORT',
                'NAME' => Loc::getMessage('SMS4B_MAIN_TICKET_NEW_FOR_TECHSUPPORT_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_TICKET_NEW_FOR_TECHSUPPORT_DESC')
            ]);

            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_TICKET_NEW_FOR_TECHSUPPORT',
                'NAME' => Loc::getMessage('SMS4B_MAIN_TICKET_NEW_FOR_TECHSUPPORT_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_TICKET_NEW_FOR_TECHSUPPORT_DESC')
            ]);

            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_TICKET_CHANGE_FOR_TECHSUPPORT',
                'NAME' => Loc::getMessage('SMS4B_MAIN_TICKET_CHANGE_FOR_TECHSUPPORT_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_TICKET_CHANGE_FOR_TECHSUPPORT_DESC')
            ]);

            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_TICKET_CHANGE_FOR_TECHSUPPORT',
                'NAME' => Loc::getMessage('SMS4B_MAIN_TICKET_CHANGE_FOR_TECHSUPPORT_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_TICKET_CHANGE_FOR_TECHSUPPORT_DESC')
            ]);
        }

        if (IsModuleInstalled('subscribe')) {
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_SUBSCRIBE_CONFIRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_SUBSCRIBE_CONFIRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_SUBSCRIBE_CONFIRM_DESC')
            ]);

            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_SUBSCRIBE_CONFIRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_SUBSCRIBE_CONFIRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_SUBSCRIBE_CONFIRM_DESC')
            ]);
        }

        if (IsModuleInstalled('sale')) {

            foreach ($arSaleStatus as $status) {
                CEventType::Add([
                    'LID' => $lid,
                    'EVENT_NAME' => 'SMS4B_SALE_STATUS_CHANGED_' . $status['ID'],
                    'NAME' => ($status['TYPE'] === 'O' ? Loc::getMessage('SMS4B_MAIN_CHANGING_ORDER_STATUS_TO')
                            : Loc::getMessage('SMS4B_MAIN_CHANGING_SHIPMENT_STATUS_TO')) . $status['NAME'],
                    'DESCRIPTION' => $status['TYPE'] === 'O' ? Loc::getMessage('SMS4B_MAIN_ORDER_STATUS_DESC')
                        : Loc::getMessage('SMS4B_MAIN_SHIPMENT_STATUS_DESC')
                ]);

                //Для администраторов отдельные типы событий для статусов заказа и отгрузки
                CEventType::Add([
                    'LID'         => $lid,
                    'EVENT_NAME'  => 'SMS4B_ADMIN_SALE_STATUS_CHANGED_' . $status['ID'],
                    'NAME'        => ($status['TYPE'] === 'O' ? Loc::getMessage('SMS4B_MAIN_CHANGING_ORDER_STATUS_TO')
                            : Loc::getMessage('SMS4B_MAIN_CHANGING_SHIPMENT_STATUS_TO')) . $status['NAME'],
                    'DESCRIPTION' => $status['TYPE'] === 'O' ? Loc::getMessage('SMS4B_MAIN_ORDER_STATUS_DESC')
                        : Loc::getMessage('SMS4B_MAIN_SHIPMENT_STATUS_DESC')
                ]);
            }

            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_SALE_NEW_ORDER',
                'NAME' => Loc::getMessage('SMS4B_MAIN_SALE_NEW_ORDER_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_SALE_NEW_ORDER_DESC')
            ]);

            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_SALE_NEW_ORDER',
                'NAME' => Loc::getMessage('SMS4B_MAIN_SALE_NEW_ORDER_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_SALE_NEW_ORDER_DESC')
            ]);

            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_SALE_ORDER_CANCEL',
                'NAME' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_CANCEL_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_CANCEL_DESC')
            ]);

            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_SALE_ORDER_CANCEL',
                'NAME' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_CANCEL_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_CANCEL_DESC')
            ]);

            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_SALE_ORDER_PAID',
                'NAME' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_PAID_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_PAID_DESC')
            ]);

            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_SALE_ORDER_PAID',
                'NAME' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_PAID_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_PAID_DESC')
            ]);

            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_SALE_ORDER_DELIVERY',
                'NAME' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_DELIVERY_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_DELIVERY_DESC')
            ]);

            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_SALE_ORDER_DELIVERY',
                'NAME' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_DELIVERY_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_DELIVERY_DESC')
            ]);

            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_USER_CUSTOM_EVENT',
                'NAME' => Loc::getMessage('SMS4B_MAIN_USER_CUSTOM_EVENT_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_USER_CUSTOM_EVENT_DESC')
            ]);

            $forgottenbaskets = new Forgottenbaskets();
            CEventType::Add([
                'LID'         => $lid,
                'EVENT_NAME'  => 'SMS4B_SEND_FORGOTTEN_BASKETS_1',
                'NAME'        => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_1'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_DESC_1') . $forgottenbaskets->getMacros()
            ]);

            CEventType::Add([
                'LID'         => $lid,
                'EVENT_NAME'  => 'SMS4B_SEND_FORGOTTEN_BASKETS_2',
                'NAME'        => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_2'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_DESC_2') . $forgottenbaskets->getMacros()
            ]);

        }

        /* Почтовые события для CRM */
        //Для событий лидов
        if (IsModuleInstalled('crm')) {
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADD_LEAD_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_ADD_LEAD_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_ADD_LEAD_CRM_DESC') . $crmService->getMacros('LEAD',
                        true)
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_ADD_LEAD_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_ADD_LEAD_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_ADD_LEAD_CRM_DESC') . $crmService->getMacros('LEAD',
                        true)
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_UPDATE_LEAD_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_UPDATE_LEAD_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_UPDATE_LEAD_CRM_DESC') . $crmService->getMacros('LEAD',
                        true)
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_UPDATE_LEAD_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_UPDATE_LEAD_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_UPDATE_LEAD_CRM_DESC') . $crmService->getMacros('LEAD',
                        true)
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_DELETE_LEAD_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_DELETE_LEAD_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_DELETE_LEAD_CRM_DESC')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_DELETE_LEAD_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_DELETE_LEAD_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_DELETE_LEAD_CRM_DESC')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_CHANGE_STAT_LEAD_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_DESC')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_CHANGE_STAT_LEAD_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_DESC')
            ]);

            //Для событий контактов
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADD_CONTACT_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_ADD_CONTACT_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_ADD_CONTACT_CRM_DESC') . $crmService->getMacros('CONTACT',
                        true)
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_ADD_CONTACT_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_ADD_CONTACT_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_ADD_CONTACT_CRM_DESC') . $crmService->getMacros('CONTACT',
                        true)
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_UPDATE_CONTACT_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_UPDATE_CONTACT_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_UPDATE_CONTACT_CRM_DESC') . $crmService->getMacros('CONTACT',
                        true)
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_UPDATE_CONTACT_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_UPDATE_CONTACT_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_UPDATE_CONTACT_CRM_DESC') . $crmService->getMacros('CONTACT',
                        true)
            ]);

            //Для событий сделок
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADD_DEAL_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_ADD_DEAL_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_ADD_DEAL_CRM_DESC') . $crmService->getMacros('CONTACT')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_ADD_DEAL_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_ADD_DEAL_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_ADD_DEAL_CRM_DESC') . $crmService->getMacros('CONTACT')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_UPDATE_DEAL_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_UPDATE_DEAL_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_UPDATE_DEAL_CRM_DESC') . $crmService->getMacros('CONTACT')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_UPDATE_DEAL_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_UPDATE_DEAL_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_UPDATE_DEAL_CRM_DESC') . $crmService->getMacros('CONTACT')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_CHANGE_STAT_DEAL_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_DESC')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_CHANGE_STAT_DEAL_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_DESC')
            ]);

            //Для событий дел
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_REMIND_EVENT_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_UPDATE_ACTIVITY_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_UPDATE_ACTIVITY_CRM_DESC')
            ]);
            CEventType::Add([
                'LID' => $lid,
                'EVENT_NAME' => 'SMS4B_ADMIN_REMIND_EVENT_CRM',
                'NAME' => Loc::getMessage('SMS4B_MAIN_UPDATE_ACTIVITY_CRM_NAME'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_UPDATE_ACTIVITY_CRM_DESC')
            ]);

            //Статусы Лида
            foreach ($arLeadStatus as $code => $name) {
                CEventType::Add([
                    'LID' => $lid,
                    'EVENT_NAME' => 'SMS4B_CHANGE_STAT_LEAD_CRM_' . $code,
                    'NAME' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM') . '\'' . $name . '\'',
                    'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_DESC')
                ]);

                CEventType::Add([
                    'LID' => $lid,
                    'EVENT_NAME' => 'SMS4B_ADMIN_CHANGE_STAT_LEAD_CRM_' . $code,
                    'NAME' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM') . '\'' . $name . '\'',
                    'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_DESC')
                ]);
            }
            //Стадии сделки
            foreach ($arDealStage as $code => $name) {
                CEventType::Add([
                    'LID' => $lid,
                    'EVENT_NAME' => 'SMS4B_CHANGE_STAT_DEAL_CRM_' . $code,
                    'NAME' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_NAME') . '\'' . $name . '\'',
                    'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_DESC')
                ]);

                CEventType::Add([
                    'LID' => $lid,
                    'EVENT_NAME' => 'SMS4B_ADMIN_CHANGE_STAT_DEAL_CRM_' . $code,
                    'NAME' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_NAME') . '\'' . $name . '\'',
                    'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_DESC')
                ]);
            }

            /* Почтовые события для Телефонии */
            if (IsModuleInstalled('voximplant')) {
                CEventType::Add([
                    'LID' => $lid,
                    'EVENT_NAME' => 'SMS4B_AUTOANSWER',
                    'NAME' => Loc::getMessage('SMS4B_MAIN_VP_AUTOANSWER_NAME'),
                    'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_VP_AUTOANSWER_DESC')
                ]);
                CEventType::Add([
                    'LID' => $lid,
                    'EVENT_NAME' => 'SMS4B_MISSED_CALL',
                    'NAME' => Loc::getMessage('SMS4B_MAIN_VP_MISSED_CALL_NAME'),
                    'DESCRIPTION' => Loc::getMessage('SMS4B_MAIN_VP_MISSED_CALL_DESC')
                ]);
            }
        }

        $arSites = [];
        $sites = CSite::GetList(($b = ''), ($o = ''), ['LANGUAGE_ID' => $lid]);
        while ($site = $sites->Fetch()) {
            $arSites[] = $site['LID'];
        }

        if (count($arSites) > 0) {
            $emess = new CEventMessage;
            $emess->Add([
                'ACTIVE' => 'Y',
                'EVENT_NAME' => 'SMS4B_ADMIN_SEND',
                'LID' => $arSites,
                'EMAIL_FROM' => '#DEFAULT_EMAIL_FROM#',
                'EMAIL_TO' => '#DEFAULT_EMAIL_FROM#',
                'SUBJECT' => Loc::getMessage('SMS4B_MAIN_ADMIN_SEND_SUBJECT'),
                'MESSAGE' => Loc::getMessage('SMS4B_MAIN_ADMIN_SEND_MESSAGE'),
                'BODY_TYPE' => 'text'
            ]);

            $emess->Add([
                'ACTIVE' => 'Y',
                'EVENT_NAME' => 'SMS4B_USER_LIST_CUSTOM_EVENT',
                'LID' => $arSites,
                'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                'EMAIL_TO' => '#PHONE_TO#',
                'SUBJECT' => Loc::getMessage('SMS4B_MAIN_USER_LIST_CUSTOM_EVENT_SUBJECT'),
                'MESSAGE' => Loc::getMessage('SMS4B_MAIN_USER_LIST_CUSTOM_EVENT_MESSAGE'),
                'BODY_TYPE' => 'text'
            ]);

            if (IsModuleInstalled('tasks')) {
                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_TASK_ADD',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO' => '#DEFAULT_EMAIL_FROM#',
                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_TASK_ADD_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_TASK_ADD_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_TASK_UPDATE',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO' => '#DEFAULT_EMAIL_FROM#',
                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_TASK_UPDATE_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_TASK_UPDATE_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_TASK_DELETE',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO' => '#DEFAULT_EMAIL_FROM#',
                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_TASK_DELETE_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_TASK_DELETE_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_TASK_ADD',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO' => '#DEFAULT_EMAIL_FROM#',
                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_TASK_ADD_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_TASK_ADD_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_TASK_UPDATE',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO' => '#DEFAULT_EMAIL_FROM#',
                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_TASK_UPDATE_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_TASK_UPDATE_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_TASK_DELETE',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO' => '#DEFAULT_EMAIL_FROM#',
                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_TASK_DELETE_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_TASK_DELETE_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_NEW_COMMENT_TASK',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO' => '#DEFAULT_EMAIL_FROM#',
                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_NEW_COMM_FROM_TASK_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_NEW_COMM_FROM_TASK_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_TASK_INTERCEPT_DEADLINE',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO' => '#DEFAULT_EMAIL_FROM#',
                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_INTERCEPT_DEADLINE_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_INTERCEPT_DEADLINE_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);
            }

            if (IsModuleInstalled('support')) {
                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_TICKET_NEW_FOR_TECHSUPPORT',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO' => '#PHONE_TO#',
                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_TICKET_NEW_FOR_TECHSUPPORT_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_TICKET_NEW_FOR_TECHSUPPORT_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_TICKET_NEW_FOR_TECHSUPPORT',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO' => '#PHONE_TO#',
                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_TICKET_NEW_FOR_TECHSUPPORT_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_TICKET_NEW_FOR_TECHSUPPORT_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_TICKET_CHANGE_FOR_TECHSUPPORT',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO' => '#PHONE_TO#',
                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_TICKET_CHANGE_FOR_TECHSUPPORT_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_TICKET_CHANGE_FOR_TECHSUPPORT_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_TICKET_CHANGE_FOR_TECHSUPPORT',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO' => '#PHONE_TO#',
                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_TICKET_CHANGE_FOR_TECHSUPPORT_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_TICKET_CHANGE_FOR_TECHSUPPORT_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);
            }

            if (IsModuleInstalled('subscribe')) {
                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_SUBSCRIBE_CONFIRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO' => '#PHONE_TO#',
                    'BCC' => '',
                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_SUBSCRIBE_CONFIRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_SUBSCRIBE_CONFIRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_SUBSCRIBE_CONFIRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO' => '#PHONE_TO#',
                    'BCC' => '',
                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_SUBSCRIBE_CONFIRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_SUBSCRIBE_CONFIRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);
            }

            if (IsModuleInstalled('sale')) {

                foreach ($arSaleStatus as $status) {
                    $emess->Add([
                        'ACTIVE' => 'Y',
                        'EVENT_NAME' => 'SMS4B_SALE_STATUS_CHANGED_' . $status['ID'],
                        'LID' => $arSites,
                        'EMAIL_FROM' => '#SALE_PHONE#',
                        'EMAIL_TO' => '#PHONE_TO#',
                        'SUBJECT' => ($status['TYPE'] === 'O' ? Loc::getMessage('SMS4B_MAIN_ORDER_STATUS_SUBJ')
                                : Loc::getMessage('SMS4B_MAIN_SHIPMENT_STATUS_SUBJ')) . $status['NAME'],
                        'MESSAGE' => $status['TYPE'] === 'O' ? Loc::getMessage('SMS4B_MAIN_ORDER_STATUS_MESS')
                                : Loc::getMessage('SMS4B_MAIN_SHIPMENT_STATUS_MESS'),
                        'BODY_TYPE' => 'text'
                    ]);

                    //Для администраторов отдельные типы событий для статусов заказа и отгрузки
                    $emess->Add([
                        'ACTIVE'     => 'Y',
                        'EVENT_NAME' => 'SMS4B_ADMIN_SALE_STATUS_CHANGED_' . $status['ID'],
                        'LID'        => $arSites,
                        'EMAIL_FROM' => '#SALE_PHONE#',
                        'EMAIL_TO'   => '#PHONE_TO#',
                        'SUBJECT'    => ($status['TYPE'] === 'O' ? Loc::getMessage('SMS4B_MAIN_ORDER_STATUS_SUBJ')
                                : Loc::getMessage('SMS4B_MAIN_SHIPMENT_STATUS_SUBJ')) . $status['NAME'],
                        'MESSAGE'    => $status['TYPE'] === 'O' ? Loc::getMessage('SMS4B_MAIN_ORDER_STATUS_MESS')
                                : Loc::getMessage('SMS4B_MAIN_SHIPMENT_STATUS_MESS'),
                        'BODY_TYPE'  => 'text'
                    ]);

                }

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_SALE_NEW_ORDER',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_SALE_NEW_ORDER_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_SALE_NEW_ORDER_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_SALE_NEW_ORDER',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_SALE_NEW_ORDER_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_SALE_NEW_ORDER_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_SALE_ORDER_CANCEL',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_CANCEL_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_CANCEL_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_SALE_ORDER_CANCEL',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_CANCEL_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_CANCEL_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_SALE_ORDER_DELIVERY',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_DELIVERY_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_DELIVERY_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_SALE_ORDER_DELIVERY',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_DELIVERY_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_DELIVERY_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_SALE_ORDER_PAID',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_PAID_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_PAID_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_SALE_ORDER_PAID',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_PAID_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_SALE_ORDER_PAID_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_USER_CUSTOM_EVENT',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_USER_CUSTOM_EVENT_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_USER_CUSTOM_EVENT_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE'     => 'Y',
                    'EVENT_NAME' => 'SMS4B_SEND_FORGOTTEN_BASKETS_1',
                    'LID'        => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO'   => '#PHONE_TO#',
                    'BCC'        => '',
                    'SUBJECT'    => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_1_SUBJECT'),
                    'MESSAGE'    => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_1_MESSAGE'),
                    'BODY_TYPE'  => 'text'
                ]);

                $emess->Add([
                    'ACTIVE'     => 'Y',
                    'EVENT_NAME' => 'SMS4B_SEND_FORGOTTEN_BASKETS_2',
                    'LID'        => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO'   => '#PHONE_TO#',
                    'BCC'        => '',
                    'SUBJECT'    => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_2_SUBJECT'),
                    'MESSAGE'    => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_2_MESSAGE'),
                    'BODY_TYPE'  => 'text'
                ]);
            }

            /* Почтовые шаблоны для CRM */
            if (IsModuleInstalled('crm')) {
                //Для событий лидов
                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADD_LEAD_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_ADD_LEAD_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_ADD_LEAD_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_ADD_LEAD_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_ADD_LEAD_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_ADD_LEAD_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_UPDATE_LEAD_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_UPDATE_LEAD_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_UPDATE_LEAD_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_UPDATE_LEAD_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_UPDATE_LEAD_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_UPDATE_LEAD_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_DELETE_LEAD_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_DELETE_LEAD_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_DELETE_LEAD_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_DELETE_LEAD_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_DELETE_LEAD_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_DELETE_LEAD_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_CHANGE_STAT_LEAD_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_CHANGE_STAT_LEAD_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                //Для событий контактов
                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADD_CONTACT_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_ADD_CONTACT_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_ADD_CONTACT_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_ADD_CONTACT_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_ADD_CONTACT_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_ADD_CONTACT_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_UPDATE_CONTACT_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_UPDATE_CONTACT_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_UPDATE_CONTACT_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_UPDATE_CONTACT_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_UPDATE_CONTACT_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_UPDATE_CONTACT_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_REMOVE_CONTACT_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_REMOVE_CONTACT_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_REMOVE_CONTACT_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_REMOVE_CONTACT_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_REMOVE_CONTACT_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_REMOVE_CONTACT_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                //Для событий сделок
                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADD_DEAL_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_ADD_DEAL_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_ADD_DEAL_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_ADD_DEAL_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_ADD_DEAL_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_ADD_DEAL_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_UPDATE_DEAL_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_UPDATE_DEAL_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_UPDATE_DEAL_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_UPDATE_DEAL_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_UPDATE_DEAL_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_UPDATE_DEAL_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_DELETE_DEAL_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_DELETE_DEAL_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_DELETE_DEAL_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_DELETE_DEAL_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_DELETE_DEAL_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_DELETE_DEAL_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_CHANGE_STAT_DEAL_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_CHANGE_STAT_DEAL_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_DELETE_DEAL_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_DELETE_DEAL_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                //Для событий дел
                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_REMIND_EVENT_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_UPDATE_ACTIVITY_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_UPDATE_ACTIVITY_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_ADMIN_REMIND_EVENT_CRM',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_UPDATE_ACTIVITY_CRM_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_UPDATE_ACTIVITY_CRM_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);

                //Статусы Лида
                foreach ($arLeadStatus as $code => $name) {
                    $emess->Add([
                        'ACTIVE' => 'Y',
                        'EVENT_NAME' => 'SMS4B_CHANGE_STAT_LEAD_CRM_' . $code,
                        'LID' => $arSites,
                        'EMAIL_FROM' => '#SALE_PHONE#',
                        'EMAIL_TO' => '#PHONE_TO#',

                        'SUBJECT' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_SUBJECT') . '\'' . $name . '\'',
                        'MESSAGE' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_MESSAGE'),
                        'BODY_TYPE' => 'text'
                    ]);

                    $emess->Add([
                        'ACTIVE' => 'Y',
                        'EVENT_NAME' => 'SMS4B_ADMIN_CHANGE_STAT_LEAD_CRM_' . $code,
                        'LID' => $arSites,
                        'EMAIL_FROM' => '#SALE_PHONE#',
                        'EMAIL_TO' => '#PHONE_TO#',

                        'SUBJECT' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_SUBJECT') . '\'' . $name . '\'',
                        'MESSAGE' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_MESSAGE'),
                        'BODY_TYPE' => 'text'
                    ]);
                }
                //Стадии сделки
                foreach ($arDealStage as $code => $name) {
                    $emess->Add([
                        'ACTIVE' => 'Y',
                        'EVENT_NAME' => 'SMS4B_CHANGE_STAT_DEAL_CRM_' . $code,
                        'LID' => $arSites,
                        'EMAIL_FROM' => '#SALE_PHONE#',
                        'EMAIL_TO' => '#PHONE_TO#',

                        'SUBJECT' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_SUBJECT') . '\'' . $name . '\'',
                        'MESSAGE' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_MESSAGE'),
                        'BODY_TYPE' => 'text'
                    ]);

                    $emess->Add([
                        'ACTIVE' => 'Y',
                        'EVENT_NAME' => 'SMS4B_ADMIN_CHANGE_STAT_DEAL_CRM_' . $code,
                        'LID' => $arSites,
                        'EMAIL_FROM' => '#SALE_PHONE#',
                        'EMAIL_TO' => '#PHONE_TO#',

                        'SUBJECT' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_SUBJECT') . '\'' . $name . '\'',
                        'MESSAGE' => Loc::getMessage('SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_MESSAGE'),
                        'BODY_TYPE' => 'text'
                    ]);
                }
            }

            /* Почтовые события для Телефонии */
            if (IsModuleInstalled('voximplant')) {
                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_AUTOANSWER',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_VP_AUTOANSWER_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_VP_AUTOANSWER_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);
                $emess->Add([
                    'ACTIVE' => 'Y',
                    'EVENT_NAME' => 'SMS4B_MISSED_CALL',
                    'LID' => $arSites,
                    'EMAIL_FROM' => '#SALE_PHONE#',
                    'EMAIL_TO' => '#PHONE_TO#',

                    'SUBJECT' => Loc::getMessage('SMS4B_MAIN_VP_MISSED_CALL_SUBJECT'),
                    'MESSAGE' => Loc::getMessage('SMS4B_MAIN_VP_MISSED_CALL_MESSAGE'),
                    'BODY_TYPE' => 'text'
                ]);
            }
        }
    }
}

if (IsModuleInstalled('sale')) {
    $dbEvent = CEventMessage::GetList($b = 'ID', $order = 'ASC', ['EVENT_NAME' => 'SMS4B_SEND_FORGOTTEN_BASKETS_1']);
    if (!($dbEvent->Fetch())) {
        $langs = CLanguage::GetList(($b = ''), ($o = ''));
        $forgottenbaskets = new Forgottenbaskets();
        while ($lang = $langs->Fetch()) {
            $lid = $lang['LID'];
            IncludeModuleLangFile(__FILE__, $lid);

            CEventType::Add([
                'LID'         => $lid,
                'EVENT_NAME'  => 'SMS4B_SEND_FORGOTTEN_BASKETS_1',
                'NAME'        => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_1'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_DESC_1') . $forgottenbaskets->getMacros()
            ]);

            CEventType::Add([
                'LID'         => $lid,
                'EVENT_NAME'  => 'SMS4B_SEND_FORGOTTEN_BASKETS_2',
                'NAME'        => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_2'),
                'DESCRIPTION' => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_DESC_2') . $forgottenbaskets->getMacros()
            ]);

            $arSites = [];
            $sites = CSite::GetList(($b = ''), ($o = ''), ['LANGUAGE_ID' => $lid]);
            while ($site = $sites->Fetch()) {
                $arSites[] = $site['LID'];
            }

            if (count($arSites) > 0) {
                $em = new CEventMessage;
                $em->Add([
                    'ACTIVE'     => 'Y',
                    'EVENT_NAME' => 'SMS4B_SEND_FORGOTTEN_BASKETS_1',
                    'LID'        => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO'   => '#PHONE_TO#',
                    'BCC'        => '',
                    'SUBJECT'    => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_1_SUBJECT'),
                    'MESSAGE'    => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_1_MESSAGE'),
                    'BODY_TYPE'  => 'text'
                ]);

                $em->Add([
                    'ACTIVE'     => 'Y',
                    'EVENT_NAME' => 'SMS4B_SEND_FORGOTTEN_BASKETS_2',
                    'LID'        => $arSites,
                    'EMAIL_FROM' => '#DEFAULT_PHONE_FROM#',
                    'EMAIL_TO'   => '#PHONE_TO#',
                    'BCC'        => '',
                    'SUBJECT'    => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_2_SUBJECT'),
                    'MESSAGE'    => Loc::getMessage('SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_2_MESSAGE'),
                    'BODY_TYPE'  => 'text'
                ]);
            }

        }
    }
}
