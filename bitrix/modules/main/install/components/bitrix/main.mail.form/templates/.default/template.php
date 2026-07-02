<?php

use Bitrix\Main\Web\Json;
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @global CMain $APPLICATION
 * @var array $arParams
 */

\Bitrix\Main\UI\Extension::load([
	'ui.design-tokens',
	'main.core',
	'ui.alerts',
	'ui.buttons',
	'ui.entity-selector',
	'calendar.util',
	'ui.tour',
	'ui.mail.sender-selector',
]);

\CJSCore::Init("loader");

$htmlFormId = htmlspecialcharsbx('main_mail_form_'.$arParams['FORM_ID']);
$renderFieldOptions = [
	'isSenderAvailable' => $arParams['IS_SMTP_AVAILABLE'] ?? false,
];

$renderField = function($htmlFormId, $field, $isExt = false, $version, $renderFieldOptions)
{
	global $APPLICATION;

	if (in_array($field['type'], array('editor', 'files')))
		return;

	$htmlFieldId = sprintf('%s_%s', $htmlFormId, htmlspecialcharsbx($field['id']));

	?><tr id="<?=$htmlFieldId ?>"
		<?php if (!empty($field['hidden']) || !empty($field['folded'])): ?> style="display: none; "<?php endif ?>><?

		$titleSubClass = 'main-mail-form-field-title-cell';
		if (!empty($field['required']))
			$titleSubClass .= ' main-mail-form-field-title-required';

		$valueSubClass = 'main-mail-form-field-value-cell';
		if (!empty($field['short']))
			$valueSubClass .= ' main-mail-form-field-value-short';
		if (!empty($field['menu']))
			$valueSubClass .= ' main-mail-form-field-value-menu-ext';

		switch ($field['type'])
		{
			case 'separator':
				?>
				<td colspan="2" class="main-mail-form-fields-table-cell">
					<div class="main-mail-form-border-bottom"></div>
				</td>
				<?
				break;

			case 'list':
				?>
				<td class="main-mail-form-fields-table-cell <?=$titleSubClass ?>">
					<span class="main-mail-form-field-spacer-25"></span>
					<label class="main-mail-form-field-title" id="<?=$htmlFieldId ?>_label"><?=preg_replace('/[\r\n]+/', '<br>', htmlspecialcharsbx($field['title'])) ?>:</label>
				</td>
				<td class="main-mail-form-fields-table-cell <?=$valueSubClass ?>">
					<input type="hidden"
						id="<?=$htmlFieldId ?>_value"
						name="<?=htmlspecialcharsbx($field['name']) ?>"
						value="<?=htmlspecialcharsbx($field['value']) ?>">
					<span class="main-mail-form-field-spacer-25"></span>
					<button type="button" class="main-mail-form-field-title main-mail-form-field-value-menu"
						aria-labelledby="<?=$htmlFieldId ?>_label"
						aria-haspopup="listbox"
						aria-expanded="false"
						<?php if (!empty($field['required'])): ?> aria-required="true"<?php endif ?>><?
						echo htmlspecialcharsbx(!empty($field['list'][$field['value']]) ? $field['list'][$field['value']] : $field['placeholder']);
					?></button>
				</td>
				<?
				break;

			case 'from':
				?>
				<td class="main-mail-form-fields-table-cell <?=$titleSubClass ?>">
					<span class="main-mail-form-field-spacer-25"></span>
					<label class="main-mail-form-field-title" id="<?=$htmlFieldId ?>_label"><?=preg_replace('/[\r\n]+/', '<br>', htmlspecialcharsbx($field['title'])) ?>:</label>
				</td>
				<td class="main-mail-form-fields-table-cell <?=$valueSubClass ?>" id="main-mail-from-field">
					<?php $mailboxes = $APPLICATION->includeComponent('bitrix:main.mail.confirm', '', []); ?>
					<script>
						fieldId = '<?= CUtil::JSEscape($htmlFieldId) ?>_value';
						if (BX.UI.Mail?.SenderSelector && !fieldId.includes('crm_mail_template_edit_form'))
						{
							const senderSelector = new BX.UI.Mail.SenderSelector({
								fieldId: '<?= CUtil::JSEscape($htmlFieldId) ?>_value',
								fieldName: '<?= CUtil::JSEscape(htmlspecialcharsbx($field['name'])) ?>',
								fieldValue: '<?= CUtil::JSEscape(htmlspecialcharsbx($field['value'])) ?>',
								mailboxes: <?= Json::encode($field['mailboxes']) ?>,
								isSenderAvailable: <?= Json::encode($renderFieldOptions['isSenderAvailable']) ?>,
							});
							senderSelector.renderTo(BX('main-mail-from-field'));
							var senderButton = BX('main-mail-from-field').querySelector('.sender-selector-button');
							if (senderButton)
							{
								senderButton.setAttribute('tabindex', '0');
								senderButton.setAttribute('aria-haspopup', 'dialog');
								senderButton.setAttribute('aria-expanded', 'false');
								senderButton.setAttribute('aria-labelledby', '<?= CUtil::JSEscape($htmlFieldId) ?>_label');
								<?php if (!empty($field['required'])): ?>
								senderButton.setAttribute('aria-required', 'true');
								<?php endif; ?>
								senderButton.addEventListener('keydown', function(e) {
									if (e.key === 'Enter' || e.key === ' ')
									{
										e.preventDefault();
										senderButton.click();
									}
								});
								senderSelector.senderDialog?.subscribe('onShow', function() {
									senderButton.setAttribute('aria-expanded', 'true');
								});
								senderSelector.senderDialog?.subscribe('onHide', function() {
									senderButton.setAttribute('aria-expanded', 'false');
								});
							}
						}
						else
						{
							const oldSelector = BX.Tag.render`
								<div>
									<input type="hidden"
										id="<?= $htmlFieldId ?>_value"
										name="<?= htmlspecialcharsbx($field['name']) ?>"
										value="<?= htmlspecialcharsbx($field['value']) ?>"
									>
									<span class="main-mail-form-field-spacer-25"></span>
									<span class="main-mail-form-field-from-icon"></span>
									<button type="button" class="main-mail-form-field-title main-mail-form-field-value-menu"
										aria-labelledby="<?= $htmlFieldId ?>_label"
										aria-haspopup="listbox"
										aria-expanded="false"
										<?php if (!empty($field['required'])): ?> aria-required="true"<?php endif; ?>>
										<?= htmlspecialcharsbx($field['value'] ?: $field['placeholder']); ?>
									</button>
									<?php if (!empty($field['copy'])): ?>
										<label class="main-mail-form-field-from-copy">
											<span class="main-mail-form-field-spacer-25"></span>
											<input class="main-mail-form-field-from-copy-checkbox" type="checkbox"
												name="<?=htmlspecialcharsbx($field['copy']) ?>" value="Y" id="<?=$htmlFieldId ?>_copy">
											<span class="main-mail-form-field-title main-mail-form-field-from-copy-text"><?=getMessage('MAIN_MAIL_FORM_FROM_FIELD_COPY') ?></span>
										</label>
									<?php endif; ?>
								</div>
							`;
							BX.Dom.append(oldSelector, BX('main-mail-from-field'))
						}
					</script>
				</td>
				<?
				break;

			case 'rcpt':
				$valueSubClass .= ' main-mail-form-field-value-rcpt';
				?>
				<td class="main-mail-form-fields-table-cell <?=$titleSubClass ?>">
					<span class="main-mail-form-field-spacer"></span>
					<label class="main-mail-form-field-title" id="<?=$htmlFieldId ?>_label"><?=preg_replace('/[\r\n]+/', '<br>', htmlspecialcharsbx($field['title'])) ?>:</label>
				</td>
				<td class="main-mail-form-fields-table-cell <?=$valueSubClass ?>">
					<div data-field-form-id="<?=$htmlFormId?>" data-form-field-type="<?=htmlspecialcharsbx($field['name'])?>"
						data-field-required="<?=!empty($field['required']) ? 'true' : 'false'?>">
						<div type="hidden"></div>
					</div>
				</td>
				<?
				break;

			case 'entity':
				$valueSubClass .= ' main-mail-form-field-value-rcpt';
				?>
				<td class="main-mail-form-fields-table-cell <?=$titleSubClass ?>">
					<span class="main-mail-form-field-spacer"></span>
					<label class="main-mail-form-field-title" id="<?=$htmlFieldId ?>_label"><?=preg_replace('/[\r\n]+/', '<br>', htmlspecialcharsbx($field['title'])) ?>:</label>
				</td>
				<td class="main-mail-form-fields-table-cell <?=$valueSubClass ?>"><?

					$enabledCrmDeals = (
						!empty($field['selector'])
						&& !empty($field['selector']['CrmTypes'])
						&& is_array($field['selector']['CrmTypes'])
						&& in_array('CRMDEAL', $field['selector']['CrmTypes'])
					);
					$enabledCrmLeads = (
						!empty($field['selector'])
						&& !empty($field['selector']['CrmTypes'])
						&& is_array($field['selector']['CrmTypes'])
						&& in_array('CRMLEAD', $field['selector']['CrmTypes'])
					);
					$enabledCrmCompanies = (
						!empty($field['selector'])
						&& !empty($field['selector']['CrmTypes'])
						&& is_array($field['selector']['CrmTypes'])
						&& in_array('CRMCOMPANY', $field['selector']['CrmTypes'])
					);
					$enabledCrmContacts = (
						!empty($field['selector'])
						&& !empty($field['selector']['CrmTypes'])
						&& is_array($field['selector']['CrmTypes'])
						&& in_array('CRMCONTACT', $field['selector']['CrmTypes'])
					);

					$APPLICATION->IncludeComponent(
						"bitrix:main.user.selector",
						"",
						[
							"ID" => $field['id'],
							"LIST" => $field['selector']['itemsSelected'],
							"LAZYLOAD" => "N",
							"INPUT_NAME" => $field['name']."[]",
							"API_VERSION" => 3,
							"USE_SYMBOLIC_ID" => "Y",
							"SELECTOR_OPTIONS" => array(
								'lazyLoad' => 'N',
								'enableCrm' => (
									!empty($field['selector'])
									&& !empty($field['selector']['isCrmFeed'])
										? 'Y'
										: 'N'
								),
								'context' => 'MAIL_LAST_ENTITY',
								'contextCode' => '',
								'enableDepartments' => 'N',
								'enableUsers' => 'N',
								'enableEmailUsers' => 'N',
								'enableMailContacts' => 'N',
								'addMailContactsTab' => 'N',
								'allowAddMailContact' => 'N',
								'enableCrmCompanies' => ($enabledCrmCompanies ? 'Y' : 'N'),
								'addTabCrmCompanies' => ($enabledCrmCompanies ? 'Y' : 'N'),
								'enableCrmContacts' => ($enabledCrmContacts ? 'Y' : 'N'),
								'addTabCrmContacts' => ($enabledCrmContacts ? 'Y' : 'N'),
								'enableCrmLeads' => ($enabledCrmLeads ? 'Y' : 'N'),
								'addTabCrmLeads' => ($enabledCrmLeads ? 'Y' : 'N'),
								'enableCrmDeals' => ($enabledCrmDeals ? 'Y' : 'N'),
								'addTabCrmDeals' => ($enabledCrmDeals ? 'Y' : 'N'),
								'onlyWithEmail' => 'N',
								'returnJsonValue' => 'Y'
							)
						]
					);
					?>

				</td>
				<?
				break;

			case 'custom':
				$titleSpacerSubClass = isset($field['height']) && $field['height'] > 0
					? sprintf('main-mail-form-field-spacer-%u', $field['height']) : '';
				?>
				<td class="main-mail-form-fields-table-cell <?=$titleSubClass ?>">
					<span class="main-mail-form-field-spacer <?=$titleSpacerSubClass ?>"></span>
					<label class="main-mail-form-field-title" id="<?=$htmlFieldId ?>_label"><?=preg_replace('/[\r\n]+/', '<br>', htmlspecialcharsbx($field['title'])) ?>:</label>
				</td>
				<td class="main-mail-form-fields-table-cell <?=$valueSubClass ?>">
					<?=(isset($field['render']) && is_callable($field['render']) ? $field['render']($field) : $field['value']); ?>
				</td>
				<?
				break;

			case 'text':
			default:
				?>
				<td class="main-mail-form-fields-table-cell <?=$titleSubClass ?>">
					<span class="main-mail-form-field-spacer"></span>
					<label class="main-mail-form-field-title" for="<?=$htmlFieldId ?>_value"><?=preg_replace('/[\r\n]+/', '<br>', htmlspecialcharsbx($field['title'])) ?>:</label>
				</td>
				<td class="main-mail-form-fields-table-cell <?=$valueSubClass ?>">
					<div class="main-mail-form-field-value-wrapper">
						<input class="main-mail-form-field-value" type="text"
							id="<?=$htmlFieldId ?>_value"
							name="<?=htmlspecialcharsbx($field['name']) ?>"
							value="<?=htmlspecialcharsbx($field['value'] ?? '') ?>"
							placeholder="<?=htmlspecialcharsbx($field['placeholder'] ?? '') ?>"
							<?php if (!empty($field['required'])): ?> aria-required="true"<?php endif ?>>
						<?php if (!empty($field['menu'])): ?>
							<button type="button" class="main-mail-form-field-value-menu-ext-button"
								aria-label="<?=htmlspecialcharsbx(Loc::getMessage('MAIN_MAIL_FORM_FIELD_MENU') ?? '') ?>"></button>
						<?php else: ?>
							<span class="main-mail-form-field-value-menu-ext-button"></span>
						<?php endif ?>
					</div>
				</td>
				<?
		}

	?></tr><?
};
?>
<div class="main-mail-form-wrapper" id="<?=$htmlFormId ?>">
	<div class="main-mail-form-fields-wrapper">
		<table class="main-mail-form-fields-table" role="presentation">
			<?php
			/**
			 * Fix erroneous autocomplete (it won't work without an id)
			 *
			 * Some browsers define the form of sending messages as an authorization
			 * form and give appropriate hints on autofill, modern browsers
			 * do not take into account the "autocomplete=off" when prompted for autofill
			 * and can also ignore the name of the field if they "think" that the form is similar
			 * to the authorization form.
			 */
			?>
			<tr>
				<td>
					<input style="display:none" id="mail-form-pseudo-field" aria-hidden="true">
				</td>
			</tr>
			<div id="main-mail-form-message-send-warning-empty"></div>
			<?php
			foreach ($arParams['FIELDS'] as $field)
				$renderField($htmlFormId, $field, false, $arParams['VERSION'], $renderFieldOptions);
			?>
			<tr id="<?=sprintf('%s_fields_footer', $htmlFormId) ?>">
				<td class="main-mail-form-fields-footer-cell" colspan="2">
					<div class="main-mail-form-fields-buttons">
						<?php foreach ($arParams['FIELDS'] as $field): ?>
							<?php if (in_array($field['type'], array('editor', 'files', 'separator'))) continue; ?>
							<button type="button" class="main-mail-form-field-button"
								data-target="<?=sprintf('%s_%s', $htmlFormId, htmlspecialcharsbx($field['id'])) ?>"
								aria-expanded="<?=(!empty($field['folded']) && empty($field['hidden'])) ? 'false' : 'true' ?>"
								<?php if (empty($field['folded']) || !empty($field['hidden'])): ?> style="display: none; "<?php endif ?>><?php
								echo htmlspecialcharsbx($field['title'])
							?></button>
						<?php endforeach ?>
					</div>
				</td>
			</tr>

		</table>
	</div>

	<?php $editorHeight = isset($arParams['EDITOR']['height']) && $arParams['EDITOR']['height'] > 0 ? (int) $arParams['EDITOR']['height'] : 200;
	$editorValue = '';
	$fromField = false;
	foreach($arParams['FIELDS'] as $field)
	{
		if($field['type'] === 'from')
		{
			$fromField = $field;
			break;
		}
	}
	if(is_array($fromField) && $fromField['value'])
	{
		foreach($fromField['mailboxes'] as $mailbox)
		{
			if($mailbox['formated'] == $fromField['value'] && !empty($mailbox['signature']))
			{
				$editorValue = '<div id="main-mail-form-signature"><br />--<br />'.$mailbox['signature'].'</div>';
				break;
			}
		}
	}

	?>
	<div id="<?=sprintf('%s_%s', $htmlFormId, htmlspecialcharsbx($arParams['EDITOR']['id'])) ?>"
		class="main-mail-form-editor-wrapper <?php if (!empty($arParams['EDITOR']['menu'])): ?> main-mail-form-field-value-menu-ext<?php endif ?>"
		style="min-height: <?=$editorHeight ?>px; ">
		<?php $APPLICATION->includeComponent(
			'bitrix:main.post.form', '',
			array(
				'FORM_ID' => $htmlFormId,
				'SHOW_MORE' => 'N',
				'PARSER' => array(
					'Bold', 'Italic', 'Underline', 'Strike', 'ForeColor',
					'FontList', 'FontSizeList', 'RemoveFormat',
					'Quote', 'Code', 'Source', 'Table',
					'CreateLink', 'Image', 'UploadImage',
					'Justify', 'InsertOrderedList', 'InsertUnorderedList',
				),
				'BUTTONS' => $arParams['POST_FORM_BUTTONS'],
				'BUTTONS_HTML' => (!empty($arParams['FOLD_QUOTE']) ?
					['ReplyQuote' => '<span class="main-mail-form-quote-button-wrapper" data-toolbar-aria-label="'.htmlspecialcharsbx(Loc::getMessage('MAIN_MAIL_FORM_QUOTE_SHOW') ?? '').'"><span class="main-mail-form-quote-button">...</span></span>'] : []
				),
				'TEXT' => array(
					'INPUT_NAME' => 'dummy_'.$arParams['EDITOR']['name'],
					'VALUE' => $editorValue,
					'SHOW' => 'Y',
				),
				'PROPERTIES' => array(
					array(
						'USER_TYPE_ID' => 'disk_file',
						'USER_TYPE' => array(
							'TAG' => 'bxacid:#id#',
							'REGEXP' => '/(?:bxacid):(n?\d+)/ig'
						),
						'FIELD_NAME'   => $arParams['FILES']['name'].'[]',
						'VALUE'        => $arParams['FILES']['value'],
						'HIDE_CHECKBOX_ALLOW_EDIT' => 'Y',
						'HIDE_CHECKBOX_PHOTO_TEMPLATE' => 'Y',
					),
				),
				'LHE' => array(
					'id' => sprintf('%s_editor', $htmlFormId),
					'documentCSS' => 'body { color:#434343; }',
					'fontSize' => '15px',
					'height' => $editorHeight,
					'lazyLoad' => true,
					'bbCode' => false,
					'setFocusAfterShow' => true,
					'iframeCss' => 'body { padding-left: 10px !important; font-size: 15px; }',
					'useFileDialogs' => false,
					'useLinkStat' => false,
					'uploadImagesFromClipboard' => false,
					'autoLink' => true,
					'controlsMap' => array(
						array('id' => 'Bold', 'compact' => true, 'sort' => 10),
						array('id' => 'Italic', 'compact' => true, 'sort' => 20),
						array('id' => 'Underline', 'compact' => true, 'sort' => 30),
						array('id' => 'Strikeout', 'compact' => true, 'sort' => 40),
						array('id' => 'RemoveFormat', 'compact' => true, 'sort' => 50),
						array('id' => 'Color', 'compact' => true, 'sort' => 60),
						array('id' => 'FontSelector', 'compact' => false, 'sort' => 70),
						array('id' => 'FontSize', 'compact' => false, 'sort' => 80),
						array('separator' => true, 'compact' => false, 'sort' => 90),
						array('id' => 'OrderedList', 'compact' => true, 'sort' => 100),
						array('id' => 'UnorderedList', 'compact' => true, 'sort' => 110),
						array('id' => 'AlignList', 'compact' => false, 'sort' => 120),
						array('separator' => true, 'compact' => false, 'sort' => 130),
						array('id' => 'InsertLink', 'compact' => true, 'sort' => 140),
						array('id' => 'InsertImage', 'compact' => false, 'sort' => 150),
						array('id' => 'InsertTable', 'compact' => false, 'sort' => 170),
						array('id' => 'Code', 'compact' => true, 'sort' => 180),
						array('id' => 'Quote', 'compact' => true, 'sort' => 190),
						array('separator' => true, 'compact' => false, 'sort' => 200),
						array('id' => 'Fullscreen', 'compact' => false, 'sort' => 210),
						array('id' => 'BbCode', 'compact' => false, 'sort' => 220),
						array('id' => 'More', 'compact' => true, 'sort' => 400),
					),
					'isMentionUnavailable' => true,
					'isCopilotEnabled' => $arParams['IS_COPILOT_ENABLED'],
					'copilotParams' => $arParams['COPILOT_PARAMS'] ?? null,
					'isCopilotImageEnabledBySettings' => $arParams['IS_COPILOT_IMAGE_ENABLED'] ?? false,
					'isCopilotTextEnabledBySettings' => $arParams['IS_COPILOT_TEXT_ENABLED'] ?? false,
				),
			),
			false,
			array('HIDE_ICONS' => 'Y', 'ACTIVE_COMPONENT' => 'Y')
		); ?>
		<?php if (!empty($arParams['EDITOR']['menu'])): ?>
			<button type="button" class="main-mail-form-field-value-menu-ext-button"
				aria-label="<?=htmlspecialcharsbx(Loc::getMessage('MAIN_MAIL_FORM_FIELD_MENU') ?? '') ?>"></button>
		<?php else: ?>
			<span class="main-mail-form-field-value-menu-ext-button"></span>
		<?php endif ?>
	</div>

	<?php if (!empty($arParams['FIELDS_EXT'])): ?>
		<div class="main-mail-form-docs-wrapper main-mail-form-border-bottom">
			<table class="main-mail-form-fields-table" role="presentation">
				<?php
				foreach ($arParams['FIELDS_EXT'] as $field)
					$renderField($htmlFormId, $field, true, $arParams['VERSION'], $renderFieldOptions);
				?>
				<tr id="<?=sprintf('%s_fields_ext_footer', $htmlFormId) ?>">
					<td class="main-mail-form-fields-footer-cell" colspan="2">
						<div class="main-mail-form-fields-buttons">
							<?php foreach ($arParams['FIELDS_EXT'] as $field): ?>
								<?php if (in_array($field['type'], array('editor', 'files', 'separator'))) continue; ?>
								<button type="button" class="main-mail-form-field-button"
									data-target="<?=sprintf('%s_%s', $htmlFormId, htmlspecialcharsbx($field['id'])) ?>"
									aria-expanded="<?=(!empty($field['folded']) && empty($field['hidden'])) ? 'false' : 'true' ?>"
									<?php if (empty($field['folded']) || !empty($field['hidden'])): ?> style="display: none; "<?php endif ?>><?php
									echo htmlspecialcharsbx($field['title'])
								?></button>
							<?php endforeach ?>
						</div>
					</td>
				</tr>
			</table>
		</div>
	<?php else: ?>
		<div class="main-mail-form-border-bottom"></div>
	<?php endif ?>

	<div class="main-mail-form-error" role="alert" aria-live="assertive"></div>
	<div class="main-mail-form-footer-wrapper">
		<div class="main-mail-form-footer">
			<div class="main-mail-form-footer-buttons-wrapper">
				<?php foreach ($arParams['BUTTONS'] as $type => $item)
				{
					if (empty($item['class']))
					{
						if ('submit' == $type)
							$item['class'] = 'ui-btn-success';
						else if ('cancel' == $type)
							$item['class'] = 'ui-btn-link';
						else
							$item['class'] = 'ui-btn-light-border';
					}

					if ('submit' == $type)
						$item['class'] .= ' main-mail-form-submit-button';
					else if ('cancel' == $type)
						$item['class'] .= ' main-mail-form-cancel-button';

					?><button class="ui-btn main-mail-form-footer-button <?=htmlspecialcharsbx($item['class']) ?>" type="button"><?=htmlspecialcharsbx($item['title']) ?></button><?php
				}
				?>
			</div>
			<div><?=($arParams['~FOOTER'] ?? '')?></div>
		</div>
	</div>

	<input id="<?=htmlspecialcharsbx($htmlFormId) ?>_<?=htmlspecialcharsbx($arParams['EDITOR']['id']) ?>_value"
		type="hidden" name="<?=htmlspecialcharsbx($arParams['EDITOR']['name']) ?>">
	<div id="<?=sprintf('%s_dummy_footer', $htmlFormId) ?>" style="display: none; "></div>
	<input type="submit" name="<?=sprintf('%s_submit', $htmlFormId) ?>" value="Y" style="display: none; ">
</div>

<script>

BX.ready(function()
{
	BX.message(<?= Json::encode(\Bitrix\Main\Localization\Loc::loadLanguageFile(__FILE__)) ?>);
	var form = new BXMainMailForm(
		'<?=\CUtil::jsEscape($arParams['FORM_ID']) ?>',
		<?=Json::encode(array_merge(
			array_values($arParams['FIELDS']),
			array_values($arParams['FIELDS_EXT'])
		)) ?>,
		<?=$arParams['~REPLY_FIELD_TO_JSON'] ?? Json::encode([])?>,
		<?=$arParams['~REPLY_FIELD_CC_JSON'] ?? Json::encode([])?>,
		<?=$arParams['~SELECTED_RECIPIENTS_JSON'] ?? Json::encode([])?>,
		<?=Json::encode(array(
			'oldRecipientsMode' => $arParams['OLD_RECIPIENTS_MODE'],
			'ownerCategoryId' => $arParams['OWNER_CATEGORY_ID'],
			'submitAjax' => !empty($arParams['SUBMIT_AJAX']),
			'foldQuote'  => !empty($arParams['FOLD_QUOTE']),
			'foldFiles'  => !empty($arParams['FOLD_FILES']),
			'contextName' => $arParams['CONTEXT_NAME'] ?? '',
			'version'  => $arParams['VERSION'],
			'calendarSharingTourId' => $arParams['CALENDAR_SHARING_TOUR_ID'],
			'userCalendarPath' => $arParams['USER_CALENDAR_PATH'],
		)) ?>
	);
	<?php if (empty($arParams['LAYOUT_ONLY'])): ?>
		form.init();
	<?php endif ?>

	BX.addCustomEvent(
		'SidePanel.Slider:onMessage',
		function (event)
		{
			const $eventId = event.getEventId();
			if (!$eventId)
			{
				return;
			}

			if (
				$eventId === 'mail-mailbox-config-success'
				|| $eventId === 'mail-mailbox-config-delete'
			)
			{
				BX.SidePanel.Instance.postMessage(window, $eventId, event.data)
			}
		}
	);
});

</script>
