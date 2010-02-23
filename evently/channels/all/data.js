function(resp) {
  return {
    channels : resp.rows.map(function(r) {
      var v = r.value;
      v.channel_uri = encodeURIComponent(v.channel);
      return v;
    })
  };
};
