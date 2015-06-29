<?php
App::Uses("View", "Viewer");

class Html extends Viewer {
    private $_html      = "";
    private $_row       = 0;
    private $_offset    = 0;
    private $_parent    = null;

    private function _refresh() {
        $this->_html    = "";
        $this->_row     = 0;
        $this->_offset  = 0;
        $this->_parent  = null;
    }

    private function _getModel($model) {
        $model  = explode(".", $model);
        $root   = array_shift($model);
        $class  = array_shift($model);
        $method = array_shift($model);

        App::Uses($root, $class);

        return call_user_func_array([$this->{"{$root}.{$class}"}, $method], $model);
    }
    private function _getClass($parts) {
        $ret    = "";

        if (isset($parts["offset"]) and $this->_offset < (int) $parts["offset"]) {
            $ret   .= "col-xs-offset-". ($parts["offset"] - $this->_offset). " ";
            $ret   .= "col-md-offset-". ($parts["offset"] - $this->_offset). " ";
            $ret   .= "col-sm-offset-". ($parts["offset"] - $this->_offset). " ";
        }
        if (isset($parts["col"])) {
            $ret   .= "col-xs-". $parts["col"]. " ";
            $ret   .= "col-md-". $parts["col"]. " ";
            $ret   .= "col-sm-". $parts["col"]. " ";
        }
        if (isset($parts["class"])) {
            $ret   .= $parts["class"];
        }

        return $ret;
    }

    private function _getChildren($child) {
        $ret            = "";
        $row            = $this->_row;
        $offset         = $this->_offset;
        $parent         = $this->_parent;
        $this->_refresh();
        foreach ($child as $key => $val) {
            $ret .= $this->_render($key, $val);
        }
        $this->_row     = $row;
        $this->_offset  = $offset;
        $this->_parent  = $parent;

        return $ret;
    }

    private function _commonTag($tag, $parts, $attr, $options = []) {
        $id         = (isset($parts["id"])) ? $parts["id"] : "";
        $class      = $this->_getClass($parts);

        foreach ($options as $key => $val) {
            ${$key} = $val;
        }

        eval("\$ret = \"{$this->{$tag}}\";");

        return $ret;
    }
    private function _hasChildTag($tag, $parts, $attr, $child, $options = []) {
        $children   = $this->_getChildren($child);
        return $this->_commonTag($tag, $parts, $attr, compact("children") + $options);
    }

    private function _render($tag_type, $data) {
        $ret        = "";
        $contents   = "";

        if ($this->{$tag_type} and isset($data["Parts"])) {
            if ($this->_row !== (int) $data["Parts"]["row"] or (int) $data["Parts"]["row"] === 0) {
                if ($this->_row) $ret .= $this->block(["id" => "", "class" => "", "col" => 12, "offset" => 0], [], []);
                $this->_row     = (int) $data["Parts"]["row"];
                $this->_offset  = 0;
            }
        }

        switch ((string) $tag_type) {
        case "Layout" :
            $title      = $data[0]["Page"]["title"];
            $locale     = $this->getParams("Locale");
            $script     = $this->Script;
            $style      = $this->Style;
            foreach ($data as $key => $val) {
                $contents  .= $this->_render($key, $val); 
            }
            $contents  .= $this->_render("", $this->_getError());
            $contents  .= $this->_render("", $this->_getQuery());
            break;
        case "Form" :
        case "Block" :
        case "Table" :
        case "Link" :
        case "Text" :
        case "Header" :
        case "Input" :
        case "Options" :
        case "Choice" :
            if (empty($data["Attr"]))   $data["Attr"]   = [];
            if (empty($data["Child"]))  $data["Child"]  = [];
            $method = lcfirst($tag_type);
            $ret   .= $this->{$method}($data["Parts"], $data["Attr"], $data["Child"]);
            break;
        default :
            if (isset($data["Parts"])) $ret .= $this->_render($data["Parts"]["type"], $data);
            break;
        }

        if ($this->{$tag_type} and !$ret) {
            eval("\$ret .= \"{$this->{$tag_type}}\";");
        }
        if ($this->{$tag_type} and isset($data["Parts"])) {
            $this->_offset = max($this->_offset, (int) $data["Parts"]["offset"]) + (int) $data["Parts"]["col"];
        }

        return $ret;
    }

    private function _getError() {
        $ret    = [];
        $parts  = ["id" => "", "class" => "", "row" => 0, "col" => "", "offset" => "", "type" => ""];

        if (Core::Get()->getConfig("Configure.Debug")) {
            $error                  = Core::Get()->getError();
            $thead                  = ["Parts" => $parts, "Attr" => ["contents" => "Level\\\\Place\\\\Message\\\\Context"]];
            $thead["Parts"]["type"] = "Thead";
            $tbody                  = ["Parts" => $parts, "Attr" => ["contents" => []]];
            $tbody["Parts"]["type"] = "Tbody";
            $ret                    = ["Parts" => $parts, "Child" => []];
            $ret["Parts"]["id"]     = "Error";
            $ret["Parts"]["class"]  = "table table-striped table-hover";
            $ret["Parts"]["type"]   = "Table";
            $ret["Parts"]["col"]    = 12;
            $ret["Child"][]         = $thead;

            foreach ($error as $val) {
                $tbody["Attr"]["contents"]  = implode("\\\\", array_values($val));
                $ret["Child"][]             = $tbody;
            }
            Core::Get()->flushPropaty("error");
        }
        return $ret;
    }

    private function _getQuery() {
        $ret    = [];
        $parts  = ["id" => "", "class" => "", "row" => 0, "col" => "", "offset" => "", "type" => ""];

        if (Core::Get()->getConfig("Configure.Debug")) {
            $query                  = Core::Get()->getQuery();
            $thead                  = ["Parts" => $parts, "Attr" => ["contents" => "#\\\\SQL\\\\Time"]];
            $thead["Parts"]["type"] = "Thead";
            $tbody                  = ["Parts" => $parts, "Attr" => ["contents" => []]];
            $tbody["Parts"]["type"] = "Tbody";
            $ret                    = ["Parts" => $parts, "Child" => []];
            $ret["Parts"]["id"]     = "QueryDump";
            $ret["Parts"]["class"]  = "table table-striped table-hover";
            $ret["Parts"]["type"]   = "Table";
            $ret["Parts"]["col"]    = 12;
            $ret["Child"][]         = $thead;

            foreach ($query as $key => $val) {
                $tbody["Parts"]["class"]    = $val["class"];
                $tbody["Attr"]["contents"]  = implode("\\\\", [$key, $val["query"], $val["time"]]);
                $ret["Child"][]             = $tbody;
            }
            Core::Get()->flushPropaty("query");
        }
        return $ret;
    }

    protected function tableContents($parts, $attr, $child) {
        $children   = "";
        $type       = ($parts["type"] === "Thead") ? "th" : "td";
        foreach (explode("\\\\", $attr["contents"]) as $contents) {
            $children .= $this->_commonTag(ucfirst(__FUNCTION__), $parts, $attr, compact("contents", "type"));
        }
        return $this->_commonTag("Tr", $parts, $attr, compact("children"));
    }
    protected function table($parts, $attr, $child) {
        $thead  = "";
        $tbody  = "";
        foreach ($child as $key => $val) {
            $type       = ($val["Parts"]["type"] === "Thead") ? "thead" : "tbody";
            ${$type}    .= $this->tableContents($val["Parts"], $val["Attr"], []);
        }

        return $this->_commonTag(ucfirst(__FUNCTION__), $parts, $attr, compact("thead", "tbody"));
    }

    protected function form($parts, $attr, $child) {
        $action         = $attr["action"];
        $method         = ($attr["method"]) ? "POST" : "GET";
        $submit         = $this->button(["class" => "btn btn-primary"], ["type" => "submit", "contents" => $attr["submit"]], []);
        $cancel         = ($attr["cancel"]) ? $this->button(["class" => "btn btn-default"], ["type" => "reset", "contents" => $attr["cancel"]], []) : "";
        $title_parts    = ["id" => $parts["id"]."Title", "col" => 0, "row" => 0, "offset" => 0, "class" => "text-center"];
        $title          = $this->header($title_parts, ["type" => 3, "contents" => $parts["title"]], []);
        $block_parts    = ["id" => "", "col" => 0, "row" => 0, "offset" => 0, "class" => "text-center"];
        $block          = $this->block($block_parts, [], []);

        return $this->_hasChildTag(ucfirst(__FUNCTION__), $parts, $attr, $child, compact("title", "action", "method", "block", "submit", "cancel"));
    }

    protected function block($parts, $attr, $child) {
        if (!$attr)     $attr   = ["type" => 0];
        $class = "";
        switch ($attr["type"]) {
        case 0 :
            $type   = "div";
            break;
        case 1 :
            $type   = "navi";
            break;
        case 2 :
            $type   = "ul";
            break;
        case 3 :
            $type   = "li";
            break;
        }
        return $this->_hasChildTag(ucfirst(__FUNCTION__), $parts, $attr, $child, compact("type"));
    }

    protected function button($parts, $attr, $child) {
        $type       = $attr["type"];
        $contents   = $attr["contents"];

        return $this->_commonTag(ucfirst(__FUNCTION__), $parts, $attr, compact("type", "contents"));
    }

    protected function link($parts, $attr, $child) {
        $contents   = $parts["title"];
        $href       = $attr["path"];

        return $this->_commonTag(ucfirst(__FUNCTION__), $parts, $attr, compact("contents", "href"));
    }

    protected function header($parts, $attr, $child) {
        $type       = $attr["type"];
        $contents   = $attr["contents"];
        eval("\$children   = \"{$this->{ucfirst(__FUNCTION__)}}\";");
        $type       = "div";

        return $this->_commonTag("Block", $parts, $attr, compact("children", "type"));
    }

    protected function text($parts, $attr, $child) {
        $contents   = isset($attr["contents"]) ? $attr["contents"] : "";
        $multiple   = isset($attr["multiple"]) ? $attr["multiple"] : "";

        return $this->_commonTag(ucfirst(__FUNCTION__), $parts, $attr, compact("contents", "multiple"));
    }

    protected function input($parts, $attr, $child) {
        $title          = $parts["title"];
        $name           = isset($attr["name"])          ? $attr["name"] : "";
        $placeholder    = isset($attr["placeholder"])   ? $attr["placeholder"] : "";
        $l_col          = !empty($attr["label_col"])    ? "col-sm-". $attr["label_col"] : "";
        $i_col          = !empty($l_col)                ? "col-sm-". (12 - $attr["label_col"]) : "";
        if (empty($attr["type"])) $attr["type"] = 0;

        switch ((int) $attr["type"]) {
        case 0 :
            $type           = "text";
            $tag_type       = "input";
            break;
        case 1 :
            $type           = "number";
            $tag_type       = "input";
            break;
        case 2 :
            $type           = "";
            $tag_type       = "textarea";
            break;
        case 3 :
            $type           = "password";
            $tag_type       = "input";
            break;
        case 4 :
            $type           = "hidden";
            $tag_type       = "input";
            $parts["class"] = "hide";
            break;
        }
        return $this->_commonTag(ucfirst(__FUNCTION__), $parts, $attr, compact("tag_type", "title", "name", "type", "placeholder", "l_col", "i_col"));
    }

    protected function options($parts, $attr, $child) {
        $name       = isset($attr["name"]) ? $attr["name"] : "";
        $value      = $attr["value"];
        $contents   = $attr["contents"];
        if (empty($attr["type"])) $attr["type"] = 1;

        switch ((int) $attr["type"]) {
        case 1 :
            $type       = "";
            $tag_type   = "option";
            break;
        case 2 :
            $type       = "raddio";
            $tag_type   = "input";
            break;
        }

        return $this->_CommonTag(ucfirst(__FUNCTION__), $parts, $attr, compact("tag_type", "name", "type", "value", "contents"));
    }

    protected function choice($parts, $attr, $child) {
        $title  = $parts["title"];
        $name   = isset($attr["name"])          ? $attr["name"] : "";
        $l_col  = !empty($attr["label_col"])    ? "col-sm-". $attr["label_col"] : "";
        $i_col  = !empty($l_col)                ? "col-sm-". (12 - $attr["label_col"]) : "";
        $value  = "";
        if (empty($attr["type"])) $attr["type"] = 0;

        switch ((int) $attr["type"]) {
        case 0 :
            $type       = "checkbox";
            $tag_type   = "input";
            $value      = 1;
            break;
        case 1 :
        case 2 :
            switch ((int) $attr["type"]) {
            case 1 :
                $type       = "";
                $tag_type   = "select";
                break;
            case 2 :
                $type       = "radio";
                $tag_type   = "input";
                break;
            }
            if ($attr["model"]) {
                $child      = [];
                $cparts     = ["type" => "Options"] + $parts;
                foreach ($this->_getModel($attr["model"]) as $key => $val) {
                    $child[]    = ["Parts" => $cparts, "Attr" => ["value" => $key, "contents" => $val]];
                }
            }
            break;
        }
        return $this->_hasChildTag(ucfirst(__FUNCTION__), $parts, $attr, $child, compact("tag_type", "title", "l_col", "i_col", "name", "type", "value"));
    }

    public function view($type = "Layout", $data = null) {
        if (is_null($data)) $data = $this->getPage();
        $this->_refresh();

        $this->_html = $this->_render($type, $data);

        return $this->_html;
    }
}
