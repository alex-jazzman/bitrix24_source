<?php

use Bitrix\UI\Toolbar\Facade\Toolbar;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)die();

/** @global CMain $APPLICATION */
/** @var array $arResult */
/** @var array $arParams */

$formId = 'crm_mail_template_edit_form_'. (int)$arResult['ELEMENT']['ID'];

if (!empty($arResult['ELEMENT']['BODY']) && \CCrmContentType::Html != $arResult['ELEMENT']['BODY_TYPE'])
{
	$bbcodeParser = new \CTextParser();
	$arResult['ELEMENT']['BODY'] = $bbcodeParser->convertText($arResult['ELEMENT']['BODY']);
}

if ('Y' !== $arResult['ELEMENT']['IS_ACTIVE'])
{
	$arResult['ELEMENT']['IS_ACTIVE'] = 'N';
}

if ($_REQUEST['IFRAME'] === 'Y')
{
	Toolbar::deleteFavoriteStar();
}

\Bitrix\Main\UI\Extension::load([
		'ui.design-tokens',
		'ui.entity-selector',
	]);
?>

<form id="<?=htmlspecialcharsbx($formId)?>">
	<?=bitrix_sessid_post() ?>
	<? $saveAction = isset($arResult['EXTERNAL_CONTEXT']) && $arResult['EXTERNAL_CONTEXT'] != '' ? 'save' : 'apply'; ?>
	<input type="hidden" name="<?=$saveAction ?>" value="<?=$saveAction ?>">
	<input type="hidden" name="element_id" value="<?=intval($arResult['ELEMENT']['ID']) ?>">
	<input type="hidden" name="BODY_TYPE" value="<?=\CCrmContentType::Html ?>">

	<? ob_start(); ?>
	<span class="crm-mail-template-edit-form-switches-wrapper">
		<span class="crm-mail-template-edit-form-switch">
			<input class="crm-mail-template-edit-form-switch-checkbox" form="<?=htmlspecialcharsbx($formId) ?>"
				id="crm_mail_template_<?=(int)$arResult['ELEMENT']['ID'] ?>_active"
				name="IS_ACTIVE" value="Y" type="checkbox"
				<?php if ('Y' === $arResult['ELEMENT']['IS_ACTIVE']): ?> checked<?php endif ?>
				onchange="BX(this.id+'_alt').value = this.checked ? this.value : '';">
			<label class="crm-mail-template-edit-form-switch-label"
				for="crm_mail_template_<?=(int)$arResult['ELEMENT']['ID'] ?>_active"><?=getMessage('CRM_MAIL_TEMPLATE_IS_ACTIVE') ?></label>
		</span>
		<?php if (false && $arResult['ELEMENT']['ID'] > 0 && (\CCrmPerms::isAdmin() || $arResult['USER_ID'] == $arResult['ELEMENT']['OWNER_ID'])):
			$deleteHref = \CHTTP::urlAddParams(
				\CComponentEngine::makePathFromTemplate(
					$arParams['PATH_TO_MAIL_TEMPLATE_EDIT'],
					['element_id' => $arResult['ELEMENT']['ID']]
				),
				['delete' => '', 'sessid' => bitrix_sessid()]
			);?>
			<span class="crm-mail-template-edit-form-switch">
				<label class="crm-mail-template-edit-form-switch-label">
					<a href="#" onclick="confirm('<?=\CUtil::jsEscape(getMessage('CRM_MAIL_TEMPLATE_DELETE_DLG_MESSAGE')) ?>') && (window.location = '<?=\CUtil::jsEscape($deleteHref); ?>'); return false; "><?=getMessage('CRM_MAIL_TEMPLATE_DELETE_BTN') ?></a>
				</label>
			</span>
		<?php endif ?>
	</span>
	<?php Toolbar::addRightCustomHtml(ob_get_clean(), ['align' => 'right']) ?>

	<input id="crm_mail_template_<?=intval($arResult['ELEMENT']['ID']) ?>_active_alt"
		type="hidden" name="IS_ACTIVE" value="<?=htmlspecialcharsbx($arResult['ELEMENT']['IS_ACTIVE']) ?>">
	<input id="crm_mail_template_<?=intval($arResult['ELEMENT']['ID']) ?>_access_alt"
		   type="hidden" name="ACCESS" value="<?=htmlspecialcharsbx(\Bitrix\Main\Web\Json::encode($arResult['ACCESS']))?>">
	<div id="my_container"></div>

	<?php $APPLICATION->includeComponent(
		'bitrix:main.mail.form', '',
		array(
			'VERSION' => 2,
			'FORM_ID' => $formId,
			'LAYOUT_ONLY' => true,
			'EDITOR_TOOLBAR' => true,
			'COPILOT_PARAMS' => $arResult['COPILOT_PARAMS'],
			'FIELDS' => array(
				array(
					'name'        => 'TITLE',
					'title'       => getMessage('CRM_MAIL_TEMPLATE_TITLE'),
					'placeholder' => getMessage('CRM_MAIL_TEMPLATE_TITLE_HINT'),
					'required'    => true,
					'short'       => true,
					'value'       => $arResult['ELEMENT']['TITLE'],
				),
				array(
					'name'        => 'ENTITY_TYPE_ID',
					'title'       => getMessage('CRM_MAIL_ENTITY_TYPE2'),
					'type'        => 'list',
					'placeholder' => getMessage('CRM_MAIL_ENTITY_TYPE_UNI'),
					'value'       => $arResult['ELEMENT']['ENTITY_TYPE_ID'],
					'list'        => $arResult['OWNER_TYPES'],
				),
				array(
					'name'        =>'ACCESS_SELECTOR',
					'title'       => getMessage('CRM_MAIL_ACCESS_SELECTOR'),
				),
				array(
					'type' => 'separator',
				),
				array(
					'name'  => 'EMAIL_FROM',
					'title' => getMessage('CRM_MAIL_TEMPLATE_EMAIL_FROM'),
					'type'  => 'from',
					'value' => $arResult['ELEMENT']['EMAIL_FROM'],
				),
				array(
					'name'        => 'SUBJECT',
					'title'       => getMessage('CRM_MAIL_TEMPLATE_SUBJECT'),
					'placeholder' => getMessage('CRM_MAIL_TEMPLATE_SUBJECT_HINT'),
					'value'       => $arResult['ELEMENT']['SUBJECT'],
					'menu'        => true,
				),
				array(
					'name'  => 'BODY',
					'type'  => 'editor',
					'value' => $arResult['ELEMENT']['BODY'],
					'menu'  => true,
				),
				array(
					'name'  => 'FILES',
					'type'  => 'files',
					'value' => $arResult['ELEMENT']['FILES'],
				),
			),
			'BUTTONS' => array(
				'submit' => array(
					'title' => getMessage('CRM_MAIL_TEMPLATE_SAVE_BTN'),
				),
				'cancel' => array(
					'title' => getMessage('CRM_MAIL_TEMPLATE_CANCEL_BTN'),
				),
			),
		)
	); ?>
</form>
<script>
BX.ready(function()
{
	BX.message(<?=\Bitrix\Main\Web\Json::encode(\Bitrix\Main\Localization\Loc::loadLanguageFile(__FILE__))?>);
	BX.CrmEntityFieldSelector.prototype.setPreselectedItems(
		'crm_mail_template_<?=intval($arResult['ELEMENT']['ID']) ?>_access_alt',
		<?=CUtil::PhpToJSObject($arResult['ACCESS'])?>,
		<?=(int)$arResult['ELEMENT']['OWNER_ID']?>);

	var rawFieldsMap = <?=\CUtil::phpToJsObject(\CCrmTemplateManager::getAllMaps()) ?>;
	var fieldsMap = {};

	for (var i = 0, item; i < rawFieldsMap.length; i++)
	{
		item = rawFieldsMap[i];

		fieldsMap[item.typeId] = item;
		fieldsMap[item.typeName] = item;
	}

	var menuItems = function(prefix, typeId, handler, level, entityName)
	{
		if (typeof typeId == 'undefined' || !BX.type.isFunction(handler))
			return [];

		var items = [];
		level = level > 1 ? level : 1;

		if (typeof fieldsMap[typeId] != 'undefined')
		{
			var map = fieldsMap[typeId];
			prefix = prefix ? [prefix, entityName].join('.') : map.typeName;

			for (var i = 0, code; i < map.fields.length; i++)
			{
				code = map.fields[i].id;
				if (code.match(/^UF_/))
				{
					code += '('+map.fields[i].name+')';
				}

				var subItems = [];
				if (map.fields[i].typeId)
				{
					if (level < 2)
					{
						subItems = menuItems(prefix, map.fields[i].typeId, handler, level + 1, code);
					}
					else
					{
						continue;
					}
				}

				items.push({
					text: map.fields[i].name,
					value: '#'+[prefix, code].join('.')+'#',
					items: subItems,
					onclick: handler
				});
			}
		}

		return items;
	};

	let formNode = BX('<?=\CUtil::jsEscape($formId) ?>');
	let mailForm = BXMainMailForm.getForm('<?=\CUtil::jsEscape($formId) ?>');

	BX.addCustomEvent(mailForm, 'MailForm:field:setMenuExt', function(form, field)
	{
		var typeId = formNode.elements['ENTITY_TYPE_ID'].value;

		var handler = function (event, item)
		{
			if (item.options.items && item.options.items.length > 0)
				return;

			field.insert(item.options.value);
			item.menuWindow.close();
		};

		field.setMenuExt(
			[
				{
					text: '<?=\CUtil::jsEscape(getMessage('CRM_MAIL_TEMPLATE_SENDER_MENU')) ?>',
					value: '#SENDER#',
					items: menuItems('', <?=\CCrmOwnerType::System ?>, handler),
					onclick: handler
				}
			]
			.concat(menuItems('', typeId, handler))
		);
	});

	<? if ($arResult['ELEMENT']['ID'] > 0 && empty($arResult['CAN_EDIT'])): ?>

	var submitButton = BX.findChildByClassName(formNode, 'main-mail-form-submit-button', true);
	if (submitButton)
		submitButton.style.opacity = 0.4;

	BX.addCustomEvent(mailForm, 'MailForm:submit', function (form, event)
	{
		return BX.PreventDefault(event);
	});

	<? endif ?>

	const templateAccessSelector = document.getElementById('template-access-selector');

	BX.addCustomEvent(mailForm, 'MailForm:footer:buttonClick', function(form, button)
	{
		if (BX.hasClass(button, 'main-mail-form-cancel-button'))
		{
			<? if (isset($arResult['EXTERNAL_CONTEXT']) && $arResult['EXTERNAL_CONTEXT'] != ''): ?>
			BX.localStorage.set(
				'onCrmMailTemplateCreate',
				{
					context: '<?=\CUtil::jsEscape($arResult['EXTERNAL_CONTEXT']) ?>'
				},
				10
			);
			<? endif ?>

			var slider = top.BX.SidePanel.Instance.getSliderByWindow(window);
			if (slider && slider.close)
			{
				slider.close();
				return;
			}

			window.location = '<?=\CUtil::jsEscape(
				\CComponentEngine::makePathFromTemplate($arParams['PATH_TO_MAIL_TEMPLATE_LIST'])
			) ?>';
		}
	});

	mailForm.init();

	BX.ready(function(){
		const button = BX.findChildByClassName(formNode, 'main-mail-form-submit-button', true);
		BX.bind(formNode, 'submit', BX.proxy(sendForm, formNode));

		function sendForm(e){
			BX.addClass(button, 'ui-btn-wait');
			let data = new FormData(this);

			BX.ajax({
				url: '<?=CUtil::JSEscape(POST_FORM_ACTION_URI)?>',
				data: data,
				method: 'POST',
				dataType: 'json',
				processData: false,
				preparePost: false,
				onsuccess: function(){
					BX.removeClass(button, 'ui-btn-wait');
					window.top.BX.SidePanel.Instance.postMessage(window, 'CrmMailTemplateEdit:onSubmit');
					const slider = top.BX.SidePanel.Instance.getSliderByWindow(window);
					if (slider && slider.close)
					{
						slider.close();
					}
				},
			});
			return BX.PreventDefault(e);
		};
	})
});
</script>

<?php
	require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/epilog_after.php');
	die;
