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
            return (
                <div className="parts-control">
                    <div className={partsControlChange}></div>
                    <div className={partsControlRemove}></div>
                </div>
            );
        }
    });

    var PartsBox            = React.createClass({
        render: function() {
            var parts = this.props.data.map(function (parts) {
                return (
                <div id={parts._id} className="parts-box">
                    <PartsControl />
                    <span dangerouslySetInnerHTML={{__html: parts.html}} />
                </div>
                );
            });
            return (
                <div>
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
            var parts   = {_id: "__Parts" + data.length};
            e.preventDefault();
            $(this).find(inputTagList).each(function () {
                var name    = $(this).attr("name");
                var value   = $(this).val();
                parts[name] = value;
            });

            $.ajax({
                type    : $(this).attr("method"),
                url     : $(this).attr("action"),
                data    : parts,
            }).done(function(response) {
                parts.html  = response;
                data.push(parts);
                $("#PartsUpdate").trigger("click");
                $("#" + parts._id + " .parts-control .glyphicon-trash").bind("click", function () {
                    var id  = $(this).parent().parent().attr("id");

                    for (var i = 0; i < data.length; i++) {
                        if (data[i]._id !== id) continue;
                        data.splice(i, 1);
                        break;
                    }
                    $("#PartsUpdate").trigger("click");
                })
            });
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

    function applyChange(parts) {
        var now = parts;
    }

    init();

    React.render(
        <PartsContainer />,
        document.getElementById('Main')
    );
});
</script>
