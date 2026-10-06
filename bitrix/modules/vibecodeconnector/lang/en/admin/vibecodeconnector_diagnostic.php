<?php
$MESS['VIBECODECONNECTOR_DIAG_TITLE'] = 'Bitrix24 Vibecode — diagnostics';

$MESS['VIBECODECONNECTOR_DIAG_TAB_VERIFY'] = 'Connection check';
$MESS['VIBECODECONNECTOR_DIAG_TAB_VERIFY_TITLE'] = 'Request the status page from the selected Bitrix24 Vibecode server and make sure both sides can see each other';
$MESS['VIBECODECONNECTOR_DIAG_TAB_STATE'] = 'Status and links';
$MESS['VIBECODECONNECTOR_DIAG_TAB_STATE_TITLE'] = 'Current module configuration and related admin pages';

$MESS['VIBECODECONNECTOR_DIAG_HEADING_STEP1'] = 'Step 1. Select a server to check';
$MESS['VIBECODECONNECTOR_DIAG_HEADING_RESULT'] = 'Bitrix24 Vibecode status page';
$MESS['VIBECODECONNECTOR_DIAG_HEADING_CHANNELS'] = 'Communication channels';
$MESS['VIBECODECONNECTOR_DIAG_HEADING_LINKS'] = 'Related pages';

$MESS['VIBECODECONNECTOR_DIAG_STEP1_NOTE'] = 'After you click «Check», the on-premises Bitrix24 sends an issueStatusUrl request to the selected server. Bitrix24 Vibecode makes a checkConnection callback with a signed JWT, and if the on-premises Bitrix24 accepts the signature, it returns the status page URL. If everything works, the page loads in the iframe below.';
$MESS['VIBECODECONNECTOR_DIAG_NO_TARGETS'] = 'No communication channel with Bitrix24 Vibecode is configured. Register the portal on the <a href="#URL#">module settings page</a>.';

$MESS['VIBECODECONNECTOR_DIAG_TARGET_CLOUD_SHARED'] = 'Cloud-shared (shared Bitrix24 Vibecode key)';
$MESS['VIBECODECONNECTOR_DIAG_TARGET_PAIRING'] = 'Pairing: #ISS#';
$MESS['VIBECODECONNECTOR_DIAG_PAIRING_EXPIRED'] = 'expired';
$MESS['VIBECODECONNECTOR_DIAG_PAIRING_EXPIRES_AT'] = 'active until: #TIME#';

$MESS['VIBECODECONNECTOR_DIAG_VERIFY_BUTTON'] = 'Check';

$MESS['VIBECODECONNECTOR_DIAG_RESULT_OK'] = 'Connection confirmed. Bitrix24 Vibecode verified our signature; both sides can see each other.';
$MESS['VIBECODECONNECTOR_DIAG_RESULT_FAIL'] = 'Could not confirm the connection';
$MESS['VIBECODECONNECTOR_DIAG_RESULT_EXPIRES_AT'] = 'URL active until: #TIME#';

$MESS['VIBECODECONNECTOR_DIAG_BADGE_CLOUD_SHARED_LABEL'] = 'Cloud-shared';
$MESS['VIBECODECONNECTOR_DIAG_BADGE_CLOUD_SHARED_OK'] = 'configured';
$MESS["VIBECODECONNECTOR_DIAG_BADGE_CLOUD_SHARED_OFF"] = "not applicable";
$MESS['VIBECODECONNECTOR_DIAG_BADGE_PAIRINGS_LABEL'] = 'Pairings';
$MESS['VIBECODECONNECTOR_DIAG_BADGE_PAIRINGS'] = 'registered: #COUNT#';

$MESS['VIBECODECONNECTOR_DIAG_COL_ISS'] = 'Issuer (iss)';
$MESS['VIBECODECONNECTOR_DIAG_COL_PORTAL_ID'] = 'Portal ID';
$MESS['VIBECODECONNECTOR_DIAG_COL_ENDPOINT'] = 'Endpoint';
$MESS['VIBECODECONNECTOR_DIAG_COL_EXPIRES_AT'] = 'Active until';

$MESS['VIBECODECONNECTOR_DIAG_LINK_INCOMING_LOG'] = 'Inbound JWT log';
$MESS['VIBECODECONNECTOR_DIAG_LINK_DEVELOPER_KEYS'] = 'Developer keys';
$MESS['VIBECODECONNECTOR_DIAG_LINK_SETTINGS'] = 'Module settings';

$MESS['VIBECODECONNECTOR_DIAG_ERR_TARGET_REQUIRED'] = 'Select a server: #MESSAGE#';
$MESS['VIBECODECONNECTOR_DIAG_ERR_TARGET_REQUIRED_MSG'] = 'none of the available options is selected.';
$MESS['VIBECODECONNECTOR_DIAG_ERR_PAIRING_NOT_FOUND'] = 'Pairing not found: #MESSAGE#';
$MESS['VIBECODECONNECTOR_DIAG_ERR_PAIRING_NOT_FOUND_MSG'] = 'the selected binding is not in the database. It may have been deleted in another tab.';
$MESS['VIBECODECONNECTOR_DIAG_ERR_CLOUD_SHARED_NOT_CONFIGURED'] = 'Cloud-shared channel not configured: #MESSAGE#';

$MESS['VIBECODECONNECTOR_DIAG_ERR_CONNECTION_CHECK_FAILED'] = 'Bitrix24 Vibecode could not verify our signature (#MESSAGE#). The pairing key is most likely outdated or was removed on the portal side. Try refreshing the key in the module settings.';
$MESS['VIBECODECONNECTOR_DIAG_ERR_LICENSE'] = 'On-premises license problem: #MESSAGE#';
$MESS['VIBECODECONNECTOR_DIAG_ERR_UPSTREAM'] = 'Bitrix24 Vibecode is unavailable at the selected address: #MESSAGE#';
$MESS['VIBECODECONNECTOR_DIAG_ERR_INTERNAL'] = 'Bitrix24 Vibecode internal error: #MESSAGE#';
$MESS['VIBECODECONNECTOR_DIAG_ERR_INVALID_RESPONSE'] = 'Bitrix24 Vibecode returned a response in an unexpected format: #MESSAGE#';
$MESS['VIBECODECONNECTOR_DIAG_ERR_UNKNOWN_ACTION'] = 'This Bitrix24 Vibecode instance does not support the current contract: #MESSAGE#';
$MESS['VIBECODECONNECTOR_DIAG_ERR_GENERIC'] = 'Error: #MESSAGE#';

$MESS["VIBECODECONNECTOR_DIAG_TARGET_CLOUD_SHARED_NO_KEY"] = "no key yet: it will be fetched during the check";
$MESS["VIBECODECONNECTOR_DIAG_BADGE_CLOUD_SHARED_NO_KEY"] = "active, no key yet";
$MESS["VIBECODECONNECTOR_DIAG_LINK_CLOUD_SHARED_KEY_LOG"] = "Key retrieval log";
$MESS["VIBECODECONNECTOR_DIAG_ERR_CLOUD_SHARED_NOT_APPLICABLE_MSG"] = "this Bitrix24 is not cloud hosted, or the network ID is empty.";
