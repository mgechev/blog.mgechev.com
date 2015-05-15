---
title: 'Looking for performance? Probably you should NOT use [].sort (V8)'
author: minko_gechev
layout: post
permalink: /2012/11/24/javascript-sorting-performance-quicksort-v8/
categories:
  - Algorithms
  - Browsers
  - Development
  - JavaScript
  - Linux
  - OpenSource
  - Performance
  - Sorting
  - Webkit
tags:
  - Algorithms
  - Development
  - Heapsort
  - JavaScript
  - Mergesort
  - performance
  - Programming
  - Quicksort
  - Sorting
---

A few days ago, I&#8217;ve created a <a title="Algorithms implemented in JavaScript" href="https://github.com/mgechev/javascript-algorithms" target="_blank">GitHub repository</a>. It&#8217;s main goal was to collect different algorithms with implementations in JavaScript. I started with basic ones &#8211; sorting (insertion, selection, bubble sort..). After that I implemented few &#8220;more advance&#8221; like marge, quick and heap sort. It was interesting to me how much slower my implementation will be compared to the default sort. It was so interesting because of:

{% highlight javascript %}function sort() { [native code] }{% endhighlight %}

That&#8217;s why I&#8217;ve wrote not optimized version of mergesort and I&#8217;ve run it with generated array with 500k elements. I waited&#8230;waited&#8230;and at last, after about 15 minutes the array was sorted. It was quite disappointing. I decided that it was so slow because of the recursion inside it. I have had bad experience with DFS using recursion for manipulating the DOM tree. The result for the default sort was about 0.5 seconds. For that test I&#8217;ve used nodejs (<a href="https://en.wikipedia.org/wiki/Nodejs" target="_blank">it uses Google&#8217;s V8 engine</a>). After merge sort I&#8217;ve implemented heap sort. Also not bad algorithm with complexity O(nlog(n)). I though that it will be faster in Node.js because in my opinion that the recursion was the thing that made the mergesort so slow. I&#8217;ve generated another array with 500k elements using a simple perl script. The result was very interesting&#8230;In the chart below you can see mergesort compared to heapsort for array with 50k elements.

<div id="attachment_237" style="width: 683px" class="wp-caption alignnone">
  <a href="http://blog.mgechev.com/wp-content/uploads/2012/11/50k-heap-vs-merge.png"><img class="size-full wp-image-237 " title="Heapsort vs Mergesort 50k" src="http://blog.mgechev.com/wp-content/uploads/2012/11/50k-heap-vs-merge.png" alt="" width="673" height="385" /></a><p class="wp-caption-text">
    Heapsort vs Mergesort 50k elements
  </p>
</div>

In the X-axis it&#8217;s an attempt number, the Y-axis is the time required for the algorithm to finish (in seconds).

Here is the implementation of the Mergesort:

{% highlight javascript %}/* Mergesort */
var mergeSort = (function () {
    function merger(array, start, end) {
        if (Math.abs(end - start) <= 1) {
            return [];
        }
        var middle = Math.ceil((start + end) / 2);

        merger(array, start, middle);
        merger(array, middle, end);

        return merge(array, start, middle, end);
    }

    function merge(array, start, middle, end) {
        var left = [],
            right = [],
            leftSize = middle - start,
            rightSize = end - middle,
            maxSize = Math.max(leftSize, rightSize),
            size = end - start,
            i;

        for (i = 0; i < maxSize; i += 1) {
            if (i < leftSize) {
                left[i] = array[start + i];
            }
            if (i < rightSize) {
                right[i] = array[middle + i];
            }
        }
        i = 0;
        while (i < size) {
            if (left.length && right.length) {
                if (left[0] >= right[0]) {
                    array[start + i] = right.shift();
                } else {
                    array[start + i] = left.shift();
                }
            } else if (left.length) {
                array[start + i] = left.shift();
            } else {
                array[start + i] = right.shift();
            }
            i += 1;
        }
        return array;
    }
    return function (array) {
        return merger(array, 0, array.length);
    }

}());

{% endhighlight %}

And the heapsort:

{% highlight javascript %}/* Heapsort */
var heapSort = (function () {
    function heapify(array, index, heapSize) {
        var left = 2 * index + 1,
            right = 2 * index + 2,
            largest = index;

        if (left < heapSize && array[left] > array[index])
            largest = left;

        if (right < heapSize && array[right] > array[largest])
            largest = right;

        if (largest !== index) {
            var temp = array[index];
            array[index] = array[largest];
            array[largest] = temp;
            heapify(array, largest, heapSize);
        }
    }

    function buildMaxHeap(array) {
        for (var i = Math.floor(array.length / 2); i >= 0; i -= 1) {
            heapify(array, i, array.length);
        }
        return array;
    }

    return function (array) {
        var size = array.length,
            temp;
        buildMaxHeap(array);
        for (var i = array.length - 1; i > 0; i -= 1) {
            temp = array[0];
            array[0] = array[i];
            array[i] = temp;
            size -= 1;
            heapify(array, 0, size);
        }
        return array;
    };
}());
{% endhighlight %}

If you find any mistakes in any of the implementations I&#8217;ll be glad to know and fix them. In the script above I use simple closure to hide the methods which are not useful for the public API.
After I&#8217;ve made the test between merge and heap sorts I noticed that there&#8217;s a quite big difference&#8230;So that&#8217;s why I started heap vs the default sort to see how faster the native sort will be:

<div id="attachment_239" style="width: 683px" class="wp-caption alignnone">
  <a href="http://blog.mgechev.com/wp-content/uploads/2012/11/500k-heap-vs-default.png"><img class="size-full wp-image-239" title="Heapsort vs the default sort 500k elements" src="http://blog.mgechev.com/wp-content/uploads/2012/11/500k-heap-vs-default.png" alt="" width="673" height="385" /></a><p class="wp-caption-text">
    Heapsort vs the default sort 500k elements
  </p>
</div>

As you see the result is quite unexpected&#8230;I&#8217;ve checked my algorithm many times because I thought that it isn&#8217;t correct&#8230;In more than half of the cases (because as you might see there are 50 tests) heapsort is faster than the default sort. The default sort is some kind of optimized quicksort mixed with insertion sort for small arrays. The exact implementation of the V8 sort can be found <a href="https://github.com/v8/v8" target="_blank">somewhere here</a>.

That is the perl script which I used for the test:

{% highlight perl %}#!/usr/bin/perl

use strict;
use warnings;
use Time::HiRes qw/time/;

my %sorts = ();
my %algorithm_source = ();

#Generates JavaScript array with defined size and maximum size of it's elements
sub generate_js_array($ $) {
    my ($size, $max) = @_;
    my $array = 'var array = [';
    map { $array .= rand($max) . ",\n" } (0..$size);
    chop($array);
    chop($array);
    $array .= '];';
    return $array;
}

#Creates a new test for given sort type and array
sub create_test($ $) {
    my ($sort_type, $array) = @_;
    my $sort_algorithm = $algorithm_source{$sort_type};
    my $test_case = "$array\n$sort_algorithm";
    return $test_case;
}

#Saves the test in a file into the temp directory
sub save_test_case($ $ $) {
    my ($test_case, $sort_type, $i) = @_;
    my $filename = "./temp/$sort_type-$i.js";
    open(FH, ">$filename");
    print FH $test_case;
    close(FH);
    return $filename;
}

#Runs the test and measures the runtime
sub run_test_case($) {
    my $filename = shift;
    my $time = time();
    `d8 $filename`;
    return time() - $time;
}

#Tests an algorithm with given array
sub test_algorithm($ $ $) {
    my ($sort_type, $array, $test_count) = @_;
    my ($test_case, $filename, $performance);
    $test_case = create_test($sort_type, $array);
    $filename = save_test_case($test_case, $sort_type, $test_count);
    print "Running the test case...\n";
    $performance = run_test_case($filename);
    #unlink($filename);
    print "Cleaning the trash...\n";
    return $performance;
}

#Gets the source of an algorithm from the algorithms folder
sub get_algorithm($) {
    my $sort_type = shift;
    my $file = $sorts{$sort_type};
    my $result = '';
    open(FH, "<./algorithms/$file");
    while (<FH>) {
        $result .= $_;
    }
    close(FH);
    return $result;
}

#Caches all algorithms into a hash with keys the algorithm name and value the algorithm
sub cache_algorithms_source {
    for my $algorithm (keys(%sorts)) {
        $algorithm_source{$algorithm} = get_algorithm($algorithm);
    }
}

#Tests all algorithms with different arrays and tests count
sub test_algorithms($ $ $) {
    my ($tests_count, $size, $max) = @_;
    my %result = ();
    my ($array, $count);
    for (my $i = 0; $i < $tests_count; $i += 1) {
        $array = generate_js_array($size, $max);
        $count = $i + 1;
        for my $algorithm (keys(%sorts)) {
            print "Running $algorithm test number $count...\n";
            $result{$algorithm} = [] unless defined($result{$algorithm});
            push(@{$result{$algorithm}}, test_algorithm($algorithm, $array, $i));
        }
    }
    return \%result;
}

#Builds a CSV string from the results
sub build_csv($) {
    my $result = shift;
    my %result = %$result;
    my @algorithms = keys(%result);
    my $current;
    my @current_result;
    my $data = '';
    print "Building a CSV statistics...\n";
    for (my $i = 0; $i < scalar(@algorithms); $i += 1) {
        $current = $algorithms[$i];
        $data .= $current . ',';
        @current_result = @{$result{$current}};
        for (my $j = 0; $j < scalar(@current_result); $j += 1) {
            $data .= $current_result[$j];
            if ($j < scalar(@current_result) - 1) {
                $data .= ',';
            }
        }
        $data .= "\n";
    }
    return $data;
}

MAIN: {
    my $max = 0;
    my $array_size = 0;
    my $tests_count = 0;
    print "Starting $tests_count test cases for all
algorithms (" . join(', ', keys(%sorts)) . ") with parementers:
arrays with size $array_size, maximum size of each element $max.\n";

    cache_algorithms_source();
    my $result = test_algorithms($tests_count, $array_size, $max);
    my $csv_result = build_csv($result);

    open(FH, '>result.csv');
    print FH $csv_result;
    close(FH);
    print "Exiting\n";
}
{% endhighlight %}

If you find any issue in the script please let me know, I&#8217;ll fix it as soon as possible.
For the test cases I used both &#8211; different arrays for each algorithm in each test and the same array for each algorithm in each test. I didn&#8217;t found any difference between both alternatives that&#8217;s why I choose to generate a single array for each test (for faster testing).

So let me tell you few words about the script because not everyone is familiar with perl and it&#8217;s syntax. I have three configuration variables: $max, $array\_size and $tests\_count. $max defines the maximum size of the array&#8217;s elements, $array\_size is the size of the arrays we want to test with and $tests\_count is the count of the tests we want to run for each algorithm. For %sorts I set value like: ( Heapsort => &#8216;heapsort.js&#8217;, Default => &#8216;default.js&#8217; ) which means that I want to test Heapsort with filename heapsort.js and the Default sort with script name default.js. For each test case the script generates new array and tests each algorithm with it. Each test is combination of generated array and JavaScript file which contains the sorting algorithm and a line in which the sorting function is being called. In the given script I use Nodejs v0.8.12. In the next cases I&#8217;ll use the V8 JavaScript engine (V8 version 3.10.8) from the v8 fedora package (except if I haven&#8217;t mentioned explicitly that I use something different). In all test cases I&#8217;ll use CPU Intel Corei7 3610QM, 2.3 GHz (except if I haven&#8217;t mentioned explicity different CPU) with Fedora 18, x86_64. The content of default.js is:

{% highlight javascript %}array.sort(function (a, b) {
    return a - b;
});{% endhighlight %}

Let start&#8230;
In the charts below there&#8217;s a statistic for Selection sort, Insertion sort, Bubble sort, Heapsort, Mergesort and the Default sort (Quick/Insertion).

<div id="attachment_240" style="width: 683px" class="wp-caption alignnone">
  <a href="http://blog.mgechev.com/wp-content/uploads/2012/11/100-all.png"><img class="size-full wp-image-240" title="All sort algorithms (selection sort, insertion sort, bubble sort, heapsort, mergesort, quicksort, the default sort) with array with 100 elements" src="http://blog.mgechev.com/wp-content/uploads/2012/11/100-all.png" alt="" width="673" height="385" /></a><p class="wp-caption-text">
    All sort algorithms (selection sort, insertion sort, bubble sort, heapsort, mergesort, quicksort, the default sort) with arrays with 100 elements
  </p>
</div>

In this first chart there&#8217;s a statistic with 100 elements. In this case there&#8217;s almost no difference. The lines are very intertwined but we can see that all sorts have almost the same level of performance.

<div id="attachment_241" style="width: 683px" class="wp-caption alignnone">
  <a href="http://blog.mgechev.com/wp-content/uploads/2012/11/10k-all.png"><img class="size-full wp-image-241 " title="All sort algorithms (selection sort, insertion sort, bubble sort, heapsort, mergesort, quicksort, the default sort) with array with 10k elements" src="http://blog.mgechev.com/wp-content/uploads/2012/11/10k-all.png" alt="" width="673" height="385" /></a><p class="wp-caption-text">
    All sort algorithms (selection sort, insertion sort, bubble sort, heapsort, mergesort, quicksort, the default sort) with array with 10k elements
  </p>
</div>

In the chart above the leaders are almost clear. The default sort is with speed like the mergesort, the heapsort is the fastest. But let&#8217;s increase the array&#8230;Let&#8217;s try with 250k elements:

<div id="attachment_242" style="width: 683px" class="wp-caption alignnone">
  <a href="http://blog.mgechev.com/wp-content/uploads/2012/11/250k-heap-merge-default.png"><img class="size-full wp-image-242" title="Heapsort vs mergesort vs the default sort 250k elements" src="http://blog.mgechev.com/wp-content/uploads/2012/11/250k-heap-merge-default.png" alt="" width="673" height="385" /></a><p class="wp-caption-text">
    Heapsort vs mergesort vs the default sort 250k elements
  </p>
</div>

From the chart it&#8217;s easy to see that the default sort is slower than the merge and the heap sorts&#8230;It&#8217;s very unusual. If you&#8217;ve ever tried to beat the default sort in Java or STL&#8230;well it&#8217;s <del datetime="2012-11-24T17:41:13+00:00">almost</del> impossible.
If we increase the array to more than 300k elements mergesort&#8217;s performance becomes very bad (more than 10 minutes) so I&#8217;ll just exclude the mergesort from the next tests.

Let me include one more algorithm implementation. It will be quicksort. Its&#8217; implementation is like taken from a book, nothing special:

{% highlight javascript %}var quickSort = (function () {

    function partition(array, left, right) {
        var cmp = array[right - 1],
            minEnd = left,
            maxEnd;
        for (maxEnd = left; maxEnd < right - 1; maxEnd += 1) {
            if (array[maxEnd] <= cmp) {
                swap(array, maxEnd, minEnd);
                minEnd += 1;
            }
        }
        swap(array, minEnd, right - 1);
        return minEnd;
    }

    function swap(array, i, j) {
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
        return array;
    }

    function quickSort(array, left, right) {
        if (left < right) {
            var p = partition(array, left, right);
            quickSort(array, left, p);
            quickSort(array, p + 1, right);
        }
        return array;
    }

    return function (array) {
        return quickSort(array, 0, array.length);
    };
}());
{% endhighlight %}

I'll start the test again. The array size will be 500k. The competitors will be quicksort, heapsort and the default sort:

<div id="attachment_243" style="width: 683px" class="wp-caption alignnone">
  <a href="http://blog.mgechev.com/wp-content/uploads/2012/11/500k-quick-heap-default.png"><img class="size-full wp-image-243" title="Heapsort vs mergesort vs quicksort vs the default sort 500k elements" src="http://blog.mgechev.com/wp-content/uploads/2012/11/500k-quick-heap-default.png" alt="" width="673" height="385" /></a><p class="wp-caption-text">
    Heapsort vs mergesort vs quicksort vs the default sort 500k elements
  </p>
</div>

Here is something logical. Quicksort beats heapsort, but the custom (not optimized) quicksort implementation is almost 5 times faster than the default. I guess there's something wrong and maybe the V8 profiler will tell us. I tried to start the native sorting algorithm multiple times with different generated arrays, in a single JavaScript file, because of possible optimizations by the interpreter. The result quicksort vs native with 2 arrays, 1 million elements each, was the same as 2 million elements arrays. So there's not any noticeable optimization.

Here is the last statistic with V8 v3.10.8. The array size this time will be 2 million.

<div id="attachment_244" style="width: 683px" class="wp-caption alignnone">
  <a href="http://blog.mgechev.com/wp-content/uploads/2012/11/2m-quick-heap-default.png"><img class="size-full wp-image-244" title="Heapsort vs mergesort vs quicksort vs the default sort 2m elements (V8 version 3.10.8)" src="http://blog.mgechev.com/wp-content/uploads/2012/11/2m-quick-heap-default.png" alt="" width="673" height="385" /></a><p class="wp-caption-text">
    Heapsort vs mergesort vs quicksort vs the default sort 2m elements (V8 version 3.10.8)
  </p>
</div>

The default sort is more than 5 times slower...
In the next chart there's statistics with the V8 engine used by node v0.8.12.

<div id="attachment_245" style="width: 683px" class="wp-caption alignnone">
  <a href="http://blog.mgechev.com/wp-content/uploads/2012/11/2m-quick-heap-default-node.png"><img class="size-full wp-image-245" title="Heapsort vs mergesort vs quicksort vs the default sort 2m elements (node v0.8.12)" src="http://blog.mgechev.com/wp-content/uploads/2012/11/2m-quick-heap-default-node.png" alt="" width="673" height="385" /></a><p class="wp-caption-text">
    Heapsort vs mergesort vs quicksort vs the default sort 2m elements (node v0.8.12)
  </p>
</div>

In the chart above the quicksort custom implementation is again the fastest. The difference is less because of poor performance of the custom implementation of quicksort and faster default sort...
If you're interested about the tests with other CPU types please send me a message and I'll post them. The difference is not impressive. With Core2Duo Heapsort's performance is poor than the default sort but quicksort is again almost 1.5 seconds faster, when sorting array with 2 million items (node v0.8.14, under Windows 7).

Lesson learned is that you should not use the default sort in the Google's V8 engine for large arrays of data and multiples sorts. What will be an eventual drawback. Imagine you have a high traffic website. There's large amount of data which you receive each 10 seconds. You need to sort it and process it in any way. Let's say that the data is with 2m records. If you use the default sort you'll loose 5 seconds on each sort, so for two minutes you'll lose 1 minute only for sorting. If you use your custom quicksort implementation each sort will lose about 1 second. For two minutes you're going to lose 12 seconds. For small amount of data it's not a big deal what kind of sorting algorithm you're going to use...Even, I think that the default will be more readable and error resistant.

All files used for the test (except the generated ones) can be found <a href="https://github.com/mgechev/v8-sorting-test" target="_blank">here</a>.
