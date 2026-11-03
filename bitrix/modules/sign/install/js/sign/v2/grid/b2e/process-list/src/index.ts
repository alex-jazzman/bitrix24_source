// The hint of the cell "Documents" is markup and not a call: the cell carries `data-ui-tooltip` with the
// reason the server recorded, and the markup surface of the extension raises the bubble over it. Loading it
// is the whole of the binding, and it serves the rows the grid replaces over ajax as well as the first ones.
import 'ui.system.tooltip';

export { ProcessList } from './process-list';
