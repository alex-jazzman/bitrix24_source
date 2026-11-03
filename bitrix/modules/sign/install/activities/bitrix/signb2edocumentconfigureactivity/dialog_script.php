<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;
use Bitrix\Sign\Type\ProviderCode;

/**
 * Client code of the settings dialog, shared by the designer and the robot dialog.
 *
 * @var PropertiesDialog $dialog
 */

// the code of an externally signed document is technical: the dialog offers signing providers only
$providerItems = [];
foreach (ProviderCode::getAll() as $providerCode)
{
	if (ProviderCode::isTechnical($providerCode))
	{
		continue;
	}

	$providerName = ProviderCode::getProviderName(ProviderCode::toRepresentativeString($providerCode));
	$providerItems[] = [
		'value' => $providerCode,
		'name' => $providerName === '' ? $providerCode : sprintf('%s (%s)', $providerName, $providerCode),
	];
}
?>
<script>
	BX.ready(() => {
		const formName = '<?= (string)CUtil::JSEscape($dialog->getFormName()) ?>';
		// the designer holds the dialogs of the other activities, so a field is looked up in the own form
		const formNode = document.forms.namedItem(formName);
		new BX.Sign.SignB2EDocumentConfigureActivity({
			formName,
			company: {
				fieldName: '<?= (string)CUtil::JSEscape(CBPSignB2EDocumentConfigureActivity::PARAM_COMPANY) ?>',
				containerNode: formNode?.querySelector('[data-sign-dictionary="company"]'),
			},
			provider: {
				fieldName: '<?= (string)CUtil::JSEscape(CBPSignB2EDocumentConfigureActivity::PARAM_PROVIDER_CODE) ?>',
				containerNode: formNode?.querySelector('[data-sign-dictionary="provider"]'),
				items: <?= (string)Json::encode($providerItems) ?>,
			},
			messages: <?= (string)Json::encode([
				'emptyCompanyList' => (string)Loc::getMessage(
					'SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_CONFIGURE_COMPANY_LIST_EMPTY',
				),
				'companyListError' => (string)Loc::getMessage(
					'SIGN_ACTIVITIES_SIGN_B2E_DOCUMENT_CONFIGURE_COMPANY_LIST_ERROR',
				),
			]) ?>,
		}).init();
		BX.UI.Hint.init();
	});
</script>
