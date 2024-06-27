BX.ready(function () {
    BX.namespace("BX.MyWebstor.HMS.Vhi.ServiceType");

    BX.MyWebstor.HMS.Vhi.ServiceType.Details = function ({
        GUID: entityEditorID,
        ID: vhiServiceTypeID,
    }) {
        var entityEditor = BX.UI.EntityEditor.get(entityEditorID);
        if (!entityEditor) return;

        this.ID = vhiServiceTypeID;
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

    BX.MyWebstor.HMS.Vhi.ServiceType.Details.prototype.delete = function () {
        var vhiServiceTypeID = this.ID;
        if (vhiServiceTypeID <= 0) return;

        BX.ajax
            .runComponentAction(
                "mywebstor:hms.vhi.service_type.details",
                "delete",
                {
                    mode: "class",
                    data: {
                        vhiServiceTypeID,
                    },
                }
            )
            .then((result) => {
                BX.SidePanel.Instance.close();

                var parent = window.parent,
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

    BX.MyWebstor.HMS.Vhi.ServiceType.Details.Instance = null;
    BX.MyWebstor.HMS.Vhi.ServiceType.Details.getInstance = function (
        entityEditorID,
        vhiServiceTypeID
    ) {
        if (BX.MyWebstor.HMS.Vhi.ServiceType.Details.Instance === null)
            BX.MyWebstor.HMS.Vhi.ServiceType.Details.Instance =
                new BX.MyWebstor.HMS.Vhi.ServiceType.Details(
                    entityEditorID,
                    vhiServiceTypeID
                );

        return BX.MyWebstor.HMS.Vhi.ServiceType.Details.Instance;
    };
});
