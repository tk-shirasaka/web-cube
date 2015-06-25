<script type="text/jsx">
$(function () {
    var data                = [];
    var parts               = [];
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

    var PartsControlChild   = React.createClass({
        render: function() {
            var list = this.props.data.map(function (parts) {
                var title   = (parts.Parts.title) ? parts.Parts.title : "--";
                var parent  = "--";
                if (parts.Parts.parent) {
                    var index   = searchPartsById(parts.Parts.parent);
                    parent = data[index].Parts.title;
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
                    var index   = searchPartsById(parts.Parts.parent);
                    parent = data[index].Parts.title;
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
            this.setState({data : data});
        },
        render: function() {
            return (
                <div className="parts-container">
                    <PartsControl data={data} />
                    <PartsBox data={data} />
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
            var parent;
            var id          = (now) ? now : "__Parts" + data.length;

            parts           = getFormData(this, {_id: id});
            parts.Parts.id  = "";
            parent          = searchPartsById(parts.Parts.parent);

            if (parent !== false) {
                if (data[parent]["Child"] === undefined) data[parent]["Child"] = [];
                data[parent]["Child"].push(parts);
                parts   = data[parent];
            }
            e.preventDefault();
            exeAjax($(this).attr("method"), $(this).attr("action"), parts);
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
        var index   = searchPartsById(parts._id);
        parts.html  = res;

        if (index === false) {
            data.push(parts);
        } else {
            data[index] = parts
        }

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
            var index   = searchPartsById(id);

            if (index !== false) data.splice(index, 1);
            partsRefresh();
        });
    }

    function partsChange() {
        $(".parts-container .parts-control").find(".parts-change-btn").bind("click", function () {
            var id          = $(this).parent().attr("target");
            var index       = searchPartsById(id);
            var $contents   = $("#" + id).find(".parts-contents").children();
            var $control    = $(this).parent().prev();

            if (index !== false) {
                now = data[index]._id;
                putFormData($partsForm, data[index])
            }

            $(".parts-active").removeClass("parts-active");
            $contents.addClass("parts-active");
            $control.addClass("parts-active");
        });
    }

    function partsAddChild() {
        $(".parts-container .parts-control").find(".parts-add-btn").bind("click", function () {
            var id          = $(this).parent().attr("target");
            var index       = searchPartsById(id);

            putFormData($partsForm, {"Parts.parent": id});
        });
    }

    function searchPartsById(id) {
        for (var i = 0; i < data.length; i++) {
            if (data[i]._id !== id) continue;
            return i;
        }
        return false;
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

    function getFormData(form, ret) {
        $(form).find(inputTagList).each(function () {
            var name    = $(this).attr("name").split(".");
            var value   = $(this).val();
            var _ret    = ret;

            if ($(this).prop("type") === "checkbox") value = $(this).prop("checked") ? 1 : "";

            name.forEach(function (val, key) {
                if (_ret[val] === undefined) _ret[val] = {};
                if (key + 1 === name.length) {
                    _ret[val]   = value;
                } else {
                    _ret        = _ret[val];
                }
            });
        });
        return ret;
    }

    function putFormData($form, data) {
        jQuery.each(data, function (key, val) {
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
