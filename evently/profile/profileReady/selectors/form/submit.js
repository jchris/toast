function(e) {
  var f = $(this);
  var doc = {
    body : $("input[name=message]", f).val(),
    channel : $$("#chat").channel,
    author : $$("#profile").profile,
    created_at : new Date()
  };
  $$(f).app.db.saveDoc(doc, {
    success : function() {
      $("input[name=message]", f).val("");
    }
  })
  return false;
}
