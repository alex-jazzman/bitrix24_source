<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use \Bitrix\Main\Localization\Loc;

Loc::loadLanguageFile(__FILE__);

/**
 * Class CBPSms4bRobotSendSms
 */
class CBPSms4bRobotSendSms extends CBPActivity
{
    private $senderService;
    /**
     * @param $name string - ID
     */
    public function __construct($name)
    {
        parent::__construct($name);
        $this->arProperties = [
            'Title' => '',
            'MessageText' => ''
        ];
        $this->senderService = new \Rarus\Sms4b\Sendings\Sender();
    }

    /**
     * @throws \Bitrix\Main\ObjectException
     * @throws \Bitrix\Main\ArgumentException
     *
     * @return string = 'Closed'
     */
    public function Execute()
    {
        if (!CModule::IncludeModule('rarus.sms4b')) {
            $this->WriteToTrackingService(Loc::getMessage('SMS4B_INCLUDE_MODULE_FAIL_EXEC')
                . '. ' . Loc::getMessage('SMS4B_SMS_NOT_SEND_EXEC'));
            return CBPActivityExecutionStatus::Closed;
        }
        $sms = new Csms4b();
        $phoneNumber = $sms->is_phone($this->getPhoneNumber());

        if ($this->MessageText === '') {
            $this->WriteToTrackingService(Loc::getMessage('SMS4B_EMPTY_TEXT_EXEC')
                . '. ' . Loc::getMessage('SMS4B_SMS_NOT_SEND_EXEC'));
            return CBPActivityExecutionStatus::Closed;
        }
        if ($phoneNumber === false) {
            $this->WriteToTrackingService(Loc::getMessage('SMS4B_INVALID_PHONE_EXEC') . ' ' . "($phoneNumber)"
                . '. ' . Loc::getMessage('SMS4B_SMS_NOT_SEND_EXEC'));
            return CBPActivityExecutionStatus::Closed;
        }

        try {
            $this->senderService->crmSendSms([$phoneNumber => $this->MessageText], SITE_ID);
            $this->WriteToTrackingService(Loc::getMessage('SMS4B_SMS_SUCCESS_SEND_EXEC')
                . ' ' . Loc::getMessage('SMS4B_SMS_SEND_WITH_TEXT_EXEC') . $this->MessageText
                . ' ' . Loc::getMessage('SMS4B_SMS_SEND_TO_PHONE_EXEC') . $phoneNumber
            );
        } catch (\Exception $e) {
            $this->WriteToTrackingService(Loc::getMessage('SMS4B_SMS_NOT_SEND_EXEC'));
        }

        return CBPActivityExecutionStatus::Closed;
    }

    /**
     *
     * @return string
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
     *
     * @param $id int ID
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
     * @param $entityTypeId int ID
     * @param $entityId int ID
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
     * @param $arTestProperties array
     * @param $user CBPWorkflowTemplateUser
     *
     * @return array
     */
    public static function ValidateProperties($arTestProperties = [], CBPWorkflowTemplateUser $user = null)
    {
        $arErrors = [];

        if (empty($arTestProperties['MessageText'])) {
            $arErrors[] = [
                'code' => 'NotExist',
                'parameter' => 'MessageText',
                'message' => Loc::getMessage('SMS4B_EMPTY_TEXT')
            ];
        }

        return array_merge($arErrors, parent::ValidateProperties($arTestProperties, $user));
    }

    /**
     * @param array      $documentType
     * @param string     $activityName
     * @param array      $arWorkflowTemplate
     * @param array      $arWorkflowParameters
     * @param array      $arWorkflowVariables
     * @param array|null $arCurrentValues
     * @param string     $formName
     * @param null       $popupWindow
     * @param string     $siteId
     *
     * @return \Bitrix\Bizproc\Activity\PropertiesDialog|string
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
        if (!CModule::IncludeModule('crm')) {
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
            ]
        ]);

        return $dialog;
    }

    /**
     * @param array  $documentType
     * @param string $activityName
     * @param array  $arWorkflowTemplate
     * @param array  $arWorkflowParameters
     * @param array  $arWorkflowVariables
     * @param array  $arCurrentValues
     * @param array  $arErrors
     *
     * @return bool
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
            'MessageText' => (string)$arCurrentValues['message_text']
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
