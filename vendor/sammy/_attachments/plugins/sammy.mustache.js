(function($) {
  Sammy = Sammy || {};
  
  // <tt>Sammy.Mustache</tt> provides a quick way of using mustache style templates in your app.
  // The plugin itself includes the awesome mustache.js lib created and maintained by Jan Lehnardt
  // at http://github.com/janl/mustache.js
  // 
  // Mustache is a clever templating system that relys on double brackets {{}} for interpolation.
  // For full details on syntax check out the original Ruby implementation created by Chris Wanstrath at
  // http://github.com/defunkt/mustache
  // 
  // By default using Sammy.Mustache in your app adds the <tt>mustache()</tt> method to the EventContext 
  // prototype. However, just like <tt>Sammy.Template</tt> you can change the default name of the method
  // by passing a second argument (e.g. you could use the ms() as the method alias so that all the template 
  // files could be in the form file.ms instead of file.mustache)
  // 
  // === Example
  // 
  // The template (mytemplate.ms):
  // 
  //       <h1>\{\{title\}\}<h1>
  //       
  //       Hey, {{name}}! Welcome to Mustache!
  //       
  // The app:
  // 
  //       var $.app = $.sammy(function() {
  //         // include the plugin and alias mustache() to ms()
  //         this.use(Sammy.Mustache, 'ms');
  //         
  //         this.get('#/hello/:name', function() {
  //           // set local vars
  //           this.title = 'Hello!'
  //           this.name = this.params.name;
  //           // render the template and pass it through mustache
  //           this.partial('mytemplate.ms'); 
  //         });
  //         
  //       });
  //       
  // If I go to #/hello/AQ in the browser, Sammy will render this to the <tt>body</tt>:
  // 
  //       <h1>Hello!</h1>
  //       
  //       Hey, AQ! Welcome to Mustache!
  //       
  Sammy.Mustache = function(app, method_alias) {
    
    // *Helper*:: Uses Mustache.js to parse a template and interpolate and work with the passed data
    //
    // === Arguments
    // 
    // +template+:: A String template. {{}} Tags are evaluated and interpolated by Mustache.js
    // +data+::     An Object containing the replacement values for the template. 
    //              data is extended with the <tt>EventContext</tt> allowing you to call its methods within the template.
    //
    var mustache = function(template, view, partials) {
      return $.mustache(template, $.extend({}, this, view), partials);
    };
    
    // set the default method name/extension
    if (!method_alias) method_alias = 'mustache'; 
    app.helper(method_alias, mustache);
    
  };

})(jQuery);