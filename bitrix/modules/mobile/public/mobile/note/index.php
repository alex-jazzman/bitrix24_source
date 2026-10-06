<?php

use Bitrix\Main\Context;
use Bitrix\Main\Loader;
use Bitrix\Mobile\Internal\Note\EntryParams;

define('SITE_TEMPLATE_ID', 'note_document_detail');

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

if (Loader::includeModule('mobile') && Loader::includeModule('note'))
{
	// KB page sub-path (relative to /note) delivered by the in-app-url route.
	$entry = EntryParams::resolve(Context::getCurrent()->getRequest()->get('entryPath'));
	?>
	<script>
		history.replaceState({}, '', <?= $entry->getSpaPathJs() ?>);
	</script>
	<?php

	$GLOBALS['APPLICATION']->IncludeComponent(
		'bitrix:note.editor',
		'',
		$entry->componentParams,
	);
}
else
{
	CHTTP::SetStatus('404 Not Found');
}

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
