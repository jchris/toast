function(e) {
  var params = e.data.args[1];
  return {
    view : "messages",
    limit : 25,
    startkey : [params.channel, {}],
    endkey : [params.channel],
    reduce : false,
    descending : true,
    type : "newRows"
  }
}
