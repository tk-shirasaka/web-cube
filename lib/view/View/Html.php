<?php
App::Uses("View", "Viewer");

class Html extends Viewer {
    private $_html  = "";

    private function _render($tag_type, $data) {
        $ret = "";

        $id             = "";
        $class          = "";
        $type           = "";
        $name           = "";
        $title          = "";
        $method         = "";
        $action         = "";
        $contents       = "";
        $placeholder    = "";
        $children       = "";

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
        case "Table" :
        case "Text" :
        case "Header" :
        case "Input" :
            $id     = ($data["Parts"]["id"]);
            $class .= "col-xs-". $data["Parts"]["cols"]. " ";
            $class .= "col-md-". $data["Parts"]["cols"]. " ";
            $class .= ($data["Parts"]["class"]) ? $data["Parts"]["class"] : "";
            switch ((string) $tag_type) {
                case "Header" :
                    $type       = $data["Attr"]["type"];
                    $contents   = $data["Attr"]["contents"];
                    if ($this->{$tag_type}) eval("\$children .= \"{$this->{$tag_type}}\";");
                    $tag_type   = "Block";
                    break;
                case "Input" :
                    $title      = $data["Parts"]["title"];
                    break;
                case "Table" :
                    $thead      = "";
                    $tbody      = "";
                case "Form" :
                case "Block" :
                    if (isset($data["Child"])) {
                        foreach ($data["Child"] as $key => $val) {
                            if ($tag_type === "Table") {
                                if ($val["Parts"]["type"] === "Thead") $thead .= $this->_render($key, $val);
                                if ($val["Parts"]["type"] === "Tbody") $tbody .= $this->_render($key, $val);
                            } else {
                                $children .= $this->_render($key, $val);
                            }
                        }
                    }
                    break;
            }
            break;
        default :
            if (isset($data["Parts"])) $ret .= $this->_render($data["Parts"]["type"], $data);
            break;
        }

        if ($this->{$tag_type}) eval("\$ret .= \"{$this->{$tag_type}}\";");

        return $ret;
    }

    private function _mergeQuery() {
        if (Core::Get()->getConfig("Configure")["Debug"]) {
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
        }
    }
    public function view() {
        $this->_mergeQuery();
        $this->_html    = "";
        $this->_html    = $this->_render("Layout", $this->_page);

        echo $this->_html;
    }
}
