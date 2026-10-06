import './bx';
import './protobuf';
import '../../../../../../../rest/install/js/rest/client/rest.client';
// ui.notification was consolidated from three sub-extensions (balloon/stack/center)
// into a single extension; load it so the harness keeps the notification setup.
import 'ui.notification';

import { Loc } from 'main.core';

Loc.setMessage({
	IM_MODEL_USERS_CHAT_BOT: '',
	IM_MODEL_USERS_COLLABER: '',
	IM_MODEL_USERS_DEFAULT_NAME: '',
});
