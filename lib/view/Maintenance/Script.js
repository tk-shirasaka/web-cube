<script type="text/jsx">
$(function () {
    var viewType    = {init: 1, page: 2, parts: 3, gallery: 4, pageForm: 5, partsForm: 6, partsAttrForm: 7};
    var actionType  = {add: 1, edit: 2, copy: 3, remove: 4};
    var formType    = {input: 1, number: 2, checkbox: 3, raddio: 4, select: 5, textarea: 6, hidden: 7};
    var columnList  = (function () { var ret = []; for (var i = 0; i <= 12; i++) { ret.push({value: i, name: i}); }; return ret; });
    var size        = {
        _base       : ["col-xs-", "col-md-", "col-sm"],
        get         : function (size) { return this._base.map(function (base) { return base + size; }).join(" "); }
    }
    var icons       = {
        _base       : "pull-left glyphicon glyphicon-",
        open        : "folder-open",
        close       : "folder-close",
        select      : "th-list",
        add         : "plus",
        copy        : "duplicate",
        edit        : "pencil",
        save        : "save",
        remove      : "trash",
        slideUp     : "menu-up",
        slideDown   : "menu-down",
        slideLeft   : "menu-left",
        slideRight  : "menu-right",
        zoomIn      : "zoom-in",
        zoomOut     : "zoom-out",
        get         : function (name) { return (this[name]) ? this._base + this[name] : ""; }
    };

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

    var ListChild = React.createClass({
        _select: function () {
            this.props.select(this.props.data);
        },
        render: function () {
            return <a href="#" onClick={this._select}><span>{this.props.title}</span></a>;
        }
    });

    var Form = React.createClass({
        render: function () {
            var child = this.props.forms.map(function (form, index) {
                var formTag     = "";
                var labelTag    = (form.label) ? <label for={index}>{form.label}</label> : "";
                switch (form.type) {
                case formType.text :
                    formTag = <input id={index} className="form-control" name={form.name} value={form.value} onChange={this.props.change}></input>;
                    break;
                case formType.number :
                    formTag = <input id={index} className="form-control" name={form.name} type="number" value={form.value} onChange={this.props.change}></input>;
                    break;
                case formType.select :
                    formTag = <select id={index} className="form-control" name={form.name} value={form.value} onChange={this.props.change}>{form.options.map(function (option) { return <option value={option.value}>{option.name}</option>})}</select>;
                    break;
                case formType.textarea :
                    break;
                case formType.hidden :
                    formTag = <input id={index} name={form.name} type="hidden" value={form.value}></input>;
                    break;
                }
                return <div className="form-group">{labelTag}{formTag}</div>;
            }, this);

            return <form className="animated slideInRight">{child}</form>;
        }
    });

    var Action = React.createClass({
        render: function () {
            var actionList  = [];

            switch (this.props.view) {
            case viewType.page :
                break;
            case viewType.parts :
                actionList.push({id: actionType.edit, name: "edit"});
                actionList.push({id: actionType.copy, name: "copy"});
                actionList.push({id: actionType.remove, name: "remove"});
                break;
            case viewType.gallery :
                break;
            }
            var child = actionList.map(function (child) {
                return <li key={child.id}><span className={icons.get(child.name)}></span><ListChild data={child.id} title={child.name} select={this.props.action} /></li>;
            }, this);
            return <ul className="animated slideInRight">{child}</ul>;
        }
    });

    var Page = React.createClass({
        render: function () {
            var child = this.props.data.map(function (child) {
                return <li key={child.id}><ListChild data={child.id} title={child.title} select={this.props.select} /></li>;
            }, this);
            return <ul className="animated slideInRight">{child}</ul>;
        }
    });

    var Parts = React.createClass({
        getInitialState: function () {
            return {open: []};
        },
        toggleChild: function (id) {
            var index   = this.state.open.indexOf(id);
            $(".parts-active").removeClass("parts-active");
            $("#" + id).addClass("parts-active");
            if (index < 0) {
                this.state.open.push(id);
            } else {
                this.state.open.splice(index, 1);
            }
            this.setState({open: this.state.open});
        },
        render: function () {
            var child   = this.props.data.map(function (child) {
                var id          = child.Parts.id;
                var title       = child.Parts.title || "[No title]";
                var children    = (child.Child && this.state.open.indexOf(id) >= 0 ) ? <Parts data={child.Child} select={this.props.select} action={this.props.action}/> : "";
                var badge       = (child.Child) ? <span className="badge pull-left">{child.Child.length}</span> : "";
                var toggle      = (child.Child) ? <span className={icons.get((this.state.open.indexOf(id) >= 0) ? "slideDown" : "slideUp")} onClick={this.toggleChild.bind(this, id)}></span> : "";
                return <li key={id}>{toggle}{badge}<ListChild data={child} title={title} select={this.props.select} />{children}</li>;
            }, this);
            var add     = <li><ListChild data={actionType.add} title="add" select={this.props.action} /></li>

            return <ul className="animated slideInRight" style={{margin: "10px 0 10px"}}>{child}<span className={icons.get("add")}></span>{add}</ul>;
        }
    });

    var Navigation = React.createClass({
        render: function () {
            var child   = this.props.data.map(function (child, index) {
                return <li key={index} itemscope="itemscope" itemtype="http://data-vocabulary.org/Breadcrumb"><ListChild data={child.state} title={child.title} select={this.props.select}/></li>;
            }, this);

            return <ol className="breadcrumb">{child}</ol>;
        }
    });

    var Parent = React.createClass({
        getInitialState: function () {
            return {
                view        : viewType.init,
                snapshot    : null,
                dirty       : false,
                select      : null,
                preview     : null,
                page        : [],
                parts       : {Page: {}, Parts: []},
                partsType   : {types: [], form: []},
            };
        },
        componentDidMount: function () {
            this.listPartsType();
            this.listPage();
        },
        changeForm: function (e) {
            eval("this.state.select." + e.target.name + " = e.target.value");
            this.setState({dirty: true, select: this.state.select});
        },
        listPage: function () {
            this.exeAjax("GET", "/maintenance/ajax_page_list", null, {view: viewType.page});
        },
        listPartsType: function () {
            this.exeAjax("GET", "/maintenance/ajax_parts_type", null, {view: viewType.init});
        },
        selectAction: function (id) {
            var state = {snapshot: $.extend(true, {}, this.state)};
            switch (id) {
            case actionType.add :
                this.setState({select: null});
            case actionType.edit :
                this.editParts();
                break;
            case actionType.copy :
                state.dirty     = true;
                state.select    = null;
                state.parts     = this.copyParts();
                break;
            case actionType.remove :
                state.dirty     = true;
                state.select    = null;
                state.parts     = this.removeParts();
                break;
            }
            this.setState(state);
        },
        selectNavigation: function (state) {
            if (this.state.snapshot) state = $.extend(true, this.state.snapshot, state);
            state.snapshot  = null;
            this.setState(state);
        },
        selectPage: function (id) {
            this.exeAjax("POST", "/maintenance/ajax_page_render", {page: id}, {view: viewType.parts, dirty: true});
        },
        selectParts: function (parts) {
            if (this.state.select && this.state.select.Parts.id === parts.Parts.id) parts = null;
            $(".parts-active").removeClass("parts-active");
            if (parts) $("#" + parts.Parts.id).addClass("parts-active");
            this.setState({select: parts});
        },
        editParts: function () {
            if (!this.state.select) this.state.select = {Parts: {id: Math.random().toString().replace(".", "")}};
            this.setState({view: viewType.partsForm, select: this.state.select});
        },
        editPartsAttr: function () {
            if (!this.state.select.Attr) this.state.select.Attr = {};
            this.setState({view: viewType.partsAttrForm, select: this.state.select});
        },
        copyParts: function () {
            var parts           = copyObject(this.state.select, ["id"]);
            var parent          = this.findParts(this.state.select.Parts.id, this.state.parts.Parts);
            parts.Parts.title  += " - Copy";
            parent.data.push(parts);
            return this.state.parts;
        },
        removeParts: function () {
            var parts   = this.findParts(this.state.select.Parts.id, this.state.parts.Parts);
            parts.data.splice(parts.index, 1);
            return this.state.parts;
        },
        updateParts: function (parts) {
            this.exeAjax("POST", "/maintenance/ajax_parts_render", parts, {preview: true});
        },
        findParts: function (id, parts) {
            var ret = false;
            for (var i = 0; i < parts.length; i++) {
                if (ret) {
                    break;
                } else if (parts[i].Parts.id === id) {
                    ret = {data: parts, index: i};
                } else if (parts[i].Child) {
                    ret = this.findParts(id, parts[i].Child);
                }
            }
            return ret;
        },
        getNavi: function () {
            var naviList    = [];
            naviList.push({title: "Home", state: {view: viewType.page}});
            if (this.state.parts.Page.title) naviList.push({title: this.state.parts.Page.title, state: {view: viewType.parts, select: null}});
            if (this.state.select) naviList.push({title: this.state.select.Parts.title, state: {view: viewType.parts, select: this.state.select}});
            if (this.state.view === viewType.partsForm || this.state.view === viewType.partsAttrForm) naviList.push({title: "Parts Edit", state: {view: viewType.partsForm}});
            return naviList;
        },
        exeAjax: function (type, url, data, options) {
            var params = {
                type        : type,
                url         : url,
                contentType : "application/json",
                dataType    : "json",
                success     : function (ret) {
                    if (!options)                   options         = {};
                    if (!options.view !== false)    options.view    = this.state.view;
                    switch (options.view) {
                    case viewType.init :
                        options.partsType   = ret;
                        break;
                    case viewType.page :
                        options.page        = ret;
                        break;
                    case viewType.parts :
                        if (options.preview) {
                            options.preview = ret;
                            options.dirty   = false;
                        } else if (options.dirty) {
                            options.parts   = ret;
                        }
                        break;
                    case viewType.gallery :
                        break;
                   }
                    this.setState(options);
                }.bind(this),
            };
            if (data) params.data = JSON.stringify(data);
            $.ajax(params);
        },
        render: function () {
            var listView    = [];
            var formList    = [];
            var preview     = (this.state.preview) ? this.state.preview.html : "";

            listView.push(<Navigation data={this.getNavi()} select={this.selectNavigation} />);
            switch (this.state.view) {
            case viewType.page :
                listView.push(<div><h4>Page List</h4><Page data={this.state.page} select={this.selectPage} /></div>);
                break;
            case viewType.parts :
                if (this.state.dirty) this.updateParts({Parts: {type: "Block"}, Child: this.state.parts.Parts});
                if (this.state.select) {
                    listView.push(<div><h4>Action List</h4><Action view={this.state.view} select={this.state.select} action={this.selectAction} /></div>);
                } else {
                    listView.push(<div><h4>Parts List</h4><Parts data={this.state.parts.Parts} select={this.selectParts} action={this.selectAction} /></div>);
                }
                break;
            case viewType.gallery :
                break;
            case viewType.pageForm :
                break;
            case viewType.partsForm :
                formList.push({type: formType.hidden, name: "Parts.id", label: null, value: this.state.select.Parts.id});
                formList.push({type: formType.text, name: "Parts.title", label: "Title", value: this.state.select.Parts.title});
                formList.push({type: formType.text, name: "Parts.class", label: "Class", value: this.state.select.Parts.class});
                formList.push({type: formType.number, name: "Parts.row", label: "Row", value: this.state.select.Parts.row});
                formList.push({type: formType.select, name: "Parts.col", label: "Col", options: columnList(), value: this.state.select.Parts.col});
                formList.push({type: formType.select, name: "Parts.offset", label: "Offset", options: columnList(), value: this.state.select.Parts.offset});
                formList.push({type: formType.select, name: "Parts.type", label: "Type", options: this.state.partsType.types, value: this.state.select.Parts.type});

                listView.push(<div><h4>Parts Form</h4><Form forms={formList} change={this.changeForm} /><div className="pager"><li className="next" onClick={this.editPartsAttr}><a href="#">Next</a></li></div></div>);
                break;
            case viewType.partsAttrForm :
                var type = (this.state.select.Parts.type) ? this.state.select.Parts.type : this.state.partsType.types[0].value;
                this.state.partsType.forms[type].map(function (form) {
                    form.type   = formType[form.type];
                    form.value  = this.state.select.Attr[form.name];
                    form.name   = "Attr." + form.name;
                    formList.push(form)
                }, this)

                listView.push(<div><h4>Parts Form</h4><Form forms={formList} change={this.changeForm} /><div className="pager"><li className="previous" onClick={this.editParts}><a href="#">Prev</a></li><button className="btn btn-primary pull-right" onClick={this.editParts}>Save</button></div></div>);
                break;
            }
            return (
                <div>
                    <div className={size.get(3)} style={{overflow: "scroll", "white-space": "nowrap"}}>{listView}</div>
                    <div className={size.get(9)}>
                        <div className="panel panel-default">
                            <div className="panel-heading"><h4>{this.state.parts.Page.title}</h4></div>
                            <div className="panel-body" dangerouslySetInnerHTML={{__html: preview}}></div>
                        </div>
                    </div>
                </div>
            )
        }
    });

    React.render(
        <Parent />,
        document.getElementById("Main")
    );
/*
    var PARTS               = 0;
    var GALLERY             = 1;
    var now                 = null;
    var base                = null;
    var parts               = new Parts();
    var inputTagList        = "input, select, textarea";
    var $pageForm           = $("#PageForm");
    var $partsForm          = $("#PartsForm");
    var $saveForm           = $("#SaveForm");
    var $partsDialog        = $("#PartsDialog");
    var $partsAttrDialog    = $("#PartsAttrDialog");
    var attrDialogList      = {
            Form            : "#FormPartsDialog",
            Block           : "#BlockPartsDialog",
            Text            : "#TextPartsDialog",
            Choice          : "#ChoicePartsDialog",
            Input           : "#InputPartsDialog",
            Header          : "#HeaderPartsDialog",
            Link            : "#LinkPartsDialog"
    };
    var icons               = {
            _base           : "pull-right glyphicon glyphicon-",
            open            : "folder-open",
            close           : "folder-close",
            select          : "th-list",
            add             : "plus",
            copy            : "duplicate",
            edit            : "pencil",
            save            : "save",
            remove          : "trash",
            slideUp         : "chevron-up",
            slideDown       : "chevron-down",
            zoomIn          : "zoom-in",
            zoomOut         : "zoom-out",
            get             : function (name) { return (this[name]) ? this._base + this[name] : ""; }
    };
    var sizes               = {
            _base           : ["col-xs-", "col-md-", "col-sm"],
            get             : function (size) { return (0 < size && size <= 12) ? this._base.map(function(base) { return base + size; }).join(" ") : ""; }
    }

    function Parts () {
        this.root       = this;
        this.id         = null;
        this.parent     = null;
        this.next       = null;
        this.prev       = null;
        this.firstChild = null;
        this.children   = [];
        this.data       = {};
        this.dirty      = false;
        this.saved      = false;
    }
    Parts.prototype.gallery = {};
    Parts.prototype.error = {};
    Parts.prototype.page = {};
    Parts.prototype.list = [];
    Parts.prototype.removed = [];
    Parts.prototype.loading = false;
    Parts.prototype.html = null;
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
        data.dirty  = parts.dirty;

        for (var child = parts.firstChild; child; child = child.next) {
            data.Child.push(this.get(child.id));
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

        if (parts.id) ret.push(base);
        for (var child = parts.firstChild; child; child = child.next) {
            this.getIds(child.id, ret);
        }
        return ret;
    };
    Parts.prototype.dataInit = function (parts, data) {
        var removed     = parts.removed.indexOf(data.Parts.id);
        parts.root      = this.root;
        parts.parent    = (data.Parts.parent) ? data.Parts.parent : "";
        parts.data      = data;
        parts.list.push(parts);
        if (!parts.id)      parts.id        = Math.random().toString().replace(".", "");
        if (!data.Parts.id) data.Parts.id   = "Parts_" + parts.id;
        if (parts.saved && removed >= 0) parts.removed.splice(removed, 1);
    };
    Parts.prototype.addChild = function (parts) {
        var parent      = this.find(parts.parent);
        if (!parent) parent = this.root;

        parent.children.push(parts);
        for (var prev = (parent.firstChild) ? parent.firstChild : parts; prev.next; prev = prev.next) {
            if (parts.data.Parts.row >= prev.data.Parts.row && parts.data.Parts.offset >= prev.data.Parts.offset) break;
        }
        if (parts.id !== prev.id) {
            parts.prev          = prev;
            parts.next          = prev.next;
            prev.next           = parts;
            if (parts.next) parts.next.prev = parts;
        }
        if (!prev.prev) parent.firstChild  = prev;
    };
    Parts.prototype.create = function (data) {
        var parts       = new Parts();
        this.dataInit(parts, data);
        return parts;
    };
    Parts.prototype.push = function (id, data, isChild) {
        var parts   = this.find(id);

        if (!parts) parts = this.create(data);
        this.remove(parts, true);
        this.dataInit(parts, data);
        this.addChild(parts);

        if (data.Child) {
            for (var i = 0; i < data.Child.length; i++) {
                data.Child[i].Parts.parent = parts.id;
                this.push(null, data.Child[i], true);
            }
            delete data.Child;
        }
        now = parts.id;
        if (this.loading) {
            parts.saved = true;
        } else {
            parts.dirty = true;
        }
        if (!isChild) this.updateHtml();
    };
    Parts.prototype.remove = function (parts, isSingle) {
        var parent  = this.find(parts.parent);
        if (!parent) parent = this.root;

        if (parts && parts.saved) this.removed.push(parts.data.Parts.id);
        for (var child = parts.firstChild; !isSingle && child; child = next) {
            var next = child.next;
            this.remove(child);
        }

        for (var i = 0; i < parent.children.length; i++) {
            if (parent.children[i].id !== parts.id) continue;
            if (parent.children[i].prev)            parent.children[i].prev.next    = parent.children[i].next;
            if (parent.children[i].next)            parent.children[i].next.prev    = parent.children[i].prev;
            if (!parent.children[i].prev)           parent.firstChild               = parent.children[i].next;
            parent.children.splice(i, 1);
            break;
        }
        for (var i = 0; i < this.list.length; i++) {
            if (this.list[i].id !== parts.id) continue;
            this.list.splice(i, 1);
            break;
        }
        parts.next = parts.prev = null;
    };
    Parts.prototype.updateHtml = function () {
        var parentInput = $partsForm.find("[name='Parts.parent']");
        var ids         = this.getIds(base);
        var data        = this.get(base);

        $(parentInput).find("option").remove();
        $(parentInput).append($("<option>").val("").text("None"));
        for (var i = 0; i < this.list.length; i++) {
            var current = this.find(this.list[i].id);

            if (!(current && "child" in current.data.Attr && current.id)) continue;
            $(parentInput).append($("<option>").val(current.id).text(current.data.Parts.title));
        }

        if (!data.Parts) data.Parts = {id: "", type: "Block"};
        postForm($partsForm, data, function (res) {
            parts.html  = res.html;
            parts.error = res.error;
            partsRefresh();
            $(".parts-active").removeClass("parts-active");
        })
    };
    Parts.prototype.setGallery = function () {
        exeAjax("GET", "/maintenance/ajax_parts_gallery", null, function (res) {
            parts.gallery = res;
            partsRefresh();
        });
    };
    Parts.prototype.setPage = function (data) {
        postForm($pageForm, data, function (res) {
            parts           = new Parts();
            parts.page      = res.Page;
            parts.loading   = true;
            for (var i = 0; i < res.Parts.length; i++) {
                parts.push(null, res.Parts[i]);
            }
            parts.loading   = false;
            parts.updateHtml();
        })
    };
    Parts.prototype.savePage = function (data) {
        data.Parts      = this.get().Child;
        data.Removed    = this.removed;
        postForm($saveForm, data, function (res) {
        })
    };

    var PartsGallery        = React.createClass({
        getInitialState: function () {
            return {now : null};
        },
        setNow: function(index) {
            this.setState({now: index});
        },
        partsImport: function (data) {
            parts.push(null, copyObject(data, ["id", "parent", "html"]));
        },
        render: function () {
            return (
                <div className="panel panel-success">
                    <div className="panel-heading">{this.props.title}</div>
                    <div className="panel-body">
                        {(this.props.gallery && this.props.gallery.length) ? this.props.gallery.map(function (parts, index) {
                            var className = ((this.state.now === index) ? "parts-active " : "") + "panel panel-default";
                            return (
                                <div className={((index % 3) === 2) ? "clearfix" : ""}>
                                    <div className={sizes.get(4)} onClick={this.setNow.bind(this, index)}>
                                        <div className={className}>
                                            <div className="panel-heading">{parts.Parts.title}</div>
                                            <div className="panel-body" dangerouslySetInnerHTML={{__html: parts.html}} />
                                        </div>
                                        <div className="text-center">
                                            <div className="btn btn-sm btn-info" onClick={this.partsImport.bind(this, parts)}>Import</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }, this) : (<div>No Gallery</div>)}
                    </div>
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
            var error       = parts.error[current.data.Parts.id];

            if (current !== false) {
                now = this.state.now;
                putFormData($partsForm, current.data, error);
                modalOperation("PartsForm", true);
            }
        },
        partsCopy: function () {
            var current     = parts.find(this.state.now);

            if (current !== false) {
                var data     = copyObject(parts.get(this.state.now), ["id"]);
                data.Parts.title += " - Copy";
                parts.push(null, data);
            }
        },
        partsRemove: function () {
            var current     = parts.find(this.state.now);

            if (current !== false) {
                parts.remove(current);
                parts.updateHtml();
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
            if (id === this.state.now) id = "";
            var current     = parts.find(id);
            var parent      = (current) ? current.parent : "";
            this.setState({now : id, parent: parent});
        },
        pageSave: function () {
            putFormData($saveForm, {Page: parts.page});
            modalOperation("SaveForm", true);
        },
        render: function () {
            var current     = parts.find(this.state.now);
            return (
                <div className={sizes.get(3)}>
                    <div className="panel panel-default" style={showOrHide(this.props.mode === PARTS)}>
                        <div className="panel-heading">Page</div>
                        <ul className="list-group">
                            <button type="button" className="list-group-item" onClick={this.pageSelect}>Select<span className={icons.get("select")}></span></button>
                            <button type="button" className="list-group-item" style={showOrHide(!parts.chkError())} onClick={this.pageSave}>Save<span className={icons.get("save")}></span></button>
                        </ul>
                    </div>
                    <div className="panel panel-default" style={showOrHide(this.props.mode === PARTS)}>
                        <div className="panel-heading">Parts</div>
                        <ul className="list-group">
                            <button type="button" className="list-group-item" onClick={this.partsAdd}>Add<span className={icons.get("add")}></span></button>
                            <button type="button" className="list-group-item" style={showOrHide(current)} onClick={this.partsEdit}>Edit<span className={icons.get("edit")}></span></button>
                            <button type="button" className="list-group-item" style={showOrHide(current)} onClick={this.partsCopy}>Copy<span className={icons.get("copy")}></span></button>
                            <button type="button" className="list-group-item" style={showOrHide(current)} onClick={this.partsRemove}>Remove<span className={icons.get("remove")}></span></button>
                        </ul>
                    </div>
                    <div className="panel panel-default">
                        <div className="panel-heading">Gallery</div>
                        <ul className="list-group">
                            <button type="button" className="list-group-item" style={showOrHide(this.props.mode === PARTS)} onClick={this.props.switchMode}>Open<span className={icons.get("close")}></span></button>
                            <button type="button" className="list-group-item" style={showOrHide(this.props.mode === GALLERY)} onClick={this.props.switchMode}>Close<span className={icons.get("open")}></span></button>
                        </ul>
                    </div>
                    <div className="panel panel-default" style={showOrHide(this.props.mode === PARTS)}>
                        <div className="panel-heading">Other</div>
                        <ul className="list-group">
                            <button type="button" className="list-group-item" style={showOrHide(current)} onClick={this.partsZoom.bind(this, false)}>Forcus<span className={icons.get("zoomIn")}></span></button>
                            <button type="button" className="list-group-item" style={showOrHide(base)} onClick={this.partsZoom.bind(this, true)}>View Page<span className={icons.get("zoomOut")}></span></button>
                        </ul>
                    </div>
                    <div className="panel panel-default" style={showOrHide(this.props.mode === PARTS)}>
                        <div className="panel-heading">Parts List</div>
                        <ul id="PartsList" className="list-group">
                            {this.props.ids.map(function (id) {
                                var className   = "";
                                var current     = parts.find(id);
                                var error       = parts.error[current.data.Parts.id];
                                var childNum    = current.children.length;
                                var showList    = true;
                                var showChild   = (current.children.length);
                                var hasError    = (error && (error.Parts || error.Attr));

                                for (var parent = parts.find(this.state.parent), parents = []; parent; parents.push(parent.id), parent = parts.find(parent.parent))
                                $("#" + current.data.Parts.id).removeClass("parts-active");
                                if (this.state.now === id) {
                                    $("#" + current.data.Parts.id).addClass("parts-active");
                                    className = "list-group-item active";
                                    showChild   = false;
                                } else if (parents.indexOf(id) >= 0) {
                                    className   = "list-group-item list-group-item-warning";
                                    showChild   = false;
                                } else if (this.state.parent === ((current) ? current.parent : "")) {
                                    className   = "list-group-item list-group-item-success";
                                } else if (this.state.now === ((current) ? current.parent : "")) {
                                    className   = "list-group-item list-group-item-info";
                                } else if (!current.parent) {
                                    className   = "list-group-item";
                                } else {
                                    showList    = false;
                                }

                                if (hasError) {
                                    className   = "list-group-item list-group-item-danger";
                                    showList    = true;
                                }
                                return (
                                    <button type="button" className={className} style={showOrHide(showList)} onClick={this.updateList.bind(this, id)}>
                                        Title : {current.data.Parts.title}
                                        <span className="badge" style={showOrHide(childNum && showChild)}>{childNum}</span>
                                        <span className={icons.get("slideDown")} style={showOrHide(childNum && !showChild)}></span>
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
            return {ids: [], html: parts.html, page: parts.page, gallery: parts.gallery, mode: PARTS};
        },
        partsUpdate: function () {
            this.setState({
                ids     : parts.getIds(base),
                html    : parts.html,
                page    : parts.page,
                gallery : parts.gallery,
                mode    : PARTS,
            });
        },
        switchMode: function () {
            this.setState({mode: (this.state.mode === PARTS) ? GALLERY : PARTS})
        },
        render: function () {
            return (
                <div className="parts-container">
                    <PartsControl ids={this.state.ids} mode={this.state.mode} switchMode={this.switchMode}/>
                    <div id="parts-contents" className={sizes.get(9)} style={showOrHide(this.state.mode === PARTS)}>
                        <div className="panel panel-success">
                            <div className="panel-heading">{(this.state.page) ? this.state.page.title : "New Page"}</div>
                            <div id="parts-body" className="panel-body" dangerouslySetInnerHTML={{__html: this.state.html}} />
                        </div>
                    </div>
                    <button id="PartsUpdate" className="hide" onClick={this.partsUpdate}></button>
                    <div className={sizes.get(9)} style={showOrHide(this.state.mode === GALLERY)}>
                        <PartsGallery title="Shared Parts" gallery={this.state.gallery.shared}/>
                        <PartsGallery title="My Gallery"   gallery={this.state.gallery.user}/>
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

        modalOperation("PageForm", true);

        $partsForm.submit(function (e) {
            e.preventDefault();
            parts.push(now, getFormData(this));
            modalOperation("PartsForm", false);
        });

        $pageForm.submit(function (e) {
            e.preventDefault();
            parts.setPage(getFormData(this));
            parts.setGallery();
            modalOperation("PageForm", false);
        });

        $saveForm.submit(function (e) {
            e.preventDefault();
            parts.savePage(getFormData(this));
            parts.setGallery();
            modalOperation("SaveForm", false);
        });
    }

    function postForm ($form, data, afterJson) {
        var type    = $form.attr("method");
        var url     = $form.attr("action");

        exeAjax(type, url, data, afterJson);
    }

    function exeAjax (type, url, data, afterJson) {
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

    function showOrHide(condition) {
        return {display : (condition) ? "block" : "none"};
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
*/
});
</script>
