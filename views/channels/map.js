function(doc) {
  if (doc.channel) {
    emit([doc.channel, doc._local_seq], doc.message);
  }
};
