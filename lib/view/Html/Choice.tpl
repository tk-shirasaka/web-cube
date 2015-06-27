<div class="form-group {$class}">
    <label class="{$l_col} control-label" for="{$id}">{$title}</label>
    <div class="{$i_col}">
        <{$tag_type} id="{$id}" name="{$name}" type="{$type}" class="form-control" value="{$value}">
            $children
        </{$tag_type}>
    </div>
</div>
