<?php

class I18n extends Common {
    private $_locale        = null;

    /**
     * Sytem infomation
     */
    public static   $SYS_ADMIN;
    public static   $SYS_USER;
    public static   $SYS_PASSWORD;

    /**
     * Page / Parts
     */
    public static   $PAGE_TOP;
    public static   $PAGE_HEADER;
    public static   $PAGE_FOOTER;
    public static   $PAGE_SIDE_BAR;
    public static   $PAGE_BLOCK;
    public static   $PAGE_FORM;
    public static   $PAGE_BUTTON;
    public static   $PAGE_IMAGE;
    public static   $PAGE_WIDTH;
    public static   $PAGE_COLUMN;
    public static   $PAGE_ROW;

    /**
     * Address
     */
    public static   $ADDR_ZIP_CODE;
    public static   $ADDR_TEL;
    public static   $ADDR_CITY;
    public static   $ADDR_ADDRESS;
    public static   $ADDR_STATS;

    /**
     * Time
     */
    public static   $TIME_DATETIME;
    public static   $TIME_DATE;
    public static   $TIME_YEAR;
    public static   $TIME_MONTH;
    public static   $TIME_DAY;
    public static   $TIME_TIME;
    public static   $TIME_HOUR;
    public static   $TIME_MINUTE;
    public static   $TIME_SECOND;
    public static   $TIME_FORMAT;

    /**
     * Common
     */
    public static   $COM_NEXT;
    public static   $COM_PREV;

    private function _init() {
        $locale         = $this->Locales[$this->getParams("Locale")];
        $this->_locale  = $this->{$locale};

        foreach ($this->Dictionary as $category => $keys) {
            foreach ($keys as $key) {
                $const_key          = strtoupper($category. "_". $key);
                $const_val          = (isset($this->_locale[$category][$key])) ? $this->_locale[$category][$key] : "";
                self::${$const_key} = $const_val;
            }
        }
    }

    public function init() {
        if (!$this->_locale) $this->_init();
    }
}
