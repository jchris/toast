function(e) {
  var f = $(this);
  var chan = e.data.args[0].rows[0].value;
  var doc = {
    body : $("input[name=message]", f).val(),
    channel : chan.channel,
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
