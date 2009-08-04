<?php

require_once("config.php");
require_once("stations.php");
require_once("XSPFFileReader.php");

  // come what may, this is our return type
header("Content-type: text/html; charset=utf-8");

/****************************************
 * error handling
 */
function fatalError($msg){
  $frowny = ":-(";  // work around bug in emacs php mode
  print <<<END
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>Error</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style type="text/css">
 /*<![CDATA[*/
body {
font-family: sans-serif;
text-align: center;
margin-top: 5em;
}
h1 { color: red }
  /*]]>*/
    </style>
  </head>
  <body>
    <h1>$frowny</h1>
    <div>$msg</div>
  </body>
</html>
END;
 exit; 
}

function handleException($exception){
  fatalError($exception->getMessage());
  exit;
}
set_exception_handler('handleException');

/****************************************
 * input validation and management
 */

function getTrackID(){
  if( ! isset($_GET['track']) ) return(false);
  if( "" == $_GET['track'] ) return(false);
  return($_GET['track']);
  }

/****************************************
 * gulp the config files
 */

$xspf = "";
$playlistSource = DEFAULT_XSPF;

$xspf = new XSPFFileReader($playlistSource);

// this HTML template is the display logic
if( ! is_readable("everybody/template.html") )
  fatalError("Site configuration error: cannot read html template");
$template = file_get_contents("everybody/template.html");

/****************************************
 * mash xspf and html together
 */

$vars['STATIONS'] = getStationHTML();

$vars['TRACKJSON'] = $xspf->getTrackJSON();
if( ! $vars['TRACKJSON'] )
  fatalError("Bad track list in playlist");

$annotation = $xspf->getAnnotation();
if( ! $annotation )
  $annotation = "";

$image = $xspf->getImage();
if( ! $image )
  $image = "everybody/img/radiotower.jpg";

$title = $xspf->getTitle();
if( ! $title )
  $title = "Wax MP3";

$vars['SERP'] = $xspf->metaRel("http://freshhotradio.com/meta/serp");
if( ! $vars['SERP'] )
  $vars['SERP'] = "Another Wax MP3 station.";

$vars['INFO'] = $xspf->getInfo();
if( ! $vars['INFO'] )
  $vars['INFO'] = "http://waxmp3.com";

$vars['STARTINGTRACK'] = "";
$vars['PAGETITLE'] =  "$title -- $annotation";
$vars['SUBTITLE'] = $annotation;
$vars['FACEBOOK'] =<<<END
<!-- for Facebook embedding. Docs at http://www.facebook.com/share_partners.php -->
<meta name="title" content="{$title}" />
<meta name="description" content="{$annotation}" />
<link rel="image_src" href="{$image}" />
END;

/**********
 * if this is a request for a specific track, customize the page for it
 */
if($trackID = getTrackID()){

  if( ! $xspf->getTrack($trackID) )
    fatalError("No such track $trackID");

  $vars['STARTINGTRACK'] = $trackID;

  $vars['AUDIOLOCATION'] =  $xspf->getTrackLocation($trackID);
  if( ! $vars['AUDIOLOCATION'] )
    fatalError("no location for track $trackID");

  $vars['AUDIOTITLE'] =  $xspf->getTrackTitle($trackID);
  if( ! $vars['AUDIOTITLE'] )
    fatalError("no title for track $trackID");

  $vars['AUDIOARTIST'] =  $xspf->getTrackCreator($trackID);
  if( ! $vars['AUDIOARTIST'] )
    fatalError("no creator for track $trackID");

  $trackInfo = $xspf->getTrackInfo($trackID);
  if( ! $trackInfo )
    fatalError("No info link for track $trackID");

  $vars['AUDIOALBUM'] =  htmlentities($_SERVER["HTTP_HOST"]);

  $vars['PAGETITLE'] =  $vars['AUDIOARTIST']." - ".$vars['AUDIOTITLE'];
  $vars['SUBTITLE'] = $vars['AUDIOARTIST']." / ".$vars['AUDIOTITLE'];
  $vars['AUDIOANNOTATION'] =  "http://waxmp3.com";

  // for Facebook embedding. Docs at http://www.facebook.com/share_partners.php
  $image = $xspf->getTrackImage($trackID);
  if( empty($image) )
    $image = "";
  $vars['FACEBOOK'] =<<<END
    <!-- facebook audio required -->
    <meta name="medium" content="audio" />
    <meta name="title" content="{$vars['PAGETITLE']}" />
    <meta name="description" content="{$vars['AUDIOANNOTATION']}" />
    
    <link rel="image_src" href="$image" />
    <link rel="audio_src" href="{$vars['AUDIOLOCATION']}" />
    <meta name="audio_type" content="audio/mpeg" />
    <!-- facebook audio optional -->
    <meta name="audio_title" content="{$vars['AUDIOTITLE']}" />
    <meta name="audio_artist" content="{$vars['AUDIOARTIST']}" />
    <meta name="audio_album" content="{$vars['AUDIOALBUM']}" />		    
END;


 }

// replace stubs in html template with data
$copy = "".$template;
foreach(array_keys($vars) as $key){
  $copy = str_replace("PLACEHOLDER_".$key,$vars[$key],$copy);
}
print $copy;
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
