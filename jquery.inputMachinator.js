
/*
Input Machinator
jQuery plugin that will make your non-styleable inputs (checkboxes, radio buttons, selects) pretty.
It works by hiding the original inputs and adding certain span elements that will appear to the user,
while still allowing you to interact with the inputs from javascript as if this plugin didn't exist.

----------

Copyright (c) 2013, Sense/Net Inc. http://www.sensenet.com/
Created by Timur Kristóf, Panna Zsámba, and Anikó Litványi
Licensed to you under the terms of the MIT License

----------

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify,
merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be included in all copies
or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function ($) {

    // Disables the text selection on elements
    $.fn.disableSelection = function () {
        return this.css('user-select', 'none').css('-moz-user-select', 'none').on('selectstart.machinator', false);
    };

    // Performs the input machinator
    $.fn.inputMachinator = function (options) {
        options = $.extend({
            checkbox: true,
            radio: true,
            select: true
        }, options);

        var comboBoxAnimationDuration = options.comboBoxAnimationDuration || 190;
        var $checkboxesAndRadios = $();
        var $selects = $();

        // Check which controls machinator should run on
        if (options.checkbox)
            $checkboxesAndRadios = $checkboxesAndRadios.add(this.find("input[type=checkbox]"));
        if (options.radio)
            $checkboxesAndRadios = $checkboxesAndRadios.add(this.find("input[type=radio]"));
        if (options.select)
            $selects = $selects.add(this.find("select"));

        // Run machinator on checkboxes and radios
        $checkboxesAndRadios.each(function () {
            var $input = $(this);

            // Check if it's already done
            if ($input.data('inputmachinator-done') === true)
                return;

            var $label = $();
            var originalClasses = " " + $input.attr("class");
            var isRadio = $input.attr("type") == "radio";
            var $radioGroup = null;
            if (isRadio) {
                var name = $input.attr("name");
                $radioGroup = $("input[type=radio][name='" + name + "']");
            }

            // Add an <a> element (the "fake" checkbox)
            var $span = $("<a class='" + (isRadio ? "machinator-radio" : "machinator-checkbox") + originalClasses + "'></a>");
            $span.insertAfter($input);
            $span.disableSelection();

            // When the checkbox changes, this will adjust the span automatically
            var changeCallback = function () {
                if ($input.attr("disabled")) {
                    $span.addClass("machinator-disabled").attr('tabindex', '-1');
                    $label.addClass("machinator-disabled");
                }
                else {
                    $span.removeClass("machinator-disabled").attr('tabindex', '0');
                    $label.removeClass("machinator-disabled");
                }
                if ($input.prop("checked") === true || $input.is(":checked") === true) {
                    $span.removeClass("unchecked").addClass("checked");
                }
                else {
                    $span.removeClass("checked").addClass("unchecked");
                }
            };
            // If the checkbox is checked, uncheck. If it's unchecked, check.
            var toggleCheck = function () {
                if ($input.prop("checked") === true || $input.is(":checked") === true) {
                    $input.removeAttr("checked");
                    $input.prop("checked", false);
                }
                else {
                    $input.attr("checked", "checked");
                    $input.prop("checked", true);
                }

                $input.trigger('change');
            };
            // This is called when someone clicked on the "fake" element
            var clickCallback = function (e) {
                if ($input.attr("disabled"))
                    return;

                if ($radioGroup != null) {
                    // Uncheck all the radios in the group
                    $radioGroup.removeAttr("checked");
                    $radioGroup.prop("checked", false);
                    $radioGroup.trigger('change');
                }

                // Toggle the checked attribute of this element
                toggleCheck();

                if (e)
                    e.preventDefault();
                return false;
            };

            // Hide the check box
            $input.hide();

            // Change event handler
            $input.on('change.machinator', changeCallback);

            // Find the added span
            $span.on('click.machinator', clickCallback);

            // Take care of keyboard navigation
            $span.attr('tabindex', '0').on('keydown.machinator', function (e) {
                // NOTE: this will not work in browsers that don't support the tabindex attribute

                if (e.which === 13 || e.which === 32 || e.which === 10) {
                    clickCallback.call(this);
                    e.preventDefault();
                    return false;
                }
            });

            // Find the label associated with this input
            var id = $input.attr("id");
            var labelIsParent = false;

            if (id) {
                // Try to find a label whose for attribute is set to the id of the input
                $label = $('label[for="' + id + '"]');
                labelIsParent = $label.length ? $label[0].contains($input[0]) : false;
            }
            if (!$label.length) {
                // Handle the case when the input is inside the label
                $label = $input.closest("label");
                labelIsParent = $label.length ? true : false;
            }

            if ($label.length) {
                $label.disableSelection();
                $label.addClass(isRadio ? "machinator-radio-label" : "machinator-checkbox-label");

                // If the label is parent of the checkbox, the label's click event will run,
                // no need for the click event of the span.
                if (labelIsParent) {
                    $span.off('click.machinator');
                }

                // IE and Firefox treat double click as just one change for the checbox while Chrome treats it as two changes.
                // Let's just make it behave the same sane way.
                if (!isRadio && (navigator.userAgent.indexOf("MSIE" >= 0) || navigator.userAgent.indexOf("Mozilla") === 0)) {
                    $label.on("dblclick.machinator", clickCallback);
                }

                // Browsers do not change the checked state automatically when the user clicks on a label of a radio
                // or when the user is in IE<=8
                if (isRadio || navigator.userAgent.indexOf("MSIE 8.0") >= 0) {
                    $label.on('click.machinator', clickCallback);
                }
            }

            // Trigger change so that the initial value is set up correctly
            $input.trigger('change');

            // Set done
            $input.data('inputmachinator-done', true);
        });

        // Run machinator on selects
        $selects.each(function () {
            var $select = $(this);

            // Check if it's already done
            if ($select.data('inputmachinator-done') === true)
                return;

            var $ul = null;

            // Add an <a> element (the "fake" dropdown)
            var $span = $("<a></a>");
            $span.attr('class', $select.attr('data-machinator-class'));
            $span.addClass('machinator-select');
            $span.insertAfter($select);
            $span.disableSelection();

            // Hide the real dropdown
            $select.hide();

            // Function to hide the ul
            var hideUl = function () {
                $(document).off("mousedown.machinator");
                $(window).off('mousewheel.machinator DOMMouseScroll.machinator');
                var $old_ul = $ul;
                if ($ul != null) {
                    // Hide the dropdown
                    $ul.animate({
                        'height': 0
                    }, {
                        duration: comboBoxAnimationDuration,
                        complete: function () {
                            $old_ul.remove();
                        }
                    });
                    $ul = null;
                    return;
                }
            };

            // When the real select changes, adjust the fake select
            $select.on("change.machinator", function () {
                // Add disabled class if necessary
                if ($select.attr("disabled")) {
                    $span.addClass("machinator-disabled").attr('tabindex', '-1');
                }
                else {
                    $span.removeClass("machinator-disabled").attr('tabindex', '0');
                }
                // Find the selected option
                var val = $select.val();
                // First attempt: find selected option by selected attribute
                var $option = $select.find('option[selected]');
                if (!$option.length) {
                    // Fallback: find selected option by value
                    $option = $select.find('option[value="' + val + '"]');
                }
                if (!$option.length) {
                    // Fallback: find selected option by text (in case the value attribute is not set)
                    $option = $select.find('option').filter(function() { return $(this).text() === val; });
                }
                if ($option.length) {
                    // Set the option to an acceptable initial state
                    setOption($option, null, true);
                    // If there is a selected option, the span's HTML content will be the selected option's content
                    $span.html($option.attr('data-machinator-html') || $option.html());
                }
                else {
                    // Otherwise the span will be empty
                    $span.html("&nbsp;");
                }
            });

            var setOption = function ($selectedOption, $options, dontTriggerChange) {
                var $options = $options || $select.find("option");

                // Remove the selected attribute from all the options
                $options.removeAttr("selected");
                // Add the selected attribute to that option
                $selectedOption.attr("selected", "selected");
                // Set val of the select
                $select.val($selectedOption.val());
                // Make the span update itself
                if (!dontTriggerChange)
                    $select.trigger('change');
            };

            // Take care of keyboard navigation
            $span.attr('tabindex', '0').on('keydown.machinator', function (e) {
                if (e.keyCode !== 37 && e.keyCode !== 38 && e.keyCode !== 39 && e.keyCode !== 40) {
                    return;
                }

                if (!$select.attr("disabled")) {
                    var $selected = $select.find("option[selected]");

                    // If nothing is selected, select first option
                    if (!$selected.length) {
                        setOption($($select.find("option:first-child")[0]));
                    }
                    // Up / left
                    else if (e.keyCode === 37 || e.keyCode === 38) {
                        var $parent = $selected.parent();
                        for (var $next = $selected.prev(); true; $next = $next.prev()) {
                            // If next element exists
                            if ($next.length) {
                                // If next element is an option, just set it
                                if ($next.is("option")) {
                                    if ($next.attr("disabled") || ($next.parent().attr("disabled")))
                                        continue;
                                    
                                    setOption($next);
                                    break;
                                }
                                else if ($next.is("optgroup")) {
                                    if ($next.attr("disabled"))
                                        continue;
                                    
                                    // Find first option in optgroup
                                    var $opt = $next.find(">:last-child");
                                    if ($opt.length) {
                                        setOption($opt);
                                        break;
                                    }
                                }
                            }
                            // Otherwise find next optgroup
                            else if ($parent.is("optgroup")) {
                                if (!$parent.prev().length)
                                    break;
                                $next = $parent;
                            }
                            else {
                                break;
                            }
                        }
                    }
                    // Down / right
                    else if (e.keyCode === 39 || e.keyCode === 40) {
                        var $parent = $selected.parent();
                        for (var $next = $selected.next(); true; $next = $next.next()) {
                            // If next element exists
                            if ($next.length) {
                                // If next element is an option, just set it
                                if ($next.is("option")) {
                                    if ($next.attr("disabled") || ($next.parent().attr("disabled")))
                                        continue;
                                    
                                    setOption($next);
                                    break;
                                }
                                else if ($next.is("optgroup")) {
                                    if ($next.attr("disabled"))
                                        continue;
                                    
                                    // Find first option in optgroup
                                    var $opt = $next.find(">:first-child");
                                    if ($opt.length) {
                                        setOption($opt);
                                        break;
                                    }
                                }
                            }
                            // Otherwise find next optgroup
                            else if ($parent.is("optgroup")) {
                                if (!$parent.next().length)
                                    break;
                                $next = $parent;
                            }
                            else {
                                break;
                            }
                        }
                    }
                }

                e.preventDefault();
                return false;
            });

            // When the user clicks on the fake select
            $span.on("click.machinator", function () {
                // If the dropdown is already open
                if ($ul != null) {
                    // Hide the dropdown
                    hideUl();
                    return;
                }

                if ($select.attr("disabled"))
                    return;
                
                // Create HTML for the ul (options)
                var $options = $();
                var ulHtml = "<ul class='machinator-select-dropdown'>";
                // This function will be used to process each <option>
                var parseOption = function ($option, disabled) {
                    var isSelected = false;
                    $options = $options.add($option);
                    disabled = disabled ? true : (typeof($option.attr("disabled")) !== "undefined");
                    if ($option.val() == $select.val())
                        isSelected = true;

                    var optionHtml = $option.attr('data-machinator-html') || $option.html();
                    ulHtml += '<li class="machinator-option' + (disabled ? " machinator-disabled" : "") + (isSelected ? " selected" : "") + '" data-machinator-val="' + $option.val() + '">' + optionHtml + '</li>';
                };
                // Iterate through <option> and <optgroup> elements
                var $optionsAndOptGroups = $select.children("option, optgroup");
                $optionsAndOptGroups.each(function() {
                    var $this = $(this);
                    // Take care of <option>s
                    if ($this.is("option")) {
                        parseOption($this);
                    }
                    // Take care of <optgroup>s
                    else if ($this.is("optgroup")) {
                        // See if it's disabled
                        var disabled = typeof($this.attr("disabled")) !== "undefined";
                        // Add markup for the whole optgroup
                        ulHtml += "<li class='machinator-optgroup" + (disabled ? " machinator-disabled" : "") + "'>";
                        // Add markup for the label of the optgroup
                        if ($this.attr("label")) {
                            ulHtml += "<span class='machinator-optgroup-label'>" + $this.attr("label") + "</span>";
                        }
                        // Add markup for sub-options
                        var $suboptions = $this.children("option");
                        if ($suboptions.length) {
                            ulHtml += "<ul class='machinator-optgroup-options'>";
                            $suboptions.each(function() {
                                parseOption($(this), disabled);
                            });
                            ulHtml += "</ul>";
                        }
                        ulHtml += "</li>"
                    }
                });
                ulHtml += '</ul>';

                // Create the ul element
                $ul = $(ulHtml);
                $ul.appendTo($("body"));
                $ul.disableSelection();
                var spanOffset = $span.offset();
                var leftBorder = parseInt($span.css("border-left-width"), 0);
                var rightBorder = parseInt($span.css("border-right-width"), 0);
                var oldH = $ul.height();
                var openUp = $select.hasClass("up");
                $ul.css({
                    'position': 'absolute',
                    'left': spanOffset.left,
                    'width': $span.outerWidth() - leftBorder - rightBorder
                });
                // Determine if it should be opened on top or bottom
                if (openUp)
                    $ul.css('bottom', $("body").outerHeight() - spanOffset.top);
                else
                    $ul.css('top', spanOffset.top + $span.outerHeight());


                $ul.css("height", 0);
                $ul.animate({
                    'height': oldH
                }, {
                    duration: comboBoxAnimationDuration
                });

                // When the user clicks on anywhere else
                $(document).on("mousedown.machinator", function (event) {
                    if ($ul != null) {
                        var $target = $(event.target);
                        // If the user did really click somewhere else
                        if (!$target.hasClass("machinator-select-dropdown") && !$target.closest("ul.machinator-select-dropdown").length && $target[0] !== $span[0]) {
                            // Hide the dropdown
                            hideUl();
                        }
                    }
                });

                // When the user scrolls with the mouse
                $(window).on('mousewheel.machinator DOMMouseScroll.machinator', function (event) {
                    var $target = $(event.target);
                    if (!$target.closest("ul.machinator-select-dropdown").length) {
                        // If the user scrolled outside, hide the dropdown
                        hideUl();
                    }
                });

                // When the user clicks on one of the options
                $ul.on("click.machinator", "li.machinator-option:not(.machinator-disabled)", function () {
                    // Find the newly selected value
                    var $li = $(this);
                    var $selectedOption = null;
                    $options.each(function () {
                        var $option = $(this);
                        if ($option.val() == $li.attr("data-machinator-val")) {
                            $selectedOption = $option;
                        }
                    });

                    // Make that the selected option
                    setOption($selectedOption, $options);

                    // Hide the dropdown
                    $ul.off("click.machinator");
                    hideUl();
                    $span.focus();
                });
            });

            // Trigger change to set the span to its initial state
            $select.trigger('change');

            // Set done
            $select.data('inputmachinator-done', true);
        });

        // For chainability, return the value of this
        return this;
    };
})(jQuery);

$(function () {
    $(".machinator").inputMachinator();
});
