<?php

  // xspf file is basically the config file
class XSPFFileReader {

  var $xml;
  var $index = Array();

  // get value of the first meta element with matching rel value
  // see http://xspf.org/xspf-v1.html#rfc.section.4.1.1.2.12
  function metaRel($rel,$track=null){
    if( $track ){
      foreach($track->meta as $meta ){
	if( $meta['rel'] == $rel )
	  return($meta);
      }
      return;
    }
    foreach($this->xml->meta as $meta ){
      if( $meta['rel'] == $rel )
	return($meta);
    }
  }

function getTrackID($_SimpleXMLElement){
  foreach($_SimpleXMLElement->attributes("http://www.w3.org/XML/1998/namespace") as $a => $b)
    if( "id" == $a )
      return($b);
  return($this->metaRel("http://freshhotradio.com/meta/serial",$_SimpleXMLElement));
}

 function __construct($filename){
   $this->xml = @simplexml_load_file($filename);
    if( !$this->xml || !$this->xml->trackList || count(!$this->xml->trackList->track) < 1 )
      throw new Exception("Either the playlist is corrupted or simplexml_load_file is broken.");

    // construct index of IDs for easy lookup later
    foreach($this->xml->trackList->track as $track){
      $id = (string) $this->getTrackID($track);
      if( $id )
	$this->index["".$id] = $track;
    }

  }

  function getAnnotation(){ return($this->xml->annotation); }
  function getImage(){ return($this->xml->image); }
  function getInfo(){ return($this->xml->info); }
  function getTitle(){ return($this->xml->title); }

  function getTrack($id){
    if( isset($id) /* && is_string($id) */ && isset($this->index[$id]) )
      return($this->index[$id]);
  }
  function getTrackCreator($id){ $t = $this->getTrack($id); if( $t ) return($t->creator); }
  function getTrackImage($id){ $t = $this->getTrack($id); if( $t ) return($t->image); }
  function getTrackInfo($id){ $t = $this->getTrack($id); if( $t ) return($t->info); }
  function getTrackLocation($id){ $t = $this->getTrack($id); if( $t ) return($t->location); }
  function getTrackTitle($id){ $t = $this->getTrack($id); if( $t ) return($t->title); }

  function getTrackJSON(){

    if( ! $this->xml->trackList || ! $this->xml->trackList->track || count($this->xml->trackList->track) < 1 )
      return(FALSE);

    $rowJSON = Array();
    foreach( $this->xml->trackList->track as $track ){
      $rowJSON[] =
	Array(
	      "creator" => (string) $track->creator,
	      "image" => (string) $track->image,
	      "info" => (string) $track->info,
	      "location" => (string) $track->location,
	      "id" => (string) $this->getTrackID($track),
	      "title" => (string) $track->title
	      );
    }
    return(json_encode($rowJSON));

  }

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
