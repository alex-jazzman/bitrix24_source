import { DependentVariables } from './dependent-variables';

/**
 * Single-select variant of DependentVariables. Cell/Row components are shared
 * (the inherited getComponentName returns 'DependentVariables'); the difference
 * lives inside PopupContent and is keyed off right.type.
 */
export class SingleDependentVariables extends DependentVariables
{
}
