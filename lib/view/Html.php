<?php
App::Uses("View", "Viewer");

class Html extends Viewer {
    private $_html      = "";
    private $_row       = 0;
    private $_offset    = 0;
    private $_parent    = null;

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
        $this->_row     = 0;
        $this->_offset  = 0;
        $this->_parent  = null;
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

        eval("\$ret .= \"{$this->{$tag}}\";");

        return $ret;
    }
    private function _hasChildTag($tag, $parts, $attr, $child, $options = []) {
        $children   = $this->_getChildren($child);
        return $this->_commonTag($tag, $parts, $attr, compact("children") + $options);
    }

    private function _render($tag_type, $data) {
        static $row     = 0;
        static $parent  = null;

        $ret = "";

        $id             = "";
        $class          = "";
        $type           = "";
        $name           = "";
        $title          = "";
        $method         = "";
        $action         = "";
        $contents       = "";
        $children       = "";

        if (isset($data["Parts"])) {
            if ($this->_row !== (int) $data["Parts"]["rows"]) {
                $this->_row    = (int) $data["Parts"]["rows"];
                $this->_offset = 0;
            }
            $this->_offset = (int) $data["Parts"]["cols"];
        }

        switch ((string) $tag_type) {
        case "Layout" :
            $title  = $data[0]["Page"]["name"];
            foreach ($data as $key => $val) {
                $contents  .= $this->_render($key, $val); 
            }
            break;
        case "Thead" :
        case "Tbody" :
            $type   = ($tag_type === "Thead") ? "th" : "td";
            $class  = $data["Parts"]["class"];
            foreach ($data["Attr"]["contents"] as $contents) {
                eval("\$children .= \"{$this->TableContents}\";");
            }
            $tag_type = "Tr";
            break;
        case "Form" :
        case "Block" :
        case "Navi" :
        case "Table" :
            $method = strtolower($tag_type);
            $ret    = $this->{$method}($data["Parts"], $data["Attr"], $data["Child"]);
            break;
        case "Text" :
        case "Header" :
        case "Input" :
            $method = strtolower($tag_type);
            $ret    = $this->{$method}($data["Parts"], $data["Attr"]);
            break;
        default :
            if (isset($data["Parts"])) $ret .= $this->_render($data["Parts"]["type"], $data);
            break;
        }

        if ($this->{$tag_type} and !$ret) eval("\$ret .= \"{$this->{$tag_type}}\";");
        if (isset($data["Parts"])) {
            $this->_offset = (int) $data["Parts"]["cols"];
        }

        return $ret;
    }

    private function _mergeError() {
        if (Core::Get()->getConfig("Configure.Debug")) {
            $error              = Core::Get()->getError();
            $thead              = ["Parts" => ["class" => "", "type" => "Thead"], "Attr" => ["contents" => ["Level", "Place", "Message", "Context"]]];
            $tbody              = ["Parts" => ["class" => "danger", "type" => "Tbody"], "Attr" => ["contents" => []]];
            $table              = ["Parts" => ["id" => "QueryDump", "class" => "table table-striped table-hover", "type" => "Table", "cols" => 12], "Child" => []];
            $table["Child"][]   = $thead;

            foreach ($error as $val) {
                $tbody["Attr"]["contents"]  = array_values($val);
                $table["Child"][]           = $tbody;
            }
            $this->_page[]      = $table;
            Core::Get()->flushPropaty("error");
        }
    }

    private function _mergeQuery() {
        if (Core::Get()->getConfig("Configure.Debug")) {
            $query              = Core::Get()->getQuery();
            $thead              = ["Parts" => ["class" => "", "type" => "Thead"], "Attr" => ["contents" => ["#", "SQL", "Time"]]];
            $tbody              = ["Parts" => ["class" => "", "type" => "Tbody"], "Attr" => ["contents" => []]];
            $table              = ["Parts" => ["id" => "QueryDump", "class" => "table table-striped table-hover", "type" => "Table", "cols" => 12], "Child" => []];
            $table["Child"][]   = $thead;

            foreach ($query as $key => $val) {
                $tbody["Parts"]["class"]    = $val["class"];
                $tbody["Attr"]["contents"]  = [$key, $val["query"], $val["time"]];
                $table["Child"][]           = $tbody;
            }
            $this->_page[]      = $table;
            Core::Get()->flushPropaty("query");
        }
    }

    protected function table($parts, $attr, $child) {
        $thead  = "";
        $tbody  = "";
        foreach ($child as $key => $val) {
            if ($val["Parts"]["type"] === "Thead") $thead .= $this->_render($key, $val);
            if ($val["Parts"]["type"] === "Tbody") $tbody .= $this->_render($key, $val);
        }

        return $this->_hasChildTag(ucfirst(__FUNCTION__), $parts, $attr, $child, compact("thead", "tbody"));
    }

    protected function form($parts, $attr, $child) {
        $title_parts            = $parts;
        $title_parts["id"]     .= "Title";
        $title_parts["cols"]    = 0;
        $title_parts["rows"]    = 0;
        $title_parts["offset"]  = 0;
        $title_parts["class"]   = null;
        $title  = $this->header($title_parts, ["type" => 3, "contents" => $data["Parts"]["title"]]);

        return $this->_hasChildTag(ucfirst(__FUNCTION__), $parts, $attr, $child, compact("title"));
    }

    protected function block($parts, $attr, $child) {
        return $this->_hasChildTag(ucfirst(__FUNCTION__), $parts, $attr, $child);
    }

    protected function navi($parts, $attr, $child) {
        return $this->_hasChildTag(ucfirst(__FUNCTION__), $parts, $attr, $child);
    }

    protected function header($parts, $attr) {
        $type       = $attr["type"];
        $contents   = $attr["contents"];
        eval("\$children   .= \"{$this->{ucfirst(__FUNCTION__)}}\";");

        return $this->_commonTag("Block", $parts, $attr, compact("type", "contents", "children"));
    }

    protected function input($parts, $attr) {
        $title          = $parts["title"];
        $name           = "";
        $placeholder    = "";

        return $this->_commonTag(ucfirst(__FUNCTION__), $parts, $attr, compact("title", "name", "placeholder"));
    }

    public function view() {
        $this->_mergeError();
        $this->_mergeQuery();
        $this->_html    = "";
        $this->_html    = $this->_render("Layout", $this->_page);

        echo $this->_html;
    }
}
