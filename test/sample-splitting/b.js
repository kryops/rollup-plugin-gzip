function b() {
  console.log('b')
  import('./c').then(function (c) {
    c.default()
  })
}

b()
