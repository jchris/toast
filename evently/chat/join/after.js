function(resp) {
  var chan = resp.rows[0].value;
  $("h1").text("Toast :: "+chan.channel);
  $("#chandesc").text(chan.desc);
};