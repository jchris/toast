function(doc) {
  if (doc.body && doc.channel && doc.channel == "chip") {
    emit(doc._local_seq, doc);
  }
};
