<?php if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use \Bitrix\Main\Localization\Loc;
Loc::loadLanguageFile(__FILE__);

/**
 * Class CBPSMS4BActivityToContact
 */
class CBPSMS4BActivityToContact extends CBPActivity
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
            'smsTo' => 'sms_user_to',
            'smsText' => 'sms_text',
            'allOrOne' => 'radio_param',
            'userProperty' => 'user_property_phone'
        ];
        $this->senderService = new \Rarus\Sms4b\Sendings\Sender();
    }

    /**
     * Выполнение бизнес-процесса
     *
     * @throws \Bitrix\Main\ObjectException - Исключения создания объектов
     * @throws \Bitrix\Main\ArgumentException - Исключения переданных аргументов
     *
     * @return string = "Closed"
     */
    public function Execute()
    {
        if (CModule::IncludeModule('rarus.sms4b')) {
            $sms = new Csms4b();
            $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_BP_START_SEND_TO_CONTACT'));
            $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_BP_GET_ID') . $this->smsTo);
            $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_BP_USER_PROP') . $this->userProperty);
            $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_BP_ALL_OR_ONE') . $this->allOrOne);

            if (is_numeric($this->smsTo)) {
                //Получаем номера
                $dbResult = \CCrmFieldMulti::GetList(
                    ['ID' => 'asc'],
                    [
                        'TYPE_ID' => 'PHONE',
                        'ENTITY_ID' => 'CONTACT',
                        'ELEMENT_ID' => (int)$this->smsTo
                    ]
                );

                while ($fields = $dbResult->Fetch()) {
                    $arNum[$fields['COMPLEX_ID']][] = $fields['VALUE'];
                }

                if ($this->allOrOne == 'one') {
                    $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_GET_PHONE') . $arNum[$this->userProperty][0]);
                    try {
                        $this->senderService->crmSendSms([$arNum[$this->userProperty][0] => $this->smsText], SITE_ID);
                        $this->WriteToTrackingService(Loc::getMessage('SMS4B_MAIN_BP_TEXT') . $this->smsText . Loc::getMessage('SMS4B_MAIN_BP_SEND_TO_NUM') . $arNum[$this->userProperty][0]);
                        $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_BP_TEXT') . $this->smsText . Loc::getMessage('SMS4B_MAIN_BP_SEND_TO_NUM') . $arNum[$this->userProperty][0]);
                    } catch (\Exception $e) {
                        $this->WriteToTrackingService(Loc::getMessage('SMS4B_MAIN_BP_TEXT') . $this->smsText . Loc::getMessage('SMS4B_MAIN_BP_NOT_SEND_TO_NUM') . $arNum[$this->userProperty][0]);
                        $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_BP_TEXT') . $this->smsText . Loc::getMessage('SMS4B_MAIN_BP_NOT_SEND_TO_NUM') . $arNum[$this->userProperty][0]);
                    }
                } else {
                    $arPhoneMessages = [];
                    foreach ($arNum[$this->userProperty] as $value) {
                        $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_GET_PHONE') . $value);
                        $arPhoneMessages[$value] = $this->smsText;
                    }
                    try {
                        $this->senderService->crmSendSms($arPhoneMessages, SITE_ID);
                        $this->WriteToTrackingService(Loc::getMessage('SMS4B_MAIN_BP_TEXT') . $this->smsText . Loc::getMessage('SMS4B_MAIN_BP_SEND'));
                        $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_BP_TEXT') . $this->smsText . Loc::getMessage('SMS4B_MAIN_BP_SEND'));
                    } catch (\Exception $e) {
                        $this->WriteToTrackingService(Loc::getMessage('SMS4B_MAIN_BP_TEXT') . $this->smsText . Loc::getMessage('SMS4B_MAIN_BP_SEND'));
                        $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_BP_TEXT') . $this->smsText . Loc::getMessage('SMS4B_MAIN_BP_SEND'));
                    }
                }
            } else {
                $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_EMPTY_SMSTO'));
            }
            $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_BP_END_SEND_TO_CONTACT'));
        }
        return CBPActivityExecutionStatus::Closed;
    }

    /**
     * Проверка переменных
     *
     * @param $arTestProperties array - массив проверяемых значений
     * @param $user - объект пользователя CBPWorkflowTemplateUser
     *
     * @return array - массив с ошибками или пустой
     */
    public static function ValidateProperties($arTestProperties = [], CBPWorkflowTemplateUser $user = null)
    {
        $arErrors = [];
        if (!array_key_exists('smsTo', $arTestProperties) || strlen($arTestProperties['smsTo']) <= 0) {
            $arErrors[] = [
                'code' => 'NotExist',
                'parameter' => 'smsTo',
                'message' => Loc::getMessage('SMS4B_MAIN_BPMA_EMPTY_PROP1')
            ];
        }

        if (!array_key_exists('smsText', $arTestProperties) || strlen($arTestProperties['smsText']) <= 0) {
            $arErrors[] = [
                'code' => 'NotExist',
                'parameter' => 'smsText',
                'message' => Loc::getMessage('SMS4B_MAIN_BPMA_EMPTY_PROP2')
            ];
        }

        if (!array_key_exists('userProperty', $arTestProperties) || strlen($arTestProperties['userProperty']) <= 0) {
            $arErrors[] = [
                'code' => 'NotExist',
                'parameter' => 'userProperty',
                'message' => Loc::getMessage('SMS4B_MAIN_BPMA_EMPTY_PROP3')
            ];
        }

        if (!array_key_exists('allOrOne', $arTestProperties) || strlen($arTestProperties['allOrOne']) <= 0) {
            $arErrors[] = [
                'code' => 'NotExist',
                'parameter' => 'allOrOne',
                'message' => Loc::getMessage('SMS4B_MAIN_BPMA_EMPTY_PROP4')
            ];
        }

        return array_merge($arErrors, parent::ValidateProperties($arTestProperties, $user));
    }

    /**
     * Передача данных в диалог
     *
     * @param $documentType         array - тип документа
     * @param $activityName         string - название активити
     * @param $arWorkflowTemplate   array - параметры шаблона
     * @param $arWorkflowParameters array - поля документа
     * @param $arWorkflowVariables  array - переменные
     * @param $arCurrentValues      array|null - входные данные от действий БП ранее
     * @param $formName             string - имя формы
     *
     * @return string - свойства диалога
     */
    public static function GetPropertiesDialog(
        array $documentType,
        string $activityName,
        array $arWorkflowTemplate,
        array $arWorkflowParameters,
        array $arWorkflowVariables,
        array $arCurrentValues = null,
        string $formName = ''
    ): string {
        $runtime = CBPRuntime::GetRuntime();
        if (!is_array($arCurrentValues)) {
            $arCurrentValues = ['sms_user_to' => '', 'sms_text' => ''];
            $arCurrentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($arWorkflowTemplate, $activityName);
            if (is_array($arCurrentActivity['Properties'])) {
                $arCurrentValues['sms_user_to'] = $arCurrentActivity['Properties']['smsTo'];
                $arCurrentValues['sms_text'] = $arCurrentActivity['Properties']['smsText'];
                $arCurrentValues['radio_param'] = $arCurrentActivity['Properties']['allOrOne'];
                $arCurrentValues['user_property_phone'] = $arCurrentActivity['Properties']['userProperty'];
            }
        }

        //Получаем свойства контакта, где может храниться телефон
        $dbResult = \CCrmFieldMulti::GetList(
            ['ID' => 'asc'],
            [
                'TYPE_ID' => 'PHONE',
                'ENTITY_ID' => 'CONTACT'
            ]
        );

        while ($fields = $dbResult->Fetch()) {
            $arCurrentValues['CONTACT_PROPS'][] = $fields['COMPLEX_ID'];
        }
        $arCurrentValues['CONTACT_PROPS'] = array_unique($arCurrentValues['CONTACT_PROPS']);

        return $runtime->ExecuteResourceFile(
            __FILE__,
            'properties_dialog.php',
            [
                'arCurrentValues' => $arCurrentValues,
                'formName' => $formName
            ]
        );
    }

    /**
     * Получение данных диалога
     *
     * @param $documentType         array - тип документа
     * @param $activityName         string - название активити
     * @param $arWorkflowTemplate   array - параметры шаблона
     * @param $arWorkflowParameters array - поля документа
     * @param $arWorkflowVariables  array - переменные
     * @param $arCurrentValues      array - входные данные от действий БП ранее
     * @param $arErrors             array - массив ошибок
     *
     * @return bool - результат
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
        $arMap = [
            'sms_user_to' => 'smsTo',
            'sms_text' => 'smsText',
            'radio_param' => 'allOrOne',
            'user_property_phone' => 'userProperty'
        ];
        $arProperties = [];
        foreach ($arMap as $key => $value) {
            $arProperties[$value] = $arCurrentValues[$key];
        }
        $arErrors = self::ValidateProperties($arProperties,
            new CBPWorkflowTemplateUser(CBPWorkflowTemplateUser::CurrentUser));
        if (count($arErrors) > 0) {
            return false;
        }
        $arProperties['assigned_user_email'] = $arProperties['ASSIGNED_BY_EMAIL'];
        $arCurrentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($arWorkflowTemplate, $activityName);
        $arCurrentActivity['Properties'] = $arProperties;
        return true;
    }
}