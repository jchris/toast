function(e) {
  var f = $(this);
  var params = e.data.args[1];
  var doc = {
    body : $("input[name=message]", f).val(),
    channel : params.channel,
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
