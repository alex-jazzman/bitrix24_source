<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

 use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Text\UtfSafeString;
use Bitrix\Main\Type\Collection;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\UI\FileInputUtility;
use Bitrix\Main\UI\Viewer\ItemAttributes;
use Bitrix\Main\UserField\File\UploaderContextGenerator;
use Bitrix\Main\UserField\Types\FileType;
use Bitrix\Main\Web\Json;
use Bitrix\Main\Web\Uri;

/**
 * @var array $arResult
 */

Extension::load('main.uf.file.uploader.selectable-view-widget');

$isAllowSwitchView = ($arResult['additionalParameters']['IS_ALLOW_SWITCH_VIEW'] ?? null) === 'Y';
$viewIdFromAdditionalParams = FileType::getCorrectViewOrNull($arResult['additionalParameters']['VIEW_ID'] ?? null);

$viewIdFromFieldSettings = FileType::getCorrectViewOrNull($arResult['userField']['SETTINGS']['DEFAULT_VIEW'] ?? null);

$viewSettings = [
	'isAllowSwitchView' => $isAllowSwitchView,
	'viewId' => $isAllowSwitchView ? $viewIdFromFieldSettings : $viewIdFromAdditionalParams,
];

$fileInputUtility = FileInputUtility::instance();
$uploaderContextGenerator = (new UploaderContextGenerator($arResult['userField']));

$controlId = $uploaderContextGenerator->getControlId();

$urlTemplate = CComponentEngine::makePathFromTemplate(
	'/bitrix/services/main/ajax.php'
	. '?action=ui.fileuploader.preview'
	. '&SITE_ID=#SITE#'
	. '&controller=main.fileUploader.fieldFileUploaderController'
	. '&controllerOptions=#CONTEXT#'
	. '&fileId=#FILE_ID#'
);

$valueIds = array_column($arResult['value'], 'ID');
Collection::normalizeArrayValuesByInt($valueIds);
$valueIds = implode('_', $valueIds);

$containerId = "file_container__{$controlId}__{$valueIds}";

$fileItems = [];
foreach($arResult['value'] as $file)
{
	if (!is_array($file))
	{
		continue;
	}

	$fileId = (int)$file['ID'];
	$fileName = $file['ORIGINAL_NAME'];

	$addScopeTokenUrlParam = static function (string $url, int $fileId) use ($arResult)
	{
		$scope =
			($arResult['userField']['ENTITY_ID'] ?? 'uf_file')
			. '_'
			. ($arResult['userField']['ENTITY_VALUE_ID'] ?? '0')
		;

		$service = ServiceLocator::getInstance()->get('disk.scopeTokenService');
		if (!isset($service))
		{
			return $url;
		}

		if (!$service->grantAccessToScope($scope))
		{
			return $url;
		}

		$scopeToken = $service->getEncryptedScopeForObject($fileId, $scope);
		if (empty($scopeToken))
		{
			return $url;
		}

		$uri = new Uri($url);
		$uri->addParams([
			'_esd' => $scopeToken,
		]);

		return $uri->getUri();
	};

	$fileUrlForViewer = $file['SRC'] ?? null;
	if (!empty($arResult['additionalParameters']['URL_TEMPLATE']))
	{
		$fileUrlForViewer = \CComponentEngine::MakePathFromTemplate(
			$arResult['additionalParameters']['URL_TEMPLATE'],
			['file_id' => $fileId]
		);
	}
	$fileUrlForViewer = $addScopeTokenUrlParam($fileUrlForViewer, $fileId);

	$viewerAttributes = ItemAttributes::tryBuildByFileId($fileId, $fileUrlForViewer);
	$viewerAttributes->setTitle($fileName);
	$viewerAttributes->setGroupBy($containerId);

	$fileExtensionPosition = UtfSafeString::getLastPosition($fileName, '.');
	$fileExtension = $fileExtensionPosition === false ? '' : mb_substr($fileName, $fileExtensionPosition + 1);

	$fileContext = $uploaderContextGenerator->getContextForFileInViewMode($fileId);
	$fileUrl = CComponentEngine::makePathFromTemplate($urlTemplate, [
		'FILE_ID' => $fileId,
		'CONTEXT' => urlencode(Json::encode($fileContext['controllerOptions'])),
	]);
	$fileUrl = $addScopeTokenUrlParam($fileUrl, $fileId);

	$fileItems[] = [
		'name' => $fileName,
		'extension' => $fileExtension,
		'isImage' => $viewerAttributes->getViewerType() === 'image',
		'url' => $fileUrl,
		'urlForViewer' => $fileUrlForViewer,
		'attributes' => $viewerAttributes->toVueBind(),
	];
}

$widgetOptions = [
	'fileItems' => $fileItems,
	'viewSettings' => $viewSettings,
];
?>
<span class="fields file field-wrap --ui-context-content-light">
	<div id="<?= htmlspecialcharsbx($containerId) ?>"></div>
</span>

<script>
	BX.ready(() => {
		BX.Runtime
			.loadExtension('main.uf.file.uploader.selectable-view-widget')
			.then(({ SelectableViewWidget }) => {
				const widget = new SelectableViewWidget(<?= Json::encode($widgetOptions) ?>);
				widget.mount(document.getElementById('<?= CUtil::JSEscape($containerId) ?>'));
			})
		;
	});
</script>
