// The widget is a Vue component; nothing else here imports the runtime, so the dependency is
// declared explicitly (otherwise config.php would not list it and a lone loader would get no Vue).
import 'ui.vue3';

import './style.css';

export { BacklinksWidgetComponent } from './backlinks-widget';
export { BacklinksApi } from './backlinks-api';
export { subscribeDocumentBacklinks } from './pull';
export { createBacklinksMessages } from './messages';
