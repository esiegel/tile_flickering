import "./App.css";

import { useMemo, useState } from "react";
import {
  BitmapLayer,
  DeckGL,
  COORDINATE_SYSTEM,
  OrthographicView,
  TileLayer,
} from "deck.gl";
import GL from "@luma.gl/constants";
import { ImageLoader } from "@loaders.gl/images";
import { load } from "@loaders.gl/core";

function createTileLayer(path) {
  // hard code image dimensions
  const imageWidth = 8000;
  const imageHeight = 8000;
  const minDzi = 9;
  const maxDzi = 13;

  return new TileLayer({
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    extent: [0, 0, imageWidth, imageHeight],

    getTileData({ x, y, z }) {
      // early return if out of range.
      // TODO: figure out if we can avoid this bad calls
      if (x < 0 || y < 0) {
        // returning null avoids caching bad tile data
        return null;
      }

      const base = process.env.PUBLIC_URL;
      const url = `${base}${path}/${z + maxDzi}/${x}_${y}.png`;
      return load(url, ImageLoader);
    },

    id: `TileLayer-${path}`,
    maxZoom: 0,
    minZoom: minDzi - maxDzi,

    onTileUnload: (tile) => console.log("UNLOAD", tile),
    onTileError: (error) => console.log("ERROR", error),

    renderSubLayers(props) {
      const {
        bbox: { bottom, left, right, top },
      } = props.tile;

      const image = props.data;
      if (image == null) {
        return [];
      }

      // sometimes our tiles are more than 512px?
      const tileWidth = Math.max(512, image.width);
      const tileHeight = Math.max(512, image.height);

      // The left/right/top/bottom values will always be some power of 2.
      // Here we calculate the actual box width/height based on the tile dimension percentages
      const boxWidth = ((right - left) * image.width) / tileWidth;
      const boxHeight = ((bottom - top) * image.height) / tileHeight;

      return new BitmapLayer({
        ...props,
        _imageCoordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        bounds: [left, top + boxHeight, left + boxWidth, top],
        data: null,
        image,
        parameters: {
          [GL.BLEND]: true,
          [GL.BLEND_DST_RGB]: GL.ONE,
          [GL.BLEND_EQUATION]: GL.FUNC_ADD,
          [GL.BLEND_SRC_RGB]: GL.ONE,
          [GL.DEPTH_TEST]: false,
        },
      });
    },

    tileSize: 512,
  });
}

function App() {
  const [viewState, setViewState] = useState({
    target: [4000, 4000],
    zoom: -4,
  });
  const GL_OPTIONS = { webgl2: true };

  function onViewStateChange(state: { viewState: ViewState }) {
    console.log(state);
    setViewState(state.viewState);
  }

  const height = 1000;
  const width = 1000;

  const views = useMemo(
    () => [
      new OrthographicView({
        controller: true,
        id: "orth-view",
        rotationDegrees: 0,
        x: 0,
        y: 0,
      }),
    ],
    []
  );

  const layers = [
    createTileLayer("/red_circle/red_circle_files"),
    createTileLayer("/blue_circle/blue_circle_files"),
    createTileLayer("/yellow_circle/yellow_circle_files"),
  ];

  return (
    <div className="App">
      <DeckGL
        glOptions={GL_OPTIONS}
        layers={layers}
        onViewStateChange={onViewStateChange}
        views={views}
        viewState={viewState}
      />
    </div>
  );
}

export default App;
