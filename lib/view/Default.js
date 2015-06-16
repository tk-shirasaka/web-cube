<script type="text/jsx">
$(function () {
    var data                = [];
    var $partsForm          = $("#PartsForm");
    var $partsFormSlider    = $("#PartsFormSlider");

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
    })

    $partsForm.submit(function (e) {
        var parts   = {};
        e.preventDefault();
        $(this).find("input").each(function () {
            var name    = $(this).attr("name");
            var value   = $(this).val();
            parts[name] = value;
        });
        data.push(parts);
    });

    /*
    React.render(
        <PartsBox parts={parts} />,
        document.getElementById('Main')
    );
    */
});
</script>
