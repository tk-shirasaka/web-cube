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
        _save: function () {
            this.props.save(viewType.saved);
        },
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

            return <form className="animated slideInRight">{child}<li className="btn btn-primary pull-right" onClick={this._save} >Save</li></form>;
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
                return <li key={index} itemscope="itemscope" itemtype="http://data-vocabulary.org/Breadcrumb"><ListChildClass data={child.view} title={child.title} select={this.props.select}/></li>;
            }, this);

            return <ol className="breadcrumb">{child}</ol>;
        }
    });

    var ParentClass = React.createClass({
        getInitialState: function () {
            return {
                view        : viewType.init,
                error       : null,
                select      : null,
                preview     : null,
                sample      : null,
                page        : null,
                parts       : null,
                partsType   : null,
            };
        },
        componentDidMount: function () {
            this.router(viewType.page);
        },
        exeAjax: function (type, url, data, callbacks) {
            var params = {
                type        : type,
                url         : url,
                contentType : "application/json",
                dataType    : "json",
                success     : function (ret) {
                    var type    = this.getDataType(ret);
 
                    if (type === dataType.error)    $.extend(true, this.state, {error: ret.error});
                    if (type === dataType.form)     $.extend(true, this.state, {partsType: ret});
                    if (type === dataType.preview)  $.extend(true, this.state, {preview: ret.html});
                    if (type === dataType.sample)   $.extend(true, this.state, {preview: ret.sample.html, sample: ret.sample.parts});
                    if (type === dataType.list)     $.extend(true, this.state, {page: ret});
                    if (type === dataType.parts)    $.extend(true, this.state, {parts: ret, select: {Page: ret.Page}});
                    if (callbacks && callbacks.length) {
                        callbacks.pop()(callbacks);
                    } else {
                        this.setState(this.state);
                    }
                }.bind(this),
            };
            if (data) params.data = JSON.stringify(data);
            $.ajax(params);
        },
        changeForm: function (e) {
            var target = (e.target.type === "checkbox") ? e.target.checked : e.target.value;
            eval("this.state.select." + e.target.name + " = target");
            if (this.getDataType(this.state.select) === dataType.parts && e.target.name === "Parts.type") this.state.select.Attr = {};
            this.setState({select: this.state.select});
        },
        selectPage: function (data) {
            this.state.select   = data;
            this.router(viewType.parts);
        },
        selectParts: function (parts) {
            if (this.getDataType(this.state.select) === dataType.parts && this.state.select.Parts.id === parts.Parts.id) parts = null;
            $(".parts-active").removeClass("parts-active");
            if (parts) $("#" + parts.Parts.id).addClass("parts-active");
            this.state.select   = parts;
            this.router(viewType.actions);
        },
        addPage: function () {
            this.state.select   = {Page: {id: uniqueKey.get("Page")}, unsaved: true};
            this.router(viewType.edit);
        },
        addParts: function (parent) {
            this.state.select   = {Parts: {id: uniqueKey.get("Parts"), page: this.state.parts.Page.id, type: this.state.partsType.types[0].value, parent: parent}, Attr: {}, unsaved: true};
            this.router(viewType.edit);
        },
        copyParts: function (parts) {
            parts.Parts.id      = uniqueKey.get("Parts");
            parts.Parts.page    = this.state.parts.Page.id;
            parts.Parts.title  += " - Copy";
            this.exeAjax("POST", "/maintenance/ajax_parts_save", parts);
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

            if (this.state.page)    naviList.push({title: "Home", view: viewType.page});
            if (this.state.parts)   naviList.push({title: this.state.parts.Page.title, view: viewType.parts});
            if (this.state.sample)  naviList.push({title: "Sample", view: viewType.sample});
            if ([viewType.add, viewType.edit, viewType.actions].indexOf(this.state.view) >= 0) {
                var title   = "";
                var type    = this.getDataType(this.state.select);
                if (type === dataType.page)     title = this.state.select.Page.title;
                if (type === dataType.parts)    title = this.state.select.Parts.title;
                naviList.push({title: title, view: this.state.view});
            }

            return naviList;
        },
        getAction: function () {
            var ret         = [];
            var actions     = [];
            var actionList  = [{id: viewType.add, name: "add"}, {id: viewType.edit, name: "edit"}, {id: viewType.copy, name: "copy"}, {id: viewType.deepcopy, name: "deepcopy"}, {id: viewType.remove, name: "remove"}, {id: viewType.sample, name: "sample"}];

            if (this.state.view === viewType.parts)     actions = (this.state.parts.Parts.length) ? ["edit", "sample"] : ["edit", "remove", "sample"];
            if (this.state.view === viewType.actions)   actions = (this.state.select.unsaved) ? ["edit"] : ["edit", "copy", "deepcopy", "remove"];
            if (this.state.sample)                      actions = ["copy", "deepcopy"];

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
        router: function (view) {
            var callbacks   = [];
            var type        = this.getDataType(this.state.select);

            switch (view) {
            case viewType.copy :
            case viewType.deepcopy :
            case viewType.remove :
            case viewType.saved :
                callbacks.push(function () { if (!this.state.error) {this.selectPage(this.state.parts); } else { this.setState(this.state); } }.bind(this));
                if (view === viewType.copy && type === dataType.parts)      this.copyParts(this.state.select);
                if (view === viewType.deepcopy && type === dataType.parts)  this.deepcopyParts(this.state.select);
                if (view === viewType.remove && type === dataType.page)     callbacks.push(function (callbacks) { this.exeAjax("POST", "/maintenance/ajax_page_remove", this.state.select, callbacks); }.bind(this));
                if (view === viewType.remove && type === dataType.parts)    callbacks.push(function (callbacks) { this.exeAjax("POST", "/maintenance/ajax_parts_remove", this.state.select, callbacks); }.bind(this));
                if (view === viewType.saved && type === dataType.page)      callbacks.push(function (callbacks) { this.exeAjax("POST", "/maintenance/ajax_page_save", this.state.select, callbacks); }.bind(this));
                if (view === viewType.saved && type === dataType.parts)     callbacks.push(function (callbacks) { this.exeAjax("POST", "/maintenance/ajax_parts_save", this.state.select, callbacks); }.bind(this));
                this.state.error    = null;
                view                = viewType.edit;
                break;
            case viewType.sample :
                callbacks.push(function (callbacks) { this.exeAjax("GET", "/maintenance/ajax_parts_sample", null, callbacks); }.bind(this));
            case viewType.parts :
                this.state.sample   = null;
                if (this.state.parts) this.state.select   = {Page: this.state.parts.Page};
                callbacks.push(function (callbacks) { this.exeAjax("POST", "/maintenance/ajax_parts_render", {Parts: {type: "Block"}, Child: this.state.parts.Parts}, callbacks); }.bind(this));
                callbacks.push(function (callbacks) { this.exeAjax("POST", "/maintenance/ajax_page_render", this.state.select, callbacks); }.bind(this));
            case viewType.page :
                this.state.parts    = null;
                if (!this.state.page) callbacks.push(function (callbacks) { this.exeAjax("GET", "/maintenance/ajax_page_list", null, callbacks); }.bind(this));
            case viewType.init :
                if (!this.state.partsType) callbacks.push(function (callbacks) { this.exeAjax("GET", "/maintenance/ajax_parts_type", null, callbacks); }.bind(this));
            }

            this.state.view = view;
            if (callbacks.length) {
                callbacks.pop()(callbacks);
            } else {
                this.setState(this.state);
            }
        },
        render: function () {
            var listView    = [];
            var formList    = [];
            var $preview    = (this.state.preview) ? $(this.state.preview) : $("<div></div>");

            $preview.find("[parts-markdown=1]").each(function () { $(this).html(marked($(this).html().trim())); });
            listView.push(<NavigationClass data={this.getNavi()} select={this.router} />);
            switch (this.state.view) {
            case viewType.page :
                listView.push(<div><h4>Page List</h4><PageClass data={this.state.page} select={this.selectPage} add={this.addPage} /></div>);
                break;
            case viewType.parts :
                listView.push(<div><h4>{this.state.parts.Page.title}</h4><ActionClass select={this.getAction()} action={this.router} /></div>);
                listView.push(<div><h4>Parts List</h4><PartsClass data={this.state.parts.Parts} select={this.selectParts} add={this.addParts} /></div>);
                break;
            case viewType.sample :
                listView.push(<div><h4>Sample List</h4><SampleClass sample={this.state.sample} select={this.selectParts} /></div>);
                break;
            case viewType.actions :
                listView.push(<div><h4>{this.state.select.Parts.title}</h4><ActionClass select={this.getAction()} action={this.router} /></div>);
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

                listView.push(<div><h4>{type + ": " + this.state.select[type].title}</h4><FormClass forms={formList} error={this.state.error} change={this.changeForm} save={this.router} /></div>);
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
