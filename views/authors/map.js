function(doc) {
  if (doc.channel && doc.message) {
    var m = doc.message;
    if (m && m.author && m.author) {
      emit(m.author, null);
    }
  }
};