<script type="text/jsx">
$(function () {
    var data                = [];
    var partsControlChange  = "btn btn-success glyphicon glyphicon-pencil";
    var partsControlRemove  = "btn btn-danger glyphicon glyphicon-trash";
    var $partsForm          = $("#PartsForm");
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
                <div className="parts-box">
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
                    <button id="partsUpdate" className="hide" onClick={this.partsUpdate}></button>
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

        $partsForm.submit(function (e) {
            var parts   = {_id: data.length};
            e.preventDefault();
            $(this).find("input, select, textarea").each(function () {
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
                $("#partsUpdate").trigger("click");
            });
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
