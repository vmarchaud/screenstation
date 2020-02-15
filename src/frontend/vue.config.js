const moment = require('moment');
const package = require('./package');
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin');

// const { BASE_PATH, SITE_ORIGIN, META } = require("./src/assets/constants.json");
const devMode = process.env.NODE_ENV !== 'production';
const date = moment().format('YYYY.MM.DD HH:mm');

// vue inspect zeigt die webpack.js an
const templateParams = {
    VUE_APP_VERSION: package.version,
    VUE_APP_DEV_MODE: devMode,
    VUE_APP_PUBLISHED: date,
};

// https://cli.vuejs.org/guide/mode-and-env.html#environment-variables
process.env.VUE_APP_VERSION = templateParams.VUE_APP_VERSION;
process.env.VUE_APP_DEV_MODE = templateParams.VUE_APP_DEV_MODE;
process.env.VUE_APP_PUBLISHED = templateParams.VUE_APP_PUBLISHED;

// http://bit.ly/2P5Pzdu
module.exports = {
    configureWebpack: (config) => {
        config.entry = {
            app: './src/main.ts',
            mobile: './src/mobile.ts',
        };

    },

    chainWebpack: (config) => {
        config.plugin('html').tap((args) => {
            return args.map((arg) => {
                return Object.assign({}, arg, {
                    templateParameters(params) {
                        return Object.assign({}, arg.templateParameters(params), templateParams);
                    },
                });
            });
        });

        // config.plugin("vuetify-loader").use(VuetifyLoaderPlugin);
    },

    // configure autoprefixer
    // autoprefixer: {
    //    browsers: ['last 2 versions'],
    //},
};
