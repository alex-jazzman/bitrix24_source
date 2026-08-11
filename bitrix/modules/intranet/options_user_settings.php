<?php
IncludeModuleLangFile(__FILE__);
ClearVars('str_intranet_');

use Bitrix\Main\Context;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;

if (Loader::includeModule('intranet'))
{
	$ID = intval($ID);
	$str_intranet_NEW_USER_POST = CUserOptions::GetOption('intranet', 'socnet_new_user_post', 'Y', $ID);
	$request = Context::getCurrent()->getRequest();

	if ($strError !== '')
	{
		$str_intranet_NEW_USER_POST = htmlspecialcharsbx($request->getPost('intranet_NEW_USER_POST') ?? null);
	}
	?>
	<input type="hidden" name="profile_module_id[]" value="intranet">
	<tr>
		<td width="50%"><?=Loc::getMessage('intranet_NEW_USER_POST')?></td>
		<td width="50%">
			<input
				type="checkbox"
				name="intranet_NEW_USER_POST"
				value="Y"
				<?= ($str_intranet_NEW_USER_POST === 'Y') ? 'checked' : '' ?>
			>
		</td>
	</tr>
<?php
}

