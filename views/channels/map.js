function(doc) {
  if (doc.type == "channel" && doc.channel) {
    emit(doc.channel, doc);
  }
}
