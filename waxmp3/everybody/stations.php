<?php

function getUserStationName(){
  if( ! isset($_GET['station']) )
    return(FALSE);
  if( FALSE !== strpos($_GET['station'],".." ) )
    return(FALSE); // security
  return($_GET['station']);
  }

function getStationHTML(){

  $files = scandir("justyou/stations");
  if( FALSE === $files )
    return(FALSE);
  if( count($files) < 4 ) // including . and ..
    return(FALSE); 

  $current = getUserStationName();

  $html =<<<END
    <img src="everybody/img/radiodial.png" alt="station" /> <br /><select id='stations'>
<option value=''></option>
END;
  foreach($files as $filename){
    $path_parts = pathinfo($filename);
    if( "." == $path_parts['filename'] || "" == $path_parts['filename'] )
      continue;
    if( $current == $path_parts['filename'] )
      $selected = "selected";
    else
      $selected = "";
    $html .=<<<END
<option value="{$path_parts['filename']}" $selected>{$path_parts['filename']}</option>      

END;
  }
  $html .= "</select>";
  return($html);
}

function getUserStationFile(){
  $station = getUserStationName();
  if( ! $station )
    return(FALSE);
  $filepath = "justyou/stations/".$station.".xspf";
  return($filepath);
}

function getDefaultStationFile(){
  return("justyou/config.xspf");
}

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
