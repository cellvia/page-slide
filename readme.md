# PageSlide: Hardware Accelerated Page Transitions for Mobile Web Apps

A Browserify ready implementation of @coenraets PageSlide. 

This is a rework of https://github.com/brianleroux/page-slide

Added:

 * optionally feed in "level" integers to indicate the hierarchy.  if given level is greater than last level, page will slide from right 
 * cross-browser functionality via event normalization (pageslideEnd emitted on element)
 * native js AND jQuery compatibile
 * pushState detection, making hash optional
 * default css optionally auto-inserted via [insert-css](http://github.com/substack/insert-css) and [brfs](http://github.com/substack/brfs) 


More info here:

http://coenraets.org/blog/2013/03/hardware-accelerated-page-transitions-for-mobile-web-apps-phonegap-apps/
