//-----------------------------------
//
// J.Start - test webGL overlay atop OpenSeaDragon
//
// http://<host>:<port>/index.html?canvas&server=<...>&datapath=<...>
//
//-----------------------------------

J.Start = function(e) {
  // Terms to Lay the lower layer
  var laid = new this.Lay({
      server :   'localhost:2001',
      datapath : '/Volumes/NeuroData/mojo',
      canvas   : false,
      debug  :   false,
      height :   1024,
      width :    1024,
      depth :    1,
      z :        0,
      tileSize : 512,
      minLevel : 0,
      mip : 1
  });
  var layout = [
    // sea: Lower layer in Seadragon
    {   prefixUrl :             "lib/images/",
        navigatorSizeRatio :    0.25,
        minZoomImageRatio :     0.5,
        maxZoomPixelRatio :     10,
        showNavigationControl : true,
        animationTime :         0,
        imageLoaderLimit :      3,
        timeout :               120000,
        tileSources : laid.tileSources,
        id : laid.id
    },
    // top: Upper layer with webgl or canvas
    {   alpha: 0.6,
        debug : laid.debug,
        canvas : laid.canvas,
        image : laid.overlay,
        shape : [0,0,laid.width,laid.height],
        context_keys : {preserveDrawingBuffer:true},
        sizes : {width: laid.tileSize, height: laid.tileSize},
        shaders : ['shaders/former.glsl','shaders/latter.glsl']
    }
  ];
  laid.overlay.onload = this.howToStart(...layout);
}

J.Start.prototype.howToStart = function (sea,top) {
 
  var low = new OpenSeadragon(sea);

  // Cover the Seadragon with either canvas or webgl
  var a = new J.Show(low,top);
};

//-----------------------------------
//
// Lay - Create an Overlay and Tilesource
//
//-----------------------------------
J.Start.prototype.Lay = function(preterms) {

    // Change the inputs if passed as url terms
    var terms = this.fixTerms( preterms, decodeURI(document.location.search.substring(1)) );
    Object.keys(preterms).forEach((term) => this[term] = terms[term] || preterms[term]);
    this.maxLevel = Math.min(this.mip, Math.ceil(Math.log2(this.width/this.tileSize)));

    // Make low layer
    this.tileSources = Object.assign({},this);
    this.tileSources.getTileUrl = this.getTile.bind(this.tileSources);

    // Make high layer
    this.overlay = new Image();
    this.overlay.crossOrigin = "anonymous";
    this.overlay.src = this.getTile(0,0,0)+"&segmentation=y&segcolor=y";

    // put a section in the DOM
    this.id = 'seer_' + preterms.z;
    idiv = document.createElement('div');
    Object.assign(idiv,{className:'seer', id: this.id});
    document.body.appendChild(idiv);
};

J.Start.prototype.Lay.prototype.getTile = function( level, x, y ) {

  level = this.maxLevel - level;
  x *= this.tileSize;
  y *= this.tileSize;
  return "http://" + this.server + "/data/?datapath=" + this.datapath +
         "&start=" + x + "," + y + "," + this.z + "&mip=" + level +
         "&size=" + this.tileSize + "," + this.tileSize + ","+this.depth;
};

J.Start.prototype.Lay.prototype.fixTerms = function( before, after ) {

  // return a string if preset is string and int if preset is int
  var clean = text => text ? text.replace(new RegExp('\/$'),'') : true;
  var read = ask => typeof before[ask[0]] === 'string' ? clean(ask[1]) : parseInt(ask[1],10);
  // Check whether the asking string has answer or has only a true/false flag
  var check = (obj, ask) => obj[ask[0]] = ask.length > 1 ? read(ask) : true;
  var deal = (obj, str) => { check(obj,str.split('=')); return obj;}
  // Deal the array into a single object
  return after.split('&').reduce(deal,{});
};

window.onload = (e) => new J.Start(e);