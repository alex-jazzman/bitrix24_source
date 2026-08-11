<?php
define('NO_KEEP_STATISTIC', 'Y');
define('NO_AGENT_STATISTIC','Y');
define('NO_AGENT_CHECK', true);
define('PUBLIC_AJAX_MODE', true);
define('DisableEventsCheck', true);

use Bitrix\Main\Application;
use Bitrix\Main\DB\SqlQueryException;
use Bitrix\Bizproc\Api\Enum\ErrorMessage;

$siteID = isset($_REQUEST['site'])? mb_substr(preg_replace('/[^a-z0-9_]/i', '', $_REQUEST['site']), 0, 2) : '';
if($siteID !== '')
{
	define('SITE_ID', $siteID);
}

require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_before.php');
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CUser $user */
$user = $GLOBALS["USER"];

if (!check_bitrix_sessid() || !is_object($user) || !$user->IsAuthorized() || !CModule::IncludeModule('bizproc'))
{
	die();
}

$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();

$action = $request->getPost('ajax_action');

if (empty($action))
	die('Unknown action!');

$APPLICATION->ShowAjaxHead();
$action = mb_strtoupper($action);

$writeResponse = function(\Bitrix\Main\Result $data)
{
	$errors = $data->getErrorMessages();
	$data = $data->getData();

	$result = array('data' => $data, 'errors' => $errors);
	$result['success'] = count($errors) === 0;
	if(!defined('PUBLIC_AJAX_MODE'))
	{
		define('PUBLIC_AJAX_MODE', true);
	}
	$GLOBALS['APPLICATION']->RestartBuffer();

	header('Content-Type: application/x-javascript; charset='.LANG_CHARSET);

	echo \Bitrix\Main\Web\Json::encode($result);
	\Bitrix\Main\Application::getInstance()->end();
};

$sendData = function (array $data) use ($writeResponse)
{
	$result = new \Bitrix\Main\Result();
	$result->setData($data);
	$writeResponse($result);
};

$sendError = function($error) use ($writeResponse)
{
	$result = new \Bitrix\Main\Result();
	$errors = (array)$error;
	foreach ($errors as $e)
	{
		$result->addError(new \Bitrix\Main\Error($e));
	}

	$writeResponse($result);
};

if ($action === 'GET_DESTINATION_DATA')
{
	$result = array('USERS' => array(), 'LAST' => array());
	if (CModule::includeModule('socialnetwork'))
	{
		$arStructure = CSocNetLogDestination::GetStucture(array());
		$result['DEPARTMENT'] = $arStructure['department'];
		$result['DEPARTMENT_RELATION'] = $arStructure['department_relation'];
		$result['DEPARTMENT_RELATION_HEAD'] = $arStructure['department_relation_head'];

		$result['DEST_SORT'] = CSocNetLogDestination::GetDestinationSort(array(
			"DEST_CONTEXT" => "BIZPROC_DESTINATION",
		));

		CSocNetLogDestination::fillLastDestination(
			$result['DEST_SORT'],
			$result['LAST']
		);

		$destUser = array();
		foreach ($result["LAST"]["USERS"] as $value)
		{
			$destUser[] = str_replace("U", "", $value);
		}

		$result["USERS"] = \CSocNetLogDestination::getUsers(array("id" => $destUser));
	}
	$sendData($result);
}

$moduleId = $request->getPost('module_id');
$entity = $request->getPost('entity');
$paramDocumentType = $request->getPost('document_type');
$paramDocumentId = $request->getPost('document_id');

if (!$moduleId || !$entity || !$paramDocumentType || (!$paramDocumentId && $action !== 'CHECK_PARAMETERS'))
{
	$sendError('Invalid request data');
}

$documentType = array($moduleId, $entity, $paramDocumentType);
$documentId = $paramDocumentId ? array($moduleId, $entity, $paramDocumentId) : null;

$documentStates = CBPDocument::GetDocumentStates($documentType, $documentId);
$userGroups = $user->GetUserGroupArray();

$currentUserId = (int)$user->getId();
$startRequestParameters = array_merge($request->getPostList()->toArray(), $request->getFileList()->toArray());

switch ($action)
{
	case 'GET_TEMPLATES':
		$templates = \CBPDocument::getTemplatesForStart(
			$currentUserId,
			$documentType,
			$documentId,
			['UserGroups' => $userGroups, 'DocumentStates' => $documentStates]
		);
		$sendData(['templates' => $templates]);
		break;

	case 'START_WORKFLOW':
		$templateId = (int)$request->getPost('template_id');

		if (
			$templateId <= 0
			|| !CBPDocument::CanUserOperateDocument(
				CBPCanUserOperateOperation::StartWorkflow,
				$currentUserId,
				$documentId,
				[
					'UserGroups' => $userGroups,
					'DocumentStates' => $documentStates,
					'WorkflowTemplateId' => $templateId,
				]
			)
		)
		{
			$sendError('Access Denied!');
		}

		$workflowParameters = (new \Bitrix\Bizproc\Api\Service\WorkflowTemplateService())
			->prepareStartParameters(
				new \Bitrix\Bizproc\Api\Request\WorkflowTemplateService\PrepareStartParametersRequest(
					templateId: $templateId,
					complexDocumentType: $documentType,
					requestParameters: $startRequestParameters,
					targetUserId: $currentUserId,
				)
			)
		;

		if (!$workflowParameters->isSuccess())
		{
			$workflowParameterError = $workflowParameters->getErrors()[0] ?? null;
			if ($workflowParameterError?->getCode() === ErrorMessage::TEMPLATE_NOT_FOUND->value)
			{
				$sendError('Access Denied!');
			}

			$sendError($workflowParameterError?->getMessage() ?? 'Internal error. Try to start again.');
		}

		$starter = (new \Bitrix\Bizproc\Public\Service\Workflow\StarterService())
			->getStarterForManualDocumentScenario(
				templateIds: [$templateId],
				context: new \Bitrix\Bizproc\Starter\Dto\ContextDto(
					'bizproc',
					\Bitrix\Bizproc\Starter\Enum\Face::WEB,
				),
				document: new \Bitrix\Bizproc\Starter\Dto\DocumentDto(
					complexDocumentId: $documentId,
					complexDocumentType: $documentType,
				),
				userId: $currentUserId,
				parameters: $workflowParameters->getParameters(),
			)
			->setValidateParameters(false)
		;

		$conn = Application::getConnection();
		$conn->startTransaction();
		$workflowId = null;

		try
		{
			$startResult = $starter->start();

			if (!$startResult->isSuccess())
			{
				$conn->rollbackTransaction();
				$sendError($startResult->getErrorMessages()[0] ?? 'Internal error. Try to start again.');
			}

			$workflowId = current($startResult->getWorkflowIds()) ?: null;
			if (!$workflowId)
			{
				$conn->rollbackTransaction();
				$sendError('Internal error. Try to start again.');
			}

			$conn->commitTransaction();

		}
		catch (SqlQueryException)
		{
			$conn->rollbackTransaction();
			$sendError('Internal error. Try to start again.');
		}

		$sendData(['workflow_id' => $workflowId]);
		break;

	case 'CHECK_PARAMETERS':
		if (
			!CBPDocument::CanUserOperateDocumentType(
				CBPCanUserOperateOperation::StartWorkflow,
				$currentUserId,
				$documentType,
				[
					'UserGroups' => $userGroups,
					'DocumentStates' => $documentStates,
				]
			)
		)
		{
			$sendError('Access Denied!');
		}

		$eventType = $request->getPost('auto_execute_type');

		$arDocumentStates = CBPWorkflowTemplateLoader::GetDocumentTypeStates(
			$documentType, $eventType
		);

		$parametersValues = [];

		foreach ($arDocumentStates as $template)
		{
			$templateId = (int)($template['TEMPLATE_ID'] ?? 0);
			$templateParameters = $template['TEMPLATE_PARAMETERS'] ?? null;
			if ($templateId <= 0 || !is_array($templateParameters) || !$templateParameters)
			{
				continue;
			}

			$requestParameters = [];
			foreach ($templateParameters as $key => $property)
			{
				$requestParameters[$key] = $startRequestParameters["bizproc{$templateId}_{$key}"] ?? null;
			}

			$preparedParameters = (new \Bitrix\Bizproc\Api\Service\WorkflowTemplateService())->prepareParameters(
				new \Bitrix\Bizproc\Api\Request\WorkflowTemplateService\PrepareParametersRequest(
					templateParameters: $templateParameters,
					requestParameters: $requestParameters,
					complexDocumentType: $documentType,
				)
			);
			if (!$preparedParameters->isSuccess())
			{
				$sendError($preparedParameters->getErrorMessages()[0] ?? 'Internal error. Try to start again.');
			}

			$parametersValues[$templateId] = $preparedParameters->getParameters();
		}

		$sendData(['parameters' => CBPDocument::signParameters($parametersValues)]);
		break;
}

$sendError('Unknown action!');
