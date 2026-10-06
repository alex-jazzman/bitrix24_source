<?php

use Bitrix\Mail\Helper\SignatureEditorConfig;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\UI\Toolbar\Facade\Toolbar;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Extension::load([
	'ui.design-tokens',
	// color tokens used by the editor styles live in the air layer
	'ui.design-tokens.air',
	'sidepanel',
	'ui.forms',
	'ui.buttons',
	'mail.signature.editor',
]);

if (isset($_REQUEST['IFRAME']) && $_REQUEST['IFRAME'] === 'Y')
{
	Toolbar::deleteFavoriteStar();
}

$bodyClass = $APPLICATION->getPageProperty('BodyClass', false);
$APPLICATION->setPageProperty('BodyClass', trim(sprintf('%s %s', $bodyClass, 'pagetitle-toolbar-field-view pagetitle-mail-view no-background')));
?>
<div
	id="signature-alert-container"
	role="alert"
	aria-live="assertive"
	aria-atomic="true"
	data-testid="mail-signature-editor-alert"
></div>
<div class="mail-signature-editor-wrapper" data-testid="mail-signature-editor-container">
	<?php if (!empty($arResult['showSignatureMacros'])): ?>
		<div
			id="signature-macro-action-container"
			class="mail-signature-editor-wrapper__macro-action"
			data-testid="mail-signature-editor-macro-action"
		></div>
	<?php endif; ?>
	<div
		id="signature-editor-container"
		class="mail-signature-editor-wrapper__editor"
		data-testid="mail-signature-editor-field"
	>
		<?php
		$editor = new CHTMLEditor;
		$editor->show(SignatureEditorConfig::getHtmlEditorConfig('signature', (string)($arResult['signature'] ?? '')));
		?>
	</div>
	<div
		id="sender-binding-panel"
		class="mail-signature-editor-wrapper__settings"
		data-testid="mail-signature-editor-sender-panel"
	></div>
	<?php
	/*
	 * The card of the shared signature is not on the screen of whoever may not manage them: it is
	 * absent from the markup rather than hidden by styles.
	 */
	if (!empty($arResult['showSharedSignatureCard']))
	{
		?><div
			id="shared-signature-panel"
			class="mail-signature-editor-wrapper__scope"
			data-testid="mail-signature-editor-shared-panel"
		></div><?php
	}
	?>
</div>

<script>
	BX.ready(function() {
		<?='BX.message('.\CUtil::PhpToJSObject(Loc::loadLanguageFile(__FILE__)).');'?>
		BX.Mail.UserSignature.Edit.init(<?=CUtil::PhpToJSObject($arResult);?>);
	});
</script>
