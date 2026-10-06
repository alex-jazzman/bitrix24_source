<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Security\Random;
use Bitrix\Main\Web\Json;

/**
 * @var RichTextUfComponent $component
 * @var array $arResult
 */

$component = $this->getComponent();
$config = htmlspecialcharsbx(Json::encode($arResult['editorConfig']));
$inputName = $arResult['editorConfig']['inputName'];
$wrapId = 'ui-field-rich-text-' . Random::getString(8);
?>
<span id="<?= $wrapId ?>" class="ui-field-rich-text-wrap fields rich_text field-wrap">
	<?php foreach ($arResult['editorValues'] as $value): ?>
		<span class="ui-field-rich-text-item fields rich_text field-item">
			<textarea
				name="<?= $inputName ?>"
				class="ui-field-rich-text__input"
				data-config="<?= $config ?>"
			><?= $value ?></textarea>
			<span class="ui-field-rich-text__editor" data-role="rich-text-container" style="flex: 1 1 auto; min-width: 0;"></span>
		</span>
	<?php endforeach; ?>
	<?php
	if (
		($arResult['userField']['MULTIPLE'] ?? 'N') === 'Y'
		&& ($arResult['additionalParameters']['SHOW_BUTTON'] ?? 'Y') !== 'N'
	)
	{
		print $component->getHtmlBuilder()->getCloneButton($arResult['fieldName']);
	}
	?>
	<script>
		(function() {
			'use strict';
			BX.ready(function() {
				var control = BX.Reflection.getClass('BX.UI.UserField.RichTextControl');
				var wrap = document.getElementById('<?= CUtil::JSEscape($wrapId) ?>');
				if (control && wrap)
				{
					control.initWrap(wrap);
				}
			});
		})();
	</script>
</span>
