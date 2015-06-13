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

    private function _getClass($parts) {
        $ret    = "";

        if ($this->_offset < (int) $parts["offset"]) {
            $ret   .= "col-xs-offset-". ($parts["offset"] - $this->_offset). " ";
            $ret   .= "col-md-offset-". ($parts["offset"] - $this->_offset). " ";
            $ret   .= "col-sm-offset-". ($parts["offset"] - $this->_offset). " ";
        }
        if ((int) $parts["cols"]) {
            $ret   .= "col-xs-". $parts["cols"]. " ";
            $ret   .= "col-md-". $parts["cols"]. " ";
            $ret   .= "col-sm-". $parts["cols"]. " ";
        }
        if ($parts["class"]) {
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
        $id         = $parts["id"];
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
            if ($this->_row !== (int) $data["Parts"]["rows"]) {
                if ($this->_row) $ret .= $this->block(["id" => "", "class" => "", "cols" => 0, "offset" => 0], [], []);
                $this->_row     = (int) $data["Parts"]["rows"];
                $this->_offset  = 0;
            }
        }

        switch ((string) $tag_type) {
        case "Layout" :
            $title      = $data[0]["Page"]["title"];
            $locale     = $this->_params["Locale"];
            foreach ($data as $key => $val) {
                $contents  .= $this->_render($key, $val); 
            }
            $contents  .= $this->_render("", $this->_getError());
            $contents  .= $this->_render("", $this->_getQuery());
            break;
        case "Form" :
        case "Block" :
        case "Table" :
        case "ListContents" :
            if (empty($data["Attr"]))   $data["Attr"]   = [];
            if (empty($data["Child"]))  $data["Child"]  = [];
            $method = lcfirst($tag_type);
            $ret   .= $this->{$method}($data["Parts"], $data["Attr"], $data["Child"]);
            break;
        case "Text" :
        case "Header" :
        case "Input" :
            if (empty($data["Attr"]))   $data["Attr"]   = [];
            $method = strtolower($tag_type);
            $ret   .= $this->{$method}($data["Parts"], $data["Attr"]);
            break;
        default :
            if (isset($data["Parts"])) $ret .= $this->_render($data["Parts"]["type"], $data);
            break;
        }

        if ($this->{$tag_type} and !$ret) {
            eval("\$ret .= \"{$this->{$tag_type}}\";");
        }
        if ($this->{$tag_type} and isset($data["Parts"])) {
            $this->_offset = (int) $data["Parts"]["cols"];
        }

        return $ret;
    }

    private function _getError() {
        $ret = [];

        if (Core::Get()->getConfig("Configure.Debug")) {
            $error          = Core::Get()->getError();
            $thead          = ["Parts" => ["id" => "", "class" => "", "type" => "Thead"], "Attr" => ["contents" => "Level\\\\Place\\\\Message\\\\Context"]];
            $tbody          = ["Parts" => ["id" => "", "class" => "danger", "type" => "Tbody"], "Attr" => ["contents" => []]];
            $ret            = ["Parts" => ["id" => "Error", "class" => "table table-striped table-hover", "type" => "Table", "cols" => 12], "Child" => []];
            $ret["Child"][] = $thead;

            foreach ($error as $val) {
                $tbody["Attr"]["contents"]  = implode("\\\\", array_values($val));
                $ret["Child"][]             = $tbody;
            }
            Core::Get()->flushPropaty("error");
        }
        return $ret;
    }

    private function _getQuery() {
        $ret = [];

        if (Core::Get()->getConfig("Configure.Debug")) {
            $query          = Core::Get()->getQuery();
            $thead          = ["Parts" => ["class" => "", "type" => "Thead"], "Attr" => ["contents" => "#\\\\SQL\\\\Time"]];
            $tbody          = ["Parts" => ["class" => "", "type" => "Tbody"], "Attr" => ["contents" => []]];
            $ret            = ["Parts" => ["id" => "QueryDump", "class" => "table table-striped table-hover", "type" => "Table", "cols" => 12], "Child" => []];
            $ret["Child"][] = $thead;

            foreach ($query as $key => $val) {
                $tbody["Parts"]["class"]    = $val["class"];
                $tbody["Attr"]["contents"]  = implode("\\\\", [$key, $val["query"], $val["time"]]);
                $ret["Child"][]             = $tbody;
            }
            Core::Get()->flushPropaty("query");
        }
        return $ret;
    }

    protected function tableContents($parts, $attr) {
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
            ${$type}    .= $this->tableContents($val["Parts"], $val["Attr"]);
        }

        return $this->_commonTag(ucfirst(__FUNCTION__), $parts, $attr, compact("thead", "tbody"));
    }

    protected function form($parts, $attr, $child) {
        $action         = $attr["action"];
        $method         = ($attr["method"]) ? "POST" : "GET";
        $submit         = $attr["submit"];
        $cancel         = $attr["cancel"];
        $title_parts    = ["id" => $parts["id"]."Title", "cols" => 0, "rows" => 0, "offset" => 0, "class" => "text-center"];
        $title          = $this->header($title_parts, ["type" => 3, "contents" => $parts["title"]]);
        $block_parts    = ["id" => "", "cols" => 0, "rows" => 0, "offset" => 0, "class" => "text-center"];
        $block          = $this->block($block_parts, [], []);

        return $this->_hasChildTag(ucfirst(__FUNCTION__), $parts, $attr, $child, compact("title", "action", "method", "block", "submit", "cancel"));
    }

    protected function block($parts, $attr, $child) {
        if (!$parts)    $parts  = ["class" => ""];
        if (!$attr)     $attr   = ["tag_type" => 0];
        $class = "";
        switch ($attr["tag_type"]) {
        case 0 :
            $type   = "div";
            $class  = "container-fluid";
            break;
        case 1 :
            $type   = "navi";
            $class  = "navi";
            break;
        case 2 :
            $type   = "ul";
            break;
        }
        $parts["class"] = "{$class} ". $parts["class"];
        return $this->_hasChildTag(ucfirst(__FUNCTION__), $parts, $attr, $child, compact("type"));
    }

    protected function listContents($parts, $attr, $child) {
        $contents   = (string) $parts["title"];
        return $this->_hasChildTag(ucfirst(__FUNCTION__), $parts, $attr, $child, compact("contents"));
    }

    protected function header($parts, $attr) {
        $type       = $attr["type"];
        $contents   = $attr["contents"];
        eval("\$children   = \"{$this->{ucfirst(__FUNCTION__)}}\";");
        $type       = "div";

        return $this->_commonTag("Block", $parts, $attr, compact("children", "type"));
    }

    protected function text($parts, $attr) {
        $contents   = $attr["contents"];

        return $this->_commonTag(ucfirst(__FUNCTION__), $parts, $attr, compact("contents"));
    }
    protected function input($parts, $attr) {
        $title          = $parts["title"];
        $name           = $attr["name"];
        $type           = ($attr["password"]) ? "password" : "text";
        $placeholder    = $attr["placeholder"];

        return $this->_commonTag(ucfirst(__FUNCTION__), $parts, $attr, compact("title", "name", "type", "placeholder"));
    }

    public function view() {
        $this->_refresh();

        $this->_html = $this->_render("Layout", $this->_page);

        echo $this->_html;
    }
}
