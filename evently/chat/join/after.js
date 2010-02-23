function(resp) {
  var chan = resp.rows[0].value;
  $$(this).channel = chan.channel;
  $("h1").text("Toast :: "+chan.channel);
  $("#chandesc").text(chan.desc);
};