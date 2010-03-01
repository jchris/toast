function() {
  var li = $(this).parents("li");
  var app = $$(this).app;
  $.log("d",li);
  var message_id = li.attr("data-id");
  app.db.openDoc(message_id, {
    success : function(doc) {
      $.log("delete", doc)
      app.db.removeDoc(doc, {
        success : function() {
          li.slideUp("slow");
        }
      });
    }
  });

  return false;
};