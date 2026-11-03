/**
 * Anchors of the header for the autotests. One header serves every viewer, so a name tells the
 * element it marks and never the engine of the page behind it.
 */
export const HeaderTestId = Object.freeze({
	Root: 'disk-document-header',
	Logo: 'disk-document-header-logo',
	Name: 'disk-document-header-name',
	NameField: 'disk-document-header-name-field',
	NameSubmit: 'disk-document-header-name-submit',
	ContentWarning: 'disk-document-header-content-warning',
	SaveStatus: 'disk-document-header-save-status',
	SaveStatusRetry: 'disk-document-header-save-status-retry',
	Boost: 'disk-document-header-boost',
	Edit: 'disk-document-header-edit',
	EditMenu: 'disk-document-header-edit-menu',
	Presence: 'disk-document-header-presence',
	PresenceTrigger: 'disk-document-header-presence-trigger',
	PresenceAvatar: 'disk-document-header-presence-avatar',
	PresenceList: 'disk-document-header-presence-list',
	PresenceItem: 'disk-document-header-presence-item',
	Access: 'disk-document-header-access',
	CopyLink: 'disk-document-header-copy-link',
	Download: 'disk-document-header-download',
	Presentation: 'disk-document-header-presentation',
} as const);
