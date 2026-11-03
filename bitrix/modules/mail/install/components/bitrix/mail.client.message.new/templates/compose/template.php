<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

/** @var array $arParams */
/** @var array $arResult */
/** @global \CMain $APPLICATION */
/** @var \CBitrixComponentTemplate $this */
/** @var \CMailClientMessageNewComponent $component */

$composeData = $arResult['COMPOSE_FORM_DATA'];

Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'pull.client',
	'mail.migration-state',
]);

Extension::load('mail.client.compose-form');

// The form is not built on this extension and asks for it when it starts the scenario; loading it with the
// page keeps the core on hand by then and leaves it out of a screen where the feature is switched off.
if ($composeData['largeAttachment']['localFeatureAvailable'])
{
	Extension::load('mail.client.large-attachment');
}

$APPLICATION->setTitle($composeData['title']);

// Both maps are declared as object<string, ...>: an empty PHP map would otherwise reach the client
// as [] and change the type of the field.
$composeData['signatures']['bySender'] = (object)$composeData['signatures']['bySender'];
$composeData['signatures']['choices'] = (object)$composeData['signatures']['choices'];

$initialData = Json::encode($composeData);
$mailboxIds = array_values(array_unique(array_filter(array_map(
	'intval',
	array_merge(
		[
			$composeData['mailbox']['id'] ?? 0,
			$composeData['send']['mailboxId'] ?? 0,
		],
		array_column($composeData['senders'] ?? [], 'mailboxId'),
	),
))));
if ($mailboxIds !== [] && \Bitrix\Main\Loader::includeModule('pull'))
{
	global $USER;
	foreach ($mailboxIds as $mailboxId)
	{
		\CPullWatch::add((int)$USER->getId(), 'mail_mailbox_' . $mailboxId);
	}
}

$copilotEnabled = (bool)($composeData['copilot']['isCopilotEnabled'] ?? false);
$copilotParams = $copilotEnabled
	? [
		'moduleId' => $composeData['copilot']['moduleId'] ?? 'main',
		'contextId' => $composeData['copilot']['contextId'] ?? 'bxhtmled_copilot',
		'category' => $composeData['copilot']['category'] ?? null,
		// No invitation line in the body: the BitrixGPT control of the footer is the entry point here.
		'invitationLineMode' => 'none',
		'contextParameters' => $composeData['copilot']['contextParameters'] ?? [],
	]
	: null
;

// The letter is a document of its own, and the editor loads only the structural tokens into it; the colours the
// form styles the letter with are air tokens, so their stylesheet goes to the form for the head of that document.
$editorHeadHtml = '';
foreach (Extension::getAssets('ui.design-tokens.air')['css'] as $cssPath)
{
	$editorHeadHtml .= '<link rel="stylesheet" href="' . htmlspecialcharsbx(\CUtil::GetAdditionalFileURL($cssPath)) . '">';
}

?>

<form
	id="mail_compose_form"
	method="post"
	enctype="multipart/form-data"
	action="<?= htmlspecialcharsbx($composeData['send']['actionUrl']) ?>"
>
	<?= bitrix_sessid_post() ?>
	<div id="mail-compose-form-container"></div>
	<?php $APPLICATION->includeComponent(
		'bitrix:main.post.form',
		'',
		[
			'FORM_ID' => 'mail_compose_form_editor',
			'SHOW_MORE' => 'N',
			'PARSER' => [
				'Bold', 'Italic', 'Underline', 'Strike', 'ForeColor',
				'FontList', 'FontSizeList', 'RemoveFormat',
				'Quote', 'Code', 'Source', 'Table',
				'CreateLink', 'Image', 'UploadImage',
				'Justify', 'InsertOrderedList', 'InsertUnorderedList',
			],
			'BUTTONS' => ['UploadImage', 'UploadFile', 'Copilot'],
			'TEXT' => [
				'INPUT_NAME' => 'dummy_data[message]',
				'VALUE' => '',
				'SHOW' => 'Y',
			],
			'PROPERTIES' => [
				[
					'USER_TYPE_ID' => 'disk_file',
					'USER_TYPE' => [
						'TAG' => 'bxacid:#id#',
						'REGEXP' => '/(?:bxacid):(n?\d+)/ig',
					],
					'FIELD_NAME' => 'data[__diskfiles][]',
					'VALUE' => array_column($composeData['attachments']['files'], 'id'),
					'HIDE_CHECKBOX_ALLOW_EDIT' => 'Y',
					'HIDE_CHECKBOX_PHOTO_TEMPLATE' => 'Y',
				],
			],
			'LHE' => [
				'id' => 'mail_compose_form_editor_lhe',
				'fontSize' => '15px',
				'height' => 200,
				// The letter grows with its text and the form scrolls as a whole; no scroll of its own.
				'autoResizeMaxHeight' => 'Infinity',
				// The floor belongs to the editor: it writes min-height on its own container inline.
				'minBodyHeight' => 240,
				'lazyLoad' => true,
				'bbCode' => false,
				'setFocusAfterShow' => true,
				/*
				 * `html body` rather than `body`: in the Infinity mode the editor appends its own
				 * iframe-style.css to the end of the head once more, after this rule, and at equal
				 * specificity the later sheet would win back its 18px padding and 14px font.
				 */
				'iframeCss' => 'html body { padding-left: 0 !important; font-size: 15px; color: var(--ui-color-base-1); }',
				'useFileDialogs' => false,
				'useLinkStat' => false,
				'uploadImagesFromClipboard' => false,
				'autoLink' => true,
				'controlsMap' => [
					['id' => 'Bold', 'compact' => true, 'sort' => 10],
					['id' => 'Italic', 'compact' => true, 'sort' => 20],
					['id' => 'Underline', 'compact' => true, 'sort' => 30],
					['id' => 'Strikeout', 'compact' => true, 'sort' => 40],
					['id' => 'RemoveFormat', 'compact' => true, 'sort' => 50],
					['id' => 'Color', 'compact' => true, 'sort' => 60],
					['id' => 'FontSelector', 'compact' => false, 'sort' => 70],
					['id' => 'FontSize', 'compact' => false, 'sort' => 80],
					['separator' => true, 'compact' => false, 'sort' => 90],
					['id' => 'OrderedList', 'compact' => true, 'sort' => 100],
					['id' => 'UnorderedList', 'compact' => true, 'sort' => 110],
					['id' => 'AlignList', 'compact' => false, 'sort' => 120],
					['separator' => true, 'compact' => false, 'sort' => 130],
					['id' => 'InsertLink', 'compact' => true, 'sort' => 140],
					['id' => 'InsertImage', 'compact' => false, 'sort' => 150],
					['id' => 'InsertTable', 'compact' => false, 'sort' => 170],
					['id' => 'Code', 'compact' => true, 'sort' => 180],
					['id' => 'Quote', 'compact' => true, 'sort' => 190],
					['separator' => true, 'compact' => false, 'sort' => 200],
					['id' => 'Fullscreen', 'compact' => false, 'sort' => 210],
					['id' => 'BbCode', 'compact' => false, 'sort' => 220],
					['id' => 'More', 'compact' => true, 'sort' => 400],
				],
				'isMentionUnavailable' => true,
				'isCopilotEnabled' => $copilotEnabled,
				'copilotParams' => $copilotParams,
				'isCopilotImageEnabledBySettings' => $composeData['copilot']['isCopilotImageEnabled'] ?? false,
				'isCopilotTextEnabledBySettings' => $composeData['copilot']['isCopilotTextEnabled'] ?? false,
			],
		],
		false,
		['HIDE_ICONS' => 'Y', 'ACTIVE_COMPONENT' => 'Y'],
	); ?>
</form>

<script>
	BX.ready(function() {
		var application = new BX.Mail.Client.ComposeForm.ComposeForm({
			containerId: 'mail-compose-form-container',
			formId: 'mail_compose_form',
			editorFormId: 'mail_compose_form_editor',
			editorId: 'mail_compose_form_editor_lhe',
			editorHeadHtml: <?= Json::encode($editorHeadHtml) ?>,
			initialData: <?= $initialData ?>,
		});
		application.start();
	});
</script>
