<script type="text/jsx">
$(function () {
    var viewType    = {init: 1, page: 2, parts: 3, sample: 4, actions: 5, edit: 6, copy: 7, deepcopy: 8, remove: 9, saved: 10};
    var dataType    = {any: -1, error: 1, list: 2, form: 3, preview: 4, page: 5, parts: 6, sample: 7, path: 8};
    var formType    = {input: 1, number: 2, checkbox: 3, raddio: 4, select: 5, textarea: 6, hidden: 7};
    var uniqueKey   = {get: function (prefix) { return prefix + "-" + Math.random().toString().replace(".", "")}};
    var size        = {
        _base       : ["col-xs-", "col-md-", "col-sm"],
        get         : function (size) { return this._base.map(function (base) { return base + size; }).join(" "); }
    }
    var icons       = {
        _base       : "pull-left glyphicon glyphicon-",
        sample      : "folder-open",
        add         : "plus",
        edit        : "pencil",
        copy        : "copy",
        deepcopy    : "duplicate",
        remove      : "trash",
        slideUp     : "menu-up",
        slideDown   : "menu-down",
        get         : function (name) { return (this[name]) ? this._base + this[name] : ""; }
    };

    var ListChildClass = React.createClass({
        _select: function () {
            this.props.select(this.props.data);
        },
        render: function () {
            return <a onClick={this._select}><span>{this.props.title}</span></a>;
        }
    });

    var FormClass = React.createClass({
        render: function () {
            var child = this.props.forms.map(function (form, index) {
                var formClass   = "form-group";
                var formTag     = "";
                var labelTag    = (form.label) ? <label for={index}>{form.label}</label> : "";
                var errorTag    = [];
                var error       = null;
                switch (form.type) {
                case formType.text :
                    formTag     = <input id={index} className="form-control" name={form.name} value={form.value} placeholder={form.placeholder} onChange={this.props.change}></input>;
                    break;
                case formType.number :
                    formTag     = <input id={index} className="form-control" name={form.name} type="number" value={form.value} onChange={this.props.change}></input>;
                    break;
                case formType.checkbox :
                    formClass   = "checkbox";
                    formTag     = <label><input id={index} name={form.name} type="checkbox" value={form.value} onChange={this.props.change}></input>{form.label}</label>;
                    labelTag    = "";
                    break;
                case formType.select :
                    formTag     = <select id={index} className="form-control" name={form.name} value={form.value} onChange={this.props.change}>{form.options.map(function (option) { return <option value={option.value}>{option.name}</option>})}</select>;
                    break;
                case formType.textarea :
                    formTag     = <textarea id={index} className="form-control" name={form.name} value={form.value} placeholder={form.placeholder} onChange={this.props.change}></textarea>;
                    break;
                case formType.hidden :
                    formTag     = <input id={index} name={form.name} type="hidden" value={form.value}></input>;
                    labelTag    = "";
                    break;
                }
                if (this.props.error && (error = eval("this.props.error." + form.name))) {
                    formClass  += " has-error";
                    for (var i in error) {
                        errorTag.push(<span className="help-block">{error[i]}</span>);
                    }
                }
                return <div className={formClass}>{labelTag}{formTag}{errorTag}</div>;
            }, this);

            return <form className="animated slideInRight">{child}</form>;
        }
    });

    var ActionClass = React.createClass({
        render: function () {
            var child = this.props.select.map(function (child) {
                return <li key={child.id}><span className={icons.get(child.name)}></span><ListChildClass data={child.id} title={child.name} select={this.props.action} /></li>;
            }, this);
            return <ul className="animated slideInRight">{child}</ul>;
        }
    });

    var PageClass = React.createClass({
        render: function () {
            var child   = this.props.data.map(function (child) {
                return <li key={child.id}><ListChildClass data={{Page: {id: child.id}}} title={child.title} select={this.props.select} /></li>;
            }, this);
            var add     = <li><ListChildClass data={null} title="add" select={this.props.add} /></li>;

            return <ul className="animated slideInRight"><span className={icons.get("add")}></span>{add}{child}</ul>;
        }
    });

    var PartsClass = React.createClass({
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
                var children    = (child.Child && this.state.open.indexOf(id) >= 0 ) ? <PartsClass data={child.Child} select={this.props.select} add={this.props.add} parent={id} /> : "";
                var badge       = (child.Child) ? <span className="badge pull-left">{child.Child.length}</span> : "";
                var toggle      = (child.Child) ? <span className={icons.get((this.state.open.indexOf(id) >= 0) ? "slideDown" : "slideUp")} onClick={this.toggleChild.bind(this, id)}></span> : "";
                return <li key={id}>{toggle}{badge}<ListChildClass data={child} title={title} select={this.props.select} />{children}</li>;
            }, this);
            var add     = <li><ListChildClass data={this.props.parent} title="add" select={this.props.add} /></li>;

            return <ul className="animated slideInRight" ><span className={icons.get("add")}></span>{add}{child}</ul>;
        }
    });

    var SampleClass = React.createClass({
        render: function () {
            var sample  = this.props.sample.map(function (parts) {
                return <li key={parts.Parts.id}><ListChildClass data={parts} title={parts.Parts.title} select={this.props.select} /></li>;
            }, this)

            return <ul className="animated slideInRight">{sample}</ul>;
        }
    });

    var NavigationClass = React.createClass({
        render: function () {
            var child   = this.props.data.map(function (child, index) {
                return <li key={index} itemscope="itemscope" itemtype="http://data-vocabulary.org/Breadcrumb"><ListChildClass data={child.state} title={child.title} select={this.props.select}/></li>;
            }, this);

            return <ol className="breadcrumb">{child}</ol>;
        }
    });

    var ParentClass = React.createClass({
        getInitialState: function () {
            return {
                view        : viewType.init,
                error       : null,
                snapshot    : null,
                select      : null,
                preview     : null,
                sample      : null,
                page        : null,
                parts       : null,
                partsType   : null,
            };
        },
        componentDidMount: function () {
            this.exeAjax("GET", "/maintenance/ajax_parts_type", null);
            this.listPage();
        },
        exeAjax: function (type, url, data) {
            var params = {
                type        : type,
                url         : url,
                contentType : "application/json",
                dataType    : "json",
                success     : function (ret) {
                    this.router(ret);
                }.bind(this),
            };
            if (data) params.data = JSON.stringify(data);
            $.ajax(params);
        },
        listPage: function () {
            this.exeAjax("GET", "/maintenance/ajax_page_list", null);
        },
        sampleParts: function () {
            this.exeAjax("GET", "/maintenance/ajax_parts_sample", null);
        },
        ajaxAction: function (action, data, url, notRefresh) {
            var type    = this.getDataType(data);

            if (type === dataType.page)     url = "page_" + action;
            if (type === dataType.parts)    url = "parts_" + action;
            if (url) {
                if (!notRefresh) this.routerSub({path: viewType.saved});
                this.exeAjax("POST", "/maintenance/ajax_" + url, data);
            }
        },
        ajaxRender: function (data) {
            this.ajaxAction("render", data, null, true);
        },
        ajaxSave: function (parts) {
            this.ajaxAction("save", (this.getDataType(parts) === dataType.parts) ? parts : this.state.select);
        },
        ajaxRemove: function () {
            this.ajaxAction("remove", this.state.select);
        },
        changeForm: function (e) {
            var target = (e.target.type === "checkbox") ? e.target.checked : e.target.value;
            eval("this.state.select." + e.target.name + " = target");
            if (this.getDataType(this.state.select) === dataType.parts && e.target.name === "Parts.type") this.state.select.Attr = {};
            this.setState({select: this.state.select});
        },
        selectAction: function (id) {
            var state   = {snapshot: $.extend(true, {}, this.state)};
            var type    = this.getDataType(this.state.select);
            switch (id) {
            case viewType.copy :
                state.view      = viewType.saved;
                if (type === dataType.parts) this.copyParts(this.state.select);
                break;
            case viewType.deepcopy :
                state.view      = viewType.saved;
                if (type === dataType.parts) this.deepcopyParts(this.state.select);
                break;
            case viewType.remove :
                state.view      = viewType.saved;
                this.ajaxRemove();
                break;
            }
            this.routerSub({path: id});
            this.setState(state);
        },
        selectNavigation: function (state) {
            if (this.state.snapshot) $.extend(true, state, this.state.snapshot);
            state.snapshot  = null;
            this.setState(state);
        },
        selectParts: function (parts) {
            if (this.getDataType(this.state.select) === dataType.parts && this.state.select.Parts.id === parts.Parts.id) parts = null;
            $(".parts-active").removeClass("parts-active");
            if (parts) $("#" + parts.Parts.id).addClass("parts-active");
            this.routerSub(parts);
        },
        addPage: function () {
            this.routerSub({Page: {id: uniqueKey.get("Page")}, unsaved: true});
        },
        addParts: function (parent) {
            this.routerSub({Parts: {id: uniqueKey.get("Parts"), page: this.state.parts.Page.id, type: this.state.partsType.types[0].value, parent: parent}, Attr: {}, unsaved: true});
        },
        copyParts: function (parts) {
            parts.Parts.id      = uniqueKey.get("Parts");
            parts.Parts.page    = this.state.parts.Page.id;
            parts.Parts.title  += " - Copy";
            this.ajaxSave(parts);
        },
        deepcopyParts: function (parts) {
            parts.Parts.child = null;
            this.copyParts(parts);

            if (parts.Child && parts.Child.length) {
                parts.Child.map(function (child) {
                    child.Parts.parent  = parts.Parts.id;
                    this.deepcopyParts(child);
                }, this);
            }
        },
        getNavi: function () {
            var naviList    = [];
            naviList.push({title: "Home", state: {view: viewType.page, parts: null, select: null}});
            if (this.state.parts) naviList.push({title: this.state.parts.Page.title, state: {view: viewType.parts, sample: null, select: {Page: this.state.parts.Page}}});
            if (this.state.sample) naviList.push({title: "Sample", state: {view: viewType.sample, select: {Page: this.state.parts.Page}}})
            if (this.state.select && this.getDataType(this.state.select) === dataType.parts) naviList.push({title: this.state.select.Parts.title, state: {view: viewType.actions, select: this.state.select}});
            if (this.state.view === viewType.edit) naviList.push({title: "Edit Form", state: {view: viewType.edit}});
            return naviList;
        },
        getAction: function () {
            var ret         = [];
            var actions     = [];
            var actionList  = [{id: viewType.add, name: "add"}, {id: viewType.edit, name: "edit"}, {id: viewType.copy, name: "copy"}, {id: viewType.deepcopy, name: "deepcopy"}, {id: viewType.remove, name: "remove"}];
            var type        = this.getDataType(this.state.select);
            if (this.state.sample)                                              actions = ["copy", "deepcopy"];
            else if (this.state.select.unsaved )                                actions = ["edit"];
            else if (type === dataType.page && this.state.parts.Parts.length)   actions = ["edit"];
            else if (type === dataType.page)                                    actions = ["edit", "remove"];
            else if (type === dataType.parts)                                   actions = ["edit", "copy", "deepcopy", "remove"];
            actionList.map(function (val, key) { if (actions.indexOf(val.name) >= 0) ret.push(val); });

            return ret;
        },
        getDataType: function (data) {
            if (!data)          return dataType.any;
            if (data.error)     return dataType.error;
            if (data.forms)     return dataType.form;
            if (data.html)      return dataType.preview;
            if (data.sample)    return dataType.sample;
            if (data.path)      return dataType.path
            if (data.length)    return dataType.list;
            if (data.Parts)     return dataType.parts;
            if (data.Page)      return dataType.page;

            return dataType.any;
        },
        router: function (data) {
            var type    = this.getDataType(data);
            var state   = {};

            if (type === dataType.error)    state   = {view: viewType.edit, error: data.error};
            if (type === dataType.form)     state   = {partsType: data};
            if (type === dataType.preview)  state   = {preview: data.html};
            if (type === dataType.sample)   state   = {view: viewType.sample, preview: data.sample.html, sample: data.sample.parts};
            if (type === dataType.list)     state   = {view: viewType.page, page: data};
            if (type === dataType.parts)    state   = {view: viewType.parts, parts: data, select: {Page: data.Page}};
            if (type === dataType.parts)    this.ajaxRender({Parts: {type: "Block"}, Child: data.Parts});
            if (this.state.view === viewType.saved && type !== dataType.error) {
                $.extend(true, state, {error: null, snapshot: null, sample: null, select: this.state.select});
                type    = this.getDataType(this.state.select);
                if (type === dataType.page)     this.listPage();
                if (type === dataType.parts)    this.ajaxRender({Page: this.state.parts.Page});
            }

            this.setState(state);
        },
        routerSub: function (data) {
            var type    = this.getDataType(data);
            var state   = {};

            if (type === dataType.path)                             state       = {view: data.path};
            if (type === dataType.page || type === dataType.parts)  state       = {view: viewType.actions, select: data};
            if (data.unsaved)                                       state.view  = viewType.edit;

            this.setState(state);
        },
        render: function () {
            var listView    = [];
            var formList    = [];
            var $preview    = (this.state.preview) ? $(this.state.preview) : $("<div></div>");

            $preview.find("[parts-markdown=1]").each(function () { $(this).html(marked($(this).html().trim())); });
            listView.push(<NavigationClass data={this.getNavi()} select={this.selectNavigation} />);
            switch (this.state.view) {
            case viewType.page :
                listView.push(<div><h4>Page List</h4><PageClass data={this.state.page} select={this.ajaxRender} add={this.addPage} /></div>);
                break;
            case viewType.parts :
                listView.push(<div><h4>{this.state.parts.Page.title}</h4><ActionClass select={this.getAction()} action={this.selectAction} /></div>);
                listView.push(<div><ul><li className="animated slideInRight"><ListChildClass data={0} title="sample" select={this.sampleParts}/><span className={icons.get("sample")}></span></li></ul></div>)
                listView.push(<div><h4>Parts List</h4><PartsClass data={this.state.parts.Parts} select={this.selectParts} add={this.addParts} /></div>);
                break;
            case viewType.sample :
                listView.push(<div><h4>Sample List</h4><SampleClass sample={this.state.sample} select={this.selectParts} /></div>);
                break;
            case viewType.actions :
                listView.push(<div><h4>{this.state.select.Parts.title}</h4><ActionClass select={this.getAction()} action={this.selectAction} /></div>);
                break;
            case viewType.edit :
                var type    = "";
                var getForm = function (val) {
                    var form    = $.extend(true, {}, val);
                    var name    = form.name.split(".");
                    form.type   = formType[form.type];
                    form.value  = this.state.select[name[0]][name[1]];
                    if (!this.state.select[name[0]].hasOwnProperty(name[1])) this.state.select[name[0]][name[1]] = null;
                    if (form.name === "Parts.type") $.extend(true, form, {type: formType.select, options: this.state.partsType.types})
                    if (form.name === "Attr.contents" && this.state.select.Attr.multiple) form.type = formType.textarea;
                    if (form.name === "Attr.path" && this.state.select.Attr.innerlink) {
                        form.type       = formType.select;
                        form.options    = this.state.page.map(function (page) { return {name: page.title, value: "/" + page.path}});
                    }
                    formList.push(form)
                }

                if (this.getDataType(this.state.select) === dataType.page) {
                    type    = "Page";
                    this.state.partsType.forms.Page.map(getForm, this);
                } else if (this.getDataType(this.state.select) === dataType.parts) {
                    type    = "Parts";
                    this.state.partsType.forms.Parts.map(getForm, this);
                    this.state.partsType.forms[this.state.select.Parts.type].map(getForm, this)
                }

                listView.push(<div><h4>{type + ": " + this.state.select[type].title}</h4><FormClass forms={formList} error= {this.state.error} change={this.changeForm} /><button className="btn btn-primary pull-right" onClick={this.ajaxSave}>Save</button></div>);
                break;
            }
            return (
                <div>
                    <div className={size.get(3)} style={{overflow: "scroll", "white-space": "nowrap"}}>{listView}</div>
                    <div className={size.get(9)}>
                        <div className="panel panel-default">
                            <div className="panel-heading"><h4>{(this.state.parts) ? this.state.parts.Page.title : ""}</h4></div>
                            <div className="panel-body" dangerouslySetInnerHTML={{__html: $preview.html()}}></div>
                        </div>
                    </div>
                </div>
            )
        }
    });

    React.render(
        <ParentClass />,
        document.getElementById("Main")
    );
});
</script>