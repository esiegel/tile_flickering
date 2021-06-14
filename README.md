# TileLayer flickering

<img src="/public/static_circles.png" width="500">

When attempting to render multiple TileLayers on top of one another there is additive color
flickering. My guess is that this is most likely due to a non fixed number of tiles being
rendered over a given pixel.

Looking at the code you will see the GL blending parameters.

```
        parameters: {
          [GL.BLEND]: true,
          [GL.BLEND_DST_RGB]: GL.ONE,
          [GL.BLEND_EQUATION]: GL.FUNC_ADD,
          [GL.BLEND_SRC_RGB]: GL.ONE,
          [GL.DEPTH_TEST]: false,
        },
```

These allow us to blend multiple layers.  By removing these colors we fix the flickering,
but we are left with the question, what is the best way to blend multiple stacked TileLayers.

I have seen in [Viv](https://github.com/hms-dbmi/viv), that they accomplish this by using
some custom shader code. Wondering if this is the way to go

I have tried messing with the onTileLoad and onTileUnload to try and enable/disable
blending per layer based on some rudimentory logic.  This seemed to not work, so for
now it just renders the TileLayers.

You should see the three circles on top of one another.

This demo was created to help with this discussion: https://github.com/visgl/deck.gl/discussions/5862

# How to run

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

Run the below to see the demo:

    yarn start
