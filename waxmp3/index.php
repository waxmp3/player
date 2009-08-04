<?php

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
