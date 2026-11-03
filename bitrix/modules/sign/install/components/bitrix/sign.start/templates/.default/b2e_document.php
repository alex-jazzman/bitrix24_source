<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}
/** @var array $arParams */
/** @var \CMain $APPLICATION */
/** @var SignStartComponent $component */

$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();
$folderId = (int)$request->get('folderId');
$isOpenedAsFolder = $request->get('isOpenedAsFolder') === 'Y';
$urlAfterClose = ($component->getRequest('inlineCrm') === 'Y' || $component->getRequest('noRedirect') === 'Y')
	? '' : \Bitrix\Sign\Document\Entity\SmartB2e::getEntityDetailUrlId()
;

// The line "Created by the process ..." stands here, on the surface sign owns: the card of the document
// itself is a component of crm and takes nothing from outside (Q-4). The page addresses the document by the
// element of the smart process, while the process is asked for by the document of the module, so the
// identifier is resolved here - and only while the feature is on, so a portal without it pays no query
// (AC-017).
$processLinkContainerId = 'sign-b2e-document-process-link';
$processLinkDocumentId = 0;
if (\Bitrix\Sign\Config\Feature::instance()->isKedoRunProcessEnabled())
{
	$entityId = (int)$component->getRequest('docId');
	$processLinkDocumentId = $entityId < 1 ? 0 : (int)(
		\Bitrix\Sign\Service\Container::instance()
			->getDocumentRepository()
			->getByEntityIdAndType($entityId, \Bitrix\Sign\Type\Document\EntityType::SMART_B2E)
			?->id ?? 0
	);
}

if ($processLinkDocumentId > 0)
{
	\Bitrix\Main\UI\Extension::load(['sign.v2.b2e.document-process-link']);
	?>
	<div id="<?= htmlspecialcharsbx($processLinkContainerId) ?>"></div>
	<script>
		BX.ready(function() {
			BX.Sign.V2.B2e.DocumentProcessLink.mount({
				containerId: '<?= CUtil::JSEscape($processLinkContainerId) ?>',
				documentId: <?= $processLinkDocumentId ?>,
			});
		});
	</script>
	<?php
}
?>

<?php
$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:sign.master',
		'POPUP_COMPONENT_PARAMS' => [
			'CATEGORY_ID' => $component->getRequest('categoryId'),
			'PAGE_URL_EDIT' => $arParams['PAGE_URL_EDIT'],
			'VAR_DOC_ID' => 'docId',
			'VAR_STEP_ID' => 'stepId',
			'TEMPLATE_FOLDER_ID' => $folderId,
			'IS_OPENED_AS_FOLDER' => $isOpenedAsFolder,
			'CRM_ENTITY_TYPE_ID' => \Bitrix\Sign\Document\Entity\SmartB2e::getEntityTypeId(),
			'ENTITY_TYPE_ID' => \Bitrix\Sign\Type\Document\EntityType::SMART_B2E,
			'OPEN_URL_AFTER_CLOSE' => $urlAfterClose,
			'SCENARIO' => \Bitrix\Sign\Type\DocumentScenario::SCENARIO_TYPE_B2E,
		],
		'PLAIN_VIEW' => true,
		'USE_BACKGROUND_CONTENT' => false,
		'USE_PADDING' => false,
		'USE_UI_TOOLBAR' => false
	],
	$this->getComponent()
);
