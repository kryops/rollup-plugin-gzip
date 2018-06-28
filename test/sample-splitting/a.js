function a() {
    console.log('a');
    import('./c').then(function(c) {
        c();
    })
}

a();
