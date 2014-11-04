document.addEventListener( "DOMContentLoaded", loadedEvent ) ;

function loadedEvent ( ) {
  initControls( ) ;
} ;

function initControls ( ) {
  var fFlood ;
  var fCurrentAnimation = moveTopLeft( ) ;
  var fColorWheelEl     = document.querySelector( '.color-wheel-js' ) ;

  var gpuToggle   = new ToggleControl( '.slider-js.gpu-js', 'on', gpuOn, gpuOff ) ;
  var spinToggle  = new ToggleControl( '.slider-js.spin-js', 'on', spinOn, spinOff ) ;
  var floodToggle = new ToggleControl( '.slider-js.flood-js', 'on', floodOn, floodOff ) ;

  function gpuOn ( ) {
    fCurrentAnimation.stop( );
    fCurrentAnimation = moveTranslate( ) ;
  }

  function gpuOff ( ) {
    fCurrentAnimation.stop( ) ;
    fCurrentAnimation = moveTopLeft( ) ;
  }

  function spinOn ( ) {
    fColorWheelEl.classList.add( 'spin' ) ;
  }

  function spinOff ( ) {
    fColorWheelEl.classList.remove( 'spin' ) ;
  }

  function floodOn ( ) {
    floodOff( ) ;
    fFlood = flood( ) ;
  }

  function floodOff ( ) {
    if ( fFlood !== undefined ) fFlood.stop( ) ;
  }

}

function ToggleControl ( selector, onClass, onCallback, offCallback ) {
  var self ;
  var fElement ;

  init( ) ;

  function init ( ) {
    self = { } ;
    fElement = document.querySelector( selector ) ;
    fElement.addEventListener( 'click', toggle ) ;
  }

  function toggle ( ) {
    var isOn = fElement.classList.contains( onClass ) ;

    if ( isOn === true ) {
      fElement.classList.remove( onClass ) ;
      offCallback( ) ;
    } else {
      fElement.classList.add( onClass ) ;
      onCallback( ) ;
    }

  }

}

function flood ( ) {
  var self ;
  var fStop ;

  init( ) ;

  self.stop = stop ;

  return self ;

  function init ( ) {
    self  = { } ;
    fStop = false ;
    floodLoop( ) ;
  }

  function stop ( ) {
    fStop = true ;
  }

  function floodLoop ( ) {
    i = 0 ;

    while ( i < 10000 ) {
      if ( fStop === true ) return ;
      console.log( 'flooding' ) ;
      i++ ;
    }

    window.setTimeout( floodLoop, 1000 ) ;
  }

}

function moveTranslate ( ) {
  var clientWidth  = document.body.clientWidth  ;
  var clientHeight = document.body.clientHeight ;

  var defaultStyles  = {
    'transform': "translateX( 0px ) translateY( 0px ) translateZ( 0)",
    'width'    : "250px",
    'height'   : "250px"
  } ;

  var styleKeys    = [ 'transform', 'width', 'height' ] ;
  var direction    = [ 1, -1 ] ;
  var colorWheelEl = document.querySelector( '.color-wheel-wrapper-js' ) ;
  var animation    = new Animation( colorWheelEl, styleKeys, defaultStyles ) ;
  var boundingBox  = new BoundingBox( 0, clientHeight, 0, clientWidth ) ;

  return moveDirection( direction, 5, transformTranslate, animation, boundingBox ) ;

  function transformTranslate ( styles, direction, rate ) {
    var numberRegEx = /\d+/g ;

    var width  = parseInt( styles[ "width" ] );
    var height = parseInt( styles[ "height"] );

    var x = direction[ 0 ] ;
    var y = direction[ 1 ] ;

    var transformValues = styles[ "transform" ].match( numberRegEx ) ;

    var left = transformValues.shift( ) ;
    var top  = transformValues.shift( ) ;

    top  = parseInt( top ) ;
    left = parseInt( left ) ;

    if ( x < 0 ) left -= rate ;
    if ( x > 0 ) left += rate ;

    if ( y > 0 ) top -= rate ;
    if ( y < 0 ) top += rate ;

    var coordinates = [ left, top ] ;

    if ( x > 0 ) coordinates[ 0 ] += width ;
    if ( y < 0 ) coordinates[ 1 ] += height ;

    styles[ "transform" ] = "translateX("+Math.floor( left ) +"px) translateY("+Math.floor( top )+"px) translateZ( 0 )"  ;

    return coordinates ;
  }

}

function moveTopLeft ( ) {

  var clientWidth  = document.body.clientWidth  ;
  var clientHeight = document.body.clientHeight ;

  var defaultStyles = {
    'top': '0px',
    'left': '0px' ,
    'width': '250px',
    'height': '250px'
  } ;

  var styleKeys    = [ 'top', 'left', 'width', 'height' ] ;
  var direction    = [ 1, -1 ] ;
  var colorWheelEl = document.querySelector( '.color-wheel-wrapper-js' ) ;
  var animation    = new Animation( colorWheelEl, styleKeys, defaultStyles ) ;
  var boundingBox  = new BoundingBox( 0, clientHeight, 0, clientWidth ) ;

  return moveDirection( direction, 5, transformTopLeft, animation, boundingBox ) ;

  function transformTopLeft ( styles, direction, rate ) {
    var top    = parseInt( styles[ "top" ]  ) ;
    var left   = parseInt( styles[ "left" ] ) ;
    var width  = parseInt( styles[ "width" ] ) ;
    var height = parseInt( styles[ "height" ] ) ;

    var x = direction[ 0 ] ;
    var y = direction[ 1 ] ;

    var rightDir = x > 0 ;
    var leftDir  = x < 0 ;

    var upDir   = y > 0 ;
    var downDir = y < 0 ;

    if ( rightDir ) left += rate ;
    if ( leftDir  ) left -= rate ;

    if ( upDir   ) top -= rate ;
    if ( downDir ) top += rate ;

    styles[ "top" ]  = Math.floor( top  ) + "px" ;
    styles[ "left" ] = Math.floor( left ) + "px" ;

    var coordinates = [ left, top ] ;

    if ( rightDir ) coordinates[ 0 ] += width ;
    if ( downDir  ) coordinates[ 1 ] += height ;

    return coordinates ;
  }

}

function moveDirection( direction, rate, transform, animation, boundingBox ) {
  var self  = { } ;

  var fasterButtonEl = document.querySelector( '.speed-toggle-faster-js' ) ;
  var slowerButtonEl = document.querySelector( '.speed-toggle-slower-js' ) ;
  var valueEl        = document.querySelector( '.speed-toggle-value-js'  ) ;

  var rate = parseInt( valueEl.innerHTML ) * 5 ;

  fasterButtonEl.addEventListener( 'click', increaseSpeed ) ;
  slowerButtonEl.addEventListener( 'click', decreaseSpeed ) ;

  animation.animate( move, rate, 0 ) ;

  self.stop = stop ;

  return  self ;

  function stop ( ) {
    animation.stop( ) ;
    fasterButtonEl.removeEventListener( "click" ) ;
    slowerButtonEl.removeEventListener( "click" ) ;
  }

  function increaseSpeed( ) {
    rate += 5  ;
    valueEl.innerHTML = rate/5+'' ;
  }

  function decreaseSpeed ( ) {
    if ( rate - 5 >= 1 ) rate -= 5 ;
    valueEl.innerHTML = rate/5+'' ;
  }

  function move ( styles, startTime, currentTime, endTime ) {

    var percentDone = currentTime / endTime ;
    var transformTo = rate ;

    if ( percentDone <= 1 && percentDone > 0 ) {
      transformTo = rate * percentDone ;
    }

    var coordinates = transform( styles, direction, transformTo ) ;

    var x = coordinates.shift( ) ;
    var y = coordinates.shift( ) ;

    var validX = boundingBox.isValidX( x ) ;
    var validY = boundingBox.isValidY( y ) ;

    if ( validX === false ) direction[ 0 ] = -direction[ 0 ] ;
    if ( validY === false ) direction[ 1 ] = -direction[ 1 ] ;

    if ( validY === false || validX === false ) {
      moveDirection( direction, rate, transform, animation, boundingBox ) ;
      return false;
    }

    return styles ;
  }

}

function BoundingBox ( fTop, fBottom, fLeft, fRight ) {

  var self = { } ;

  self.isValidY = isValidY ;
  self.isValidX = isValidX ;

  return self ;

  function isValidX ( x ) {
    if ( x > fLeft && x < fRight ) return true ;
    return false;
  }

  function isValidY ( y ) {
    if ( y > fTop  && y < fBottom ) return true ;
    return false ;
  }

}

function Animation ( fElement, fStyleKeys, fDefaultStyles ) {
  var self ;
  var fStop ;

  var fStartTime ;
  var fFinishTime ;
  var fCurrentStyles ;

  init( ) ;

  self.animate = animate ;
  self.stop    = stop ;

  return self ;

  function init ( ) {
    self = { } ;
    fStop = false ;
    fCurrentStyles = { } ;
    fCurrentStyles = _getStyles( fStyleKeys, fDefaultStyles, fCurrentStyles ) ;
  }

  function stop ( ) {
    fStop = true ;
    fElement.removeAttribute('style' ) ;
    return ;
  }

  function animate ( transform, duration, delay ) {

    fStartTime = window.performance.now( ) + delay ;

    if ( duration === -1 ) {
      fFinishTime = false ;
    } else {
      fFinishTime = fStartTime + duration ;
    }

    window.requestAnimationFrame( step ) ;

    return ;

    function step ( elapsedTime ) {
      if ( fStop === true ) return ;

      var newStyles  = transform( fCurrentStyles, fStartTime, elapsedTime, fFinishTime ) ;
      fCurrentStyles = _setStyles( fElement, fStyleKeys, newStyles, fCurrentStyles ) ;

      if ( newStyles === false ) return ;

      window.requestAnimationFrame( step ) ;
    }

  }

  // Private

  function _setStyles ( element, styleKeys, newStyles, currentStyles ) {

    for ( var i = 0; i < styleKeys.length; i++ ) {
      var style = styleKeys[ i ] ;

      if ( newStyles[ style ] === undefined ) continue ;

      currentStyles[ style ] = newStyles[ style ] ;
      element.style[ style ] = newStyles[ style ] ;
    }

    return currentStyles ;
  }

  function _getStyles ( styleKeys, defaultStyles, currentStyles ) {
    var computedStyles ;

    for ( var i = 0; i < styleKeys.length; i++ ) {
      var style = styleKeys[ i ] ;

      if ( defaultStyles[ style ] !== currentStyles[ style ] ) {
        currentStyles[ style ] = defaultStyles[ style ] ;
      }

      if ( currentStyles[ style ] !== undefined ) continue ;

      var value = fElement.style[ style ] ;

      if ( value.length === 0 ) {

        if ( coputedStyles === undefined ) {
          computedStyles = window.getComputedStyle( fElement ) ;
        }

        value = computedStyles.getPropertyValue( style ) ;
      }

      currentStyles[ style ] = value ;
    }

    return currentStyles ;
  }

}
