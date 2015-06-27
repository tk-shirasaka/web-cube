<script type="text/jsx">
$(function () {
    var now                 = null;
    var inputTagList        = "input, select, textarea";
    var attrDialogList      = {
            Form:           "#FormPartsDialog",
            Block:          "#BlockPartsDialog",
            Text:           "#TextPartsDialog",
            Choice:         "#ChoicePartsDialog",
            Input:          "#InputPartsDialog",
            Header:         "#HeaderPartsDialog",
            Link:           "#LinkPartsDialog"
    };
    var partsControlChange  = "glyphicon glyphicon-pencil";
    var partsControlRemove  = "glyphicon glyphicon-trash";
    var partsControlPlus    = "glyphicon glyphicon-plus";
    var $formTab            = $("#FormTab");
    var $pageForm           = $("#PageForm");
    var $partsForm          = $("#PartsForm");
    var $partsDialog        = $("#PartsDialog");
    var $partsAttrDialog    = $("#PartsAttrDialog");

    var PartsClass          = {
        data : [],
        ids : [],

        exeAjax : function ($form, data, afterJson) {
            var type    = $form.attr("method");
            var url     = $form.attr("action");

            $.ajax({type: type, url: url, data: data})
            .done(function(res) {
                afterJson(res);
            });
        },
        findById : function (id) {
            if (!id) return false;

            var data    = this.data;
            var ids     = id.split("__");
            var srch    = "";

            for (var i = 1; i < ids.length; i++) {
                srch   += "__" + ids[i];

                for (var j= 0; j < data.length; j++) {
                    if (data[j]._id !== srch) continue;
                    if (i + 1 === ids.length) return data[j];
                    data    = data[j].Child;
                    break;
                }
            }
            return false;
        },
        remove : function (id, noUpdate) {
            var parts   = this.findById(id);
            var parent  = this.findById(parts.Parts.parent);

            for (var i = 0; i < parts.Child.length; i++) {
                this.remove(parts.Child[i]._id, true);
            }

            if (!parent)    parent = this.data;
            for (var i = 0; i < parent.length; i++) {
                if (parent[i]._id !== parts._id) continue;
                parent.splice(i, 1);
                break;
            }
            for (var i = 0; i < this.ids.length; i++) {
                if (this.ids[i] !== parts._id) continue;
                this.ids.splice(i, 1);
                break;
            }
            if (!noUpdate) this.updateHtml();
        },
        _set : function (parts) {
            var data    = this.findById(parts.Parts.parent);

            if (data) {
                data    = data.Child;
            } else {
                data   = this.data;
            }
            for (var i = 0; i < data.length; i++) {
                if (data[i]._id !== parts._id) continue;
                parts.Child = data[i].Child;
                data[i]     = parts;
                return;
            }

            data.push(parts);
        },
        setParts : function (parts) {
            var index, html;
            var parent      = this.findById(parts.Parts.parent);

            if (now)            parts._id = now;
            if (!parts.Child)   parts.Child = [];
            if (!parts._id) {
                parts._id   = "";
                if (parent) parts._id  += parent._id;
 
                parts._id      += "__" + new Date().getTime();
                this.ids.push(parts._id);
            }

            parts.Parts.id  = "Parts" + parts._id;
            this._set(parts);
            this.updateHtml()
        },
        setPage : function(data) {
            this.data   = [];
            this.exeAjax(
                $pageForm,
                data,
                function (res) {
                    PartsClass.setParts({
                        Parts: {id: "", row: 0, col: 12, offset: 0, title: "", type: "Block"},
                        Child: JSON.parse(res)
                    });
                }
            );
        },
        getIds : function () {
            return this.ids;
        },
        setHtml : function (html, id) {
            this.html   = html;
        },
        getHtml : function () {
            return this.html;
        },
        updateHtml : function() {
            this.exeAjax(
                $partsForm,
                {
                    Parts: {id: "", row: 0, col: 12, offset: 0, title: "", type: "Block"},
                    Child: this.data
                },
                function (res) {
                    PartsClass.setHtml(res);
                    partsRefresh();
                    $(".parts-active").removeClass("parts-active");
                }
            );
        }
    };

    var PartsControl        = React.createClass({
        render: function() {
            var list = this.props.ids.map(function (id) {
                var parts   = PartsClass.findById(id);
                var title   = (parts.Parts.title) ? parts.Parts.title : "--";
                var parent  = PartsClass.findById(parts.Parts.parent);
                parent      = (parent) ? parent.Parts.title : "none";
                return (
                    <div className="btn-group">
                        <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <div>Parent : {parent}</div>
                            <div>Title  : {title}</div>
                        </button>
                        <ul id={parts._id} className="dropdown-menu">
                            <li className="parts-change-btn"><a href="#">Change <span className={partsControlChange}></span></a></li>
                            <li className="parts-remove-btn"><a href="#">Remove <span className={partsControlRemove}></span></a></li>
                            <li className="parts-add-btn"><a href="#">Add Child <span className={partsControlPlus}></span></a></li>
                        </ul>
                    </div>
                );
            });
            return (
                <div className="col-xs-3 col-md-3 col-sm-3">
                    <div className="parts-control btn-group-vertical">
                        {list}
                    </div>
                </div>
            );
        }
    });

    var PartsContainer      = React.createClass({
        getInitialState: function() {
            return {ids: [], html: ""};
        },
        partsUpdate: function() {
            this.setState({
                ids     : PartsClass.getIds(),
                html    : PartsClass.getHtml(),
            });
        },
        render: function() {
            return (
                <div className="parts-container">
                    <PartsControl ids={this.state.ids} />
                    <div id="parts-contents" className="col-xs-9 col-md-9 col-sm-9">
                        <div dangerouslySetInnerHTML={{__html: this.state.html}} />
                    </div>
                    <button id="PartsUpdate" className="hide" onClick={this.partsUpdate}></button>
                </div>
            );
        }
    });

    function init() {
        showAttrDialog($("#PartsTypeChoice").val());
        $("#PartsTypeChoice").change(function () {
            showAttrDialog($(this).val());
        })

        $("#TextMultipleChoice").change(function () {
            var val         = $(this).prop("checked");
            var src         = (val) ? "input" : "textarea";
            var dst         = (val) ? "textarea" : "input";
            var targetHtml  = $("#TextContentsInput div").html();
            $("#TextContentsInput div").html(targetHtml.replace(new RegExp(src), dst));
        })

        $formTab.find("li a").attr("data-toggle", "tab");
        $formTab.children(":first").addClass("active");

        $partsForm.submit(function (e) {
            e.preventDefault();
            PartsClass.setParts(getFormData(this));
        });

        $pageForm.submit(function (e) {
            e.preventDefault();
            PartsClass.setPage(getFormData(this));
        });
    }

    function afterAjax(res) {
    }

    function partsRefresh() {
        now = null;
        $("#PartsUpdate").trigger("click");
        markdown();
        partsRemove();
        partsChange();
        partsAddChild();
    }

    function partsRemove() {
        $(".parts-container .parts-control").find(".parts-remove-btn").unbind("click");
        $(".parts-container .parts-control").find(".parts-remove-btn").bind("click", function () {
            var id      = $(this).parent().attr("id");

            PartsClass.remove(id);
        });
    }

    function partsChange() {
        $(".parts-container .parts-control").find(".parts-change-btn").unbind("click");
        $(".parts-container .parts-control").find(".parts-change-btn").bind("click", function () {
            var id          = $(this).parent().attr("id");
            var parts       = PartsClass.findById(id);
            var $contents   = $("#Parts" + id);
            var $control    = $(this).parent().prev();

            if (parts !== false) {
                now = parts._id;
                putFormData($partsForm, parts)
            }

            $(".parts-active").removeClass("parts-active");
            $contents.addClass("parts-active");
            $control.addClass("parts-active");
        });
    }

    function partsAddChild() {
        $(".parts-container .parts-control").find(".parts-add-btn").unbind("click");
        $(".parts-container .parts-control").find(".parts-add-btn").bind("click", function () {
            var id          = $(this).parent().attr("id");

            putFormData($partsForm, {"Parts.parent": id});
        });
    }

    function showAttrDialog(target) {
        target  = attrDialogList[target];

        $.each(attrDialogList, function (key, val) {
            $(val).addClass("hide");
            $(val).find(inputTagList).each(function () {
                $(this).attr("disabled", "disabled");
            });
        })

        $(target).removeClass("hide");
        $(target).find(inputTagList).each(function () {
            $(this).removeAttr("disabled");
        });
    }

    function strToObj(str, value, ret) {
        if (!ret) ret = {};
        var _ret    = ret;
        str         = str.split(".");

        str.forEach(function (val, key) {
            if (_ret[val] === undefined) _ret[val] = {};
            if (key + 1 === str.length) {
                _ret[val]   = value
            } else {
                _ret        = _ret[val];
            }
        });

        return ret;
    }

    function parseObject(obj, path, ret) {
        if (!ret) ret = {};
        if (!path) {
            path    = "";
        } else {
            path   += "."
        } 
        jQuery.each(obj, function (key, val) {
            if (typeof val === "object") {
                ret             = parseObject(val, path + key, ret);
            } else {
                ret[path + key] = val;
            }
        });
        return ret;
    }

    function getFormData(form, ret) {
        $(form).find(inputTagList).each(function () {
            var name    = $(this).attr("name");
            var value   = $(this).val();

            if ($(this).attr("disabled")) return true;
            if ($(this).prop("type") === "checkbox") value = $(this).prop("checked") ? 1 : "";

            ret = strToObj(name, value, ret);
        });
        return ret;
    }

    function putFormData($form, data) {
        jQuery.each(parseObject(data), function (key, val) {
            var input = $form.find("[name='" + key + "']");
            if (!input.length) return true;
            if ($(input).prop("type") === "checkbox") {
                $(input).prop("checked", val);
            } else {
                $(input).val(val).change();
            }
        });
    }

    function markdown() {
        $("[parts-markdown=1]").each(function () {
            $(this).html(marked($(this).html().trim()));
        });
    }

    init();

    React.render(
        <PartsContainer />,
        document.getElementById('Main')
    );
});
</script>
