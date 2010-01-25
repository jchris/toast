Sammy.Mustache = function(app) {
  app.helpers({
    mustache: function(template, view, partials) {
      return $.mustache(template, view, partials);
    }
  });
};
