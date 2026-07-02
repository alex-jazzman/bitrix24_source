<?php

use Bitrix\Main\Loader;

define('SITE_TEMPLATE_ID', 'note_document_detail');

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

if (Loader::includeModule('note'))
{
	?>
	<script>
		history.replaceState({}, '', '/note/');
	</script>
	<?php

	$GLOBALS['APPLICATION']->IncludeComponent(
		'bitrix:note.editor',
		'',
		[],
	);
}
else
{
	CHTTP::SetStatus('404 Not Found');
}

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
