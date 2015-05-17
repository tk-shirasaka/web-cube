<?php

include_once CORE. DS. "main.php";
include_once CORE. DS. "Common.php";
include_once CORE. DS. "App.php";

/**
 * Common functions
 */
function array_search_key($needle, $haystack, &$ret = []) {
    if (is_array($needle)) {
        foreach ($needle as $key => $val) {
            if (is_numeric($key)) {
                if (is_array($val)) {
                    array_search_key($val, $haystack, $ret);
                } else {
                    $ret[$val] = array_search_key($val, $haystack);
                }
            } else if (isset($haystack[$key])) {
                array_search_key($val, $haystack[$key], $ret);
            } else if (array_search($key, $haystack) !== false) {
                array_search_key($val, $haystack[$key], $ret);
            }
        }
    } else if (isset($haystack[$needle])) {
        $ret[] = $haystack[$needle];
    } else {
        foreach ($haystack as $val) {
            if (is_array($val) and isset($val[$needle])) $ret[] = $val[$needle];
        }
    }

    return $ret;
}

/**
 * Lib only path
 */
$build_option = ["lib" => true, "app" => false];
App::Build("Utility", "Utility", $build_option);

/**
 * App and Lib path
 */
$build_option = ["lib" => true];
App::Build("Config", "Config", $build_option);
App::Build("Schema", "Schema", $build_option);
App::Build("Model", "Model", $build_option);
App::Build("View", "View", $build_option);

Core::Get()->start();
