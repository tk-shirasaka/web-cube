<script type="text/jsx">
$(function () {
    var now                 = null;
    var inputTagList        = "input, select, textarea";
    var attrDialogList      = {Form: "#FormPartsDialog", Block: "#BlockPartsDialog", Text: "#TextPartsDialog"};
    var partsControlChange  = "glyphicon glyphicon-pencil";
    var partsControlRemove  = "glyphicon glyphicon-trash";
    var partsControlPlus    = "glyphicon glyphicon-plus";
    var $partsForm          = $("#PartsForm");
    var $partsDialog        = $("#PartsDialog");
    var $partsAttrDialog    = $("#PartsAttrDialog");
    var $partsFormSlider    = $("#PartsFormSlider");

    var PartsClass          = {
        data : [],
        findById : function (id) {
            var data    = this.data;
            var srch    = "";
            var ids     = id.split(".");

            for (var i = 0; i < ids.length; i++) {
                srch = (srch) ? srch + "." + ids[i] : ids[i];

                for (var j= 0; j < data.length; j++) {
                    if (data[j]._id !== srch) continue;
                    if (i + 1 === ids.length) return data[j];
                    data    = data[j].Child;
                    break;
                }

            }
            return false;
        },
        getAll : function () {
            return this.data;
        },
        remove : function (id) {
            var parts   = this.findById(id);
            var parent  = this.findById(parts.Parts.parent);

            if (!parent)    parent = this.data;
            for (var i = 0; i < parent.length; i++) {
                if (parent[i]._id !== parts._id) continue;
                parent.splice(i, 1);
                return;
            }
        },
        _set : function (parts) {
            var data    = this.findById(parts.Parts.parent);
            var id      = parts._id.split(".").pop();

            if (data) {
                data    = data.Child;
            } else {
                data   = this.data;
            }
            for (var i = 0; i < data.length; i++) {
                if (data[i]._id !== parts._id) continue;
                data[i]   = parts;
                return;
            }

            data.push(parts);
        },
        set : function (parts) {
            var index;
            var parent      = this.findById(parts.Parts.parent);
            var no          = (parent) ? parent.Child.length : this.data.length;
            var root        = parts;

            if (!parts.Child) parts.Child = [];
            if (!parts._id || parent) {
                parts._id   = "";
                if (parent) {
                    while (parent._id) {
                        parts._id  += parent._id + ".";
                        root        = parent;
                        parent      = this.findById(parent.Parts.parent);
                    }
                }
 
                parts._id  += "__Parts" + no;
            }
            if (now) {
                parts._id   = now;
            } else {
                now         = parts._id;
            }

            this._set(parts);

            return root;
        },
        setHtml : function (html, id) {
            var parts   = this.findById(id);
            parts.html  = html;
        }
    };

    var PartsControlChild   = React.createClass({
        render: function() {
            var list = this.props.data.map(function (parts) {
                var title   = (parts.Parts.title) ? parts.Parts.title : "--";
                var parent  = "--";
                if (parts.Parts.parent) {
                    var parent = PartsClass.findById(parts.Parts.parent).Parts.title;
                }
                return (
                    <div className="btn-group">
                        <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <div>Parent : {parent}</div>
                            <div>Title  : {title}</div>
                        </button>
                        <ul className="dropdown-menu" target={parts._id}>
                            <li className="parts-change-btn"><a href="#">Change <span className={partsControlChange}></span></a></li>
                            <li className="parts-remove-btn"><a href="#">Remove <span className={partsControlRemove}></span></a></li>
                            <li className="parts-add-btn"><a href="#">Add Child <span className={partsControlPlus}></span></a></li>
                        </ul>
                    </div>
                );
            });
            return (
                <div>
                    {list}
                </div>
            );
        }
    });

    var PartsControlList    = React.createClass({
        render: function() {
            var list = this.props.data.map(function (parts) {
                var title   = (parts.Parts.title) ? parts.Parts.title : "--";
                var child   = (parts.Child) ? parts.Child : [];
                if (parts.Parts.parent) {
                    var parent = PartsClass.findById(parts.Parts.parent).Parts.title;
                }
                return (
                    <div>
                        <div className="btn-group">
                            <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <div>Title  : {title}</div>
                            </button>
                            <ul className="dropdown-menu" target={parts._id}>
                                <li className="parts-change-btn"><a href="#">Change <span className={partsControlChange}></span></a></li>
                                <li className="parts-remove-btn"><a href="#">Remove <span className={partsControlRemove}></span></a></li>
                                <li className="parts-add-btn"><a href="#">Add Child <span className={partsControlPlus}></span></a></li>
                            </ul>
                        </div>
                        <PartsControlChild data={child} />
                    </div>
                );
            });
            return (
                <div>
                    {list}
                </div>
            );
        }
    });

    var PartsControl        = React.createClass({
        render: function() {
            return (
                <div className="parts-control btn-group-vertical col-xs-3 col-md-3 col-sm-3">
                    <PartsControlList data={this.props.data} />
                </div>
            );
        }
    });

    var PartsBox            = React.createClass({
        render: function() {
            var parts = this.props.data.map(function (parts) {
                return (
                <div id={parts._id} className="parts-box">
                    <div className="parts-contents" dangerouslySetInnerHTML={{__html: parts.html}} />
                </div>
                );
            });
            return (
                <div className="col-xs-9 col-md-9 col-sm-9 container-fluid">
                    {parts}
                </div>
            );
        }
    });

    var PartsContainer      = React.createClass({
        getInitialState: function() {
            return {data: []};
        },
        partsUpdate: function() {
            this.setState({data : PartsClass.getAll()});
        },
        render: function() {
            return (
                <div className="parts-container">
                    <PartsControl data={this.state.data} />
                    <PartsBox data={this.state.data} />
                    <button id="PartsUpdate" className="hide" onClick={this.partsUpdate}></button>
                </div>
            );
        }
    });

    function init() {
        $partsFormSlider.click(function () {
            var down    = "glyphicon-chevron-down";
            var up      = "glyphicon-chevron-up";
 
            if ($(this).hasClass(down)) {
                $partsForm.slideUp();
                $(this).removeClass(down);
                $(this).addClass(up);
            } else {
                $partsForm.slideDown();
                $(this).removeClass(up);
                $(this).addClass(down);
            }
        });

        showAttrDialog($("#PartsTypeChoice").val());
        $("#PartsTypeChoice").change(function () {
            showAttrDialog($(this).val());
        })

        $("#TextMultipleChoice").change(function () {
            var val         = $(this).prop("checked");
            var src         = (val) ? "input" : "textarea";
            var dst         = (val) ? "textarea" : "input";
            var targetHtml  = $("#TextContentsInput").parent().html();
            var inputVal    = $("#TextContentsInput").val();
            $("#TextContentsInput").parent().html(targetHtml.replace(new RegExp(src), dst));
            $("#TextContentsInput").val(inputVal);
        })

        $partsForm.submit(function (e) {
            now = PartsClass.set(getFormData(this))._id;

            e.preventDefault();
            exeAjax($(this).attr("method"), $(this).attr("action"), PartsClass.findById(now));
        });
    }

    function exeAjax(type, url, data) {
        $.ajax({
            type    : type,
            url     : url,
            data    : data
        }).done(function(res) {
            afterAjax(res);
        });
    }

    function afterAjax(res) {
        PartsClass.setHtml(res, now);
        partsRefresh();
        $(".parts-active").removeClass("parts-active");
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
        $(".parts-container .parts-control").find(".parts-remove-btn").bind("click", function () {
            var id      = $(this).parent().attr("target");

            PartsClass.remove(id);
            partsRefresh();
        });
    }

    function partsChange() {
        $(".parts-container .parts-control").find(".parts-change-btn").bind("click", function () {
            var id          = $(this).parent().attr("target");
            var parts       = PartsClass.findById(id);
            var $contents   = $("#" + id).find(".parts-contents").children();
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
        $(".parts-container .parts-control").find(".parts-add-btn").bind("click", function () {
            var id          = $(this).parent().attr("target");

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
        var $target = $(".parts-box div p");

        $target.each(function () {
            if ($(this).attr("parts-markdown")) {
                $(this).html(marked($(this).html().trim()));
            }
        });
    }

    init();

    React.render(
        <PartsContainer />,
        document.getElementById('Main')
    );
});
</script>
