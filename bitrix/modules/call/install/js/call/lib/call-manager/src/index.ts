// The launcher only subscribes to the messenger lifecycle; it rides this extension because
// this is what represents `call` on chat pages and is loaded eagerly, so the subscription is
// in place before the messenger mounts. The import is also what puts the launcher into `rel`
// of the generated config.php: chef derives dependencies from imports and overwrites manual
// entries on every build.
import 'call.lib.sync-tab-banner-launcher';

import { CallManager } from './call-manager';

export { CallManager };
