import 'main.polyfill.intersectionobserver';
// Selection mode reuses the ui-checkbox visual (markup is hand-written; the imperative class is not used)
import 'ui.system.checkbox';
// Bulk-actions bar renders Outline glyphs — declare the icon set here so chef records the dependency
// (previously resolved only transitively through note.sidebar).
import 'ui.icon-set.outline';
import './styles/document-list.css';
import './styles/bulk-actions-bar.css';

export { DocumentList } from './components/document-list';
export { DocumentListItem } from './components/document-list-item';
export { BulkActionsBar } from './components/bulk-actions-bar';
export { createSelection } from './composables/use-selection';
