<?php

require($_SERVER["DOCUMENT_ROOT"]."/mobile/headers.php");
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");

$taskId = (int)($_GET["task_id"] ?? 0);

?>
<script>
	(() => {

		const taskId = <?= $taskId ?>;
		const openTask = BX.MobileTools.getOpenFunction(`/company/personal/bizproc/${taskId}/`);
		if (openTask)
		{
			openTask();
		}
	})();

	BXMobileApp.UI.Page.close({ drop: true });
</script>
<?php
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php");
