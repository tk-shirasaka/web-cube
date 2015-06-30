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
    var partsControlEdit    = "glyphicon glyphicon-pencil";
    var partsControlCopy    = "glyphicon glyphicon-duplicate";
    var partsControlRemove  = "glyphicon glyphicon-trash";
    var partsControlAdd     = "glyphicon glyphicon-plus";
    var partsControlUp      = "glyphicon glyphicon-chevron-up";
    var partsControlDown    = "glyphicon glyphicon-chevron-down";
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

            $.ajax({type: type, url: url, data: JSON.stringify(data), contentType: "application/JSON", dataType: "JSON"})
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
        reset : function () {
            this.data   = [];
            this.ids    = [];
        },
        rebuild : function () {
            var parts, parent;
            var data    = [];
            var ids     = this.getIds();

            for (var i = 0; i < ids.length; i++) {
                data.push(copyObject(this.findById(ids[i]), "Child"));
            }

            this.data   = [];

            for (var i = 0, parts = data[i]; i < data.length; i++, parts = data[i]) {
                parts.Child = [];
                if (parts.Parts.parent) {
                    parent  = this.findById(parts.Parts.parent);
                    parent.Child.push(parts);
                } else {
                    this.data.push(parts);
                }
            }
        },
        remove : function (id, noUpdate) {
            var parts   = this.findById(id);
            var parent  = this.findById(parts.Parts.parent);

            if (parts.Child) {
                for (var i = 0; i < parts.Child.length; i++) {
                    this.remove(parts.Child[i]._id, true);
                }
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
        _setChild : function (parts) {
            if (parts.Child) return;
            var child   = this.findById(parts._id);
            parts.Child = (child.Child) ? child.Child : [];
        },
        _setNewId : function (parts) {
            var index;
            var oldId       = parts._id;

            this._setChild(parts);
            parts._id       = (parts.Parts.parent) ? parts._id = parts.Parts.parent : "";
            parts._id      += "__" + ((parts.Parts.row) ? parts.Parts.row : "0") + parts.Parts.offset + Math.random().toString().replace(".", "");
            parts.Parts.id  = "Parts" + parts._id;

            index           = this.ids.indexOf(oldId);
            if (index === -1) {
                this.ids.push(parts._id);
            } else {
                this.ids[index] = parts._id;
            }
            for (var i = 0; i < parts.Child.length; i++) {
                parts.Child[i].Parts.parent = parts._id;
                this._setNewId(parts.Child[i]);
            }
        },
        _setId : function (parts) {
            if (now) {
                parts._id       = now;
                parts.Parts.id  = "Parts" + now;
            }

            this._setNewId(parts);
        },
        _setParts : function (parts) {
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
        setParts : function (parts, skipUpdate) {
            var index, html;
            parts._dirty    = true;

            this._setId(parts);
            this._setParts(parts);
            if (!skipUpdate) this.updateHtml();
            putFormData($partsForm, {Parts: {parent: ""}});
        },
        setPage : function(data) {
            this.reset();
            this.exeAjax(
                $pageForm,
                data,
                function (res) {
                    for (var i = 0; i < res.length; i++) {
                        PartsClass.setParts(res[i], true);
                    }
                    PartsClass.updateHtml();
                }
            );
        },
        getIds : function () {
            return this.ids.sort();
        },
        setHtml : function (html, id) {
            this.html   = html;
        },
        getHtml : function () {
            return this.html;
        },
        updateHtml : function() {
            this.rebuild();
            this.exeAjax(
                $partsForm,
                {
                    Parts: {id: "", row: 0, col: 12, offset: 0, title: "", type: "Block"},
                    Child: this.data
                },
                function (res) {
                    PartsClass.setHtml(res.html);
                    partsRefresh();
                    $(".parts-active").removeClass("parts-active");
                }
            );
        }
    };

    var PartsControl        = React.createClass({
        render: function() {
            var list = this.props.ids.map(function (id) {
                var parts       = PartsClass.findById(id);
                var title       = (parts.Parts.title) ? parts.Parts.title : "--";
                var isChild     = {display: (parts.Parts.parent) ? "none" : "block"};
                var hasChild    = {display: (parts.Child.length) ? "block" : "none"};
                return (
                    <div className="btn-group" style={isChild}>
                        <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <div>Title  : {title}</div>
                        </button>
                        <ul id={parts._id} className="dropdown-menu">
                            <li className="parts-edit-btn"><a href="#">Edit <span className={partsControlEdit}></span></a></li>
                            <li className="parts-copy-btn"><a href="#">Copy <span className={partsControlCopy}></span></a></li>
                            <li className="parts-remove-btn"><a href="#">Remove <span className={partsControlRemove}></span></a></li>
                            <li className="parts-add-btn"><a href="#">Add Child <span className={partsControlAdd}></span></a></li>
                            <li className="parts-show-btn" style={hasChild}><a href="#">Show Child <span className={partsControlDown}></span></a></li>
                            <li className="parts-hide-btn" style={hasChild}><a href="#">Hide Child <span className={partsControlUp}></span></a></li>
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
                    <div id="parts-contents" className="col-xs-9 col-md-9 col-sm-9 panel panel-default">
                        <div className="panel-body" dangerouslySetInnerHTML={{__html: this.state.html}} />
                    </div>
                    <PartsControl ids={this.state.ids} />
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

    function partsRefresh() {
        now = null;
        $("#PartsUpdate").trigger("click");
        markdown();
        partsEdit();
        partsCopy();
        partsRemove();
        partsAddChild();
        partsViewChild();
    }

    function partsEdit() {
        $(".parts-container .parts-control").find(".parts-edit-btn").unbind("click");
        $(".parts-container .parts-control").find(".parts-edit-btn").bind("click", function () {
            var id          = $(this).parent().attr("id");
            var parts       = PartsClass.findById(id);

            if (parts !== false) {
                $(this).parent().prev().removeClass("btn-info btn-success btn-warning");
                $(this).parent().prev().addClass("btn-success");
                now = id;
                putFormData($partsForm, parts)
            }
        });

        $(".parts-container .parts-control button").unbind("click");
        $(".parts-container .parts-control button").bind("click", function () {
            var id          = $(this).next().attr("id");
            var parts       = PartsClass.findById(id);
            var parent      = parts.Parts.parent;

            $(".parts-active").removeClass("parts-active");
            $(".parts-container .parts-control button").removeClass("btn-info btn-success btn-warning");
            $("#Parts" + id).addClass("parts-active");
            $(this).addClass("btn-info");

            while (parts.Parts.parent) {
                $("#" + parts.Parts.parent).prev().addClass("btn-warning");
                parts       = PartsClass.findById(parts.Parts.parent);
            }
            now = null;
        });
    }

    function partsCopy() {
        $(".parts-container .parts-control").find(".parts-copy-btn").unbind("click");
        $(".parts-container .parts-control").find(".parts-copy-btn").bind("click", function () {
            var id          = $(this).parent().attr("id");
            var parts       = copyObject(PartsClass.findById(id), ["_id", "_originalId"]);
            parts.Parts.title += " - Copy";
            PartsClass.setParts(parts);
        });
    }

    function partsRemove() {
        $(".parts-container .parts-control").find(".parts-remove-btn").unbind("click");
        $(".parts-container .parts-control").find(".parts-remove-btn").bind("click", function () {
            var id          = $(this).parent().attr("id");

            PartsClass.remove(id);
        });
    }

    function partsAddChild() {
        $(".parts-container .parts-control").find(".parts-add-btn").unbind("click");
        $(".parts-container .parts-control").find(".parts-add-btn").bind("click", function () {
            var id          = $(this).parent().attr("id");

            putFormData($partsForm, {"Parts.parent": id});
        });
    }

    function partsViewChild() {
        $(".parts-container .parts-control").find(".parts-hide-btn").addClass("hide");
        $(".parts-container .parts-control").find(".parts-show-btn").removeClass("hide");
        $(".parts-container .parts-control").find(".parts-show-btn, .parts-hide-btn").unbind("click");
        $(".parts-container .parts-control").find(".parts-show-btn, .parts-hide-btn").bind("click", function () {
            var id          = $(this).parent().attr("id");
            var ids         = PartsClass.getIds();
            var children    = [];
            var show        = $(this).hasClass("parts-show-btn");

            for (var i = 0; i < ids.length; i++) {
                if (id === ids[i]) continue;
                if (!ids[i].match(RegExp("^" + id))) continue;
                if (show && id.split("__").length + 1 < ids[i].split("__").length) continue;
                children.push("#" + ids[i]);
            }
            if (children.length) {
                if (show) {
                    $(children.join()).parent().slideDown();
                } else {
                    $(children.join()).parent().slideUp();
                }
                $(this).addClass("hide");
                $(children.join()).find(".parts-hide-btn").addClass("hide");
                $(children.join()).find(".parts-show-btn").removeClass("hide");
                $(this).parent().find((show) ? ".parts-hide-btn" : ".parts-show-btn").removeClass("hide");
            }
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

    function copyObject(obj, excludes) {
        var ret     = {};
        var parsed  = parseObject(obj);
        if (typeof excludes === "string") excludes = [excludes];

        jQuery.each(parsed, function (key, val) {
            var obj     = ret;
            var keys    = key.split(".");
            var next    = "";
            var getNext = function (i) { return (i === keys.length) ? null : keys[i + 1]; }

            for (var i = 0, next = getNext(i), key = keys[0]; i < keys.length - 1; i++, key = keys[i], next = getNext(i)) {
                if (excludes.indexOf(key) >= 0) break;
                if (!obj[key]) obj[key] = (isFinite(next)) ? [] : {};
                obj = obj[key];
            }
            obj[key]     = (excludes.indexOf(key) === -1) ? val : null;
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
            if (typeof val === "object" && val) {
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
