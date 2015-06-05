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
        $contents       = "";
        $placeholder    = "";
        $children       = "";

        switch ((string) $tag_type) {
        case "Layout" :
            $title  = $data[0]["Page"]["title"];
            foreach ($data as $key => $val) {
                $contents  .= $this->_render($key, $val); 
            }
            break;
        case "Block" :
        case "Form" :
        case "Text" :
        case "Header" :
        case "Input" :
            $id     = ($data["Parts"]["id"]);
            $class .= ($data["Parts"]["class"]) ? $data["Parts"]["class"] : "";
            $class .= " col-xs-". $data["Parts"]["cols"];
            $class .= " col-md-". $data["Parts"]["cols"];
            $class .= "\"";
            switch ((string) $tag_type) {
                case "Header" :
                    $type       = $data["Attr"]["type"];
                    $contents   = $data["Attr"]["contents"];
                    if ($this->{$tag_type}) eval("\$children = \"{$this->{$tag_type}}\";");
                    $tag_type   = "Block";
                    break;
                case "Input" :
                    $title      = $data["Parts"]["title"];
                    break;
                case "Block" :
                case "Form" :
                    if (isset($data["Child"])) {
                        foreach ($data["Child"] as $key => $val) {
                            $this->_render($key, $val);
                        }
                    }
                    break;
            }
            break;
        default :
            if (isset($data["Parts"])) $this->_render($data["Parts"]["type"], $data);
            break;
        }

        if ($this->{$tag_type}) eval("\$ret = \"{$this->{$tag_type}}\";");

        return $ret;
    }

    public function view() {
        $this->_html    = "";
        $this->_html    = $this->_render("Layout", $this->_page);

        echo $this->_html;
    }
}
