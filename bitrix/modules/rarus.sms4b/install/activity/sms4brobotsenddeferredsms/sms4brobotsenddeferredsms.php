<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use \Bitrix\Main\Localization\Loc;
use Bitrix\Main\Loader;

Loc::loadLanguageFile(__FILE__);

/**
 * Class CBPSms4bRobotSendSms
 */
class CBPSms4bRobotSendDeferredSms extends CBPActivity
{
    private $senderService;
    /**
     * Конструктор
     *
     * @param $name string - ID экземпляра бизнес-процесса
     */
    public function __construct($name)
    {
        parent::__construct($name);
        $this->arProperties = [
            'Title' => '',
            'MessageText' => '',
            'radioButton' => '',
            'dateFields' => '',
            'valBefore' => '',
            'valTypeBefore' => '',
            'valAfter' => '',
            'valTypeAfter' => ''
        ];
        $this->senderService = new \Rarus\Sms4b\Sendings\Sender();
    }

    /**
     * Выполнение бизнес-процесса
     *
     * @throws \Bitrix\Main\ObjectException
     * @throws \Bitrix\Main\ArgumentException
     *
     * @return string = 'Closed'
     */
    public function Execute()
    {
        Loader::includeModule('crm');
        if (!Loader::includeModule('rarus.sms4b')) {
            $this->WriteToTrackingService(Loc::getMessage('SMS4B_MODULE_NOT_FOUND'));
            return CBPActivityExecutionStatus::Closed;
        }

        if (!$this->MessageText || $this->MessageText === '') {
            $this->WriteToTrackingService(Loc::getMessage('SMS4B_EMPTY_TEXT'));
            return CBPActivityExecutionStatus::Closed;
        }

        $sms = new Csms4b();
        $phoneNumber = $this->getPhoneNumber();
        $phoneNumberValid = $sms->is_phone($phoneNumber);
        $startSend = $this->calcStartSend();

        if ($startSend === null) {
            $this->WriteToTrackingService(Loc::getMessage('SMS4B_DEFERRED_DATETIME_CALC_FAIL'));
            return CBPActivityExecutionStatus::Closed;
        }

        if ($phoneNumber === null) {
            $this->WriteToTrackingService(Loc::getMessage('SMS4B_EMPTY_PHONE'));
            return CBPActivityExecutionStatus::Closed;
        } elseif ($phoneNumberValid === false) {
            $this->WriteToTrackingService(Loc::getMessage('SMS4B_NOT_VALID'));
            return CBPActivityExecutionStatus::Closed;
        }

        try {
            $this->senderService->crmSendSms([$phoneNumberValid => $this->MessageText], SITE_ID, new \DateTime($startSend));
            $this->WriteToTrackingService(Loc::getMessage('SMS4B_SMS_SEND',
                ['#TEXT#' => $this->MessageText, '#PHONE#' => $phoneNumberValid, '#DATE#' => $startSend]));
        } catch (\Exception $e) {
            $this->WriteToTrackingService(Loc::getMessage('SMS4B_SMS_NOT_SEND'));
        }

        return CBPActivityExecutionStatus::Closed;
    }

    /**
     *
     * Вычислить дату старта
     *
     * @return string|null
     */
    private function calcStartSend()
    {
        if ($this->radioButton === 'after') {
            $dateStart = new \DateTime();
            $dateStart->add(new \DateInterval('PT' . $this->valAfter . $this->valTypeAfter));
        } elseif ($this->radioButton === 'before') {
            $documentId = $this->GetDocumentId();
            $res = \CAllCrmDeal::GetList(
                ['DATE_CREATE' => 'DESC'],
                ['ID' => (int)str_replace('DEAL_', '', $documentId[2])],
                [$this->dateFields]);

            $date = $res->fetch();
            if ($date[$this->dateFields] === '') {
                return null;
            }

            $dateStart = new \DateTime($date[$this->dateFields]);
            $dateStart->sub(new \DateInterval('PT' . $this->valBefore . $this->valTypeBefore));
        } else {
            return null;
        }
        return $dateStart->format(\DateTime::W3C);
    }

    /**
     *
     * Получить номер телефона
     *
     * @return string|null
     */
    private function getPhoneNumber()
    {
        $documentId = $this->GetDocumentId();
        $communications = [];

        switch ($documentId[1]) {
            case 'CCrmDocumentDeal':
                $communications = $this->getDealCommunications((int)str_replace('DEAL_', '', $documentId[2]));
                break;
            case 'CCrmDocumentLead':
                $communications = $this->getCommunicationsFromFM(CCrmOwnerType::Lead,
                    (int)str_replace('LEAD_', '', $documentId[2]));
                break;
        }

        $communications = array_slice($communications, 0, 1);
        return $communications ? $communications[0]['VALUE'] : null;
    }

    /**
     * Получить массив телефонов по сделке
     *
     * @param $id int ID сделки
     * @return array
     */
    private function getDealCommunications($id)
    {
        $communications = [];

        $entity = CCrmDeal::GetByID($id, false);
        if (!$entity) {
            return [];
        }

        $entityContactID = isset($entity['CONTACT_ID']) ? intval($entity['CONTACT_ID']) : 0;
        $entityCompanyID = isset($entity['COMPANY_ID']) ? intval($entity['COMPANY_ID']) : 0;

        if ($entityContactID > 0) {
            $communications = $this->getCommunicationsFromFM(CCrmOwnerType::Contact, $entityContactID);
        }

        if (empty($communications) && $entityCompanyID > 0) {
            $communications = CCrmActivity::GetCompanyCommunications($entityCompanyID, 'PHONE');
        }

        return $communications;
    }

    /**
     * Получить массив телефонов
     *
     * @param $entityTypeId int ID типа сущности
     * @param $entityId int ID инстанса сйщности
     *
     * @return array
     */
    private function getCommunicationsFromFM($entityTypeId, $entityId)
    {
        $entityTypeName = CCrmOwnerType::ResolveName($entityTypeId);
        $communications = [];

        $iterator = CCrmFieldMulti::GetList(
            ['ID' => 'asc'],
            [
                'ENTITY_ID' => $entityTypeName,
                'ELEMENT_ID' => $entityId,
                'TYPE_ID' => 'PHONE'
            ]
        );

        while ($row = $iterator->fetch()) {
            if (empty($row['VALUE'])) {
                continue;
            }

            $communications[] = [
                'ENTITY_ID' => $entityId,
                'ENTITY_TYPE_ID' => $entityTypeId,
                'ENTITY_TYPE' => $entityTypeName,
                'TYPE' => 'PHONE',
                'VALUE' => $row['VALUE'],
                'VALUE_TYPE' => $row['VALUE_TYPE']
            ];
        }

        return $communications;
    }

    /**
     * Проверка переменных
     *
     * @param array $arTestProperties  массив проверяемых значений
     * @param CBPWorkflowTemplateUser|null $user пользователя CBPWorkflowTemplateUser
     *
     * @return array - массив с ошибками или пустой
     */
    public static function ValidateProperties($arTestProperties = [], CBPWorkflowTemplateUser $user = null): array
    {
        $arErrors = [];

        if (empty($arTestProperties['MessageText'])) {
            $arErrors[] = [
                'code' => 'NotExist',
                'parameter' => 'MessageText',
                'message' => Loc::getMessage('SMS4B_EMPTY_TEXT')
            ];
        }

        if ($arTestProperties['radioButton'] === 'after') {
            if ($arTestProperties['valAfter'] === '0' || $arTestProperties['valAfter'] === null) {
                $arErrors[] = [
                    'code' => 'FailAfterPeriod',
                    'parameter' => 'valAfter',
                    'message' => Loc::getMessage('SMS4B_FAIL_VAL')
                ];
            }
            if ($arTestProperties['valTypeAfter'] === null) {
                $arErrors[] = [
                    'code' => 'FailAfterPeriodType',
                    'parameter' => 'valTypeAfter',
                    'message' => Loc::getMessage('SMS4B_FAIL_VAL_TYPE')
                ];
            }
        } elseif ($arTestProperties['radioButton'] === 'before') {
            if ($arTestProperties['valBefore'] === '0' || $arTestProperties['valBefore'] === null) {
                $arErrors[] = [
                    'code' => 'FailBeforePeriod',
                    'parameter' => 'valBefore',
                    'message' => Loc::getMessage('SMS4B_FAIL_VAL')
                ];
            }
            if (!isset($arTestProperties['valTypeBefore'])) {
                $arErrors[] = [
                    'code' => 'FailBeforePeriodType',
                    'parameter' => 'valTypeBefore',
                    'message' => Loc::getMessage('SMS4B_FAIL_VAL_TYPE')
                ];
            }
        } else {
            $arErrors[] = [
                'code' => 'FailRadio',
                'parameter' => 'radioButton',
                'message' => Loc::getMessage('SMS4B_DEFERRED_DATETIME_FAIL')
            ];
        }


        return array_merge($arErrors, parent::ValidateProperties($arTestProperties, $user));
    }

    /**
     * Передача данных в диалог
     *
     * @param $documentType         array тип документа
     * @param $activityName         string название активити
     * @param $arWorkflowTemplate   array параметры шаблона
     * @param $arWorkflowParameters array поля документа
     * @param $arWorkflowVariables  array переменные
     * @param $arCurrentValues      array|null входные данные от действий БП ранее
     * @param $formName             string имя формы
     *
     * @return string Свойства диалога
     */
    public static function GetPropertiesDialog(
        array $documentType,
        string $activityName,
        array $arWorkflowTemplate,
        array $arWorkflowParameters,
        array $arWorkflowVariables,
        array $arCurrentValues = null,
        string $formName = '',
        $popupWindow = null,
        string $siteId = ''
    ) {
        if (!Loader::includeModule('crm')) {
            return '';
        }

        $dialog = new \Bitrix\Bizproc\Activity\PropertiesDialog(__FILE__, [
            'documentType' => $documentType,
            'activityName' => $activityName,
            'workflowTemplate' => $arWorkflowTemplate,
            'workflowParameters' => $arWorkflowParameters,
            'workflowVariables' => $arWorkflowVariables,
            'currentValues' => $arCurrentValues,
            'formName' => $formName,
            'siteId' => $siteId
        ]);

        $dialog->setMap([
            'MessageText' => [
                'Name' => Loc::getMessage('SMS4B_MESSAGE_TEXT'),
                'FieldName' => 'message_text',
                'Type' => 'text',
                'Required' => true
            ],
            'dateFields' => [
                'FieldName' => 'dateFields',
                'Type' => 'select',
                'Required' => false,
                'Multiple' => true,
                'Options' => Bitrix\Crm\Automation\Helper::getDocumentFields($documentType, 'datetime')
            ],
            'radioButton' => [
                'FieldName' => 'sms4b_type',
                'Type' => 'radio',
                'Required' => true
            ],
            'valBefore' => [
                'FieldName' => 'sms4b_value_before',
                'Type' => 'text',
                'Required' => false
            ],
            'valAfter' => [
                'FieldName' => 'sms4b_value_after',
                'Type' => 'text',
                'Required' => false
            ],
            'valTypeBefore' => [
                'FieldName' => 'sms4b_value_type_before',
                'Type' => 'radio',
                'Required' => false
            ],
            'valTypeAfter' => [
                'FieldName' => 'sms4b_value_type_after',
                'Type' => 'radio',
                'Required' => false
            ]

        ]);

        return $dialog;
    }

    /**
     * Получение данных диалога
     *
     * @param $documentType array тип документа
     * @param $activityName string название активити
     * @param $arWorkflowTemplate array параметры шаблона
     * @param $arWorkflowParameters array поля документа
     * @param $arWorkflowVariables array переменные
     * @param $arCurrentValues array входные данные от действий БП ранее
     * @param $arErrors array массив ошибок
     *
     * @return bool
     *@throws \Bitrix\Main\ObjectException
     *
     */
    public static function GetPropertiesDialogValues(
        array $documentType,
        string $activityName,
        array &$arWorkflowTemplate,
        array &$arWorkflowParameters,
        array &$arWorkflowVariables,
        array $arCurrentValues,
        array &$arErrors
    ): bool {
        $arErrors = [];

        $arProperties = [
            'MessageText' => (string)$arCurrentValues['message_text'],
            'dateFields' => $arCurrentValues['dateFields'],
            'radioButton' => $arCurrentValues['sms4b_type'],
            'valBefore' => $arCurrentValues['sms4b_value_before'],
            'valAfter' => $arCurrentValues['sms4b_value_after'],
            'valTypeBefore' => $arCurrentValues['sms4b_value_type_before'],
            'valTypeAfter' => $arCurrentValues['sms4b_value_type_after']
        ];

        $arErrors = self::ValidateProperties($arProperties,
            new CBPWorkflowTemplateUser(CBPWorkflowTemplateUser::CurrentUser));
        if (count($arErrors) > 0) {
            return false;
        }

        $arCurrentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($arWorkflowTemplate, $activityName);
        $arCurrentActivity['Properties'] = $arProperties;

        return true;
    }
}
