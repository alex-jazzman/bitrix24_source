<?php if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use \Bitrix\Main\Localization\Loc;
use Bitrix\Bizproc;
use Bitrix\Main\Loader;
use Bitrix\Main\Context;
use Bitrix\Crm\ActivityTable;
use Bitrix\Im\V2\Entity\User\NullUser;

Loc::loadLanguageFile(__FILE__);

class CBPInformationWithAddition 	
extends CBPCompositeActivity
implements IBPEventActivity, IBPActivityExternalEventListener
//мы наследуем интерфейс IBPEventActivity 
//поэтому нам нужно реализовать его методы subscribe и unsubscribe 
//и IBPActivityExternalEventListener метод OnExternalEvent 
{
	private $isInEventActivityMode = false;
    public function __construct($name)
    {
        parent::__construct($name);
        // Оно может быть задано в визуальном редакторе при 
 		// помещении действия в шаблон бизнес-процесса
        $this->arProperties = array(
            "Title" => "", 
            "coordinating" => null,
            "taskname" => null,
            "taskdesc" => null,
            "agree" => null,
            "setheader"=>null,
            "textheader"=>null,
            "requested_information"=>null,
            "check"=>null,
            "MapLinkDocument"=>null
        );
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
                    "textheader"=>null,
                    "requested_information"=>null,
                    "check"=>null,
                    "MapLinkDocument"=>null
                    );
                foreach($arCurrentValues as $key => &$value){
                    $value=$arCurrentActivity['Properties'][$key];
                }
            }
        }
        $runtime = CBPRuntime::GetRuntime();

        $arCurrentValues["YesNo"]=array(
			array("ID"=> 0, "NAME"=>"Нет"),
			array("ID"=> 1, "NAME"=>"Да"));
        //СДЕЛАТЬ ЗДЕСЬ ЗАГРУЗКУ С МИКРОСЕРВИСА ДАННЫХ ДЛЯ ПОЛЯ СОГЛАСУЮЩИЕ
        //$arCurrentValues['coordinating_items']=array("Фин. Менеджер","Ведущий","Администратор","Управитель бизнеса","Фин. Директор");
		try {
            $tokenMS = unserialize(COption::GetOptionString("main", "mws_CAW_token", "a:0:{}"));
            $urlMS = unserialize(COption::GetOptionString("main", "mws_CAW_url", "a:0:{}"));
			$curl = curl_init("https://".$urlMS."/api/coordinator/activity");
			$opt=array(
			CURLOPT_SSL_VERIFYHOST=>0,
			CURLOPT_SSL_VERIFYPEER=>0,
			CURLOPT_RETURNTRANSFER=>true,
			CURLOPT_HTTPHEADER=>array('mws-mikroserv-token: '.$tokenMS));
			curl_setopt_array($curl,$opt);
			$GetCordinatorfromMS = curl_exec($curl);
		//$GetCordinatorfromMS='{"users":[{"ID": "1","COORDINATOR_NAME": "Суппер Дир"},{"ID": "2","COORDINATOR_NAME": "Фин дир"}]}';
		$requestData=json_decode($GetCordinatorfromMS,true);
		$arCurrentValues['coordinating_items']=$requestData['users'];
		} catch(Exception $e){
		AddMessage2Log($e);
		$arCurrentValues['coordinating_items']=null;
		}
        AddMessage2Log($documentType);
        $documentService = $runtime->GetService("DocumentService");
        $arFieldTypes = $documentService->getDocumentFieldTypes($documentType);
		unset($arFieldTypes['N:Sequence']);
		unset($arFieldTypes['UF:resourcebooking']);
		$arDocumentFields = $documentService->getDocumentFields($documentType);
        $javascriptFunctions = $documentService->getJSFunctionsForFields(
			$documentType,
			"objFields",
			$arDocumentFields,
			$arFieldTypes
		);
        //===================================
        $requestedInformation =
			isset($arCurrentActivity['Properties']['requested_information']) && is_array($arCurrentActivity['Properties']['requested_information'])
				? $arCurrentActivity['Properties']['requested_information']
				: []
		;

		$requestedVariables = [];
		foreach ($requestedInformation as $variable)
		{
			if ($variable['Name'] == '')
			{
				continue;
			}
			$requestedVariables[] = $variable;
		}
        //===================================
		return $runtime->ExecuteResourceFile(
			__FILE__,
			"properties_dialog.php",
			array(
                "requestedInformation" => $requestedVariables,
				"arCurrentValues" => $arCurrentValues,
				"arDocumentFields" => $arDocumentFields,
                "javascriptFunctions" => $javascriptFunctions,
				"formName" => $formName,
			)
		);
    }


//Сохранение настроек, сделанных в диалоге настройки действия:
//срабатывает когда нажали кнопку сохранить
    public static function GetPropertiesDialogValues($documentType, $activityName, &$arWorkflowTemplate, &$arWorkflowParameters, &$arWorkflowVariables, $arCurrentValues, &$arErrors)
    {
        $arProperties=array(            
        "Title" => "", 
        "coordinating" => null,
        "taskname" => null,
        "taskdesc" => null,
        "agree" => null,
        "setheader"=>null,
        "textheader"=>null,
        "requested_information"=>null,
        "check"=>null
        );

        //Получили данные с формы в arcurrentValues
            if (is_array($arCurrentValues) && count($arCurrentValues)>0)
            {
                foreach($arProperties as $key => &$value){
                    $value=$arCurrentValues[$key];
                }
                if  (is_array($arCurrentValues["fields"]) && count($arCurrentValues["fields"]) > 0
                && is_array($arCurrentValues["values"]) && count($arCurrentValues["values"]) > 0)
                {
                    $arProperties['MapLinkDocument']=array();
                   foreach($arCurrentValues["fields"] as $key => $value)
                   array_push($arProperties["MapLinkDocument"], array("name"=>$arCurrentValues["fields"][$key],"variable"=>$arCurrentValues["values"][$key]));
                }
                $arErrors = self::ValidateProperties($arProperties,
                new CBPWorkflowTemplateUser(CBPWorkflowTemplateUser::CurrentUser));
                if (count($arErrors) > 0) {
                    return false;
                }
                //=============================================================================
                $documentService = CBPRuntime::getRuntime()->getDocumentService();
                $field = $documentService->getFieldTypeObject($documentType, array(
                    'FieldName' => 'requested_information'
                    ));

                if (!$field)
                {
                    $properties["requested_information"] = $arCurrentValues["requested_information"] ?? null;
                } else

                $properties["requested_information"] = $field->extractValue(
                    ['Field' => "requested_information"],
                    $arCurrentValues,
                    $errors
                );
            
    
            if (array_key_exists("requested_information", $properties) && is_array($properties["requested_information"]))
            {
                $requestedInformation = [];
                foreach ($properties["requested_information"] as $fieldValue)
                {
                    if ($fieldValue["Name"] == '')
                    {
                        continue;
                    }
    
                    $requestedInformation[] = $fieldValue;
                }
                $properties['requested_information'] = $requestedInformation;
            }
    
            $currentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($arWorkflowTemplate, $activityName);
            $currentActivity["Properties"] = $properties;
            
            if (is_array($properties["requested_information"]))
            {
                foreach ($properties["requested_information"] as $variable)
                {
                    $arWorkflowVariables[$variable['Name']] = ['Name' => $variable['Title']] + $variable;
                }
            }
                //=============================================================================
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
        //в основном все проверки типо если массив artestproperties не содержит свойства такого или есть и его кол-во символов меньше ровно 0 выкинь ошибка
        $arErrors = [];
        if (!array_key_exists('coordinating', $arTestProperties) || strlen($arTestProperties['coordinating']) <= 0) {
            $arErrors[] = [
                'code' => 'NotExist',
                'parameter' => 'coordinating',
                'message' => Loc::getMessage('EMPTY_coordinating')
            ];
        }

        if (array_key_exists('MapLinkDocument', $arTestProperties)) {
            $flag_error=false;
            foreach($arTestProperties["MapLinkDocument"] as $value)
            if (strlen($value['name'])<1 || strlen($value['variable'])<1) $flag_error=true;
            if ($flag_error)
            $arErrors[] = [
                'code' => 'NotExist',
                'parameter' => 'coordinating',
                'message' => Loc::getMessage('EMPTY_MapLinkDocument')
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

    // когда срабатывет активити чо делать
	public function Execute() //1
	{
		if ($this->isInEventActivityMode)
			return CBPActivityExecutionStatus::Closed; //действие завершило свою работу и может быть закрыто

		$this->Subscribe($this);

		$this->isInEventActivityMode = false;
		return CBPActivityExecutionStatus::Executing;// у действия еще есть работа, которую нужно доделать. 
        //Например, составное действие должно выполнить свои дочерние элементы. В этом случае составное действие
        // может запланировать запуск каждого своего дочернего действия и ожидать завершения их работы прежде, чем 
        //известить исполняющую среду о том, что данное действие завершилось.
	}

	//реализация интерфейса IBPEventActivity
	public function Subscribe(IBPActivityExternalEventListener $eventHandler) //2
	{   
        if ($eventHandler == null) throw new Exception("eventHandler");
		
        $AllFieldsIBlock=$this->workflow->GetService("DocumentService")->GetDocumentFields($this->GetDocumentType());
        $SelectQuery=[];
        addmessage2log($AllFieldsIBlock);
        foreach ($AllFieldsIBlock as $key => $element){
            if (isset($element['TypeReal']) && $element['TypeReal']=='F') array_push($SelectQuery,$key);
        }
        
        CModule::IncludeModule('iblock');
        $rs = CIBlockElement::GetList(array(), 
        array("ID" => $this->workflow->getDocumentId()[2]),false,false,
        $SelectQuery)->fetch();
        
        $FileID=[];
        foreach ($rs as $key => $element){
            if (str_ends_with($key,"_VALUE") && $element!=NULL) {
                $propertyName=str_replace(['PROPERTY_','_VALUE'],["",""],$key);
                $FileID[$propertyName]=$element;
            }
        }

        // if (Loader::includeModule("crm")) {
        //     // Получаем текущий контекст
        //     $context = Context::getCurrent();
        //     $request = $context->getRequest();
        //     $uploadedFile = $request->getFile("bprioact_revisionProtocolLider");
        // }

        $this->isInEventActivityMode = true;
		$data = [
			'proccess_id' => CBPActivity::GetWorkflowInstanceId()."|".$this->name, // ид бизнес-процесса && ид этапа исполнения
			'proccess_info' => $this->taskdesc, // Описание задания 
			'proccess_list' => $this->agree, // Лист согласования
            'proccess_name' => $this->taskname,
			'coordinator_id' => $this->coordinating, // Согласующие
		];
        if ($this->setheader==1){
            $this->SetStatusTitle($this->textheader);
        }
            if (count($FileID)>0){
            foreach($FileID as $key=> $element){
                $dataF=CFile::GetList(
                    array(), 
                    array("ID" => $element)
                )->fetch();
               if($dataF!=false) $data[$key]=new CURLFILE( \Bitrix\Main\Application::getDocumentRoot() .'/upload/'.$dataF['SUBDIR'].'/'.$dataF['FILE_NAME']); 
            }
        }
        $tokenMS = unserialize(COption::GetOptionString("main", "mws_CAW_token", "a:0:{}"));
        $urlMS = unserialize(COption::GetOptionString("main", "mws_CAW_url", "a:0:{}"));
		$curl = curl_init("https://".$urlMS."/api/document");
		$opt=array(
		CURLOPT_SSL_VERIFYHOST=>0,
		CURLOPT_SSL_VERIFYPEER=>0,
		CURLOPT_POST=>true,
		CURLOPT_POSTFIELDS=>$data,
		CURLOPT_RETURNTRANSFER=>true,
		CURLOPT_HTTPHEADER=>array('mws-mikroserv-token: '.$tokenMS));
		curl_setopt_array($curl,$opt);
		$response = curl_exec($curl);
		$result=json_decode($response,true);
		//if ($result != NULL && $result['doc'] != NULL) {
		$this->workflow->AddEventHandler($this->name, $eventHandler);
		//}
	}

    public function OnExternalEvent($arEventParameters = array())
	{
        $dataActivity=explode("|",$arEventParameters['context']['proccess_id']);
        $outputVariableInit=$this->getRootActivity()->getReadOnlyData()[$dataActivity[1]]['requested_information'];
        $outputVariable=[];
        $idFile=null;
        if (!empty($arEventParameters['fileA']))
        foreach ($arEventParameters['fileA'] as $key => $value) {
            $idFile=CFile::SaveFile($value,"upload/doc");
        }
        if (is_array($outputVariableInit))
        foreach ($outputVariableInit as $key => $value) {
            switch ($value['Type']) {
                case 'file':
                    if($idFile!=null) $outputVariable[$value['Name']]=$idFile;
                    break;
                case 'text':
                    if(isset($arEventParameters['context']['comment'])) $outputVariable[$value['Name']]=$arEventParameters['context']['comment'];
                    break;    
                default:
                    break;
            }
        }
        
        if(count($outputVariable)>0){
        $this->ResponcedInformation = $outputVariable;
		$this->getRootActivity()->SetVariables($outputVariable);
        }

        $this->Unsubscribe($this);
		if ($arEventParameters['context']['status'] == '1')
			$this->ExecuteOnApprove();
		else    
			$this->ExecuteOnNonApprove();
	}

	public function Unsubscribe(IBPActivityExternalEventListener $eventHandler)
	{
        if ($eventHandler == null)	throw new Exception("eventHandler");
        $this->workflow->RemoveEventHandler($this->name, $eventHandler);
	}

	protected function ExecuteOnApprove()
	{
		$this->WriteToTrackingService(GetMessage("BPAA_ACT_APPROVE"));
		$activity = $this->arActivities[0];
		$activity->AddStatusChangeHandler(self::ClosedEvent, $this);
		$this->workflow->ExecuteActivity($activity);
	}

	protected function ExecuteOnNonApprove()
	{
		$this->WriteToTrackingService(GetMessage("BPAA_ACT_NONAPPROVE"));
		$activity = $this->arActivities[1];
		$activity->AddStatusChangeHandler(self::ClosedEvent, $this);
		$this->workflow->ExecuteActivity($activity);
	}

	protected function OnEvent(CBPActivity $sender)
	{
		$sender->RemoveStatusChangeHandler(self::ClosedEvent, $this);
		$this->workflow->CloseActivity($this);
	}
}