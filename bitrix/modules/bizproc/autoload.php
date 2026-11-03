<?php

$arClasses = array(
	"CBPActivity" => "classes/general/activity.php",
	"CBPActivityCondition" => "classes/general/activitycondition.php",
	"CBPCompositeActivity" => "classes/general/compositeactivity.php",
	"CBPActivityExecutionStatus" => "classes/general/constants.php",
	"CBPActivityExecutionResult" => "classes/general/constants.php",
	"CBPWorkflowStatus" => "classes/general/constants.php",
	"CBPActivityExecutorOperationType" => "classes/general/constants.php",
	"CBPDocumentEventType" => "classes/general/constants.php",
	"CBPCanUserOperateOperation" => "classes/general/constants.php",
	"CBPSetPermissionsMode" => "classes/general/constants.php",
	"CBPTaskStatus" => "classes/general/constants.php",
	"CBPTaskUserStatus" => "classes/general/constants.php",
	"CBPTaskDelegationType" => "classes/general/constants.php",
	"CBPDocument" => "classes/general/document.php",
	"CBPDocumentService" => "classes/general/documentservice.php",
	"CBPArgumentException" => "classes/general/exception.php",
	"CBPArgumentNullException" => "classes/general/exception.php",
	"CBPArgumentOutOfRangeException" => "classes/general/exception.php",
	"CBPArgumentTypeException" => "classes/general/exception.php",
	"CBPInvalidOperationException" => "classes/general/exception.php",
	"CBPNotSupportedException" => "classes/general/exception.php",
	"CBPHelper" => "classes/general/helper.php",
	"CBPHistoryService" => "classes/general/historyservice.php",
	"CBPHistoryResult" => "classes/general/historyservice.php",
	"CBPRuntime" => "classes/general/runtime.php",
	"CBPRuntimeService" => "classes/general/runtimeservice.php",
	"CBPSchedulerService" => "classes/general/schedulerservice.php",
	"CBPStateService" => "classes/general/stateservice.php",
	"CBPTaskService" => "classes/general/taskservice.php",
	"CBPTaskResult" => "classes/general/taskservice.php",
	"CBPTrackingService" => "classes/general/trackingservice.php",
	'CBPTrackingServiceResult' => 'classes/general/trackingservice.php',
	"CBPTrackingType" => "classes/general/trackingservice.php",
	"CBPVirtualDocument" => "classes/general/virtualdocument.php",
	"CBPWorkflow" => "classes/general/workflow.php",
	"CBPWorkflowPersister" => "classes/general/workflowpersister.php",
	"CBPWorkflowTemplateLoader" => "classes/general/workflowtemplateloader.php",
	"CBPWorkflowTemplateResult" => "classes/general/workflowtemplateloader.php",
	"CBPWorkflowTemplateUser" => "classes/general/workflowtemplateloader.php",
	"CBPWorkflowTemplateValidationException" => "classes/general/workflowtemplateloader.php",
	"CBPViewHelper" => "classes/general/viewhelper.php",
	'CBPTaskChangedStatus' => "classes/general/constants.php",
	'CBPRestActivity' => 'classes/general/restactivity.php',
);
CModule::AddAutoloadClasses("bizproc", $arClasses);

// Backward compatibility after the PSR-4 migration: Resolver builds a lowercase class name for
// legacy action names (bizproc.workflow.start), and PSR-4 lookup is case-sensitive, so map them explicitly.
// The list is frozen at the names that had already left the module by then: a new controller gets no entry
// here - its actions are spelled in the letter case of the class - and no entry is ever dropped either.
// Composed by dev/psr4/generate-controller-map.php, pinned by tests/lib/Autoload/ControllerCompatibilityMapTest.php.
// A path typed by hand is a fatal error on every ajax hit: Loader::autoLoad() requires it without file_exists.
\Bitrix\Main\Loader::registerAutoLoadClasses('bizproc', [
	\bitrix\bizproc\controller\activity::class => 'lib/Controller/Activity.php',
	\bitrix\bizproc\controller\analytics::class => 'lib/Controller/Analytics.php',
	\bitrix\bizproc\controller\debugger::class => 'lib/Controller/Debugger.php',
	\bitrix\bizproc\controller\fieldtype::class => 'lib/Controller/FieldType.php',
	\bitrix\bizproc\controller\file::class => 'lib/Controller/File.php',
	\bitrix\bizproc\controller\globalfield::class => 'lib/Controller/GlobalField.php',
	\bitrix\bizproc\controller\robot::class => 'lib/Controller/Robot.php',
	\bitrix\bizproc\controller\script::class => 'lib/Controller/Script.php',
	\bitrix\bizproc\controller\storage::class => 'lib/Controller/Storage.php',
	\bitrix\bizproc\controller\task::class => 'lib/Controller/Task.php',
	\bitrix\bizproc\controller\workflow::class => 'lib/Controller/Workflow.php',
	\bitrix\bizproc\controller\workflow\comment::class => 'lib/Controller/Workflow/Comment.php',
	\bitrix\bizproc\controller\workflow\faces::class => 'lib/Controller/Workflow/Faces.php',
	\bitrix\bizproc\controller\workflow\starter::class => 'lib/Controller/Workflow/Starter.php',
]);

require_once __DIR__.DIRECTORY_SEPARATOR.'compatibility.php';

include_once __DIR__."/classes/general/interface.php";

$trackingServiceClass = \CBPTrackingService::class;
$optUseRestrictedTracking = \Bitrix\Main\Config\Option::get('bizproc', 'use_restricted_tracking');
if (
	$optUseRestrictedTracking === 'Y'
	|| (
		\Bitrix\Main\ModuleManager::isModuleInstalled('bitrix24')
		&& $optUseRestrictedTracking !== 'N'
	)
)
{
	$trackingServiceClass = \Bitrix\Bizproc\Service\RestrictedTracking::class;
}

\Bitrix\Main\DI\ServiceLocator::getInstance()->addInstanceLazy(
	'bizproc.service.trackingService',
	[
		'className' => $trackingServiceClass,
	]
);
