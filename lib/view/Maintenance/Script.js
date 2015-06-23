<script type="text/jsx">
$(function () {
    var data                = [];
    var inputTagList        = "input, select, textarea";
    var attrDialogList      = {Form: "#FormPartsDialog", Block: "#BlockPartsDialog", Text: "#TextPartsDialog"};
    var partsControlChange  = "btn btn-success glyphicon glyphicon-pencil";
    var partsControlRemove  = "btn btn-danger glyphicon glyphicon-trash";
    var $partsForm          = $("#PartsForm");
    var $partsDialog        = $("#PartsDialog");
    var $partsAttrDialog    = $("#PartsAttrDialog");
    var $partsFormSlider    = $("#PartsFormSlider");

    var PartsControl        = React.createClass({
        render: function() {
            var list = this.props.data.map(function (parts) {
                return (
                <li target={parts._id} className="list-group-item parts-list-child">
                    {parts["Parts[title]"]} [{parts["Parts[type]"]} Parts]
                    <div className={partsControlChange}></div>
                    <div className={partsControlRemove}></div>
                </li>
                );
            });
            return (
                <ul className="parts-control list-group col-xs-3 col-md-3 col-sm-3 container-fluid">
                    {list}
                </ul>
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
            parts               = getFormData(this, {_id: "__Parts" + data.length});
            parts["Parts[id]"]  = "";

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
        parts.html  = res;
        data.push(parts);
        partsRefresh();
        $("#" + parts._id + " .parts-control .glyphicon-trash").bind("click", function () {
            var id  = $(this).parent().parent().attr("id");

            for (var i = 0; i < data.length; i++) {
                if (data[i]._id !== id) continue;
                data.splice(i, 1);
                break;
            }
            partsRefresh();
        });
        $("#" + parts._id + " .parts-control .glyphicon-pencil").bind("click", function () {
            var id          = $(this).parent().parent().attr("id");
            var $contents   = $("#" + id).find(".parts-contents").children();
            var parts;

            for (var i = 0; i < data.length; i++) {
                if (data[i]._id !== id) continue;
                parts   = data[i];
                break;
            }
            $(".parts-active").removeClass("parts-active");
            $contents.addClass("parts-active");
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

    function getFormData(form, ret) {
        $(form).find(inputTagList).each(function () {
            var type    = $(this).prop("type");
            var name    = $(this).attr("name");
            var value   = $(this).val();

            if (type === "checkbox") value = $(this).prop("checked") ? 1 : "";

            ret[name] = value;
        });
        return ret;
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
