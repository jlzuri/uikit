(function(addon) {

    var component;

    if (jQuery && jQuery.UIkit) {
        component = addon(jQuery, jQuery.UIkit);
    }

    if (typeof define == "function" && define.amd) {
        define("uikit-tagger", ["uikit"], function(){
            return component || addon(jQuery, jQuery.UIkit);
        });
    }

})(function($, UI){

    "use strict";

    UI.component('tagger', {
        defaults: {
            preload         : null,
            maxNumTags      : 1000,
            skipListChars   : [],
            inputName       : 'tags[]',
            msgMoreOptions  : 'Add Tag',
            template        : '<ul class="uk-nav uk-nav-autocomplete uk-autocomplete-results">\
                                   {{#items && items.length}}\
                                       {{~items}}\
                                       <li data-value="{{$item.value}}">\
                                           <a>{{$item.value}}</a>\
                                       </li>\
                                       {{/items}}\
                                       {{#msgMoreOptions}}\
                                          <li class="uk-nav-divider uk-skip"></li>\
                                          <li data-moreoptions="true"><a>{{msgMoreOptions}}</a></li>\
                                       {{/msgMoreOptions}}\
                                   {{/end}}\
                                   {{^items.length}}\
                                     {{#msgMoreOptions}}\
                                         <li data-moreoptions="true"><a>{{msgMoreOptions}}</a></li>\
                                     {{/msgMoreOptions}}\
                                   {{/end}}\
                               </ul>',
            tagTemplate     : '<div class="uk-tag {{tagModifier}}" data-uk-alert>\
                                    <input type="hidden" name="{{name}}" value="{{value}}"/>\
                                  <p>{{value}}</p>\
                                  <a href="#" class="uk-alert-close uk-close"></a>\
                              </div>',
            msgBeforeChars  : 'These characters are not allowed: ',
            msgAfterChars   : '',
            alertTemplate   : '<div class="uk-alert uk-alert-danger" data-uk-alert>\
                                  {{{msgBeforeChars}}}{{{skipListChars}}}{{{msgAfterChars}}}\
                                  <a href class="uk-alert-close uk-close"></a>\
                              </div>',

            renderer: function(data) {

                var $this = this, opts = this.options;

                this.dropdown.append(this.template({"items":data.results || [], "msgMoreOptions":opts.msgMoreOptions}));
                this.show();
            }
        },

        init: function() {
            var $this = this;
            var numTags = 0;
            var alertShown = false;
            var skipListRegex = this.options.skipListChars.length > 0 ? 
                new RegExp('\\' + this.options.skipListChars.join('|\\'), 'g') :
                new RegExp("($^)", 'g');

            this.autocomplete = UI.autocomplete(this.element, this.options);

            //TODO: add uk-dropdown-tagger to tagger.less
            //to personalize the dropdown menu's layout.
            this.autocomplete.dropdown.addClass('uk-dropdown-tagger');

            this.tagTemplate = this.find('script[type="text/tagTemplate"]').html();
            this.tagTemplate = UI.Utils.template(this.tagTemplate || this.options.tagTemplate);

            this.alertTemplate = this.find('script[type="text/alertTemplate"]').html();
            this.alertTemplate = UI.Utils.template(this.alertTemplate || this.options.alertTemplate);

            this.input = this.find("input:last").attr("autocomplete", "off");
            this.insertPoint = this.input.parent();

            if(this.options.preload)
            {
                var tags = this.options.preload;
                switch(typeof(tags)) {
                    case 'object':
                        if(tags.length) {
                            tags.forEach(function(tag){
                                $this.insertPoint.before(
                                    $this.tagTemplate({
                                      "name": $this.options.inputName,
                                      "value":tag.value,
                                      "tagModifier":''
                                }));
                                numTags++;
                            });
                        }
                        break;

                    default:
                        break;
                }
            }

            this.input.on({
              "keyup": function(e) {
                  if (e && e.which)
                  {
                      var str = $this.input.val();
                      if(str.lenght > 0 && skipListRegex.test(str)) {
                          e.preventDefault();
                          str = str.replace(skipListRegex, '');
                          $this.input.val(str);

                          if(!alertShown)
                          {
                              $this.element.before($this.alertTemplate({
                                  "skipListChars":  $this.options.skipListChars.toString(),
                                  "msgBeforeChars": $this.options.msgBeforeChars,
                                  "msgAfterChars":  $this.options.msgAfterChars
                              }));
                              alertShown = true;
                          }
                      }
                  }
              },
              "keydown": function(e) {
                  if (e && e.which && e.which === 8 && $this.input.val() === '') {
                      e.preventDefault();
                      $this.element.find('.uk-tag:last').remove();
                      numTags = Math.max(numTags-1 , 0);
                  }
                  else if(e && e.which && e.which !== 9 && numTags >= $this.options.maxNumTags)
                  {
                      e.preventDefault();
                      $this.input.val('');
                  }
              } 
            });

            this.autocomplete.input.on("keyup", function(){
                $this.element[$this.autocomplete.input.val() ? "addClass":"removeClass"]("uk-active");
            }).closest("form").on("reset", function(){
                $this.value="";
                $this.element.removeClass("uk-active");
            });

            this.on({
                'selectitem.uk.autocomplete': function(e, data) {
                    if (data.value) {

                      $this.insertPoint.before(
                          $this.tagTemplate({
                            "name": $this.options.inputName,
                            "value":data.value,
                            "tagModifier":''
                      }));

                    }
                    else if(data.moreoptions) {

                      $this.insertPoint.before(
                          $this.tagTemplate({
                              "name": $this.options.inputName,
                              "value":$this.input.val(), 
                              "tagModifier":'uk-tag-alt'
                      }));

                    }
                    $this.input.val('');
                    delete data.value;
                    numTags++;
                },
                'closed.uk.alert': function(e, data) {
                    numTags = Math.max(numTags-1 , 0);
                }
            });

            this.element.data("tagger", this);
        }
    });

    // auto init
    UI.ready(function(context) {

        $("[data-uk-tagger]", context).each(function(){

            var ele = $(this);

            if(!ele.data("tagger")) {
                var plugin = UI.tagger(ele, UI.Utils.options(ele.attr("data-uk-tagger")));
            }
        });
    });
});