<script type="text/jsx">
$(function () {
    var viewType    = {init: 1, page: 2, parts: 3, gallery: 4, actions: 5, edit: 6, copy: 7, remove: 8, partsForm: 9, partsAttrForm: 10, saved: 11};
    var dataType    = {any: -1, form: 1, preview: 2, page: 3, parts: 4, new: 5, path: 6, list: 7};
    var formType    = {input: 1, number: 2, checkbox: 3, raddio: 4, select: 5, textarea: 6, hidden: 7};
    var uniqueKey   = {get: function (prefix) { return prefix + "-" + Math.random().toString().replace(".", "")}};
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
                    formTag = <input id={index} className="form-control" name={form.name} value={form.value} placeholder={form.placeholder} onChange={this.props.change}></input>;
                    break;
                case formType.number :
                    formTag = <input id={index} className="form-control" name={form.name} type="number" value={form.value} onChange={this.props.change}></input>;
                    break;
                case formType.checkbox :
                    formTag = <input id={index} className="form-control" name={form.name} type="checkbox" value={form.value} onChange={this.props.change}></input>;
                    break;
                case formType.select :
                    formTag = <select id={index} className="form-control" name={form.name} value={form.value} onChange={this.props.change}>{form.options.map(function (option) { return <option value={option.value}>{option.name}</option>})}</select>;
                    break;
                case formType.textarea :
                    formTag = <textarea id={index} className="form-control" name={form.name} value={form.value} placeholder={form.placeholder} onChange={this.props.change}></textarea>;
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
            var actionList  = [{id: viewType.edit, name: "edit"}];

            if (!this.props.select.add) {
                actionList.push({id: viewType.copy, name: "copy"});
                actionList.push({id: viewType.remove, name: "remove"});
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
                var children    = (child.Child && this.state.open.indexOf(id) >= 0 ) ? <Parts data={child.Child} select={this.props.select} parent={child.Parts.id}/> : "";
                var badge       = (child.Child) ? <span className="badge pull-left">{child.Child.length}</span> : "";
                var toggle      = (child.Child) ? <span className={icons.get((this.state.open.indexOf(id) >= 0) ? "slideDown" : "slideUp")} onClick={this.toggleChild.bind(this, id)}></span> : "";
                return <li key={id}>{toggle}{badge}<ListChild data={child} title={title} select={this.props.select} />{children}</li>;
            }, this);
            var add     = <li><ListChild data={this.props.parent} title="add" select={this.props.add} /></li>

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
                select      : null,
                preview     : null,
                page        : null,
                parts       : null,
                partsType   : null,
            };
        },
        componentDidMount: function () {
            this.listPartsType();
            this.listPage();
        },
        changeForm: function (e) {
            var target = (e.target.type === "checkbox") ? e.target.checked : e.target.value;
            eval("this.state.select." + e.target.name + " = target");
            this.setState({select: this.state.select});
        },
        listPage: function () {
            this.exeAjax("GET", "/maintenance/ajax_page_list", null);
        },
        listPartsType: function () {
            this.exeAjax("GET", "/maintenance/ajax_parts_type", null);
        },
        selectAction: function (id) {
            var state = {snapshot: $.extend(true, {}, this.state)};
            switch (id) {
            case viewType.copy :
                state.view      = viewType.saved;
                this.copyParts();
                break;
            case viewType.remove :
                state.view      = viewType.saved;
                this.removeParts();
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
        selectPage: function (id) {
            this.exeAjax("POST", "/maintenance/ajax_page_render", {page: id});
        },
        selectParts: function (parts) {
            if (this.state.select && this.state.select.Parts.id === parts.Parts.id) parts = null;
            $(".parts-active").removeClass("parts-active");
            if (parts) $("#" + parts.Parts.id).addClass("parts-active");
            this.routerSub(parts);
        },
        addParts: function (parent) {
            this.routerSub({new: true, type: dataType.parts, parent: parent});
        },
        copyParts: function () {
            var parts           = {};
            $.extend(true, parts, this.state.select);
            parts.Parts.id      = uniqueKey.get(dataType.parts);
            parts.Parts.title  += " - Copy";
            parts.Parts.parent  = this.state.select.Parts.parent;
            this.saveParts(parts);
        },
        removeParts: function () {
            this.exeAjax("POST", "/maintenance/ajax_parts_remove", this.state.select);
        },
        renderParts: function (parts) {
            this.exeAjax("POST", "/maintenance/ajax_parts_render", parts);
        },
        saveParts: function (parts) {
            this.routerSub({path: viewType.saved});
            this.exeAjax("POST", "/maintenance/ajax_parts_save", (this.getDataType(parts) === dataType.parts) ? parts : this.state.select);
        },
        getNavi: function () {
            var naviList    = [];
            naviList.push({title: "Home", state: {view: viewType.page, parts: null, select: null}});
            if (this.state.parts) naviList.push({title: this.state.parts.Page.title, state: {view: viewType.parts, select: null}});
            if (this.state.select) naviList.push({title: this.state.select.Parts.title, state: {view: viewType.actions, select: this.state.select}});
            if (this.state.view === viewType.edit || this.state.view === viewType.partsAttrForm) naviList.push({title: "Parts Edit", state: {view: viewType.edit}});
            return naviList;
        },
        getDefaultData: function (data) {
            var ret     = {};

            switch (data.type) {
            case dataType.parts :
                ret = {Parts: {id: uniqueKey.get(data.type), page: this.state.parts.Page.id, type: this.state.partsType.types[0].value, parent: data.parent}, Attr: {}, add: true};
                break;
            }
            return ret;
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
        getDataType: function (data) {
            if (!data)          return dataType.any;
            if (data.forms)     return dataType.form;
            if (data.html)      return dataType.preview;
            if (data.new)       return dataType.new;
            if (data.path)      return dataType.path
            if (data.length)    return dataType.list;
            if (data.Parts)     return dataType.parts;
            if (data.Page)      return dataType.page;

            return dataType.any;
        },
        router: function (data) {
            var type    = this.getDataType(data);
            var state   = {};

            if (type === dataType.form)     state   = {partsType: data};
            if (type === dataType.preview)  state   = {preview: data};
            if (type === dataType.list)     state   = {view: viewType.page, page: data};
            if (type === dataType.parts)    state   = {view: viewType.parts, parts: data};
            if (type === dataType.parts)    this.renderParts({Parts: {type: "Block"}, Child: data.Parts});
            if (this.state.view === viewType.saved && type !== dataType.parts) {
                state   = {snapshot: null, select: null};
                type    = this.getDataType(this.state.select);
                if (type === dataType.parts)    this.selectPage(this.state.parts.Page.id);
            }

            this.setState(state);
        },
        routerSub: function (data) {
            var type    = this.getDataType(data);
            var state   = {};

            if (type === dataType.path)     state   = {view: data.path};
            if (type === dataType.new)      state   = {view: viewType.edit, select: this.getDefaultData(data)};
            if (type === dataType.page || type === dataType.parts) state = {view: viewType.actions, select: data};

            this.setState(state);
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
                listView.push(<div><h4>Parts List</h4><Parts data={this.state.parts.Parts} select={this.selectParts} add={this.addParts} parent={null} /></div>);
                break;
            case viewType.gallery :
                break;
            case viewType.actions :
                listView.push(<div><h4>Action List</h4><Action select={this.state.select} action={this.selectAction} /></div>);
                break;
            case viewType.edit :
                var getForm = function (val) {
                    var form    = $.extend(true, {}, val);
                    var name    = form.name.split('.');
                    form.type   = formType[form.type];
                    form.value  = this.state.select[name[0]][name[1]];
                    if (form.name === "Parts.type") $.extend(true, form, {type: formType.select, options: this.state.partsType.types})
                    if (form.name === "Attr.contents" && this.state.select.Attr.multiple) form.type = formType.textarea;
                    formList.push(form)
                }

                this.state.partsType.forms.Parts.map(getForm, this);
                this.state.partsType.forms[this.state.select.Parts.type].map(getForm, this)

                listView.push(<div><h4>Parts Form</h4><Form forms={formList} change={this.changeForm} /><button className="btn btn-primary pull-right" onClick={this.saveParts}>Save</button></div>);
                break;
            }
            return (
                <div>
                    <div className={size.get(3)} style={{overflow: "scroll", "white-space": "nowrap"}}>{listView}</div>
                    <div className={size.get(9)}>
                        <div className="panel panel-default">
                            <div className="panel-heading"><h4>{(this.state.parts) ? this.state.parts.Page.title : ""}</h4></div>
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
});
</script>
