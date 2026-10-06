<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use \Bitrix\Main\Localization\Loc;
Loc::loadMessages(__FILE__);

if (!isset($agreement))
{
	$agreement = [
		'TITLE' => '',
		'CONTENT' => '',
		'ACTIVE' => 'Y'
	];
}
// the key is printed raw into ids and aria references below: the allowlist is its only guard,
// and an empty key would leave those ids without their distinguishing part
if (!isset($id) || (string)$id === '' || preg_match('/[^a-z0-9_]/i', $id))
{
	$id = strtolower(\randString(5));
}
if (!isset($agreementType))
{
	$agreementType = 'CUSTOM';
}

// main.post.form params
$formParams = function(string $fieldName, string $value): array
{
	$randString = strtolower(\randString(5));
	return [
		'FORM_ID' => 'agreements_form_' . $randString,
		'SHOW_MORE' => 'Y',
		'PARSER' => [
			'Bold', 'Italic', 'Underline', 'Strike',
			'Justify', 'CreateLink', 'Quote',
			'InsertOrderedList', 'InsertUnorderedList'
		],
		'BUTTONS' => [
			'CreateLink',
			'Quote'
		],
		'TEXT' => [
			'ID' => 'field_' . $randString,
			'NAME' => $fieldName,
			'VALUE' => $value,
			'HEIGHT' => '160px',
			'SHOW' => 'Y'
		],
		'LHE' => [
			'height' => 120,
			'documentCSS' => '',
			'fontFamily' => '\'Helvetica Neue\', Helvetica, Arial, sans-serif',
			'fontSize' => '12px',
			'lazyLoad' => false,
			'setFocusAfterShow' => false
		]
	];
};
?>


<div class="landing-agreement-block" data-testid="site-cookies-agreement">
	<?if ($agreementType !== 'CUSTOM'):?>
		<div class="landing-agreement-input-block">
			<input type="hidden" name="<?= 'agreement_active_' . $id;?>"  value="N" >
			<input type="checkbox" name="<?= 'agreement_active_' . $id;?>" class="landing-agreement-input"<?if ($agreement['ACTIVE'] == 'Y'){?> checked="checked"<?}?> id="<?= 'agreement_active_' . $id;?>" value="Y" data-testid="site-cookies-active-checkbox" >
			<label class="landing-agreement-input-label" for="<?= 'agreement_active_' . $id;?>" data-testid="site-cookies-active-label"><?= Loc::getMessage('LANDING_TPL_TITLE_SHOW_COOKIES', ['#BLOCK_NAME#' => \htmlspecialcharsbx($agreement['TITLE'])]);?></label>
		</div>
	<?endif;?>
	<div class="landing-agreement-block-inner<?if ($agreement['ACTIVE'] == 'Y'){?> landing-agreement-block-inner-show<?}?>" data-testid="site-cookies-agreement-content">
		<div class="landing-agreement-block-hidden">
			<div class="landing-agreement-cookies-name-block">
				<?if ($agreementType == 'CUSTOM'):?>
					<?php /* the script walks these four nodes by previousElementSibling: nothing may be
					inserted between them, so the text of an icon button is printed inside it */ ?>
					<span class="landing-agreement-cookies-name">
						<span class="landing-agreement-cookies-name-value" id="<?= 'agreement_name_' . $id;?>" data-testid="site-cookies-name-value"><?= $agreement['TITLE'] ? \htmlspecialcharsbx($agreement['TITLE']) : Loc::getMessage('LANDING_TPL_NEW_COOKIES');?></span>
						<input type="text" class="landing-agreement-cookies-name-input" name="<?= 'agreement_title_' . $id;?>" value="<?= \htmlspecialcharsbx($agreement['TITLE']);?>" size="50" aria-label="<?= \htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_BBFORM_TITLE_LABEL'));?>" data-testid="site-cookies-name-input"/>
						<button type="button" class="landing-agreement-edit" id="<?= 'agreement_edit_' . $id;?>" aria-labelledby="<?= 'agreement_edit_' . $id;?> <?= 'agreement_name_' . $id;?>" data-testid="site-cookies-edit-btn"><span class="landing-agreement-icon-text"><?= Loc::getMessage('LANDING_TPL_BBFORM_ACTION_EDIT');?></span></button>
						<button type="button" class="landing-agreement-delete" id="<?= 'agreement_delete_' . $id;?>" aria-labelledby="<?= 'agreement_delete_' . $id;?> <?= 'agreement_name_' . $id;?>" data-testid="site-cookies-delete-btn"><span class="landing-agreement-icon-text"><?= Loc::getMessage('LANDING_TPL_BBFORM_ACTION_DELETE');?></span></button>
					</span>
				<?endif;?>
			</div>
			<div class="landing-agreement-label" id="<?= 'agreement_desc_' . $id;?>"><?= Loc::getMessage('LANDING_TPL_LABEL_DESC');?></div>
			<?php /* the editable node is built by the client of the main module, so the caption is bound
			to the frame landing owns */ ?>
			<div class="landing-agreement-editor" role="group" aria-labelledby="<?= 'agreement_desc_' . $id;?>" data-testid="site-cookies-editor">
				<?$APPLICATION->IncludeComponent(
					'bitrix:main.post.form',
					'',
					$formParams(
						'agreement_text_' . $id,
						$agreement['CONTENT']
					),
					false,
					['HIDE_ICONS' => 'Y']
				);?>
			</div>
		</div>
	</div>
</div>