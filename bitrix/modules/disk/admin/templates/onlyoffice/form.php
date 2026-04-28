<?php
/** @var OnlyOfficeCustomServer $customServer */
/** @var string $dataGroupKey */
/** @var string $dataNamePrefix */

use Bitrix\Disk\Internal\Entity\CustomServers\OnlyOfficeCustomServer;
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$ooTemplateUrlKey = OnlyOfficeCustomServer::DATA_URL_KEY;
$ooTemplateSecretKeyKey = OnlyOfficeCustomServer::DATA_SECRET_KEY_KEY;
$ooTemplateMaxFileSizeKey = OnlyOfficeCustomServer::DATA_MAX_FILE_SIZE_KEY;

$ooTemplateUrlInputName = "{$dataNamePrefix}[$ooTemplateUrlKey]";
$ooTemplateSecretKeyInputName = "{$dataNamePrefix}[$ooTemplateSecretKeyKey]";
$ooTemplateMaxFileSizeInputName = "{$dataNamePrefix}[$ooTemplateMaxFileSizeKey]";

$ooTemplateUrl = $customServer->getUrl();
$ooTemplateSecretKey = $customServer->getSecretKey();
$ooTemplateMaxFileSize = $customServer->getMaxFileSizeForEdit();
$ooTemplateDefaultMaxFileSize = $customServer->getDefaultMaxFileSizeForView();
$ooTemplateVersionResult = $customServer->getVersion();

$ooTemplateLoc = [
	'url' => Loc::getMessage('DISK_CUSTOM_SERVER_ONLYOFFICE_ADMIN_URL_DESCRIPTION'),
	'secretKey' => Loc::getMessage('DISK_CUSTOM_SERVER_ONLYOFFICE_ADMIN_SECRET_KEY_DESCRIPTION'),
	'maxFileSize' => Loc::getMessage(
		code: 'DISK_CUSTOM_SERVER_ONLYOFFICE_ADMIN_MAX_FILE_SIZE_DESCRIPTION',
		replace: [
			'#SIZE#' => $ooTemplateDefaultMaxFileSize,
		],
	),
	'maxFileSizeHint' => Loc::getMessage(
		code: 'DISK_CUSTOM_SERVER_ONLYOFFICE_ADMIN_MAX_FILE_SIZE_HINT',
		replace: [
			'#SIZE#' => $ooTemplateDefaultMaxFileSize,
		],
	),
	'version' => Loc::getMessage('DISK_CUSTOM_SERVER_ONLYOFFICE_ADMIN_VERSION_DESCRIPTION'),
	'unknown' => Loc::getMessage('DISK_CUSTOM_SERVER_ONLYOFFICE_ADMIN_UNKNOWN'),
	'supported' => Loc::getMessage('DISK_CUSTOM_SERVER_ONLYOFFICE_ADMIN_SUPPORTED'),
	'unsupported' => Loc::getMessage('DISK_CUSTOM_SERVER_ONLYOFFICE_ADMIN_UNSUPPORTED'),
];

if ($ooTemplateVersionResult->isSuccess())
{
	$ooTemplateVersion = $ooTemplateVersionResult->getData()['version'];

	$supportedText =
		$customServer->isVersionSupported($ooTemplateVersion)
			? $ooTemplateLoc['supported']
			: $ooTemplateLoc['unsupported']
	;

	$ooTemplateVersionText = "$ooTemplateVersion ($supportedText)";
}
else
{
	$error = $ooTemplateVersionResult->getError();
	$isNotReadyForUse = $error?->getCustomData()['isNotReadyForUse'] ?? false;

	if (!$error instanceof \Bitrix\Main\Error || $isNotReadyForUse)
	{
		$ooTemplateVersionText = $ooTemplateLoc['unknown'];
	}
	else
	{
		$ooTemplateVersionText = $error->getMessage();
	}
}
?>
<tr>
	<td width="50%">
		<?= htmlspecialcharsbx($ooTemplateLoc['url']) ?>
	</td>
	<td width="50%">
		<input
			type="text"
			name="<?= htmlspecialcharsbx($ooTemplateUrlInputName) ?>"
			value="<?= htmlspecialcharsbx($ooTemplateUrl) ?>"
			data-data-group="<?= htmlspecialcharsbx($dataGroupKey) ?>"
		>
	</td>
</tr>
<tr>
	<td>
		<?= htmlspecialcharsbx($ooTemplateLoc['secretKey']) ?>
	</td>
	<td>
		<input
			type="text"
			name="<?= htmlspecialcharsbx($ooTemplateSecretKeyInputName) ?>"
			value="<?= htmlspecialcharsbx($ooTemplateSecretKey) ?>"
			data-data-group="<?= htmlspecialcharsbx($dataGroupKey) ?>"
		>
	</td>
</tr>
<tr>
	<td>
		<?= htmlspecialcharsbx($ooTemplateLoc['maxFileSize']) ?>
		<span data-hint="<?= htmlspecialcharsbx($ooTemplateLoc['maxFileSizeHint']) ?>"></span>
	</td>
	<td>
		<input
			type="text"
			name="<?= htmlspecialcharsbx($ooTemplateMaxFileSizeInputName) ?>"
			value="<?= htmlspecialcharsbx($ooTemplateMaxFileSize) ?>"
			data-data-group="<?= htmlspecialcharsbx($dataGroupKey) ?>"
		>
	</td>
</tr>
<tr>
	<td>
		<?= htmlspecialcharsbx($ooTemplateLoc['version']) ?>
	</td>
	<td>
		<?= htmlspecialcharsbx($ooTemplateVersionText) ?>
	</td>
</tr>