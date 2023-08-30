<?php if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use \Bitrix\Main\Localization\Loc;
Loc::loadLanguageFile(__FILE__);

/**
 * Class CBPSMS4BActivityToPhone
 */
class CBPSMS4BActivityToPhone extends CBPActivity
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
            'smsText' => 'sms_text'
        ];
        $this->senderService = new \Rarus\Sms4b\Sendings\Sender();
    }

    /**
     * Выполнение бизнес-процесса
     *
     * @return string = "Closed"
     * @throws \Rarus\Sms4b\Exceptions\Sms4bException
     */
    public function Execute()
    {
        if (CModule::IncludeModule('rarus.sms4b')) {
            $sms = new Csms4b();
            $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_BP_START_SEND_TO_PHONE'));
            $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_GET_PHONE') . $this->smsTo);
            try {
                $this->senderService->crmSendSms([$this->smsTo => $this->smsText], SITE_ID);
                $this->WriteToTrackingService(Loc::getMessage('SMS4B_MAIN_BP_TEXT') . $this->smsText . Loc::getMessage('SMS4B_MAIN_BP_SEND_TO_NUM') . $this->smsTo);
                $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_BP_TEXT') . $this->smsText . Loc::getMessage('SMS4B_MAIN_BP_SEND_TO_NUM') . $this->smsTo);
            } catch (\Exception $e) {
                $this->WriteToTrackingService(Loc::getMessage('SMS4B_MAIN_BP_TEXT') . $this->smsText . Loc::getMessage('SMS4B_MAIN_BP_NOT_SEND_TO_NUM') . $this->smsTo);
                $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_BP_TEXT') . $this->smsText . Loc::getMessage('SMS4B_MAIN_BP_NOT_SEND_TO_NUM') . $this->smsTo);
            }
            $sms->sms4bLog(Loc::getMessage('SMS4B_MAIN_BP_END_SEND_TO_PHONE') . "\n");
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
     * @return string - Свойства диалога
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
            }
        }

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
     * @return bool - результат выполнения
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
            'sms_text' => 'smsText'
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
        $arCurrentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($arWorkflowTemplate, $activityName);
        $arCurrentActivity['Properties'] = $arProperties;
        return true;
    }
}
