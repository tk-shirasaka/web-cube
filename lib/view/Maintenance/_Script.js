<script type="text/jsx">
$(function () {
    var viewType    = {page: 0, parts: 1, gallery: 2};
    var isDisplay   = (function (condition) { return {display : (condition) ? "block" : "none"}; });
    var size        = (function (size) { return ["col-xs-", "col-md-", "col-sm"].map(function(base) { return base + size; }).join(" "); });
    var icons       = {
            _base       : "pull-right glyphicon glyphicon-",
            open        : "folder-open",
            close       : "folder-close",
            select      : "th-list",
            add         : "plus",
            copy        : "duplicate",
            edit        : "pencil",
            save        : "save",
            remove      : "trash",
            slideUp     : "chevron-up",
            slideDown   : "chevron-down",
            zoomIn      : "zoom-in",
            zoomOut     : "zoom-out",
            get         : function (name) { return (this[name]) ? this._base + this[name] : ""; }
    };

    var Main = React.createClass({
        getInitialState: function () {
            return {
                page        : [],
                parts       : {Page: {}, Parts: []},
                gallery     : [],
                stat        : {view: viewType.page, selected: null},
            };
        },
        componentDidMount: function () {
            this.listPage();
        },
        listPage: function () {
                this.exeAjax("GET", "/maintenance/ajax_page_list", null, false);
        },
        updatePage: function (page, isSave) {
            if (isSave) {
                this.exeAjax("GET", "/maintenance/ajax_page_save", null, false);
            } else {
                this.exeAjax("POST", "/maintenance/ajax_page_render", page, viewType.parts);
            }
        },
        updateParts: function (data) {
            this.exeAjax("POST", "/maintenance/ajax_parts_render", data, false);
        },
        updateGallery: function () {
            this.exeAjax("GET", "/maintenance/ajax_parts_gallery", null, false);
        },
        exeAjax: function(type, url, data, view) {
            $.ajax({
                type        : type,
                url         : url,
                data        : JSON.stringify(data),
                contentType : "application/JSON",
                dataType    : "JSON",
                success     : function (res) {
                    var data    = {stat: {view: (view === false) ? this.state.stat.view : view, selected: null}};
                    switch (data.stat.view) {
                    case viewType.page :
                        data.page       = res;
                        break;
                    case viewType.parts : data.parts      = res;
                        break;
                    case viewType.gallery :
                        data.gallery    = res;
                        break;
                    }
                    this.setState(data);
                }.bind(this),
            });
        },
        render: function () {
            return (
                <div>
                    <div className={size(3)}>
                        <Action stat={this.state.stat} action={this.exeAction} />
                    </div>
                    <div className={size(9)}>
                        <Page data={this.state.page} stat={this.state.stat} update={this.updatePage} />
                        <Parts data={this.state.parts.Parts} stat={this.state.stat} update={this.updateParts} />
                        <Gallery data={this.state.gallery} stat={this.state.stat} update={this.updateGallery} />
                    </div>
                </div>
            );
        },
    });

    var Action = React.createClass({
        render: function () {
            return (
                <div>
                </div>
            );
        },
    });

    var Page = React.createClass({
        render: function () {
            return (
                <div style={isDisplay(this.props.stat.view === viewType.page)}>
                    <ul className="list-group">
                        {this.props.data.map(function (page) {
                            return (
                                <button type="button" className="list-group-item" onClick={this.props.update.bind(this, page, false)}>
                                    {page.title}
                                </button>
                            );
                        }, this)}
                    </ul>
                </div>
            );
        },
    });

    var Parts = React.createClass({
        render: function () {
            return (
                <div style={isDisplay(this.props.stat.view === viewType.parts)}>
                    <ul>
                        {this.props.data.map(function (parts) {
                            var span = "";
                            var children = "";
                            if (parts.Child) {
                                span = (<span className="badge">{parts.Child.length}</span>);
                                //children = (<Parts data={parts.Child} stat={this.props.stat} update={this.props.updateParts} />)
                            }
                            return (
                                <li>
                                    {parts.Parts.title}
                                    {span}
                                    {children}
                                </li>
                            );
                        }, this)}
                    </ul>
                </div>
            );
        },
    });

    var Gallery = React.createClass({
        render: function () {
            return (
                <div style={isDisplay(this.props.stat.view === viewType.gallery)}>
                </div>
            );
        },
    });

    React.render(
        <Main />,
        document.getElementById('Main')
    );
});
</script>
