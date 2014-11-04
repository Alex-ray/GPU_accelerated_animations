# The Web Animations You've Always Wanted

What kind of animations ***do*** you want?

You want 60 frames per second animations that's what you want. In fact that's what we ***all*** want. ( unless of course you're the 0.001% of hipsters out there doing 32.5 fps because no one else is ).

So how are we gonna get there?

GPU compositing, thats how.

## GPU what?

GPU ***<a href="https://www.google.com/#q=definition+compositing" target="_blank">Compositing</a>***, or the part of the browser that has access to the GPU and controls frame rendering. The key part here is its ability to access the ***<a href="https://www.google.com/#q=definition+gpu" target="_blank">GPU</a>***, it's fast, really fast.

You see before all this "GPU compositing" and "hardware acceleration" stuff, the browsers rendering process took place completely on CPU while the GPU was largely unused by the browser.

<a href="http://blogs.nvidia.com/blog/2009/12/16/whats-the-difference-between-a-cpu-and-a-gpu/" target="_blank" >Whats the difference you ask ?</a>

In short the CPU has a few cores, lots of cache and can only handle a couple threads at a time. The GPU on the other hand has hundreds of cores and can handle thousands of threads. Or to put it another way, the GPU is faster, more than 100 times faster all while consuming less resources ( it's easier on the batteries ).

Over the years software engineers have developed a rendering process that takes advantage of the GPU. This architecture is often referred to as "hardware acceleration" or "GPU accelerated" and it's what's going to get us our silky smooth 60 frame per second animations.

So what does this mean and how can I use it?

It means we can create complex, in-depth animations without sacrificing performance and I am going to show you how to take advantage of it.

To make this article easier to digest I have broken it up into three main sections [Part 1](./#part_1), [Part 2](./#part_2) and [Part 3](./#part_3).

In [Part 1](./#part_1) we will take a look at how the browsers internally represents a web page through data trees known as layers.

[Part 2](./#part_2) will cover how these data layers are then used to issue commands to the GPU ( the compositor ).

And finally, in [Part 3](./#part_3) we will bring it all together with some practical examples and demonstrations to bring GPU accelerated animations into the real world.

For those of you who like to keep it short and sweet, feel free to skip the deep dive and get [Straight To The Point](./#straight_to_the_point ) [here.](./#straight_to_the_point )

And for those of you who like to jump around here are some quick links.
- [Part 1](./#part_1)
	- [Forest of Trees](./#forest_of_trees)
	- [Render Tree](./#render_tree)
	- [Render Layer](./#render_layer)
	- [Graphics Layer](./#graphics_layer)
- [Part 2](./#part_2)
	- [The Compositor](./#the_compositor)
	- [Tiles](./#tiles)
- [Part 3](./#part_3)
	- [Straight To The Point](./#straight_to_the_point)

## A Fair Warning

This article focuses on ***Webkit's*** rendering process and more specifically the Chromium port of Webkit. How Chrome implements it's own rendering process might be slightly different on other web platforms. With that said these concepts should be implemented similarly across all major browsers ( after all there's only so many ways you can skin a cat ).

I also want to point out that Chrome's architecture is constantly evolving and while I will try to only cover concepts that are unlikely to change, there are no guarantees.

And whit that, let's begin our journey.

<h2 id="part_1">
	<a href="./#part_1">Part 1</a>
</h2>

<h3 id="the_forest_of_trees">
	<a href="./#the_forest_of_trees">The Forest of Trees</a>
</h3>

The DOM node, it's where every web page starts, so naturally, it's where we'll start too. If you're a developer the DOM should be nothing new. A simple representation of HTML elements that is directly accessible to developers.

However there are a few other representations the browser uses during its rendering process that are ***not*** directly accessible to developers.

These internal representations will help us understand how the browser rendering process works. But first lets quickly go over some terminology to make sure we're all on the same page.

**Bitmap :** - A buffer of pixel values in memory.

**Texture :** - A bitmap meant to be applied to a 3D model on the GPU.

Now lets take a peek under the hood and look at the first of these abstractions, the Render Tree.

<h3 id="render_tree">
	<a href="./#render_tree">Render Tree</a>
</h3>

The Render Tree is made up of nested ***Render Objects*** that have a one to one mapping for every DOM node that needs a visual representation. The Render Object is where the ***paint*** process happens and it's what turns DOM nodes into bitmaps ( software rasterization ) or textures ( GPU rasterization ) that can be rendered to the screen.

These Render Objects are then laid out onto something called a ***Render Layer***.

<h3 id="render_layer">
	<a href="./#render_layer">Render Layer</a>
</h3>

The ***Render Layer*** is where the ***layout*** process occurs and is responsible for grouping Render Objects with the same coordinate space together and ordering them based on their visual properties ( the box model and z-index ) to deal with things like overlapping content, opacity, overflow etc. The Render Layer has a one to many relationship with Render Objects where the associated Render Objects either map directly to a Render Layer or indirectly through its first ancestor.

> As a side note the priority given to visual properties is based off of the Box Model specification which you can find <a href="https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/core/rendering/RenderBoxModelObject.h" target="_blank">here.</a>

The final and most interesting layer is called the ***Graphics Layer***, the main focus throughout the rest of this article.

<h3 id="graphics_layer">
	<a href="./#graphics_layer">Graphics Layer Tree</a>
</h3>

The Graphics Layer is important because it is what ultimately gets uploaded to the GPU as a texture.

The Graphic Layer Trees relationship with Render Layers is similar to the Render Layer Trees relationship with Render Objects and will map directly or indirectly to a Render Layer depending on if that layer has any of the following properties and can be accelerated by the GPU.

- A 3D perspective transform CSS property.
- A ```<video>``` element using accelerated video decoding.
- A ```<canvas>``` element with a 3D context or accelerated 2D context.
- A composited plug-in ( i.e.flash ).
- A CSS animation for its opacity or an animated Webkit transform.
- An accelerated CSS filter.
- A child that is directly mapped to a Graphics Layer.
- A sibling with a lower z-index and a direct mapping to a Graphics Layer ( or the layer overlaps a composited layer and should render on top of it ).

> You can find a full list of these properties in the Chromium source code <a href="https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/Source/platform/graphics/CompositingReasons.h&q=file:CompositingReasons&type=cs&sq=package:chromium" target="_blank">here.</a>

The Graphics Layer Tree is then used to create a bitmap ( or texture ) that is ultimately render as pixels onto the screen.

> It is also useful to know that the browser **squashes** visually overlapping Render Layers that have associated Graphic Layer's mapped to them into a single Graphics Layer to improve performance since too many Graphics Layer's would be a waste of resources and can cause jank.

<h3 id="bringing_it_all_together">
	<a href="./#bringing_it_all_together">Bringing It All Together</a>
</h3>

Now that we have covered some of the fundamental data structures the browser uses to render a page, lets review.

We have covered four different layer trees and what they are used for.

- ***The DOM Tree :*** which represents the fundamental layout of nodes and their relationship with each other.
- ***The Render Object Tree :*** which has a 1:1 mapping to DOM nodes and is responsible for painting its associated node.
- ***The Render Layer Tree :*** which has a one to many relationship with Render Objects based on their visual layout and z-index order.
- ***The Graphics Layer Tree :*** which has a one to many relationship with Render Layers and represents the Render Layers that will be uploaded to the GPU as textures.

Now that we know all the pieces, lets put them together and see just how the browser goes from a DOM tree to pixels on the screen.

It works like this.

1. First the browser creates the Render Object, Render Layer and Graphics Layer trees respectively.

2. The Render Layer then issues a paint on each of its visually contained Render Objects and lays them out according to their predefined order onto a software bitmap.

3. The browser then takes these bitmaps and uploads them on to the GPU as textures.

4. And finally, the browser composites all of these Graphic Layer textures together into a final screen image that results in the final pixels on the screen.

Now the first time a browsers renders a frame it can't help but go through all four steps. But after the first frame has been rendered it can optimize and only repaint a few layers instead of all and in some cases skip painting all together and perform transforms directly on the associated Graphics Layer that needs to be updated.

This optimization is whats going to get us our 60 fps animations that we are looking for. But in order to get there we have to understand something known as the Compositor.

<h2 id="part_2">
	<a href="./#part_2">Part 2</a>
</h2>

<h3 id="the_compositor">
	<a href="./#the_compositor">The Compositor</a>
</h3>

The Compositor is where the magic happens, but in order understand it we need to get a few more definitions out of the way.

***Rasterization :*** The phase of rendering where the Render Layer paints and lays out its associated Render Objects onto a bitmap.

***Painting :*** The process of setting up a Graphic Layers bitmaps or textures for rasterization. ( bitmaps for software rasterization and textures for hardware rasterization ).

***Drawing :*** The process of combining Graphic Layer bitmaps or textures together into a final screen image.

got it? Great, lets take a closer look at what exactly the Compositor is and how it's used.

The Compositor is the software that manages the Graphics Layer Tree and controls the browsers frame life cycle. The Compositor is special in that it has access to the GPU and runs on its own dedicated thread called the ***compositor thread*** which gives it the freedom to update its Graphics Layer Tree and render frames independently from the main thread.

To do this both the compositor thread and the main thread share copies of the Graphic Layer tree. In order to keep the two in sync the Compositor sends and receives Graphic Layer tree changes and updates through something know as a ***commit*** which is handled by the Compositors ***scheduler***. 

> Note that the commit operation is a blocking operation.

The Compositor will receive updates to its Graphic Layer tree when any of those layers become ***invalidated*** which simply means that the layer has changed and needs to be updated. It then draws those new changes to the screen and replaces the old Graphic Layer tree with the new Graphic Layer tree in a process called ***activation***.

> During this activation process the content on the screen will be outdated, but sometimes there might bo no content at all. In this case the browser will render a checkerboard pattern as a placeholder until the new Graphic Layer tree has been activated and drawn to the screen.

Now there are three different types of these invalidations that can occur.

The first one is called a ***layout invalidation***. This occurs when an elements structure changes ( CSS position, z-index etc. ) or the layout of Render Objects change causing the associated Render Layers to be recalculated and uploaded to the compositor.

The next invalidation is called a ***paint invalidation*** where one or more Render Objects need to be repainted and uploaded to the compositor.

The last is called a ***composite invalidation*** where we can head straight to the Compositor itself to transform the invalidated Graphic Layer directly. And because the Compositor runs on its own thread, it has full control of the Graphic Layer tree and can render new frames independently. This means that composite invalidations don't ever touch the main thread which in turns frees it up to run JavaScript or anything else it has currently queued. It is ***this*** architecture that makes composite invalidations so much faster than its paint and layout counterparts.

This architecture also gives the browser the ability to route input events ( like scrolls ) straight to the compositor and works on a number of different properties like CSS animations and CSS filters ( we will learn more about this later in this article ).

This is what makes those hardware accelerated animations so sexy. But before we dive into examples there is one more important optimization the browser takes before it renders those textures to the screen.

<h3 id="tiling">
	<a href="./#tiling">Tiling</a>
</h3>

Now rasterizing a whole Graphic Layer in its entirety would be a waste of both time ( CPU paints ) and memory ( RAM for bitmaps and VRAM for textures ). Instead the compositor uses a method called ***tiling*** in which the compositor rasterizes these layers on a per tile basis. The tiles are then given a priority order and are sent to the GPU accordingly.

> If you're curious about the priority order tiles are given, check out the <a href="https://docs.google.com/a/chromium.org/document/d/1tkwOlSlXiR320dFufuA_M-RF9L5LxFWmZFg5oW35rZk" target="_blank">Tile Priority Design Doc</a>

These tiles are then turned into bitmaps and uploaded to the GPU as textures. Once all the tiles in a layer have been uploaded, drawing that layer is simply a matter of drawing each of its tiles.

Now all the browser has to do to draw a frame to the screen is simply traverse each layer and issue the appropriate GL command to draw that layer into a frame buffer which is then displayed to the screen.

Thats basically all there is to it. The browsers creates the DOM tree, Render Object tree, Render Layer tree and Graphic Layers to represent the different states of a web page ( both visually and structurally ). The browser then utilizes the compositor to render these representations and draw pixels onto a screen.

Lets now take a look at just how we can apply this new found knowledge to create GPU accelerated animations in the wild.

<h2 id="part_3">
	<a href="./#part_3">Part 3</a>
</h2>

<h3 id="straight_to_the_point">
	<a href="./#straight_to_the_point">Straight To The Point</a>
</h3>

Fast and smooth web animations are somewhat of a rarity these days. But with new browser technology it has never been easier, it's simply a matter of knowing how to use the right tools. And I am going to show you how.

To make things easier ( and more fun ), I have created some HTML, CSS and JavaScript that we can use to experiment on throughout the rest of this article. You can download the example material <a href="http://github.com/alex-ray/" target="_blank">here</a>,check it out on Github <a href="http://github.com/alex-ray/gpu-acclerated-color-wheel" target="_blank">here</a> or simply head view it on the web <a href="/demo/gpu_accelerated_color_wheel/" target="_blank">here.</a>

Unzip the file and open up the ```index.html``` file in your Chrome Browser. ( or just open the web page in your browser )

You should see a color wheel bouncing around the screen and a bunch of control in the top left corner of the screen. Don't worry about these just yet all you need to know is that the flood toggle might freeze your browser ( its a infinite loop flooding the main thread ).

With that out of the way lets jump right in and take a look at what kind of animations we got going on here. To do this your going to need to open up you Chrome Developer Tools ( view > Developer > Developer Tools ) and select the ```time line tab```.

Your screen should now look something like this.

<img src="/images/posts/the_web_animations_you_have_always_wanted/timeline-tab.png" >

<!-- Image at /images/timeline-tab.png BOOG: NEEDS COMPRESSION-->

The time line view lets you measure and visualizes the rendering process on a frame by frame basis over a certain amount of time.

We can start recording a time line by clicking on the gray circle in the left hand corner of the developer tools. Press it to start recording, wait a second and press it a second time to stop recording ( it should be red this time ). You will then see a bar graph that looks something similar to this.

<img src="/images/posts/the_web_animations_you_have_always_wanted/timeline-graph.png" >

<!-- Image at /images/timeline-graph.png BOOG: NEEDS COMPRESION -->

Each vertical bar represents A frame and the two horizontal lines represent the 30 and 60 frames per second markers respectively.

Now if you select one of those bars into the view area ( simply click and drag ) you will see a list of render events. The render events represent things like JavaScript timers, garbage collection and paint events among many other things the browser is doing during each frame. The ones we need to worry are the following.

1. ***Recalculate Style :*** ( purple ) Calculates the style of each element.
2. ***Layout :*** ( purple ) Computes the position of each element.
3. ***Paint Setup and Paint :*** ( green ) Creates the bitmap for each element and paints them onto a layer.
4. ***Composite Layers :*** ( green ) Uploads these layers to the GPU and draws them to the screen.

> Note that you will see a huge amount of empty space between the colored rendered events and the top of  the vertical bar. This is time that has been unaccounted for and can not be represented in any meaningful way. For instance this could be time spent in the GPU or CPU that the browsers does not have direct access to.

In the records below the time line you can see exactly how much time these render events are taking ( i.e. stopping that frame from rendering ).

The most obvious way to speed things up and improve our frame rate is to minimize the amount of time each of these render events take. But we're going to go one step further and actually skip some of these render events all together.

To do this we are going to "hardware accelerate" our animation. Go ahead and toggle the "GPU Accelerated" button to on ( it should turn green ) and run your time line profile again and reselect a bar into the view area you should now see something like this.

<img src="/images/posts/the_web_animations_you_have_always_wanted/timeline-accelerated.png" >

<!-- image at /images/timeline-accelerated.png BOOG:NEEDS COMPRESSION  sidenote: make sure that you have selected only on bar in the screen shot-->

Take a look at the records bar, you can see that we now have only one of these render events the ***Composite Layer*** event ( green ) and the ***Layout*** and ***Paint*** events are now gone. 

So whats going on here, what happened ?

In short we switched from using the ```top``` and ```left``` CSS styles to using ```transform: translateX``` and ```transform: translateY``` to update the color wheels position. The difference is that the transform CSS properties can be accelerated by the GPU while the ```top``` and ```left``` styles can not. These accelerated properties are called ***Composite Properties***. 


<h3 id="composite_properties">
	<a href="#composite_properties">Composite Properties</a>
</h3>

Composite properties are special in that they can be routed directly to the GPU and render frames independently of the main thread improving speed dramatically.

Essentially these composite properties boil down to four main CSS styles.

**Position** ```transform: translate( npx, npx );```

**Scale** ```transform: translate( n );```

**Rotation** ```transform: rotate( ndeg );```

**Opacity** ```opacity: 0..1;```

An element with any of these properties will receive something called a composite backing ( or graphic layer ). Meaning that it will be uploaded to the GPU as its own texture. You can see this take effect in the wild by checking the "show composite layer borders" in the developer tools drawer. To get to the tools drawer click on the gray drawer icon ( right arrow bracket symbol overlapping three horizontal bars ) in the top left corner of the chrome developer tools.

Now any CSS transition, animation or opacity property will promote an element to its own composite layer. But you can also manually force an element to receive its own composite layer by using the ```transform: translate( 0 )``` or ```transform: translate3d( 0, 0, 0 )``` properties.

> Be ware promoting elements to receive their own composite backing should be done sparingly as too many of these will cause jank.

Animating any other no-composite property simply will not guarantee you smooth and fast animations.

But if you can't avoid it, the next best option is to use one of the ***Paint Properties***.

<h3 id="paint_properties">
	<a href="./#paint_properties">Paint Properties</a>
</h3>

Animating a paint property won't trigger a layout event, but it will cause the browser to trigger a paint event. 

Some of the most common paint properties are listed below.

* color
* visibility
* text-decoration
* background-position
* outline-color
* outline-style
* outline-width
* background-size
* border-style
* background
* background-image
* background-repeat
* outline
* border-radius
* box-shadow

Be cautious of repaints. Repainting can be expensive, especially on mobile devices where CPU and GPU resources are limited.

<h3 id="layout_properties">
	<a href="./#layout_properties">Layout Properties</a>
</h3>

And last but not least are layout properties. Changing a layout property will trigger a layout event, paint event and composite event. These are not only expensive because they are so much further away from the GPU but because they can also cause a cascade of layout events for ***every*** descendant in that element.

Some of the most popular ones are listed below.

* width
* height
* padding
* margin
* display
* border-width
* border
* position
* float
* overflow-y
* overflow
* font-size
* font-family
* text-align
* font-weight
* left
* top
* right
* bottom
* clear
* min-height
* vertical-align


Nearly every other property not listed here will trigger a layout, paint and composite event.

Lets now take a look at ***how** we go about animating these properties. When it comes down to it, you basically have two choices. You can use either use CSS or JavaScript to animate an elements property. Both have their advantages and disadvantages but ultimately end up achieving the same thing.

If you haven't noticed yet we are using JavaScript to move the color wheel around in our example. In fact for the animation were using JavaScript is the ***only*** way to achieve it. This is the advantage of using JavaScript for our animations, it gives you control over your animations in such a way that you simply cant replicate using CSS alone.

The downside with JavaScript animations is just that, it's JavaScript and it runs on the main thread along side other important process such as paints, layout, garbage collector etc. This increases the chance of exhausting the main thread a skipping a frame ( the last thing we want ).

You can see this in action if you close the developer tools and toggle the flood control to on ( green ). You should see the color wheel stop and go. This is because we are 'flooding' the main thread ( were just console logging a number from 1 to 10000 every 1000 milliseconds ) when this happens the animation completely freezes up.

Lets make things interesting and throw in some CSS animations to show the difference. Go ahead and switch the spin toggle to on ( again it should turn green ). Make sure the developer tools is closed and toggle flood switch to on.

As you can see the color wheel continues to spin even when the main thread is flooded. This is the benefit of CSS animations. With CSS animations it doesn't need the main thread for anything and can head straight to the compositor.

The downside with CSS animations is that they lack the expressive power of JavaScript and can easily get complex and out of hand fast.

And with that I leave you to your own creative to create all the fast, smooth and sexy animations you can think of. ( maybe not ***all*** )

If you have any questions, comments or criticism please give me a shout on twitter <a href="http://twitter.com/_alexray">@_alexray</a> or email <a href="mailto:mail@alexjray.com">mail@alexjray.com</a>
