input-machinator
================

input-machinator is a jQuery plugin for creating pretty input fields.

It creates styleable elements for check boxes, radio buttons and selects. All the other HTML input elements are reasonably styleable with CSS so we decided not to bother those.

An example is available in this source tree in the `example` folder.

How it works
-----------

The inputMachinator plugin creates a span element for every affected input element and hides the original input element. User interaction happens on the span elements and the input elements are updated accordingly.

How to use
----------

You can use it like this:

```javascript
$(selector).inputMachinator();
```

The plugin also automatically activates itself on document ready on every element with the `machinator` class. Please do NOT call the plugin on the same elements multiple times.

After calling the plugin on a set of elements, the site builder only has to create some CSS for the following:

* `span.machinator-checkbox` - created for checkboxes
* `span.machinator-radio` - created for radio buttons
* `span.machinator-select` - created for selects
* `ul.machinator-select-dropdown` - dropdown for selects, attached to the end of document body
* the `machinator-disabled` class will be added to the spans for disabled elements

Things to note
--------------

If you change the value of the underlying input element programmatically, you will have to trigger the `change` event on them to update the pretty ones:

```javascript
var $sel = $("input[checkbox].yourClass");
$sel.prop("checked", true);
$sel.trigger("change");
```
