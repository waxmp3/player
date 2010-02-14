<?php

if (version_compare(PHP_VERSION, '5.0.0', '<')) {
  header("Content-type","text/html");
  print <<<END
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title></title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  </head>
  <body>
<div id="google_translate_element" style="text-align: right; border:0; padding: 1em;"></div><script>
function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: 'en'
  }, 'google_translate_element');
}
</script><script src="http://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
<p style="text-align:center"><a href="http://waxmp3.com">Wax MP3</a> needs PHP 5 or greater.  It can't use PHP 4.</p>
  </body>
</html>

END;
exit;
}
  
require_once("everybody/stations.php");

$stationFile = getUserStationFile();
if( $stationFile )
  define('DEFAULT_XSPF',$stationFile);

include_once("everybody/index.php");
exit;

/*****************************************
 * Copyright 2009 Wax MP3 Corp. <email@waxmp3.com>
 * http://waxmp3.com
 * 
 * This file is part of the Wax MP3 player.
 * 
 * The Wax MP3 player is free software: you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * The Wax MP3 player is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with the Wax MP3 player.  If not, see
 * <http://www.gnu.org/licenses/>.
 * *****************************************/

?>
