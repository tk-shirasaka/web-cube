$(function () {
    $("[parts-markdown=1]").each(function () {
        $(this).html(marked($(this).html().trim()));
    });
});

