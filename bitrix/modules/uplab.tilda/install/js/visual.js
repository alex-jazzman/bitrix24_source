BX.addCustomEvent('OnEditorInitedBefore', function (editor) {
    window.tildaTag = function (tag) {
        editor.InsertHtml(tag, editor.selection.GetRange())
    };

    this.AddButton({
        iconClassName: 'up_tilda_editor_button',
        id: 'up_tilda_editor_button',
        src: '/bitrix/images/uplab.tilda/uplab.tilda.png',
        name: BX.message('uplab.tilda_MODULE_NAME'),
        toolbarSort: 200,
        handler: function (ev) {
            var popupContentUrl = "/bitrix/admin/uplab.tilda_editor_popup.php";
            var codeDialog = new BX.CDialog({
                title: BX.message('uplab.tilda_MODULE_NAME'),
                content_url: popupContentUrl,
                min_width: 800,
                min_height: 500,
                width: 800,
                height: 500
            });

            // Покажем окно
            codeDialog.Show();
        }
    });
});