var insertCss, fs;

if(process && process.browser){
    insertCss = require('insert-css');
    fs = require('fs');
}

var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    // At least Safari 3+: "[object HTMLElementConstructor]"
var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

module.exports = function(container, options){
    options = options || {};
    if(process && process.browser && options.insertCss !== false)
        insertCss(fs.readFileSync(__dirname + "/css/style.css"));

    var pageslider = new PageSlide(container, options);

    var returnObj = options.defaultMethod === 'slidePageFrom' ? pageslider.slidePageFrom.bind(pageslider) : pageslider.slidePage.bind(pageslider);
    returnObj.slidePage = pageslider.slidePage.bind(pageslider);
    returnObj.slidePageFrom = pageslider.slidePageFrom.bind(pageslider);
    return returnObj;
}

function PageSlide(container, options) {

    var container = container,
        isJ = container instanceof jQuery,
        currentPage,
        stateHistory = [],
        lastLevel,
        allowPush = !options.useHash && testPushstate(),
        tranType;

    if(isSafari || isChrome)
        tranType ='webkitTransitionEnd';
    else if(isFirefox || isIE)
        tranType = 'transitionend';
    else if(isOpera)
        tranType = 'otransitionend';
    else
        tranType ='webkitTransitionEnd';

    // Use this function if you want PageSlider to automatically determine the sliding direction based on the state history
    this.slidePage = function(page, opts) {
        opts = opts || {};
        var state = allowPush ? window.location.pathname : window.location.hash;

        if( opts.hasOwnProperty('level') ){
            var level = +opts.level;
            if(typeof lastLevel === "undefined")
                this.slidePageFrom(page, undefined);
            else
                this.slidePageFrom(page, level >= lastLevel ? 'right' : 'left' );
            lastLevel = level;
            return;
        }

        var l = stateHistory.length;

        if(opts.reset){
            stateHistory = [state];
            return this.slidePageFrom(page, 'left');
        }else if (l === 0) {
            stateHistory.push(state);
            return this.slidePageFrom(page);
        }

        if (state === stateHistory[l-2]) {
            stateHistory.pop();
            this.slidePageFrom(page, 'left');
        } else {
            stateHistory.push(state);
            this.slidePageFrom(page, 'right');
        }

    };

    // Use this function directly if you want to control the sliding direction outside PageSlider
    this.slidePageFrom = function(page, from) {
        var notFrom = from === "left" ? "right" : "left";
            container[isJ ? "append" : "appendChild"](page);

        if (!currentPage || !from) {
            if(isJ){
                page.removeClass("left right transition").addClass("page center");            
            }else{
                page.classList.remove("left", "right", "transition");
                page.classList.add("page", "center");            
            }
            currentPage = page;
            return;
        }

        // Position the page at the starting position of the animation
        if(isJ){
            page.removeClass(notFrom + " center transition").addClass("page " + from);
        }else{
            page.classList.remove("center", notFrom, "transition");
            page.classList.add("page", from);
        }

        if(isJ){
            currentPage.one(tranType, function(e) {
                page.trigger({ 
                    type:'pageslideEnd', 
                    slidFrom: from, 
                    target: page[0],
                    $target: page,
                    fromTarget: currentPage[0],
                    $fromTarget: currentPage,
                    stopPropogation: function(){e.stopPropogation();} 
                });
                currentPage.trigger({ 
                    type:'pageslideEnd', 
                    slidFrom: from, 
                    target: e.target, 
                    $target: currentPage, 
                    toTarget: page[0],
                    $toTarget: page,
                    stopPropogation: function(){e.stopPropogation();} 
                });
                if(!e.isPropagationStopped())
                    $(e.target).remove();
                currentPage = page;
            });
            if(options.onEnd && typeof options.onEnd === "function")
                currentPage.one(tranType, options.onEnd);                
        }else{
            var listener = function listener(e){
                currentPage.removeEventListener( tranType, listener );
                var event = new Event('pageslideEnd', { 
                    type:'pageslideEnd', 
                    slidFrom: from, 
                    target: e.target 
                });
                e.target.dispatchEvent(event);
                if(!event.isPropagationStopped())
                    e.target.parentNode.removeChild(e.target);
                currentPage = page;
            };
            currentPage.addEventListener( tranType, listener );
            if(options.onEnd && typeof options.onEnd === "function")
                currentPage.addEventListener( tranType, options.onEnd );
        }

        // Force reflow. More information here: http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/
        container[0].offsetWidth;

        // Position the new page and the current page at the ending position of their animation with a transition class indicating the duration of the animation
        if(isJ){
            page.removeClass("left right").addClass("page center transition");
            currentPage.removeClass("center "+from).addClass("page transition "+ notFrom);
        }else{
            var p = page.classList;
            var cP = currentPage.classList;

            p.remove("left", "right");
            cP.remove("center", from);

            p.add("page","transition","center");
            cP.add("page","transition",notFrom);            
        }
        
    };

}

//taken from https://github.com/hay/Modernizr/commit/479e424faabe92062292699102340346c82335b8
function testPushstate(){    
    var ua = navigator.userAgent;
    var properCheck = !!(window.history && history.pushState);
    if (ua.indexOf("Android") === -1) {
        // No Android, simply return the 'proper' check
        return properCheck;
    } else {
        // We need to check for the stock browser (which identifies itself
        // as 'Mobile Safari'), however, Chrome on Android gives the same
        // identifier (and does support history properly), so check for that too
        if (ua.indexOf("Mobile Safari") !== -1 && ua.indexOf("Chrome") === -1) {
            // Buggy implementation, always return false
            return false;
        } else {
            // Chrome, return the proper check
            return properCheck;
        }
    }
}

/*
 * classList.js: Cross-browser full element.classList implementation.
 * 2012-11-15
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/

if (typeof document !== "undefined" && !("classList" in document.documentElement)) {

(function (view) {

"use strict";

if (!('HTMLElement' in view) && !('Element' in view)) return;

var
      classListProp = "classList"
    , protoProp = "prototype"
    , elemCtrProto = (view.HTMLElement || view.Element)[protoProp]
    , objCtr = Object
    , strTrim = String[protoProp].trim || function () {
        return this.replace(/^\s+|\s+$/g, "");
    }
    , arrIndexOf = Array[protoProp].indexOf || function (item) {
        var
              i = 0
            , len = this.length
        ;
        for (; i < len; i++) {
            if (i in this && this[i] === item) {
                return i;
            }
        }
        return -1;
    }
    // Vendors: please allow content code to instantiate DOMExceptions
    , DOMEx = function (type, message) {
        this.name = type;
        this.code = DOMException[type];
        this.message = message;
    }
    , checkTokenAndGetIndex = function (classList, token) {
        if (token === "") {
            throw new DOMEx(
                  "SYNTAX_ERR"
                , "An invalid or illegal string was specified"
            );
        }
        if (/\s/.test(token)) {
            throw new DOMEx(
                  "INVALID_CHARACTER_ERR"
                , "String contains an invalid character"
            );
        }
        return arrIndexOf.call(classList, token);
    }
    , ClassList = function (elem) {
        var
              trimmedClasses = strTrim.call(elem.className)
            , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
            , i = 0
            , len = classes.length
        ;
        for (; i < len; i++) {
            this.push(classes[i]);
        }
        this._updateClassName = function () {
            elem.className = this.toString();
        };
    }
    , classListProto = ClassList[protoProp] = []
    , classListGetter = function () {
        return new ClassList(this);
    }
;
// Most DOMException implementations don't allow calling DOMException's toString()
// on non-DOMExceptions. Error's toString() is sufficient here.
DOMEx[protoProp] = Error[protoProp];
classListProto.item = function (i) {
    return this[i] || null;
};
classListProto.contains = function (token) {
    token += "";
    return checkTokenAndGetIndex(this, token) !== -1;
};
classListProto.add = function () {
    var
          tokens = arguments
        , i = 0
        , l = tokens.length
        , token
        , updated = false
    ;
    do {
        token = tokens[i] + "";
        if (checkTokenAndGetIndex(this, token) === -1) {
            this.push(token);
            updated = true;
        }
    }
    while (++i < l);

    if (updated) {
        this._updateClassName();
    }
};
classListProto.remove = function () {
    var
          tokens = arguments
        , i = 0
        , l = tokens.length
        , token
        , updated = false
    ;
    do {
        token = tokens[i] + "";
        var index = checkTokenAndGetIndex(this, token);
        if (index !== -1) {
            this.splice(index, 1);
            updated = true;
        }
    }
    while (++i < l);

    if (updated) {
        this._updateClassName();
    }
};
classListProto.toggle = function (token, forse) {
    token += "";

    var
          result = this.contains(token)
        , method = result ?
            forse !== true && "remove"
        :
            forse !== false && "add"
    ;

    if (method) {
        this[method](token);
    }

    return !result;
};
classListProto.toString = function () {
    return this.join(" ");
};

if (objCtr.defineProperty) {
    var classListPropDesc = {
          get: classListGetter
        , enumerable: true
        , configurable: true
    };
    try {
        objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
    } catch (ex) { // IE 8 doesn't support enumerable:true
        if (ex.number === -0x7FF5EC54) {
            classListPropDesc.enumerable = false;
            objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        }
    }
} else if (objCtr[protoProp].__defineGetter__) {
    elemCtrProto.__defineGetter__(classListProp, classListGetter);
}

}(self));

}
