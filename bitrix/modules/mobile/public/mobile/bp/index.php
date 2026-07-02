<?php

require($_SERVER["DOCUMENT_ROOT"]."/mobile/headers.php");
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");

?>
<script>
	(() => {

		const openList = BX.MobileTools.getOpenFunction(`/bizproc/userprocesses/`);
		if (openList)
		{
			openList();
		}
	})();

	BXMobileApp.UI.Page.close({ drop: true });
</script>
<?php
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php");
