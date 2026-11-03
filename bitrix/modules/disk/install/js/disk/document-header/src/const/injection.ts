/**
 * Keys the wrapper of the application puts the context of the opening under. Everything here belongs
 * to the concrete opening and not to the composition, so the components take it by injection instead
 * of carrying it through props of the components which do not use it.
 */
export const SaveStatusInjectionKey = 'diskDocumentHeaderSaveStatus';
export const EditorAdapterInjectionKey = 'diskDocumentHeaderEditorAdapter';
export const EditUrlInjectionKey = 'diskDocumentHeaderEditUrl';
export const ShowPromoImmediatelyInjectionKey = 'diskDocumentHeaderShowPromoImmediately';
/** The header stands on a page of its own, so the name of the object is the heading of that page. */
export const NameAsPageHeadingInjectionKey = 'diskDocumentHeaderNameAsPageHeading';
/** The shell of the page which owns the presentation mode; absent for a shell which has none. */
export const PresentationAdapterInjectionKey = 'diskDocumentHeaderPresentationAdapter';
