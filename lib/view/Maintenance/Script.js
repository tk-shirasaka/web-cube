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
    var selectIcon          = "pull-right glyphicon glyphicon-th-list";
    var editIcon            = "pull-right glyphicon glyphicon-pencil";
    var copyIcon            = "pull-right glyphicon glyphicon-duplicate";
    var removeIcon          = "pull-right glyphicon glyphicon-trash";
    var addIcon             = "pull-right glyphicon glyphicon-plus";
    var slideUpIcon         = "pull-right glyphicon glyphicon-chevron-up";
    var slideDownIcon       = "pull-right glyphicon glyphicon-chevron-down";
    var zoomInIcon          = "pull-right glyphicon glyphicon-zoom-in";
    var zoomOutIcon         = "pull-right glyphicon glyphicon-zoom-out";
    var $pageForm           = $("#PageForm");
    var $partsForm          = $("#PartsForm");
    var $partsDialog        = $("#PartsDialog");
    var $partsAttrDialog    = $("#PartsAttrDialog");

    var PartsClass          = {
        base : null,
        page : "",
        data : [],
        ids : [],

        _reset : function () {
            this.base       = null;
            this.page       = "";
            this.data       = [];
            this.ids        = [];
        },
        _rebuild : function () {
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
        _setChild : function (parts) {
            if (parts.Child) return;
            var child   = this.findById(parts._id);
            parts.Child = (child.Child) ? child.Child : [];
        },
        _setId : function (parts) {
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
                this._setId(parts.Child[i]);
            }
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
        remove : function (id, skipUpdate) {
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
            if (!skipUpdate) this.updateHtml();
        },
        zoom : function (id) {
            this.base   = id;
            this.updateHtml();
        },
        setParts : function (parts, skipUpdate) {
            var index, html;
            parts._id       = now;
            parts._dirty    = true;

            this._setId(parts);
            this._setParts(parts);
            if (!skipUpdate) this.updateHtml();
        },
        getPage : function() {
            return $pageForm.find("[value='" + this.page + "']").text();
        },
        setPage : function(data) {
            this._reset();
            this.page   = data.page;
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
        getIds : function (search, depth) {
            var ids = [];
            if (search) {
                for (var i = 0; i < this.ids.length; i++) {
                    if (!this.ids[i].match(RegExp("^" + search))) continue;
                    if (depth && (search.split("__").length + depth) < this.ids[i].split("__").length) continue;
                    ids.push(this.ids[i]);
                }
            } else {
                ids = this.ids;
            }
            return ids.sort();
        },
        setError : function (error) {
            this.error   = error;
        },
        getError : function (id) {
            return this.error[id];
        },
        setHtml : function (html) {
            this.html   = html;
        },
        getHtml : function () {
            return this.html;
        },
        updateHtml : function() {
            this._rebuild();
            var data = [this.findById(this.base)];

            if (!data[0]) data = this.data;
            this.exeAjax(
                $partsForm,
                {
                    Parts: {id: "", row: 0, col: 12, offset: 0, title: "", type: "Block"},
                    Child: data
                },
                function (res) {
                    PartsClass.setHtml(res.html);
                    PartsClass.setError(res.error);
                    partsRefresh();
                    $(".parts-active").removeClass("parts-active");
                }
            );
        }
    };

    var PartsControl        = React.createClass({
        getInitialState: function () {
            return {now : "", selected : false};
        },
        pageSelect: function () {
            $("#PageFormParent").modal();
        },
        partsEdit: function () {
            var parts       = PartsClass.findById(this.state.now);
            var error       = PartsClass.getError(this.state.now);

            if (parts !== false) {
                now = this.state.now;
                putFormData($partsForm, parts, error);
                $("#PartsFormParent").modal();
            }
        },
        partsCopy: function () {
            var parts       = copyObject(PartsClass.findById(this.state.now), ["_id", "_originalId"]);

            if (parts !== false) {
                parts.Parts.title += " - Copy";
                PartsClass.setParts(parts);
            }
        },
        partsRemove: function () {
            if (this.state.now) PartsClass.remove(this.state.now);
        },
        partsAdd: function (addChild) {
            putFormData($partsForm, (addChild) ? {"Parts.parent": this.state.now} : {});
            $("#PartsFormParent").modal();
        },
        partsZoom: function (reset) {
            PartsClass.zoom((reset) ? null : this.state.now);
        },
        updateList: function (id) {
            this.setState({now : id, selected : true});
        },
        render: function () {
            var listGroup   = "list-group-item";
            var partsOnly   = (this.state.selected) ? listGroup : "hide";
            var zoomMode    = (PartsClass.base) ? listGroup : "hide";
            return (
                <div className="col-xs-3 col-md-3 col-sm-3">
                    <div className="panel panel-default">
                        <div className="panel-heading">Actions</div>
                        <ul id="ActionList" className="list-group">
                            <button type="button" className={listGroup} onClick={this.pageSelect}>Page Select<span className={selectIcon}></span></button>
                            <button type="button" className={listGroup} onClick={this.partsAdd.bind(this, false)}>New Parts<span className={addIcon}></span></button>
                            <button type="button" className={partsOnly} onClick={this.partsEdit}>Edit Parts<span className={editIcon}></span></button>
                            <button type="button" className={partsOnly} onClick={this.partsCopy}>Copy Parts<span className={copyIcon}></span></button>
                            <button type="button" className={partsOnly} onClick={this.partsRemove}>Remove Parts<span className={removeIcon}></span></button>
                            <button type="button" className={partsOnly} onClick={this.partsAdd.bind(this, true)}>Add Child<span className={addIcon}></span></button>
                            <button type="button" className={partsOnly} onClick={this.partsZoom.bind(this, false)}>Zoom In<span className={zoomInIcon}></span></button>
                            <button type="button" className={zoomMode}  onClick={this.partsZoom.bind(this, true)}>Zoom Out<span className={zoomOutIcon}></span></button>
                        </ul>
                    </div>
                    <div className="panel panel-default">
                        <div className="panel-heading">Parts List</div>
                        <ul id="PartsList" className="list-group">
                            {this.props.ids.map(function (id) {
                                var className   = "";
                                var parts       = PartsClass.findById(id);
                                var error       = PartsClass.getError(id);
                                var childNum    = parts.Child.length;
                                var showList    = true;
                                var showChild   = (parts.Child.length);
                                var hasError    = (error && (error.Parts || error.Attr));

                                $("#Parts" + id).removeClass("parts-active");
                                if (this.state.now === id) {
                                    $("#Parts" + id).addClass("parts-active");
                                    className = "list-group-item active";
                                    showChild   = false;
                                } else if (this.state.now.match(RegExp("^" + id))) {
                                    className   = "list-group-item list-group-item-warning";
                                    showChild   = false;
                                } else if (this.state.now === parts.Parts.parent) {
                                    className   = "list-group-item list-group-item-info";
                                } else if (!parts.Parts.parent) {
                                    className   = "list-group-item";
                                } else {
                                    showList    = false;
                                }

                                if (hasError) {
                                    className   = "list-group-item list-group-item-danger";
                                    showList    = true;
                                }
                                return (
                                    <button type="button" className={className} style={{display : (showList) ? "block" : "none"}} onClick={this.updateList.bind(this, id)}>
                                        Title : {parts.Parts.title}
                                        <span className="badge" style={{display : (childNum && showChild) ? "block" : "none"}}>{childNum}</span>
                                        <span className={slideDownIcon} style={{display : (childNum && !showChild) ? "block" : "none"}}></span>
                                    </button>
                                );
                            }, this)}
                        </ul>
                    </div>
                </div>
            );
        }
    });

    var PartsContainer      = React.createClass({
        getInitialState: function () {
            return {ids: [], html: "", page: PartsClass.getPage};
        },
        partsUpdate: function () {
            this.setState({
                page    : PartsClass.getPage(),
                ids     : PartsClass.getIds(PartsClass.base),
                html    : PartsClass.getHtml(),
            });
        },
        render: function () {
            return (
                <div className="parts-container">
                    <PartsControl ids={this.state.ids} />
                    <div id="parts-contents" className="col-xs-9 col-md-9 col-sm-9">
                        <div className="panel panel-success">
                            <div className="panel-heading">Page : {this.state.page}</div>
                            <div className="panel-body" dangerouslySetInnerHTML={{__html: this.state.html}} />
                        </div>
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

        $("#PageFormParent").modal();

        $partsForm.submit(function (e) {
            e.preventDefault();
            PartsClass.setParts(getFormData(this));
            $("#PartsFormParent").modal("hide");
        });

        $pageForm.submit(function (e) {
            e.preventDefault();
            PartsClass.setPage(getFormData(this));
            $("#PageFormParent").modal("hide");
        });
    }

    function partsRefresh() {
        $("#PartsUpdate").trigger("click");
        markdown();
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

    function parseObject(obj, depth, _path) {
        var ret = {};
        if (typeof depth !== "number") depth = -1;
        if (depth !== 0) depth--;
        if (!_path) {
            _path    = "";
        } else {
            _path   += "."
        } 
        jQuery.each(obj, function (key, val) {
            if (typeof val === "object" && val && depth !== 0) {
                $.extend(ret, parseObject(val, depth,  _path + key));
            } else {
                ret[_path + key] = val;
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

    function putFormData($form, data, error) {
        var errorText   = (error) ? parseObject(error, 2) : {};
        $form[0].reset();
        jQuery.each(parseObject(data), function (key, val) {
            var input = $form.find("[name='" + key + "']");
            if (!input.length) return true;
            if ($(input).prop("type") === "checkbox") {
                $(input).prop("checked", val);
            } else {
                $(input).val(val).change();
            }
            $(input).parent().parent().removeClass("has-error");
            if (errorText[key]) $(input).parent().parent().addClass("has-error");
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
