<?php

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CMain $APPLICATION */
/** @var array $arResult */

Extension::load('crm.mail-template-editor');

$template = $arResult['TEMPLATE'];
$postFormParams = $arResult['POST_FORM_PARAMS'];
$viewField = null;

if (!$template['canEdit'])
{
	$postFormParams['BUTTONS'] = [];
	$postFormParams['isDnDEnabled'] = false;
	$postFormParams['LHE']['controlsMap'] = [];
	$postFormParams['LHE']['isCopilotEnabled'] = false;
	$postFormParams['LHE']['isCopilotTextEnabledBySettings'] = false;
	$postFormParams['LHE']['isCopilotImageEnabledBySettings'] = false;
	$postFormParams['LHE']['uploadImagesFromClipboard'] = false;
	$viewField = array_replace($postFormParams['PROPERTIES'][0], [
		'ENTITY_ID' => 'CRM_MAIL_TEMPLATE',
		'ENTITY_VALUE_ID' => $template['id'],
		'FIELD_NAME' => 'UF_ATTACHMENT',
	]);
	$postFormParams['PROPERTIES'] = [];
}

$editorOptions = [
	'containerId' => $arResult['CONTAINER_ID'],
	'editorContainerId' => $arResult['EDITOR_CONTAINER_ID'],
	'formId' => $arResult['FORM_ID'],
	'editorId' => $arResult['EDITOR_ID'],
	'initialData' => $template,
];
?>
<form
	class="crm-mail-template-editor__form"
	id="<?= htmlspecialcharsbx($arResult['FORM_ID']) ?>"
	method="post"
	data-testid="crm-mail-template-editor-form"
>
	<div class="crm-mail-template-editor__mount" id="<?= htmlspecialcharsbx($arResult['CONTAINER_ID']) ?>"></div>
	<div
		class="crm-mail-template-editor__native"
		id="<?= htmlspecialcharsbx($arResult['EDITOR_CONTAINER_ID']) ?>"
		hidden
	>
		<?php
		$APPLICATION->IncludeComponent(
			'bitrix:main.post.form',
			'',
			$postFormParams,
			null,
			['HIDE_ICONS' => 'Y'],
		);
		?>
		<?php if ($viewField !== null && $viewField['VALUE'] !== []): ?>
			<div class="crm-mail-template-editor__files" data-testid="crm-mail-template-editor-files">
				<?php
				$APPLICATION->IncludeComponent(
					'bitrix:disk.uf.file',
					'',
					[
						'EDIT' => 'N',
						'INLINE' => 'N',
						'PARAMS' => ['arUserField' => $viewField],
					],
					null,
					['HIDE_ICONS' => 'Y'],
				);
				?>
			</div>
		<?php endif; ?>
	</div>
</form>
<script>
	BX.ready(() => {
		const editor = new BX.Crm.MailTemplateEditor.Editor(<?= Json::encode($editorOptions) ?>);
		editor.start();
	});
</script>
