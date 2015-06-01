<?php
App::Uses("View", "Viewer");

class Html extends Viewer {
    private $_html  = "";

    public function init() {
        $this->_page    = [
            "Head"  => [
                "Meta"  => null,
                "Title" => $this->_page[0]["Page"]["name"]
            ],
            "Body"  => $this->_page,
        ];
    }
    private function _render($tag_type, $data) {
        switch ((string) $tag_type) {
        case "Html" :
        case "Head" :
        case "Body" :
            $this->_html   .= $this->Tags[$tag_type]["Start"];
            foreach ($data as $key => $val) {
                $this->_render($key, $val);
            }
            $this->_html   .= $this->Tags[$tag_type]["End"];
            break;
        case "Meta" :
        case "Title" :
        case "H1" :
        case "H2" :
        case "H3" :
        case "H4" :
        case "H5" :
        case "H6" :
            $this->_html   .= $this->Tags[$tag_type]["Start"];
            $this->_html   .= $data;
            $this->_html   .= $this->Tags[$tag_type]["End"];
            break;
        case "Block" :
        case "Form" :
        case "Text" :
        case "Header" :
        case "Input" :
            $class  = "class=\"";
            $class .= ($data["Parts"]["class"]) ? $data["Parts"]["class"] : "";
            $class .= " col-xs-". $data["Parts"]["cols"];
            $class .= " col-md-". $data["Parts"]["cols"];
            $class .= "\"";
            switch ((string) $tag_type) {
                case "Header" :
                    $this->_html   .= sprintf($this->Tags["Block"]["Start"], $class);
                    $tag            = "H". $data["Attr"]["type"];
                    $this->_render($tag, $data["Attr"]["contents"]);
                    $this->_html   .= $this->Tags["Block"]["End"];
                    break;
                case "Input" :
                    if ($data["Parts"]["title"]) {
                        $this->_html   .= $this->Tags["Label"]["Start"];
                        $this->_html   .= $data["Parts"]["title"];
                    }
                    $this->_html   .= $this->Tags[$tag_type]["Start"];
                    $this->_html   .= $this->Tags[$tag_type]["End"];
                    if ($data["Parts"]["title"]) $this->_html .= $this->Tags["Label"]["End"];
                    break;
                case "Block" :
                case "Form" :
                    $this->_html   .= sprintf($this->Tags[$tag_type]["Start"], $class);
                    if (isset($data["Child"])) {
                        foreach ($data["Child"] as $key => $val) {
                            $this->_render($key, $val);
                        }
                    }
                    $this->_html   .= $this->Tags[$tag_type]["End"];
                    break;
            }
            break;
        default :
            if (isset($data["Parts"])) $this->_render($data["Parts"]["type"], $data);
            break;
        }
    }

    public function view() {
        $this->_html    = "";
        $this->_render("Html", $this->_page);

        echo $this->_html;
    }
}
