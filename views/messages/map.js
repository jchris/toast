function(doc) {
  if (doc.channel && doc.body) {
    emit([doc.channel, doc._local_seq], doc);
  }
};
