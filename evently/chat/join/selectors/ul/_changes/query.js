function(e) {
  var chan = e.data.args[0].rows[0].value;
  return {
    view : "messages",
    limit : 25,
    startkey : [chan.channel, {}],
    endkey : [chan.channel],
    reduce : false,
    descending : true,
    type : "newRows"
  }
}
