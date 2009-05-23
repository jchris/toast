function(m) {
  // !code helpers/md5.js
  if (m.channel && m.message) {
    var mess = m.message;
    if (mess && mess.author && mess.author.email) {
      mess.author.gravatar = hex_md5(mess.author.email);      
    }
    emit([m.channel, m._local_seq], mess);
  }
};
