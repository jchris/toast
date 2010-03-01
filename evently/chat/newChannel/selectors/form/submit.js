function() {
  var f = $(this);
  var app = $$(f).app;
  var name = $("input[name=name]", f).val();
  var doc = {
    id : "toast.channel:"+name,
    channel : name,
    desc : $("input[name=desc]", f).val(),
    type : "channel",
    author : $$("#profile").profile
  };
  app.db.saveDoc(doc, {
    success : function() {
      $("#chat").trigger("join", [{channel:name}]);
      $("#channels").trigger("all");
    }
  })
  return false;
};