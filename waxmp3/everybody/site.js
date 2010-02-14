soundManager.url = 'everybody/swf/soundmanagerv277a-20080901/'; // directory where SM2 .SWFs live
soundManager.debugMode = false;
soundManager.useConsole = true;
soundManager.consoleOnly = true;
soundManager.useHighPerformance = true;
soundManager.defaultOptions.autoPlay = false;
soundManager.defaultOptions.multiShot = false;
soundManager.defaultOptions.onfinish =
  function(smsound){ MY.controller.handleTrackFinished(); };
soundManager.defaultOptions.onbeforefinishtime = 30000;
soundManager.defaultOptions.onbeforefinish =
  function(smsound){ MY.controller.handleBeforeFinish(); };

function LOG(msg){
  if( typeof console != 'undefined' ){
    var d = new Date();
    var str = msg+" ("+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+")";
    console.log(str);
  }
}

/****************************************
 * analytics and reporting
 ****************************************/

MY.LogManager = function(){
  if(typeof(_gat) != "object" )
    // FlashBlock will cause this to happen
    return; 

  /// Google Analytics
  var pageTracker = _gat._getTracker("UA-7085380-1");
  pageTracker._trackPageview();
};

/****************************************
 * history and bookmarking
 ****************************************/

MY.URLManager = function(){
    var self = this;

    self.paramReplace = function(haystack,needle,newvalue){

    var p1 = haystack.split("?");

    // if there is no query string at all, create one from scratch
    if( 1 == p1.length )
      return( haystack + "?track=" + newvalue);
    if( "" == p1[1])
      return( haystack + "track=" + newvalue);

    // break query string up into name=value segments and check each one
    var found = false;
    var ret = p1[0]+"?";
    var segs = p1[1].split("&");
    for( var i=0; i<segs.length; i++ ){

      var pair = segs[i].split("=");

      if( "" == pair[0] || "undefined" == typeof pair[0] ) // no name
	continue;

      ret += "&"+pair[0]+"=";

      if( needle == pair[0] ){
	found = true;
	ret += newvalue;
	continue;
      }

      if( "" == pair[1] )
	continue;
      if( "undefined" == typeof pair[1] )
	continue;

      ret += pair[1];
    }
  
    if( !found )
      ret += "&"+needle+"="+newvalue;

    return(ret);

  }

    self.makeTrackLink = function(trackID){
      return(self.paramReplace(document.location.href,"track",trackID));
    }

    // to allow people to link to specific tracks, we check the fragment
    // ID at load time.  If it contains a track ID, we initialize the
    // playlist to start there.
      self.getStartingTrack = function(){
	if( MY.startingTrack )
	  return(MY.startingTrack);
	var parsed = document.location.href.match(/[\?&](track=)([^&]*)/);
	if( parsed )
	  return(parsed[2]);
      }
	}

/****************************************
 * audio rendering
 ****************************************/

// see http://www.schillmania.com/projects/soundmanager2/ for player
// documentation





MY.Player = function(){
  var self = this;
  self.sID = null;

  //* note that the variable "soundManager" is defined in Soundmanager
  //* and is not part of our own namespace.

  soundManager.onload = function() {
    self.ready = true;
    self.error = false;
    MY.controller.handlePlayerReady();
  };

  soundManager.onerror = function() {
    LOG("onerror");
    self.ready = false;
    self.error = true;
    MY.controller.handleFatalError("<p>Sound error: Flash is not working.</p><p>iPhone, Ad Block, Flash Block not supported.</p>");
  };

  self.preloadNext = function(){
    LOG("preloading track in player");
    var nextID = "id"+MY.playlist.getNextTrackID(); 
    if( null == nextID ){
      LOG("cowardly refusing to preload next track at end of playlist");
      return;
    }
    if( soundManager.getSoundById(nextID) ){
      LOG("cowardly refusing to preload next track which is already loaded");
      return;
    }
    soundManager.createSound(nextID,MY.playlist.getNextTrackLocation());
  }


  // this function must be invoked when going from one sound to
  // another in a way that might allow more than about two sounds to
  // exist.  for example, repeatedly using the skip buttons can cause
  // each skipped sound to be started in parallel, meaning that
  // they'll all be competing for the same memory and bandwidth and
  // none will succeed.
  self.clear = function(){
    LOG("clear");
    soundManager.destroySound(self.sID);
    soundManager.stopAll();
  }

  // the playlist pointer has changed, so move the player on to
  // whatever the new track is.
  self.syncToPlaylist = function(){
    LOG("syncToPlaylist");

    self.sID = "id"+MY.playlist.getTrackID();
    if( ! soundManager.getSoundById(self.sID) )
      soundManager.createSound(self.sID,MY.playlist.getTrackLocation());
    
    soundManager.stopAll();
    soundManager.play(self.sID);
    LOG("Starting play for id "+self.sID);

    // we'll need this to check download speed
    self.loadStartTime = (new Date()).getTime();

    MY.loadStateManager.reset(self.sID);

  }

  self.paused = function(){
    LOG("paused");
    if( null != self.sID && soundManager.getSoundById(self.sID).paused )
      return(true);
    return(false);
  }

  self.pause = function(){
    LOG("pause");
    if( ! self.notStarted() )
      soundManager.pause(this.sID);
  }

  self.notStarted = function(){
    return( null == self.sID );
  }

  self.resume = function(){
    LOG("resume");
    return(soundManager.resume(this.sID));
  }
  
};

/****************************************
 * media loading manager
 ****************************************/

MY.LoadStateManager = function(errorHandler){
  var self = this;
  self.intervalID = null;
  self.prevBytesLoaded = null;
  self.sID = null;
  self.loadStartTime = null;
  self.errorHandler = errorHandler;
  self.minSpeed = 28.8; // a dialup modem
  self.timeBetweenChecks = 30000; 

  self.reset = function(sID){
    if( null != self.intervalID )
      window.clearInterval(self.intervalID);
    self.intervalID = window.setInterval(self.heartbeat,self.timeBetweenChecks);
    self.sID = sID;
    self.prevBytesLoaded = 0;
    self.prevPosition = 0;
    self.loadStartTime = (new Date()).getTime();
  }

  self.heartbeat = function(){
    LOG("LoadStateManager heartbeat");
    var smSound = soundManager.getSoundById(self.sID);

    switch(smSound.readyState){
    case 0: // unitialized

      // we can only land on this ready state if there was an internal error in our code.
      LOG("Fatal system error: readyState unitialized");
      window.clearInterval(self.intervalID);
      self.errorHandler();
      return;

    case 1:  // media file still loading.

      // if the playhead has budged in the last timeout interval, assume that we're not blocked.
      if( smSound.position > self.prevPosition ){
	LOG("Since playback has happened, not checking for buffering lockup");
	self.prevPosition = smSound.position;
	return;
      }
      self.prevPosition = smSound.position;

      // check for load completely dead
      if( smSound.bytesLoaded == self.prevBytesLoaded || null == smSound.bytesLoaded ){
	LOG("Load is blocked completely.  Aborting track.");
	self.errorHandler();
	return;
      }
      self.prevBytesLoaded = smSound.bytesLoaded;

      // check for bandwidth below the minimum
      var elapsed = (new Date()).getTime() - self.loadStartTime;
      var avg = smSound.bytesLoaded/elapsed;
      LOG("bytesLoaded: "+smSound.bytesLoaded+". prevBytesLoaded: "+ self.prevBytesLoaded+". Average: "+avg);
      if( avg < self.minSpeed ){ // a dialup modem
	LOG("Aborting load because speed is less than "+self.minSpeed);
	self.errorHandler();
      }
      return;

    case 2:
      // load failed, probably as a 404 or other server-side error.
      window.clearInterval(self.intervalID);
      self.errorHandler();
      return;

    case 3:
      // sound is fully loaded.  No need to keep checking.
      LOG("sound is fully loaded.");
      window.clearInterval(self.intervalID);
      // check for bad media URL: if the media URL returns an HTML
      // page but not an error status we can detect it because the
      // media URL is fully loaded *and* the duration is 0.
      if( 0 == smSound.duration )
	self.errorHandler();
      return;

    };  
  };
};
  
/****************************************
 * playlist manager
 ****************************************/

MY.Playlist = function(startingTrack){
  var self = this;
  self.interval = 1000;
  self.pos = 0;

  self.gotoPrevTrack = function(){
    if( self.pos > 0 )
      self.pos--;
  }
    
  self.gotoNextTrack = function(){
    if( self.pos < (MY.tracks.length-1) )       
      self.pos++;
    else
      // end of the list.  reshuffle and start over
      self.shuffle();
  }

  self.getCurrentTrack = function(){
    return(MY.tracks[self.pos]);
  }

  self.getTrackCreator = function(){ return(MY.tracks[self.pos].creator); }
  self.getTrackID = function(){ return(MY.tracks[self.pos].id); }
  self.getTrackImage = function(){ return(MY.tracks[self.pos].image); }
  self.getTrackInfo = function(){ return(MY.tracks[self.pos].info); }
  self.getTrackLocation = function(){ return(MY.tracks[self.pos].location); }
  self.getTrackTitle = function(){ return(MY.tracks[self.pos].title); }

  // peek at the next track in the playlist.  used for preloading.
  // returns undefined if next track can't be known in advance, which
  // is true when we're at the end of the list and have to do a
  // shuffle before going around again.
  self.getNextTrack = function(){
    if( self.pos < (MY.tracks.length-1) )       
      return(MY.tracks[self.pos+1]);
  }
  self.getNextTrackImage = function(){
    var nextTrack = self.getNextTrack();
    if( nextTrack )
      return(nextTrack.image);
  }
  self.getNextTrackLocation = function(){
    var nextTrack = self.getNextTrack();
    if( nextTrack )
      return(nextTrack.location);
  }
  self.getNextTrackID = function(){
    var nextTrack = self.getNextTrack();
    if( nextTrack )
      return(nextTrack.id);
  }

  // true if this is the first track, false otherwise.  used by UI to
  // gray skip-previous button.
  self.hasPrev = function(){ return( self.pos > 0 ); }

  // put tracks in random order
  self.shuffle = function(){
    // iterating on the sort is to work around weak randomization.
    // "25" is from trial and error - 200 cycles hung the VM for a
    // 10K song playlist.
    for( var i=0; i<25; i++ )
      MY.tracks.sort(function() {return 0.5 - Math.random()});
    self.pos = 0;
  }

  // runtime adjustments to the track list.  For example, remap
  // locations on the sucky original ftp server for scene.org to the
  // sweet new US HTTP mirror.
  self.munge = function(){
    for( var i=0; i<MY.tracks.length; i++)
      MY.tracks[i].location =
	MY.tracks[i].location.replace(/ftp:\/\/ftp.scene.org\/pub\//,
				      'http://ftp.club.cc.cmu.edu/pub/scene.org/');
  }

  // if the user wants to start the playlist somewhere specific, go there
  self.setStart = function(startingTrack){
    if( null == startingTrack )
      return;
    for( var i=0; i<MY.tracks.length; i++){
      if( MY.tracks[i].id == startingTrack ){
	var tmp = MY.tracks[0];
	MY.tracks[0] = MY.tracks[i];
	MY.tracks[i] = tmp;
	return;
      }
    }
  }

  // initialization
  self.shuffle();
  self.munge();
  self.setStart(startingTrack);

};

/****************************************
 * direct UI contact
 ****************************************/

MY.View = function(){
  var self = this;

  self.fatalError = function(msg){
    LOG("MY.View.fatal error: "+msg);
    $("div#crisis p.emoticon").html(":-(");
    $("div#crisis p.message").html(msg);
    $("body").addClass("error");
    
    // most of the CSS magic to put the page into the error-display
    // state is in the attribute list of body.error, but some
    // properties need to be set manually at this point or they don't
    // get applied.
    $("html").css("background","black");
    $("img.prev").css("visibility","hidden");
    $("div#crisis").css("display","block");

  }

  self.syncToPlaylist = function(){

    var creator = MY.playlist.getTrackCreator();
    var image = MY.playlist.getTrackImage();
    var info =  MY.playlist.getTrackInfo();
    var location = MY.playlist.getTrackLocation();
    var title = MY.playlist.getTrackTitle();

    // metadata
    $("span.creator").html(creator);
    $("span.title").html(title);

    // embed the song page
    $("iframe#infoframe").attr("src", info);    

    // show/hide skip buttons
    if( MY.playlist.hasPrev() )
      $("img.prev").css('visibility','visible');
    else
      $("img.prev").css('visibility','hidden');

    // growl hooks in Fluid and Titanium
    if( "undefined" != typeof window.fluid ){
      window.fluid.showGrowlNotification({
	title: creator+" -- "+title,
	    description: infodomain,
	    priority: 1, 
	    sticky: false,
	    identifier: "waxmp3",
	    icon: image
	    });
    }

    // social hooks
    var permalink = MY.urlManager.makeTrackLink(MY.playlist.getTrackID());
    $("input#permalink").attr("value",permalink);
    var embedHTML = self.genEmbedHTML();
    $("input#badge").attr("value",embedHTML);

    var blurb = creator+" ♫ "+title;

    var twitterlink =
    "http://twitter.com?status="+
    escape(creator)+
    " ♫ "+ // twitter can't handle escaped unicode
    escape(title+" "+permalink );
    $("a.twitter").attr("href",twitterlink);

    var facebooklink = "http://www.facebook.com/sharer.php?u="+escape(permalink)+"&t="+escape(blurb);
    $("a.facebook").attr("href",facebooklink);

    $("#myspacepostto input.t").attr("value",blurb);
    $("#myspacepostto input.u").attr("value",permalink);
    var formattedHTMLtogoinsidepostonMyspace =
    embedHTML +
    '<a href="'+permalink+'">'+
    '<img src="'+image+'" alt="'+blurb+'" align="top" style="border: 1px solid blue" /></a>';
    $("#myspacepostto input.c").attr("value",formattedHTMLtogoinsidepostonMyspace);

    
    $("a.email").attr("addthis:url",permalink); // http://addthis.com/help/api-spec
    // note: gave up on getting the addthis:title attribute to work for email

    // catchall for everything else the addthis lib can do
    $("a.addthis_button_compact").attr("addthis:url",permalink);
    $("a.addthis_button_compact").attr("addthis:title",blurb);

  }

  self.setStatePlaying = function(){
    $("div.trackcontrols img.pause").show();
    $("div.trackcontrols img.play").hide();
    LOG("setStatePlaying");
  }

  self.setStatePaused = function(){
    $("div.trackcontrols img.pause").hide();
    $("div.trackcontrols img.play").show();
    LOG("setStatePaused");
  }

  self.showPage = function(){
    // removing this class will expose all the elements with class
    // hideonerror.  
    $("body").removeClass("error");
  }

  /* prepare view-related aspects of the upcoming track, for example
     by caching album art.  */
  self.preloadNext = function(){
    LOG("preloading album art");
    var imageuri = MY.playlist.getNextTrackImage();
    if( null == imageuri )
      return;
    var image = new Image();
    image.onload = function(){};
    image.src = imageuri;
  }

  self.genEmbedHTML = function(){
    
    var creator = MY.playlist.getTrackCreator();
    var mp3location = MY.playlist.getTrackLocation();
    var title = MY.playlist.getTrackTitle();
    var encodedLocation = escape(mp3location);
    var urlOfSongPage = MY.urlManager.makeTrackLink(MY.playlist.getTrackID());

    var p = document.location.pathname.split(/\//);
    p[p.length-1] = "everybody/wax.swf";
    var urlOfSwf = document.location.protocol+"//"+document.location.host+p.join("/");

    // the 1pixelout player needs a different player ID for every
    // instance of the player on a page.  That's impossible to do
    // perfectly without scraping the target page before generating
    // the new ID, but what we can do is use a random ID generator and
    // keep the IDs fairly high.
    var playerID = Math.round(Math.random() * 10000)+1000; 
    
    return(
	   '<embed width="80" height="24" align="absmiddle" type="application/x-shockwave-flash" flashvars="playerID=%playerID%&amp;soundFile=%encodedLocation%" src="%urlOfSwf%" />&nbsp;<a href="%urlOfSongPage%">%creator% ♫ %title%</a><br />'
	   .replace(/%playerID%/,playerID)
	   .replace(/%encodedLocation%/,encodedLocation)
	   .replace(/%urlOfSongPage%/,urlOfSongPage)
	   .replace(/%creator%/,creator)
	   .replace(/%title%/,title)
	   .replace(/%urlOfSwf%/,urlOfSwf)
	   );

  }
  
  /****************************************
   * class initialization 
   ****************************************/

  // attach event handlers
  $("img.prev").click(function() {
      MY.controller.handlePrevButton();
    });
  $("img.next").click(function() {
      MY.controller.handleNextButton();
    });
  $("img.pause").click(function() {
      MY.controller.handlePauseButton();
    });
  $("img.play").click(function() {
      MY.controller.handlePlayButton();
    });
  // this has to be the change event and not the click event because the click event doesn't fire in Chrome and probably IE
  $("select#stations").change(function(){
      MY.controller.handleStationSelect(this.value);
  });

  // auto-select field contents when the user clicks on them
  $("input#permalink").click(function(e){ $("input#permalink").get(0).select(); });
  $("input#badge").click(function(e){ $("input#badge").get(0).select(); }); 

  // the button to add the current track to myspace uses a hidden form
  // to send the data over.  See template.html for the form.
  $("a.myspace").click(function(){ $("form#myspacepostto").submit(); });
};

MY.Controller = function(){
  var self = this;
  self.error = false;
  // suspends bandwidth checker when user has paused the player.  this
  // is to prevent media errors detected during the pause state from
  // causing us to skipping on to the next track and starting to play
  // again.  
  self.ignoreMediaErrors = false;

  // called by media player when there has been an error.  skips to
  // next track.
  self.handleMediaError = function(){
    if( !self.ignoreMediaErrors )
      self.handleNextButton();
  }

  // called by Sound Manager when playback of a track is complete
  self.handleTrackFinished = function(){
    LOG("handleTrackFinished");
    self.handleNextButton();
  }

  // called when user selects an option from the stations list
  self.handleStationSelect = function(station){
    document.location.href = "?station="+station;
  }

  self.handlePrevButton = function(){
    self.ignoreMediaErrors = false;
    MY.player.clear();
    MY.playlist.gotoPrevTrack();
    MY.player.syncToPlaylist();
    MY.view.syncToPlaylist();
    // we're *always* in a playing state after a skip, so if the user
    // was paused before hitting the button the play/pause buttons
    // will be out of sync
    MY.view.setStatePlaying();
  }

  self.handleNextButton = function(){
    self.ignoreMediaErrors = false;
    MY.player.clear();
    MY.playlist.gotoNextTrack();
    MY.player.syncToPlaylist();
    MY.view.syncToPlaylist();

    // we're *always* in a playing state after a skip, so if the user
    // was paused before hitting the button the play/pause buttons
    // will be out of sync
    MY.view.setStatePlaying();
  }

  self.handlePauseButton = function(){
    self.ignoreMediaErrors = true;
    MY.view.setStatePaused();
    MY.player.pause();
  }

  self.handlePlayButton = function(){
    self.ignoreMediaErrors = false;
    MY.view.setStatePlaying();
    if( MY.player.notStarted() )
      // we'll land here if the player isn't autostarting and the user
      // has hit the play button for the first time.  there's no need
      // to implement this case for now, we just need to be aware that
      // this needs to be touched if/when autostart is disabled.
      self.handleFatalError("Support for non-autostarting player not implemented yet.");
    else
      MY.player.resume();
  }

  self.handleFatalError = function(msg){
    LOG("Fatal error: "+msg);
    self.error = true;

    // we don't want a media error which occurs after some fatal error
    // to cause us to skip on the next song and start playing.
    self.ignoreMediaErrors = true; 
    
    // if we're hiding the pause button, we can't leave the music
    // playing.
    if( MY.player )
      MY.player.pause(); 

    if( "undefined" == typeof MY.view )
      LOG("Unable to call MY.fiew.fatalError because it has not been initialized yet.");
    else
      MY.view.fatalError(msg);
  }

  self.handlePlayerReady = function(){
    MY.view.showPage();
    MY.view.setStatePlaying();
    MY.player.syncToPlaylist();
    MY.view.syncToPlaylist();
  }

  self.handleBeforeFinish = function(){
    LOG("Got  before finish event");
    MY.view.preloadNext();
    MY.player.preloadNext();
  }
  
}

/****************************************
 * global initialization
 ****************************************/

  $(document).ready(function(){

  /****************************************
   * global bootstrap code
   *
   * watch the order, sometimes it does matter
   ****************************************/

      MY.controller = new MY.Controller();

      MY.urlManager = new MY.URLManager();
      MY.view = new MY.View();
      MY.log = new MY.LogManager();
      MY.loadStateManager = new MY.LoadStateManager(self.handleMediaError);
      MY.player = new MY.Player();
      MY.playlist = new MY.Playlist(MY.urlManager.getStartingTrack());

    });
