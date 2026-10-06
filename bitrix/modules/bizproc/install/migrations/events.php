<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	->registerCompatible('iblock', 'OnAfterIBlockElementDelete', 'CBPVirtualDocument', 'OnAfterIBlockElementDelete')
	->registerCompatible('main', 'OnAdminInformerInsertItems', 'CBPAllTaskService', 'OnAdminInformerInsertItems')
	->registerCompatible('rest', 'OnRestServiceBuildDescription', '\Bitrix\Bizproc\RestService', 'onRestServiceBuildDescription')
	->registerCompatible('rest', 'OnRestAppDelete', '\Bitrix\Bizproc\RestService', 'onRestAppDelete')
	->registerCompatible('rest', 'OnRestAppUpdate', '\Bitrix\Bizproc\RestService', 'onRestAppUpdate')
	->registerCompatible('timeman', 'OnAfterTMDayStart', 'CBPDocument', 'onAfterTMDayStart')
	->registerCompatible('im', 'OnGetNotifySchema', \Bitrix\Bizproc\Integration\NotifySchema::class, 'onGetNotifySchema')
	->register('rest', 'OnRestApplicationConfigurationImport', '\Bitrix\Bizproc\Integration\Rest\AppConfiguration', 'onEventImportController')
	->register('rest', 'OnRestApplicationConfigurationExport', '\Bitrix\Bizproc\Integration\Rest\AppConfiguration', 'onEventExportController')
	->register('rest', 'OnRestApplicationConfigurationClear', '\Bitrix\Bizproc\Integration\Rest\AppConfiguration', 'onEventClearController')
	->register('rest', 'OnRestApplicationConfigurationEntity', '\Bitrix\Bizproc\Integration\Rest\AppConfiguration', 'getEntityList')
	->register('forum', 'OnAfterCommentAdd', \Bitrix\Bizproc\Integration\CommentListener::class, 'onAfterCommentAdd')
	->register('forum', 'OnCommentDelete', \Bitrix\Bizproc\Integration\CommentListener::class, 'onCommentDelete')
	->register('socialnetwork', 'onContentViewed', \Bitrix\Bizproc\Integration\CommentListener::class, 'onSocnetContentViewed')
	->register('intranet', 'onSettingsProvidersCollect', '\Bitrix\Bizproc\Integration\Intranet\EventHandler', 'onSettingsProvidersCollect')
	->register('crm', 'DealCategoryOnBeforeDelete', '\Bitrix\Bizproc\Integration\Crm\CategoryEventListener', 'dealCategoryOnBeforeDelete')
	->register('crm', 'ItemCategoryOnBeforeDelete', '\Bitrix\Bizproc\Integration\Crm\CategoryEventListener', 'itemCategoryOnBeforeDelete')
	->register('ai', 'onContextGetMessages', '\Bitrix\Bizproc\Internal\Integration\AI\Event\EventHandler', 'onContextGetMessages')
	->register('intranet', 'onAddAbsence', '\Bitrix\Bizproc\Integration\Intranet\EventHandler', 'onAddAbsence')
	->register('aiassistant', 'AiAssistantAgentActivity::onCollectCustomContext', \Bitrix\Bizproc\Public\Integration\AiAssistant\EventHandler\AiAssistantAgentActivity::class, 'onCollectCustomContext')
	->register('humanresources', 'OnAiReportsEnabled', '\Bitrix\Bizproc\Integration\HumanResources\EventHandler', 'onAiReportsEnabled')
	->register(
		'bizproc',
		'onAfterWorkflowTemplateDelete',
		\Bitrix\Bizproc\Internal\Service\LastValues\EventHandler::class,
		'onAfterWorkflowTemplateDelete',
	)
	// Ownership of the workflows of a managed system AI agent copy: the barrier of OnCreateWorkflow runs before
	// the workflow is initialized, the two events that end a workflow release its ownership row.
	->registerCompatible(
		'bizproc',
		'OnCreateWorkflow',
		\Bitrix\Bizproc\Internal\AiAgent\Lifecycle\EventHandler\WorkflowLifecycleEventHandler::class,
		'onCreateWorkflow',
	)
	->registerCompatible(
		'bizproc',
		'OnWorkflowComplete',
		\Bitrix\Bizproc\Internal\AiAgent\Lifecycle\EventHandler\WorkflowLifecycleEventHandler::class,
		'onWorkflowComplete',
	)
	->register(
		'bizproc',
		'onAfterWorkflowKill',
		\Bitrix\Bizproc\Internal\AiAgent\Lifecycle\EventHandler\WorkflowLifecycleEventHandler::class,
		'onAfterWorkflowKill',
	)
;
