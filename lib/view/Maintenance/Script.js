<script type="text/jsx">
$(function () {
    var now                 = null;
    var base                = null;
    var page                = {};
    var parts               = new Parts();
    var gallery             = [];
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
    var folderOpenIcon      = "pull-right glyphicon glyphicon-folder-open";
    var folderCloseIcon     = "pull-right glyphicon glyphicon-folder-close";
    var copyIcon            = "pull-right glyphicon glyphicon-duplicate";
    var removeIcon          = "pull-right glyphicon glyphicon-trash";
    var addIcon             = "pull-right glyphicon glyphicon-plus";
    var slideUpIcon         = "pull-right glyphicon glyphicon-chevron-up";
    var slideDownIcon       = "pull-right glyphicon glyphicon-chevron-down";
    var zoomInIcon          = "pull-right glyphicon glyphicon-zoom-in";
    var zoomOutIcon         = "pull-right glyphicon glyphicon-zoom-out";
    var $pageForm           = $("#PageForm");
    var $partsForm          = $("#PartsForm");
    var $saveForm           = $("#SaveForm");
    var $partsDialog        = $("#PartsDialog");
    var $partsAttrDialog    = $("#PartsAttrDialog");

     function Parts () {
        this.root       = this;
        this.id         = null;
        this.html       = null;
        this.parent     = null;
        this.next       = null;
        this.prev       = null;
        this.children   = [];
        this.list       = [];
        this.data       = {};
        this.removed    = [];
        this.dirty      = false;
    }
    Parts.prototype.find = function (id) {
        for (var i = 0; i < this.list.length; i++) {
            if (id === this.list[i].id) return this.list[i];
        }
        return null;
    };
    Parts.prototype.get = function (base) {
        var parts   = this.find(base);
        if (!parts) parts = this.root;

        var data    = parts.data;
        data.Child  = [];

        for (var i = 0; i < parts.children.length; i++) {
            data.Child.push(this.get(parts.children[i].id));
        }
        if (!data.Child.length) delete data.Child;

        return data;
    };
    Parts.prototype.zoom = function (id) {
        base    = id;
        this.updateHtml();
    };
    Parts.prototype.chkError = function () {
        var errors  = parseObject(this.error);
        for (var id in errors) {
            if (errors[id]) return true;
        }
        return false;
    };
    Parts.prototype.getIds = function (base, ret) {
        var parts   = this.find(base);
        if (!parts) parts   = this.root;
        if (!ret)   ret     = [];

        if (parts.id) ret.push(parts.id);
        for (var i = 0; i < parts.children.length; i++) {
            this.getIds(parts.children[i].id, ret);
        }
        return ret;
    };
    Parts.prototype.addChild = function (parts) {
        var parent      = this.find(parts.parent);
        if (!parent) parent = this.root;

        parent.children.push(parts);
        var child       = parent.children[0];
        while (child.next) {
            if (parts.data.Parts.row >= child.data.Parts.row && parts.data.Parts.offset >= child.data.Parts.offset) break;
        }
        if (parts.id != child.id) {
            parts.prev      = child;
            parts.next      = child.next;
            child.next      = parts;
            child.next.prev = parts;
        }

    };
    Parts.prototype.create = function (data) {
        var parts       = new Parts();
        parts.root      = this.root;
        parts.id        = Math.random().toString().replace(".", "");
        parts.parent    = data.Parts.parent;
        parts.data      = data;
        parts.list      = this.root.list;
        parts.list.push(parts);
        if (!data.Parts.id) data.Parts.id = "Parts__" + parts.id;

        if (data.Child) {
            for (var i = 0; i < data.Child.length; i++) {
                this.create(data.Child[i]);
            }
            delete data.Child;
        }
        this.addChild(parts);
        return parts;
    };
    Parts.prototype.push = function (id, data) {
        var parts   = this.find(id);

        if (!parts) parts = this.create(data);
        if (parts.parent !== data.Parts.parent) {
            var parent  = this.find(data.Parts.parent)
            if (!parent) parent = this.root;

            for (var i = 0; i < parent.children.length; i++) {
                if (parts.id !== parent.children[i].id) continue;
                parent.children[i].prev.next    = parent.children[i].next;
                parent.children[i].next.prev    = parent.children[i].prev;
                parent.children.splice(i, 1);
                break;
            }
            this.addChild(parts);
        }
    };
    Parts.prototype.remove = function (parts) {
        var parent  = this.find(parts.parent);
        if (!parent) parent = this.root;

        if (parts && parts._originalId) this.removed.push(parts._originalId);
        for (var i = 0; i < parts.children.length; i++) {
            this.remove(parts.children[i], true);
        }

        for (var i = 0; i < parent.children.length; i++) {
            if (parent.children[i].id !== parts.id) continue;
            parent.children.splice(i, 1);
            break;
        }
        for (var i = 0; i < this.list.length; i++) {
            if (this.list[i] !== parts.id) continue;
            this.list.splice(i, 1);
            break;
        }
    };
    Parts.prototype.updateHtml = function () {
        var parentInput = $partsForm.find("[name='Parts.parent']");
        var ids         = this.getIds(base);
        var data        = this.get(base);

        $(parentInput).find("option").remove();
        $(parentInput).append($("<option>").val("").text("None"));
        for (var i = 0; i < this.list.length; i++) {
            var current = this.find(this.list[i]);

            if (!(current && current.children.length && current.id)) continue;
            $(parentInput).append($("<option>").val(current.id).text(current.data.Parts.title));
        }

        if (!data.Parts) data = data.Child;
        exeAjax($partsForm, {Parts: {id: "", type: "Block"}, Child: data}, function (res) {
            parts.html  = res.html;
            parts.error = res.error;
            partsRefresh();
            $(".parts-active").removeClass("parts-active");
            console.log(res);
        })
    };

    var PartsGallery        = React.createClass({
        render: function () {
            return (
                <div className="panel-body">
                    {gallery.map(function (id) {
                        return (
                            <div className="col-xs-4 col-md-4 col-sm-4">
                                <div className="panel panel-default">
                                    <div className="panel-heading">
                                    </div>
                                    <div className="panel-body">
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="btn btn-sm btn-info">Import</div>
                                </div>
                            </div>
                        );
                    }, this)}
                </div>
            );
        }
    });

    var PartsControl        = React.createClass({
        getInitialState: function () {
            return {now : "", parent: ""};
        },
        pageSelect: function () {
            modalOperation("PageForm", true);
        },
        partsEdit: function () {
            var current     = parts.find(this.state.now);
            var error       = parts.error[this.state.now];

            if (current !== false) {
                now = this.state.now;
                putFormData($partsForm, current.data, error);
                modalOperation("PartsForm", true);
            }
        },
        partsCopy: function () {
            var current     = parts.find(this.state.now);

            if (current !== false) {
                var data     = copyObject(current.data, ["id", "_originalId"]);
                data.Parts.title += " - Copy";
                parts.push(null, data);
                partsRefresh();
            }
        },
        partsRemove: function () {
            var current     = parts.find(this.state.now);

            if (current !== false) {
                parts.remove(current);
                partsRefresh();
            }
        },
        partsAdd: function () {
            now = null;
            putFormData($partsForm, {});
            modalOperation("PartsForm", true);
        },
        partsZoom: function (reset) {
            parts.zoom((reset) ? null : this.state.now);
        },
        updateList: function (id) {
            var current     = parts.find(id);
            var parent      = (current) ? current.parent : "";
            this.setState({now : id, parent: parent});
        },
        render: function () {
            var current     = parts.find(this.state.now);
            var listGroup   = "list-group-item";
            var partsOnly   = (current) ? listGroup : "hide";
            var hasChild    = (current && current.children.length) ? listGroup : "hide";
            var zoomMode    = (base) ? listGroup : "hide";
            return (
                <div className="col-xs-3 col-md-3 col-sm-3">
                    <div className="panel panel-default">
                        <div className="panel-heading">Actions</div>
                        <ul id="ActionList" className="list-group">
                            <button type="button" className={listGroup} onClick={this.pageSelect}>Page Select<span className={selectIcon}></span></button>
                            <button type="button" className={listGroup} onClick={this.partsAdd}>New Parts<span className={addIcon}></span></button>
                            <button type="button" className={listGroup} onClick={this.props.switchGallery}>Parts Gallery<span className={folderCloseIcon}></span></button>
                            <button type="button" className={partsOnly} onClick={this.partsEdit}>Edit Parts<span className={editIcon}></span></button>
                            <button type="button" className={partsOnly} onClick={this.partsCopy}>Copy Parts<span className={copyIcon}></span></button>
                            <button type="button" className={partsOnly} onClick={this.partsRemove}>Remove Parts<span className={removeIcon}></span></button>
                            <button type="button" className={partsOnly} onClick={this.partsZoom.bind(this, false)}>Zoom In<span className={zoomInIcon}></span></button>
                            <button type="button" className={zoomMode}  onClick={this.partsZoom.bind(this, true)}>Zoom Out<span className={zoomOutIcon}></span></button>
                        </ul>
                    </div>
                    <div className="panel panel-default">
                        <div className="panel-heading">Parts List</div>
                        <ul id="PartsList" className="list-group">
                            {this.props.ids.map(function (id) {
                                var className   = "";
                                var current     = parts.find(id);
                                var parent      = (current) ? current.parent : "";
                                var error       = parts.error[id];
                                var childNum    = current.children.length;
                                var showList    = true;
                                var showChild   = (current.children.length);
                                var hasError    = (error && (error.Parts || error.Attr));

                                $("#Parts" + id).removeClass("parts-active");
                                if (this.state.now === id) {
                                    $("#Parts" + id).addClass("parts-active");
                                    className = "list-group-item active";
                                    showChild   = false;
                                } else if (this.state.now.match(RegExp("^" + id))) {
                                    className   = "list-group-item list-group-item-warning";
                                    showChild   = false;
                                } else if (this.state.parent === parent) {
                                    className   = "list-group-item list-group-item-success";
                                    showChild   = false;
                                } else if (this.state.now === parent) {
                                    className   = "list-group-item list-group-item-info";
                                } else if (!parent) {
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
                                        Title : {current.data.Parts.title}
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
            return {ids: [], html: parts.html, page: page, isOk: false, gallery: false};
        },
        pageSave:   function () {
            putFormData($saveForm, {Page: page});
            if (this.state.isOk) modalOperation("SaveForm", true);
        },
        partsUpdate: function () {
            this.setState({
                page    : page,
                ids     : parts.getIds(base),
                html    : parts.html,
                isOk    : !parts.chkError(),
            });
        },
        switchGallery: function () {
            this.setState({gallery: !this.state.gallery})
        },
        render: function () {
            return (
                <div className="parts-container">
                    <PartsControl ids={this.state.ids} switchGallery={this.switchGallery}/>
                    <div id="parts-contents" className="col-xs-9 col-md-9 col-sm-9" style={{display: (this.state.gallery) ? "none" : "block"}}>
                        <div className="panel panel-success">
                            <div className="panel-heading">{(this.state.page) ? this.state.page.title : "New Page"}</div>
                            <div id="parts-body" className="panel-body" dangerouslySetInnerHTML={{__html: this.state.html}} />
                        </div>
                        <div className="text-center">
                            <div className={"btn btn-primary" + ((this.state.isOk) ? "" : " disabled")} onClick={this.pageSave}>Save Page</div>
                        </div>
                    </div>
                    <button id="PartsUpdate" className="hide" onClick={this.partsUpdate}></button>
                    <div className="col-xs-9 col-md-9 col-sm-9" style={{display: (this.state.gallery) ? "block" : "none"}}>
                        <div className="panel panel-success">
                            <div className="panel-heading">Gallery</div>
                            <PartsGallery />
                        </div>
                    </div>
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
            var src         = (val) ? "#TextContentsInput" : "#TextContentsTextarea";
            var dst         = (val) ? "#TextContentsTextarea" : "#TextContentsInput";
            $(src).addClass("hide").find("input, textarea").prop("disabled", true);
            $(dst).removeClass("hide").find("input, textarea").prop("disabled", false);
        })
        $("#TextContentsTextarea").addClass("hide").find("input, textarea").prop("disabled", true);

        modalOperation("PartsForm", true);

        $partsForm.submit(function (e) {
            e.preventDefault();
            parts.push(now, getFormData(this));
            parts.updateHtml();
            modalOperation("PartsForm", false);
        });

        $pageForm.submit(function (e) {
            e.preventDefault();
            PartsClass.setPage(getFormData(this));
            modalOperation("PageForm", false);
        });

        $saveForm.submit(function (e) {
            e.preventDefault();
            PartsClass.savePage(getFormData(this));
            modalOperation("SaveForm", false);
        });
    }

    function exeAjax ($form, data, afterJson) {
        var type    = $form.attr("method");
        var url     = $form.attr("action");

        $.ajax({type: type, url: url, data: JSON.stringify(data), contentType: "application/JSON", dataType: "JSON"})
        .done(function(res) {
            afterJson(res);
        });
    };

    function modalOperation(target, open) {
        var modalTitles = {
            "PartsForm"     : "Parts Setting",
            "PageForm"      : "Select Page",
            "SaveForm"      : "Save Page",
        };
        $("#ModalTitle h4").text(modalTitles[target]);
        $("#ModalBody").children().addClass("hide");
        $("#" + target).removeClass("hide");
        $("#Modal").modal((open) ? "show" : "hide");
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
                $(this).prop("disabled", true);
            });
        })

        $(target).removeClass("hide");
        $(target).find(inputTagList).each(function () {
            $(this).prop("disabled", false);
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
            if ($(this).prop("type") === "checkbox") value = $(this).prop("checked") ? 1 : 0;

            ret = strToObj(name, value, ret);
        });
        return ret;
    }

    function putFormData($form, data, error) {
        var errorText   = (error) ? parseObject(error, 2) : {};
        $form[0].reset();
        showAttrDialog($("#PartsTypeChoice").val());
        jQuery.each(parseObject(data), function (key, val) {
            var input = $form.find("[name='" + key + "']");
            if (!input.length) return true;
            if ($(input).prop("type") === "checkbox") {
                $(input).prop("checked", val).change();
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
