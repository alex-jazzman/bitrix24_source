BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Vhi");

    BX.MyWebstor.HMS.Vhi.Details = function ({
        GUID: entityEditorID,
        ID: vhiID,
    }) {
        var entityEditor = BX.UI.EntityEditor.get(entityEditorID);
        if (!entityEditor) return;

        this.ID = vhiID;
        this.entityEditor = entityEditor;

        BX.addCustomEvent(
            "BX.UI.EntityEditorAjax:onSubmit",
            function (data, response) {
                if (response.status != "success" || !data) return;

                var toolbar = BX.UI.ToolbarManager.getDefaultToolbar();
                if (!toolbar) return;

                var titleContainer =
                    toolbar.titleContainer.querySelector("#pagetitle");
                if (!titleContainer) return;
            }
        );
    };

    BX.MyWebstor.HMS.Vhi.Details.prototype.delete = function () {
        var vhiID = this.ID;
        if (vhiID <= 0) return;

        BX.ajax
            .runComponentAction("mywebstor:hms.vhi.details", "delete", {
                mode: "class",
                data: {
                    vhiID,
                },
            })
            .then((result) => {
                BX.SidePanel.Instance.close();

                var parent =
                        BX.SidePanel.Instance.getPreviousSlider(
                            BX.SidePanel.Instance.getCurrentPage()
                        )?.getWindow?.() || window.parent,
                    gridManager;
                if (
                    !parent.BX.Main ||
                    !(gridManager = parent.BX.Main.gridManager)
                )
                    return;
                var grids = gridManager.data;
                grids.forEach((grid) => grid.instance.reload());
            })
            .catch((result) => {
                var errors = result.errors.reduce((str, error) => {
                    str += error.message + "\n\t<br>";
                    return str;
                }, "");

                this.entityEditor._toolPanel.addError(errors);
                this.entityEditor._toolPanel.setVisible(true);
            });
    };

    BX.MyWebstor.HMS.Vhi.Details.Instance = null;
    BX.MyWebstor.HMS.Vhi.Details.getInstance = function (
        entityEditorID,
        vhiID
    ) {
        if (BX.MyWebstor.HMS.Vhi.Details.Instance === null)
            BX.MyWebstor.HMS.Vhi.Details.Instance =
                new BX.MyWebstor.HMS.Vhi.Details(entityEditorID, vhiID);

        return BX.MyWebstor.HMS.Vhi.Details.Instance;
    };
});
