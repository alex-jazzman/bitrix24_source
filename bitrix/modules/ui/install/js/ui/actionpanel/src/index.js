// legacy sources use BX globals without imports, so core is declared explicitly
import 'main.core';
import 'ui.action-panel';
import 'ui.design-tokens';
import 'ui.fonts.opensans';

import './style.css';

// legacy modules publish BX.UI.ActionPanel and BX.UI.ActionPanel.Item themselves;
// item extends the panel constructor, so the order is significant
import './panel';
import './item';
