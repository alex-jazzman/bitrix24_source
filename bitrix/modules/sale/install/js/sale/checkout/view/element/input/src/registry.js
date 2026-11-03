import './product-item-quantity'
import './property-phone'
import './property-text'
import './property-email'
import './property-number'
import './property-checkbox'
import './property-date'
import './property-enum'

// the builder creates the namespace objects only for a bundle that exports something,
// and the dependent bundles read them on load
export { MixinPropertyField } from './property-field';
