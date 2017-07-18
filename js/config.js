require.config({
  baseUrl: "js/",
  paths: {
    jquery: 'libs/jquery-1.10.2.min',
    underscore: 'libs/underscore-min',
    backbone: 'libs/backbone-min',
    jqueryTmpl: 'libs/jquery.tmpl.min',
    bootstrap: 'libs/bootstrap.min',
    highlight: 'libs/highlight.min',
    wangEditor: 'wangEditor/dist/js/wangEditor.min',
    ace: 'ace/lib/ace'
  }
,
  shim: {
    underscore: {
      exports: "_"
    },
    jqueryTmpl: {
        deps: ['jquery'],
        exports: '$.fn'
    },
    bootstrap: {
      deps: ['jquery'],
      exports: '$.fn'
    },
    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    }
  }
});