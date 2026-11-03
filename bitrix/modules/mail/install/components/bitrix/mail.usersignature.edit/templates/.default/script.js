;(function ()
{
	'use strict';

	BX.namespace('BX.Mail.UserSignature.Edit');

	var editor = null;
	var imageSourceMenu = null;

	BX.Mail.UserSignature.Edit.init = function(params)
	{
		if (imageSourceMenu)
		{
			imageSourceMenu.destroy();
		}
		if (editor)
		{
			editor.destroy();
		}

		var Editor = BX.Mail.Signature.Editor;
		var userTransport = new Editor.UserSignatureTransport();
		var sharedSignatureId = parseInt(params.sharedSignatureId, 10) || 0;
		var unifiedSignatureId = parseInt(params.unifiedSignatureId, 10) || 0;
		var sharedCard = params.showSharedSignatureCard ? buildSharedScopeCard(Editor, params) : null;
		var capabilities = buildCapabilities(Editor, params);

		editor = new Editor.SignatureEditor({
			editorInstanceId: 'signatureeditorid',
			initialContent: params.signature || '',
			signatureId: parseInt(params.signatureId, 10) || 0,
			alertContainer: BX('signature-alert-container'),
			panel: new Editor.SenderBindingPanel({
				senderOptions: params.senderOptions,
			}),
			panelContainer: BX('sender-binding-panel'),
			scopeCard: sharedCard,
			scopeCardContainer: sharedCard ? BX('shared-signature-panel') : null,
			transport: Editor.needsUnifiedTransport({
				unifiedSignatureId: unifiedSignatureId,
				hasSharedScopeCard: sharedCard !== null
			})
				? new Editor.CompositeTransport(
					userTransport,
					new Editor.SharedSignatureTransport(),
					{
						sharedSignatureId: sharedSignatureId,
						unifiedSignatureId: unifiedSignatureId,
						initialKind: params.initialKind,
						unifiedTransport: new Editor.UnifiedSignatureTransport()
					}
				)
				: userTransport,
			sliderMessage: { eventId: 'mail-add-signature', idKey: 'userSignatureId' },
			capabilities: capabilities,
		});
	};

	function buildCapabilities(Editor, params)
	{
		var capabilities = [];
		var catalog = Editor.SignatureMacroCatalog.fromDto(params.signatureMacroCatalog);
		var actionContainer = BX('signature-macro-action-container');
		if (catalog && actionContainer && Editor.SignatureMacroCapability)
		{
			capabilities.push(new Editor.SignatureMacroCapability({
				catalog: catalog,
				actionContainer: actionContainer
			}));
		}

		if (params.signatureImagesAvailable === true)
		{
			var imageCapability = new Editor.ImageCapability({
				localUploader: new Editor.LocalImageUploader({}),
				diskPicker: new Editor.DiskImagePicker(),
			});
			capabilities.push(imageCapability);

			imageSourceMenu = new Editor.ImageSourceMenu({
				editorInstanceId: 'signatureeditorid',
				capability: imageCapability,
			});
			imageSourceMenu.attach();
		}

		return capabilities;
	}

	/**
	 * Third card: the switcher of the scope over the assignment targets. An existing shared
	 * signature opens with the switcher on and its targets already chosen.
	 */
	function buildSharedScopeCard(Editor, params)
	{
		return new Editor.AssignmentTypeSelector({
			shared: params.sharedScope === true,
			assignments: params.assignments || []
		});
	}

	BX.Mail.UserSignature.Edit.save = function(closeAfter)
	{
		if (editor)
		{
			editor.save(closeAfter === true);
		}
	};
})();
