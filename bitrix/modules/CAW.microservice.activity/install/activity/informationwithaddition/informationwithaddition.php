<?php if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use \Bitrix\Main\Localization\Loc;
use Bitrix\Bizproc;

Loc::loadLanguageFile(__FILE__);

class CBPInformationWithAddition 	
extends CBPCompositeActivity //CBPCompositeActivity// 
{
	const ACTIVITY = 'InformationWithAddition';
	const CONTROLS_PREFIX = 'bprioact_';

    public function __construct($name)
    {
        parent::__construct($name);
        // Определим свойство действия MyText
        // Оно может быть задано в визуальном редакторе при 
 		// помещении действия в шаблон бизнес-процесса
        $this->arProperties = array(
            "Title" => "", 
            "coordinating" => null,
            "taskname" => null,
            "taskdesc" => null,
            "agree" => null,
            "setheader"=>null,
            "textheader"=>null
        );
    }

    //не знаю когда срабатывает
    //как понимаю что вообще делает активити
    public function Execute()
    {

    }

    //Выводим диалог настройки параметров действия. Если параметры уже были заданы, то они инициализируются:
    //срабатывает при открытии формы в бп
    public static function GetPropertiesDialog(
        $documentType, 
        $activityName, 
        $arWorkflowTemplate, 
        $arWorkflowParameters, 
        $arWorkflowVariables, 
        $arCurrentValues = null, 
        $formName = "")
    {
        if (!is_array($arCurrentValues)) {
            $arCurrentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($arWorkflowTemplate, $activityName);
            if (is_array($arCurrentActivity['Properties'])) {
                $arCurrentValues = array(
                    "Title" => "", 
                    "coordinating" => null,
                    "taskname" => null,
                    "taskdesc" => null,
                    "agree" => null,
                    "setheader"=>null,
                    "textheader"=>null
                    );
                foreach($arCurrentValues as $key => &$value){
                    $value=$arCurrentActivity['Properties'][$key];
                }
            }
        }
        $arCurrentValues["YesNo"]=array("Да","Нет");
        //СДЕЛАТЬ ЗДЕСЬ ЗАГРУЗКУ С МИКРОСЕРВИСА ДАННЫХ ДЛЯ ПОЛЯ СОГЛАСУЮЩИЕ
        $arCurrentValues['coordinating_items']=array("Фин. Менеджер","Ведущий","Администратор","Управитель бизнеса","Фин. Директор");
        
        $runtime = CBPRuntime::GetRuntime();
        return $runtime->ExecuteResourceFile(
            __FILE__,
            "properties_dialog.php",
            array(
                "arCurrentValues" => $arCurrentValues, 
                "formName" => $formName,
            )
        );
    }


//Сохранение настроек, сделанных в диалоге настройки действия:
//срабатывает когда нажали кнопку сохранить
    public static function GetPropertiesDialogValues($documentType, $activityName, &$arWorkflowTemplate, &$arWorkflowParameters, &$arWorkflowVariables, $arCurrentValues, &$arErrors)
    {
    //AddMessage2log($arCurrentValues);
        $arProperties=array(            
        "Title" => "", 
        "coordinating" => null,
        "taskname" => null,
        "taskdesc" => null,
        "agree" => null,
        "setheader"=>null,
        "textheader"=>null
        );

        //Получили данные с формы в arcurrentValues
            if (is_array($arCurrentValues) && count($arCurrentValues)>0)
            {
                foreach($arProperties as $key => &$value){
                    $value=$arCurrentValues[$key];
                }
                $arErrors = self::ValidateProperties($arProperties,
                new CBPWorkflowTemplateUser(CBPWorkflowTemplateUser::CurrentUser));
                if (count($arErrors) > 0) {
                    return false;
                }
                $arCurrentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($arWorkflowTemplate, $activityName);
                $arCurrentActivity['Properties'] = $arProperties;
            }
        //Получаем переменные текущего действия по ссылке и заменяем их
        $arCurrentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($arWorkflowTemplate, $activityName);
        $arCurrentActivity["Properties"] = $arProperties;
        return true;
    }


//Проверка параметров действия:
//система Битрикс будет автоматически вызывать метод ValidateProperties($arProperties) для валидации свойств перед выполнением активити
    public static function ValidateProperties($arTestProperties = array(), CBPWorkflowTemplateUser $user = null)
    {
        $arErrors = [];
        if (!array_key_exists('coordinating', $arTestProperties) || strlen($arTestProperties['coordinating']) <= 0) {
            $arErrors[] = [
                'code' => 'NotExist',
                'parameter' => 'coordinating',
                'message' => Loc::getMessage('EMPTY_coordinating')
            ];
        }

        if (!array_key_exists('taskname', $arTestProperties) || strlen($arTestProperties['taskname']) <= 0) {
            $arErrors[] = [
                'code' => 'NotExist',
                'parameter' => 'taskname',
                'message' => Loc::getMessage('EMPTY_taskname')
            ];
        }

        if (!array_key_exists('taskdesc', $arTestProperties) || strlen($arTestProperties['taskdesc']) <= 0) {
            $arErrors[] = [
                'code' => 'NotExist',
                'parameter' => 'taskdesc',
                'message' => Loc::getMessage('EMPTY_taskdesc')
            ];
        }

        if (!array_key_exists('agree', $arTestProperties) || strlen($arTestProperties['agree']) <= 0) {
            $arErrors[] = [
                'code' => 'NotExist',
                'parameter' => 'agree',
                'message' => Loc::getMessage('EMPTY_agree')
            ];
        }

        if (!array_key_exists('setheader', $arTestProperties) || strlen($arTestProperties['setheader']) <= 0) {
            $arErrors[] = [
                'code' => 'NotExist',
                'parameter' => 'setheader',
                'message' => Loc::getMessage('EMPTY_setheader')
            ];
        }


        if (!array_key_exists('textheader', $arTestProperties) || strlen($arTestProperties['textheader']) <= 0) {
            $arErrors[] = [
                'code' => 'NotExist',
                'parameter' => 'textheader',
                'message' => Loc::getMessage('EMPTY_textheader')
            ];
        }


        return array_merge($arErrors, parent::ValidateProperties($arTestProperties, $user));
    }

}