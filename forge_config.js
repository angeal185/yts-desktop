const pkg = require('./package');

module.exports = {
  packagerConfig: {
  },
  makers: [/*
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'yts_desktop'
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        name: pkg.name,
        description: pkg.description,
        homepage: pkg.homepage,
        maintainer: pkg.author,
        version: pkg.version
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        name: pkg.name,
        description: pkg.description,
        homepage: pkg.homepage,
        compressionLevel: 9,
        version: pkg.version
      }
    },
    {
      name: '@electron-forge/maker-snap',
      config: {
        snapcraft:'',
        name: pkg.name,
        summary: pkg.description,
        description: pkg.description,
        version: pkg.version
      }
    },*/
    {
      name: '@electron-forge/maker-zip',
      platforms: [
        'linux'
      ]
    }
  ]
  /*
  hooks: {
    generateAssets: function(){

    },
    postStart: function(){

    },
    prePackage: function(){

    },
    packageAfterCopy: function(){

    },
    packageAfterPrune: function(){

    },
    packageAfterExtract: function(){

    },
    postPackage: function(){

    },
    preMake: function(){

    },
    postMake: function(){

    }
  },
  publishers: {}
  */
}
